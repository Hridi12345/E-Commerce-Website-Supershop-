import React from 'react';
import { Phone, Mail, MapPin, CreditCard, Banknote, ShieldCheck } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-10 pb-8 border-t border-slate-800 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 pb-10 border-b border-slate-800">
          {/* Brand info */}
          <div className="col-span-2 md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                S
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Su<span className="text-emerald-500">Shop</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pr-4">
              SuShop is your premier omnichannel everyday essentials supershop. We deliver fresh organic groceries, farm dairy, household goods, and personal care directly to your doorstep with guaranteed fast fulfillment.
            </p>
            <div className="text-xs text-slate-400 space-y-1.5 pt-2">
              <p className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" /> +880 9610-SUSHOP (9 AM - 11 PM)
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" /> support@sushop.com
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" /> Banani Mega Central Hub, Road 11, Dhaka-1213
              </p>
            </div>
          </div>

          {/* Catalog Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Popular Aisles</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('plp', { category_id: 1 })} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">
                  Fresh Produce & Fruits
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('plp', { category_id: 2 })} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">
                  Dairy, Eggs & Bakery
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('plp', { category_id: 3 })} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">
                  Household & Cleaning
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('plp', { category_id: 4 })} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">
                  Personal Care & Wellness
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('plp', { is_flash_sale: true })} className="hover:text-amber-400 text-amber-300 font-medium transition-colors cursor-pointer text-left">
                  ⚡ Flash Sale Deals
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Transactional Policies */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Policies & Legal</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('page', { slug: 'return-refund-policy' })} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">
                  Return & Refund Policy (RMA)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('page', { slug: 'shipping-timelines' })} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">
                  Shipping & Delivery Timelines
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('page', { slug: 'terms-of-service' })} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('page', { slug: 'privacy-policy' })} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Corporate & Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Customer Support</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('page', { slug: 'about-us' })} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">
                  About SuShop
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('locator')} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">
                  Store & Warehouse Locator
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">
                  Interactive FAQ Hub
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('portal', { tab: 'orders' })} className="hover:text-emerald-400 transition-colors cursor-pointer text-left">
                  My Orders & Tracking
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Styled Payment Method Logos/Badges */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
            <p>© 2026 SuShop Everyday Essentials Platform. All rights reserved.</p>
          </div>

          {/* 10. Official Payment Method Logos (bKash, Nagad, Rocket, Visa, Mastercard, COD) */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Accepted Payments:</span>

            {/* bKash Official Logo */}
            <div className="bg-white border border-slate-700/80 px-2.5 py-1 rounded-md shadow-xs hover:border-[#E2136E] transition-all flex items-center justify-center h-8" title="bKash">
              <img src="/images/payments/bkash.png" alt="bKash" className="h-5 sm:h-5.5 w-auto object-contain" />
            </div>

            {/* Nagad Official Logo */}
            <div className="bg-white border border-slate-700/80 px-2.5 py-1 rounded-md shadow-xs hover:border-[#F7931E] transition-all flex items-center justify-center h-8" title="Nagad">
              <img src="/images/payments/nagad.png" alt="Nagad" className="h-5 sm:h-5.5 w-auto object-contain" />
            </div>

            {/* Rocket Official Logo */}
            <div className="bg-white border border-slate-700/80 px-2.5 py-1 rounded-md shadow-xs hover:border-[#8C3494] transition-all flex items-center justify-center h-8" title="Rocket">
              <img src="/images/payments/rocket.png" alt="Rocket" className="h-5.5 sm:h-6 w-auto object-contain" />
            </div>

            {/* Visa Official SVG Logo */}
            <div className="flex items-center bg-white border border-slate-700/80 px-2.5 py-1 rounded-md shadow-xs hover:border-blue-500 transition-all h-8" title="Visa">
              <svg className="h-4 w-9 shrink-0" viewBox="0 0 48 16" fill="none">
                <path d="M18.5 1.5 L14.5 14.5 H11.5 L15.5 1.5 H18.5 Z" fill="#1A1F71" />
                <path d="M29.5 1.8 C28.7 1.5 27.5 1.2 26 1.2 C22 1.2 19.5 3.3 19.5 6.2 C19.5 8.4 21.5 9.6 23 10.3 C24.5 11 25 11.5 25 12.2 C25 13.2 23.8 13.7 22.5 13.7 C21 13.7 20 13.3 19 12.8 L18.5 12.5 L18 15 C19 15.5 20.7 15.8 22.5 15.8 C26.8 15.8 29.5 13.7 29.5 10.7 C29.5 8.9 28.3 7.5 26.2 6.5 C24.8 5.8 24 5.3 24 4.5 C24 3.8 24.8 3.2 26.2 3.2 C27.5 3.2 28.5 3.5 29.2 3.8 L29.5 1.8 Z" fill="#1A1F71" />
                <path d="M34 1.5 L30.5 14.5 H33.5 L34.5 10 H38.5 L39 12 L39.5 14.5 H42.5 L39.5 1.5 H34 Z M35.2 7.5 L36.5 3.5 L37.8 7.5 H35.2 Z" fill="#1A1F71" />
                <path d="M8.5 1.5 L4.5 14.5 H1.5 L0 2.5 C0 2 0.3 1.6 0.8 1.5 H5 C5.5 1.5 6 1.9 6.2 2.5 L7.5 9.5 L10.5 1.5 H8.5 Z" fill="#F7B600" />
              </svg>
            </div>

            {/* Mastercard Official SVG Logo */}
            <div className="flex items-center bg-white border border-slate-700/80 px-2.5 py-1 rounded-md shadow-xs hover:border-amber-500 transition-all h-8" title="Mastercard">
              <svg className="h-4.5 w-8 shrink-0" viewBox="0 0 36 24" fill="none">
                <circle cx="13" cy="12" r="10" fill="#EB001B" />
                <circle cx="23" cy="12" r="10" fill="#F79E1B" fillOpacity="0.88" />
              </svg>
            </div>

            {/* Cash on Delivery (COD) Official Icon */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-700/80 px-2.5 py-1 rounded-md shadow-xs hover:border-emerald-500 transition-all text-slate-800 h-8" title="Cash on Delivery">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
              </svg>
              <span className="text-xs font-bold text-slate-800 tracking-tight">COD</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
