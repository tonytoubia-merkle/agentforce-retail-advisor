import type { Product } from '@/types/product';
import type { ProductSearchParams, OrderResponse } from './types';
import type { BasketItem, ShippingAddress } from './client';
import type { CommerceBackend } from './backend';

/**
 * B2C Commerce (SFCC) backend — Storefront Next / SCAPI implementation.
 *
 * STATUS: Stub. Requires a licensed B2C Commerce instance and SCAPI credentials.
 * When provisioning lands, replace each method body with a SCAPI call. The most
 * idiomatic path is the commerce-sdk-isomorphic client; AI Gateway / Functions
 * proxy the auth so the browser never sees the SLAS short-code token.
 *
 * To enable: set VITE_COMMERCE_BACKEND=sfcc plus the SCAPI env vars (short code,
 * organization id, site id, client id).
 */
const NOT_LICENSED = 'SFCC backend not configured. Provision a B2C Commerce instance and set VITE_COMMERCE_BACKEND=sfcc with SCAPI credentials. See src/services/commerce/sfccBackend.ts.';

export class SfccCommerceBackend implements CommerceBackend {
  readonly id = 'sfcc' as const;

  searchProducts(_params: ProductSearchParams): Promise<Product[]> {
    return Promise.reject(new Error(NOT_LICENSED));
  }

  getProduct(_productId: string): Promise<Product> {
    return Promise.reject(new Error(NOT_LICENSED));
  }

  checkout(_params: {
    items: BasketItem[];
    email: string;
    shippingAddress: ShippingAddress;
    paymentMethodId?: string;
  }): Promise<OrderResponse> {
    return Promise.reject(new Error(NOT_LICENSED));
  }
}
