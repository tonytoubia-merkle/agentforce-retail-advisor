import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // For custom demos, try Supabase first
      if (!isDefault && config.id !== 'default') {
        const demoProducts = await loadDemoProducts(config.id);
        if (demoProducts && demoProducts.length > 0) {
          setProducts(demoProducts);
          return;
        }
      }

      // Fall back to CRM catalog (or mock data)
      const catalog = await fetchProductCatalog();
      setProducts(catalog);
    } catch (err) {
      console.error('[ProductProvider] Failed to load catalog:', err);
      setError(err instanceof Error ? err : new Error('Failed to load products'));
    } finally {
      setLoading(false);
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
