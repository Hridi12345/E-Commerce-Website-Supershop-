import os
import uuid
import json
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc
from database import get_db
import models, schemas, auth
from config import UPLOAD_DIR
from PIL import Image

router = APIRouter(prefix="/api/content", tags=["Content Management & Institutional Pages"])

# ----------------- INSTITUTIONAL & LEGAL PAGES -----------------
@router.get("/pages")
def get_pages(db: Session = Depends(get_db)):
    return db.query(models.ContentPage).filter(models.ContentPage.is_published == True).all()

@router.get("/pages/{slug}")
def get_page_by_slug(slug: str, db: Session = Depends(get_db)):
    page = db.query(models.ContentPage).filter(models.ContentPage.slug == slug).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.post("/pages")
def upsert_page(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    slug = data["slug"].strip().lower()
    page = db.query(models.ContentPage).filter(models.ContentPage.slug == slug).first()
    if page:
        page.title = data.get("title", page.title)
        page.content = data.get("content", page.content)
        page.meta_title = data.get("meta_title", page.meta_title)
        page.meta_description = data.get("meta_description", page.meta_description)
        page.is_published = data.get("is_published", page.is_published)
    else:
        page = models.ContentPage(
            slug=slug,
            title=data["title"],
            content=data["content"],
            meta_title=data.get("meta_title"),
            meta_description=data.get("meta_description"),
            is_published=data.get("is_published", True)
        )
        db.add(page)
    db.commit()
    db.refresh(page)
    return {"message": "Content page saved successfully", "page": page}

# ----------------- CORPORATE & STORE LOCATOR -----------------
@router.get("/store-locator")
def get_store_locations():
    """Corporate Store/Warehouse Locator with map pins, addresses, and hours"""
    return [
        {
            "id": 1,
            "name": "SuShop Central Hub & Mega Supermarket",
            "city": "Dhaka",
            "address": "Plot 24, Road 11, Banani, Dhaka-1213",
            "lat": 23.7937,
            "lng": 90.4066,
            "phone": "+880 1711-000001",
            "hours": "7:00 AM - 11:00 PM (Everyday)",
            "services": ["In-Store Shopping", "2-Hour Express Pickup", "Return Drop-off"]
        },
        {
            "id": 2,
            "name": "SuShop Dhanmondi Delivery Hub",
            "city": "Dhaka",
            "address": "House 45, Road 27, Dhanmondi, Dhaka-1209",
            "lat": 23.7509,
            "lng": 90.3756,
            "phone": "+880 1711-000002",
            "hours": "8:00 AM - 10:30 PM (Everyday)",
            "services": ["Express Doorstep Fulfillment", "Order Pickup"]
        },
        {
            "id": 3,
            "name": "SuShop Uttara Logistics Warehouse",
            "city": "Dhaka",
            "address": "Sector 3, Jasimuddin Avenue, Uttara, Dhaka-1230",
            "lat": 23.8728,
            "lng": 90.3984,
            "phone": "+880 1711-000003",
            "hours": "24/7 Operations",
            "services": ["Regional Distribution", "Cold Storage", "B2B Fulfillment"]
        },
        {
            "id": 4,
            "name": "SuShop Chattogram Regional Hub",
            "city": "Chattogram",
            "address": "GEC Circle, Nasirabad, Chattogram-4000",
            "lat": 22.3569,
            "lng": 91.8215,
            "phone": "+880 1711-000004",
            "hours": "8:00 AM - 10:00 PM (Everyday)",
            "services": ["Doorstep Express Delivery", "Customer Support Center"]
        }
    ]

# ----------------- INTERACTIVE FAQ HUB -----------------
@router.get("/faqs")
def get_faq_hub():
    return [
        {
            "category": "Ordering & Delivery",
            "questions": [
                {
                    "q": "How fast is SuShop express delivery?",
                    "a": "For everyday essentials and fresh groceries in Dhaka metropolitan areas, our express doorstep delivery takes between 60 to 120 minutes!"
                },
                {
                    "q": "What is the minimum order for free delivery?",
                    "a": "Orders over ৳1,000 qualify for free standard doorstep delivery. Orders under this amount have a nominal delivery fee of ৳40 to ৳60."
                },
                {
                    "q": "Can I track my courier live?",
                    "a": "Yes! Every dispatched order is assigned a live courier tracking number and real-time link accessible in your Customer Portal."
                }
            ]
        },
        {
            "category": "Payments & Refunds",
            "questions": [
                {
                    "q": "Which payment methods are accepted?",
                    "a": "We accept Cash on Delivery (COD), Mobile Financial Services (bKash, Nagad, Rocket), Visa/Mastercard/Amex debit and credit cards, and BNPL."
                },
                {
                    "q": "How do returns and refunds work?",
                    "a": "If you receive damaged, expired, or incorrect goods, you can submit an RMA return request within 7 days. Refunds are credited instantly or within 3 business days to your original payment method."
                }
            ]
        },
        {
            "category": "Freshness & Product Integrity",
            "questions": [
                {
                    "q": "How do you guarantee fresh produce?",
                    "a": "Our fresh fruits and vegetables are sourced daily from certified organic farms, quality-checked in temperature-controlled warehouses before dispatch."
                }
            ]
        }
    ]

# ----------------- DIGITAL ASSET MANAGEMENT (DAM) -----------------
@router.get("/media")
def list_media(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    return db.query(models.MediaAsset).order_by(models.MediaAsset.created_at.desc()).all()

@router.post("/media/upload")
async def upload_media_asset(
    file: UploadFile = File(...),
    alt_text: str = Form(""),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    """
    DAM: Drag-and-drop media manager with automatic WebP compression,
    thumbnail generation, and alt-text SEO tagging.
    """
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    unique_name = f"asset_{uuid.uuid4().hex[:10]}"
    target_filename = f"{unique_name}.webp"
    thumb_filename = f"{unique_name}_thumb.webp"

    target_path = UPLOAD_DIR / target_filename
    thumb_path = UPLOAD_DIR / thumb_filename

    # Read uploaded bytes
    content = await file.read()
    
    # Process image with Pillow for automatic WebP compression and thumbnail generation
    try:
        import io
        img = Image.open(io.BytesIO(content))
        # Convert RGBA/P to RGB if saving as standard WebP
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img_converted = img.convert("RGBA")
        else:
            img_converted = img.convert("RGB")
        
        # Save compressed WebP
        img_converted.save(target_path, "WEBP", quality=82)

        # Generate thumbnail (150x150)
        img_thumb = img_converted.copy()
        img_thumb.thumbnail((180, 180))
        img_thumb.save(thumb_path, "WEBP", quality=75)
        
        file_size = os.path.getsize(target_path)
    except Exception as e:
        # Fallback if image conversion fails
        with open(target_path, "wb") as f:
            f.write(content)
        file_size = len(content)
        thumb_filename = target_filename

    file_url = f"/uploads/{target_filename}"
    thumb_url = f"/uploads/{thumb_filename}"

    asset = models.MediaAsset(
        filename=target_filename,
        original_name=file.filename,
        file_url=file_url,
        thumbnail_url=thumb_url,
        format="webp",
        size_bytes=file_size,
        alt_text=alt_text or file.filename
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    return {
        "message": "Asset uploaded and compressed to WebP successfully",
        "asset": asset
    }

# ----------------- SEO & META ARCHITECTURE / SITEMAP / JSON-LD -----------------
@router.get("/sitemap.xml")
def generate_sitemap_xml(db: Session = Depends(get_db)):
    products = db.query(models.Product).filter(models.Product.is_active == True).all()
    categories = db.query(models.Category).filter(models.Category.is_active == True).all()
    pages = db.query(models.ContentPage).filter(models.ContentPage.is_published == True).all()

    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url><loc>https://www.sushop.com/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>',
        '  <url><loc>https://www.sushop.com/products</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>'
    ]

    for c in categories:
        xml_lines.append(f'  <url><loc>https://www.sushop.com/category/{c.slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>')
    for p in products:
        xml_lines.append(f'  <url><loc>https://www.sushop.com/product/{p.slug}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>')
    for pg in pages:
        xml_lines.append(f'  <url><loc>https://www.sushop.com/page/{pg.slug}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>')

    xml_lines.append('</urlset>')
    return Response(content="\n".join(xml_lines), media_type="application/xml")

@router.get("/seo/json-ld/{product_slug}")
def get_product_json_ld(product_slug: str, db: Session = Depends(get_db)):
    """
    Requirement: Structured JSON-LD with (Product, AggregateRating, Offer, BreadcrumbList)
    """
    p = db.query(models.Product).filter(models.Product.slug == product_slug).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    imgs = json.loads(p.images or "[]")
    json_ld = {
        "@context": "https://schema.org/",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.sushop.com"},
                    {"@type": "ListItem", "position": 2, "name": p.category.name if p.category else "Products", "item": f"https://www.sushop.com/category/{p.category.slug if p.category else 'all'}"},
                    {"@type": "ListItem", "position": 3, "name": p.name, "item": f"https://www.sushop.com/product/{p.slug}"}
                ]
            },
            {
                "@type": "Product",
                "name": p.name,
                "image": imgs,
                "description": p.short_description or p.name,
                "sku": p.sku,
                "brand": {"@type": "Brand", "name": p.brand.name if p.brand else "SuShop"},
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": str(p.rating_avg),
                    "reviewCount": str(max(1, p.reviews_count))
                },
                "offers": {
                    "@type": "Offer",
                    "url": f"https://www.sushop.com/product/{p.slug}",
                    "priceCurrency": "BDT",
                    "price": str(p.sale_price or p.base_price),
                    "priceValidUntil": "2027-12-31",
                    "itemCondition": "https://schema.org/NewCondition",
                    "availability": "https://schema.org/InStock" if p.stock_quantity > 0 else "https://schema.org/OutOfStock"
                }
            }
        ]
    }
    return json_ld

