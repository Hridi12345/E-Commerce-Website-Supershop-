import sqlite3
import datetime
from database import engine, Base, SessionLocal
import models

def migrate():
    print("Migrating schema for CRM and Addresses...")
    
    # 1. Create any missing tables using Base.metadata.create_all
    Base.metadata.create_all(bind=engine)
    
    # 2. Check if building column exists in addresses
    con = sqlite3.connect("backend/supershop.db")
    cur = con.cursor()
    columns = [row[1] for row in cur.execute("PRAGMA table_info(addresses)").fetchall()]
    if "building" not in columns:
        print("Adding 'building' column to 'addresses' table...")
        cur.execute("ALTER TABLE addresses ADD COLUMN building VARCHAR(150)")
        con.commit()
    con.close()

    # 3. Seed default customer tags if not present
    db = SessionLocal()
    try:
        default_tags = [
            {"name": "VIP", "color": "purple", "description": "High spending valued customers meeting VIP threshold", "is_system": True},
            {"name": "High Risk/Fraud", "color": "rose", "description": "Flagged for payment disputes or fraudulent patterns", "is_system": True},
            {"name": "Inactive", "color": "slate", "description": "No purchase activity in the past 60+ days", "is_system": True},
            {"name": "Wholesale", "color": "blue", "description": "B2B commercial bulk buyers", "is_system": True},
            {"name": "Regular", "color": "emerald", "description": "Standard active retail consumers", "is_system": True},
            {"name": "New Customer", "color": "teal", "description": "Recently registered account", "is_system": False}
        ]
        for t in default_tags:
            existing = db.query(models.CustomerTag).filter(models.CustomerTag.name == t["name"]).first()
            if not existing:
                db.add(models.CustomerTag(**t))
        db.commit()

        # 4. Sync existing users tags and activity logs
        users = db.query(models.User).filter(models.User.role == "customer").all()
        for u in users:
            # Check tag assignment
            tag_name = u.segment_tag or "Regular"
            has_tag = db.query(models.CustomerTagAssignment).filter(
                models.CustomerTagAssignment.user_id == u.id,
                models.CustomerTagAssignment.tag_name == tag_name
            ).first()
            if not has_tag:
                db.add(models.CustomerTagAssignment(
                    user_id=u.id,
                    tag_name=tag_name,
                    assigned_by="System Rule Engine"
                ))
            
            # Initial activity log for registration
            has_reg_log = db.query(models.CustomerActivityLog).filter(
                models.CustomerActivityLog.user_id == u.id,
                models.CustomerActivityLog.activity_type == "registration"
            ).first()
            if not has_reg_log:
                db.add(models.CustomerActivityLog(
                    user_id=u.id,
                    activity_type="registration",
                    title="Account Created",
                    description=f"{u.name} registered account with email {u.email}",
                    created_at=u.created_at or datetime.datetime.utcnow()
                ))
            
            # Add logs for existing orders
            orders = db.query(models.Order).filter(models.Order.user_id == u.id).all()
            for o in orders:
                has_order_log = db.query(models.CustomerActivityLog).filter(
                    models.CustomerActivityLog.user_id == u.id,
                    models.CustomerActivityLog.activity_type == "order_placed",
                    models.CustomerActivityLog.title == f"Order {o.order_number} Placed"
                ).first()
                if not has_order_log:
                    db.add(models.CustomerActivityLog(
                        user_id=u.id,
                        activity_type="order_placed",
                        title=f"Order {o.order_number} Placed",
                        description=f"Placed order {o.order_number} totaling ৳{o.total_amount} via {o.payment_method}",
                        created_at=o.created_at or datetime.datetime.utcnow()
                    ))
        db.commit()
        print("Migration and initial CRM seeding completed successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()

