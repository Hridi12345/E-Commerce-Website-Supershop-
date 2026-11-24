import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CreditCard, Wallet, Truck, CheckCircle2, 
  ArrowRight, ArrowLeft, Tag, AlertCircle, ShoppingBag, MapPin, Building2 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { BANGLADESH_CITIES } from '../../utils/locations';

export default function CheckoutPage({ onNavigate }) {
  const { items, subtotal, shippingFee, taxAmount, totalAmount, discountAmount, coupon, clearCart } = useCart();
  const { user } = useAuth();

  // Guest or Auth Checkout
  const [isGuest, setIsGuest] = useState(!user);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+880');

  // Address (Road, Building, City/Area) - Empty by default for customer input
  const [building, setBuilding] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('bkash'); // 'card', 'bkash', 'nagad', 'rocket', 'cod', 'bnpl'
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      api.getSavedAddresses().then(addrs => {
        setSavedAddresses(addrs || []);
        const def = (addrs || []).find(a => a.is_default) || (addrs || [])[0];
        if (def) {
          if (def.building) setBuilding(def.building);
          if (def.street) setStreet(def.street);
          if (def.city) setCity(def.city);
        }
      }).catch(() => {});
    }
  }, [user]);

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Your basket is empty</h2>
        <p className="text-xs text-slate-500 mt-1">Please add everyday items to checkout.</p>
        <button
          onClick={() => onNavigate('plp')}
          className="mt-4 bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer"
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !street.trim()) {
      setErrorMsg('Please complete all contact and delivery address details.');
      return;
    }

    setSubmitting(true);
    try {
      const fullAddress = `${building ? building.trim() + ', ' : ''}${street.trim()}, ${city}`;
      const payload = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_address: { 
          building: building.trim(),
          street: street.trim(), 
          city: city, 
          full_address: fullAddress,
          country: 'Bangladesh' 
        },
        payment_method: paymentMethod,
        coupon_code: coupon ? coupon.code : null,
        shipping_fee: shippingFee,
        notes: notes,
        items: items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.price,
          product_name: item.name,
          sku: item.sku,
          variant_details: item.variant_details
        }))
      };

      const res = await api.checkout(payload);
      setOrderSuccess(res);
      clearCart();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {orderSuccess ? (
        <div className="max-w-xl mx-auto bg-white rounded-lg p-8 border border-slate-200 shadow-xl text-center space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Order Confirmed
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Thank You For Your Order!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your order has been allocated and routed to our nearest Banani distribution hub.
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 text-xs text-left space-y-2 border border-slate-200">
            <div className="flex justify-between font-bold">
              <span className="text-slate-500">Order Number:</span>
              <span className="text-slate-900 font-mono text-sm">{orderSuccess.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Initial Status:</span>
              <span className="font-bold text-emerald-700 capitalize">{orderSuccess.status.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Billed:</span>
              <span className="font-black text-slate-900">৳{orderSuccess.total_amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tracking Code:</span>
              <span className="font-mono text-slate-800">{orderSuccess.tracking_number}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('portal', { tab: 'orders' })}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Track in Customer Portal
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Checkout Steps Form */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Express Checkout</h1>
              {!user && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Checkout Mode:</span>
                  <button
                    type="button"
                    onClick={() => setIsGuest(!isGuest)}
                    className="font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    {isGuest ? 'Guest Checkout (Active)' : 'Sign In'}
                  </button>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Contact Information */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Tahmid Rahman"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Phone Number (For Driver)</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+8801XXXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Email Address (Order Confirmation)</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="tahmid@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* 2. Shipping Address & Location */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  Delivery Address (Express 60-120 Min Fleet)
                </h3>
              </div>

              {/* Saved Address Selector */}
              {savedAddresses.length > 0 && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg space-y-1.5 text-xs">
                  <span className="font-bold text-emerald-900 text-[11px] block">Choose From Saved Addresses:</span>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          if (addr.building) setBuilding(addr.building);
                          if (addr.street) setStreet(addr.street);
                          if (addr.city) setCity(addr.city);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                          (building === addr.building && street === addr.street && city === addr.city)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <span className="font-bold block text-[11px]">{addr.full_name || addr.address_type}</span>
                        <span className="text-[10px] opacity-80 truncate max-w-[200px] block">
                          {addr.building ? addr.building + ', ' : ''}{addr.street}, {addr.city}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Building / House / Flat
                    </label>
                    <input
                      type="text"
                      required
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      placeholder="e.g. Flat 4B, Shanto Nibash, Holding 15"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Road / Street / Block
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. Road 11, Block D"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">City / Area / Neighborhood</label>
                    <select
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-bold text-slate-800"
                    >
                      <option value="" disabled>-- Select City / Area from Bangladesh --</option>
                      {BANGLADESH_CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Country</label>
                    <input
                      type="text"
                      disabled
                      value="Bangladesh"
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-500 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Delivery Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Please call when arriving at gate"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-medium placeholder:text-slate-400 placeholder:italic"
                  />
                </div>
              </div>
            </div>

            {/* 3. Payment Gateway Options */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                Select Payment Gateway
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'bkash', name: 'bKash Wallet', badge: '10% Cashback', desc: 'Instant mobile payment', logo: '/images/payments/bkash.png' },
                  { id: 'nagad', name: 'Nagad Wallet', badge: 'Zero Fee', desc: 'Post office digital wallet', logo: '/images/payments/nagad.png' },
                  { id: 'card', name: 'Debit / Credit Card', badge: 'SSLCommerz', desc: 'Visa, Master, Amex' },
                  { id: 'cod', name: 'Cash on Delivery', badge: 'Popular', desc: 'Pay at your doorstep' },
                  { id: 'bnpl', name: 'Buy Now Pay Later', badge: '0% Interest', desc: 'Pay in 3 installments' }
                ].map((gateway) => (
                  <label
                    key={gateway.id}
                    className={`p-3.5 rounded-lg border flex items-start gap-3 cursor-pointer transition-all ${
                      paymentMethod === gateway.id
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_gateway"
                      checked={paymentMethod === gateway.id}
                      onChange={() => setPaymentMethod(gateway.id)}
                      className="mt-1 accent-emerald-600"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{gateway.name}</span>
                          {gateway.logo && (
                            <img src={gateway.logo} alt={gateway.name} className="h-4 w-auto object-contain" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                          {gateway.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{gateway.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-4 rounded-lg shadow-xl shadow-emerald-200 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{submitting ? 'Allocating Inventory & Placing Order...' : `Place Order (৳${totalAmount})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Order Summary Breakdown Sidebar */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4 sticky top-24">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Order Summary Breakdown ({items.length} items)
              </h3>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={`${item.product_id}-${item.variant_id}`} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                        <span className="text-[10px] text-slate-400">Qty: {item.quantity} × ৳{item.price}</span>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 shrink-0">৳{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">৳{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount ({coupon?.code})</span>
                    <span>-৳{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="font-bold text-slate-900">
                    {shippingFee === 0 ? <span className="text-emerald-600">FREE</span> : `৳${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Govt. Tax / VAT (5%)</span>
                  <span className="font-bold text-slate-900">৳{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Payable</span>
                  <span className="text-emerald-700">৳{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Inventory is held strictly upon placing this order to prevent overselling.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

