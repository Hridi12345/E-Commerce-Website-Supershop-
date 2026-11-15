import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ArrowRight, Tag, ShieldCheck, ShoppingBag, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function MiniCartDrawer({ onNavigate }) {
  const {
    items,
    isMiniCartOpen,
    setIsMiniCartOpen,
    updateQuantity,
    modifyVariant,
    removeItem,
    clearCart,
    subtotal,
    freeShippingThreshold,
    freeShippingRemaining,
    shippingFee,
    taxAmount,
    totalAmount,
    coupon,
    couponError,
    discountAmount,
    applyCoupon,
    removeCoupon,
    abandonmentNotice,
    dismissAbandonmentNotice
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [applying, setApplying] = useState(false);
  const [editingVariantItem, setEditingVariantItem] = useState(null);

  if (!isMiniCartOpen) return null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplying(true);
    try {
      await applyCoupon(couponInput.trim());
      setCouponInput('');
    } catch {
      // Handled in context
    } finally {
      setApplying(false);
    }
  };

  const freeProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsMiniCartOpen(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Your Basket ({items.length} items)</h2>
            </div>
            <button
              onClick={() => setIsMiniCartOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Abandonment Trigger Notice */}
          {abandonmentNotice && (
            <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-start justify-between text-xs text-amber-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{abandonmentNotice}</span>
              </div>
              <button onClick={dismissAbandonmentNotice} className="text-amber-700 hover:text-amber-900 font-bold ml-2">
                ✕
              </button>
            </div>
          )}

          {/* Free Shipping Progress Meter */}
          <div className="p-3 bg-emerald-50/70 border-b border-emerald-100 text-xs">
            {freeShippingRemaining > 0 ? (
              <div>
                <p className="text-emerald-900 font-medium mb-1.5">
                  Add <span className="font-black text-emerald-700">৳{freeShippingRemaining.toFixed(0)}</span> more to get <span className="font-bold underline">FREE Express Delivery</span>!
                </p>
                <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${freeProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-emerald-800 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Congratulations! You qualified for Free Express Delivery!
              </p>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Your basket is empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Explore fresh organic produce, daily milk, pantry goods, and flash sale deals!
                </p>
                <button
                  onClick={() => { setIsMiniCartOpen(false); onNavigate('plp'); }}
                  className="mt-4 bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item, idx) => (
                <div key={`${item.product_id}-${item.variant_id || 'base'}`} className="py-3 flex gap-3">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">SKU: {item.sku}</p>
                    {item.variant_details && (
                      <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium mt-0.5">
                        {item.variant_details}
                      </span>
                    )}

                    {/* Line-item variant modification switcher */}
                    {item.all_variants && item.all_variants.length > 1 && (
                      <div className="mt-1">
                        <select
                          value={item.variant_id || ''}
                          onChange={(e) => {
                            const newV = item.all_variants.find(v => v.id === parseInt(e.target.value));
                            if (newV) modifyVariant(item.product_id, item.variant_id, newV);
                          }}
                          className="text-[10px] bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-slate-700 outline-none"
                        >
                          {item.all_variants.map(v => (
                            <option key={v.id} value={v.id}>
                              {Object.values(v.attributes || {}).join(' / ')} (৳{v.price_override || item.price})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                          className="p-1 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                          className="p-1 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900">
                          ৳{(item.price * item.quantity).toFixed(0)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(item.product_id, item.variant_id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Area */}
          {items.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              {/* Coupon Input */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. WELCOME10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none focus:border-emerald-500 uppercase font-semibold text-slate-800"
                  />
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <button
                  type="submit"
                  disabled={applying || !couponInput.trim()}
                  className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {applying ? 'Applying...' : 'Apply'}
                </button>
              </form>

              {coupon && (
                <div className="bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                  <span>Code <strong>{coupon.code}</strong> applied (-৳{coupon.calculated_discount})</span>
                  <button onClick={removeCoupon} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">
                    ✕
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
              )}

              {/* Order breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">৳{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Coupon Discount</span>
                    <span>-৳{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-800">
                    {shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `৳${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Govt. VAT (5%)</span>
                  <span className="font-semibold text-slate-800">৳{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-1.5">
                  <span>Estimated Total</span>
                  <span className="text-emerald-700">৳{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout CTAs */}
              <button
                onClick={() => {
                  setIsMiniCartOpen(false);
                  onNavigate('checkout');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsMiniCartOpen(false);
                  onNavigate('cart');
                }}
                className="w-full text-center text-xs font-semibold text-slate-600 hover:text-slate-900 py-1"
              >
                View Full Basket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

