import json
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/auth", tags=["Authentication & Identity"])

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

# ----------------- CUSTOMER AUTHENTICATION -----------------
@router.post("/register", response_model=schemas.TokenResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    hashed = auth.get_password_hash(user_in.password)
    user = models.User(
        name=user_in.name.strip(),
        email=user_in.email.strip().lower(),
        hashed_password=hashed,
        role="customer",  # Customer registration always creates customer role for safety
        phone=user_in.phone.strip() if user_in.phone else None,
        segment_tag="Regular"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=schemas.TokenResponse)
@router.post("/customer/login", response_model=schemas.TokenResponse)
def customer_login(login_data: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    email = login_data.email.strip().lower()
    ip_addr = get_client_ip(request)

    # Brute-force lockout check
    auth.check_login_lockout(email, "customer", db)

    alt_email = email.replace("@supershop.com", "@sushop.com") if "@supershop.com" in email else email.replace("@sushop.com", "@supershop.com")
    user = db.query(models.User).filter(
        (models.User.email == email) | (models.User.email == alt_email)
    ).first()

    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        auth.record_login_attempt(email, "customer", False, ip_addr, db)
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.is_active:
        auth.record_login_attempt(email, "customer", False, ip_addr, db)
        raise HTTPException(status_code=403, detail="Your account has been deactivated.")

    # Successful login: record and clear lockout
    auth.record_login_attempt(email, "customer", True, ip_addr, db)
    token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

# ----------------- ADMIN PORTAL AUTHENTICATION -----------------
@router.post("/admin/login")
def admin_login(login_data: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    """
    Dedicated Administrator Login Endpoint:
    - Enforces brute-force lockout protection.
    - Strictly denies customer accounts from accessing administrative portal.
    - Emits an AdminAuditLog entry on successful administrative authentication.
    - Returns role and permissions matrix.
    """
    email = login_data.email.strip().lower()
    ip_addr = get_client_ip(request)

    # Check brute-force lockout for admin portal
    auth.check_login_lockout(email, "admin", db)

    alt_email = email.replace("@supershop.com", "@sushop.com") if "@supershop.com" in email else email.replace("@sushop.com", "@supershop.com")
    user = db.query(models.User).filter(
        (models.User.email == email) | (models.User.email == alt_email)
    ).first()

    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        auth.record_login_attempt(email, "admin", False, ip_addr, db)
        raise HTTPException(status_code=401, detail="Invalid administrator credentials.")

    if not user.is_active:
        auth.record_login_attempt(email, "admin", False, ip_addr, db)
        raise HTTPException(status_code=403, detail="Administrator account is deactivated.")

    # Critical Security Check: Ensure caller has an administrative role
    if user.role not in auth.ADMIN_ROLES:
        auth.record_login_attempt(email, "admin", False, ip_addr, db)
        raise HTTPException(
            status_code=403,
            detail="Access Forbidden: Customer credentials cannot be used to access the Administrator Portal."
        )

    # Successful admin login
    auth.record_login_attempt(email, "admin", True, ip_addr, db)
    token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    permissions = auth.ROLE_PERMISSIONS.get(user.role, [])

    # Record Admin Audit Log
    auth.record_admin_audit(
        admin=user,
        action="admin_login",
        target_type="auth",
        target_id=str(user.id),
        details=f"Admin signed in from IP {ip_addr}",
        ip_address=ip_addr,
        db=db
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "phone": user.phone
        },
        "role": user.role,
        "permissions": permissions
    }

# ----------------- SESSION REVOCATION & PROFILE -----------------
@router.post("/logout")
def logout(
    token: Optional[str] = Depends(auth.oauth2_scheme),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Session invalidation & token revocation"""
    if token:
        rev = models.RevokedToken(
            token_str=token,
            revoked_at=datetime.utcnow()
        )
        db.add(rev)
        db.commit()
    return {"message": "Session successfully invalidated."}

@router.post("/refresh")
def refresh_token(current_user: models.User = Depends(auth.get_current_user)):
    """Issue refreshed access token for active session"""
    new_token = auth.create_access_token({"sub": str(current_user.id), "role": current_user.role})
    return {"access_token": new_token, "token_type": "bearer", "user": current_user}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.get("/permissions")
def get_caller_permissions(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "permissions": auth.ROLE_PERMISSIONS.get(current_user.role, [])
    }

@router.put("/profile")
def update_profile(data: dict, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if "name" in data and data["name"]:
        current_user.name = data["name"].strip()
    if "phone" in data:
        current_user.phone = data["phone"].strip() if data["phone"] else None
    if "address" in data:
        current_user.address = data["address"].strip() if data["address"] else None
    if "password" in data and data["password"]:
        current_user.hashed_password = auth.get_password_hash(data["password"])
    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated successfully", "user": current_user}

@router.get("/gdpr-export")
def export_gdpr_data(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """GDPR / CCPA customer data export workflow"""
    orders = db.query(models.Order).filter(models.Order.user_id == current_user.id).all()
    addresses = db.query(models.Address).filter(models.Address.user_id == current_user.id).all()
    reviews = db.query(models.Review).filter(models.Review.user_id == current_user.id).all()
    
    export_payload = {
        "user_profile": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "phone": current_user.phone,
            "role": current_user.role,
            "registered_at": str(current_user.created_at)
        },
        "saved_addresses": [
            {
                "type": a.address_type,
                "full_name": a.full_name,
                "phone": a.phone,
                "street": a.street,
                "city": a.city,
                "country": a.country
            } for a in addresses
        ],
        "order_history": [
            {
                "order_number": o.order_number,
                "date": str(o.created_at),
                "total": o.total_amount,
                "status": o.status,
                "payment_method": o.payment_method
            } for o in orders
        ],
        "submitted_reviews": [
            {
                "product_id": r.product_id,
                "rating": r.rating,
                "title": r.title,
                "comment": r.comment,
                "date": str(r.created_at)
            } for r in reviews
        ]
    }
    return {"gdpr_export": export_payload, "exported_at": str(current_user.created_at)}

@router.delete("/gdpr-delete")
def delete_gdpr_account(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """GDPR Right to Be Forgotten deletion workflow"""
    db.query(models.Order).filter(models.Order.user_id == current_user.id).update({
        "customer_name": "Deleted Customer (GDPR)",
        "customer_email": "anonymized@deleted.gdpr",
        "customer_phone": "0000000000",
        "shipping_address_json": "{}",
        "billing_address_json": "{}"
    })
    db.delete(current_user)
    db.commit()
    return {"message": "Your account and personal data have been completely deleted according to GDPR/CCPA regulations."}
