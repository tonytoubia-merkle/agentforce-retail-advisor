import { useState, useEffect, useMemo } from 'react';
import { getProductRecommendations, type PersonalizedProduct } from '@/services/personalization';
import { useStore } from '@/contexts/StoreContext';
import type { Product } from '@/types/product';

const brandColors: Record<string, string> = {
  'SERENE': 'bg-emerald-100 text-emerald-700',
  'LUMIERE': 'bg-purple-100 text-purple-700',
  'DERMAFIX': 'bg-blue-100 text-blue-700',
  'MAISON': 'bg-amber-100 text-amber-700',
};

interface Props {
  /** Full product catalog — used to resolve images, categories, and click navigation */
  products: Product[];
}

export const RecommendationsCarousel: React.FC<Props> = ({ products: catalog }) => {
  const [recs, setRecs] = useState<PersonalizedProduct[]>([]);
  const [introText, setIntroText] = useState('');
  const [loading, setLoading] = useState(true);
  const { navigateToProduct } = useStore();

  // Build a lookup: Product2 ID → catalog Product (for image, category, click)
  const catalogById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of catalog) {
      if (p.salesforceId) map.set(p.salesforceId, p);
    }
    return map;
  }, [catalog]);

  useEffect(() => {
    let cancelled = false;
    getProductRecommendations().then((result) => {
      if (cancelled) return;
      if (result && result.products.length > 0) {
        setRecs(result.products);
        setIntroText(result.introText || 'Recommended for You');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, []);

  if (loading || recs.length === 0) return null;

  return (
    <section className="py-8 bg-white border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-rose-400 font-medium mb-1">
              Salesforce Personalization
            </p>
            <h2 className="text-xl sm:text-2xl font-medium text-stone-900">
              {introText}
            </h2>
          </div>
          <span className="text-xs text-stone-400">{recs.length} items</span>
        </div>

        {/* Scrollable row */}
        <div
          className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {recs.map((rec, i) => {
            // Try to match against the full catalog by Product2 ID
            const catalogProduct = rec.productId ? catalogById.get(rec.productId) : undefined;

            // Resolve display fields: catalog first, then personalization response
            const name = rec.name || catalogProduct?.name || 'Product';
            const brand = rec.brand || catalogProduct?.brand || '';
            const category = rec.subCategory || catalogProduct?.category || '';
            const imgSrc = catalogProduct?.imageUrl || rec.imageUrl || '';
            const colorClass = brandColors[brand] || 'bg-stone-100 text-stone-600';

            return (
              <div
                key={rec.productId || i}
                className={`flex-shrink-0 w-40 sm:w-48 snap-start group ${catalogProduct ? 'cursor-pointer' : ''}`}
                onClick={() => catalogProduct && navigateToProduct(catalogProduct)}
              >
                {/* Image */}
                <div className="aspect-square bg-stone-50 rounded-xl overflow-hidden mb-2 relative">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={name}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = 'none';
                        el.parentElement!.querySelector('.placeholder')?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`placeholder w-full h-full flex items-center justify-center text-stone-300 text-3xl absolute inset-0 ${imgSrc ? 'hidden' : ''}`}>
                    ✦
                  </div>
                  {/* Brand badge */}
                  {brand && (
                    <span className={`absolute top-2 left-2 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${colorClass}`}>
                      {brand}
                    </span>
                  )}
                </div>

                {/* Name + category */}
                <p className="text-xs font-medium text-stone-800 leading-snug line-clamp-2">
                  {name}
                </p>
                {category && (
                  <p className="text-[10px] text-stone-400 mt-0.5 capitalize">{category}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
