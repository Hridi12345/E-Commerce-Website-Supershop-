import pytest
from fastapi.testclient import TestClient
from main import app
import models
from database import SessionLocal

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_list_products_and_filters():
    res = client.get("/api/products")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 5
    
    # Test sort by price
    res_sort = client.get("/api/products?sort_by=price_asc")
    assert res_sort.status_code == 200
    prices = [p["base_price"] for p in res_sort.json()["items"]]
    assert prices == sorted(prices)

def test_product_detail_pdp():
    res = client.get("/api/products/organic-honeycrisp-red-apples")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Organic Honeycrisp Red Apples (Farm Fresh)"
    assert "variants" in data
    assert "cross_sells" in data
    assert "technical_specs" in data
    assert len(data["variants"]) >= 2

def test_coupon_validation():
    # Valid coupon
    res = client.post("/api/marketing/coupons/validate", json={"code": "WELCOME10", "cart_total": 500.0})
    assert res.status_code == 200
    assert res.json()["valid"] is True
    assert res.json()["calculated_discount"] == 50.0

    # Below min spend
    res_below = client.post("/api/marketing/coupons/validate", json={"code": "SUPER50", "cart_total": 200.0})
    assert res_below.status_code == 400

def test_checkout_and_inventory_allocation():
    # Get initial stock of product 2
    res_p = client.get("/api/products/aci-pure-nazirshail-rice")
    assert res_p.status_code == 200
    initial_stock = res_p.json()["stock_quantity"]

    order_payload = {
        "customer_name": "Test Shopper",
        "customer_email": "shopper@test.com",
        "customer_phone": "+8801700000000",
        "shipping_address": {"street": "Test Road", "city": "Dhaka", "country": "Bangladesh"},
        "payment_method": "cod",
        "coupon_code": "WELCOME10",
        "items": [
            {
                "product_id": res_p.json()["id"],
                "quantity": 2,
                "unit_price": 420.0,
                "product_name": res_p.json()["name"],
                "sku": res_p.json()["sku"]
            }
        ],
        "shipping_fee": 60.0
    }
    res_order = client.post("/api/orders/checkout", json=order_payload)
    assert res_order.status_code == 200
    order_data = res_order.json()
    assert "order_number" in order_data
    assert order_data["status"] == "pending"

    # Verify inventory was reserved / allocated
    res_p_after = client.get("/api/products/aci-pure-nazirshail-rice")
    assert res_p_after.json()["stock_quantity"] == initial_stock - 2

def test_deterministic_state_machine():
    # Login as admin
    login_res = client.post("/api/auth/login", json={"email": "admin@sushop.com", "password": "admin123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create a fresh order to test state machine transitions
    res_p = client.get("/api/products/doorbaz-organic-cotton-polo-shirt")
    assert res_p.status_code == 200
    order_payload = {
        "customer_name": "State Machine Tester",
        "customer_email": "sm@tester.com",
        "customer_phone": "+8801711111111",
        "shipping_address": {"street": "SM St", "city": "Dhaka"},
        "payment_method": "cod",
        "items": [{
            "product_id": res_p.json()["id"],
            "quantity": 1,
            "unit_price": 550.0,
            "product_name": res_p.json()["name"],
            "sku": res_p.json()["sku"]
        }]
    }
    order_num = client.post("/api/orders/checkout", json=order_payload).json()["order_number"]

    # Transition: pending -> payment_confirmed (valid)
    t1 = client.post(f"/api/orders/{order_num}/transition", json={"status": "payment_confirmed"}, headers=headers)
    assert t1.status_code == 200

    # Invalid jump transition: payment_confirmed -> delivered (invalid, must go through picking/packed/shipped)
    t_invalid = client.post(f"/api/orders/{order_num}/transition", json={"status": "delivered"}, headers=headers)
    assert t_invalid.status_code == 400

    # Transition: payment_confirmed -> processing_picking (valid)
    t2 = client.post(f"/api/orders/{order_num}/transition", json={"status": "processing_picking"}, headers=headers)
    assert t2.status_code == 200

def test_operator_pii_masking():
    # Login as operator
    op_login = client.post("/api/auth/login", json={"email": "operator@sushop.com", "password": "operator123"})
    op_token = op_login.json()["access_token"]
    op_headers = {"Authorization": f"Bearer {op_token}"}

    res_op = client.get("/api/customers", headers=op_headers)
    assert res_op.status_code == 200
    # Customer phone and email should be masked
    cust = res_op.json()[0]
    assert "***" in cust["email"] or "****" in cust["phone"]

    # Login as admin: unmasked
    admin_login = client.post("/api/auth/login", json={"email": "admin@sushop.com", "password": "admin123"})
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res_admin = client.get("/api/customers", headers=admin_headers)
    assert res_admin.status_code == 200
    admin_cust = res_admin.json()[0]
    assert "@sushop.com" in admin_cust["email"] or "@" in admin_cust["email"]

def test_bulk_catalog_validation():
    admin_login = client.post("/api/auth/login", json={"email": "admin@sushop.com", "password": "admin123"})
    headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # Row 1 has collision with SU-APP-001, Row 2 is missing SKU, Row 3 has negative price
    payload = {
        "rows": [
            {"sku": "SU-APP-001", "name": "Duplicate Item", "base_price": 100},
            {"sku": "", "name": "Missing SKU Item", "base_price": 200},
            {"sku": "NEW-VALID-01", "name": "Negative Price Item", "base_price": -50}
        ]
    }
    val_res = client.post("/api/products/import/validate", json=payload, headers=headers)
    assert val_res.status_code == 200
    data = val_res.json()
    assert data["can_commit"] is False
    assert len(data["errors"]) >= 3

def test_executive_dashboard_and_fulfillment():
    admin_login = client.post("/api/auth/login", json={"email": "admin@sushop.com", "password": "admin123"})
    headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    res_dash = client.get("/api/analytics/dashboard", headers=headers)
    assert res_dash.status_code == 200
    assert "gross_revenue" in res_dash.json()
    assert "orders_by_status" in res_dash.json()

    res_fin = client.get("/api/analytics/financial-reports", headers=headers)
    assert res_fin.status_code == 200
    assert "gross_margin" in res_fin.json()

def test_json_ld_schema():
    res = client.get("/api/content/seo/json-ld/organic-honeycrisp-red-apples")
    assert res.status_code == 200
    graph = res.json()["@graph"]
    types = [node["@type"] for node in graph]
    assert "BreadcrumbList" in types
    assert "Product" in types

