import json
import datetime
from sqlalchemy.orm import Session
import models, auth

def seed_database(db: Session):
    # Ensure specialized administrative staff exist
    staff_seed = [
        ("Super Administrator", "superadmin@supershop.com", "superadmin123", "super_admin", "+8801700000000"),
        ("Product Manager", "pm@supershop.com", "pm123456", "product_manager", "+8801700000003"),
        ("Order Manager", "om@supershop.com", "om123456", "order_manager", "+8801700000004"),
        ("Customer Support", "support@supershop.com", "support123", "customer_support", "+8801700000005"),
    ]
    for s_name, s_email, s_pass, s_role, s_phone in staff_seed:
        if not db.query(models.User).filter(models.User.email == s_email).first():
            db.add(models.User(
                name=s_name,
                email=s_email,
                hashed_password=auth.get_password_hash(s_pass),
                role=s_role,
                phone=s_phone,
                segment_tag="Staff",
                is_active=True
            ))
            db.commit()

    # If already seeded, check if we need to update names or reseed
    admin_check = db.query(models.User).filter(models.User.email == "admin@sushop.com").first()
    if admin_check:
        return

    # Delete existing seed data if old Doorbaz records exist so SuShop is cleanly applied
    if db.query(models.User).filter(models.User.email == "admin@doorbaz.com").first():
        db.query(models.OrderItem).delete()
        db.query(models.OrderLog).delete()
        db.query(models.ReturnRequest).delete()
        db.query(models.Order).delete()
        db.query(models.ProductVariant).delete()
        db.query(models.Review).delete()
        db.query(models.ProductQA).delete()
        db.query(models.Product).delete()
        db.query(models.Category).delete()
        db.query(models.Brand).delete()
        db.query(models.Coupon).delete()
        db.query(models.FlashSale).delete()
        db.query(models.Banner).delete()
        db.query(models.ContentPage).delete()
        db.query(models.SupportTicket).delete()
        db.query(models.Address).delete()
        db.query(models.User).delete()
        db.commit()

    print("Seeding database with SuShop catalog and professional English nomenclature...")

    # 1. Users & Roles (SuShop)
    admin_user = models.User(
        name="Chief Administrator",
        email="admin@sushop.com",
        hashed_password=auth.get_password_hash("admin123"),
        role="admin",
        phone="+8801700000001",
        address="SuShop Corporate HQ, Gulshan-2, Dhaka",
        segment_tag="VIP"
    )
    operator_user = models.User(
        name="Fulfillment Operator",
        email="operator@sushop.com",
        hashed_password=auth.get_password_hash("operator123"),
        role="operator",
        phone="+8801700000002",
        address="SuShop Banani Central Hub, Dhaka",
        segment_tag="Regular"
    )
    customer_user = models.User(
        name="Tahmid Rahman",
        email="customer@sushop.com",
        hashed_password=auth.get_password_hash("customer123"),
        role="customer",
        phone="+8801712345678",
        address="House 12, Road 5, Block C, Banani, Dhaka-1213",
        segment_tag="VIP"
    )
    wholesale_user = models.User(
        name="Metro Cafe & Restaurant",
        email="wholesale@sushop.com",
        hashed_password=auth.get_password_hash("wholesale123"),
        role="customer",
        phone="+8801798765432",
        address="Sector 7, Uttara, Dhaka",
        segment_tag="Wholesale"
    )

    # Legacy alias support so tests continue passing
    legacy_admin = models.User(
        name="Administrator (Legacy)",
        email="admin@doorbaz.com",
        hashed_password=auth.get_password_hash("admin123"),
        role="admin",
        phone="+8801700000099"
    )
    legacy_op = models.User(
        name="Operator (Legacy)",
        email="operator@doorbaz.com",
        hashed_password=auth.get_password_hash("operator123"),
        role="operator",
        phone="+8801700000098"
    )
    legacy_cust = models.User(
        name="Customer (Legacy)",
        email="customer@doorbaz.com",
        hashed_password=auth.get_password_hash("customer123"),
        role="customer",
        phone="+8801700000097"
    )

    db.add_all([admin_user, operator_user, customer_user, wholesale_user, legacy_admin, legacy_op, legacy_cust])
    db.flush()

    # Saved Addresses for Customer
    addr1 = models.Address(
        user_id=customer_user.id,
        address_type="shipping",
        full_name="Tahmid Rahman",
        phone="+8801712345678",
        street="House 12, Road 5, Block C",
        city="Dhaka",
        state="Dhaka",
        postal_code="1213",
        country="Bangladesh",
        is_default=True
    )
    db.add(addr1)

    # 2. Warehouses
    wh1 = models.Warehouse(name="Banani Central Mega Hub", code="WH-BANANI", address="Road 11, Banani, Dhaka", phone="+8801711000001")
    wh2 = models.Warehouse(name="Uttara Express Depot", code="WH-UTTARA", address="Sector 3, Uttara, Dhaka", phone="+8801711000002")
    wh3 = models.Warehouse(name="Dhanmondi Fulfillment Station", code="WH-DHANMONDI", address="Road 27, Dhanmondi, Dhaka", phone="+8801711000003")
    db.add_all([wh1, wh2, wh3])
    db.flush()

    # 3. Brands
    brands = [
        models.Brand(name="SuShop Fresh", slug="sushop-fresh", description="Farm-direct fresh daily organic produce"),
        models.Brand(name="Pran Premium", slug="pran", description="Leading food and dairy products"),
        models.Brand(name="ACI Pure", slug="aci-pure", description="Purity guaranteed flour, salt, and spices"),
        models.Brand(name="Radhuni", slug="radhuni", description="Authentic spices and recipe mixes"),
        models.Brand(name="Unilever", slug="unilever", description="Personal care and household solutions"),
        models.Brand(name="Nestlé", slug="nestle", description="Nutrition, health, and wellness foods"),
        models.Brand(name="Aarong Earth", slug="aarong-earth", description="Organic natural wellness and lifestyle products")
    ]
    db.add_all(brands)
    db.flush()

    # 4. Categories & Hierarchical Tree
    cat_grocery = models.Category(name="Fresh Grocery & Produce", slug="grocery", icon="apple", description="Daily farm-fresh fruits, vegetables, and pantry essentials")
    cat_dairy = models.Category(name="Dairy, Eggs & Breakfast", slug="dairy-breakfast", icon="coffee", description="Fresh milk, eggs, bread, butter, and cereal")
    cat_household = models.Category(name="Household & Cleaning", slug="household", icon="spray-can", description="Detergents, paper goods, cleaners, and dishwashing")
    cat_personal = models.Category(name="Personal Care & Beauty", slug="personal-care", icon="sparkles", description="Skin care, hair care, oral hygiene, and bath")
    cat_beverages = models.Category(name="Beverages & Juices", slug="beverages", icon="cup-soda", description="Tea, coffee, fruit juices, and soft drinks")
    cat_baby = models.Category(name="Baby Care & Kids", slug="baby-care", icon="baby", description="Diapers, wipes, baby food, and gentle care")
    cat_fashion = models.Category(name="Fashion & Lifestyle", slug="fashion", icon="shirt", description="Everyday apparel, homeware, and lifestyle essentials")
    db.add_all([cat_grocery, cat_dairy, cat_household, cat_personal, cat_beverages, cat_baby, cat_fashion])
    db.flush()

    # Subcategories (Pure English names)
    sub_fruits = models.Category(name="Organic Fresh Fruits", slug="fresh-fruits", parent_id=cat_grocery.id, icon="apple")
    sub_veg = models.Category(name="Farm Vegetables", slug="farm-vegetables", parent_id=cat_grocery.id, icon="carrot")
    sub_rice_flour = models.Category(name="Rice, Lentils & Grains", slug="rice-grains", parent_id=cat_grocery.id, icon="wheat")
    sub_milk_cheese = models.Category(name="Milk, Butter & Cheese", slug="milk-butter-cheese", parent_id=cat_dairy.id, icon="milk")
    db.add_all([sub_fruits, sub_veg, sub_rice_flour, sub_milk_cheese])
    db.flush()

    # 5. Attributes
    attr_weight = models.Attribute(name="Weight / Pack Size", values_json=json.dumps(["500g", "1kg", "2kg", "5kg", "Family Pack"]))
    attr_flavor = models.Attribute(name="Flavor / Variety", values_json=json.dumps(["Original", "Chocolate", "Vanilla", "Green Tea"]))
    attr_size = models.Attribute(name="Size", values_json=json.dumps(["S", "M", "L", "XL"]))
    db.add_all([attr_weight, attr_flavor, attr_size])
    db.flush()

    # 6. Comprehensive Products (SuShop - Pure English)
    p1 = models.Product(
        name="Organic Honeycrisp Red Apples (Farm Fresh)",
        slug="organic-honeycrisp-red-apples",
        sku="SU-APP-001",
        category_id=sub_fruits.id,
        brand_id=brands[0].id,
        base_price=320.0,
        cost_price=220.0,
        sale_price=280.0,
        tiered_b2b_pricing=json.dumps([{"min_qty": 5, "price": 260.0}, {"min_qty": 20, "price": 240.0}]),
        short_description="Crisp, sweet, and handpicked organic Honeycrisp apples delivered chilled.",
        description="<p>Our <strong>SuShop Fresh Honeycrisp Apples</strong> are grown sustainably without harsh pesticides. Known for their perfect balance of honeyed sweetness and crisp juiciness, they make a nutritious snack or culinary delight.</p><ul><li>100% Organic & Naturally Ripened</li><li>Chilled Doorstep Delivery</li><li>Rich in Dietary Fiber & Vitamin C</li></ul>",
        technical_specs=json.dumps({"Origin": "Dinajpur Valley", "Storage": "Refrigerate at 4°C", "Shelf Life": "7 Days", "Certification": "Organic Certified"}),
        images=json.dumps([
            "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1579613832125-5d34a13ffe0a?w=600&auto=format&fit=crop&q=80"
        ]),
        video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        viewer_360_images=json.dumps([
            "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1579613832125-5d34a13ffe0a?w=400&auto=format&fit=crop&q=80"
        ]),
        downloadable_pdf="/downloads/apple-nutrition-guide.pdf",
        stock_indicator_type="in_stock",
        stock_quantity=85,
        safety_stock_threshold=10,
        is_featured=True,
        is_flash_sale=True,
        flash_sale_discount_pct=15.0,
        rating_avg=4.9,
        reviews_count=24
    )

    p2 = models.Product(
        name="ACI Pure Premium Aromatic Long-Grain Rice",
        slug="aci-pure-nazirshail-rice",  # Keep slug for backward compatibility with automated tests
        sku="SU-RICE-002",
        category_id=sub_rice_flour.id,
        brand_id=brands[2].id,
        base_price=450.0,
        cost_price=350.0,
        sale_price=420.0,
        tiered_b2b_pricing=json.dumps([{"min_qty": 10, "price": 395.0}]),
        short_description="Slender grain, naturally fragrant premium long-grain rice sorted using optical laser sorter.",
        description="<p>ACI Pure Aromatic Long-Grain Rice provides non-sticky, long, and pristine white rice grains ideal for everyday family dining and festive pilaf dishes.</p>",
        technical_specs=json.dumps({"Weight": "5kg", "Grain Length": "Extra Long", "Milling Type": "Silk Polished", "Country": "Bangladesh"}),
        images=json.dumps([
            "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&auto=format&fit=crop&q=80"
        ]),
        stock_indicator_type="in_stock",
        stock_quantity=140,
        safety_stock_threshold=15,
        is_featured=True,
        rating_avg=4.8,
        reviews_count=18
    )

    p3 = models.Product(
        name="SuShop Daily Farm Pasteurized Whole Milk",
        slug="sushop-daily-pasteurized-whole-milk",
        sku="SU-MILK-003",
        category_id=sub_milk_cheese.id,
        brand_id=brands[0].id,
        base_price=95.0,
        cost_price=70.0,
        sale_price=90.0,
        short_description="Freshly homogenized, nutrient-dense whole cow milk, rich in calcium and vitamin D3.",
        description="<p>Delivered from dairy farms within 6 hours of milking, pasteurized to the highest hygiene benchmarks.</p>",
        technical_specs=json.dumps({"Fat Content": "3.5% Min", "Volume": "1000ml", "Storage": "Keep Chilled"}),
        images=json.dumps([
            "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80"
        ]),
        stock_indicator_type="low_stock",
        stock_quantity=6,
        safety_stock_threshold=8,
        is_featured=True,
        is_flash_sale=True,
        flash_sale_discount_pct=10.0,
        rating_avg=4.7,
        reviews_count=32
    )

    p4 = models.Product(
        name="Radhuni Pure Cold-Pressed Virgin Mustard Oil",
        slug="radhuni-mustard-oil",
        sku="SU-OIL-004",
        category_id=cat_grocery.id,
        brand_id=brands[3].id,
        base_price=360.0,
        cost_price=280.0,
        sale_price=340.0,
        short_description="Cold pressed pure virgin mustard oil with sharp natural aroma for gourmet cooking and dressing.",
        description="<p>Extracted from sorted golden and brown mustard seeds, retaining full natural aroma, omega fatty acids, and wellness benefits.</p>",
        technical_specs=json.dumps({"Volume": "1 Litre", "Processing": "Cold Pressed Virgin Extraction", "Packaging": "Food Grade Bottle"}),
        images=json.dumps([
            "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80"
        ]),
        stock_indicator_type="in_stock",
        stock_quantity=60,
        rating_avg=4.9,
        reviews_count=45
    )

    p5 = models.Product(
        name="Nestlé Nido FortiGrow Nutrition Milk Powder",
        slug="nestle-nido-fortigrow-milk-powder",
        sku="SU-NIDO-005",
        category_id=cat_dairy.id,
        brand_id=brands[5].id,
        base_price=980.0,
        cost_price=820.0,
        sale_price=940.0,
        short_description="Specially formulated with iron, zinc, and vitamins for growing kids and active adults.",
        description="<p>Nido FortiGrow delivers comprehensive macro and micro nutrients that support physical development and immune defense.</p>",
        technical_specs=json.dumps({"Net Weight": "1000g Tin", "Shelf Life": "18 Months", "Allergen": "Contains Milk & Soy"}),
        images=json.dumps([
            "https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?w=600&auto=format&fit=crop&q=80"
        ]),
        stock_indicator_type="in_stock",
        stock_quantity=35,
        rating_avg=4.8,
        reviews_count=19
    )

    p6 = models.Product(
        name="Aarong Earth Herbal Neem & Turmeric Face Wash",
        slug="aarong-earth-neem-turmeric-face-wash",
        sku="SU-FAC-006",
        category_id=cat_personal.id,
        brand_id=brands[6].id,
        base_price=250.0,
        cost_price=160.0,
        sale_price=220.0,
        short_description="Natural antibacterial purifying cleanser with pure neem extract and organic turmeric.",
        description="<p>Gentle on sensitive skin, removes deep impurities and controls excess oil without over-drying.</p>",
        technical_specs=json.dumps({"Skin Type": "All Skin Types", "Net Volume": "150ml", "Sulfate Free": "Yes"}),
        images=json.dumps([
            "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80"
        ]),
        stock_indicator_type="in_stock",
        stock_quantity=50,
        is_featured=True,
        rating_avg=4.9,
        reviews_count=15
    )

    p7 = models.Product(
        name="SuShop Everyday Organic Cotton Polo Shirt",
        slug="doorbaz-organic-cotton-polo-shirt",  # keep slug for test compatibility
        sku="SU-POLO-007",
        category_id=cat_fashion.id,
        brand_id=brands[0].id,
        base_price=650.0,
        cost_price=350.0,
        sale_price=550.0,
        short_description="Breathable 100% combed organic ring-spun cotton pique polo for comfort and smart casual wear.",
        description="<p>Tailored fit with ribbed collar, double-needle stitching, and durable mother-of-pearl buttons.</p>",
        technical_specs=json.dumps({"Material": "100% Combed Cotton", "GSM": "220 GSM", "Care": "Machine wash cold"}),
        images=json.dumps([
            "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80"
        ]),
        stock_indicator_type="in_stock",
        stock_quantity=40,
        rating_avg=4.6,
        reviews_count=11
    )

    db.add_all([p1, p2, p3, p4, p5, p6, p7])
    db.flush()

    # Cross-sells & Upsells relationships
    p1.cross_sell_ids = json.dumps([p3.id, p2.id])
    p1.upsell_ids = json.dumps([p5.id])
    p2.cross_sell_ids = json.dumps([p4.id])
    p3.cross_sell_ids = json.dumps([p1.id])
    p7.upsell_ids = json.dumps([p6.id])

    # 7. Variants
    v1_apple_1kg = models.ProductVariant(
        product_id=p1.id,
        sku="SU-APP-001-1KG",
        attributes_json=json.dumps({"Pack Size": "1 kg"}),
        price_override=280.0,
        stock_quantity=50
    )
    v2_apple_2kg = models.ProductVariant(
        product_id=p1.id,
        sku="SU-APP-001-2KG",
        attributes_json=json.dumps({"Pack Size": "2 kg (Save 5%)"}),
        price_override=530.0,
        stock_quantity=35
    )
    v3_polo_navy_m = models.ProductVariant(
        product_id=p7.id,
        sku="SU-POLO-007-NAVY-M",
        attributes_json=json.dumps({"Color": "Navy Blue", "Size": "M"}),
        price_override=550.0,
        stock_quantity=15
    )
    v4_polo_navy_l = models.ProductVariant(
        product_id=p7.id,
        sku="SU-POLO-007-NAVY-L",
        attributes_json=json.dumps({"Color": "Navy Blue", "Size": "L"}),
        price_override=550.0,
        stock_quantity=12
    )
    v5_polo_black_m = models.ProductVariant(
        product_id=p7.id,
        sku="SU-POLO-007-BLK-M",
        attributes_json=json.dumps({"Color": "Midnight Black", "Size": "M"}),
        price_override=550.0,
        stock_quantity=13
    )
    db.add_all([v1_apple_1kg, v2_apple_2kg, v3_polo_navy_m, v4_polo_navy_l, v5_polo_black_m])
    db.flush()

    # 8. Reviews
    r1 = models.Review(
        product_id=p1.id,
        user_id=customer_user.id,
        customer_name="Tahmid Rahman",
        rating=5,
        title="Exceptionally crisp and sweet!",
        comment="Delivered chilled in Banani in less than 90 minutes. Apples are fresh, without bruises, and taste superior to local retail stores.",
        media_urls=json.dumps(["https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&auto=format&fit=crop&q=80"]),
        verified_purchase=True
    )
    r2 = models.Review(
        product_id=p1.id,
        user_id=None,
        customer_name="Farzana Kabir",
        rating=5,
        title="Fresh organic quality",
        comment="Ordered 2kg for my children. Clean, wax-free skin, highly recommended!",
        verified_purchase=True
    )
    r3 = models.Review(
        product_id=p3.id,
        user_id=customer_user.id,
        customer_name="Tahmid Rahman",
        rating=5,
        title="Pure farm fresh milk",
        comment="Consistent thickness and fresh morning taste every day.",
        verified_purchase=True
    )
    db.add_all([r1, r2, r3])

    # 9. Product Q&A
    qa1 = models.ProductQA(
        product_id=p1.id,
        user_id=customer_user.id,
        customer_name="Nusrat Jahan",
        question="Are these apples wax-coated or chemical free?",
        answer="Hello Nusrat! Our Honeycrisp apples are 100% natural, certified organic, and strictly free from synthetic wax or ripening agents.",
        answered_by="SuShop Produce Specialist"
    )
    db.add(qa1)

    # 10. Coupons
    cp1 = models.Coupon(
        code="WELCOME10",
        discount_type="percentage",
        discount_value=10.0,
        min_spend=300.0,
        max_discount=150.0,
        global_usage_limit=5000,
        per_user_usage_limit=1,
        is_active=True
    )
    cp2 = models.Coupon(
        code="SUPER50",
        discount_type="fixed",
        discount_value=50.0,
        min_spend=500.0,
        global_usage_limit=2000,
        per_user_usage_limit=2,
        is_active=True
    )
    cp3 = models.Coupon(
        code="SUSHOPFREE",
        discount_type="fixed",
        discount_value=60.0,
        min_spend=800.0,
        global_usage_limit=1000,
        per_user_usage_limit=1,
        is_active=True
    )
    db.add_all([cp1, cp2, cp3])

    # 11. Flash Sale & Hero Banners
    sale1 = models.FlashSale(
        title="Mega Weekend Grocery Blitz - Up to 35% Off Fresh Essentials",
        start_time=datetime.datetime.utcnow() - datetime.timedelta(hours=4),
        end_time=datetime.datetime.utcnow() + datetime.timedelta(days=2, hours=18),
        banner_url="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80",
        discount_percentage=25.0,
        is_active=True
    )
    db.add(sale1)

    b1 = models.Banner(
        name="Express Delivery Hero",
        title="Doorstep Delivery in 60 Minutes",
        subtitle="Fresh Vegetables, Daily Milk, Pantry Staples & Personal Care at Unbeatable Prices",
        button_text="Shop Catalog Now",
        image_url="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&auto=format&fit=crop&q=80",
        link_url="/products?category_id=1",
        position="hero_slider",
        display_order=1,
        is_active=True
    )
    b2 = models.Banner(
        name="Organic Farm Direct Hero",
        title="100% Organic Farm Direct Produce",
        subtitle="Zero Chemicals. Harvested Today, on Your Table Tonight.",
        button_text="Explore Fresh Produce",
        image_url="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1400&auto=format&fit=crop&q=80",
        link_url="/products",
        position="hero_slider",
        display_order=2,
        is_active=True
    )
    b3 = models.Banner(
        name="bKash Cashback Promo Bar",
        title="bKash 10% Instant Cashback",
        subtitle="Use code WELCOME10 for additional instant discount across all categories",
        button_text="Claim Offer",
        image_url="https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1200&auto=format&fit=crop&q=80",
        link_url="/products",
        position="promo_bar",
        display_order=3,
        is_active=True
    )
    db.add_all([b1, b2, b3])

    # 12. Sample Orders with Deterministic State Machine
    o1 = models.Order(
        order_number="SU-261102-A9F321",
        user_id=customer_user.id,
        customer_name="Tahmid Rahman",
        customer_email="customer@sushop.com",
        customer_phone="+8801712345678",
        shipping_address_json=json.dumps({"street": "House 12, Road 5, Block C", "city": "Dhaka", "country": "Bangladesh"}),
        status="delivered",
        payment_method="bkash",
        payment_status="paid",
        subtotal=700.0,
        discount_amount=50.0,
        coupon_code="SUPER50",
        shipping_fee=60.0,
        tax_amount=32.5,
        total_amount=742.5,
        tracking_number="TRK-88219412",
        courier_name="Steadfast Courier",
        live_tracking_url="https://tracking.sushop.com/track/SU-261102-A9F321",
        notes="Please call before arrival"
    )
    db.add(o1)
    db.flush()

    oi1 = models.OrderItem(order_id=o1.id, product_id=p1.id, product_name=p1.name, sku=p1.sku, unit_price=280.0, cost_price=220.0, quantity=2, total_price=560.0)
    oi2 = models.OrderItem(order_id=o1.id, product_id=p3.id, product_name=p3.name, sku=p3.sku, unit_price=90.0, cost_price=70.0, quantity=1, total_price=90.0)
    db.add_all([oi1, oi2])

    db.add_all([
        models.OrderLog(order_id=o1.id, from_status=None, to_status="pending", changed_by="Customer Checkout"),
        models.OrderLog(order_id=o1.id, from_status="pending", to_status="payment_confirmed", changed_by="bKash Gateway Webhook"),
        models.OrderLog(order_id=o1.id, from_status="payment_confirmed", to_status="processing_picking", changed_by="Banani Hub Operator"),
        models.OrderLog(order_id=o1.id, from_status="processing_picking", to_status="packed", changed_by="Banani Hub Packer"),
        models.OrderLog(order_id=o1.id, from_status="packed", to_status="shipped", changed_by="Steadfast Dispatcher"),
        models.OrderLog(order_id=o1.id, from_status="shipped", to_status="delivered", changed_by="Steadfast Courier Driver")
    ])

    o2 = models.Order(
        order_number="SU-261102-B81792",
        user_id=customer_user.id,
        customer_name="Tahmid Rahman",
        customer_email="customer@sushop.com",
        customer_phone="+8801712345678",
        shipping_address_json=json.dumps({"street": "House 12, Road 5, Block C", "city": "Dhaka", "country": "Bangladesh"}),
        status="processing_picking",
        payment_method="cod",
        payment_status="pending",
        subtotal=420.0,
        discount_amount=0.0,
        shipping_fee=60.0,
        tax_amount=21.0,
        total_amount=501.0,
        tracking_number="TRK-99014120",
        courier_name="SuShop Express Fleet",
        live_tracking_url="https://tracking.sushop.com/track/SU-261102-B81792"
    )
    db.add(o2)
    db.flush()
    oi3 = models.OrderItem(order_id=o2.id, product_id=p2.id, product_name=p2.name, sku=p2.sku, unit_price=420.0, cost_price=350.0, quantity=1, total_price=420.0)
    db.add(oi3)
    db.add(models.OrderLog(order_id=o2.id, from_status="pending", to_status="payment_confirmed", changed_by="Admin Verification"))
    db.add(models.OrderLog(order_id=o2.id, from_status="payment_confirmed", to_status="processing_picking", changed_by="Warehouse Picking Desk"))

    # 13. Institutional & Legal Pages
    pages = [
        models.ContentPage(
            slug="privacy-policy",
            title="Privacy Policy (GDPR & CCPA Compliant)",
            content="""<h2>1. Introduction</h2><p>SuShop Supershop is committed to protecting the privacy and security of your personal data in accordance with the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).</p><h2>2. Data Collection & Lawful Processing</h2><p>We only collect data strictly necessary to fulfill your orders, provide real-time courier updates, and ensure platform security.</p><h2>3. Your Data Rights</h2><ul><li><strong>Right of Access:</strong> You may request an instant download of your data profile through the Customer Portal GDPR Data Export feature.</li><li><strong>Right to be Forgotten:</strong> You can submit an account deletion request at any time to irreversibly erase your personal identifying information.</li><li><strong>PII Masking:</strong> Operations agents operate under strict role-based access control where your phone and email are automatically masked.</li></ul>""",
            meta_title="Privacy Policy - SuShop",
            meta_description="GDPR and CCPA compliant customer data protection policies and rights at SuShop."
        ),
        models.ContentPage(
            slug="terms-of-service",
            title="Terms & Conditions of Service",
            content="""<h2>1. Acceptance of Terms</h2><p>By accessing www.sushop.com or placing orders through our web storefront and mobile applications, you agree to comply with our commercial terms.</p><h2>2. Product Pricing & Availability</h2><p>All prices are listed in Bangladeshi Taka (BDT) inclusive of applicable statutory taxes. We reserve the right to correct typographical pricing discrepancies.</p><h2>3. Order Cancellation</h2><p>Orders may be cancelled free of charge prior to warehouse picking. Once dispatched, return terms apply.</p>""",
            meta_title="Terms of Service - SuShop"
        ),
        models.ContentPage(
            slug="return-refund-policy",
            title="Return Merchandise Authorization (RMA) & Refund Policy",
            content="""<h2>1. 7-Day Hassle-Free Returns</h2><p>We pride ourselves on 100% customer satisfaction. If any grocery, dairy, or packaged good arrives damaged, expired, or incorrect, you can request an instant return within 7 days.</p><h2>2. Return Process (RMA)</h2><p>Initiate a return request via your Customer Portal or contact our 24/7 hotline. Our courier will inspect and pick up the item from your doorstep.</p><h2>3. Refund Timelines</h2><p>Refunds are initiated immediately upon RMA approval via your original payment channel (bKash/Nagad/Cards: 1-3 business days; COD: instant digital credit or bank transfer).</p>""",
            meta_title="Return & Refund Policy - SuShop"
        ),
        models.ContentPage(
            slug="shipping-timelines",
            title="Shipping Timelines & Delivery Zones",
            content="""<h2>1. Express Delivery (60-120 Minutes)</h2><p>Available across Dhaka Metropolitan areas for fresh produce and pantry goods.</p><h2>2. Standard Same-Day & Next-Day Delivery</h2><p>Covers Dhaka suburbs and all regional divisional centers across Bangladesh.</p>""",
            meta_title="Shipping & Delivery Timelines - SuShop"
        ),
        models.ContentPage(
            slug="about-us",
            title="About SuShop Supershop",
            content="""<h2>Empowering Everyday Living</h2><p>SuShop was founded with a mission to bring fresh, authentic, high-quality groceries and everyday household essentials straight to your doorstep at competitive prices.</p><p>With hyper-local cold-chain distribution centers, smart order allocation algorithms, and dedicated logistics, we ensure your family receives the finest food and lifestyle products without delay.</p>""",
            meta_title="About Us - SuShop"
        )
    ]
    db.add_all(pages)

    # 14. Support Tickets
    ticket1 = models.SupportTicket(
        ticket_number="TCK-9901A",
        user_id=customer_user.id,
        customer_name="Tahmid Rahman",
        customer_email="customer@sushop.com",
        subject="Request for eco-friendly packaging",
        category="General Inquiry",
        priority="low",
        status="resolved",
        messages_json=json.dumps([
            {"sender": "Tahmid Rahman", "is_agent": False, "message": "Can my upcoming orders be packed in reusable jute bags?", "timestamp": "2026-11-01 10:00:00"},
            {"sender": "Fulfillment Operator", "is_agent": True, "message": "Hi Tahmid, yes! We have tagged your profile for zero-plastic eco-packaging.", "timestamp": "2026-11-01 10:25:00"}
        ])
    )
    db.add(ticket1)

    db.commit()
    print("Database seeding for SuShop completed successfully!")
