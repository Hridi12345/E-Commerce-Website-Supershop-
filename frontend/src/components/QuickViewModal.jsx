import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle, AlertTriangle, ShieldCheck, ShoppingCart, Heart, Truck, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function QuickViewModal({ productSlug, onClose, onNavigate }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (productSlug) {
      setLoading(true);
      api.getProduct(productSlug)
        .then(data => {
          setProduct(data);
          if (data.images && data.images.length > 0) setActiveImage(data.images[0]);
          if (data.variants && data.variants.length > 0) setSelectedVariant(data.variants[0]);
        })
        .finally(() => setLoading(false));
    }
  }, [productSlug]);

  if (!productSlug) return null;

  const currentPrice = selectedVariant?.price_override || product?.sale_price || product?.base_price || 0;
  const currentStock = selectedVariant ? selectedVariant.available_quantity : product?.stock_quantity || 0;

  const handleAddToCart = () => {
    if (!product) return;
    if (!user) {
      onClose();
      onNavigate('login');
      return;
    }
    addToCart(product, selectedVariant, quantity);
    onClose();
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    if (!user) {
      onClose();
      onNavigate('login');
      return;
    }
    toggleWishlist(product);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />

      <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 z-10 overflow-hidden animate-in fade-in duration-200 border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-24 text-center text-slate-500 font-medium">Loading product details...</div>
        ) : product ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Gallery */}
            <div>
              <div className="aspect-square rounded-lg bg-slate-100 overflow-hidden border border-slate-200 mb-3 relative">
                <img
                  src={activeImage || product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.is_flash_sale && (
                  <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase">
                    Save {product.flash_sale_discount_pct}%
                  </span>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`w-14 h-14 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                        activeImage === img ? 'border-emerald-600 scale-105' : 'border-slate-200 opacity-70'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Meta & Variant Selection */}
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
                  {product.category_name || 'Grocery & Essentials'}
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1.5 leading-snug">{product.name}</h2>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating_avg) ? 'fill-amber-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                  <span className="font-bold text-slate-800">{product.rating_avg}</span>
                  <span>({product.reviews_count} reviews)</span>
                  <span>•</span>
                  <span>SKU: {selectedVariant ? selectedVariant.sku : product.sku}</span>
                </div>
              </div>

              {/* Price & Stock Indicator */}
              <div className="flex items-baseline gap-3 pt-1 border-t border-slate-100">
                <span className="text-2xl font-black text-slate-900">৳{currentPrice}</span>
                {product.sale_price && (
                  <span className="text-sm text-slate-400 line-through">৳{product.base_price}</span>
                )}
                {product.is_flash_sale && (
                  <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200">
                    Flash Offer
                  </span>
                )}
              </div>

              {/* Description preview */}
              {product.description && (
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              )}

              {/* Stock status indicator */}
              <div>
                {currentStock <= 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md">
                    <AlertTriangle className="w-3.5 h-3.5" /> Backorder Available
                  </span>
                ) : currentStock <= 5 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md">
                    <AlertTriangle className="w-3.5 h-3.5" /> Only {currentStock} left in stock - order soon!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> In Stock for 60-Min Express Delivery
                  </span>
                )}
              </div>

              {/* Variant Picker (if product has variants) */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Select Option / Pack:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                          selectedVariant?.id === v.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        {Object.values(v.attributes || {}).join(' / ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity, Wishlist, and Add to Cart Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center gap-3">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-slate-200 rounded-md bg-slate-50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-l-md text-sm font-bold transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 text-sm font-bold text-slate-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-r-md text-sm font-bold transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-md shadow-xs transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>

                  {/* Wishlist Button in Modal */}
                  <button
                    onClick={handleToggleWishlist}
                    className={`p-2.5 rounded-md border transition-all cursor-pointer shadow-xs ${
                      isInWishlist(product.id)
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                    title={isInWishlist(product.id) ? "Remove from Wishlist" : "Save to Wishlist"}
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current text-rose-500' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Safe Checkout / Trust Notice */}
              <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-4">
                <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-emerald-600" /> Fast Doorstep Delivery</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Genuine</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