# ----------------- HERO BANNER MANAGEMENT (CONTENT MODULE) -----------------
@router.get("/banners")
def get_content_banners(
    position: Optional[str] = None,
    active_only: bool = False,
    db: Session = Depends(get_db)
):
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
def get_banner_by_id(banner_id: int, db: Session = Depends(get_db)):
    banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    return banner

@router.post("/banners/upload")
async def upload_banner_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    """
    Direct Banner Image Upload with type validation (JPG, JPEG, PNG, WebP) and size validation (max 5MB).
    """
    filename = file.filename or ""
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    allowed_exts = ["jpg", "jpeg", "png", "webp"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Only JPG, JPEG, PNG, and WebP are allowed."
        )
    
    content = await file.read()
    MAX_SIZE = 5 * 1024 * 1024  # 5 MB
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum allowed limit of 5MB."
        )
    
    if len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail="Empty file uploaded."
        )
    
    try:
        import io
        img = Image.open(io.BytesIO(content))
        unique_name = f"banner_{uuid.uuid4().hex[:10]}"
        target_filename = f"{unique_name}.webp"
        thumb_filename = f"{unique_name}_thumb.webp"
        target_path = UPLOAD_DIR / target_filename
        thumb_path = UPLOAD_DIR / thumb_filename

        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img_converted = img.convert("RGBA")
        else:
            img_converted = img.convert("RGB")
        
        img_converted.save(target_path, "WEBP", quality=85)
        
        img_thumb = img_converted.copy()
        img_thumb.thumbnail((320, 180))
        img_thumb.save(thumb_path, "WEBP", quality=80)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
    
    file_url = f"/uploads/{target_filename}"
    thumb_url = f"/uploads/{thumb_filename}"
    
    # Register in DAM MediaAssets as well
    asset = models.MediaAsset(
        filename=target_filename,
        original_name=file.filename,
        file_url=file_url,
        thumbnail_url=thumb_url,
        format="webp",
        size_bytes=len(content),
        alt_text=f"Banner Image - {filename}"
    )
    db.add(asset)
    db.commit()
    
    return {
        "message": "Banner image uploaded successfully",
        "image_url": file_url,
        "thumbnail_url": thumb_url,
        "filename": target_filename,
        "size_bytes": len(content)
    }

