import React, { useState, useEffect } from 'react';
import { 
  Star, ShoppingCart, Heart, ShieldCheck, Truck, RotateCcw, 
  FileText, Play, RotateCw, CheckCircle, AlertTriangle, 
  Plus, Minus, MessageSquare, Send, Sparkles, ChevronRight 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { api } from '../../api';

export default function ProductDetailPage({ productSlug, onNavigate, onQuickView }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMediaTab, setActiveMediaTab] = useState('images'); // 'images', '360', 'video'
  const [activeImage, setActiveImage] = useState(null);
  const [degree360Index, setDegree360Index] = useState(0);

  // Variant & purchase state
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Review & Q&A submission form
  const [newRating, setNewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQA, setSubmittingQA] = useState(false);

  // Cross-sell bundle selection
  const [bundleSelected, setBundleSelected] = useState(true);

  useEffect(() => {
    if (productSlug) {
      setLoading(true);
      api.getProduct(productSlug)
        .then(data => {
          setProduct(data);
          if (data.images && data.images.length > 0) setActiveImage(data.images[0]);
          if (data.variants && data.variants.length > 0) setSelectedVariant(data.variants[0]);
        })
        .finally(() => setLoading(false));
    }
  }, [productSlug]);

  if (loading) {
    return <div className="py-32 text-center text-slate-400 font-medium">Loading product presentation...</div>;
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <button onClick={() => onNavigate('plp')} className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold">
          Back to Catalog
        </button>
      </div>
    );
  }

  const currentPrice = selectedVariant?.price_override || product.sale_price || product.base_price;
  const currentStock = selectedVariant ? selectedVariant.available_quantity : product.stock_quantity;
  const currentSku = selectedVariant ? selectedVariant.sku : product.sku;

  const handleAddToCart = () => {
    addToCart(product, selectedVariant, quantity);
  };

  const handleAddBundleToCart = () => {
    // Add primary product
    addToCart(product, selectedVariant, 1);
    // Add first cross sell item
    if (product.cross_sells && product.cross_sells.length > 0) {
      addToCart(product.cross_sells[0], null, 1);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await api.addReview(product.id, {
        rating: newRating,
        title: reviewTitle,
        comment: reviewComment,
        customer_name: user?.name || 'Verified Customer'
      });
      // Refresh product
      const updated = await api.getProduct(product.slug);
      setProduct(updated);
      setReviewComment('');
      setReviewTitle('');
    } catch {
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setSubmittingQA(true);
    try {
      await api.askQuestion(product.id, {
        question: newQuestion,
        customer_name: user?.name || 'Customer'
      });
      const updated = await api.getProduct(product.slug);
      setProduct(updated);
      setNewQuestion('');
    } catch {
    } finally {
      setSubmittingQA(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-12">
      {/* Dynamic Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <span onClick={() => onNavigate('home')} className="hover:text-emerald-600 cursor-pointer">Home</span>
        <span>/</span>
        <span onClick={() => onNavigate('plp', { category_id: product.category_id })} className="hover:text-emerald-600 cursor-pointer">
          {product.category_name || 'Catalog'}
        </span>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main PDP Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery & Viewers */}
        <div className="space-y-4">
          {/* Viewer Tabs (High-res Gallery / 360 Interactive / Video Embed) */}
          <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
            <button
              onClick={() => setActiveMediaTab('images')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeMediaTab === 'images' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Photo Gallery
            </button>
            {product.viewer_360_images && product.viewer_360_images.length > 0 && (
              <button
                onClick={() => setActiveMediaTab('360')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeMediaTab === '360' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" /> 360° Interactive Viewer
              </button>
            )}
            {product.video_url && (
              <button
                onClick={() => setActiveMediaTab('video')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeMediaTab === 'video' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Play className="w-3.5 h-3.5" /> Video Embed
              </button>
            )}
          </div>

          {/* Media Display Area */}
          <div className="aspect-square rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative shadow-xs flex items-center justify-center">
            {activeMediaTab === 'images' && (
              <img
                src={activeImage || product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700'}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            )}

            {activeMediaTab === '360' && (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none">
                <img
                  src={product.viewer_360_images[degree360Index % product.viewer_360_images.length]}
                  alt="360 view frame"
                  className="max-h-72 object-contain mb-4 transition-all"
                />
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>Rotate View</span>
                    <span>{(degree360Index * 45) % 360}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    value={degree360Index}
                    onChange={(e) => setDegree360Index(parseInt(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">Drag slider to rotate 360 degrees</p>
                </div>
              </div>
            )}

            {activeMediaTab === 'video' && (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center p-4">
                <iframe
                  className="w-full h-full rounded-lg"
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0"
                  title="Product Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          {/* Gallery Thumbnails */}
          {activeMediaTab === 'images' && product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    activeImage === img ? 'border-emerald-600 scale-105 shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information & Purchasing */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {product.category_name}
              </span>
              {product.brand_name && (
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Brand: {product.brand_name}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating_avg) ? 'fill-amber-400' : 'text-slate-300'}`} />
                ))}
              </div>
              <span className="font-bold text-slate-800">{product.rating_avg}</span>
              <span>({product.reviews_count} verified reviews)</span>
              <span>•</span>
              <span className="font-mono">SKU: {currentSku}</span>
            </div>
          </div>

          {/* Price & B2B Tiered Breaks */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">৳{currentPrice}</span>
              {product.sale_price && (
                <span className="text-base text-slate-400 line-through">৳{product.base_price}</span>
              )}
              {product.is_flash_sale && (
                <span className="text-xs bg-rose-600 text-white font-bold px-2 py-0.5 rounded-md">
                  Save {product.flash_sale_discount_pct}% Flash Deal
                </span>
              )}
            </div>

            {/* Tiered B2B Quantity Breaks */}
            {product.tiered_b2b_pricing && product.tiered_b2b_pricing.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Tiered B2B Wholesale Quantity Breaks:
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.tiered_b2b_pricing.map((tier, idx) => (
                    <div key={idx} className="bg-white border border-emerald-200 text-emerald-900 px-2.5 py-1 rounded-lg text-xs font-semibold">
                      Buy {tier.min_qty}+ units: <span className="font-black text-emerald-700">৳{tier.price}</span>/each
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Stock Indicator */}
          <div>
            {currentStock <= 0 ? (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Backorder / Pre-order Available (Dispatched within 48 Hours)</span>
              </div>
            ) : currentStock <= 5 ? (
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-lg animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Only {currentStock} left in stock - order soon!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>In Stock - Guaranteed 60-Minute Delivery across Dhaka</span>
              </div>
            )}
          </div>

          {/* Dynamic SKU / Variant Pickers */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Available Variations / Pack Options:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      selectedVariant?.id === v.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    {Object.values(v.attributes || {}).join(' / ')}
                    {v.price_override && ` (৳${v.price_override})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & CTA */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3.5 py-3 text-slate-600 hover:bg-slate-200 rounded-l-xl text-sm font-bold transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="px-4 text-sm font-bold text-slate-900">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3.5 py-3 text-slate-600 hover:bg-slate-200 rounded-r-xl text-sm font-bold transition-colors cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={() => toggleWishlist(product)}
              className={`p-3 rounded-lg border transition-all cursor-pointer shadow-xs ${
                isInWishlist(product.id)
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Downloadable PDF link */}
          {product.downloadable_pdf && (
            <div className="pt-2">
              <a
                href={product.downloadable_pdf}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
              >
                <FileText className="w-3.5 h-3.5" /> Download Product Nutrition & Manual (PDF)
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Cross-Sell Engine: Frequently Bought Together Bundle */}
      {product.cross_sells && product.cross_sells.length > 0 && (
        <section className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-900">Frequently Bought Together Bundle</h3>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Primary Product */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
              <img
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                alt={product.name}
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</p>
                <p className="text-xs text-emerald-700 font-extrabold">৳{currentPrice}</p>
              </div>
            </div>

            <span className="text-lg font-black text-emerald-600">+</span>

            {/* Cross Sell Partner Product */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
              <img
                src={product.cross_sells[0].image || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100'}
                alt={product.cross_sells[0].name}
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 line-clamp-1">{product.cross_sells[0].name}</p>
                <p className="text-xs text-emerald-700 font-extrabold">৳{product.cross_sells[0].sale_price || product.cross_sells[0].base_price}</p>
              </div>
            </div>

            <span className="text-lg font-black text-slate-400">=</span>

            {/* Bundle Total & CTA */}
            <div className="ml-auto flex items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Bundle Price (Save 5%)</span>
                <span className="text-xl font-black text-slate-900">
                  ৳{Math.round((currentPrice + (product.cross_sells[0].sale_price || product.cross_sells[0].base_price)) * 0.95)}
                </span>
              </div>
              <button
                onClick={handleAddBundleToCart}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Add Both to Basket
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Description & Technical Specifications Table */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-black text-slate-900">Product Overview & Features</h3>
          <div
            className="prose prose-sm text-slate-600 max-w-none text-xs leading-relaxed"
            dangerouslySetInnerHTML={{ __html: product.description || product.short_description || '<p>No description provided.</p>' }}
          />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900 mb-3">Technical Specifications</h3>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden text-xs">
            {Object.entries(product.technical_specs || {}).map(([key, val], idx) => (
              <div key={key} className={`flex justify-between p-3 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                <span className="font-semibold text-slate-600">{key}</span>
                <span className="font-bold text-slate-900 text-right">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews & Q&A Section */}
      <section className="space-y-6 pt-6 border-t border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900">Customer Reviews & Ratings</h3>
            <p className="text-xs text-slate-500">Real feedback from verified shoppers</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-slate-900">{product.rating_avg}</span>
            <div className="text-amber-400">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating_avg) ? 'fill-amber-400' : 'text-slate-300'}`} />
                ))}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">{product.reviews_count} Reviews</span>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{r.customer_name}</span>
                    {r.verified_purchase && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">{r.created_at.slice(0, 10)}</span>
                </div>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400' : 'text-slate-300'}`} />
                  ))}
                </div>
                {r.title && <h4 className="text-xs font-bold text-slate-800">{r.title}</h4>}
                <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">No reviews yet. Be the first to share your experience!</p>
          )}
        </div>

        {/* Add Review Form */}
        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 max-w-xl">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">Write a Review</h4>
          <form onSubmit={handleSubmitReview} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-semibold">Your Rating:</span>
              <div className="flex gap-1 text-amber-400 cursor-pointer">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    onClick={() => setNewRating(star)}
                    className={`w-5 h-5 ${star <= newRating ? 'fill-amber-400' : 'text-slate-300'}`}
                  />
                ))}
              </div>
            </div>
            <input
              type="text"
              placeholder="Headline / Summary (Optional)"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500 font-medium"
            />
            <textarea
              placeholder="Write your detailed review about product freshness, packaging, or delivery..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500 font-medium"
            />
            <button
              type="submit"
              disabled={submittingReview || !reviewComment.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {submittingReview ? 'Submitting...' : 'Post Customer Review'}
            </button>
          </form>
        </div>

        {/* Product Q&A */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-2">Questions & Answers</h3>
          <div className="space-y-3 mb-4">
            {product.qas && product.qas.length > 0 ? (
              product.qas.map((qa) => (
                <div key={qa.id} className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <p className="font-bold text-slate-900">Q: {qa.question}</p>
                  <p className="text-slate-600 pl-4 border-l-2 border-emerald-500">
                    A: {qa.answer || <span className="italic text-slate-400">Awaiting answer from SuShop specialists.</span>}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">Have a question about storage or ingredients? Ask below!</p>
            )}
          </div>

          <form onSubmit={handleSubmitQuestion} className="flex gap-2 max-w-xl">
            <input
              type="text"
              placeholder="Ask a question about this product..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500 font-medium"
            />
            <button
              type="submit"
              disabled={submittingQA || !newQuestion.trim()}
              className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Ask
            </button>
          </form>
        </div>
      </section>

      {/* Upsell Engine: Related Products */}
      {product.upsells && product.upsells.length > 0 && (
        <section className="pt-8 border-t border-slate-200">
          <h3 className="text-lg font-black text-slate-900 mb-4">You May Also Like</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {product.upsells.map((u) => (
              <div
                key={u.id}
                onClick={() => onNavigate('pdp', { slug: u.slug })}
                className="bg-white p-3 rounded-lg border border-slate-200 hover:border-emerald-400 transition-all cursor-pointer group"
              >
                <img
                  src={u.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                  alt={u.name}
                  className="w-full aspect-square rounded-lg object-cover mb-2 group-hover:scale-105 transition-transform"
                />
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700">{u.name}</h4>
                <p className="text-xs font-black text-slate-900 mt-1">৳{u.sale_price || u.base_price}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

