import json
import csv
import io
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_, and_
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/customers", tags=["Customer Relationship & Support (CRM)"])

# ----------------- CRM DASHBOARD METRICS -----------------
@router.get("/dashboard")
def get_crm_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    """
    Retrieve dynamic CRM Dashboard summary cards:
    - Total Customers
    - Active Customers (ordered in last 60 days)
    - Inactive Customers (no orders in 60+ days)
    - VIP Customers (LTV >= threshold or VIP tag)
    - Wholesale Customers
    - High-Risk/Fraud-Flagged Customers
    - New Customers (registered in last 30 days)
    - Total Eligible Customer Spend (LTV sum)
    - Average Customer LTV
    - Recent Customer Activity Logs
    """
    now = datetime.datetime.utcnow()
    thirty_days_ago = now - datetime.timedelta(days=30)
    sixty_days_ago = now - datetime.timedelta(days=60)

    # Configurable thresholds from settings
    vip_threshold = 5000.0
    setting = db.query(models.Setting).filter(models.Setting.key == "general_settings").first()
    if setting:
        try:
            s_data = json.loads(setting.value_json)
            vip_threshold = float(s_data.get("vip_spend_threshold", 5000.0))
        except Exception:
            pass

    customers = db.query(models.User).filter(models.User.role == "customer").all()
    total_customers = len(customers)

    active_customers = 0
    inactive_customers = 0
    vip_customers = 0
    wholesale_customers = 0
    high_risk_customers = 0
    new_customers = 0
    total_ltv = 0.0

    for c in customers:
        # Check registration date
        if c.created_at and c.created_at >= thirty_days_ago:
            new_customers += 1

        # Check tags
        tags = [t.tag_name for t in c.tag_assignments]
        if c.segment_tag and c.segment_tag not in tags:
            tags.append(c.segment_tag)

        if "High Risk/Fraud" in tags:
            high_risk_customers += 1
        if "Wholesale" in tags:
            wholesale_customers += 1

        # Calculate eligible LTV & order activity
        orders = db.query(models.Order).filter(models.Order.user_id == c.id).all()
        valid_orders = [o for o in orders if o.status not in ["cancelled", "returned"]]
        
        # Deduct refunds
        returns = db.query(models.ReturnRequest).filter(
            models.ReturnRequest.user_id == c.id,
            or_(models.ReturnRequest.refund_status == "processed", models.ReturnRequest.return_status == "refund_issued")
        ).all()
        refunds_total = sum(r.refund_amount for r in returns)

        cltv = max(0.0, sum(o.total_amount for o in valid_orders) - refunds_total)
        total_ltv += cltv

        if "VIP" in tags or cltv >= vip_threshold:
            vip_customers += 1

        # Inactivity check
        latest_order = None
        for o in orders:
            if o.created_at and (latest_order is None or o.created_at > latest_order):
                latest_order = o.created_at

        if latest_order:
            if latest_order >= sixty_days_ago:
                active_customers += 1
            else:
                inactive_customers += 1
        else:
            if c.created_at and c.created_at < sixty_days_ago:
                inactive_customers += 1
            else:
                active_customers += 1

    avg_ltv = round(total_ltv / total_customers, 2) if total_customers > 0 else 0.0

    # Recent activities
    recent_activities = db.query(models.CustomerActivityLog).order_by(
        desc(models.CustomerActivityLog.created_at)
    ).limit(10).all()

    activity_feed = [
        {
            "id": a.id,
            "user_id": a.user_id,
            "customer_name": a.user.name if a.user else "Customer",
            "type": a.activity_type,
            "title": a.title,
            "description": a.description,
            "created_at": str(a.created_at)
        }
        for a in recent_activities
    ]

    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "inactive_customers": inactive_customers,
        "vip_customers": vip_customers,
        "wholesale_customers": wholesale_customers,
        "high_risk_customers": high_risk_customers,
        "new_customers": new_customers,
        "new_customers_30d": new_customers,
        "total_ltv": round(total_ltv, 2),
        "total_customer_revenue": round(total_ltv, 2),
        "average_ltv": avg_ltv,
        "average_customer_ltv": avg_ltv,
        "vip_threshold": vip_threshold,
        "recent_activities": activity_feed
    }

