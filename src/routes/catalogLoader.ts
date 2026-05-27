import { getDemoConfig } from '@/contexts/DemoContext';
import { fetchProductCatalog } from '@/services/catalog/productCatalogService';
import { loadDemoProducts } from '@/services/demoData';
import type { Product } from '@/types/product';

export interface CatalogLoaderData {
  products: Product[];
}

/**
 * Root catalog loader for DemoRoot.
 *
 * Replaces the useEffect-driven fetch in ProductProvider. The route does not
 * render until this resolves — components downstream can assume the catalog
 * is ready by the time they mount.
 *
 * Resolution order matches the prior ProductContext.loadProducts:
 *   1. Custom demo? -> try Supabase first.
 *   2. Otherwise (or on empty/failure) -> CRM Product2 catalog via
 *      productCatalogService.fetchProductCatalog (proxied SOQL today).
 *
 * Errors are swallowed and surfaced as an empty catalog so the storefront
 * still renders (matches prior behavior — broken catalog should not blank
 * the whole storefront).
 */
export async function catalogLoader(): Promise<CatalogLoaderData> {
  const config = getDemoConfig();
  const isDefault = config.id === 'default';

  try {
    if (!isDefault) {
      const demoProducts = await loadDemoProducts(config.id);
      if (demoProducts && demoProducts.length > 0) {
        return { products: demoProducts };
      }
    }
    const catalog = await fetchProductCatalog();
    return { products: catalog };
  } catch (err) {
    console.error('[catalogLoader] Failed to load catalog:', err);
    return { products: [] };
  }
}
