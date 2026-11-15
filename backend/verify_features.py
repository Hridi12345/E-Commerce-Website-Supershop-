import asyncio
import httpx
import sys
import uuid

BASE_URL = "http://127.0.0.1:8000"

async def test_all():
    print("=" * 70)
    print("  RUNNING COMPREHENSIVE FUNCTIONAL & SECURITY VERIFICATION SUITE")
    print("=" * 70)

    results = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Test 1: Public product browsing without authentication
        r = await client.get(f"{BASE_URL}/api/products?limit=5")
        passed = (r.status_code == 200 and isinstance(r.json(), dict) and "items" in r.json())
        results.append(("Public Product Browsing (No Login)", passed, f"Status: {r.status_code}"))
        print(f"[{'PASS' if passed else 'FAIL'}] Public Product Browsing: {r.status_code}")

        # Test 2: Customer Login on /api/auth/login
        r = await client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@supershop.com",
            "password": "customer123"
        })
        cust_token = r.json().get("access_token") if r.status_code == 200 else None
        user_role = r.json().get("user", {}).get("role") if r.status_code == 200 else None
        passed = (r.status_code == 200 and cust_token is not None and user_role == "customer")
        results.append(("Customer Login Endpoint", passed, f"Status: {r.status_code}, Role: {user_role}"))
        print(f"[{'PASS' if passed else 'FAIL'}] Customer Login: {r.status_code}, Role: {user_role}")

        # Test 3: Customer trying to login to Admin Portal /api/auth/admin/login
        r = await client.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": "customer@supershop.com",
            "password": "customer123"
        })
        passed = (r.status_code == 403)
        results.append(("Customer Blocked from Admin Login (403)", passed, f"Status: {r.status_code}"))
        print(f"[{'PASS' if passed else 'FAIL'}] Customer Blocked from Admin Login: {r.status_code} (Expected 403)")

        # Test 4: Administrator Login on /api/auth/admin/login
        r = await client.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": "admin@supershop.com",
            "password": "admin123"
        })
        admin_token = r.json().get("access_token") if r.status_code == 200 else None
        admin_role = r.json().get("role") if r.status_code == 200 else None
        passed = (r.status_code == 200 and admin_token is not None and admin_role in ["super_admin", "admin"])
        results.append(("Administrator Login to Admin Portal", passed, f"Status: {r.status_code}, Role: {admin_role}"))
        print(f"[{'PASS' if passed else 'FAIL'}] Administrator Login: {r.status_code}, Role: {admin_role}")

        # Test 5: Brute-Force Rate Limiting (5 failures triggers 429)
        locked_out = False
        fake_email = "lockout_test_victim_2@supershop.com"
        for i in range(6):
            r = await client.post(f"{BASE_URL}/api/auth/login", json={
                "email": fake_email,
                "password": "WrongPassword999!"
            })
            if r.status_code == 429:
                locked_out = True
                break
        results.append(("Brute-force Account Lockout (429)", locked_out, f"Locked out triggered: {locked_out}"))
        print(f"[{'PASS' if locked_out else 'FAIL'}] Brute-force Account Lockout (429): {locked_out}")

        # Test 6: Session Revocation / Invalidation on Logout
        r_temp = await client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@supershop.com",
            "password": "customer123"
        })
        temp_token = r_temp.json().get("access_token")
        
        # Verify token works
        r_pre = await client.get(f"{BASE_URL}/api/customers/portal/orders", headers={"Authorization": f"Bearer {temp_token}"})
        works_pre = (r_pre.status_code == 200)

        # Logout / Revoke
        r_logout = await client.post(f"{BASE_URL}/api/auth/logout", headers={"Authorization": f"Bearer {temp_token}"})
        logout_ok = (r_logout.status_code == 200)

        # Try to use revoked token
        r_post = await client.get(f"{BASE_URL}/api/customers/portal/orders", headers={"Authorization": f"Bearer {temp_token}"})
        revoked_blocked = (r_post.status_code in [401, 403])

        passed = works_pre and logout_ok and revoked_blocked
        results.append(("Session Revocation on Logout", passed, f"Works pre: {works_pre}, Logout: {logout_ok}, Blocked post: {revoked_blocked}"))
        print(f"[{'PASS' if passed else 'FAIL'}] Session Revocation on Logout: Token blocked after logout ({r_post.status_code})")

        # Test 7: Customer Order Privacy Protection
        # Fetch an actual active product to get real name and sku
        r_prods = await client.get(f"{BASE_URL}/api/products?limit=1")
        prod = r_prods.json()["items"][0]
        
        # Customer A placing order
        order_payload = {
            "customer_name": "Test Customer A",
            "customer_phone": "+8801700111222",
            "customer_email": "customer@supershop.com",
            "shipping_address": {"full_name": "Customer A", "phone": "+8801700111222", "street": "Banani Road 11", "city": "Dhaka"},
            "billing_address": {"full_name": "Customer A", "phone": "+8801700111222", "street": "Banani Road 11", "city": "Dhaka"},
            "payment_method": "cod",
            "items": [{
                "product_id": prod["id"],
                "unit_price": prod["sale_price"] or prod["base_price"],
                "quantity": 1,
                "product_name": prod["name"],
                "sku": prod["sku"]
            }]
        }
        r_ord = await client.post(f"{BASE_URL}/api/orders/checkout", json=order_payload, headers={"Authorization": f"Bearer {cust_token}"})
        if r_ord.status_code == 200:
            order_number = r_ord.json().get("order_number")
            # Customer A accesses own order
            r_own = await client.get(f"{BASE_URL}/api/orders/{order_number}", headers={"Authorization": f"Bearer {cust_token}"})
            own_ok = (r_own.status_code == 200)

            # Customer B registers and logs in with fresh unique email
            b_email = f"customer_b_{uuid.uuid4().hex[:6]}@supershop.com"
            r_b_reg = await client.post(f"{BASE_URL}/api/auth/register", json={
                "name": "Customer B Snooper",
                "email": b_email,
                "password": "Password123!",
                "phone": "+8801900000000"
            })
            b_token = r_b_reg.json().get("access_token") if r_b_reg.status_code == 200 else None
            if not b_token:
                r_b_log = await client.post(f"{BASE_URL}/api/auth/login", json={
                    "email": b_email,
                    "password": "Password123!"
                })
                b_token = r_b_log.json().get("access_token")

            # Customer B attempts to access Customer A's order
            r_snoop = await client.get(f"{BASE_URL}/api/orders/{order_number}", headers={"Authorization": f"Bearer {b_token}"})
            snoop_forbidden = (r_snoop.status_code == 403)

            # Staff admin attempts to access Customer A's order
            r_admin_ord = await client.get(f"{BASE_URL}/api/orders/{order_number}", headers={"Authorization": f"Bearer {admin_token}"})
            admin_allowed = (r_admin_ord.status_code == 200)

            privacy_passed = own_ok and snoop_forbidden and admin_allowed
            results.append(("Customer Order Privacy (403 for other customers)", privacy_passed, f"Own: {r_own.status_code}, Snoop: {r_snoop.status_code}, Admin: {r_admin_ord.status_code}"))
            print(f"[{'PASS' if privacy_passed else 'FAIL'}] Customer Order Privacy: Own({r_own.status_code}) SnoopBlocked({r_snoop.status_code}) AdminAllowed({r_admin_ord.status_code})")
        else:
            print(f"[FAIL] Order checkout failed: {r_ord.status_code} {r_ord.text}")
            results.append(("Customer Order Creation", False, f"Status: {r_ord.status_code}"))

        # Test 8: Admin User Creation & Audit Logging
        admin_create_payload = {
            "name": "Audit Verification Staff",
            "email": f"audit_staff_{int(asyncio.get_event_loop().time())}@supershop.com",
            "password": "StaffPassword123!",
            "phone": "+8801811223344",
            "role": "order_manager"
        }
        r_create_staff = await client.post(f"{BASE_URL}/api/settings/admin-users", json=admin_create_payload, headers={"Authorization": f"Bearer {admin_token}"})
        staff_created = (r_create_staff.status_code in [200, 201])

        # Verify audit log recorded
        r_audit = await client.get(f"{BASE_URL}/api/settings/audit-logs?limit=10", headers={"Authorization": f"Bearer {admin_token}"})
        audit_logs = r_audit.json() if isinstance(r_audit.json(), list) else r_audit.json().get("logs", [])
        action_found = any("CREATE_ADMIN_USER" in log.get("action", "") or "order_manager" in log.get("details", "") for log in audit_logs)

        audit_passed = staff_created and action_found
        results.append(("Admin Staff Creation & Audit Logging", audit_passed, f"Created: {staff_created}, Audit Log Found: {action_found}"))
        print(f"[{'PASS' if audit_passed else 'FAIL'}] Admin Staff Creation & Audit Logging: {audit_passed}")

        # Test 9: RBAC Role Matrix Listing
        r_roles = await client.get(f"{BASE_URL}/api/settings/roles-permissions", headers={"Authorization": f"Bearer {admin_token}"})
        roles_list = r_roles.json() if isinstance(r_roles.json(), list) else r_roles.json().get("roles", [])
        roles_ok = (r_roles.status_code == 200 and len(roles_list) >= 4)
        results.append(("RBAC Role Matrix Endpoint", roles_ok, f"Status: {r_roles.status_code}, Roles: {len(roles_list)}"))
        print(f"[{'PASS' if roles_ok else 'FAIL'}] RBAC Role Matrix Endpoint: {roles_ok}")

    print("\n" + "=" * 70)
    print("  VERIFICATION SUMMARY")
    print("=" * 70)
    total_passed = sum(1 for _, p, _ in results if p)
    for name, p, det in results:
        status_str = "PASS" if p else "FAIL"
        print(f"  [{status_str}] {name:<48} | {det}")
    print(f"\nTotal: {total_passed}/{len(results)} tests passed.")

    if total_passed == len(results):
        print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("SOME VERIFICATIONS FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_all())
