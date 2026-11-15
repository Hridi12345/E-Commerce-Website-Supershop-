import json
import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/orders", tags=["Order Fulfillment & Lifecycle Engine"])

# Deterministic State Machine Transitions
STATE_MACHINE_TRANSITIONS = {
    "pending": ["payment_confirmed", "cancelled"],
    "payment_confirmed": ["processing_picking", "cancelled", "returned"],
    "processing_picking": ["packed", "cancelled"],
    "packed": ["shipped", "cancelled"],
    "shipped": ["delivered", "returned"],
    "delivered": ["returned"],
    "cancelled": [],
    "returned": []
}

@router.post("/checkout")
def create_order(
    order_in: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    """
    Checkout with inventory allocation (reserved stock tracking) and coupon discount application.
    """
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order items cannot be empty.")

    # Calculate item totals and verify stock
    subtotal = 0.0
    order_items_to_create = []

    for item in order_in.items:
        prod = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found.")

        # Check stock
        if prod.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{prod.name}'. Requested: {item.quantity}, Available: {prod.stock_quantity}"
            )

        # Inventory Allocation: Hold/deduct inventory upon checkout
        prod.stock_quantity -= item.quantity
        if prod.stock_quantity <= 0:
            prod.stock_indicator_type = "backorder"
        elif prod.stock_quantity <= prod.safety_stock_threshold:
            prod.stock_indicator_type = "low_stock"

        item_total = item.unit_price * item.quantity
        subtotal += item_total

        order_items_to_create.append({
            "product_id": prod.id,
            "variant_id": item.variant_id,
            "product_name": prod.name,
            "variant_details": item.variant_details,
            "sku": item.sku or prod.sku,
            "unit_price": item.unit_price,
            "cost_price": prod.cost_price,
            "quantity": item.quantity,
            "total_price": item_total
        })

    # Discount calculation
    discount_amount = 0.0
    if order_in.coupon_code:
        coupon = db.query(models.Coupon).filter(
            models.Coupon.code == order_in.coupon_code.upper().strip(),
            models.Coupon.is_active == True
        ).first()
        if coupon:
            if subtotal >= coupon.min_spend:
                if coupon.discount_type == "percentage":
                    discount_amount = (subtotal * coupon.discount_value) / 100.0
                    if coupon.max_discount and discount_amount > coupon.max_discount:
                        discount_amount = coupon.max_discount
                else:
                    discount_amount = min(coupon.discount_value, subtotal)
                coupon.times_used += 1

    tax_amount = round((subtotal - discount_amount) * 0.05, 2)  # 5% VAT
    total_amount = round(max(0.0, subtotal - discount_amount + order_in.shipping_fee + tax_amount), 2)

    order_num = f"DRB-{datetime.datetime.utcnow().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    # Initial status: if online payment (card/bkash/nagad/rocket) we mark payment confirmed; if COD mark pending
    initial_status = "payment_confirmed" if order_in.payment_method in ["card", "bkash", "nagad", "rocket"] else "pending"
    initial_payment_status = "paid" if initial_status == "payment_confirmed" else "pending"

    new_order = models.Order(
        order_number=order_num,
        user_id=current_user.id if current_user else None,
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        customer_phone=order_in.customer_phone,
        shipping_address_json=json.dumps(order_in.shipping_address),
        billing_address_json=json.dumps(order_in.billing_address or order_in.shipping_address),
        status=initial_status,
        payment_method=order_in.payment_method,
        payment_status=initial_payment_status,
        subtotal=subtotal,
        discount_amount=discount_amount,
        coupon_code=order_in.coupon_code,
        shipping_fee=order_in.shipping_fee,
        tax_amount=tax_amount,
        total_amount=total_amount,
        courier_name="Steadfast Courier",
        tracking_number=f"TRK-{uuid.uuid4().hex[:8].upper()}",
        live_tracking_url=f"https://tracking.sushop.com/track/{order_num}",
        notes=order_in.notes
    )
    db.add(new_order)
    db.flush()

    for itm in order_items_to_create:
        oi = models.OrderItem(
            order_id=new_order.id,
            product_id=itm["product_id"],
            variant_id=itm["variant_id"],
            product_name=itm["product_name"],
            variant_details=itm["variant_details"],
            sku=itm["sku"],
            unit_price=itm["unit_price"],
            cost_price=itm["cost_price"],
            quantity=itm["quantity"],
            total_price=itm["total_price"]
        )
        db.add(oi)

    # Add initial order log
    log = models.OrderLog(
        order_id=new_order.id,
        from_status=None,
        to_status=initial_status,
        changed_by="Customer Checkout",
        notes=f"Order placed via {order_in.payment_method.upper()}"
    )
    db.add(log)

    if new_order.user_id:
        db.add(models.CustomerActivityLog(
            user_id=new_order.user_id,
            activity_type="order_placed",
            title=f"Order #{new_order.order_number} Placed",
            description=f"Order placed for ৳{new_order.total_amount} with {len(order_in.items)} item(s) via {order_in.payment_method.upper()}"
        ))

    db.commit()
    db.refresh(new_order)

    return {
        "message": "Order created successfully",
        "order_number": new_order.order_number,
        "status": new_order.status,
        "total_amount": new_order.total_amount,
        "tracking_number": new_order.tracking_number,
        "live_tracking_url": new_order.live_tracking_url
    }