@router.post("/banners")
def create_content_banner(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    title = (data.get("title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Main Heading (title) is required.")
    
    image_url = (data.get("image_url") or "").strip()
    if not image_url:
        raise HTTPException(status_code=400, detail="Banner Image or Image URL is required.")
    
    name = (data.get("name") or title).strip()
    subtitle = data.get("subtitle")
    button_text = (data.get("button_text") or "Shop Now").strip()
    link_url = (data.get("link_url") or "/products").strip()
    position = data.get("position", "hero_slider")
    display_order = int(data.get("display_order", 0))
    is_active = bool(data.get("is_active", True))
    
    start_date = None
    end_date = None
    if data.get("start_date"):
        try:
            start_date = datetime.datetime.fromisoformat(str(data["start_date"]).replace("Z", "+00:00"))
        except Exception:
            pass
    if data.get("end_date"):
        try:
            end_date = datetime.datetime.fromisoformat(str(data["end_date"]).replace("Z", "+00:00"))
        except Exception:
            pass
    
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=400, detail="Start Date cannot be later than End Date.")
    
    banner = models.Banner(
        name=name,
        title=title,
        subtitle=subtitle,
        button_text=button_text,
        image_url=image_url,
        link_url=link_url,
        position=position,
        display_order=display_order,
        is_active=is_active,
        start_date=start_date,
        end_date=end_date
    )
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return banner

@router.put("/banners/{banner_id}")
def update_content_banner(
    banner_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    b = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    if "title" in data:
        title = (data["title"] or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Main Heading cannot be empty.")
        b.title = title
    
    if "image_url" in data:
        img = (data["image_url"] or "").strip()
        if not img:
            raise HTTPException(status_code=400, detail="Banner image cannot be empty.")
        b.image_url = img
    
    for field in ["name", "subtitle", "button_text", "link_url", "position", "display_order", "is_active"]:
        if field in data and data[field] is not None:
            setattr(b, field, data[field])
    
    if "start_date" in data:
        if data["start_date"]:
            try:
                b.start_date = datetime.datetime.fromisoformat(str(data["start_date"]).replace("Z", "+00:00"))
            except Exception:
                pass
        else:
            b.start_date = None
    
    if "end_date" in data:
        if data["end_date"]:
            try:
                b.end_date = datetime.datetime.fromisoformat(str(data["end_date"]).replace("Z", "+00:00"))
            except Exception:
                pass
        else:
            b.end_date = None
    
    if b.start_date and b.end_date and b.start_date > b.end_date:
        raise HTTPException(status_code=400, detail="Start Date cannot be after End Date.")
    
    b.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(b)
    return b

@router.put("/banners/{banner_id}/status")
@router.patch("/banners/{banner_id}/status")
def toggle_content_banner_status(
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
    
    b.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(b)
    return {
        "message": f"Banner '{b.name or b.title}' is now {'Active' if b.is_active else 'Inactive'}",
        "is_active": b.is_active,
        "id": b.id,
        "banner": b
    }

@router.delete("/banners/{banner_id}")
def delete_content_banner(
    banner_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    b = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banner not found")
    db.delete(b)
    db.commit()
    return {"message": "Banner deleted successfully", "id": banner_id}


