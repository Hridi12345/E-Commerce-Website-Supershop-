import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, MapPin, Heart, ShieldAlert, MessageSquare,
  RotateCcw, Download, Trash2, Send, ExternalLink, Plus, CheckCircle2, Clock, 
  LayoutDashboard, User, Key, Star, Tag, Eye, ChevronRight, Building2, Truck, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../api';
import { BANGLADESH_CITIES } from '../../utils/locations';

export default function CustomerPortalPage({ initialTab = 'overview', onNavigate }) {
  const { user, login, register, logout } = useAuth();
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [profileData, setProfileData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Order Inquiry');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrBuilding, setAddrBuilding] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState(BANGLADESH_CITIES[0]);
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Order Details Modal
  const [inspectOrder, setInspectOrder] = useState(null);

  // Auth form state if not logged in
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');

  // RMA request modal
  const [rmaOrderNumber, setRmaOrderNumber] = useState(null);
  const [rmaReason, setRmaReason] = useState('');
  const [rmaSuccess, setRmaSuccess] = useState(false);

  // Live courier tracking modal
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);

  // Unauthenticated visitor tabs & guest order tracking state
  const [unauthSubTab, setUnauthSubTab] = useState(() => {
    if (initialTab === 'coupons') return 'coupons';
    if (initialTab === 'guest-track' || initialTab === 'track') return 'track';
    return 'account';
  });
  const [guestOrderQuery, setGuestOrderQuery] = useState('');
  const [guestOrderData, setGuestOrderData] = useState(null);
  const [guestOrderLoading, setGuestOrderLoading] = useState(false);
  const [guestOrderError, setGuestOrderError] = useState('');

  useEffect(() => {
    // Always load active coupons for public and authenticated customer viewing
    api.getAvailableCoupons().then(c => setCoupons(c || [])).catch(() => {});
    if (user) {
      loadPortalData();
    }
  }, [user, activeTab]);

  const handleTrackGuestOrder = async (e) => {
    e.preventDefault();
    if (!guestOrderQuery.trim()) return;
    setGuestOrderLoading(true);
    setGuestOrderError('');
    setGuestOrderData(null);
    try {
      const res = await api.getOrderDetail(guestOrderQuery.trim());
      setGuestOrderData(res);
    } catch (err) {
      setGuestOrderError(err.message || 'Order not found. Please verify the order number (e.g. DRB-261112-...)');
    } finally {
      setGuestOrderLoading(false);
    }
  };

  const loadPortalData = () => {
    api.getMyProfile().then(p => {
      setProfileData(p);
      setEditName(p.name || '');
      setEditPhone(p.phone || '');
    }).catch(() => {});
    api.getMyOrders().then(o => setOrders(o || [])).catch(() => {});
    api.getSavedAddresses().then(a => setAddresses(a || [])).catch(() => {});
    api.getWishlist().then(w => setWishlist(w || [])).catch(() => {});
    api.getMyReviews().then(r => setReviews(r || [])).catch(() => {});
    api.getAvailableCoupons().then(c => setCoupons(c || [])).catch(() => {});
    api.getSupportTickets().then(t => setTickets(t || [])).catch(() => {});
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegisterMode) {
        await register({ name: authName, email: authEmail, password: authPassword, phone: authPhone });
      } else {
        const loggedUser = await login(authEmail, authPassword);
        if (loggedUser && (loggedUser.role === 'admin' || loggedUser.role === 'operator')) {
          onNavigate('admin');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    try {
      await api.updateMyProfile({ name: editName, phone: editPhone });
      setProfileSuccessMsg('Profile information updated successfully!');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
      loadPortalData();
    } catch (err) {
      setProfileErrorMsg(err.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: '', isError: false });
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match!', isError: true });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters long.', isError: true });
      return;
    }
    try {
      await api.changeMyPassword(currentPassword, newPassword);
      setPasswordMsg({ text: 'Password successfully updated!', isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg({ text: '', isError: false }), 3500);
    } catch (err) {
      setPasswordMsg({ text: err.message || 'Password update failed', isError: true });
    }
  };

  const handleOpenAddressModal = (addr = null) => {
    if (addr) {
      setEditingAddressId(addr.id);
      setAddrFullName(addr.full_name || '');
      setAddrPhone(addr.phone || '');
      setAddrBuilding(addr.building || '');
      setAddrStreet(addr.street || '');
      setAddrCity(addr.city || BANGLADESH_CITIES[0]);
      setAddrIsDefault(Boolean(addr.is_default));
    } else {
      setEditingAddressId(null);
      setAddrFullName(user?.name || '');
      setAddrPhone(user?.phone || '');
      setAddrBuilding('');
      setAddrStreet('');
      setAddrCity(BANGLADESH_CITIES[0]);
      setAddrIsDefault(addresses.length === 0);
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        full_name: addrFullName,
        phone: addrPhone,
        building: addrBuilding,
        street: addrStreet,
        city: addrCity,
        is_default: addrIsDefault
      };
      if (editingAddressId) {
        await api.updateSavedAddress(editingAddressId, payload);
      } else {
        await api.saveAddress(payload);
      }
      setShowAddressModal(false);
      loadPortalData();
    } catch (err) {
      alert(err.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm("Are you sure you want to remove this saved delivery address?")) {
      try {
        await api.deleteSavedAddress(id);
        loadPortalData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleRepeatOrder = async (orderNumber) => {
    try {
      const res = await api.repeatOrder(orderNumber);
      if (res.items) {
        res.items.forEach(itm => {
          addToCart({ id: itm.product_id, name: itm.name, sku: itm.sku, sale_price: itm.unit_price, base_price: itm.unit_price }, null, itm.quantity);
        });
        onNavigate('checkout');
      }
    } catch {
      alert('Could not prepare repeat order.');
    }
  };

  const handleRequestRMA = async (e) => {
    e.preventDefault();
    if (!rmaOrderNumber || !rmaReason.trim()) return;
    try {
      await api.requestRMA({ order_number: rmaOrderNumber, reason: rmaReason });
      setRmaSuccess(true);
      setTimeout(() => {
        setRmaOrderNumber(null);
        setRmaReason('');
        setRmaSuccess(false);
      }, 2000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) return;
    try {
      await api.createSupportTicket({
        subject: newTicketSubject,
        category: newTicketCategory,
        message: newTicketMessage
      });
      setShowNewTicketModal(false);
      setNewTicketSubject('');
      setNewTicketMessage('');
      loadPortalData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReply.trim()) return;
    try {
      const res = await api.replySupportTicket(selectedTicket.ticket_number, { message: ticketReply });
      setSelectedTicket({ ...selectedTicket, messages: res.messages });
      setTicketReply('');
      loadPortalData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGDPRDownload = async () => {
    try {
      const data = await api.gdprExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sushop_gdpr_export_${user.email}.json`;
      a.click();
    } catch {
      alert('Failed to generate GDPR export.');
    }
  };

  const handleGDPRDelete = async () => {
    if (window.confirm("WARNING: Are you sure you want to delete your account? All identifying data will be permanently wiped according to GDPR/CCPA regulations.")) {
      try {
        await api.gdprDelete();
        logout();
        onNavigate('home');
        alert('Your account and personal data have been completely erased.');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        {/* Customer Guidance Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-400/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Guest Browsing & Ordering is Always Open
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              SuShop Customer Services
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-normal">
              You do <strong>not</strong> need to log in to browse products, add items to your cart, or place an order.
              Anyone can order freely as a guest! If you would like to track your past orders or unlock and view your activated offers and discount coupons, you can open an account or sign in below.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
            <ShoppingBag className="w-72 h-72 text-white" />
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-100 p-1.5 rounded-2xl max-w-lg mx-auto text-xs font-bold">
          <button
            onClick={() => setUnauthSubTab('account')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              unauthSubTab === 'account' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-emerald-600" />
            <span>Open Account / Sign In</span>
          </button>
          <button
            onClick={() => setUnauthSubTab('coupons')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              unauthSubTab === 'coupons' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Active Offers ({coupons.length})</span>
          </button>
          <button
            onClick={() => setUnauthSubTab('track')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              unauthSubTab === 'track' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Track Guest Order</span>
          </button>
        </div>

        {/* ================= TAB 1: OPTIONAL ACCOUNT CREATION / SIGN IN ================= */}
        {unauthSubTab === 'account' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Why Open a SuShop Account?
              </h3>
              <ul className="text-xs text-slate-600 space-y-3 font-medium">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Order History:</strong> View every order you have placed with detailed item lists and invoices.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Activated Offers:</strong> Access member-only coupons and automatic discount eligibility.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>1-Click Checkout:</strong> Save multiple delivery addresses (Home, Office, Parents) for instant ordering.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Saved Wishlist:</strong> Bookmark fresh favorites to reorder whenever you need them.</span>
                </li>
              </ul>
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => onNavigate('plp')}
                  className="w-full text-center text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  Continue Shopping as Guest →
                </button>
              </div>
            </div>

            <div className="md:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-lg space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {isRegisterMode ? 'Open a Customer Account' : 'Sign In to Your Account'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {isRegisterMode ? 'Takes 15 seconds. No credit card required.' : 'Access your personal order records and activated offers.'}
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
                {isRegisterMode && (
                  <>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-medium"
                        placeholder="Tahmid Rahman"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-medium"
                        placeholder="+8801700000000"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-medium"
                    placeholder="customer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-medium"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer shadow-md shadow-emerald-200 mt-2"
                >
                  {isRegisterMode ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  {isRegisterMode ? 'Already have an account? ' : "Want to open a new account? "}
                </span>
                <button
                  onClick={() => { setIsRegisterMode(!isRegisterMode); setAuthError(''); }}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  {isRegisterMode ? 'Sign In Here' : 'Register Free'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ACTIVATED OFFERS & COUPONS ================= */}
        {unauthSubTab === 'coupons' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-600" /> Active Offers & Promotional Coupons
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Copy any active code below and paste it in your cart or checkout to apply instant discounts!
                </p>
              </div>
              <button
                onClick={() => onNavigate('plp')}
                className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-700 cursor-pointer self-start sm:self-auto"
              >
                Shop Now With Offer →
              </button>
            </div>

            {coupons.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Tag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                No active promo codes right now. Please check back soon!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((c, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-5 rounded-2xl border border-emerald-200 text-xs space-y-2 relative shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-2xl font-black text-emerald-950">
                          {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `৳${c.discount_value} OFF`}
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Min. spend: <strong>৳{c.min_spend}</strong>
                        </p>
                      </div>
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-emerald-200/60">
                      <span className="font-mono font-black text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-xs">
                        {c.code}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(c.code);
                          alert(`Coupon "${c.code}" copied to clipboard! Paste it at checkout to apply.`);
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: INSTANT GUEST ORDER TRACKING ================= */}
        {unauthSubTab === 'track' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" /> Instant Order Tracker
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Placed an order as a guest? Enter your Order Number below to check live delivery updates without logging in.
              </p>
            </div>

            <form onSubmit={handleTrackGuestOrder} className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <input
                type="text"
                required
                value={guestOrderQuery}
                onChange={(e) => setGuestOrderQuery(e.target.value)}
                placeholder="e.g. DRB-261112-855097"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none font-mono uppercase focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={guestOrderLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-xs cursor-pointer transition-colors shrink-0 disabled:opacity-50"
              >
                {guestOrderLoading ? 'Tracking...' : 'Track Order'}
              </button>
            </form>

            {guestOrderError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {guestOrderError}
              </div>
            )}

            {guestOrderData && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 animate-fade-in text-xs">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Order Number</span>
                    <h3 className="text-sm font-black text-slate-900 font-mono">{guestOrderData.order_number}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Current Status</span>
                    <div className="font-black text-emerald-700 capitalize text-sm">
                      {guestOrderData.status ? guestOrderData.status.replace('_', ' ') : 'Processing'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-medium">Recipient</span>
                    <span className="font-bold text-slate-800">{guestOrderData.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Tracking Code</span>
                    <span className="font-bold font-mono text-slate-800">{guestOrderData.tracking_number || 'TRK-PENDING'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Payment</span>
                    <span className="font-bold text-slate-800 uppercase">{guestOrderData.payment_method} ({guestOrderData.payment_status})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Total Billed</span>
                    <span className="font-black text-slate-900">৳{guestOrderData.total_amount}</span>
                  </div>
                </div>

                {guestOrderData.items && guestOrderData.items.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-700 block mb-2">Ordered Items ({guestOrderData.items.length})</span>
                    <div className="space-y-1.5">
                      {guestOrderData.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200/60">
                          <span className="font-semibold text-slate-800">{it.product_name} × {it.quantity}</span>
                          <span className="font-black text-slate-900">৳{it.total_price || it.unit_price * it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Account Profile Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-emerald-900/50">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{user.name}</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-mono">
                {profileData?.segment_tag || 'Customer'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{user.email} • {user.phone || 'No phone set'}</p>
            <p className="text-[11px] text-emerald-400 mt-1">
              Member since {profileData?.member_since ? profileData.member_since.slice(0, 10) : '2026'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGDPRDownload}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Download personal data under GDPR"
          >
            <Download className="w-4 h-4" /> GDPR Data
          </button>
          <button
            onClick={() => { logout(); onNavigate('home'); }}
            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold no-scrollbar">
        {[
          { id: 'overview', label: 'Account Overview', icon: LayoutDashboard },
          { id: 'orders', label: `My Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'profile', label: 'My Profile & Password', icon: User },
          { id: 'addresses', label: `My Addresses (${addresses.length})`, icon: MapPin },
          { id: 'wishlist', label: `My Wishlist (${wishlist.length})`, icon: Heart },
          { id: 'reviews', label: `My Reviews (${reviews.length})`, icon: Star },
          { id: 'coupons', label: `My Coupons (${coupons.length})`, icon: Tag },
          { id: 'tickets', label: `Support Tickets (${tickets.length})`, icon: MessageSquare },
          { id: 'privacy', label: 'Privacy & GDPR', icon: ShieldAlert }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= 1. ACCOUNT OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Lifetime Orders</span>
              <p className="text-2xl font-black text-slate-900">{orders.length}</p>
              <span className="text-[11px] text-emerald-600 font-semibold">Active customer</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Spend (LTV)</span>
              <p className="text-2xl font-black text-emerald-700">৳{profileData?.ltv || 0}</p>
              <span className="text-[11px] text-slate-500">Verified purchases</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Saved Wishlist Items</span>
              <p className="text-2xl font-black text-slate-900">{wishlist.length}</p>
              <button onClick={() => setActiveTab('wishlist')} className="text-[11px] text-emerald-700 hover:underline font-bold">
                View items →
              </button>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Saved Addresses</span>
              <p className="text-2xl font-black text-slate-900">{addresses.length}</p>
              <button onClick={() => setActiveTab('addresses')} className="text-[11px] text-emerald-700 hover:underline font-bold">
                Manage addresses →
              </button>
            </div>
          </div>

          {/* Recent Orders & Default Address Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-900">Recent Order Activity</h3>
                <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer">
                  View All Orders →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  No orders placed yet. Start shopping to view order tracking here!
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.slice(0, 3).map((o) => (
                    <div key={o.order_number} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900">#{o.order_number}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                            o.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {o.status?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">{o.date?.slice(0, 10)} • {o.items_count} items</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 block text-sm">৳{o.total_amount}</span>
                        <button
                          onClick={() => setInspectOrder(o)}
                          className="text-[11px] text-emerald-700 hover:underline font-bold cursor-pointer"
                        >
                          Details & Tracking
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Snapshot */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900">Default Shipping Info</h3>
              {addresses.find(a => a.is_default) || addresses[0] ? (
                (() => {
                  const def = addresses.find(a => a.is_default) || addresses[0];
                  return (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-900 block">{def.full_name}</span>
                      <p className="text-slate-600">
                        {def.building ? def.building + ', ' : ''}{def.street}
                      </p>
                      <p className="text-emerald-700 font-bold">{def.city}, Bangladesh</p>
                      <p className="text-slate-500 font-mono pt-1">{def.phone}</p>
                    </div>
                  );
                })()
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  <p>No address saved yet.</p>
                  <button
                    onClick={() => handleOpenAddressModal()}
                    className="mt-2 text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    + Add New Address
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer text-center"
                >
                  Edit Profile & Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. MY ORDERS & DETAILS ================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-900">Your Orders & Fulfillment ({orders.length})</h2>
            <button
              onClick={() => onNavigate('plp')}
              className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer hover:bg-emerald-700"
            >
              Continue Shopping
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.order_number} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-500">Order:</span>{' '}
                      <span className="font-mono font-black text-slate-900 text-sm">{o.order_number}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-slate-500">{o.date?.slice(0, 10)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        o.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {o.status?.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => setInspectOrder(o)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        View Order Details
                      </button>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="divide-y divide-slate-100 text-xs">
                    {o.items.map((it, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{it.name}</p>
                          <p className="text-slate-400 text-[11px]">Qty: {it.quantity} × ৳{it.unit_price}</p>
                        </div>
                        <span className="font-bold text-slate-900">৳{(it.quantity * it.unit_price).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500">Total:</span>{' '}
                      <span className="font-black text-emerald-700 text-base">৳{o.total_amount}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTrackingModalOrder(o)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" /> Live Courier Tracking
                      </button>
                      <button
                        onClick={() => handleRepeatOrder(o.order_number)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Re-Order Cart
                      </button>
                      <button
                        onClick={() => setRmaOrderNumber(o.order_number)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Request Return
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= 3. MY PROFILE & CHANGE PASSWORD ================= */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Profile Details Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" /> My Profile Information
            </h3>
            
            {profileSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {profileSuccessMsg}
              </div>
            )}
            {profileErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {profileErrorMsg}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors mt-2"
              >
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-600" /> Change Account Password
            </h3>

            {passwordMsg.text && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                passwordMsg.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {passwordMsg.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your existing password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors mt-2"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= 4. MY ADDRESSES (ROAD, BUILDING, CITY) ================= */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900">Saved Shipping & Delivery Addresses</h2>
              <p className="text-xs text-slate-500">Configure building, road, and city area details for express delivery</p>
            </div>
            <button
              onClick={() => handleOpenAddressModal()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add New Address
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {addresses.map((a) => (
              <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs relative flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded text-[10px]">
                      {a.address_type} Address
                    </span>
                    {a.is_default && (
                      <span className="font-bold text-emerald-600 text-[10px] bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                  <h4 className="font-black text-slate-900 text-sm pt-1">{a.full_name}</h4>
                  {a.building && (
                    <p className="text-slate-700 font-semibold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {a.building}
                    </p>
                  )}
                  <p className="text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {a.street}
                  </p>
                  <p className="text-emerald-700 font-bold pl-4">{a.city}, Bangladesh</p>
                  <p className="text-slate-500 font-mono pl-4">{a.phone}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => handleOpenAddressModal(a)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(a.id)}
                    className="text-rose-600 hover:text-rose-800 font-bold px-2 py-1 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 5. MY WISHLIST ================= */}
      {activeTab === 'wishlist' && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900">My Saved Wishlist ({wishlist.length})</h2>
          {wishlist.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Your wishlist is currently empty.</p>
              <button
                onClick={() => onNavigate('plp')}
                className="mt-3 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Discover Fresh Items
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {wishlist.map((w) => (
                <div key={w.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs flex flex-col justify-between">
                  <div>
                    <img
                      src={w.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'}
                      alt={w.name}
                      className="w-full aspect-square rounded-xl object-cover bg-slate-100 mb-2"
                    />
                    <h4 className="font-bold text-slate-900 line-clamp-1">{w.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-black text-emerald-700">৳{w.sale_price || w.base_price}</span>
                      {w.sale_price && <span className="text-slate-400 line-through text-[11px]">৳{w.base_price}</span>}
                    </div>
                  </div>

                  <div className="pt-2 space-y-1.5">
                    <button
                      onClick={() => {
                        addToCart({ id: w.product_id, name: w.name, sku: 'WISH', sale_price: w.sale_price, base_price: w.base_price });
                        alert('Added to cart!');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-xs cursor-pointer shadow-xs"
                    >
                      Add to Basket
                    </button>
                    <button
                      onClick={() => onNavigate('pdp', { slug: w.slug })}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 rounded-lg text-xs cursor-pointer"
                    >
                      View Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= 6. MY REVIEWS ================= */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900">My Product Reviews & Ratings ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              You haven't written any product reviews yet. Share your experience after receiving orders!
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{r.product_name}</span>
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <h5 className="font-bold text-slate-800">{r.title}</h5>
                  <p className="text-slate-600">{r.comment}</p>
                  <span className="text-[10px] text-slate-400 block">{r.created_at?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= 7. MY COUPONS ================= */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900">Available Coupons & Offers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {coupons.map((c, idx) => (
              <div key={idx} className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200 text-xs space-y-2 relative overflow-hidden">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-black text-emerald-900">
                    {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `৳${c.discount_value} FLAT`}
                  </span>
                  <Tag className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-slate-600 text-[11px]">Minimum spend required: ৳{c.min_spend}</p>
                <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60">
                  <span className="font-mono font-black text-emerald-800 bg-white px-2 py-1 rounded-md border border-emerald-300">
                    {c.code}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(c.code);
                      alert(`Copied coupon code ${c.code} to clipboard!`);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Copy Code
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 8. SUPPORT TICKETS ================= */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-900">Customer Support Tickets</h2>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" /> Open New Ticket
            </button>
          </div>

          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-700">#{t.ticket_number}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900">{t.subject}</h4>
                <p className="text-slate-500 text-[11px]">Category: {t.category} • Priority: {t.priority}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 9. PRIVACY & GDPR ================= */}
      {activeTab === 'privacy' && (
        <div className="max-w-2xl bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Privacy & GDPR Rights</h2>
            <p className="text-xs text-slate-500">Under global data protection regulations, you have full ownership of your data.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">1. Data Portability</h4>
              <p className="text-slate-600">Download a complete machine-readable archive containing all your personal details, order records, and support interactions.</p>
              <button
                onClick={handleGDPRDownload}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Export Personal Data Archive
              </button>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
              <h4 className="font-bold text-rose-900">2. Right to Erasure ("Right to be Forgotten")</h4>
              <p className="text-rose-700">Permanently erase your customer record and identity from our system. Completed past orders will be anonymized for financial compliance.</p>
              <button
                onClick={handleGDPRDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                Delete My Customer Account Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADDRESS MODAL (ROAD, BUILDING, CITY) ================= */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
              <button onClick={() => setShowAddressModal(false)} className="text-slate-400 font-bold p-1">✕</button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Recipient Full Name</label>
                <input
                  type="text"
                  required
                  value={addrFullName}
                  onChange={(e) => setAddrFullName(e.target.value)}
                  placeholder="e.g. Tahmid Rahman"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  placeholder="e.g. +880 1711-223344"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Building / House / Flat
                </label>
                <input
                  type="text"
                  required
                  value={addrBuilding}
                  onChange={(e) => setAddrBuilding(e.target.value)}
                  placeholder="e.g. Flat 4B, Shanto Nibash, Holding 15"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Road / Street / Block
                </label>
                <input
                  type="text"
                  required
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  placeholder="e.g. Road 12, Block C, Section 6"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">City / Delivery Area</label>
                <select
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-800"
                >
                  {BANGLADESH_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="addrDefault"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="addrDefault" className="text-slate-700 font-bold">
                  Set as my primary default delivery address
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-xs"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ORDER DETAILS MODAL ================= */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 my-8 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Order #{inspectOrder.order_number}</h3>
                <span className="text-slate-500 text-[11px]">{inspectOrder.date?.slice(0, 10)}</span>
              </div>
              <button onClick={() => setInspectOrder(null)} className="text-slate-400 font-bold p-1">✕</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Fulfillment Status</span>
                <span className="font-bold text-emerald-700 uppercase">{inspectOrder.status?.replace('_', ' ')}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Method</span>
                <span className="font-bold text-slate-800 uppercase">{inspectOrder.payment_method}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block">Ordered Products</span>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                {inspectOrder.items?.map((it, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{it.name}</p>
                      <p className="text-[10px] text-slate-400">Qty: {it.quantity} × ৳{it.unit_price}</p>
                    </div>
                    <span className="font-bold text-slate-800">৳{(it.quantity * it.unit_price).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-bold text-sm">
              <span>Total Paid:</span>
              <span className="text-emerald-700 font-black text-base">৳{inspectOrder.total_amount}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setTrackingModalOrder(inspectOrder); setInspectOrder(null); }}
                className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                Track Courier Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= COURIER TRACKING MODAL ================= */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Live Courier Tracking</h3>
                <span className="text-slate-500 font-mono text-[11px]">#{trackingModalOrder.order_number}</span>
              </div>
              <button onClick={() => setTrackingModalOrder(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase">Courier Carrier</span>
              <p className="font-black text-emerald-950 text-sm">{trackingModalOrder.courier_name || 'SuShop Express 60-Min Fleet'}</p>
              <p className="text-[11px] font-mono text-emerald-800">Tracking Code: {trackingModalOrder.tracking_number || 'TRK-DHAKA-EXPRESS'}</p>
            </div>

            {/* Tracking steps */}
            <div className="space-y-4 py-2">
              {[
                { label: 'Order Confirmed', done: true, time: 'Immediate' },
                { label: 'Picking & Packaging at Hub', done: trackingModalOrder.status !== 'pending', time: '15 mins' },
                { label: 'Dispatched with Courier Rider', done: ['packed', 'shipped', 'delivered'].includes(trackingModalOrder.status), time: '35 mins' },
                { label: 'Delivered at Doorstep', done: trackingModalOrder.status === 'delivered', time: '60 mins' }
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${step.done ? 'bg-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                    <span className="text-[10px] text-slate-400">{step.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setTrackingModalOrder(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl cursor-pointer"
            >
              Close Tracking
            </button>
          </div>
        </div>
      )}

      {/* ================= OPEN NEW TICKET MODAL ================= */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Open Customer Support Ticket</h3>
              <button onClick={() => setShowNewTicketModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Issue Category</label>
                <select
                  value={newTicketCategory}
                  onChange={(e) => setNewTicketCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                >
                  <option value="Order Inquiry">Order & Delivery Inquiry</option>
                  <option value="Return / Refund">Return & Refund Request</option>
                  <option value="Product Quality">Product Freshness & Quality</option>
                  <option value="Payment Issue">Payment & Billing Issue</option>
                  <option value="General Support">General Support</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="e.g. Delivery status inquiry for Order #SUS-..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description / Message</label>
                <textarea
                  rows="4"
                  required
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder="Describe your request in detail..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-xs"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TICKET CONVERSATION MODAL ================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Ticket #{selectedTicket.ticket_number}</h3>
                <p className="text-slate-500 font-bold">{selectedTicket.subject}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100">
              {selectedTicket.messages?.map((msg, i) => (
                <div key={i} className={`p-3 rounded-2xl text-xs ${msg.is_agent ? 'bg-emerald-100/70 text-emerald-950 ml-4' : 'bg-white text-slate-900 mr-4 border border-slate-200'}`}>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-semibold">
                    <span>{msg.sender}</span>
                    <span>{msg.timestamp?.slice(11, 16)}</span>
                  </div>
                  <p>{msg.message}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleReplyTicket} className="flex gap-2">
              <input
                type="text"
                required
                value={ticketReply}
                onChange={(e) => setTicketReply(e.target.value)}
                placeholder="Type your reply message..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer shadow-xs"
              >
                Reply
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= RMA RETURN MODAL ================= */}
      {rmaOrderNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Request RMA Return</h3>
              <button onClick={() => setRmaOrderNumber(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            {rmaSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-center font-bold">
                Return request submitted successfully! An operator will review it shortly.
              </div>
            ) : (
              <form onSubmit={handleRequestRMA} className="space-y-3">
                <p className="text-slate-600">Submitting return request for Order <strong>#{rmaOrderNumber}</strong></p>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Reason for Return</label>
                  <textarea
                    rows="3"
                    required
                    value={rmaReason}
                    onChange={(e) => setRmaReason(e.target.value)}
                    placeholder="e.g. Received damaged packaging, defective item, or wrong variant"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRmaOrderNumber(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2 rounded-xl cursor-pointer shadow-xs"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
