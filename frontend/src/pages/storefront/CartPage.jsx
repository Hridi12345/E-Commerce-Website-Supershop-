import React, { useState } from 'react';
import { ShoppingCart, Trash2, ArrowRight, ArrowLeft, Tag, Truck, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartPage({ onNavigate }) {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    shippingFee,
    freeShippingThreshold,
    freeShippingRemaining,
    coupon,
    couponError,
    applyCoupon,
    removeCoupon,
    discountAmount,
    total
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    await applyCoupon(couponInput.trim());
    setApplyingCoupon(false);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-lg mx-auto flex items-center justify-center mb-4">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
          Explore our fresh groceries, organic produce, and daily household essentials delivered in minutes.
        </p>
        <button
          onClick={() => onNavigate && onNavigate('products')}
          className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-lg shadow-md shadow-emerald-600/20 cursor-pointer transition-colors inline-flex items-center gap-2"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Title & Free Shipping Indicator */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-0.5">Review your items and proceed to fast checkout</p>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('products')}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
        </button>
      </div>

      {/* Free Shipping Progress Bar */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-emerald-950 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-600" />
            {freeShippingRemaining > 0
              ? `Add ৳${freeShippingRemaining.toFixed(2)} more for FREE 2-Hour Delivery!`
              : '🎉 You have unlocked FREE Express Delivery!'}
          </span>
          <span>৳{freeShippingThreshold} Goal</span>
        </div>
        <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Items ({items.length})</span>
              <button
                onClick={clearCart}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
              >
                Clear Cart
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.variant_id}`} className="p-4 flex gap-4 items-center">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80'}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-100 shrink-0 bg-slate-50"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{item.name}</h3>
                    {item.variant_details && (
                      <p className="text-[11px] text-slate-500 font-medium">{item.variant_details}</p>
                    )}
                    <span className="text-xs font-black text-emerald-700 block mt-1">৳{item.price}</span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-lg px-2 py-1">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                      className="text-slate-600 hover:text-slate-900 font-bold px-1.5 cursor-pointer text-xs"
                    >
                      -
                    </button>
                    <span className="text-xs font-black w-6 text-center text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                      className="text-slate-600 hover:text-slate-900 font-bold px-1.5 cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>

                  {/* Item Subtotal */}
                  <div className="text-right w-20 shrink-0">
                    <span className="text-xs font-black text-slate-900 block">৳{(item.price * item.quantity).toFixed(2)}</span>
                    <button
                      onClick={() => removeItem(item.product_id, item.variant_id)}
                      className="text-rose-500 hover:text-rose-700 text-[11px] mt-0.5 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5 ml-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4 text-xs font-semibold">
            <h2 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">Order Summary</h2>

            {/* Subtotal */}
            <div className="flex justify-between text-slate-600">
              <span>Item Subtotal</span>
              <span className="font-bold text-slate-900">৳{subtotal.toFixed(2)}</span>
            </div>

            {/* Delivery Charge */}
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="font-bold text-slate-900">
                {shippingFee === 0 ? <span className="text-emerald-600 uppercase font-black text-[11px]">FREE</span> : `৳${shippingFee.toFixed(2)}`}
              </span>
            </div>

            {/* Coupon Discount */}
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Coupon ({coupon?.code})</span>
                <span className="font-bold">-৳{discountAmount.toFixed(2)}</span>
              </div>
            )}

            {/* Total */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm font-black">
              <span className="text-slate-900">Estimated Total</span>
              <span className="text-lg text-emerald-700">৳{total.toFixed(2)}</span>
            </div>

            {/* Coupon Form */}
            <div className="pt-2">
              {coupon ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> {coupon.code} applied!
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="text-rose-600 hover:text-rose-800 text-[11px] font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo / Coupon Code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs uppercase font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="submit"
                      disabled={applyingCoupon || !couponInput.trim()}
                      className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-lg text-xs cursor-pointer"
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {couponError}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => onNavigate && onNavigate('checkout')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-lg shadow-md shadow-emerald-600/20 text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Trust Badges */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Safe & Secure SSL Encrypted Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cash on Delivery, bKash, Nagad & Cards accepted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
