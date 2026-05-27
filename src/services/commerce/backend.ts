import type { Product } from '@/types/product';
import type { ProductSearchParams, OrderResponse } from './types';
import type { BasketItem, ShippingAddress } from './client';

/**
 * Commerce backend abstraction.
 *
 * Concrete implementations:
 *   - CoreCommerceBackend (coreBackend.ts) — Commerce on Core via the
 *     Connect API. The default; ships in this repo today.
 *   - SfccCommerceBackend (sfccBackend.ts) — B2C Commerce (SFCC) via SCAPI.
 *     Stubbed until a B2C Commerce instance is licensed. When ready, this is
 *     where Storefront Next-style SCAPI calls live.
 *
 * Consumers (loaders, components, contexts) MUST import `getCommerceBackend()`
 * from `@/services/commerce`, never a concrete class. Switching backends is a
 * single env var flip — `VITE_COMMERCE_BACKEND=core | sfcc`.
 */
export interface CommerceBackend {
  /** Identifier for logging/diagnostics. */
  readonly id: 'core' | 'sfcc';

  /** Search the product catalog. */
  searchProducts(params: ProductSearchParams): Promise<Product[]>;

  /** Fetch a single product by ID. */
  getProduct(productId: string): Promise<Product>;

  /**
   * Full checkout flow: create cart → add items → create checkout/order.
   * Returns an order summary the UI can navigate the user to.
   */
  checkout(params: {
    items: BasketItem[];
    email: string;
    shippingAddress: ShippingAddress;
    paymentMethodId?: string;
  }): Promise<OrderResponse>;
}
