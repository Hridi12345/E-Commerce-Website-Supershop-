import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="customer", index=True)  # super_admin, admin, product_manager, order_manager, customer_support, operator, customer
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    segment_tag = Column(String(50), default="Regular")  # VIP, High Risk/Fraud, Inactive, Wholesale, Regular
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    wishlist_items = relationship("Wishlist", back_populates="user", cascade="all, delete-orphan")
    support_tickets = relationship("SupportTicket", back_populates="user")
    tag_assignments = relationship("CustomerTagAssignment", backref="user", cascade="all, delete-orphan")
    activity_logs = relationship("CustomerActivityLog", backref="user", cascade="all, delete-orphan")

class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    address_type = Column(String(50), default="shipping")  # shipping, billing
    full_name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    building = Column(String(150), nullable=True)  # Building / House name / Flat
    street = Column(String(255), nullable=False)    # Road / Street / Block
    city = Column(String(100), nullable=False)      # City / Area
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), default="Bangladesh")
    is_default = Column(Boolean, default=False)

    user = relationship("User", back_populates="addresses")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    icon = Column(String(100), default="shopping-bag")
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)

    parent = relationship("Category", remote_side=[id], backref="subcategories")
    products = relationship("Product", back_populates="category")

class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    logo_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)

    products = relationship("Product", back_populates="brand")

class Attribute(Base):
    __tablename__ = "attributes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # Size, Color, Weight/Pack, Material
    values_json = Column(Text, default="[]")  # e.g. ["500g", "1kg", "2kg"] or ["Red", "Blue"]

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    barcode = Column(String(100), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    
    # Pricing
    base_price = Column(Float, nullable=False, default=0.0)
    cost_price = Column(Float, nullable=False, default=0.0)  # COGS
    sale_price = Column(Float, nullable=True)  # Strike-through price
    tiered_b2b_pricing = Column(Text, default="[]")  # e.g. [{"min_qty": 10, "price": 450}, {"min_qty": 50, "price": 400}]
    promo_start = Column(DateTime, nullable=True)
    promo_end = Column(DateTime, nullable=True)

    # Details
    short_description = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)  # Rich text HTML
    technical_specs = Column(Text, default="{}")  # JSON dictionary of specs
    images = Column(Text, default="[]")  # JSON list of image URLs
    video_url = Column(String(500), nullable=True)
    viewer_360_images = Column(Text, default="[]")  # JSON list of 360 degree frame URLs
    downloadable_pdf = Column(String(500), nullable=True)

    # Status & Indicators
    stock_indicator_type = Column(String(50), default="in_stock")  # in_stock, low_stock, backorder
    stock_quantity = Column(Integer, default=50)
    safety_stock_threshold = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_flash_sale = Column(Boolean, default=False)
    flash_sale_discount_pct = Column(Float, default=0.0)

    # Recommendations
    cross_sell_ids = Column(Text, default="[]")  # Frequently Bought Together
    upsell_ids = Column(Text, default="[]")  # Related Products

    # Ratings
    rating_avg = Column(Float, default=5.0)
    reviews_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    category = relationship("Category", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
    qas = relationship("ProductQA", back_populates="product", cascade="all, delete-orphan")

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    barcode = Column(String(100), nullable=True)
    attributes_json = Column(Text, default="{}")  # e.g. {"Size": "1kg", "Flavor": "Original"}
    price_override = Column(Float, nullable=True)
    cost_price_override = Column(Float, nullable=True)
    stock_quantity = Column(Integer, default=20)
    reserved_quantity = Column(Integer, default=0)
    image_url = Column(String(500), nullable=True)

    product = relationship("Product", back_populates="variants")

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    address = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, default=0)
    reserved_quantity = Column(Integer, default=0)
    safety_stock_threshold = Column(Integer, default=5)

class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    previous_qty = Column(Integer, nullable=False)
    new_qty = Column(Integer, nullable=False)
    change_qty = Column(Integer, nullable=False)
    reason_code = Column(String(50), nullable=False)  # damage, return, recount, shrinkage
    notes = Column(Text, nullable=True)
    adjusted_by = Column(String(100), default="Admin")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class StockTransfer(Base):
    __tablename__ = "stock_transfers"

    id = Column(Integer, primary_key=True, index=True)
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(String(50), default="completed")  # pending, completed, cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for guest checkout
    customer_name = Column(String(150), nullable=False)
    customer_email = Column(String(150), nullable=False)
    customer_phone = Column(String(50), nullable=False)
    
    shipping_address_json = Column(Text, default="{}")
    billing_address_json = Column(Text, default="{}")

    # State Machine: Pending -> Payment Confirmed -> Processing/Picking -> Packed -> Shipped -> Delivered -> Cancelled/Returned
    status = Column(String(50), default="pending", index=True)
    
    payment_method = Column(String(50), default="cod")  # card, bkash, nagad, rocket, cod, bnpl
    payment_status = Column(String(50), default="pending")  # pending, paid, refunded, failed
    
    subtotal = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    coupon_code = Column(String(50), nullable=True)
    shipping_fee = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    
    tracking_number = Column(String(100), nullable=True)
    courier_name = Column(String(100), default="Steadfast / Pathao")
    live_tracking_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    logs = relationship("OrderLog", back_populates="order", cascade="all, delete-orphan")
    returns = relationship("ReturnRequest", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    product_name = Column(String(255), nullable=False)
    variant_details = Column(String(255), nullable=True)
    sku = Column(String(100), nullable=False)
    unit_price = Column(Float, nullable=False)
    cost_price = Column(Float, default=0.0)
    quantity = Column(Integer, default=1)
    total_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")

class OrderLog(Base):
    __tablename__ = "order_logs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    changed_by = Column(String(100), default="System")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="logs")

class ReturnRequest(Base):
    __tablename__ = "return_requests"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    order_number = Column(String(50), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    items_json = Column(Text, default="[]")
    reason = Column(String(255), nullable=False)
    return_status = Column(String(50), default="requested")  # requested, approved, rejected, refund_issued
    refund_status = Column(String(50), default="pending")  # pending, processed, declined
    refund_amount = Column(Float, default=0.0)
    restock_inventory = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="returns")

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    discount_type = Column(String(20), default="percentage")  # percentage, fixed
    discount_value = Column(Float, nullable=False)
    min_spend = Column(Float, default=0.0)
    max_discount = Column(Float, nullable=True)
    global_usage_limit = Column(Integer, default=1000)
    per_user_usage_limit = Column(Integer, default=1)
    times_used = Column(Integer, default=0)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    excluded_category_ids = Column(Text, default="[]")
    is_active = Column(Boolean, default=True)

class FlashSale(Base):
    __tablename__ = "flash_sales"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    banner_url = Column(String(500), nullable=True)
    discount_percentage = Column(Float, default=20.0)
    is_active = Column(Boolean, default=True)

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String(150), nullable=False)
    rating = Column(Integer, default=5)
    title = Column(String(255), nullable=True)
    comment = Column(Text, nullable=False)
    media_urls = Column(Text, default="[]")  # JSON list of photo URLs
    verified_purchase = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

