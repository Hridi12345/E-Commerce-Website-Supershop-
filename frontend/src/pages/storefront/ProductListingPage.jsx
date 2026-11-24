import React, { useState, useEffect } from 'react';
import { 
  Filter, SlidersHorizontal, Star, CheckCircle, 
  Eye, ShoppingCart, ArrowUpDown, ChevronLeft, ChevronRight, X, Heart, Sparkles, Tag
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { api } from '../../api';

export default function ProductListingPage({ initialParams = {}, onNavigate, onQuickView }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(initialParams.category_id || '');
  const [selectedBrand, setSelectedBrand] = useState(initialParams.brand_id || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isFlashSale, setIsFlashSale] = useState(initialParams.is_flash_sale || false);
  const [sortBy, setSortBy] = useState(initialParams.sort_by || 'popularity');
  const [search, setSearch] = useState(initialParams.search || '');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    Promise.all([api.getCategories(), api.getBrands()])
      .then(([c, b]) => {
        setCategories(c || []);
        setBrands(b || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {
      page: currentPage,
      limit: 12,
      sort_by: sortBy
    };
    if (selectedCategory) params.category_id = selectedCategory;
    if (selectedBrand) params.brand_id = selectedBrand;
    if (search) params.search = search;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    if (minRating) params.min_rating = minRating;
    if (inStockOnly) params.in_stock_only = true;
    if (isFlashSale) params.is_flash_sale = true;

    api.getProducts(params)
      .then(res => {
        setProducts(res.items || []);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedBrand, search, minPrice, maxPrice, minRating, inStockOnly, isFlashSale, sortBy, currentPage]);

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setInStockOnly(false);
    setIsFlashSale(false);
    setSearch('');
    setCurrentPage(1);
  };

  const getActiveCategoryName = () => {
    if (!selectedCategory) return null;
    const found = categories.find(c => String(c.id) === String(selectedCategory));
    return found ? found.name : null;
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb & Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span onClick={() => onNavigate('home')} className="hover:text-emerald-600 cursor-pointer">Home</span>
            <span>/</span>
            <span 
              onClick={() => { setSelectedCategory(''); setCurrentPage(1); }} 
              className="hover:text-emerald-600 cursor-pointer"
            >
              Catalog
            </span>
            {getActiveCategoryName() && (
              <>
                <span>/</span>
                <span className="text-slate-800 font-semibold">{getActiveCategoryName()}</span>
              </>
            )}
            {search && <span>/ Search: "{search}"</span>}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isFlashSale 
              ? '⚡ Flash Sale Deals' 
              : getActiveCategoryName() 
              ? `${getActiveCategoryName()} Aisles` 
              : search 
              ? `Search Results for "${search}"` 
              : 'All Everyday Essentials'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Showing {products.length} of {total} products found</p>
        </div>

        {/* Sorting & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>

          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="popularity">Most Popular</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="best_rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 12. Modern, Clean Left Sidebar Redesign */}
        <aside className={`md:block ${mobileFilterOpen ? 'block' : 'hidden'} md:col-span-1 space-y-5 bg-white p-5 rounded-lg border border-slate-200 shadow-xs h-fit`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" /> Filter Catalog
            </span>
            <button
              onClick={resetFilters}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
            >
              Clear All
            </button>
          </div>

          {/* Quick Filter: Deals Toggle */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg">
            <label className="flex items-center justify-between text-xs font-bold text-amber-900 cursor-pointer">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Flash Deals Only
              </span>
              <input
                type="checkbox"
                checked={isFlashSale}
                onChange={(e) => { setIsFlashSale(e.target.checked); setCurrentPage(1); }}
                className="w-4 h-4 accent-amber-600 rounded"
              />
            </label>
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Category / Department</h4>
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1 text-xs">
              <button
                onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors ${
                  !selectedCategory 
                    ? 'bg-emerald-600 text-white font-bold' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>All Departments</span>
                <span className="text-[10px] opacity-80">{total}</span>
              </button>

              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCategory(c.id); setCurrentPage(1); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors ${
                    String(selectedCategory) === String(c.id)
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Brand</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1 text-xs">
              <button
                onClick={() => { setSelectedBrand(''); setCurrentPage(1); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  !selectedBrand 
                    ? 'bg-slate-800 text-white font-bold' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                All Brands
              </button>
              {brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBrand(b.id); setCurrentPage(1); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors truncate ${
                    String(selectedBrand) === String(b.id)
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Price Range (৳)</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min ৳"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                className="w-1/2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500 font-semibold"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                placeholder="Max ৳"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                className="w-1/2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500 font-semibold"
              />
            </div>
          </div>

          {/* Customer Rating Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Customer Rating</h4>
            <div className="space-y-1 text-xs">
              {[4, 3, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => { setMinRating(minRating === String(r) ? '' : String(r)); setCurrentPage(1); }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                    minRating === String(r) ? 'bg-amber-100/70 text-amber-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{r} Stars & above</span>
                  </span>
                  {minRating === String(r) && <span className="text-[10px] text-amber-700">Active</span>}
                </button>
              ))}
            </div>
          </div>

          {/* In-Stock Only */}
          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => { setInStockOnly(e.target.checked); setCurrentPage(1); }}
                className="rounded accent-emerald-600 w-4 h-4"
              />
              <span>In-Stock Items Only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="md:col-span-3 space-y-6">
          {loading ? (
            <div className="py-24 text-center text-slate-400 font-medium">Loading catalog items...</div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3 text-slate-400">
                <SlidersHorizontal className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No matching products found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try widening your price range, clearing active filters, or selecting another department.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200/90 hover:border-emerald-300 transition-all hover:shadow-md relative group flex flex-col justify-between"
                >
                  <div>
                    {/* Flash sale badge & Wishlist button */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      {p.is_flash_sale ? (
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          Save {p.flash_sale_discount_pct}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                          {p.category_name || 'Grocery'}
                        </span>
                      )}

                      {/* Functional Wishlist Button on Product Card */}
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

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-slate-700">{p.rating_avg}</span>
                      <span>({p.reviews_count})</span>
                    </div>

                    {/* Product Name - Clicking opens Product Details Modal */}
                    <h3
                      onClick={() => onQuickView(p.slug)}
                      className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-emerald-600 cursor-pointer min-h-[32px] leading-tight"
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
                        {p.stock_quantity > 5 ? 'In Stock' : `Only ${p.stock_quantity} left`}
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
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === i + 1
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage >= pages}
                onClick={() => setCurrentPage(prev => Math.min(pages, prev + 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
