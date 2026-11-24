import React, { useState, useEffect } from 'react';
import { 
  MapPin, Phone, Clock, ChevronDown, ChevronUp, Search, 
  Mail, MessageCircle, PhoneCall, Headphones, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, HelpCircle
} from 'lucide-react';
import { api } from '../../api';

// 1. Content Page Viewer (Privacy, Terms, Returns, Timelines, About)
export function ContentPageView({ slug }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getPage(slug)
      .then(p => setPage(p))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="py-24 text-center text-slate-400">Loading document...</div>;
  if (!page) return <div className="py-24 text-center text-slate-500">Document not found.</div>;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{page.title}</h1>
        <p className="text-xs text-slate-400 mt-1">Official Policy Document • SuShop Everyday Essentials</p>
      </div>

      <div
        className="prose prose-slate max-w-none text-xs leading-relaxed"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}

// 2. Store & Warehouse Locator with interactive cards & service badges
export function StoreLocatorView({ onNavigate }) {
  const [stores, setStores] = useState([]);
  const [searchCity, setSearchCity] = useState('');

  useEffect(() => {
    api.getStoreLocations().then(s => setStores(s || []));
  }, []);

  const filtered = stores.filter(s => 
    s.city.toLowerCase().includes(searchCity.toLowerCase()) || 
    s.name.toLowerCase().includes(searchCity.toLowerCase())
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="max-w-xl">
        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
          Physical Presence
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Store & Warehouse Locator</h1>
        <p className="text-xs text-slate-500 mt-1">
          Find your nearest SuShop Mega Central Hub, Cold Storage Warehouse, or Express Pickup Point.
        </p>

        <div className="relative mt-4">
          <input
            type="text"
            placeholder="Search by city or area (e.g. Banani, Uttara, Mirpur, Chattogram)..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-9 pr-3 py-2.5 rounded-lg text-xs outline-none focus:border-emerald-500 font-semibold shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 mb-1">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {s.city}</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">Hub #{s.id}</span>
              </div>
              <h3 className="text-sm font-black text-slate-900">{s.name}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.address}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-500">
              <p className="flex items-center gap-2 font-medium"><Clock className="w-3.5 h-3.5 text-slate-400" /> {s.hours}</p>
              <p className="flex items-center gap-2 font-mono"><Phone className="w-3.5 h-3.5 text-slate-400" /> {s.phone}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {s.services?.map((srv, idx) => (
                  <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                    {srv}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. Eye-Catching Modern Contact Us & Interactive FAQ Hub
export function FAQHubView({ onNavigate }) {
  const [faqs, setFaqs] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openIndex, setOpenIndex] = useState({});

  useEffect(() => {
    api.getFAQs().then(f => setFaqs(f || []));
  }, []);

  const toggleAccordion = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenIndex(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter categories and questions
  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => {
      const matchesSearch = !search || 
        q.q.toLowerCase().includes(search.toLowerCase()) || 
        q.a.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === 'all' || cat.category === activeCategory;
      return matchesSearch && matchesCat;
    })
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Eye-Catching Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-xl p-8 sm:p-12 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-xs border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Support & Instant Help
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            How Can We Help You Today?
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
            Get instant answers from our customer care team via WhatsApp or direct phone call, or search our quick FAQs below.
          </p>
        </div>

        {/* Decorative background visual icon */}
        <div className="absolute right-4 bottom-2 opacity-10 pointer-events-none hidden md:block">
          <Headphones className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* ================= 1. PROMINENT CONTACT OPTIONS (WHATSAPP & DIRECT CALL) ================= */}
      <section className="space-y-4">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-black text-slate-900">Direct Contact Channels</h2>
          <p className="text-xs text-slate-500">Choose your preferred method to speak directly with an agent</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* OPTION 1: WhatsApp Support (High-Impact Hero Card) */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-white to-white p-6 sm:p-7 rounded-xl border-2 border-emerald-500/30 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  Instant Reply
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Fastest Support</span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">WhatsApp Live Chat</h3>
                <p className="text-base font-mono font-black text-emerald-700 mt-1">+880 1712-345678</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-600 font-medium">
                <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                  ⚡ 2-min response
                </span>
                <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                  📸 Send order photos & screenshots
                </span>
              </div>
            </div>

            <a
              href="https://wa.me/8801712345678?text=Hello%20SuShop,%20I%20need%20assistance%20with%20my%20order."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold py-3 px-5 rounded-lg text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:translate-y-[-1px]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Chat on WhatsApp</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>

          {/* OPTION 2: Direct Phone Call (High-Impact Hero Card) */}
          <div className="bg-gradient-to-br from-slate-900/5 via-white to-white p-6 sm:p-7 rounded-xl border border-slate-300 hover:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 group-hover:scale-105 transition-transform">
                  <PhoneCall className="w-7 h-7 text-emerald-400" />
                </div>
                <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                  9:00 AM – 11:00 PM
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Toll-Free Helpline</span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">Mobile & Telephone Hotline</h3>
                <p className="text-base font-mono font-black text-slate-900 mt-1">+880 9610-SUSHOP</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-600 font-medium">
                <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                  📞 Direct agent coordination
                </span>
                <span className="bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                  🗓️ Open 7 days a week
                </span>
              </div>
            </div>

            <a
              href="tel:+8809610787467"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-5 rounded-lg text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-900/20 hover:translate-y-[-1px]"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Call Helpline Now</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>

        {/* Compact Email Helper Strip */}
        <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Need formal invoice, corporate or email inquiry? Write to: <strong className="text-slate-900">support@sushop.com</strong></span>
          </div>
          <a
            href="mailto:support@sushop.com?subject=Customer%20Support%20Inquiry"
            className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline shrink-0"
          >
            Send Email →
          </a>
        </div>
      </section>

      {/* ================= 2. INTERACTIVE FAQ (CATEGORY TABS & CLEAN ACCORDION) ================= */}
      <section className="space-y-6 pt-4 border-t border-slate-200">
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-xl font-black text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500">Instant answers to express delivery, payments, freshness, and returns</p>
        </div>

        {/* Live Search and Category Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Questions
            </button>
            {faqs.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCategory(cat.category)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.category
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search in questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-9 pr-3 py-1.5 rounded-lg text-xs outline-none focus:border-emerald-500 font-medium shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Accordion Questions */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No questions matched your search keyword.</p>
              <button
                onClick={() => { setSearch(''); setActiveCategory('all'); }}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-2">
                <div className="flex items-center gap-2 pt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{cat.category}</h3>
                </div>

                <div className="space-y-2">
                  {cat.questions.map((q, qIdx) => {
                    const isOpen = !!openIndex[`${catIdx}-${qIdx}`];
                    return (
                      <div 
                        key={qIdx} 
                        className={`bg-white rounded-lg border transition-all ${
                          isOpen ? 'border-emerald-500/50 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <button
                          onClick={() => toggleAccordion(catIdx, qIdx)}
                          className="w-full p-3.5 text-left text-xs font-bold text-slate-900 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer transition-colors"
                        >
                          <span className="pr-4">{q.q}</span>
                          <span className={`p-1 rounded-md text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-emerald-600' : ''}`}>
                            <ChevronDown className="w-4 h-4" />
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-3.5 pb-3.5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5 bg-slate-50/40">
                            {q.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
