import React, { useState, useEffect } from 'react';
import { 
  Filter, SlidersHorizontal, Star, CheckCircle, 
  Eye, ShoppingCart, ArrowUpDown, ChevronLeft, ChevronRight, X 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { api } from '../../api';

export default function ProductListingPage({ initialParams = {}, onNavigate, onQuickView }) {
  const { addToCart } = useCart();
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span onClick={() => onNavigate('home')} className="hover:text-emerald-600 cursor-pointer">Home</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Catalog</span>
            {search && <span>/ Search: "{search}"</span>}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isFlashSale ? '⚡ Flash Sale Deals' : search ? `Search Results for "${search}"` : 'All Products & Aisles'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Showing {products.length} of {total} products found</p>
        </div>

        {/* Sorting & Filter toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>

          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
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
        {/* Multi-facet Sidebar Filters */}
        <aside className={`md:block ${mobileFilterOpen ? 'block' : 'hidden'} md:col-span-1 space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" /> Multi-Facet Filters
            </span>
            <button
              onClick={resetFilters}
              className="text-[11px] text-emerald-700 hover:underline font-bold cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Department / Category Tree */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Category</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto text-xs pr-1">
              <label className="flex items-center gap-2 text-slate-700 hover:text-emerald-700 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={!selectedCategory}
                  onChange={() => { setSelectedCategory(''); setCurrentPage(1); }}
                  className="accent-emerald-600"
                />
                <span>All Departments</span>
              </label>
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-slate-700 hover:text-emerald-700 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={String(selectedCategory) === String(c.id)}
                    onChange={() => { setSelectedCategory(c.id); setCurrentPage(1); }}
                    className="accent-emerald-600"
                  />
                  <span>{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Brand</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto text-xs pr-1">
              <label className="flex items-center gap-2 text-slate-700 hover:text-emerald-700 cursor-pointer">
                <input
                  type="radio"
                  name="brand"
                  checked={!selectedBrand}
                  onChange={() => { setSelectedBrand(''); setCurrentPage(1); }}
                  className="accent-emerald-600"
                />
                <span>All Brands</span>
              </label>
              {brands.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-slate-700 hover:text-emerald-700 cursor-pointer">
                  <input
                    type="radio"
                    name="brand"
                    checked={String(selectedBrand) === String(b.id)}
                    onChange={() => { setSelectedBrand(b.id); setCurrentPage(1); }}
                    className="accent-emerald-600"
                  />
                  <span>{b.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Slider / Inputs */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Price Range (৳)</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500 font-semibold"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500 font-semibold"
              />
            </div>
          </div>

          {/* Customer Rating Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Customer Rating</h4>
            <div className="space-y-1 text-xs">
              {[4, 3, 2].map((r) => (
                <label key={r} className="flex items-center gap-2 text-slate-700 hover:text-amber-600 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === String(r)}
                    onChange={() => { setMinRating(String(r)); setCurrentPage(1); }}
                    className="accent-amber-500"
                  />
                  <span className="flex items-center gap-1 font-semibold">
                    {r}★ & above
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Stock Status Filter */}
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
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <SlidersHorizontal className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No matching products found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try widening your price range, clearing active filters, or searching for broader terms like "milk", "apple", or "rice".
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-emerald-300 transition-all hover:shadow-md relative group flex flex-col justify-between"
                >
                  <div>
                    {/* Badge */}
                    {p.is_flash_sale && (
                      <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider z-10 shadow-xs">
                        Save {p.flash_sale_discount_pct}%
                      </span>
                    )}

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
                        {p.stock_quantity > 5 ? 'In Stock' : `Only ${p.stock_quantity} left`}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(p, null, 1)}
                      className="w-full bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Basket</span>
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
                className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-100 cursor-pointer"
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

