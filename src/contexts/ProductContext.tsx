import { createContext, useContext, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useRouteLoaderData, useRevalidator } from 'react-router-dom';
import { useDemo } from '@/contexts/DemoContext';
import type { CatalogLoaderData } from '@/routes/catalogLoader';
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

/**
 * Consumes the catalog from the DemoRoot's `catalogLoader` (route id `demo-root`).
 *
 * Replaces the useEffect-driven fetch the provider used to do — the router now
 * owns the fetch lifecycle. This component is left in place so that the
 * `useProducts()` API the rest of the app already calls keeps working without
 * a sweep through every consumer.
 *
 * Demo-config changes (e.g. user picks a different demo via DemoPanel) are
 * not URL navigations, so the router does not re-run loaders on its own —
 * useRevalidator() is wired up to trigger a revalidation when config.id flips.
 */
export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { config } = useDemo();
  const revalidator = useRevalidator();
  const loaderData = useRouteLoaderData('demo-root') as CatalogLoaderData | undefined;
  const products = loaderData?.products ?? [];

  const prevDemoId = useRef(config.id);
  useEffect(() => {
    if (prevDemoId.current !== config.id) {
      prevDemoId.current = config.id;
      revalidator.revalidate();
    }
  }, [config.id, revalidator]);

  const refreshProducts = useCallback(async () => {
    revalidator.revalidate();
  }, [revalidator]);

  return (
    <ProductContext.Provider
      value={{
        products,
        loading: revalidator.state === 'loading',
        error: null,
        refreshProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
