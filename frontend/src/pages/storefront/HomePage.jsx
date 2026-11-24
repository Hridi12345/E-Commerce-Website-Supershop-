import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ArrowRight, ShieldCheck, Truck, RotateCcw, 
  Flame, Clock, ChevronRight, ChevronLeft, Eye, ShoppingCart, Star, Zap, Heart 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { api } from '../../api';

export default function HomePage({ onNavigate, onQuickView }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [banners, setBanners] = useState([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [flashSales, setFlashSales] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Countdown timer for flash sale
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      api.getBanners('hero_slider'),
      api.getFlashSales(),
      api.getProducts({ is_featured: true, limit: 8 }),
      api.getProducts({ sort_by: 'newest', limit: 8 })
    ])
      .then(([b, f, feat, nw]) => {
        const now = new Date();
        const validBanners = (b || []).filter(item => {
          if (item.is_active === false) return false;
          if (item.start_date && new Date(item.start_date) > now) return false;
          if (item.end_date && new Date(item.end_date) < now) return false;
          return true;
        }).sort((x, y) => (x.display_order || 0) - (y.display_order || 0));

        setBanners(validBanners);
        setFlashSales(f || []);
        setFeaturedProducts(feat.items || []);
        setNewArrivals(nw.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto advance hero banner (pauses on hover)
  useEffect(() => {
    if (banners.length > 1 && !isHovered) {
      const interval = setInterval(() => {
        setActiveBanner(prev => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners, isHovered]);

  const handlePrevBanner = () => {
    setActiveBanner(prev => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNextBanner = () => {
    setActiveBanner(prev => (prev + 1) % banners.length);
  };

  const handleBannerClick = (banner) => {
    const targetUrl = banner.link_url || '/products';
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (targetUrl.includes('is_flash_sale=true')) {
      onNavigate('plp', { is_flash_sale: true });
    } else if (targetUrl.includes('category_id=')) {
      const match = targetUrl.match(/category_id=(\d+)/);
      if (match) {
        onNavigate('plp', { category_id: parseInt(match[1]) });
      } else {
        onNavigate('plp');
      }
    } else {
      onNavigate('plp');
    }
  };

  return (
    <div className="w-full space-y-10 pb-16">
      {/* 1. Dynamic Hero Slider & Banners - Balanced Brightness & Legibility */}
      <section 
        className="w-full px-4 sm:px-6 lg:px-8 mt-2 sm:mt-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden bg-slate-900 text-white rounded-xl shadow-lg select-none group w-full">
          {banners.length > 0 ? (
            <div className="relative min-h-[320px] sm:min-h-[440px] md:min-h-[500px] flex items-center">
              {banners.map((b, idx) => (
                <div
                  key={b.id || idx}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    idx === activeBanner ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  {/* Background Image: Lightened to 0.85 opacity so it is clearly visible and recognizable */}
                  <img
                    src={b.image_url}
                    alt={b.title}
                    className="w-full h-full object-cover opacity-85 transition-transform duration-1000 ease-out group-hover:scale-102"
                  />
                  {/* Gentle gradient overlay balancing image clarity with text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-950/20" />
                  
                  {/* Content Container */}
                  <div className="absolute inset-0 flex items-center p-6 sm:p-12 md:p-16">
                    <div className="max-w-xl space-y-3 sm:space-y-4 bg-slate-950/30 backdrop-blur-xs p-5 sm:p-6 rounded-xl border border-white/10 shadow-lg">
                      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-md shadow-xs">
                        <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                        {b.name || 'SuShop Everyday Essentials'}
                      </span>
                      <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                        {b.title}
                      </h1>
                      {b.subtitle && (
                        <p className="text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed font-medium drop-shadow-sm">
                          {b.subtitle}
                        </p>
                      )}
                      <div className="pt-2 flex flex-wrap gap-2.5 sm:gap-3">
                        <button
                          onClick={() => handleBannerClick(b)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
                        >
                          <span>{b.button_text || 'Shop Now'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate('plp', { is_flash_sale: true })}
                          className="bg-white/15 hover:bg-white/25 backdrop-blur-xs text-white border border-white/20 font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg transition-all text-xs sm:text-sm cursor-pointer"
                        >
                          View Flash Deals
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Navigation Arrows */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={handlePrevBanner}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-lg bg-slate-900/60 hover:bg-emerald-600 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs border border-white/10 shadow-md opacity-80 group-hover:opacity-100"
                    aria-label="Previous Banner"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextBanner}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-lg bg-slate-900/60 hover:bg-emerald-600 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs border border-white/10 shadow-md opacity-80 group-hover:opacity-100"
                    aria-label="Next Banner"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Pagination Dots */}
              {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveBanner(i)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        i === activeBanner ? 'w-6 bg-emerald-500 shadow-sm' : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[320px] flex items-center justify-center p-12 text-center text-slate-400">
              <div className="space-y-2">
                <Sparkles className="w-8 h-8 text-emerald-500 mx-auto animate-pulse" />
                <p className="text-sm font-semibold text-slate-300">SuShop Fresh Essentials & Groceries</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Brand Trust Badges Strip - Full Width */}
      <section className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-lg border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Doorstep Delivery in 60 Mins</h4>
              <p className="text-[11px] text-slate-500">Fast chilled express fleet</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">100% Quality & Freshness</h4>
              <p className="text-[11px] text-slate-500">Certified farm-direct produce</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">7 Days Easy Return (RMA)</h4>
              <p className="text-[11px] text-slate-500">Doorstep replacement or refund</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Multiple Secure Gateways</h4>
              <p className="text-[11px] text-slate-500">bKash, Nagad, Cards & COD</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Flash Sales Section with Modern Cards & Modal Quick-View - Full Width */}
      <section className="w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 rounded-xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <Flame className="w-6 h-6 text-yellow-200 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded">
                  Limited Time Offers
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                  Flash Sales - Up to 35% Off
                </h2>
              </div>
            </div>

            {/* Countdown timer ticker */}
            <div className="flex items-center gap-1.5 text-slate-900 font-mono font-bold text-xs sm:text-sm">
              <span className="text-xs text-white uppercase tracking-wider mr-1 font-sans">Ends In:</span>
              <div className="bg-white px-2 py-1 rounded shadow-xs">{String(timeLeft.hours).padStart(2, '0')}h</div>
              <span className="text-white">:</span>
              <div className="bg-white px-2 py-1 rounded shadow-xs">{String(timeLeft.minutes).padStart(2, '0')}m</div>
              <span className="text-white">:</span>
              <div className="bg-white px-2 py-1 rounded shadow-xs">{String(timeLeft.seconds).padStart(2, '0')}s</div>
            </div>
          </div>

          {/* Flash Sale Product Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {featuredProducts.filter(p => p.is_flash_sale).map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-lg p-3 sm:p-4 text-slate-800 shadow-md relative group flex flex-col justify-between transition-all hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Save {p.flash_sale_discount_pct}%
                    </span>

                    {/* Functional Wishlist Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(p);
                      }}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer border ${
                        isInWishlist(p.id)
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200'
                      }`}
                      title={isInWishlist(p.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                      aria-label="Wishlist"
                    >
                      <Heart className={`w-4 h-4 ${isInWishlist(p.id) ? 'fill-current text-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Product Image - Clicking opens Product Details Modal */}
                  <div 
                    className="aspect-square rounded-md bg-slate-100 overflow-hidden relative mb-2.5 cursor-pointer"
                    onClick={() => onQuickView(p.slug)}
                  >
                    <img
                      src={p.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white/95 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-md shadow-md flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-emerald-600" /> Quick View
                      </span>
                    </div>
                  </div>

                  <h3 
                    onClick={() => onQuickView(p.slug)}
                    className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-emerald-600 cursor-pointer"
                  >
                    {p.name}
                  </h3>
                  
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm sm:text-base font-black text-slate-900">৳{p.sale_price || p.base_price}</span>
                    {p.sale_price && (
                      <span className="text-xs text-slate-400 line-through">৳{p.base_price}</span>
                    )}
                  </div>

                  {/* Stock progress bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-1">
                      <span>Limited Stock</span>
                      <span>{p.stock_quantity} left</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full w-3/4 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Clear Add to Cart Action */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(p, null, 1);
                  }}
                  className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Newly Arrived Essentials with Modern Cards & Modal Quick-View - Full Width */}
      <section className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Newly Arrived Essentials</h2>
            <p className="text-xs text-slate-500">Fresh harvest & newly stocked products</p>
          </div>
          <button
            onClick={() => onNavigate('plp', { sort_by: 'newest' })}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {newArrivals.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200/90 hover:border-emerald-300 transition-all hover:shadow-md relative group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-slate-700">{p.rating_avg}</span>
                    <span>({p.reviews_count})</span>
                  </div>

                  {/* Functional Wishlist Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(p);
                    }}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer border ${
                      isInWishlist(p.id)
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : 'bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200'
                    }`}
                    title={isInWishlist(p.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(p.id) ? 'fill-current text-rose-500' : ''}`} />
                  </button>
                </div>

                {/* Product Image - Clicking opens Product Details Modal */}
                <div 
                  className="aspect-square rounded-md bg-slate-100 overflow-hidden relative mb-2.5 cursor-pointer"
                  onClick={() => onQuickView(p.slug)}
                >
                  <img
                    src={p.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/95 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-md shadow-md flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" /> Quick View
                    </span>
                  </div>
                </div>

                <h3 
                  onClick={() => onQuickView(p.slug)}
                  className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-emerald-600 cursor-pointer leading-tight min-h-[32px]"
                >
                  {p.name}
                </h3>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100">
                <div className="flex items-baseline justify-between mb-2.5">
                  <div>
                    <span className="text-sm font-black text-slate-900">৳{p.sale_price || p.base_price}</span>
                    {p.sale_price && (
                      <span className="text-[11px] text-slate-400 line-through ml-1.5">৳{p.base_price}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    In Stock
                  </span>
                </div>

                {/* Clear Add to Cart Action */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(p, null, 1);
                  }}
                  className="w-full bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
