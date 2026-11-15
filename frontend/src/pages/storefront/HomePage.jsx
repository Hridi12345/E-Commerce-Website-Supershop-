import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ArrowRight, ShieldCheck, Truck, RotateCcw, 
  Flame, Clock, ChevronRight, ChevronLeft, Eye, ShoppingCart, Star, Zap 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { api } from '../../api';

export default function HomePage({ onNavigate, onQuickView }) {
  const { addToCart } = useCart();
  const [banners, setBanners] = useState([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [categories, setCategories] = useState([]);
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
      api.getCategories(),
      api.getFlashSales(),
      api.getProducts({ is_featured: true, limit: 8 }),
      api.getProducts({ sort_by: 'newest', limit: 8 })
    ])
      .then(([b, c, f, feat, nw]) => {
        // Filter strictly active and within scheduled dates
        const now = new Date();
        const validBanners = (b || []).filter(item => {
          if (item.is_active === false) return false;
          if (item.start_date && new Date(item.start_date) > now) return false;
          if (item.end_date && new Date(item.end_date) < now) return false;
          return true;
        }).sort((x, y) => (x.display_order || 0) - (y.display_order || 0));

        setBanners(validBanners);
        setCategories(c || []);
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
    <div className="space-y-10 pb-16">
      {/* 1. Dynamic Hero Slider & Banners */}
      <section 
        className="relative overflow-hidden bg-slate-900 text-white rounded-2xl sm:rounded-3xl mx-2 sm:mx-4 mt-2 sm:mt-4 shadow-xl select-none group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {banners.length > 0 ? (
          <div className="relative min-h-[300px] sm:min-h-[440px] md:min-h-[500px] flex items-center">
            {banners.map((b, idx) => (
              <div
                key={b.id || idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  idx === activeBanner ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={b.image_url}
                  alt={b.title}
                  className="w-full h-full object-cover opacity-50 transition-transform duration-1000 ease-out group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent" />
                <div className="absolute inset-0 flex items-center p-4 sm:p-10 md:p-16">
                  <div className="max-w-xl space-y-2.5 sm:space-y-4">
                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-xs">
                      <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-emerald-400" />
                      {b.name || 'SuShop Everyday Essentials'}
                    </span>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                      {b.title}
                    </h1>
                    {b.subtitle && (
                      <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed font-medium drop-shadow-xs line-clamp-2 sm:line-clamp-none">
                        {b.subtitle}
                      </p>
                    )}
                    <div className="pt-1 sm:pt-2 flex flex-wrap gap-2 sm:gap-3">
                      <button
                        onClick={() => handleBannerClick(b)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm cursor-pointer hover:translate-x-0.5"
                      >
                        <span>{b.button_text || 'Shop Now'}</span>
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => onNavigate('plp', { is_flash_sale: true })}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white border border-white/20 font-bold px-3.5 py-2 sm:px-5 sm:py-3 rounded-xl transition-all text-xs sm:text-sm cursor-pointer"
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-emerald-600 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs border border-white/10 shadow-lg opacity-80 group-hover:opacity-100 hover:scale-110"
                  aria-label="Previous Banner"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextBanner}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-emerald-600 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs border border-white/10 shadow-lg opacity-80 group-hover:opacity-100 hover:scale-110"
                  aria-label="Next Banner"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Pagination Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveBanner(i)}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      i === activeBanner ? 'w-8 bg-emerald-500 shadow-sm shadow-emerald-400' : 'w-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-[360px] flex items-center justify-center p-12 text-center text-slate-400">
            <div className="space-y-2">
              <Sparkles className="w-8 h-8 text-emerald-500 mx-auto animate-pulse" />
              <p className="text-sm font-semibold text-slate-300">SuShop Fresh Essentials & Groceries</p>
            </div>
          </div>
        )}
      </section>

      {/* 2. Brand Trust Badges Strip */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Doorstep Delivery in 60 Mins</h4>
              <p className="text-[11px] text-slate-500">Fast chilled express fleet</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">100% Quality & Freshness</h4>
              <p className="text-[11px] text-slate-500">Certified farm-direct produce</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">7 Days Easy Return (RMA)</h4>
              <p className="text-[11px] text-slate-500">Instant refund or replacement</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Multiple Secure Payments</h4>
              <p className="text-[11px] text-slate-500">bKash, Nagad, Cards & COD</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Categories Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Shop by Department</h2>
            <p className="text-xs text-slate-500">Hand-selected fresh groceries & daily necessities</p>
          </div>
          <button
            onClick={() => onNavigate('plp')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            All Departments <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('plp', { category_id: cat.id })}
              className="bg-white hover:bg-emerald-50/50 p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-300 text-center cursor-pointer transition-all duration-200 group shadow-xs hover:shadow-md"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform font-bold text-lg">
                {cat.name.charAt(0)}
              </div>
              <h3 className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 line-clamp-1">
                {cat.name}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Explore Aisle →</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Flash Sales Section with Countdown */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <Flame className="w-6 h-6 text-yellow-200 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded-full">
                  Limited Time Offers
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white mt-0.5">
                  Flash Sales - Up to 35% Off
                </h2>
              </div>
            </div>

            {/* Countdown timer ticker */}
            <div className="flex items-center gap-2 text-slate-900 font-mono font-black text-sm">
              <span className="text-xs text-white uppercase tracking-wider mr-1 font-sans">Ends In:</span>
              <div className="bg-white px-2.5 py-1.5 rounded-lg shadow-xs">{String(timeLeft.hours).padStart(2, '0')}h</div>
              <span className="text-white">:</span>
              <div className="bg-white px-2.5 py-1.5 rounded-lg shadow-xs">{String(timeLeft.minutes).padStart(2, '0')}m</div>
              <span className="text-white">:</span>
              <div className="bg-white px-2.5 py-1.5 rounded-lg shadow-xs">{String(timeLeft.seconds).padStart(2, '0')}s</div>
            </div>
          </div>

          {/* Flash Sale Product Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {featuredProducts.filter(p => p.is_flash_sale).map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-4 text-slate-800 shadow-lg relative group transition-all"
              >
                <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider z-10">
                  Save {p.flash_sale_discount_pct}%
                </div>

                <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden relative mb-3 cursor-pointer"
                  onClick={() => onNavigate('pdp', { slug: p.slug })}
                >
                  <img
                    src={p.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onQuickView(p.slug); }}
                      className="bg-white text-slate-900 p-2 rounded-xl text-xs font-bold shadow-md hover:bg-emerald-50 cursor-pointer"
                      title="Quick View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 
                  onClick={() => onNavigate('pdp', { slug: p.slug })}
                  className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-emerald-600 cursor-pointer"
                >
                  {p.name}
                </h3>
                
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-black text-slate-900">৳{p.sale_price || p.base_price}</span>
                  {p.sale_price && (
                    <span className="text-xs text-slate-400 line-through">৳{p.base_price}</span>
                  )}
                </div>

                {/* Stock progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-1">
                    <span>Sold: 78%</span>
                    <span>{p.stock_quantity} left</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-3/4 rounded-full" />
                  </div>
                </div>

                <button
                  onClick={() => addToCart(p, null, 1)}
                  className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Add to Basket</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Featured Essentials & Newly Arrived Inventory */}
      <section className="max-w-7xl mx-auto px-4">
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
              className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-emerald-300 transition-all hover:shadow-md relative group flex flex-col justify-between"
            >
              <div>
                <div 
                  className="aspect-square rounded-xl bg-slate-100 overflow-hidden relative mb-3 cursor-pointer"
                  onClick={() => onNavigate('pdp', { slug: p.slug })}
                >
                  <img
                    src={p.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onQuickView(p.slug); }}
                      className="bg-white text-slate-900 p-2 rounded-xl text-xs font-bold shadow-md hover:bg-emerald-50 cursor-pointer"
                      title="Quick View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-700">{p.rating_avg}</span>
                  <span>({p.reviews_count})</span>
                </div>

                <h3 
                  onClick={() => onNavigate('pdp', { slug: p.slug })}
                  className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-emerald-600 cursor-pointer"
                >
                  {p.name}
                </h3>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100">
                <div className="flex items-baseline justify-between mb-2">
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

                <button
                  onClick={() => addToCart(p, null, 1)}
                  className="w-full bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Add to Basket</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

