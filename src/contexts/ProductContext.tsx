import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { fetchProductCatalog, getProductCatalog } from '@/services/catalog/productCatalogService';
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
  const [products, setProducts] = useState<Product[]>(getProductCatalog());
  const [loading, setLoading] = useState(products.length === 0);
  const [error, setError] = useState<Error | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const catalog = await fetchProductCatalog();
      setProducts(catalog);
    } catch (err) {
      console.error('[ProductProvider] Failed to load catalog from CRM:', err);
      setError(err instanceof Error ? err : new Error('Failed to load products'));
      // Keep any previously loaded products
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (products.length === 0) {
      loadProducts();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ProductContext.Provider value={{ products, loading, error, refreshProducts: loadProducts }}>
      {children}
    </ProductContext.Provider>
  );
};
