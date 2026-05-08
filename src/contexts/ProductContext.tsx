import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { fetchProductCatalog, getProductCatalog } from '@/services/catalog/productCatalogService';
import { useDemo } from '@/contexts/DemoContext';
import { loadDemoProducts } from '@/services/demoData';
import type { Product } from '@/types/product';

interface ProductContextValue {
  products: Product[];
  loading: boolean;
  error: Error | null;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextValue>({
  products: [],
  loading: true,
  error: null,
  refreshProducts: async () => {},
});

export const useProducts = () => useContext(ProductContext);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { config, isDefault } = useDemo();
  const [products, setProducts] = useState<Product[]>(getProductCatalog());
  const [loading, setLoading] = useState(products.length === 0);
  const [error, setError] = useState<Error | null>(null);

  // Stale-fetch guard. Each `loadProducts` call increments this counter and
  // captures its own value; before any setProducts/setLoading/setError, it
  // checks that no newer load has started. Without this, a CRM fetch
  // started while config.id was 'default' could resolve AFTER a Supabase
  // fetch for the actual demo and overwrite the demo's products with the
  // beauty CRM catalog (the bug we hit when shipping Tachibana).
  const fetchIdRef = useRef(0);

  const loadProducts = useCallback(async () => {
    const myFetchId = ++fetchIdRef.current;
    const isStale = () => myFetchId !== fetchIdRef.current;

    try {
      setLoading(true);
      setError(null);

      // For custom demos, try Supabase first.
      if (!isDefault && config.id !== 'default') {
        const demoProducts = await loadDemoProducts(config.id);
        if (isStale()) return;
        if (demoProducts && demoProducts.length > 0) {
          setProducts(demoProducts);
          return;
        }
      }

      // Fall back to CRM catalog (or mock data).
      const catalog = await fetchProductCatalog();
      if (isStale()) return;
      setProducts(catalog);
    } catch (err) {
      if (isStale()) return;
      console.error('[ProductProvider] Failed to load catalog:', err);
      setError(err instanceof Error ? err : new Error('Failed to load products'));
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [config.id, isDefault]);

  useEffect(() => {
    if (products.length === 0 || !isDefault) {
      loadProducts();
    }
  }, [config.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ProductContext.Provider value={{ products, loading, error, refreshProducts: loadProducts }}>
      {children}
    </ProductContext.Provider>
  );
};
