import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, auth

router = APIRouter(prefix="/api/settings", tags=["Settings, Payment, Shipping & Roles"])

DEFAULT_STORE_SETTINGS = {
    "store_name": "SuShop Supershop",
    "store_tagline": "Fresh Groceries & Everyday Essentials Delivered in Minutes",
    "logo_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=120",
    "support_phone": "+880 9610-SUSHOP",
    "support_email": "support@sushop.com",
    "business_address": "House 45, Road 11, Block H, Banani, Dhaka-1213",
    "trade_license": "TRAD/DSCC/019284/2026",
    
    # Currency & Regional
    "currency_symbol": "৳",
    "currency_code": "BDT",
    "timezone": "Asia/Dhaka",
    
    # Tax Configuration
    "tax_rate_percentage": 5.0,
    "tax_display_mode": "included",  # included / excluded
    
    # Shipping & Delivery
    "free_shipping_threshold": 1000.0,
    "standard_shipping_charge": 60.0,
    "express_shipping_charge": 120.0,
    "express_delivery_eta": "60 - 120 Mins",
    "standard_delivery_eta": "Same Day (Within 6 Hours)",
    
    # Return & Refund Policies
    "return_window_days": 7,
    "restock_on_refund": True,
    
    # Store Operating Status
    "store_status": "open",  # open, maintenance, closed
    "maintenance_notice": "We are briefly updating our catalog. We will be back online shortly!",
    "low_stock_threshold": 10
}

@router.get("/general")
def get_general_settings(db: Session = Depends(get_db)):
    setting = db.query(models.Setting).filter(models.Setting.key == "store_settings").first()
    if setting:
        try:
            data = json.loads(setting.value_json)
            # Merge with defaults
            merged = {**DEFAULT_STORE_SETTINGS, **data}
            return merged
        except Exception:
            return DEFAULT_STORE_SETTINGS
    else:
        # Save default settings
        new_set = models.Setting(key="store_settings", value_json=json.dumps(DEFAULT_STORE_SETTINGS))
        db.add(new_set)
        db.commit()
        return DEFAULT_STORE_SETTINGS

@router.put("/general")
def update_general_settings(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    setting = db.query(models.Setting).filter(models.Setting.key == "store_settings").first()
    current_settings = {}
    if setting:
        try:
            current_settings = json.loads(setting.value_json)
        except Exception:
            current_settings = dict(DEFAULT_STORE_SETTINGS)
    else:
        setting = models.Setting(key="store_settings", value_json="{}")
        db.add(setting)

    # Update with new values
    current_settings.update(data)
    setting.value_json = json.dumps(current_settings)

    # If low_stock_threshold changed, keep inventory threshold aligned
    if "low_stock_threshold" in data:
        new_threshold = int(data["low_stock_threshold"])
        gen_set = db.query(models.Setting).filter(models.Setting.key == "general_settings").first()
        if gen_set:
            try:
                gdata = json.loads(gen_set.value_json)
                gdata["low_stock_threshold"] = new_threshold
                gen_set.value_json = json.dumps(gdata)
            except Exception:
                pass

    db.commit()
    return {"message": "Store configuration successfully saved to database", "settings": current_settings}

@router.get("/users")
def get_system_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["super_admin", "admin"]))):
    users = db.query(models.User).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "phone": u.phone, "segment_tag": u.segment_tag, "is_active": u.is_active} for u in users]

@router.get("/admin-users")
def get_admin_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["super_admin", "admin"]))):
    """List staff and administrators only"""
    admins = db.query(models.User).filter(models.User.role.in_(auth.ADMIN_ROLES)).all()
    return [{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "phone": u.phone,
        "is_active": u.is_active,
        "created_at": str(u.created_at) if u.created_at else None,
        "permissions": auth.ROLE_PERMISSIONS.get(u.role, [])
    } for u in admins]

