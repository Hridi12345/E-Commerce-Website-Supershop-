import bcrypt
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Role definitions & Permissions Matrix
ADMIN_ROLES = ["super_admin", "admin", "product_manager", "order_manager", "customer_support", "operator"]

ROLE_PERMISSIONS = {
    "super_admin": [
        "all", "manage_admins", "manage_settings", "financial_reports",
        "manage_products", "manage_categories", "manage_brands",
        "manage_orders", "process_orders", "manage_inventory",
        "manage_customers", "manage_marketing", "view_unmasked_pii"
    ],
    "admin": [
        "all", "manage_admins", "manage_settings", "financial_reports",
        "manage_products", "manage_categories", "manage_brands",
        "manage_orders", "process_orders", "manage_inventory",
        "manage_customers", "manage_marketing", "view_unmasked_pii"
    ],
    "product_manager": [
        "manage_products", "manage_categories", "manage_brands",
        "manage_inventory", "manage_marketing", "view_catalog_analytics"
    ],
    "order_manager": [
        "manage_orders", "process_orders", "manage_shipping",
        "view_inventory", "print_dispatch"
    ],
    "customer_support": [
        "view_orders", "manage_customers", "view_tickets",
        "reply_tickets", "masked_pii_only"
    ],
    "operator": [
        "process_orders", "view_inventory", "print_dispatch", "masked_pii_only"
    ],
    "customer": [
        "browse_catalog", "place_orders", "customer_portal"
    ]
}

MAX_FAILED_LOGIN_ATTEMPTS = 5
LOCKOUT_WINDOW_MINUTES = 15

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))
    except Exception:
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def is_token_revoked(token: str, db: Session) -> bool:
    rev = db.query(models.RevokedToken).filter(models.RevokedToken.token_str == token).first()
    return rev is not None

def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[models.User]:
    if not token:
        return None
    if is_token_revoked(token, db):
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    return user

def get_current_user(user: Optional[models.User] = Depends(get_current_user_optional)) -> models.User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided, expired, or have been revoked.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(user: models.User = Depends(get_current_user)):
        user_roles = [user.role]
        if user.role in ["super_admin", "admin"]:
            user_roles.extend(["admin", "super_admin"])
        
        has_role = any(r in allowed_roles for r in user_roles)
        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)} (current: {user.role})"
            )
        return user
    return role_checker

def require_permission(permission: str):
    def perm_checker(user: models.User = Depends(get_current_user)):
        user_perms = ROLE_PERMISSIONS.get(user.role, [])
        if "all" in user_perms or permission in user_perms:
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Missing required permission: '{permission}'"
        )
    return perm_checker

def mask_pii(text: Optional[str], role: str) -> Optional[str]:
    """Requirement: Data masking on sensitive customer PII for lower-level operator/support roles"""
    if not text:
        return text
    if role in ["super_admin", "admin", "customer"]:
        return text
    # Mask phone, email, address for customer_support and operator
    if "@" in text:
        parts = text.split("@")
        name = parts[0]
        masked = name[:2] + "***" + ("@" + parts[1] if len(parts) > 1 else "")
        return masked
    elif len(text) >= 7 and text.replace("-", "").replace("+", "").isdigit():
        return text[:4] + "****" + text[-3:]
    elif len(text) > 6:
        return text[:4] + "**** [Masked]"
    return "****"

def check_login_lockout(identifier: str, portal_type: str, db: Session):
    cutoff = datetime.utcnow() - timedelta(minutes=LOCKOUT_WINDOW_MINUTES)
    recent_failures = db.query(models.LoginAttempt).filter(
        models.LoginAttempt.identifier == identifier,
        models.LoginAttempt.portal_type == portal_type,
        models.LoginAttempt.is_success == False,
        models.LoginAttempt.attempt_time >= cutoff
    ).count()

    if recent_failures >= MAX_FAILED_LOGIN_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Access temporarily locked due to {recent_failures} consecutive failed login attempts. Please wait {LOCKOUT_WINDOW_MINUTES} minutes before trying again."
        )

def record_login_attempt(identifier: str, portal_type: str, is_success: bool, ip_address: Optional[str], db: Session):
    attempt = models.LoginAttempt(
        identifier=identifier,
        portal_type=portal_type,
        is_success=is_success,
        ip_address=ip_address,
        attempt_time=datetime.utcnow()
    )
    db.add(attempt)
    if is_success:
        # Clear past failures upon successful login
        cutoff = datetime.utcnow() - timedelta(minutes=LOCKOUT_WINDOW_MINUTES)
        db.query(models.LoginAttempt).filter(
            models.LoginAttempt.identifier == identifier,
            models.LoginAttempt.portal_type == portal_type,
            models.LoginAttempt.is_success == False,
            models.LoginAttempt.attempt_time >= cutoff
        ).delete()
    db.commit()

def record_admin_audit(
    admin: models.User,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    db: Session = None
):
    if not db:
        return
    log = models.AdminAuditLog(
        admin_id=admin.id,
        admin_name=admin.name,
        admin_role=admin.role,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id else None,
        details=details,
        ip_address=ip_address,
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()
