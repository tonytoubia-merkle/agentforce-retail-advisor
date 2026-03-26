import { useState, useEffect } from 'react';
import { getProductRecommendations, type PersonalizedProduct } from '@/services/personalization';
import { useStore } from '@/contexts/StoreContext';
import type { Product } from '@/types/product';

const brandColors: Record<string, string> = {
  'SERENE': 'bg-emerald-100 text-emerald-700',
  'LUMIERE': 'bg-purple-100 text-purple-700',
  'DERMAFIX': 'bg-blue-100 text-blue-700',
  'MAISON': 'bg-amber-100 text-amber-700',
};

interface EnrichedProduct extends PersonalizedProduct {
  crmImageUrl?: string;
  crmCategory?: string;
  crmBrand?: string;
  catalogProduct?: Product;
}

interface Props {
  products: Product[];
}

/**
 * Fetch product details from CRM Product2 by Salesforce IDs.
 * Returns a map of ID → { imageUrl, category, brand }.
 */
async function enrichFromCRM(productIds: string[]): Promise<Map<string, { imageUrl: string; category: string; brand: string }>> {
  const map = new Map<string, { imageUrl: string; category: string; brand: string }>();
  if (productIds.length === 0) return map;

  // Build SOQL IN clause
  const idList = productIds.map(id => `'${id}'`).join(',');
  const soql = `SELECT Id, Name, Image_URL__c, Category__c, Brand__c FROM Product2 WHERE Id IN (${idList}) AND IsActive = true`;

  try {
    const res = await fetch(`/api/datacloud/query/?q=${encodeURIComponent(soql)}`);
    if (!res.ok) return map;
    const data = await res.json();
    for (const r of (data.records || [])) {
      map.set(r.Id, {
        imageUrl: r.Image_URL__c || '',
        category: r.Category__c || '',
        brand: r.Brand__c || '',
      });
    }
  } catch (err) {
    console.warn('[RecommendationsCarousel] CRM enrichment failed:', err);
  }
  return map;
}

export const RecommendationsCarousel: React.FC<Props> = ({ products: catalog }) => {
  const [enrichedProducts, setEnrichedProducts] = useState<EnrichedProduct[]>([]);
  const [introText, setIntroText] = useState('');
  const [loading, setLoading] = useState(true);
  const { navigateToProduct } = useStore();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Step 1: Get personalization recommendations
        const result = await getProductRecommendations();
        if (cancelled || !result || result.products.length === 0) {
          setLoading(false);
          return;
        }

        setIntroText(result.introText || 'Recommended for You');

        // Step 2: Enrich with CRM data (images, categories)
        const productIds = result.products
          .map(p => p.productId)
          .filter((id): id is string => !!id);
        const crmData = await enrichFromCRM(productIds);

        // Step 3: Build catalog name lookup for click navigation
        const catalogByName = new Map<string, Product>();
        for (const p of catalog) {
          catalogByName.set(p.name.toLowerCase(), p);
        }

        // Step 4: Merge everything
        const enriched: EnrichedProduct[] = result.products.map(rec => {
          const crm = rec.productId ? crmData.get(rec.productId) : undefined;
          const catProduct = rec.name ? catalogByName.get(rec.name.toLowerCase()) : undefined;
          return {
            ...rec,
            crmImageUrl: crm?.imageUrl || catProduct?.imageUrl || '',
            crmCategory: crm?.category || catProduct?.category || rec.subCategory || '',
            crmBrand: crm?.brand || catProduct?.brand || rec.brand || '',
            catalogProduct: catProduct,
          };
        });

        if (!cancelled) setEnrichedProducts(enriched);
      } catch (err) {
        console.warn('[RecommendationsCarousel] Failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [catalog]);

  if (loading || enrichedProducts.length === 0) return null;

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
          <span className="text-xs text-stone-400">{enrichedProducts.length} items</span>
        </div>

        <div
          className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {enrichedProducts.map((product, i) => {
            const brand = product.crmBrand || product.brand || '';
            const category = product.crmCategory || product.subCategory || '';
            const imgSrc = product.crmImageUrl || product.catalogProduct?.imageUrl || product.imageUrl || '';
            const colorClass = brandColors[brand] || 'bg-stone-100 text-stone-600';
            const clickable = !!product.catalogProduct;

            return (
              <div
                key={product.productId || i}
                className={`flex-shrink-0 w-40 sm:w-48 snap-start group ${clickable ? 'cursor-pointer' : ''}`}
                onClick={() => product.catalogProduct && navigateToProduct(product.catalogProduct)}
              >
                <div className="aspect-square bg-stone-50 rounded-xl overflow-hidden mb-2 relative">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={product.name || 'Product'}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-3xl">
                      ✦
                    </div>
                  )}
                  {brand && (
                    <span className={`absolute top-2 left-2 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${colorClass}`}>
                      {brand}
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium text-stone-800 leading-snug line-clamp-2">
                  {product.name}
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
