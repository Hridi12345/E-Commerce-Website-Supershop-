import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Search, ShoppingCart, Heart, User, MapPin, 
  Phone, Clock, ChevronDown, ShieldCheck, Truck, Sparkles, LogOut, CheckCircle,
  Menu, X, Home, Grid, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../api';

export default function Header({ onNavigate, currentPage, currentParam }) {
  const { user, logout } = useAuth();
  const { totalItemCount, subtotal, setIsMiniCartOpen } = useCart();

  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  useEffect(() => {
    api.getCategories().then(cats => setCategories(cats || [])).catch(() => {});
  }, []);

  // Live search autocomplete
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const delay = setTimeout(() => {
        api.getProducts({ search: searchQuery.trim(), limit: 5 })
          .then(res => {
            setSearchResults(res.items || []);
            setShowSearchDropdown(true);
          })
          .catch(() => {});
      }, 250);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchQuery]);

  // Click outside to close search
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        (searchRef.current && !searchRef.current.contains(e.target)) &&
        (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target))
      ) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      onNavigate('plp', { search: searchQuery.trim() });
    }
  };

  const navigateAndCloseDrawer = (target, param = {}) => {
    setMobileDrawerOpen(false);
    onNavigate(target, param);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        {/* Top Banner Notice */}
        <div className="bg-emerald-700 text-white text-xs py-1.5 px-3 sm:px-4 font-medium">
          <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 truncate">
              <span className="bg-amber-400 text-emerald-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0">Fast</span>
              <span className="truncate text-[11px] sm:text-xs">⚡ 60-Minute Doorstep Delivery Across Dhaka</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-100 shrink-0 text-[11px] sm:text-xs">
              <span className="hidden md:flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> +880 9610-SUSHOP</span>
              <button onClick={() => onNavigate('locator')} className="hover:text-white hidden sm:flex items-center gap-1 cursor-pointer">
                <MapPin className="w-3.5 h-3.5" /> Store Locator
              </button>
              <span className="hidden sm:inline">|</span>
              <span className="font-bold">BDT (৳)</span>
            </div>
          </div>
        </div>

        {/* Main Header Container */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Mobile Hamburger + Logo */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="md:hidden p-1.5 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div 
                onClick={() => onNavigate('home')} 
                className="flex items-center gap-2 cursor-pointer select-none group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform shrink-0">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">SU<span className="text-emerald-600">SHOP</span></span>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded-full hidden sm:inline">SUPERSHOP</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium hidden lg:block -mt-0.5">Everyday Essentials Delivered</p>
                </div>
              </div>
            </div>

            {/* Desktop Search bar with autocomplete */}
            <div className="hidden md:block flex-1 max-w-2xl relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search fresh groceries, organic fruits, milk, household essentials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                  className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 pl-11 pr-24 py-2.5 rounded-full border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors cursor-pointer shadow-xs"
                >
                  Search
                </button>
              </form>

              {/* Autocomplete Dropdown (Desktop) */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-2 border-b border-slate-100 text-xs text-slate-500 font-semibold px-4">
                    Suggested Products ({searchResults.length})
                  </div>
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {searchResults.map(prod => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          onNavigate('pdp', { slug: prod.slug });
                        }}
                        className="p-3 hover:bg-emerald-50/60 flex items-center gap-3 cursor-pointer transition-colors"
                      >
                        <img 
                          src={prod.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'} 
                          alt={prod.name}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 truncate">{prod.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-emerald-700 font-bold">৳{prod.sale_price || prod.base_price}</span>
                            {prod.sale_price && (
                              <span className="text-xs text-slate-400 line-through">৳{prod.base_price}</span>
                            )}
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium truncate">{prod.category_name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div 
                    onClick={handleSearchSubmit}
                    className="p-2.5 text-center text-xs text-emerald-700 font-bold bg-slate-50 hover:bg-emerald-100 cursor-pointer border-t border-slate-100"
                  >
                    View all results for "{searchQuery}" →
                  </div>
                </div>
              )}
            </div>

            {/* Right Action Icons: User Account, Wishlist & Cart */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* User Account Button (Desktop explicit / Mobile icon) */}
              {!user ? (
                <>
                  <div className="hidden md:flex items-center gap-1.5">
                    <button
                      onClick={() => onNavigate('login')}
                      className="text-xs font-bold text-slate-700 hover:text-emerald-700 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => onNavigate('register')}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Register
                    </button>
                  </div>
                  <button
                    onClick={() => onNavigate('login')}
                    className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Sign In"
                  >
                    <User className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="text-xs font-semibold text-slate-900 leading-tight">
                        {user.name.split(' ')[0]}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize">
                        My Account
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                      <div className="p-3 border-b border-slate-100 mb-1">
                        <p className="text-xs font-bold text-slate-900">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>

                      <button
                        onClick={() => { setUserMenuOpen(false); onNavigate('portal', { tab: 'overview' }); }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-emerald-600" /> Personal Dashboard
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); onNavigate('portal', { tab: 'orders' }); }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4 text-slate-400" /> Order History & Invoices
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); onNavigate('portal', { tab: 'coupons' }); }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" /> My Coupons & Offers
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); onNavigate('portal', { tab: 'wishlist' }); }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <Heart className="w-4 h-4 text-slate-400" /> My Wishlist
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); onNavigate('portal', { tab: 'addresses' }); }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" /> Saved Addresses
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); onNavigate('portal', { tab: 'tickets' }); }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-400" /> Support Tickets
                      </button>

                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); onNavigate('home'); }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Wishlist Button */}
              <button
                onClick={() => onNavigate('portal', { tab: 'wishlist' })}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 relative transition-colors cursor-pointer hidden sm:block"
                title="My Wishlist"
              >
                <Heart className="w-5 h-5" />
              </button>

              {/* Cart Button */}
              <button
                onClick={() => setIsMiniCartOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer relative shadow-xs"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-emerald-700" />
                  {totalItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                      {totalItemCount}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <div className="text-[10px] text-emerald-700 font-semibold uppercase leading-tight">My Cart</div>
                  <div className="font-extrabold text-emerald-950">৳{subtotal.toFixed(0)}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Dedicated Full-Width Mobile Search Bar */}
          <div className="md:hidden mt-2 relative" ref={mobileSearchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search groceries, fruits, milk, essentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                className="w-full bg-slate-100 hover:bg-slate-100/90 focus:bg-white text-slate-900 pl-10 pr-20 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-xs transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <button
                type="submit"
                className="absolute right-1 top-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Mobile Autocomplete Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="p-2 border-b border-slate-100 text-[11px] text-slate-500 font-semibold px-3">
                  Suggested Products ({searchResults.length})
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {searchResults.map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        onNavigate('pdp', { slug: prod.slug });
                      }}
                      className="p-2.5 hover:bg-emerald-50/60 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <img 
                        src={prod.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'} 
                        alt={prod.name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 truncate">{prod.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-emerald-700 font-bold">৳{prod.sale_price || prod.base_price}</span>
                          {prod.sale_price && (
                            <span className="text-[10px] text-slate-400 line-through">৳{prod.base_price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div 
                  onClick={handleSearchSubmit}
                  className="p-2 text-center text-xs text-emerald-700 font-bold bg-slate-50 hover:bg-emerald-100 cursor-pointer border-t border-slate-100"
                >
                  View all results for "{searchQuery}" →
                </div>
              </div>
            )}
          </div>

          {/* Secondary Category Navigation Bar */}
          <div className="flex items-center justify-between gap-4 pt-2.5 border-t border-slate-100 mt-2 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 w-full md:w-auto">
              <button
                onClick={() => onNavigate('home')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer text-xs ${
                  currentPage === 'home' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onNavigate('plp')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer text-xs ${
                  currentPage === 'plp' && !currentParam?.category_id && !currentParam?.is_flash_sale ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                All Catalog
              </button>
              <button
                onClick={() => onNavigate('plp', { is_flash_sale: true })}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer text-xs text-amber-600 hover:bg-amber-50 ${
                  currentParam?.is_flash_sale ? 'bg-amber-500 text-white hover:text-white' : ''
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Flash Sales
              </button>
              {categories.slice(0, 6).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onNavigate('plp', { category_id: cat.id })}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer text-xs ${
                    currentParam?.category_id === cat.id ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              <button
                onClick={() => onNavigate('faq')}
                className="px-3 py-1.5 rounded-lg whitespace-nowrap hover:bg-slate-100 text-slate-700 cursor-pointer text-xs"
              >
                FAQ Hub
              </button>
            </div>

            <div className="hidden md:flex items-center gap-3 text-slate-500 text-xs shrink-0">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <Truck className="w-3.5 h-3.5" /> Free Delivery above ৳1,000
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Mobile Navigation Drawer */}
      {mobileDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div 
            className="w-80 max-w-[85vw] h-full bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-700 text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-black">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight leading-none">SU<span className="text-amber-300">SHOP</span></h3>
                  <p className="text-[10px] text-emerald-100">Everyday Essentials</p>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-emerald-600 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Account Tile */}
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigateAndCloseDrawer('portal', { tab: 'overview' })}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    View Account →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700">Welcome to SuShop</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigateAndCloseDrawer('login')}
                      className="flex-1 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg text-center cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => navigateAndCloseDrawer('register')}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg text-center cursor-pointer"
                    >
                      Register
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Links List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
              <button
                onClick={() => navigateAndCloseDrawer('home')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800 font-semibold cursor-pointer"
              >
                <Home className="w-4 h-4 text-emerald-600" />
                <span>Home Storefront</span>
              </button>

              <button
                onClick={() => navigateAndCloseDrawer('plp')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800 font-semibold cursor-pointer"
              >
                <Grid className="w-4 h-4 text-emerald-600" />
                <span>All Catalog Products</span>
              </button>

              <button
                onClick={() => navigateAndCloseDrawer('plp', { is_flash_sale: true })}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-50 text-amber-900 font-bold cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>⚡ Flash Deals</span>
                </div>
                <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black">SALE</span>
              </button>

              <div className="pt-2 pb-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">Popular Aisles</p>
              </div>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigateAndCloseDrawer('plp', { category_id: cat.id })}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 cursor-pointer text-xs"
                >
                  <span>{cat.name}</span>
                  <span className="text-[11px] text-slate-400">→</span>
                </button>
              ))}

              <div className="pt-3 pb-1 border-t border-slate-100 mt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">Help & Services</p>
              </div>

              <button
                onClick={() => navigateAndCloseDrawer('locator')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Store & Hub Locator</span>
              </button>

              <button
                onClick={() => navigateAndCloseDrawer('faq')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Customer FAQ Hub</span>
              </button>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> Hotline: +880 9610-SUSHOP
              </p>
              <p className="text-[10px]">Open Everyday 9:00 AM – 11:00 PM</p>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Bar on Mobile Devices */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 flex items-center justify-around md:hidden shadow-lg">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            currentPage === 'home' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => onNavigate('plp')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            currentPage === 'plp' && !currentParam?.is_flash_sale ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px]">Catalog</span>
        </button>

        <button
          onClick={() => onNavigate('plp', { is_flash_sale: true })}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl cursor-pointer ${
            currentParam?.is_flash_sale ? 'text-amber-500 font-bold' : 'text-slate-500'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[10px]">Deals</span>
        </button>

        <button
          onClick={() => onNavigate('portal', { tab: 'wishlist' })}
          className="flex flex-col items-center gap-0.5 p-1 rounded-xl text-slate-500 cursor-pointer"
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px]">Wishlist</span>
        </button>

        <button
          onClick={() => setIsMiniCartOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 rounded-xl text-slate-700 relative cursor-pointer"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            {totalItemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {totalItemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold text-emerald-800">Cart</span>
        </button>
      </nav>
    </>
  );
}
