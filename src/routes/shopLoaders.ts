import type { LoaderFunctionArgs } from 'react-router-dom';
import { getProductCatalog, getProductById } from '@/services/catalog/productCatalogService';
import type { Product, ProductCategory } from '@/types/product';

export interface CategoryLoaderData {
  category: ProductCategory;
  products: Product[];
}

export interface ProductDetailRouteData {
  category: ProductCategory;
  product: Product | null;
}

/**
 * Loader for /shop/:category — filters the in-memory catalog (populated by
 * catalogLoader at the root) down to the requested category. Demonstrates the
 * per-route loader pattern even though the data is already in memory; future
 * implementations (especially SFCC/SCAPI) can swap the source here without
 * touching the page component.
 */
export async function categoryLoader({ params }: LoaderFunctionArgs): Promise<CategoryLoaderData> {
  const category = (params.category || '') as ProductCategory;
  const products = getProductCatalog().filter((p) => p.category === category);
  return { category, products };
}

/**
 * Loader for /shop/:category/:productId — resolves the product by slug from
 * the in-memory catalog. Mirrors what StoreContext.derived has been doing
 * inline; lifting it into a loader makes the data dependency explicit and
 * gives the route a real error boundary surface.
 */
export async function productByCategoryLoader({ params }: LoaderFunctionArgs): Promise<ProductDetailRouteData> {
  const category = (params.category || '') as ProductCategory;
  const productId = params.productId || '';
  const product = getProductById(productId) || null;
  return { category, product };
}