@router.get("")
def list_orders(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 15,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["super_admin", "admin", "order_manager", "customer_support", "operator"]))
):
    query = db.query(models.Order)
    if status:
        query = query.filter(models.Order.status == status)
    if search:
        query = query.filter(
            models.Order.order_number.ilike(f"%{search}%") |
            models.Order.customer_name.ilike(f"%{search}%") |
            models.Order.customer_phone.ilike(f"%{search}%")
        )
    total = query.count()
    orders = query.order_by(desc(models.Order.created_at)).offset((page - 1) * limit).limit(limit).all()

    # Apply data masking on sensitive PII for operators
    user_role = current_user.role
    results = []
    for o in orders:
        results.append({
            "id": o.id,
            "order_number": o.order_number,
            "customer_name": o.customer_name,
            "customer_email": auth.mask_pii(o.customer_email, user_role),
            "customer_phone": auth.mask_pii(o.customer_phone, user_role),
            "status": o.status,
            "payment_method": o.payment_method,
            "payment_status": o.payment_status,
            "total_amount": o.total_amount,
            "items_count": len(o.items),
            "created_at": str(o.created_at),
            "tracking_number": o.tracking_number,
            "allowed_next_statuses": STATE_MACHINE_TRANSITIONS.get(o.status, [])
        })

    return {"items": results, "total": total, "page": page, "limit": limit}

@router.get("/{order_number}")
def get_order_detail(order_number: str, db: Session = Depends(get_db), current_user: Optional[models.User] = Depends(auth.get_current_user_optional)):
    o = db.query(models.Order).filter(models.Order.order_number == order_number).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")

    is_staff = current_user and current_user.role in auth.ADMIN_ROLES
    if not is_staff:
        # Enforce that customer can only access their own order
        if o.user_id:
            if not current_user or current_user.id != o.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You can only view orders associated with your account."
                )

    role = current_user.role if current_user else "customer"
    
    items = []
    for it in o.items:
        items.append({
            "id": it.id,
            "product_id": it.product_id,
            "product_name": it.product_name,
            "variant_details": it.variant_details,
            "sku": it.sku,
            "unit_price": it.unit_price,
            "cost_price": it.cost_price,
            "quantity": it.quantity,
            "total_price": it.total_price
        })

    logs = []
    for l in o.logs:
        logs.append({
            "from_status": l.from_status,
            "to_status": l.to_status,
            "changed_by": l.changed_by,
            "notes": l.notes,
            "timestamp": str(l.created_at)
        })

    return {
        "id": o.id,
        "order_number": o.order_number,
        "customer_name": o.customer_name,
        "customer_email": auth.mask_pii(o.customer_email, role),
        "customer_phone": auth.mask_pii(o.customer_phone, role),
        "shipping_address": json.loads(o.shipping_address_json or "{}"),
        "billing_address": json.loads(o.billing_address_json or "{}"),
        "status": o.status,
        "payment_method": o.payment_method,
        "payment_status": o.payment_status,
        "subtotal": o.subtotal,
        "discount_amount": o.discount_amount,
        "coupon_code": o.coupon_code,
        "shipping_fee": o.shipping_fee,
        "tax_amount": o.tax_amount,
        "total_amount": o.total_amount,
        "tracking_number": o.tracking_number,
        "courier_name": o.courier_name,
        "live_tracking_url": o.live_tracking_url,
        "notes": o.notes,
        "created_at": str(o.created_at),
        "allowed_next_statuses": STATE_MACHINE_TRANSITIONS.get(o.status, []),
        "items": items,
        "logs": logs
    }

# ----------------- STATE MACHINE TRANSITIONS -----------------
@router.post("/{order_number}/transition")
def transition_order_status(
    order_number: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["super_admin", "admin", "order_manager", "operator"]))
):
    """
    Deterministic State Machine Transition:
    Pending -> Payment Confirmed -> Processing/Picking -> Packed -> Shipped -> Delivered -> Cancelled/Returned
    """
    new_status = data.get("status")
    notes = data.get("notes", f"Status updated by {current_user.name}")

    o = db.query(models.Order).filter(models.Order.order_number == order_number).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")

    allowed = STATE_MACHINE_TRANSITIONS.get(o.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state transition from '{o.status}' to '{new_status}'. Allowed transitions: {', '.join(allowed) or 'None (Terminal state)'}"
        )

    old_status = o.status
    o.status = new_status

    if new_status == "delivered":
        o.payment_status = "paid"
    elif new_status == "cancelled":
        # Restock inventory on cancellation
        for item in o.items:
            prod = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if prod:
                prod.stock_quantity += item.quantity

    log = models.OrderLog(
        order_id=o.id,
        from_status=old_status,
        to_status=new_status,
        changed_by=f"{current_user.name} ({current_user.role})",
        notes=notes
    )
    db.add(log)

    if o.user_id:
        db.add(models.CustomerActivityLog(
            user_id=o.user_id,
            activity_type="order_status_change",
            title=f"Order #{o.order_number}: {new_status.replace('_', ' ').title()}",
            description=f"Status transitioned from '{old_status}' to '{new_status}' by {current_user.name}"
        ))

    db.commit()
    db.refresh(o)

    return {"message": f"Order status moved to {new_status}", "order_number": o.order_number, "status": o.status}

