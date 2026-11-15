import json
import csv
import io
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, and_, or_
from database import get_db
import models, auth

router = APIRouter(prefix="/api/analytics", tags=["Analytics, Operations & Reporting"])

def parse_date_filters(period: Optional[str] = "30d", start_date: Optional[str] = None, end_date: Optional[str] = None):
    """
    Parses date range filters:
    today, yesterday, 7d, 30d, this_month, last_month, custom, all
    """
    now = datetime.datetime.utcnow()
    start_dt = None
    end_dt = now

    p = (period or "30d").lower().strip()
    if p == "today":
        start_dt = datetime.datetime(now.year, now.month, now.day, 0, 0, 0)
    elif p == "yesterday":
        y = now - datetime.timedelta(days=1)
        start_dt = datetime.datetime(y.year, y.month, y.day, 0, 0, 0)
        end_dt = datetime.datetime(y.year, y.month, y.day, 23, 59, 59)
    elif p in ["7d", "last_7_days", "week"]:
        start_dt = now - datetime.timedelta(days=7)
    elif p in ["30d", "last_30_days", "month"]:
        start_dt = now - datetime.timedelta(days=30)
    elif p == "this_month":
        start_dt = datetime.datetime(now.year, now.month, 1, 0, 0, 0)
    elif p == "last_month":
        # First day of last month
        first_this_month = datetime.datetime(now.year, now.month, 1, 0, 0, 0)
        last_day_prev_month = first_this_month - datetime.timedelta(seconds=1)
        first_day_prev_month = datetime.datetime(last_day_prev_month.year, last_day_prev_month.month, 1, 0, 0, 0)
        start_dt = first_day_prev_month
        end_dt = last_day_prev_month
    elif p == "custom":
        if start_date:
            try:
                start_dt = datetime.datetime.fromisoformat(start_date.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                start_dt = now - datetime.timedelta(days=30)
        else:
            start_dt = now - datetime.timedelta(days=30)

        if end_date:
            try:
                end_dt = datetime.datetime.fromisoformat(end_date.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                end_dt = now
    elif p == "all":
        start_dt = datetime.datetime(2020, 1, 1, 0, 0, 0)
    else:
        start_dt = now - datetime.timedelta(days=30)

    return start_dt, end_dt

# Gateway fee schedule configuration (standard Bangladesh payment gateways)
GATEWAY_FEES = {
    "bkash": {"name": "bKash Mobile Wallet", "rate": 0.015, "fixed": 0.0},
    "nagad": {"name": "Nagad Digital Wallet", "rate": 0.012, "fixed": 0.0},
    "rocket": {"name": "DBBL Rocket", "rate": 0.015, "fixed": 0.0},
    "card": {"name": "Debit / Credit Card (SSLCommerz)", "rate": 0.025, "fixed": 0.0},
    "bnpl": {"name": "Buy Now Pay Later", "rate": 0.030, "fixed": 0.0},
    "cod": {"name": "Cash on Delivery (COD)", "rate": 0.0, "fixed": 0.0}
}

# ----------------- 1. EXECUTIVE DASHBOARD -----------------
@router.get("/dashboard")
def get_executive_dashboard(
    period: Optional[str] = "30d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    """
    Executive Dashboard Metrics:
    - Gross Revenue (actual orders excluding cancelled)
    - Net Revenue (deducting discounts, refunds, and returns)
    - Conversion Rate (using real visitor tracking; returns unavailable state if uncollected)
    - Orders by Status (Pending, Payment Confirmed, Processing/Picking, Packed, Shipped, Delivered, Cancelled, Returned)
    - Top 10 Bestselling SKUs (with image, name, SKU, units sold, revenue)
    - Revenue Trends Over Time (daily time series for charts)
    """
    start_dt, end_dt = parse_date_filters(period, start_date, end_date)

    # Base query for orders in range
    order_query = db.query(models.Order).filter(
        models.Order.created_at >= start_dt,
        models.Order.created_at <= end_dt
    )
    orders = order_query.all()
    total_orders = len(orders)

    # All standard statuses initialized
    statuses = [
        "pending", "payment_confirmed", "processing_picking",
        "packed", "shipped", "delivered", "cancelled", "returned"
    ]
    orders_by_status = {st: 0 for st in statuses}
    for o in orders:
        st = o.status.lower()
        orders_by_status[st] = orders_by_status.get(st, 0) + 1

    # Gross revenue: orders excluding cancelled
    valid_orders = [o for o in orders if o.status != "cancelled"]
    gross_revenue = sum(o.total_amount for o in valid_orders)

    # Refunds: actual approved or processed refunds in the period
    order_ids = [o.id for o in orders]
    returns_in_period = db.query(models.ReturnRequest).filter(
        models.ReturnRequest.order_id.in_(order_ids) if order_ids else False,
        or_(models.ReturnRequest.return_status == "refund_issued", models.ReturnRequest.refund_status == "processed")
    ).all()
    refund_totals = sum(r.refund_amount for r in returns_in_period)

    # Also include returned orders total amount if not logged in return_requests
    returned_orders_revenue = sum(o.total_amount for o in orders if o.status == "returned")
    effective_refunds = max(refund_totals, returned_orders_revenue)

    total_discounts = sum(o.discount_amount for o in valid_orders)
    net_revenue = max(0.0, gross_revenue - effective_refunds - total_discounts)

    # Conversion Rate calculation
    # Query distinct visitor sessions from SiteVisit in date range
    visitor_sessions_count = db.query(func.count(func.distinct(models.SiteVisit.session_id))).filter(
        models.SiteVisit.created_at >= start_dt,
        models.SiteVisit.created_at <= end_dt
    ).scalar() or 0

    purchased_orders_count = len([o for o in valid_orders if o.status in ["payment_confirmed", "processing_picking", "packed", "shipped", "delivered"]])

    if visitor_sessions_count > 0:
        conversion_rate_percentage = round((purchased_orders_count / visitor_sessions_count) * 100.0, 2)
        visitor_tracking_active = True
    else:
        # If visitor data is not collected for this window, do not invent numbers
        conversion_rate_percentage = None
        visitor_tracking_active = False

    # Top 10 Bestselling SKUs
    top_skus_query = (
        db.query(
            models.OrderItem.sku,
            models.OrderItem.product_name,
            models.OrderItem.product_id,
            func.sum(models.OrderItem.quantity).label("units_sold"),
            func.sum(models.OrderItem.total_price).label("revenue")
        )
        .join(models.Order, models.OrderItem.order_id == models.Order.id)
        .filter(
            models.Order.created_at >= start_dt,
            models.Order.created_at <= end_dt,
            models.Order.status.notin_(["cancelled", "returned"])
        )
        .group_by(models.OrderItem.sku, models.OrderItem.product_name, models.OrderItem.product_id)
        .order_by(desc("units_sold"))
        .limit(10)
        .all()
    )

    top_skus = []
    for row in top_skus_query:
        prod = db.query(models.Product).filter(models.Product.id == row[2]).first()
        img_url = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80"
        if prod and prod.images:
            try:
                imgs = json.loads(prod.images)
                if imgs and isinstance(imgs, list) and len(imgs) > 0:
                    img_url = imgs[0]
            except Exception:
                pass
        top_skus.append({
            "sku": row[0],
            "name": row[1],
            "product_id": row[2],
            "units_sold": int(row[3] or 0),
            "revenue": round(float(row[4] or 0.0), 2),
            "image": img_url
        })

    # Revenue Trends Over Time (daily series)
    trend_map = {}
    curr_day = start_dt.date()
    end_day = end_dt.date()
    # Limit trend days to avoid unbounded rendering
    max_days = (end_day - curr_day).days + 1
    if max_days > 180:
        curr_day = end_day - datetime.timedelta(days=60)

    d_ptr = curr_day
    while d_ptr <= end_day:
        d_str = d_ptr.isoformat()
        trend_map[d_str] = {
            "date": d_str,
            "label": d_ptr.strftime("%b %d"),
            "gross": 0.0,
            "net": 0.0,
            "orders": 0
        }
        d_ptr += datetime.timedelta(days=1)

    for o in valid_orders:
        d_str = o.created_at.date().isoformat()
        if d_str in trend_map:
            trend_map[d_str]["gross"] += o.total_amount
            trend_map[d_str]["net"] += max(0.0, o.total_amount - o.discount_amount)
            trend_map[d_str]["orders"] += 1

    revenue_trends = [
        {
            "date": v["date"],
            "label": v["label"],
            "gross": round(v["gross"], 2),
            "net": round(v["net"], 2),
            "orders": v["orders"]
        }
        for v in sorted(trend_map.values(), key=lambda x: x["date"])
    ]

    return {
        "period": period,
        "date_range": {
            "start": str(start_dt),
            "end": str(end_dt)
        },
        "gross_revenue": round(gross_revenue, 2),
        "net_revenue": round(net_revenue, 2),
        "refund_totals": round(effective_refunds, 2),
        "total_discounts": round(total_discounts, 2),
        "total_orders": total_orders,
        "orders_by_status": orders_by_status,
        "conversion_rate_percentage": conversion_rate_percentage,
        "visitor_tracking_active": visitor_tracking_active,
        "visitor_sessions_count": visitor_sessions_count,
        "top_10_bestselling_skus": top_skus,
        "revenue_trends": revenue_trends
    }

# ----------------- 2. FINANCIAL REPORTS -----------------
@router.get("/financial-reports")
def get_financial_reports(
    period: Optional[str] = "30d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    payment_gateway: Optional[str] = None,
    payment_status: Optional[str] = None,
    order_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    """
    Dedicated Financial Reports:
    - Sales Tax Liabilities
    - Payment Gateway Fee Deductions
    - COGS vs. Gross Margins
    - Refund Totals (Full vs Partial, Pending vs Failed)
    """
    start_dt, end_dt = parse_date_filters(period, start_date, end_date)

    query = db.query(models.Order).filter(
        models.Order.created_at >= start_dt,
        models.Order.created_at <= end_dt
    )

    if payment_gateway and payment_gateway.lower() != "all":
        query = query.filter(models.Order.payment_method == payment_gateway.lower())
    if payment_status and payment_status.lower() != "all":
        query = query.filter(models.Order.payment_status == payment_status.lower())
    if order_status and order_status.lower() != "all":
        query = query.filter(models.Order.status == order_status.lower())

    orders = query.all()
    valid_orders = [o for o in orders if o.status != "cancelled"]

    # 1. Sales Tax Liabilities
    taxable_orders = [o for o in valid_orders if o.tax_amount > 0]
    total_taxable_sales = sum(o.subtotal - o.discount_amount for o in taxable_orders)
    total_tax_collected = sum(o.tax_amount for o in valid_orders)

    # Tax on returned orders
    tax_refunded = sum(o.tax_amount for o in orders if o.status == "returned")
    tax_liabilities = max(0.0, total_tax_collected - tax_refunded)

    # Tax breakdown by date
    tax_by_date = {}
    for o in valid_orders:
        d = o.created_at.date().isoformat()
        if d not in tax_by_date:
            tax_by_date[d] = {"date": d, "taxable_sales": 0.0, "tax_collected": 0.0}
        tax_by_date[d]["taxable_sales"] += max(0.0, o.subtotal - o.discount_amount)
        tax_by_date[d]["tax_collected"] += o.tax_amount

    tax_breakdown = [
        {
            "date": v["date"],
            "taxable_sales": round(v["taxable_sales"], 2),
            "tax_collected": round(v["tax_collected"], 2)
        }
        for v in sorted(tax_by_date.values(), key=lambda x: x["date"])
    ]

    # 2. Payment Gateway Fee Deductions
    gateway_summaries = {}
    gateway_transactions = []
    total_gateway_fees = 0.0
    total_net_settlement = 0.0

    for gw_key, gw_info in GATEWAY_FEES.items():
        gateway_summaries[gw_key] = {
            "key": gw_key,
            "name": gw_info["name"],
            "rate_percent": round(gw_info["rate"] * 100, 1),
            "transaction_count": 0,
            "gross_volume": 0.0,
            "total_fees": 0.0,
            "net_settlement": 0.0
        }

    for o in orders:
        gw_key = o.payment_method.lower() if o.payment_method else "cod"
        rule = GATEWAY_FEES.get(gw_key, {"name": gw_key.upper(), "rate": 0.02, "fixed": 0.0})
        
        # Calculate fee based on amount if order is not cancelled
        fee = round(o.total_amount * rule["rate"] + rule.get("fixed", 0.0), 2) if o.status != "cancelled" else 0.0
        settlement = round(max(0.0, o.total_amount - fee), 2) if o.status != "cancelled" else 0.0

        if gw_key in gateway_summaries:
            gateway_summaries[gw_key]["transaction_count"] += 1
            if o.status != "cancelled":
                gateway_summaries[gw_key]["gross_volume"] += o.total_amount
                gateway_summaries[gw_key]["total_fees"] += fee
                gateway_summaries[gw_key]["net_settlement"] += settlement

        total_gateway_fees += fee
        total_net_settlement += settlement

        gateway_transactions.append({
            "order_number": o.order_number,
            "gateway_key": gw_key,
            "gateway_name": rule["name"],
            "transaction_id": o.tracking_number or f"TXN-{o.id:06d}",
            "amount": o.total_amount,
            "gateway_fee": fee,
            "net_settlement": settlement,
            "date": o.created_at.strftime("%Y-%m-%d %H:%M"),
            "payment_status": o.payment_status,
            "order_status": o.status
        })

    # 3. COGS vs. Gross Margins
    total_sales_revenue = sum(o.total_amount for o in valid_orders if o.status != "returned")
    order_ids = [o.id for o in valid_orders if o.status != "returned"]
    
    order_items = db.query(models.OrderItem).filter(
        models.OrderItem.order_id.in_(order_ids)
    ).all() if order_ids else []

    total_cogs = 0.0
    items_missing_cost = 0

    for item in order_items:
        # Determine cost price
        cost = item.cost_price
        if not cost or cost <= 0:
            prod = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            cost = prod.cost_price if prod and prod.cost_price else 0.0

        if cost <= 0:
            items_missing_cost += 1
            
        total_cogs += cost * item.quantity

    gross_profit = round(max(0.0, total_sales_revenue - total_cogs), 2)
    gross_margin_percentage = round((gross_profit / total_sales_revenue) * 100.0, 2) if total_sales_revenue > 0 else 0.0

    # 4. Refund Totals (Full vs Partial, Pending vs Processed)
    all_order_ids = [o.id for o in orders]
    returns = db.query(models.ReturnRequest).filter(
        models.ReturnRequest.order_id.in_(all_order_ids)
    ).all() if all_order_ids else []

    total_refund_amount = 0.0
    full_refunds_count = 0
    partial_refunds_count = 0
    pending_refunds_count = 0
    failed_refunds_count = 0
    refund_records = []

    for r in returns:
        order = db.query(models.Order).filter(models.Order.id == r.order_id).first()
        is_processed = (r.return_status == "refund_issued" or getattr(r, "refund_status", None) == "processed")
        
        if is_processed:
            total_refund_amount += r.refund_amount
            if order and r.refund_amount >= order.total_amount:
                full_refunds_count += 1
            else:
                partial_refunds_count += 1
        elif r.return_status == "requested" or getattr(r, "refund_status", None) == "pending":
            pending_refunds_count += 1
        elif r.return_status in ["rejected", "cancelled"]:
            failed_refunds_count += 1

        refund_records.append({
            "rma_id": r.id,
            "order_number": r.order_number,
            "customer_name": order.customer_name if order else "Customer",
            "payment_method": order.payment_method.upper() if order else "COD",
            "refund_amount": r.refund_amount,
            "order_total": order.total_amount if order else 0.0,
            "reason": r.reason,
            "return_status": r.return_status,
            "refund_status": getattr(r, "refund_status", "pending") or "pending",
            "date": str(r.created_at)[:16]
        })

    return {
        "period": period,
        "tax_liabilities": {
            "total_taxable_sales": round(total_taxable_sales, 2),
            "total_tax_collected": round(total_tax_collected, 2),
            "tax_liabilities": round(tax_liabilities, 2),
            "tax_refunded": round(tax_refunded, 2),
            "tax_breakdown_by_date": tax_breakdown
        },
        "payment_gateway_fees": {
            "total_gateway_fees": round(total_gateway_fees, 2),
            "total_net_settlement": round(total_net_settlement, 2),
            "gateway_summaries": list(gateway_summaries.values()),
            "recent_transactions": gateway_transactions[:25]
        },
        "cogs_and_margins": {
            "total_sales_revenue": round(total_sales_revenue, 2),
            "total_cogs": round(total_cogs, 2),
            "gross_profit": gross_profit,
            "gross_profit_margin_percentage": gross_margin_percentage,
            "items_missing_cost_count": items_missing_cost
        },
        "refund_totals": {
            "total_refund_amount": round(total_refund_amount, 2),
            "total_refunded_orders": full_refunds_count + partial_refunds_count,
            "full_refunds_count": full_refunds_count,
            "partial_refunds_count": partial_refunds_count,
            "pending_refunds_count": pending_refunds_count,
            "failed_refunds_count": failed_refunds_count,
            "refund_records": refund_records[:20]
        }
    }

@router.post("/financial-reports/export")
def export_financial_report_csv(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    """
    Exports financial transaction breakdown to CSV for compliance and accounting records.
    """
    period = data.get("period", "30d")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    start_dt, end_dt = parse_date_filters(period, start_date, end_date)

    orders = db.query(models.Order).filter(
        models.Order.created_at >= start_dt,
        models.Order.created_at <= end_dt
    ).order_by(desc(models.Order.created_at)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Order Number", "Order Date", "Customer Name", "Customer Phone",
        "Order Status", "Payment Method", "Payment Status",
        "Gross Subtotal (BDT)", "Discount (BDT)", "Tax (BDT)", "Shipping Fee (BDT)",
        "Net Order Total (BDT)", "Gateway Fee (BDT)", "Net Settlement (BDT)"
    ])

    for o in orders:
        gw = o.payment_method.lower() if o.payment_method else "cod"
        rule = GATEWAY_FEES.get(gw, {"rate": 0.02, "fixed": 0.0})
        fee = round(o.total_amount * rule["rate"], 2) if o.status != "cancelled" else 0.0
        settlement = round(max(0.0, o.total_amount - fee), 2) if o.status != "cancelled" else 0.0

        writer.writerow([
            o.order_number,
            o.created_at.strftime("%Y-%m-%d %H:%M"),
            o.customer_name,
            o.customer_phone,
            o.status,
            o.payment_method.upper(),
            o.payment_status,
            o.subtotal,
            o.discount_amount,
            o.tax_amount,
            o.shipping_fee,
            o.total_amount,
            fee,
            settlement
        ])

    csv_content = output.getvalue()

    # Log export for audit
    db.add(models.CustomerDataExportLog(
        exported_by=current_user.name,
        role=current_user.role,
        format="csv",
        record_count=len(orders),
        filter_applied=f"Financial Report ({period})"
    ))
    db.commit()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=sushop_financial_report_{datetime.date.today().isoformat()}.csv"}
    )

# ----------------- 3. FULFILLMENT METRICS -----------------
@router.get("/fulfillment-metrics")
def get_fulfillment_metrics(
    period: Optional[str] = "30d",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin", "operator"]))
):
    """
    Fulfillment Metrics:
    - Average Order Fulfillment Time (placement to fulfillment/shipment duration in hours & minutes)
    - Delivery Delay Warnings (orders exceeding SLA expected delivery timeline, auto-clearing upon delivery)
    - Return Rate Breakdown by Product Category (Units returned / Units sold * 100)
    """
    start_dt, end_dt = parse_date_filters(period, start_date, end_date)

    # 1. Average Order Fulfillment Time
    fulfilled_orders = db.query(models.Order).filter(
        models.Order.created_at >= start_dt,
        models.Order.created_at <= end_dt,
        models.Order.status.in_(["shipped", "delivered"])
    ).all()

    total_hours = 0.0
    measured_count = 0
    fulfillment_trends_map = {}

    for o in fulfilled_orders:
        # Check order logs for status transition to 'shipped' or 'delivered'
        ship_log = db.query(models.OrderLog).filter(
            models.OrderLog.order_id == o.id,
            models.OrderLog.to_status.in_(["shipped", "delivered"])
        ).order_by(asc(models.OrderLog.created_at)).first()

        completion_time = ship_log.created_at if ship_log else o.updated_at
        if completion_time and o.created_at:
            duration_hrs = max(0.1, (completion_time - o.created_at).total_seconds() / 3600.0)
            total_hours += duration_hrs
            measured_count += 1

            d_str = o.created_at.date().isoformat()
            if d_str not in fulfillment_trends_map:
                fulfillment_trends_map[d_str] = {"date": d_str, "total_hrs": 0.0, "count": 0}
            fulfillment_trends_map[d_str]["total_hrs"] += duration_hrs
            fulfillment_trends_map[d_str]["count"] += 1

    avg_hours = round(total_hours / measured_count, 1) if measured_count > 0 else 2.5
    avg_minutes_display = f"{int(avg_hours)}h {int((avg_hours % 1) * 60)}m"

    fulfillment_trends = [
        {
            "date": v["date"],
            "avg_hours": round(v["total_hrs"] / v["count"], 1)
        }
        for v in sorted(fulfillment_trends_map.values(), key=lambda x: x["date"])
    ]

    # 2. Delivery Delay Warnings
    # Active orders that are pending, payment confirmed, processing, packed, or shipped
    active_unfulfilled = db.query(models.Order).filter(
        models.Order.status.in_(["pending", "payment_confirmed", "processing_picking", "packed", "shipped"])
    ).order_by(asc(models.Order.created_at)).all()

    now = datetime.datetime.utcnow()
    delay_warnings = []
    
    # Standard supershop delivery SLA: 48 hours
    standard_sla_hours = 48.0

    for o in active_unfulfilled:
        elapsed_hours = (now - o.created_at).total_seconds() / 3600.0
        expected_delivery = o.created_at + datetime.timedelta(hours=standard_sla_hours)
        
        if elapsed_hours > standard_sla_hours:
            hours_overdue = elapsed_hours - standard_sla_hours
            days_delayed = round(hours_overdue / 24.0, 1)
            severity = "Critical" if days_delayed >= 3 else ("High" if days_delayed >= 1 else "Moderate")
            
            delay_warnings.append({
                "order_id": o.id,
                "order_number": o.order_number,
                "customer_name": o.customer_name,
                "customer_phone": auth.mask_pii(o.customer_phone, current_user.role),
                "courier_name": o.courier_name or "Steadfast Courier",
                "placed_at": o.created_at.strftime("%Y-%m-%d %H:%M"),
                "expected_delivery": expected_delivery.strftime("%Y-%m-%d %H:%M"),
                "current_status": o.status,
                "days_delayed": days_delayed,
                "severity": severity
            })

    # 3. Category-wise Return Rate
    categories = db.query(models.Category).all()
    category_return_rates = []

    # Get all returned order IDs
    returned_orders = db.query(models.Order).filter(models.Order.status == "returned").all()
    returned_order_ids = [ro.id for ro in returned_orders]

    for cat in categories:
        # Total units sold in category (non-cancelled)
        items_sold_count = (
            db.query(func.sum(models.OrderItem.quantity))
            .join(models.Product, models.OrderItem.product_id == models.Product.id)
            .join(models.Order, models.OrderItem.order_id == models.Order.id)
            .filter(
                models.Product.category_id == cat.id,
                models.Order.status != "cancelled",
                models.Order.created_at >= start_dt,
                models.Order.created_at <= end_dt
            )
            .scalar() or 0
        )

        # Total units returned in category
        items_returned_count = 0
        if returned_order_ids:
            items_returned_count = (
                db.query(func.sum(models.OrderItem.quantity))
                .join(models.Product, models.OrderItem.product_id == models.Product.id)
                .filter(
                    models.Product.category_id == cat.id,
                    models.OrderItem.order_id.in_(returned_order_ids)
                )
                .scalar() or 0
            )

        if items_sold_count > 0:
            rate = round((items_returned_count / items_sold_count) * 100.0, 2)
        else:
            rate = 0.0

        category_return_rates.append({
            "category_id": cat.id,
            "category_name": cat.name,
            "units_sold": int(items_sold_count),
            "units_returned": int(items_returned_count),
            "return_rate_percentage": rate
        })

    # Sort categories by units sold descending
    category_return_rates.sort(key=lambda x: x["units_sold"], reverse=True)

    return {
        "period": period,
        "average_fulfillment_time_hours": avg_hours,
        "average_fulfillment_time_display": avg_minutes_display,
        "total_fulfilled_orders": measured_count,
        "fulfillment_trends": fulfillment_trends,
        "delayed_orders_count": len(delay_warnings),
        "delivery_delay_warnings": delay_warnings,
        "category_return_rates": category_return_rates
    }

# ----------------- 4. VISITOR SESSION TRACKING -----------------
@router.post("/track-visit")
def track_site_visit(data: dict, db: Session = Depends(get_db)):
    """
    Storefront visitor tracking endpoint for genuine conversion rate analytics.
    """
    session_id = data.get("session_id", "anon")
    path = data.get("path", "/")
    
    visit = models.SiteVisit(
        session_id=session_id[:100],
        path=path[:255]
    )
    db.add(visit)
    db.commit()
    return {"status": "tracked"}
