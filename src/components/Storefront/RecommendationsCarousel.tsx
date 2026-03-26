import { useState, useEffect } from 'react';
import { getProductRecommendations, type PersonalizedProduct } from '@/services/personalization';

const brandColors: Record<string, string> = {
  'SERENE': 'bg-emerald-100 text-emerald-700',
  'LUMIERE': 'bg-purple-100 text-purple-700',
  'DERMAFIX': 'bg-blue-100 text-blue-700',
  'MAISON': 'bg-amber-100 text-amber-700',
};

export const RecommendationsCarousel: React.FC = () => {
  const [products, setProducts] = useState<PersonalizedProduct[]>([]);
  const [introText, setIntroText] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    getProductRecommendations().then((result) => {
      if (cancelled) return;
      if (result && result.products.length > 0) {
        setProducts(result.products);
        setIntroText(result.introText || 'Recommended for You');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, []);

  if (loading || products.length === 0) return null;

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
          <span className="text-xs text-stone-400">{products.length} items</span>
        </div>

        {/* Scrollable row */}
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide"
             style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {products.map((product, i) => {
            const brand = product.brand || '';
            const colorClass = brandColors[brand] || 'bg-stone-100 text-stone-600';
            const productId = product.productSku || product.productId || '';
            // Try to build image URL from product ID pattern
            const imgSrc = product.imageUrl || (productId ? `/assets/products/${productId}.png` : '');

            return (
              <div
                key={product.productId || i}
                className="flex-shrink-0 w-40 sm:w-48 snap-start group"
              >
                {/* Image */}
                <div className="aspect-square bg-stone-50 rounded-xl overflow-hidden mb-2 relative">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={product.name || 'Product'}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-3xl">
                      ✦
                    </div>
                  )}
                  {/* Brand badge */}
                  {brand && (
                    <span className={`absolute top-2 left-2 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${colorClass}`}>
                      {brand}
                    </span>
                  )}
                </div>

                {/* Name + category */}
                <p className="text-xs font-medium text-stone-800 leading-snug line-clamp-2">
                  {product.name}
                </p>
                {product.subCategory && (
                  <p className="text-[10px] text-stone-400 mt-0.5">{product.subCategory}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