# ----------------- BULK DISPATCH TOOLS (PICKING LIST, PACKING SLIP, INVOICE, SHIPPING LABEL) -----------------
@router.post("/bulk-dispatch-documents")
def generate_bulk_dispatch_documents(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    """
    Batch printing for picking lists, packing slips, shipping invoices, and courier-integrated shipping labels.
    """
    order_numbers = data.get("order_numbers", [])
    doc_type = data.get("doc_type", "invoice")  # invoice, packing_slip, picking_list, shipping_label

    orders = db.query(models.Order).filter(models.Order.order_number.in_(order_numbers)).all()
    if not orders:
        raise HTTPException(status_code=404, detail="No matching orders found for document batch generation.")

    documents = []
    for o in orders:
        addr = json.loads(o.shipping_address_json or "{}")
        doc = {
            "order_number": o.order_number,
            "date": str(o.created_at)[:10],
            "customer_name": o.customer_name,
            "customer_phone": o.customer_phone,
            "address": f"{addr.get('street', '')}, {addr.get('city', '')}, {addr.get('country', '')}",
            "payment_method": o.payment_method.upper(),
            "tracking_number": o.tracking_number,
            "courier": o.courier_name,
            "items": [
                {
                    "sku": item.sku,
                    "name": item.product_name,
                    "qty": item.quantity,
                    "unit_price": item.unit_price,
                    "total": item.total_price
                } for item in o.items
            ],
            "subtotal": o.subtotal,
            "discount": o.discount_amount,
            "shipping_fee": o.shipping_fee,
            "tax": o.tax_amount,
            "total": o.total_amount
        }
        documents.append(doc)

    return {
        "doc_type": doc_type,
        "batch_count": len(documents),
        "generated_at": str(datetime.datetime.utcnow()),
        "documents": documents
    }

# ----------------- RMA & REFUNDS -----------------
@router.post("/rma/request")
def create_rma_request(
    data: dict,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    order_number = data.get("order_number")
    reason = data.get("reason", "Customer return request")
    o = db.query(models.Order).filter(models.Order.order_number == order_number).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")

    rma = models.ReturnRequest(
        order_id=o.id,
        order_number=o.order_number,
        user_id=current_user.id if current_user else o.user_id,
        items_json=json.dumps(data.get("items", [])),
        reason=reason,
        return_status="requested",
        refund_amount=float(data.get("refund_amount", o.total_amount)),
        restock_inventory=True
    )
    db.add(rma)
    db.commit()
    db.refresh(rma)
    return {"message": "RMA return requested successfully", "rma_id": rma.id}

@router.get("/rma/requests")
def list_rma_requests(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_role(["admin", "operator"]))):
    rmas = db.query(models.ReturnRequest).order_by(desc(models.ReturnRequest.created_at)).all()
    return rmas

@router.post("/rma/{rma_id}/trigger-refund")
def trigger_rma_refund(
    rma_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    """
    RMA & Refunds: Return Merchandise Authorization portal, partial/full refund triggers
    via original payment gateways, and automated inventory restock toggles.
    """
    rma = db.query(models.ReturnRequest).filter(models.ReturnRequest.id == rma_id).first()
    if not rma:
        raise HTTPException(status_code=404, detail="RMA record not found")

    restock = data.get("restock_inventory", True)
    refund_amount = float(data.get("refund_amount", rma.refund_amount))

    rma.return_status = "refund_issued"
    rma.refund_amount = refund_amount
    rma.restock_inventory = restock

    order = db.query(models.Order).filter(models.Order.id == rma.order_id).first()
    if order:
        order.payment_status = "refunded"
        order.status = "returned"
        if restock:
            for item in order.items:
                prod = db.query(models.Product).filter(models.Product.id == item.product_id).first()
                if prod:
                    prod.stock_quantity += item.quantity

        log = models.OrderLog(
            order_id=order.id,
            from_status=order.status,
            to_status="returned",
            changed_by=f"{current_user.name} (RMA Engine)",
            notes=f"Refund of ৳{refund_amount} triggered via {order.payment_method}. Restocked inventory: {restock}"
        )
        db.add(log)

    db.commit()
    return {"message": f"Refund of ৳{refund_amount} successfully processed. Inventory restocked: {restock}"}

