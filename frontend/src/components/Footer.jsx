import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Clock, Phone, Mail, MapPin, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Footer({ onNavigate }) {
  const { isStaff } = useAuth();
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* Brand Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pb-8 sm:pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">60-Min Express Delivery</h4>
              <p className="text-xs text-slate-400">Chilled farm-fresh doorstep logistics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Genuine & Fresh</h4>
              <p className="text-xs text-slate-400">Directly sourced organic certified</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">7-Day Easy RMA Return</h4>
              <p className="text-xs text-slate-400">Instant doorstep replacement or refund</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">24/7 Dedicated Care</h4>
              <p className="text-xs text-slate-400">Live chat & telephone order assistance</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 py-8 sm:py-10">
          {/* Brand info */}
          <div className="col-span-2 md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl">
                S
              </div>
              <span className="text-xl font-black text-white tracking-tight">SU<span className="text-emerald-500">SHOP</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pr-6">
              SuShop is your premier omnichannel everyday essentials supershop. We bridge local organic producers, farm cooperatives, and top consumer goods brands directly to family kitchens with guaranteed express fulfillment.
            </p>
            <div className="text-xs text-slate-400 space-y-1 pt-2">
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-400" /> +880 9610-SUSHOP (9 AM - 11 PM)</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-emerald-400" /> support@sushop.com</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400" /> Banani Mega Central Hub, Road 11, Dhaka-1213</p>
            </div>
          </div>

          {/* Catalog Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Popular Aisles</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><button onClick={() => onNavigate('plp', { category_id: 1 })} className="hover:text-emerald-400 transition-colors cursor-pointer">Fresh Grocery & Produce</button></li>
              <li><button onClick={() => onNavigate('plp', { category_id: 2 })} className="hover:text-emerald-400 transition-colors cursor-pointer">Dairy, Eggs & Breakfast</button></li>
              <li><button onClick={() => onNavigate('plp', { category_id: 3 })} className="hover:text-emerald-400 transition-colors cursor-pointer">Household & Cleaning</button></li>
              <li><button onClick={() => onNavigate('plp', { category_id: 4 })} className="hover:text-emerald-400 transition-colors cursor-pointer">Personal Care & Wellness</button></li>
              <li><button onClick={() => onNavigate('plp', { is_flash_sale: true })} className="hover:text-amber-400 text-amber-300 font-medium transition-colors cursor-pointer">⚡ Flash Sale Deals</button></li>
            </ul>
          </div>

          {/* Legal & Transactional Policies */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Policies & Legal</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><button onClick={() => onNavigate('page', { slug: 'return-refund-policy' })} className="hover:text-emerald-400 transition-colors cursor-pointer">Return & Refund Policy (RMA)</button></li>
              <li><button onClick={() => onNavigate('page', { slug: 'shipping-timelines' })} className="hover:text-emerald-400 transition-colors cursor-pointer">Shipping & Delivery Timelines</button></li>
              <li><button onClick={() => onNavigate('page', { slug: 'terms-of-service' })} className="hover:text-emerald-400 transition-colors cursor-pointer">Terms of Service</button></li>
              <li><button onClick={() => onNavigate('page', { slug: 'privacy-policy' })} className="hover:text-emerald-400 transition-colors cursor-pointer">Privacy Policy (GDPR / CCPA)</button></li>
            </ul>
          </div>

          {/* Corporate & Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Customer Support</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><button onClick={() => onNavigate('page', { slug: 'about-us' })} className="hover:text-emerald-400 transition-colors cursor-pointer">About SuShop</button></li>
              <li><button onClick={() => onNavigate('locator')} className="hover:text-emerald-400 transition-colors cursor-pointer">Store & Warehouse Locator</button></li>
              <li><button onClick={() => onNavigate('faq')} className="hover:text-emerald-400 transition-colors cursor-pointer">Interactive FAQ Hub</button></li>
              <li><button onClick={() => onNavigate('portal', { tab: 'tickets' })} className="hover:text-emerald-400 transition-colors cursor-pointer">Submit Support Ticket</button></li>
              <li><button onClick={() => onNavigate('portal', { tab: 'orders' })} className="hover:text-emerald-400 transition-colors cursor-pointer">Track Live Orders</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & payment icons */}
        <div className="pt-6 sm:pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-start">
            <p>© 2026 SuShop Everyday Essentials Platform. All rights reserved.</p>
            <span>•</span>
            <button
              onClick={() => onNavigate(isStaff ? '/admin/dashboard' : '/admin/login')}
              className="hover:text-slate-300 transition-colors cursor-pointer text-slate-500"
            >
              Admin Portal
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">Accepted Gateways:</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-bold">bKash</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-amber-400 font-bold">Nagad</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-purple-400 font-bold">Rocket</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-blue-400 font-bold">Cards</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 font-bold">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