# ----------------- CUSTOMER MANAGEMENT TABLE -----------------
@router.get("")
def list_customers(
    search: Optional[str] = None,
    tag: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    """
    Customer Management table with search, tag filters, sorting, pagination,
    and role-based PII data masking (for operators).
    """
    query = db.query(models.User).filter(models.User.role == "customer")

    if status:
        if status.lower() == "active":
            query = query.filter(models.User.is_active == True)
        elif status.lower() == "inactive":
            query = query.filter(models.User.is_active == False)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.User.name.ilike(s),
                models.User.email.ilike(s),
                models.User.phone.ilike(s)
            )
        )

    users = query.all()
    customer_list = []

    for u in users:
        # Multi-tag collection
        tags = [t.tag_name for t in u.tag_assignments]
        if u.segment_tag and u.segment_tag not in tags:
            tags.append(u.segment_tag)
        if not tags:
            tags = ["Regular"]

        # Tag filter check
        if tag and tag != "All" and tag not in tags:
            continue

        orders = db.query(models.Order).filter(models.Order.user_id == u.id).all()
        valid_orders = [o for o in orders if o.status not in ["cancelled", "returned"]]
        
        returns = db.query(models.ReturnRequest).filter(
            models.ReturnRequest.user_id == u.id,
            or_(models.ReturnRequest.refund_status == "processed", models.ReturnRequest.return_status == "refund_issued")
        ).all()
        refunds_total = sum(r.refund_amount for r in returns)

        ltv = max(0.0, sum(o.total_amount for o in valid_orders) - refunds_total)
        aov = round(ltv / len(valid_orders), 2) if valid_orders else 0.0

        customer_list.append({
            "id": u.id,
            "name": u.name,
            "email": auth.mask_pii(u.email, current_user.role),
            "phone": auth.mask_pii(u.phone, current_user.role),
            "address": auth.mask_pii(u.address, current_user.role),
            "is_active": u.is_active,
            "status": "Active" if u.is_active else "Inactive",
            "tags": tags,
            "segment_tag": tags[0] if tags else "Regular",
            "lifetime_orders_count": len(orders),
            "eligible_orders_count": len(valid_orders),
            "ltv": round(ltv, 2),
            "aov": aov,
            "created_at": str(u.created_at)
        })

    # Sort
    reverse = (sort_order.lower() == "desc")
    if sort_by == "name":
        customer_list.sort(key=lambda x: (x["name"] or "").lower(), reverse=reverse)
    elif sort_by == "ltv":
        customer_list.sort(key=lambda x: x["ltv"], reverse=reverse)
    elif sort_by == "orders":
        customer_list.sort(key=lambda x: x["lifetime_orders_count"], reverse=reverse)
    else:
        customer_list.sort(key=lambda x: x["created_at"] or "", reverse=reverse)

    total_records = len(customer_list)
    start_idx = (page - 1) * limit
    paginated = customer_list[start_idx:start_idx + limit]

    return {
        "total": total_records,
        "page": page,
        "limit": limit,
        "pages": max(1, (total_records + limit - 1) // limit),
        "items": paginated
    }

# ----------------- UNIFIED CUSTOMER TIMELINE (360-DEGREE VIEW) -----------------
@router.get("/{user_id}/profile")
def get_customer_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    """
    360-Degree Unified Customer View:
    A. Customer Information (Full Name, Email, Phone, Address, Registration Date, Account Status, Tags)
    B. Lifetime Orders (Order ID, Date, Products Purchased, Amount, Payment Status, Order Status)
    C. Lifetime Value (LTV) (excluding cancelled orders and deducting refunds)
    D. Average Order Value (AOV) (Eligible revenue / Eligible orders)
    E. Open Returns (Return ID, Order ID, Reason, Date, Status, Refund Status)
    F. Support Interactions (Ticket ID, Subject, Description, Date, Status, Latest Response)
    G. Customer Activity Timeline (Chronological events)
    """
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Tags
    tags = [t.tag_name for t in u.tag_assignments]
    if u.segment_tag and u.segment_tag not in tags:
        tags.append(u.segment_tag)
    if not tags:
        tags = ["Regular"]

    # Orders
    orders = db.query(models.Order).filter(models.Order.user_id == u.id).order_by(desc(models.Order.created_at)).all()
    order_items_list = []
    for o in orders:
        order_items_list.append({
            "id": o.id,
            "order_number": o.order_number,
            "created_at": str(o.created_at),
            "status": o.status,
            "payment_status": o.payment_status or "confirmed",
            "payment_method": o.payment_method,
            "total_amount": o.total_amount,
            "items_count": len(o.items),
            "products": [
                {
                    "product_id": itm.product_id,
                    "product_name": itm.product_name,
                    "sku": itm.sku,
                    "quantity": itm.quantity,
                    "unit_price": itm.unit_price,
                    "total_price": round(itm.quantity * itm.unit_price, 2)
                }
                for itm in o.items
            ]
        })

    # Returns
    returns = db.query(models.ReturnRequest).filter(models.ReturnRequest.user_id == u.id).order_by(desc(models.ReturnRequest.created_at)).all()
    return_items_list = [
        {
            "id": r.id,
            "order_number": r.order_number,
            "reason": r.reason,
            "return_status": r.return_status,
            "refund_status": getattr(r, "refund_status", "pending") or "pending",
            "refund_amount": r.refund_amount,
            "created_at": str(r.created_at)
        }
        for r in returns
    ]

    # Support Tickets
    tickets = db.query(models.SupportTicket).filter(models.SupportTicket.user_id == u.id).order_by(desc(models.SupportTicket.created_at)).all()
    ticket_items_list = []
    for t in tickets:
        msgs = json.loads(t.messages_json or "[]")
        latest_reply = msgs[-1]["message"] if msgs else ""
        ticket_items_list.append({
            "id": t.id,
            "ticket_number": t.ticket_number,
            "subject": t.subject,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "description": msgs[0]["message"] if msgs else "",
            "latest_response": latest_reply,
            "messages_count": len(msgs),
            "created_at": str(t.created_at)
        })

    # Financial Metrics (LTV and AOV calculation)
    valid_orders = [o for o in orders if o.status not in ["cancelled", "returned"]]
    refunds_total = sum(r.refund_amount for r in returns if getattr(r, 'refund_status', None) == "processed" or r.return_status == "refund_issued")
    ltv = max(0.0, sum(o.total_amount for o in valid_orders) - refunds_total)
    aov = round(ltv / len(valid_orders), 2) if valid_orders else 0.0

    # Unified Chronological Activity Timeline
    timeline = []

    # 1. Registration
    timeline.append({
        "type": "registration",
        "title": "Account Registered",
        "description": f"Customer created account with email {auth.mask_pii(u.email, current_user.role)}",
        "timestamp": str(u.created_at)
    })

    # 2. Activity logs recorded
    logs = db.query(models.CustomerActivityLog).filter(models.CustomerActivityLog.user_id == u.id).all()
    for l in logs:
        if l.activity_type != "registration":
            timeline.append({
                "type": l.activity_type,
                "title": l.title,
                "description": l.description,
                "timestamp": str(l.created_at)
            })

    # 3. Orders placed
    for o in orders:
        timeline.append({
            "type": "order_placed",
            "title": f"Order #{o.order_number} ({o.status.upper()})",
            "description": f"Placed order totaling ৳{o.total_amount} with {len(o.items)} items via {o.payment_method}",
            "timestamp": str(o.created_at),
            "order_number": o.order_number
        })

    # 4. Returns & Refunds
    for r in returns:
        timeline.append({
            "type": "return_requested",
            "title": f"RMA Return for Order #{r.order_number}",
            "description": f"Status: {r.return_status} • Reason: {r.reason} • Refund: ৳{r.refund_amount}",
            "timestamp": str(r.created_at)
        })

    # 5. Support tickets
    for t in tickets:
        timeline.append({
            "type": "support_ticket",
            "title": f"Support Ticket #{t.ticket_number}: {t.subject}",
            "description": f"Category: {t.category} • Status: {t.status} • Priority: {t.priority}",
            "timestamp": str(t.created_at)
        })

    # Sort chronological descending
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)

    return {
        "customer": {
            "id": u.id,
            "name": u.name,
            "email": auth.mask_pii(u.email, current_user.role),
            "phone": auth.mask_pii(u.phone, current_user.role),
            "address": auth.mask_pii(u.address, current_user.role),
            "is_active": u.is_active,
            "status": "Active" if u.is_active else "Inactive",
            "tags": tags,
            "registration_date": str(u.created_at)
        },
        "metrics": {
            "ltv": round(ltv, 2),
            "aov": aov,
            "total_orders": len(orders),
            "eligible_orders": len(valid_orders),
            "total_refunded": round(refunds_total, 2),
            "open_returns_count": len([r for r in returns if r.return_status in ["requested", "approved"]]),
            "support_tickets_count": len(tickets)
        },
        "orders": order_items_list,
        "returns": return_items_list,
        "tickets": ticket_items_list,
        "timeline": timeline
    }