@router.post("/admin-users")
def create_admin_user(payload: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["super_admin", "admin"]))):
    """Super Admin creates an administrative staff member"""
    name = payload.get("name", "").strip()
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "").strip()
    role = payload.get("role", "operator")
    phone = payload.get("phone", "").strip()

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")

    if role not in auth.ADMIN_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid admin role. Must be one of: {', '.join(auth.ADMIN_ROLES)}")

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    new_admin = models.User(
        name=name,
        email=email,
        hashed_password=auth.get_password_hash(password),
        role=role,
        phone=phone or None,
        is_active=True
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    auth.record_admin_audit(
        admin=current_user,
        action="create_admin_account",
        target_type="user",
        target_id=str(new_admin.id),
        details=f"Created administrator {new_admin.name} ({new_admin.email}) with role '{role}'",
        db=db
    )

    return {"message": f"Administrator '{new_admin.name}' created successfully", "admin_user": {
        "id": new_admin.id,
        "name": new_admin.name,
        "email": new_admin.email,
        "role": new_admin.role
    }}

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, payload: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["super_admin", "admin"]))):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_role = payload.get("role")
    valid_roles = ["super_admin", "admin", "product_manager", "order_manager", "customer_support", "operator", "customer"]
    if new_role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role specified. Must be one of: {', '.join(valid_roles)}")
    
    old_role = user.role
    user.role = new_role
    db.commit()

    auth.record_admin_audit(
        admin=current_user,
        action="update_user_role",
        target_type="user",
        target_id=str(user.id),
        details=f"Updated role for {user.name} ({user.email}) from '{old_role}' to '{new_role}'",
        db=db
    )

    return {"message": f"User {user.name} role updated to {new_role}", "role": new_role}

@router.delete("/admin-users/{user_id}")
def delete_admin_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["super_admin", "admin"]))):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own administrative account.")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Administrator not found")
    
    admin_name = user.name
    admin_email = user.email
    db.delete(user)
    db.commit()

    auth.record_admin_audit(
        admin=current_user,
        action="delete_admin_account",
        target_type="user",
        target_id=str(user_id),
        details=f"Deleted administrative account {admin_name} ({admin_email})",
        db=db
    )

    return {"message": f"Administrator account '{admin_name}' deleted successfully."}

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["super_admin", "admin"]))
):
    """Retrieve security audit logs for administrative operations"""
    query = db.query(models.AdminAuditLog)
    if action:
        query = query.filter(models.AdminAuditLog.action == action)
    logs = query.order_by(models.AdminAuditLog.created_at.desc()).limit(limit).all()
    return [{
        "id": l.id,
        "admin_name": l.admin_name,
        "admin_role": l.admin_role,
        "action": l.action,
        "target_type": l.target_type,
        "target_id": l.target_id,
        "details": l.details,
        "ip_address": l.ip_address,
        "created_at": str(l.created_at) if l.created_at else None
    } for l in logs]

@router.get("/payment-methods")
def get_payment_methods(db: Session = Depends(get_db)):
    setting = db.query(models.Setting).filter(models.Setting.key == "payment_methods").first()
    if setting:
        try:
            return json.loads(setting.value_json)
        except Exception:
            pass

    default_methods = [
        {
            "id": "cod",
            "name": "Cash on Delivery (COD)",
            "description": "Pay with cash or POS card upon delivery at your doorstep.",
            "is_enabled": True,
            "badge": "Popular",
            "fee_rate": 0.0
        },
        {
            "id": "bkash",
            "name": "bKash Mobile Wallet",
            "description": "Instant payment via bKash gateway with 10% cashback promo.",
            "is_enabled": True,
            "badge": "Cashback",
            "fee_rate": 1.5
        },
        {
            "id": "nagad",
            "name": "Nagad Digital Wallet",
            "description": "Secure contactless payment via Bangladesh Post Office Nagad.",
            "is_enabled": True,
            "badge": "Zero Fee",
            "fee_rate": 1.2
        },
        {
            "id": "card",
            "name": "Credit / Debit Cards",
            "description": "Visa, MasterCard, American Express, UnionPay (SSLCommerz integration).",
            "is_enabled": True,
            "badge": "Instant",
            "fee_rate": 2.5
        },
        {
            "id": "bnpl",
            "name": "Buy Now Pay Later (BNPL)",
            "description": "Split in 3 equal monthly installments with 0% interest.",
            "is_enabled": True,
            "badge": "0% Interest",
            "fee_rate": 3.0
        }
    ]
    return default_methods

