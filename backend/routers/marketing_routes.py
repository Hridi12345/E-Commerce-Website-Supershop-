import json
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/marketing", tags=["Marketing & Promotion Rules"])

# ----------------- COUPONS & DISCOUNT ENGINE -----------------
@router.get("/coupons")
def list_coupons(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    coupons = db.query(models.Coupon).all()
    results = []
    for c in coupons:
        results.append({
            "id": c.id,
            "code": c.code,
            "discount_type": c.discount_type,
            "discount_value": c.discount_value,
            "min_spend": c.min_spend,
            "max_discount": c.max_discount,
            "global_usage_limit": c.global_usage_limit,
            "per_user_usage_limit": c.per_user_usage_limit,
            "times_used": c.times_used,
            "start_date": str(c.start_date) if c.start_date else None,
            "end_date": str(c.end_date) if c.end_date else None,
            "excluded_categories": json.loads(c.excluded_category_ids or "[]"),
            "is_active": c.is_active
        })
    return results

@router.post("/coupons")
def create_coupon(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    code = data["code"].upper().strip()
    existing = db.query(models.Coupon).filter(models.Coupon.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists.")

    c = models.Coupon(
        code=code,
        discount_type=data.get("discount_type", "percentage"),
        discount_value=float(data["discount_value"]),
        min_spend=float(data.get("min_spend", 0.0)),
        max_discount=float(data["max_discount"]) if data.get("max_discount") else None,
        global_usage_limit=int(data.get("global_usage_limit", 1000)),
        per_user_usage_limit=int(data.get("per_user_usage_limit", 1)),
        excluded_category_ids=json.dumps(data.get("excluded_category_ids", [])),
        is_active=bool(data.get("is_active", True))
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"message": "Coupon created successfully", "coupon": c}

@router.delete("/coupons/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    c = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Coupon not found")
    db.delete(c)
    db.commit()
    return {"message": "Coupon deleted successfully"}

@router.post("/coupons/validate")
def validate_coupon(data: schemas.CouponValidateRequest, db: Session = Depends(get_db)):
    """
    Validate coupon code against min spend thresholds, usage limits, and category exclusions.
    """
    code = data.code.upper().strip()
    coupon = db.query(models.Coupon).filter(models.Coupon.code == code, models.Coupon.is_active == True).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code or coupon is no longer active.")

    if coupon.times_used >= coupon.global_usage_limit:
        raise HTTPException(status_code=400, detail="Coupon usage limit has been reached.")

    if data.cart_total < coupon.min_spend:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum spend threshold of ৳{coupon.min_spend:.2f} not reached. (Current total: ৳{data.cart_total:.2f})"
        )

    # Calculate discount
    discount = 0.0
    if coupon.discount_type == "percentage":
        discount = (data.cart_total * coupon.discount_value) / 100.0
        if coupon.max_discount and discount > coupon.max_discount:
            discount = coupon.max_discount
    else:
        discount = min(coupon.discount_value, data.cart_total)

    return {
        "valid": True,
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "calculated_discount": round(discount, 2),
        "message": f"Coupon '{coupon.code}' applied! You save ৳{discount:.2f}"
    }

# ----------------- FLASH SALES & VISUAL BANNER SCHEDULER -----------------
@router.get("/flash-sales")
def get_flash_sales(db: Session = Depends(get_db)):
    sales = db.query(models.FlashSale).filter(models.FlashSale.is_active == True).all()
    results = []
    for s in sales:
        results.append({
            "id": s.id,
            "title": s.title,
            "start_time": str(s.start_time),
            "end_time": str(s.end_time),
            "banner_url": s.banner_url,
            "discount_percentage": s.discount_percentage,
            "is_active": s.is_active
        })
    return results

@router.post("/flash-sales")
def create_flash_sale(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin"]))):
    import datetime
    start = datetime.datetime.fromisoformat(data["start_time"].replace("Z", "+00:00")) if "start_time" in data else datetime.datetime.utcnow()
    end = datetime.datetime.fromisoformat(data["end_time"].replace("Z", "+00:00")) if "end_time" in data else datetime.datetime.utcnow() + datetime.timedelta(days=3)

    sale = models.FlashSale(
        title=data["title"],
        start_time=start,
        end_time=end,
        banner_url=data.get("banner_url"),
        discount_percentage=float(data.get("discount_percentage", 20.0)),
        is_active=bool(data.get("is_active", True))
    )
    db.add(sale)
    db.commit()
    return {"message": "Flash sale scheduled successfully", "id": sale.id}

@router.get("/banners")
def get_banners(position: Optional[str] = None, active_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.Banner)
    if position:
        query = query.filter(models.Banner.position == position)
    if active_only:
        now = datetime.datetime.utcnow()
        query = query.filter(models.Banner.is_active == True)
        query = query.filter(or_(models.Banner.start_date.is_(None), models.Banner.start_date <= now))
        query = query.filter(or_(models.Banner.end_date.is_(None), models.Banner.end_date >= now))
    return query.order_by(models.Banner.display_order.asc(), models.Banner.id.desc()).all()

@router.get("/banners/{banner_id}")
def get_single_banner(banner_id: int, db: Session = Depends(get_db)):
    b = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banner not found")
    return b

@router.put("/banners/{banner_id}/status")
@router.patch("/banners/{banner_id}/status")
def toggle_banner_status(
    banner_id: int,
    data: dict = {},
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    b = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banner not found")
    if "is_active" in data:
        b.is_active = bool(data["is_active"])
    else:
        b.is_active = not b.is_active
    db.commit()
    db.refresh(b)
    return {"message": f"Banner status updated to {'Active' if b.is_active else 'Inactive'}", "is_active": b.is_active, "id": b.id, "banner": b}

@router.post("/banners")
def create_banner(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    b = models.Banner(
        title=data["title"],
        subtitle=data.get("subtitle"),
        image_url=data["image_url"],
        link_url=data.get("link_url", "/products"),
        position=data.get("position", "hero_slider"),
        display_order=int(data.get("display_order", 0)),
        is_active=bool(data.get("is_active", True))
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return b

@router.put("/banners/{banner_id}")
def update_banner(banner_id: int, data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    b = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    for field in ["title", "subtitle", "image_url", "link_url", "position", "display_order", "is_active"]:
        if field in data:
            setattr(b, field, data[field])
    
    db.commit()
    db.refresh(b)
    return {"message": "Banner updated successfully", "banner": b}

@router.delete("/banners/{banner_id}")
def delete_banner(banner_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    b = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banner not found")
    db.delete(b)
    db.commit()
    return {"message": "Banner deleted successfully"}

