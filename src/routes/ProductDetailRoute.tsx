import { useLoaderData, useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { ProductDetailPage } from '@/components/Storefront/ProductDetailPage';
import type { Product } from '@/types/product';

/**
 * Route component for /p/:salesforceId.
 *
 * Renders the existing ProductDetailPage with the product loaded by
 * productDetailLoader. The product detail UI is reused as-is — the loader is
 * the only thing different about this path vs. the legacy /shop/:category/:id
 * flow, which derives the product from the in-memory catalog instead.
 *
 * Demo narrative: same page, two architectures. /shop/* is SPA-internal-state.
 * /p/* is React Router 7 data-router (the Storefront Next pattern).
 */
export function ProductDetailRoute() {
  const { product } = useLoaderData() as { product: Product };
  return <ProductDetailPage product={product} />;
}

/** Friendly error boundary surfaced when the loader rejects. */
export function ProductDetailErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error loading product.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-light text-stone-900 mb-2">Couldn't load this product</h1>
        <p className="text-stone-600 mb-6">{message}</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2 rounded-full bg-stone-900 text-white text-sm hover:bg-stone-700 transition-colors"
        >
          Back to store
        </button>
      </div>
    </div>
  );
}
