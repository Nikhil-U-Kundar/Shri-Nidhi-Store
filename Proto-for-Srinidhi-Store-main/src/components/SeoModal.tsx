import React from 'react';
import { X, Code2, CheckCircle2, ShieldCheck, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SeoModal: React.FC = () => {
  const { isSeoModalOpen, setIsSeoModalOpen } = useApp();

  if (!isSeoModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 text-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-700 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold">
              SEO Architecture & Schema.org Microdata
            </h3>
          </div>
          <button
            onClick={() => setIsSeoModalOpen(false)}
            className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto space-y-4 text-xs font-mono">
          <div>
            <p className="text-emerald-400 font-sans font-semibold mb-1">
              1. Local GroceryStore Schema (JSON-LD Embedded in &lt;head&gt;):
            </p>
            <pre className="bg-stone-950 p-4 rounded-2xl overflow-x-auto text-[11px] text-amber-200 border border-stone-800 leading-relaxed">
{`{
  "@context": "https://schema.org",
  "@type": "GroceryStore",
  "name": "Sri Nidhi Store & General Store",
  "image": "https://images.unsplash.com/photo-1542838132-92c53300491e",
  "telephone": "+919876543210",
  "priceRange": "₹₹",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Shop 12, Main Market, Sector 14",
    "addressLocality": "Gurugram",
    "addressRegion": "Haryana",
    "postalCode": "122001",
    "addressCountry": "IN"
  },
  "paymentAccepted": "Cash, UPI, Credit Card, Kirana Khata Store Credit"
}`}
            </pre>
          </div>

          <div>
            <p className="text-emerald-400 font-sans font-semibold mb-1">
              2. Search Engine Indexing & Guest Crawlability:
            </p>
            <div className="bg-stone-950 p-4 rounded-2xl text-[11px] space-y-1.5 border border-stone-800">
              <p className="text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong>Public &amp; Crawlable:</strong> Home, Product Catalog, Category Filters, Weekend Deals, Store Policies.
                </span>
              </p>
              <p className="text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong>Open Pricing:</strong> Zero paywalls or forced login modals for Googlebot / Bingbot to index daily Mandi prices.
                </span>
              </p>
              <p className="text-red-300 flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 flex items-center justify-center font-bold text-red-400">✕</span>
                <span>
                  <strong>Protected via Robots / Noindex:</strong> /admin, /checkout, /khata, /account (Private customer data guarded).
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