# ----------------- CUSTOMER TAGS & SEGMENTATION -----------------
@router.get("/tags")
def list_customer_tags(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    tags = db.query(models.CustomerTag).all()
    results = []
    for t in tags:
        count = db.query(models.CustomerTagAssignment).filter(models.CustomerTagAssignment.tag_name == t.name).count()
        results.append({
            "id": t.id,
            "name": t.name,
            "color": t.color,
            "description": t.description,
            "is_system": t.is_system,
            "customer_count": count
        })
    return results

@router.post("/tags")
def create_customer_tag(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    name = data.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Tag name is required")
    
    existing = db.query(models.CustomerTag).filter(models.CustomerTag.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Tag '{name}' already exists")

    new_tag = models.CustomerTag(
        name=name,
        color=data.get("color", "emerald"),
        description=data.get("description", ""),
        is_system=False
    )
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return new_tag

@router.delete("/tags/{tag_id}")
def delete_customer_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    tag = db.query(models.CustomerTag).filter(models.CustomerTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag.is_system:
        raise HTTPException(status_code=400, detail="System tags cannot be deleted")

    # Remove assignments
    db.query(models.CustomerTagAssignment).filter(models.CustomerTagAssignment.tag_name == tag.name).delete()
    db.delete(tag)
    db.commit()
    return {"message": f"Tag '{tag.name}' deleted successfully"}

@router.post("/{user_id}/tags")
def assign_customer_tag(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    tag_name = data.get("tag_name", "").strip()
    if not tag_name:
        raise HTTPException(status_code=400, detail="Tag name is required")

    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Customer not found")

    existing = db.query(models.CustomerTagAssignment).filter(
        models.CustomerTagAssignment.user_id == user_id,
        models.CustomerTagAssignment.tag_name == tag_name
    ).first()

    if existing:
        return {"message": f"Tag '{tag_name}' is already assigned to {u.name}"}

    assignment = models.CustomerTagAssignment(
        user_id=user_id,
        tag_name=tag_name,
        assigned_by=current_user.name
    )
    db.add(assignment)

    # Log in activity timeline
    db.add(models.CustomerActivityLog(
        user_id=user_id,
        activity_type="tag_assigned",
        title=f"Tag Assigned: {tag_name}",
        description=f"Admin {current_user.name} assigned tag '{tag_name}'"
    ))

    db.commit()
    return {"message": f"Tag '{tag_name}' successfully assigned to {u.name}"}

@router.delete("/{user_id}/tags/{tag_name}")
def remove_customer_tag(
    user_id: int,
    tag_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Customer not found")

    existing = db.query(models.CustomerTagAssignment).filter(
        models.CustomerTagAssignment.user_id == user_id,
        models.CustomerTagAssignment.tag_name == tag_name
    ).first()

    if existing:
        db.delete(existing)
        # Log in activity timeline
        db.add(models.CustomerActivityLog(
            user_id=user_id,
            activity_type="tag_removed",
            title=f"Tag Removed: {tag_name}",
            description=f"Admin {current_user.name} removed tag '{tag_name}'"
        ))
        db.commit()

    return {"message": f"Tag '{tag_name}' removed from {u.name}"}

@router.post("/auto-segment")
def run_auto_segmentation(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    """
    Run configurable rule engine:
    - VIP: LTV >= vip_spend_threshold (default 5000)
    - Inactive: Last order > inactivity_days_threshold (default 60 days)
    """
    vip_threshold = 5000.0
    inactivity_days = 60
    setting = db.query(models.Setting).filter(models.Setting.key == "general_settings").first()
    if setting:
        try:
            s_data = json.loads(setting.value_json)
            vip_threshold = float(s_data.get("vip_spend_threshold", 5000.0))
            inactivity_days = int(s_data.get("inactivity_days_threshold", 60))
        except Exception:
            pass

    now = datetime.datetime.utcnow()
    cutoff_date = now - datetime.timedelta(days=inactivity_days)

    customers = db.query(models.User).filter(models.User.role == "customer").all()
    updates = 0

    for c in customers:
        orders = db.query(models.Order).filter(models.Order.user_id == c.id).all()
        valid_orders = [o for o in orders if o.status not in ["cancelled", "returned"]]
        ltv = sum(o.total_amount for o in valid_orders)

        # VIP Check
        if ltv >= vip_threshold:
            has_vip = db.query(models.CustomerTagAssignment).filter(
                models.CustomerTagAssignment.user_id == c.id,
                models.CustomerTagAssignment.tag_name == "VIP"
            ).first()
            if not has_vip:
                db.add(models.CustomerTagAssignment(user_id=c.id, tag_name="VIP", assigned_by="Rule Engine"))
                updates += 1

        # Inactive Check
        latest_date = max([o.created_at for o in orders if o.created_at], default=c.created_at)
        if latest_date and latest_date < cutoff_date:
            has_inact = db.query(models.CustomerTagAssignment).filter(
                models.CustomerTagAssignment.user_id == c.id,
                models.CustomerTagAssignment.tag_name == "Inactive"
            ).first()
            if not has_inact:
                db.add(models.CustomerTagAssignment(user_id=c.id, tag_name="Inactive", assigned_by="Rule Engine"))
                updates += 1

    db.commit()
    return {"message": "Auto-segmentation completed", "tags_assigned": updates}

# ----------------- PRIVACY, COMPLIANCE & EXPORT -----------------
@router.post("/export")
def export_customers_csv(
    data: dict = {},
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    """
    Export customer directory to CSV with role-based PII masking for operators.
    Logs activity in customer_data_export_logs.
    """
    users = db.query(models.User).filter(models.User.role == "customer").all()
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["Customer ID", "Name", "Email", "Phone", "Status", "Tags", "Total Orders", "LTV (BDT)", "Registered At"])

    for u in users:
        tags = [t.tag_name for t in u.tag_assignments]
        orders = db.query(models.Order).filter(models.Order.user_id == u.id).all()
        valid = [o for o in orders if o.status not in ["cancelled", "returned"]]
        ltv = sum(o.total_amount for o in valid)

        writer.writerow([
            u.id,
            u.name,
            auth.mask_pii(u.email, current_user.role),
            auth.mask_pii(u.phone, current_user.role),
            "Active" if u.is_active else "Inactive",
            ", ".join(tags) if tags else "Regular",
            len(orders),
            round(ltv, 2),
            str(u.created_at)
        ])

    csv_data = output.getvalue()

    # Record log
    export_log = models.CustomerDataExportLog(
        exported_by=current_user.name,
        role=current_user.role,
        format="csv",
        record_count=len(users),
        filter_applied=data.get("filter", "all")
    )
    db.add(export_log)
    db.commit()

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=sushop_customers_{datetime.date.today()}.csv"}
    )

@router.get("/export-logs")
def get_export_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    return db.query(models.CustomerDataExportLog).order_by(desc(models.CustomerDataExportLog.created_at)).limit(20).all()

# ----------------- ACCOUNT DELETION WORKFLOW -----------------
@router.post("/{user_id}/delete-request")
def create_deletion_request(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Customer not found")

    req = models.CustomerDeletionRequest(
        user_id=user_id,
        customer_name=u.name,
        customer_email=u.email,
        reason=data.get("reason", "Customer requested GDPR/Privacy account deletion"),
        requested_by=current_user.name
    )
    db.add(req)
    db.commit()
    return {"message": "Account deletion request logged", "request_id": req.id}

@router.get("/deletion-requests")
def list_deletion_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    return db.query(models.CustomerDeletionRequest).order_by(desc(models.CustomerDeletionRequest.requested_at)).all()

@router.post("/deletion-requests/{req_id}/action")
def process_deletion_request(
    req_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    req = db.query(models.CustomerDeletionRequest).filter(models.CustomerDeletionRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Deletion request not found")

    action = data.get("action")  # 'approve' | 'reject'
    if action == "approve":
        u = db.query(models.User).filter(models.User.id == req.user_id).first()
        if u:
            # Anonymize PII to maintain financial/tax compliance without deleting historical orders
            u.name = f"[Deleted Customer #{u.id}]"
            u.email = f"deleted_{u.id}@anonymized.sushop"
            u.phone = "+880000000000"
            u.address = "[Anonymized upon privacy deletion]"
            u.is_active = False
            # remove addresses
            db.query(models.Address).filter(models.Address.user_id == u.id).delete()
            db.query(models.CustomerTagAssignment).filter(models.CustomerTagAssignment.user_id == u.id).delete()
            db.add(models.CustomerActivityLog(
                user_id=u.id,
                activity_type="account_anonymized",
                title="Account Anonymized & Deactivated",
                description="Account PII anonymized pursuant to approved privacy deletion request."
            ))

        req.status = "completed"
        req.processed_at = datetime.datetime.utcnow()
        req.processed_by = current_user.name
        db.commit()
        return {"message": "Customer account anonymized and deactivated. Financial order records preserved."}
    else:
        req.status = "rejected"
        req.processed_at = datetime.datetime.utcnow()
        req.processed_by = current_user.name
        db.commit()
        return {"message": "Customer account deletion request rejected."}

# ----------------- CUSTOMER PORTAL (FOR AUTHENTICATED CUSTOMER) -----------------
@router.get("/portal/profile")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    orders = db.query(models.Order).filter(models.Order.user_id == current_user.id).all()
    valid_orders = [o for o in orders if o.status not in ["cancelled", "returned"]]
    returns = db.query(models.ReturnRequest).filter(models.ReturnRequest.user_id == current_user.id).all()
    refunds = sum(r.refund_amount for r in returns if getattr(r, 'refund_status', None) == "processed" or r.return_status == "refund_issued")
    ltv = max(0.0, sum(o.total_amount for o in valid_orders) - refunds)

    addresses = db.query(models.Address).filter(models.Address.user_id == current_user.id).all()
    wishlist_count = db.query(models.Wishlist).filter(models.Wishlist.user_id == current_user.id).count()

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone or "",
        "address": current_user.address or "",
        "role": current_user.role,
        "segment_tag": current_user.segment_tag or "Regular",
        "member_since": str(current_user.created_at),
        "total_orders": len(orders),
        "ltv": round(ltv, 2),
        "saved_addresses_count": len(addresses),
        "wishlist_items_count": wishlist_count
    }

@router.put("/portal/profile")
def update_my_profile(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if "name" in data and data["name"].strip():
        current_user.name = data["name"].strip()
    if "phone" in data:
        current_user.phone = data["phone"].strip()
    if "address" in data:
        current_user.address = data["address"].strip()

    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated successfully", "name": current_user.name}

@router.post("/portal/change-password")
def change_my_password(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Current and new password are required")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    # Verify current password
    if not auth.verify_password(current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    current_user.hashed_password = auth.get_password_hash(new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.get("/portal/orders")
def get_my_orders(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    orders = db.query(models.Order).filter(models.Order.user_id == current_user.id).order_by(desc(models.Order.created_at)).all()
    results = []
    for o in orders:
        results.append({
            "order_number": o.order_number,
            "date": str(o.created_at),
            "status": o.status,
            "total_amount": o.total_amount,
            "payment_method": o.payment_method,
            "tracking_number": o.tracking_number,
            "courier_name": o.courier_name,
            "live_tracking_url": o.live_tracking_url,
            "items_count": len(o.items),
            "items": [
                {
                    "product_id": it.product_id,
                    "name": it.product_name,
                    "quantity": it.quantity,
                    "unit_price": it.unit_price,
                    "sku": it.sku
                } for it in o.items
            ]
        })
    return results

@router.post("/portal/repeat-order/{order_number}")
def repeat_order(order_number: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    o = db.query(models.Order).filter(models.Order.order_number == order_number).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    
    cart_items = []
    for itm in o.items:
        prod = db.query(models.Product).filter(models.Product.id == itm.product_id).first()
        cart_items.append({
            "product_id": itm.product_id,
            "variant_id": itm.variant_id,
            "name": itm.product_name,
            "sku": itm.sku,
            "unit_price": prod.sale_price or prod.base_price if prod else itm.unit_price,
            "quantity": itm.quantity,
            "in_stock": (prod.stock_quantity > 0) if prod else False
        })
    return {"message": "Cart payload prepared for re-order", "items": cart_items}

# ----------------- CUSTOMER ADDRESSES WITH DETAILED CITIES/BUILDINGS -----------------
@router.get("/portal/addresses")
def get_saved_addresses(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Address).filter(models.Address.user_id == current_user.id).all()

@router.post("/portal/addresses")
def save_address(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    is_default = bool(data.get("is_default", False))
    if is_default:
        # unset previous defaults
        db.query(models.Address).filter(models.Address.user_id == current_user.id).update({"is_default": False})

    addr = models.Address(
        user_id=current_user.id,
        address_type=data.get("address_type", "shipping"),
        full_name=data.get("full_name", current_user.name),
        phone=data.get("phone", current_user.phone or ""),
        building=data.get("building", ""),
        street=data.get("street", ""),
        city=data.get("city", "Mirpur, Dhaka"),
        state=data.get("state", "Dhaka"),
        postal_code=data.get("postal_code", "1216"),
        country=data.get("country", "Bangladesh"),
        is_default=is_default
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return addr

@router.put("/portal/addresses/{address_id}")
def update_saved_address(
    address_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    addr = db.query(models.Address).filter(
        models.Address.id == address_id,
        models.Address.user_id == current_user.id
    ).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")

    if data.get("is_default"):
        db.query(models.Address).filter(models.Address.user_id == current_user.id).update({"is_default": False})
        addr.is_default = True

    if "full_name" in data:
        addr.full_name = data["full_name"]
    if "phone" in data:
        addr.phone = data["phone"]
    if "building" in data:
        addr.building = data["building"]
    if "street" in data:
        addr.street = data["street"]
    if "city" in data:
        addr.city = data["city"]
    if "postal_code" in data:
        addr.postal_code = data["postal_code"]

    db.commit()
    db.refresh(addr)
    return addr

@router.delete("/portal/addresses/{address_id}")
def delete_saved_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    addr = db.query(models.Address).filter(
        models.Address.id == address_id,
        models.Address.user_id == current_user.id
    ).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(addr)
    db.commit()
    return {"message": "Address deleted successfully"}

# ----------------- CUSTOMER REVIEWS & COUPONS -----------------
@router.get("/portal/reviews")
def get_my_reviews(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    reviews = db.query(models.Review).filter(models.Review.user_id == current_user.id).all()
    results = []
    for r in reviews:
        results.append({
            "id": r.id,
            "product_id": r.product_id,
            "product_name": r.product.name if r.product else "Product",
            "rating": r.rating,
            "title": r.title,
            "comment": r.comment,
            "is_verified_buyer": r.is_verified_buyer,
            "created_at": str(r.created_at)
        })
    return results

@router.get("/portal/coupons")
def get_available_coupons(db: Session = Depends(get_db)):
    coupons = db.query(models.Coupon).filter(models.Coupon.is_active == True).all()
    return [
        {
            "code": c.code,
            "discount_type": c.discount_type,
            "discount_value": c.discount_value,
            "min_spend": c.min_spend
        }
        for c in coupons
    ]

# ----------------- WISHLIST -----------------
@router.get("/portal/wishlist")
def get_wishlist(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    items = db.query(models.Wishlist).filter(models.Wishlist.user_id == current_user.id).all()
    results = []
    for w in items:
        p = w.product
        if p:
            imgs = json.loads(p.images or "[]")
            results.append({
                "id": w.id,
                "product_id": p.id,
                "name": p.name,
                "slug": p.slug,
                "base_price": p.base_price,
                "sale_price": p.sale_price,
                "thumbnail": imgs[0] if imgs else None,
                "stock_quantity": p.stock_quantity
            })
    return results

@router.post("/portal/wishlist/{product_id}")
def toggle_wishlist(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    existing = db.query(models.Wishlist).filter(
        models.Wishlist.user_id == current_user.id,
        models.Wishlist.product_id == product_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"action": "removed", "message": "Product removed from wishlist"}
    else:
        new_w = models.Wishlist(user_id=current_user.id, product_id=product_id)
        db.add(new_w)
        db.commit()
        return {"action": "added", "message": "Product added to wishlist"}

# ----------------- SUPPORT TICKETS -----------------
@router.get("/portal/tickets")
def get_support_tickets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role in ["admin", "operator"]:
        tickets = db.query(models.SupportTicket).order_by(desc(models.SupportTicket.created_at)).all()
    else:
        tickets = db.query(models.SupportTicket).filter(models.SupportTicket.user_id == current_user.id).order_by(desc(models.SupportTicket.created_at)).all()

    res = []
    for t in tickets:
        res.append({
            "id": t.id,
            "ticket_number": t.ticket_number,
            "customer_name": t.customer_name,
            "customer_email": auth.mask_pii(t.customer_email, current_user.role),
            "subject": t.subject,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "messages": json.loads(t.messages_json or "[]"),
            "created_at": str(t.created_at)
        })
    return res

@router.post("/portal/tickets")
def create_support_ticket(
    data: dict,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    import uuid
    ticket_num = f"TCK-{uuid.uuid4().hex[:6].upper()}"
    name = current_user.name if current_user else data.get("customer_name", "Customer")
    email = current_user.email if current_user else data.get("customer_email", "support@sushop.com")
    
    first_msg = {
        "sender": name,
        "is_agent": False,
        "message": data.get("message", ""),
        "timestamp": str(datetime.datetime.utcnow())
    }

    t = models.SupportTicket(
        ticket_number=ticket_num,
        user_id=current_user.id if current_user else None,
        customer_name=name,
        customer_email=email,
        subject=data.get("subject", "General Inquiry"),
        category=data.get("category", "Order Inquiry"),
        priority=data.get("priority", "medium"),
        status="open",
        messages_json=json.dumps([first_msg])
    )
    db.add(t)

    # Log in activity if logged in
    if current_user:
        db.add(models.CustomerActivityLog(
            user_id=current_user.id,
            activity_type="ticket_created",
            title=f"Support Ticket #{ticket_num} Created",
            description=f"Opened support ticket: '{data.get('subject')}' ({data.get('category')})"
        ))

    db.commit()
    db.refresh(t)
    return {"message": "Support ticket created successfully", "ticket_number": t.ticket_number}

@router.post("/portal/tickets/{ticket_number}/reply")
def reply_to_ticket(
    ticket_number: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    t = db.query(models.SupportTicket).filter(models.SupportTicket.ticket_number == ticket_number).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")

    messages = json.loads(t.messages_json or "[]")
    is_staff = current_user.role in ["admin", "operator"]
    new_msg = {
        "sender": current_user.name,
        "is_agent": is_staff,
        "message": data.get("message", ""),
        "timestamp": str(datetime.datetime.utcnow())
    }
    messages.append(new_msg)
    t.messages_json = json.dumps(messages)
    
    if "status" in data and is_staff:
        t.status = data["status"]

    db.commit()
    return {"message": "Reply added successfully", "messages": messages}
