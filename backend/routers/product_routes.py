import json
import csv
import io
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc, case
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/products", tags=["Product Information Management (PIM)"])

# ----------------- CATEGORIES -----------------
@router.get("/categories")
def get_categories(flat: bool = False, db: Session = Depends(get_db)):
    cats = db.query(models.Category).all()
    if flat:
        return [
            {
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "parent_id": c.parent_id,
                "parent_name": c.parent.name if c.parent else None,
                "icon": c.icon,
                "description": c.description,
                "image_url": c.image_url,
                "is_active": c.is_active,
                "products_count": len(c.products)
            }
            for c in cats
        ]
    
    # Active-only hierarchical category tree for storefront
    active_cats = [c for c in cats if c.is_active]
    cat_map = {c.id: {
        "id": c.id, "name": c.name, "slug": c.slug, "parent_id": c.parent_id,
        "icon": c.icon, "description": c.description, "image_url": c.image_url,
        "children": []
    } for c in active_cats}
    
    tree = []
    for c in active_cats:
        if c.parent_id and c.parent_id in cat_map:
            cat_map[c.parent_id]["children"].append(cat_map[c.id])
        else:
            tree.append(cat_map[c.id])
    return tree

@router.post("/categories")
def create_category(cat: schemas.CategorySchema, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    existing = db.query(models.Category).filter(models.Category.slug == cat.slug).first()
    if existing:
        cat.slug = f"{cat.slug}-{int(datetime.datetime.utcnow().timestamp())}"

    new_cat = models.Category(
        name=cat.name,
        slug=cat.slug,
        parent_id=cat.parent_id,
        icon=cat.icon or "shopping-bag",
        description=cat.description,
        image_url=cat.image_url,
        is_active=cat.is_active if cat.is_active is not None else True
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.put("/categories/{category_id}")
def update_category(category_id: int, data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if "name" in data and data["name"]:
        cat.name = data["name"].strip()
    if "slug" in data and data["slug"]:
        new_slug = data["slug"].strip().lower()
        conflict = db.query(models.Category).filter(models.Category.slug == new_slug, models.Category.id != category_id).first()
        if not conflict:
            cat.slug = new_slug
    if "parent_id" in data:
        cat.parent_id = data["parent_id"] if data["parent_id"] else None
    if "icon" in data:
        cat.icon = data["icon"] or "shopping-bag"
    if "description" in data:
        cat.description = data["description"]
    if "image_url" in data:
        cat.image_url = data["image_url"]
    if "is_active" in data:
        cat.is_active = bool(data["is_active"])
    
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    products = db.query(models.Product).filter(models.Product.category_id == category_id).all()
    fallback_cat = db.query(models.Category).filter(models.Category.id != category_id).first()
    for p in products:
        p.category_id = fallback_cat.id if fallback_cat else None
    
    subcats = db.query(models.Category).filter(models.Category.parent_id == category_id).all()
    for sc in subcats:
        sc.parent_id = None
        
    db.delete(cat)
    db.commit()
    return {"message": f"Category '{cat.name}' deleted successfully", "reassigned_products_count": len(products)}

# ----------------- BRANDS -----------------
@router.get("/brands")
def get_brands(db: Session = Depends(get_db)):
    brands = db.query(models.Brand).all()
    return [
        {
            "id": b.id,
            "name": b.name,
            "slug": b.slug,
            "logo_url": b.logo_url,
            "description": b.description,
            "products_count": len(b.products)
        }
        for b in brands
    ]

@router.post("/brands")
def create_brand(brand: schemas.BrandSchema, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    existing = db.query(models.Brand).filter(models.Brand.slug == brand.slug).first()
    if existing:
        brand.slug = f"{brand.slug}-{int(datetime.datetime.utcnow().timestamp())}"

    new_b = models.Brand(
        name=brand.name,
        slug=brand.slug,
        logo_url=brand.logo_url,
        description=brand.description
    )
    db.add(new_b)
    db.commit()
    db.refresh(new_b)
    return new_b

@router.put("/brands/{brand_id}")
def update_brand(brand_id: int, data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    brand = db.query(models.Brand).filter(models.Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    if "name" in data and data["name"]:
        brand.name = data["name"].strip()
    if "slug" in data and data["slug"]:
        brand.slug = data["slug"].strip().lower()
    if "logo_url" in data:
        brand.logo_url = data["logo_url"]
    if "description" in data:
        brand.description = data["description"]
        
    db.commit()
    db.refresh(brand)
    return brand

@router.delete("/brands/{brand_id}")
def delete_brand(brand_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    brand = db.query(models.Brand).filter(models.Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    products = db.query(models.Product).filter(models.Product.brand_id == brand_id).all()
    fallback_brand = db.query(models.Brand).filter(models.Brand.id != brand_id).first()
    for p in products:
        p.brand_id = fallback_brand.id if fallback_brand else None
        
    db.delete(brand)
    db.commit()
    return {"message": f"Brand '{brand.name}' deleted successfully"}

# ----------------- ATTRIBUTES & VARIANT MATRIX GENERATOR -----------------
@router.get("/attributes")
def get_attributes(db: Session = Depends(get_db)):
    attrs = db.query(models.Attribute).all()
    return [{"id": a.id, "name": a.name, "values": json.loads(a.values_json or "[]")} for a in attrs]

@router.post("/attributes")
def create_attribute(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    new_attr = models.Attribute(
        name=data["name"],
        values_json=json.dumps(data.get("values", []))
    )
    db.add(new_attr)
    db.commit()
    db.refresh(new_attr)
    return {"id": new_attr.id, "name": new_attr.name, "values": json.loads(new_attr.values_json)}

@router.post("/generate-variant-matrix")
def generate_variant_matrix(data: dict, current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    """
    Parent-child SKU generator based on variable attributes (e.g. Size x Color).
    Input: { base_sku: "DOR-RICE", attributes: {"Weight": ["1kg", "5kg"], "Brand Tier": ["Premium", "Standard"]} }
    Output: Matrix of generated child SKUs and attribute combinations.
    """
    base_sku = data.get("base_sku", "SKU").upper().strip()
    attr_dict = data.get("attributes", {})
    if not attr_dict:
        return {"variants": []}
    
    import itertools
    keys = list(attr_dict.keys())
    value_lists = [attr_dict[k] for k in keys]
    combinations = list(itertools.product(*value_lists))
    
    generated_variants = []
    for combo in combinations:
        combo_map = {keys[i]: combo[i] for i in range(len(keys))}
        suffix = "-".join([str(val).upper().replace(" ", "") for val in combo])
        variant_sku = f"{base_sku}-{suffix}"
        generated_variants.append({
            "sku": variant_sku,
            "barcode": f"890{abs(hash(variant_sku)) % 1000000000:09d}",
            "attributes": combo_map,
            "price_override": None,
            "cost_price_override": None,
            "stock_quantity": 25
        })
    return {"base_sku": base_sku, "total_combinations": len(generated_variants), "variants": generated_variants}

# ----------------- STOREFRONT PLP & CATALOG -----------------
@router.get("")
@router.get("/")
def list_products(
    category_id: Optional[int] = None,
    brand_id: Optional[int] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    in_stock_only: Optional[bool] = False,
    is_featured: Optional[bool] = None,
    is_flash_sale: Optional[bool] = None,
    color: Optional[str] = None,
    size: Optional[str] = None,
    sort_by: Optional[str] = Query("popularity"),
    page: int = 1,
    limit: int = 12,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product).filter(models.Product.is_active == True)
    
    if category_id:
        # Include subcategories
        sub_cat_ids = [c.id for c in db.query(models.Category.id).filter(models.Category.parent_id == category_id).all()]
        cat_ids = [category_id] + sub_cat_ids
        query = query.filter(models.Product.category_id.in_(cat_ids))
    if brand_id:
        query = query.filter(models.Product.brand_id == brand_id)
    if search:
        query = query.filter(or_(
            models.Product.name.ilike(f"%{search}%"),
            models.Product.sku.ilike(f"%{search}%"),
            models.Product.short_description.ilike(f"%{search}%")
        ))
    # Customer purchase price: sale price if discounted, otherwise base price
    effective_price = case(
        (
            and_(
                models.Product.sale_price.isnot(None),
                models.Product.sale_price > 0,
                models.Product.sale_price < models.Product.base_price
            ),
            models.Product.sale_price
        ),
        else_=models.Product.base_price
    )

    if min_price is not None:
        query = query.filter(effective_price >= min_price)
    if max_price is not None:
        query = query.filter(effective_price <= max_price)
    if min_rating is not None:
        query = query.filter(models.Product.rating_avg >= min_rating)
    if in_stock_only:
        query = query.filter(models.Product.stock_quantity > 0)
    if is_featured is not None:
        query = query.filter(models.Product.is_featured == is_featured)
    if is_flash_sale is not None:
        query = query.filter(models.Product.is_flash_sale == is_flash_sale)

    # Sorting based on actual customer purchase price
    if sort_by == "newest":
        query = query.order_by(desc(models.Product.created_at))
    elif sort_by == "price_asc":
        query = query.order_by(asc(effective_price))
    elif sort_by == "price_desc":
        query = query.order_by(desc(effective_price))
    elif sort_by == "best_rating":
        query = query.order_by(desc(models.Product.rating_avg))
    else:  # popularity
        query = query.order_by(desc(models.Product.reviews_count), desc(models.Product.is_featured))

    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()

    # Format products with variant info
    results = []
    for p in items:
        imgs = json.loads(p.images or "[]")
        results.append({
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "sku": p.sku,
            "category_id": p.category_id,
            "category_name": p.category.name if p.category else None,
            "brand_id": p.brand_id,
            "brand_name": p.brand.name if p.brand else None,
            "base_price": p.base_price,
            "sale_price": p.sale_price,
            "cost_price": p.cost_price,
            "stock_quantity": p.stock_quantity,
            "stock_indicator_type": p.stock_indicator_type,
            "is_featured": p.is_featured,
            "is_flash_sale": p.is_flash_sale,
            "flash_sale_discount_pct": p.flash_sale_discount_pct,
            "rating_avg": p.rating_avg,
            "reviews_count": p.reviews_count,
            "images": imgs,
            "thumbnail": imgs[0] if imgs else None,
            "variants_count": len(p.variants)
        })

    return {
        "items": results,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit else 1
    }

# ----------------- PRODUCT DETAIL PAGE (PDP) -----------------
@router.get("/{id_or_slug}")
def get_product_detail(id_or_slug: str, db: Session = Depends(get_db)):
    if id_or_slug.isdigit():
        p = db.query(models.Product).filter(models.Product.id == int(id_or_slug)).first()
    else:
        p = db.query(models.Product).filter(models.Product.slug == id_or_slug).first()
    
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Cross-sell & upsell product lookups
    cross_sell_ids = json.loads(p.cross_sell_ids or "[]")
    upsell_ids = json.loads(p.upsell_ids or "[]")

    cross_sells = []
    if cross_sell_ids:
        c_items = db.query(models.Product).filter(models.Product.id.in_(cross_sell_ids)).all()
        for ci in c_items:
            c_imgs = json.loads(ci.images or "[]")
            cross_sells.append({
                "id": ci.id, "name": ci.name, "slug": ci.slug, "base_price": ci.base_price,
                "sale_price": ci.sale_price, "image": c_imgs[0] if c_imgs else None
            })

    upsells = []
    if upsell_ids:
        u_items = db.query(models.Product).filter(models.Product.id.in_(upsell_ids)).all()
        for ui in u_items:
            u_imgs = json.loads(ui.images or "[]")
            upsells.append({
                "id": ui.id, "name": ui.name, "slug": ui.slug, "base_price": ui.base_price,
                "sale_price": ui.sale_price, "image": u_imgs[0] if u_imgs else None
            })

    # Variants formatting
    variants = []
    for v in p.variants:
        variants.append({
            "id": v.id,
            "sku": v.sku,
            "barcode": v.barcode,
            "attributes": json.loads(v.attributes_json or "{}"),
            "price_override": v.price_override,
            "stock_quantity": v.stock_quantity,
            "reserved_quantity": v.reserved_quantity,
            "available_quantity": max(0, v.stock_quantity - v.reserved_quantity),
            "image_url": v.image_url
        })

    # Reviews and Q&A
    reviews = []
    for r in p.reviews:
        reviews.append({
            "id": r.id,
            "customer_name": r.customer_name,
            "rating": r.rating,
            "title": r.title,
            "comment": r.comment,
            "media_urls": json.loads(r.media_urls or "[]"),
            "verified_purchase": r.verified_purchase,
            "created_at": str(r.created_at)
        })

    qas = []
    for q in p.qas:
        qas.append({
            "id": q.id,
            "customer_name": q.customer_name,
            "question": q.question,
            "answer": q.answer,
            "answered_by": q.answered_by,
            "created_at": str(q.created_at)
        })

    return {
        "id": p.id,
        "name": p.name,
        "slug": p.slug,
        "sku": p.sku,
        "barcode": p.barcode,
        "category_id": p.category_id,
        "category_name": p.category.name if p.category else None,
        "brand_id": p.brand_id,
        "brand_name": p.brand.name if p.brand else None,
        "base_price": p.base_price,
        "cost_price": p.cost_price,
        "sale_price": p.sale_price,
        "tiered_b2b_pricing": json.loads(p.tiered_b2b_pricing or "[]"),
        "promo_start": str(p.promo_start) if p.promo_start else None,
        "promo_end": str(p.promo_end) if p.promo_end else None,
        "short_description": p.short_description,
        "description": p.description,
        "technical_specs": json.loads(p.technical_specs or "{}"),
        "images": json.loads(p.images or "[]"),
        "video_url": p.video_url,
        "viewer_360_images": json.loads(p.viewer_360_images or "[]"),
        "downloadable_pdf": p.downloadable_pdf,
        "stock_indicator_type": p.stock_indicator_type,
        "stock_quantity": p.stock_quantity,
        "safety_stock_threshold": p.safety_stock_threshold,
        "is_featured": p.is_featured,
        "is_flash_sale": p.is_flash_sale,
        "flash_sale_discount_pct": p.flash_sale_discount_pct,
        "rating_avg": p.rating_avg,
        "reviews_count": p.reviews_count,
        "variants": variants,
        "cross_sells": cross_sells,
        "upsells": upsells,
        "reviews": reviews,
        "qas": qas
    }

# ----------------- PRODUCT CRUD (ADMIN) -----------------
@router.post("")
def create_product(
    data: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    # Check for SKU uniqueness
    existing = db.query(models.Product).filter(models.Product.sku == data.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"A product with SKU '{data.sku}' already exists.")

    new_prod = models.Product(
        name=data.name,
        slug=data.slug,
        sku=data.sku,
        barcode=data.barcode or f"890{abs(hash(data.sku)) % 1000000000:09d}",
        category_id=data.category_id,
        brand_id=data.brand_id,
        base_price=data.base_price,
        cost_price=data.cost_price,
        sale_price=data.sale_price,
        tiered_b2b_pricing=json.dumps(data.tiered_b2b_pricing or []),
        short_description=data.short_description,
        description=data.description,
        technical_specs=json.dumps(data.technical_specs or {}),
        images=json.dumps(data.images or []),
        video_url=data.video_url,
        viewer_360_images=json.dumps(data.viewer_360_images or []),
        downloadable_pdf=data.downloadable_pdf,
        stock_indicator_type=data.stock_indicator_type or "in_stock",
        stock_quantity=data.stock_quantity or 50,
        safety_stock_threshold=data.safety_stock_threshold or 5,
        is_active=data.is_active if data.is_active is not None else True,
        is_featured=data.is_featured or False,
        is_flash_sale=data.is_flash_sale or False,
        flash_sale_discount_pct=data.flash_sale_discount_pct or 0.0,
        cross_sell_ids=json.dumps(data.cross_sell_ids or []),
        upsell_ids=json.dumps(data.upsell_ids or [])
    )
    db.add(new_prod)
    db.flush()

    # Create variants if provided
    if data.variants:
        for v in data.variants:
            new_v = models.ProductVariant(
                product_id=new_prod.id,
                sku=v.sku,
                barcode=v.barcode or f"890{abs(hash(v.sku)) % 1000000000:09d}",
                attributes_json=json.dumps(v.attributes_json),
                price_override=v.price_override,
                cost_price_override=v.cost_price_override,
                stock_quantity=v.stock_quantity,
                image_url=v.image_url
            )
            db.add(new_v)

    db.commit()
    db.refresh(new_prod)
    return {"message": "Product created successfully", "id": new_prod.id, "sku": new_prod.sku}

@router.put("/{product_id}")
def update_product(
    product_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    for field in ["name", "slug", "sku", "category_id", "brand_id", "base_price", "cost_price",
                  "sale_price", "short_description", "description", "stock_quantity",
                  "stock_indicator_type", "is_featured", "is_flash_sale", "flash_sale_discount_pct"]:
        if field in data:
            setattr(prod, field, data[field])
    
    if "images" in data:
        prod.images = json.dumps(data["images"])
    if "technical_specs" in data:
        prod.technical_specs = json.dumps(data["technical_specs"])
    if "tiered_b2b_pricing" in data:
        prod.tiered_b2b_pricing = json.dumps(data["tiered_b2b_pricing"])

    db.commit()
    db.refresh(prod)
    return {"message": "Product updated successfully", "id": prod.id}

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(prod)
    db.commit()
    return {"message": "Product deleted successfully"}

# ----------------- REVIEWS & Q&A -----------------
@router.post("/{product_id}/reviews")
def add_review(
    product_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    name = current_user.name if current_user else data.get("customer_name", "Shopper")
    new_rev = models.Review(
        product_id=product_id,
        user_id=current_user.id if current_user else None,
        customer_name=name,
        rating=int(data.get("rating", 5)),
        title=data.get("title", ""),
        comment=data.get("comment", ""),
        media_urls=json.dumps(data.get("media_urls", [])),
        verified_purchase=bool(current_user is not None)
    )
    db.add(new_rev)
    db.flush()

    # Recalculate average rating
    all_revs = db.query(models.Review).filter(models.Review.product_id == product_id).all()
    prod.reviews_count = len(all_revs)
    prod.rating_avg = round(sum(r.rating for r in all_revs) / len(all_revs), 1)

    db.commit()
    return {"message": "Review added successfully", "rating_avg": prod.rating_avg, "reviews_count": prod.reviews_count}

@router.post("/{product_id}/qas")
def ask_question(
    product_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    name = current_user.name if current_user else data.get("customer_name", "Shopper")
    qa = models.ProductQA(
        product_id=product_id,
        user_id=current_user.id if current_user else None,
        customer_name=name,
        question=data.get("question", "")
    )
    db.add(qa)
    db.commit()
    return {"message": "Question submitted successfully", "id": qa.id}

@router.put("/qas/{qa_id}/answer")
def answer_question(
    qa_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    qa = db.query(models.ProductQA).filter(models.ProductQA.id == qa_id).first()
    if not qa:
        raise HTTPException(status_code=404, detail="Question not found")
    qa.answer = data.get("answer", "")
    qa.answered_by = current_user.name
    db.commit()
    return {"message": "Question answered successfully"}

# ----------------- BULK CATALOG IMPORT & EXPORT PIPELINES -----------------
@router.get("/export/csv")
def export_catalog_csv(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    products = db.query(models.Product).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["SKU", "Name", "Category", "Brand", "Base Price", "Cost Price", "Sale Price", "Stock Quantity", "Images"])

    for p in products:
        imgs = json.loads(p.images or "[]")
        writer.writerow([
            p.sku,
            p.name,
            p.category.name if p.category else "",
            p.brand.name if p.brand else "",
            p.base_price,
            p.cost_price,
            p.sale_price or "",
            p.stock_quantity,
            ";".join(imgs)
        ])
    output.seek(0)
    return {"csv_content": output.getvalue(), "filename": "sushop_catalog_export.csv"}

@router.post("/import/validate")
def validate_catalog_import(data: dict, current_user: models.User = Depends(auth.require_role(["admin", "operator"])), db: Session = Depends(get_db)):
    """
    Bulk Catalog Pre-validation Pipeline:
    Flags SKU collisions, missing attributes, or invalid image URLs before commit.
    """
    rows = data.get("rows", [])
    validation_results = {
        "total_rows": len(rows),
        "valid_rows": 0,
        "errors": [],
        "warnings": []
    }

    existing_skus = set(sku[0] for sku in db.query(models.Product.sku).all())
    incoming_skus = set()

    for idx, row in enumerate(rows, start=1):
        row_errors = []
        sku = str(row.get("sku", "")).strip()
        name = str(row.get("name", "")).strip()
        price = row.get("base_price")
        image_url = str(row.get("image_url", "")).strip()

        if not sku:
            row_errors.append("Missing SKU attribute")
        elif sku in existing_skus:
            row_errors.append(f"SKU collision: '{sku}' already exists in database")
        elif sku in incoming_skus:
            row_errors.append(f"Duplicate SKU '{sku}' found within incoming dataset")
        else:
            incoming_skus.add(sku)

        if not name:
            row_errors.append("Missing product Name")

        try:
            p_val = float(price)
            if p_val < 0:
                row_errors.append("Negative base price")
        except (ValueError, TypeError):
            row_errors.append("Invalid or missing base_price numeric value")

        if image_url and not (image_url.startswith("http://") or image_url.startswith("https://") or image_url.startswith("/uploads/")):
            validation_results["warnings"].append(f"Row {idx} ({sku}): image URL '{image_url}' may be invalid or relative")

        if row_errors:
            validation_results["errors"].append({
                "row_index": idx,
                "sku": sku or "N/A",
                "issues": row_errors
            })
        else:
            validation_results["valid_rows"] += 1

    validation_results["can_commit"] = (len(validation_results["errors"]) == 0)
    return validation_results

@router.post("/import/commit")
def commit_catalog_import(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin"]))):
    rows = data.get("rows", [])
    committed = 0
    for row in rows:
        sku = str(row.get("sku", "")).strip()
        if not sku or db.query(models.Product).filter(models.Product.sku == sku).first():
            continue
        p = models.Product(
            name=row.get("name", "Imported Item"),
            slug=row.get("name", "item").lower().replace(" ", "-") + f"-{sku.lower()}",
            sku=sku,
            base_price=float(row.get("base_price", 100)),
            cost_price=float(row.get("cost_price", 70)),
            sale_price=float(row.get("sale_price")) if row.get("sale_price") else None,
            stock_quantity=int(row.get("stock_quantity", 50)),
            images=json.dumps([row.get("image_url")] if row.get("image_url") else [])
        )
        db.add(p)
        committed += 1
    db.commit()
    return {"message": f"Successfully imported and committed {committed} products to catalog."}
