import { useEffect, useMemo, useState } from 'react';
import { SceneProvider } from '@/contexts/SceneContext';
import { ConversationProvider } from '@/contexts/ConversationContext';
import { CustomerProvider } from '@/contexts/CustomerContext';
import { ActivityToastProvider } from '@/components/ActivityToast';
import { AdvisorPage } from '@/components/AdvisorPage';
import { ProductShowcase } from '@/components/ProductShowcase';
import type { Product } from '@/types/product';
import { MOCK_PRODUCTS } from '@/mocks/products';

/**
 * Simple storefront shell that preserves the existing Beauty Advisor experience.
 * - Default route remains the Beauty Advisor
 * - A toggle button allows switching to the Storefront view, which lists products
 *   from the new Node BFF endpoints with a safe local fallback.
 */
function App() {
  const [mode, setMode] = useState<'advisor' | 'storefront'>('advisor');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic fetcher that calls our Node BFF endpoints and falls back to local assets/mocks
  useEffect(() => {
    if (mode !== 'storefront') return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Try hitting our new BFF endpoint. Authorization header is optional;
        // if omitted, server returns empty set and we fall back to local mocks.
        const res = await fetch('/api/products?limit=24', {
          headers: {
            accept: 'application/json',
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list: Product[] = (data.products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand || 'Unknown',
          category: p.category || 'uncategorized',
          price: p.price || 0,
          currency: p.currency || 'USD',
          description: p.description || '',
          shortDescription: p.shortDescription || '',
          imageUrl: p.imageUrl || '',
          images: p.images || [],
          attributes: p.attributes || {},
          rating: p.rating || 0,
          reviewCount: p.reviewCount || 0,
          inStock: p.inStock ?? true,
        }));
        if (!cancelled) {
          // If empty (no auth), fall back to local mocks to preserve UX
          if (list.length === 0) {
            if (!cancelled) setProducts(MOCK_PRODUCTS);
          } else {
            setProducts(list);
          }
        }
      } catch (e: any) {
        // Fallback on error as well
        try {
          if (!cancelled) setProducts(MOCK_PRODUCTS);
        } catch {
          if (!cancelled) setError(e?.message || 'Failed to load products');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const header = useMemo(() => (
    <div className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-200/30">
      <div className="text-xl font-semibold">Retail Advisor</div>
      <div className="flex gap-2">
        <button
          className={`px-3 py-1 rounded ${mode === 'advisor' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('advisor')}
          aria-pressed={mode === 'advisor'}
        >
          Beauty Advisor
        </button>
        <button
          className={`px-3 py-1 rounded ${mode === 'storefront' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('storefront')}
          aria-pressed={mode === 'storefront'}
        >
          Storefront
        </button>
      </div>
    </div>
  ), [mode]);

  return (
    <CustomerProvider>
      <SceneProvider>
        <ActivityToastProvider>
          {header}
          {mode === 'advisor' ? (
            <ConversationProvider>
              <AdvisorPage />
            </ConversationProvider>
          ) : (
            <div className="p-4">
              {loading && <div>Loading products…</div>}
              {error && <div className="text-red-600">Error: {error}</div>}
              {!loading && !error && <ProductShowcase products={products} layout="product-grid" />}
            </div>
          )}
        </ActivityToastProvider>
      </SceneProvider>
    </CustomerProvider>
  );
}

export default App;
