import { getCommerceBackend } from '@/services/commerce';
import type { Product } from '@/types/product';

/**
 * Route loader for /p/:salesforceId.
 *
 * Fetches a single product through the active CommerceBackend BEFORE the route
 * renders. The route's component reads the result via useLoaderData() — there
 * is no "loading" state inside the component, because the route doesn't render
 * until this promise resolves. That is the Storefront Next / React Router 7
 * data-router pattern.
 *
 * Today this routes through CoreCommerceBackend (Connect API). When
 * VITE_COMMERCE_BACKEND=sfcc, the same loader transparently calls SCAPI.
 */
export async function productDetailLoader({
  params,
}: {
  params: { salesforceId?: string };
}): Promise<{ product: Product }> {
  const id = params.salesforceId;
  if (!id) {
    throw new Response('Missing product id', { status: 400 });
  }
  const product = await getCommerceBackend().getProduct(id);
  return { product };
}