class ProductQA(Base):
    __tablename__ = "product_qas"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String(150), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    answered_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="qas")

class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="wishlist_items")
    product = relationship("Product")

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String(150), nullable=False)
    customer_email = Column(String(150), nullable=False)
    subject = Column(String(255), nullable=False)
    category = Column(String(100), default="Order Inquiry")  # Order Inquiry, Delivery Delay, Refund/Return, Product Question
    priority = Column(String(20), default="medium")  # low, medium, high
    status = Column(String(20), default="open")  # open, in_progress, resolved, closed
    messages_json = Column(Text, default="[]")  # JSON list of message objects: [{sender, text, timestamp}]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="support_tickets")

class ContentPage(Base):
    __tablename__ = "content_pages"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    is_published = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Banner(Base):
    __tablename__ = "banners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)  # Internal banner name
    title = Column(String(255), nullable=False)  # Main Promotional Heading
    subtitle = Column(String(255), nullable=True)  # Supporting subtitle
    button_text = Column(String(100), default="Shop Now")  # CTA button label
    image_url = Column(String(500), nullable=False)
    link_url = Column(String(500), default="/products")
    position = Column(String(50), default="hero_slider")  # hero_slider, promo_bar, category_featured, sale_ribbon
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    excerpt = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    cover_image = Column(String(500), nullable=True)
    author = Column(String(100), default="SuShop Team")
    published_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_published = Column(Boolean, default=True)

class MediaAsset(Base):
    __tablename__ = "media_assets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    format = Column(String(20), default="webp")
    size_bytes = Column(Integer, default=0)
    alt_text = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value_json = Column(Text, nullable=False)

# ----------------- CRM & CUSTOMER TAGGING ENTITIES -----------------
class CustomerTag(Base):
    __tablename__ = "customer_tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    color = Column(String(50), default="emerald")
    description = Column(String(255), nullable=True)
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CustomerTagAssignment(Base):
    __tablename__ = "customer_tag_assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tag_name = Column(String(50), nullable=False)
    assigned_by = Column(String(100), default="Admin")
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow)

class CustomerActivityLog(Base):
    __tablename__ = "customer_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String(50), nullable=False)  # registration, order_placed, order_status_changed, return_requested, refund_processed, ticket_created, tag_assigned, tag_removed
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CustomerDataExportLog(Base):
    __tablename__ = "customer_data_export_logs"

    id = Column(Integer, primary_key=True, index=True)
    exported_by = Column(String(100), nullable=False)
    role = Column(String(50), default="admin")
    format = Column(String(20), default="csv")
    record_count = Column(Integer, default=0)
    filter_applied = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CustomerDeletionRequest(Base):
    __tablename__ = "customer_deletion_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_name = Column(String(150), nullable=False)
    customer_email = Column(String(150), nullable=False)
    reason = Column(String(255), nullable=True)
    status = Column(String(50), default="pending")  # pending, completed, rejected
    requested_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    processed_by = Column(String(100), nullable=True)

# ----------------- ANALYTICS & VISITOR TRACKING -----------------
class SiteVisit(Base):
    __tablename__ = "site_visits"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), index=True, nullable=False)
    path = Column(String(255), default="/")
    ip_hash = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

# ----------------- SECURITY & AUDIT TRAILS -----------------
class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    admin_name = Column(String(150), nullable=True)
    admin_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)  # update_role, change_status, refund_approval, settings_update, admin_login, etc.
    target_type = Column(String(100), nullable=True)  # order, user, product, setting, role
    target_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(150), index=True, nullable=False)  # email or IP
    portal_type = Column(String(50), default="customer")  # customer, admin
    is_success = Column(Boolean, default=False)
    ip_address = Column(String(100), nullable=True)
    attempt_time = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token_str = Column(String(500), unique=True, index=True, nullable=False)
    revoked_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)



