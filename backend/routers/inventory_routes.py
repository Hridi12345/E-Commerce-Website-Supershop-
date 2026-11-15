from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/inventory", tags=["Inventory & Warehouse Management"])

@router.get("/warehouses")
def get_warehouses(db: Session = Depends(get_db)):
    return db.query(models.Warehouse).all()

@router.post("/warehouses")
def create_warehouse(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin"]))):
    wh = models.Warehouse(
        name=data["name"],
        code=data["code"].upper(),
        address=data.get("address"),
        phone=data.get("phone")
    )
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh

@router.get("/stock-overview")
def get_stock_overview(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    products = db.query(models.Product).all()
    overview = []
    low_stock_alerts = []

    for p in products:
        available = max(0, p.stock_quantity)
        is_low = available <= p.safety_stock_threshold
        item_data = {
            "product_id": p.id,
            "product_name": p.name,
            "sku": p.sku,
            "category": p.category.name if p.category else "General",
            "stock_quantity": p.stock_quantity,
            "safety_stock_threshold": p.safety_stock_threshold,
            "stock_indicator_type": p.stock_indicator_type,
            "is_low_stock": is_low
        }
        overview.append(item_data)
        if is_low:
            low_stock_alerts.append(item_data)

    return {
        "total_tracked_products": len(products),
        "low_stock_count": len(low_stock_alerts),
        "low_stock_alerts": low_stock_alerts,
        "items": overview
    }

@router.post("/adjustments")
def create_stock_adjustment(
    data: schemas.StockAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    """
    Manual stock adjustment forms with mandatory reason codes (damage, return, recount, shrinkage)
    and historical audit logs.
    """
    valid_reasons = ["damage", "return", "recount", "shrinkage"]
    if data.reason_code.lower() not in valid_reasons:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid reason code. Mandatory reason codes must be one of: {', '.join(valid_reasons)}"
        )

    prod = db.query(models.Product).filter(models.Product.id == data.product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    old_qty = prod.stock_quantity
    new_qty = data.new_qty
    change_qty = new_qty - old_qty

    prod.stock_quantity = new_qty
    if new_qty <= 0:
        prod.stock_indicator_type = "backorder"
    elif new_qty <= prod.safety_stock_threshold:
        prod.stock_indicator_type = "low_stock"
    else:
        prod.stock_indicator_type = "in_stock"

    adj = models.StockAdjustment(
        warehouse_id=data.warehouse_id,
        product_id=data.product_id,
        variant_id=data.variant_id,
        previous_qty=old_qty,
        new_qty=new_qty,
        change_qty=change_qty,
        reason_code=data.reason_code.lower(),
        notes=data.notes,
        adjusted_by=current_user.name
    )
    db.add(adj)
    db.commit()
    db.refresh(adj)
    return {"message": "Stock adjusted successfully and logged to historical audit log", "adjustment": adj}

@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    logs = db.query(models.StockAdjustment).order_by(desc(models.StockAdjustment.created_at)).limit(100).all()
    results = []
    for l in logs:
        prod = db.query(models.Product).filter(models.Product.id == l.product_id).first()
        results.append({
            "id": l.id,
            "product_name": prod.name if prod else f"ID {l.product_id}",
            "sku": prod.sku if prod else "N/A",
            "previous_qty": l.previous_qty,
            "new_qty": l.new_qty,
            "change_qty": l.change_qty,
            "reason_code": l.reason_code,
            "notes": l.notes,
            "adjusted_by": l.adjusted_by,
            "created_at": str(l.created_at)
        })
    return results

@router.post("/transfers")
def transfer_stock(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    from_wh = data["from_warehouse_id"]
    to_wh = data["to_warehouse_id"]
    prod_id = data["product_id"]
    qty = int(data["quantity"])

    transfer = models.StockTransfer(
        from_warehouse_id=from_wh,
        to_warehouse_id=to_wh,
        product_id=prod_id,
        quantity=qty,
        status="completed"
    )
    db.add(transfer)
    db.commit()
    return {"message": "Warehouse stock transfer logged successfully", "transfer_id": transfer.id}

@router.put("/threshold")
def update_global_stock_threshold(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    """
    Allow administrator to configure global low stock safety threshold (default was 8)
    """
    new_threshold = int(data.get("threshold", 8))
    apply_to_all = bool(data.get("apply_to_all", True))
    
    # Save to Settings
    import json
    setting = db.query(models.Setting).filter(models.Setting.key == "general_settings").first()
    if setting:
        s_data = json.loads(setting.value_json)
        s_data["low_stock_threshold"] = new_threshold
        setting.value_json = json.dumps(s_data)
    else:
        db.add(models.Setting(key="general_settings", value_json=json.dumps({"low_stock_threshold": new_threshold})))
    
    updated_count = 0
    if apply_to_all:
        products = db.query(models.Product).all()
        for p in products:
            p.safety_stock_threshold = new_threshold
            # re-evaluate indicator
            if p.stock_quantity <= 0:
                p.stock_indicator_type = "out_of_stock"
            elif p.stock_quantity <= new_threshold:
                p.stock_indicator_type = "low_stock"
            else:
                p.stock_indicator_type = "in_stock"
        updated_count = len(products)
    
    db.commit()
    return {
        "message": f"Low-stock safety threshold updated to {new_threshold}",
        "threshold": new_threshold,
        "updated_products_count": updated_count
    }

@router.put("/products/{product_id}/threshold")
def update_product_stock_threshold(
    product_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
        
    new_threshold = int(data.get("threshold", 8))
    prod.safety_stock_threshold = new_threshold
    if prod.stock_quantity <= 0:
        prod.stock_indicator_type = "out_of_stock"
    elif prod.stock_quantity <= new_threshold:
        prod.stock_indicator_type = "low_stock"
    else:
        prod.stock_indicator_type = "in_stock"
        
    db.commit()
    return {"message": f"Threshold for '{prod.name}' set to {new_threshold}", "threshold": new_threshold}

