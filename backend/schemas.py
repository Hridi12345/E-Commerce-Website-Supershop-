from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: Optional[str] = "customer"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    phone: Optional[str] = None
    address: Optional[str] = None
    segment_tag: Optional[str] = "Regular"
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CategorySchema(BaseModel):
    id: Optional[int] = None
    name: str
    slug: str
    parent_id: Optional[int] = None
    icon: Optional[str] = "shopping-bag"
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = True

class BrandSchema(BaseModel):
    id: Optional[int] = None
    name: str
    slug: str
    logo_url: Optional[str] = None
    description: Optional[str] = None

class VariantCreate(BaseModel):
    sku: str
    barcode: Optional[str] = None
    attributes_json: Dict[str, Any]
    price_override: Optional[float] = None
    cost_price_override: Optional[float] = None
    stock_quantity: int = 10
    image_url: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    slug: str
    sku: str
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    base_price: float
    cost_price: float = 0.0
    sale_price: Optional[float] = None
    tiered_b2b_pricing: Optional[List[Dict[str, Any]]] = []
    short_description: Optional[str] = None
    description: Optional[str] = None
    technical_specs: Optional[Dict[str, Any]] = {}
    images: Optional[List[str]] = []
    video_url: Optional[str] = None
    viewer_360_images: Optional[List[str]] = []
    downloadable_pdf: Optional[str] = None
    stock_indicator_type: Optional[str] = "in_stock"
    stock_quantity: Optional[int] = 50
    safety_stock_threshold: Optional[int] = 5
    is_active: Optional[bool] = True
    is_featured: Optional[bool] = False
    is_flash_sale: Optional[bool] = False
    flash_sale_discount_pct: Optional[float] = 0.0
    cross_sell_ids: Optional[List[int]] = []
    upsell_ids: Optional[List[int]] = []
    variants: Optional[List[VariantCreate]] = []

class OrderItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = 1
    unit_price: float
    product_name: str
    sku: str
    variant_details: Optional[str] = None

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    shipping_address: Dict[str, Any]
    billing_address: Optional[Dict[str, Any]] = None
    payment_method: str = "cod"
    coupon_code: Optional[str] = None
    items: List[OrderItemCreate]
    shipping_fee: float = 60.0
    notes: Optional[str] = None

class StockAdjustmentCreate(BaseModel):
    warehouse_id: int
    product_id: int
    variant_id: Optional[int] = None
    new_qty: int
    reason_code: str  # damage, return, recount, shrinkage
    notes: Optional[str] = None

class CouponValidateRequest(BaseModel):
    code: str
    cart_total: float
    category_ids: Optional[List[int]] = []

# ----------------- HERO BANNER SCHEMAS -----------------
class BannerBase(BaseModel):
    name: Optional[str] = None
    title: str
    subtitle: Optional[str] = None
    button_text: Optional[str] = "Shop Now"
    image_url: str
    link_url: Optional[str] = "/products"
    position: Optional[str] = "hero_slider"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = True
    display_order: Optional[int] = 0

class BannerCreate(BannerBase):
    pass

class BannerUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    button_text: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    position: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

class BannerStatusUpdate(BaseModel):
    is_active: bool

class BannerResponse(BannerBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