@router.put("/payment-methods")
def update_payment_methods(
    data: list,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    setting = db.query(models.Setting).filter(models.Setting.key == "payment_methods").first()
    if not setting:
        setting = models.Setting(key="payment_methods", value_json=json.dumps(data))
        db.add(setting)
    else:
        setting.value_json = json.dumps(data)
    db.commit()
    return {"message": "Payment gateway configurations updated", "payment_methods": data}

@router.get("/shipping-zones")
def get_shipping_zones(db: Session = Depends(get_db)):
    setting = db.query(models.Setting).filter(models.Setting.key == "shipping_zones").first()
    if setting:
        try:
            return json.loads(setting.value_json)
        except Exception:
            pass

    default_zones = [
        {
            "zone_id": 1,
            "zone_name": "Dhaka Metro - Express 2-Hour",
            "coverage": "Banani, Gulshan, Dhanmondi, Uttara, Mirpur, Motijheel",
            "delivery_charge": 60.0,
            "estimated_delivery": "60 - 120 Mins",
            "courier": "SuShop Express Fleet",
            "is_active": True
        },
        {
            "zone_id": 2,
            "zone_name": "Dhaka Suburbs (Gazipur, Savar, Narayanganj)",
            "coverage": "Greater Dhaka surrounding districts",
            "delivery_charge": 90.0,
            "estimated_delivery": "Same Day (Within 6 Hours)",
            "courier": "Pathao / Steadfast Courier",
            "is_active": True
        },
        {
            "zone_id": 3,
            "zone_name": "All Bangladesh Divisional Metros",
            "coverage": "Chattogram, Sylhet, Rajshahi, Khulna, Barishal, Rangpur",
            "delivery_charge": 120.0,
            "estimated_delivery": "24 - 48 Hours",
            "courier": "Steadfast Courier / eCourier",
            "is_active": True
        }
    ]
    return default_zones

@router.put("/shipping-zones")
def update_shipping_zones(
    data: list,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    setting = db.query(models.Setting).filter(models.Setting.key == "shipping_zones").first()
    if not setting:
        setting = models.Setting(key="shipping_zones", value_json=json.dumps(data))
        db.add(setting)
    else:
        setting.value_json = json.dumps(data)
    db.commit()
    return {"message": "Shipping zone configurations saved to database", "shipping_zones": data}

@router.get("/roles-permissions")
def get_roles_permissions(current_user: models.User = Depends(auth.require_role(["super_admin", "admin"]))):
    return [
        {
            "role": "super_admin",
            "title": "Super Administrator",
            "description": "Unrestricted administrative privileges across all modules, settings, user permissions, and financials.",
            "permissions": auth.ROLE_PERMISSIONS.get("super_admin", [])
        },
        {
            "role": "admin",
            "title": "Administrator",
            "description": "Full administrative control over store operations, catalog, orders, and reports.",
            "permissions": auth.ROLE_PERMISSIONS.get("admin", [])
        },
        {
            "role": "product_manager",
            "title": "Product Manager",
            "description": "Manages product catalog, PIM variant matrix, categories, brands, inventory thresholds, and marketing banners.",
            "permissions": auth.ROLE_PERMISSIONS.get("product_manager", [])
        },
        {
            "role": "order_manager",
            "title": "Order Manager",
            "description": "Manages order fulfillment lifecycle, status transitions, batch shipping labels, and shipping zones.",
            "permissions": auth.ROLE_PERMISSIONS.get("order_manager", [])
        },
        {
            "role": "customer_support",
            "title": "Customer Support Agent",
            "description": "Manages customer CRM, handles support tickets, order lookup with data masking on customer PII.",
            "permissions": auth.ROLE_PERMISSIONS.get("customer_support", [])
        },
        {
            "role": "operator",
            "title": "Operations & Fulfillment Agent",
            "description": "Processes packing/picking, views inventory stock, and generates dispatch documents.",
            "permissions": auth.ROLE_PERMISSIONS.get("operator", [])
        },
        {
            "role": "customer",
            "title": "Storefront Shopper",
            "description": "End customer storefront browsing, cart, checkout, and personal account dashboard.",
            "permissions": auth.ROLE_PERMISSIONS.get("customer", [])
        }
    ]
