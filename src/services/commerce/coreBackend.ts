import type { Product } from '@/types/product';
import type { ProductSearchParams, OrderResponse } from './types';
import { CommerceClient, type BasketItem, type ShippingAddress } from './client';
import type { CommerceBackend } from './backend';

/**
 * Commerce on Core backend. Thin adapter over CommerceClient (Connect API).
 * Lives at /services/data/vXX.X/commerce/webstores/{webstoreId}/* on the CRM org.
 */
export class CoreCommerceBackend implements CommerceBackend {
  readonly id = 'core' as const;

  constructor(private client: CommerceClient) {}

  searchProducts(params: ProductSearchParams): Promise<Product[]> {
    return this.client.searchProducts(params);
  }

  getProduct(productId: string): Promise<Product> {
    return this.client.getProduct(productId);
  }

  checkout(params: {
    items: BasketItem[];
    email: string;
    shippingAddress: ShippingAddress;
    paymentMethodId?: string;
  }): Promise<OrderResponse> {
    return this.client.checkout(params);
  }
}
