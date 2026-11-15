import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, ChevronDown, ChevronUp, Search, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../../api';

// Content Page Viewer (Privacy, Terms, Returns, Timelines, About)
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
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{page.title}</h1>
        <p className="text-xs text-slate-400 mt-1">Official Policy Document • SuShop Everyday Essentials</p>
      </div>

      <div
        className="prose prose-slate max-w-none text-xs leading-relaxed"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}

// Store & Warehouse Locator with interactive cards & service badges
export function StoreLocatorView() {
  const [stores, setStores] = useState([]);
  const [searchCity, setSearchCity] = useState('');

  useEffect(() => {
    api.getStoreLocations().then(s => setStores(s || []));
  }, []);

  const filtered = stores.filter(s => s.city.toLowerCase().includes(searchCity.toLowerCase()) || s.name.toLowerCase().includes(searchCity.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="max-w-xl">
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          Physical Presence
        </span>
        <h1 className="text-3xl font-black text-slate-900 mt-1">Store & Warehouse Locator</h1>
        <p className="text-xs text-slate-500 mt-1">
          Find your nearest SuShop Mega Central Hub, Cold Storage Warehouse, or Express Pickup Point.
        </p>

        <div className="relative mt-4">
          <input
            type="text"
            placeholder="Search by city (e.g. Dhaka, Banani, Uttara, Chattogram)..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500 font-semibold"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 mb-1">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {s.city}</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">Hub #{s.id}</span>
              </div>
              <h3 className="text-sm font-black text-slate-900">{s.name}</h3>
              <p className="text-xs text-slate-600 mt-1">{s.address}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-500">
              <p className="flex items-center gap-2 font-medium"><Clock className="w-3.5 h-3.5 text-slate-400" /> {s.hours}</p>
              <p className="flex items-center gap-2 font-mono"><Phone className="w-3.5 h-3.5 text-slate-400" /> {s.phone}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {s.services?.map((srv, idx) => (
                  <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
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

// Interactive FAQ Hub with categorized accordion and instant search
export function FAQHubView() {
  const [faqs, setFaqs] = useState([]);
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState({});

  useEffect(() => {
    api.getFAQs().then(f => setFaqs(f || []));
  }, []);

  const toggleAccordion = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenIndex(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
          Help Center
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Interactive FAQ Hub</h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Instant answers to your queries about 60-min express fulfillment, payment gateways, product freshness, and RMA returns.
        </p>

        <div className="relative max-w-md mx-auto mt-4">
          <input
            type="text"
            placeholder="Type your question (e.g. delivery, bKash, return, fresh)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-2xl text-xs outline-none focus:border-emerald-500 font-semibold shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
      </div>

      <div className="space-y-6">
        {faqs.map((cat, catIdx) => (
          <div key={catIdx} className="space-y-3">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">{cat.category}</h3>
            <div className="space-y-2">
              {cat.questions
                .filter(q => q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase()))
                .map((q, qIdx) => {
                  const isOpen = !!openIndex[`${catIdx}-${qIdx}`];
                  return (
                    <div key={qIdx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      <button
                        onClick={() => toggleAccordion(catIdx, qIdx)}
                        className="w-full p-4 text-left text-xs font-bold text-slate-900 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                      >
                        <span>{q.q}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                          {q.a}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

