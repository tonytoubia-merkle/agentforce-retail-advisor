import { CommerceClient, getCommerceClient } from './client';
import { CoreCommerceBackend } from './coreBackend';
import { SfccCommerceBackend } from './sfccBackend';
import type { CommerceBackend } from './backend';

export { CommerceClient, getCommerceClient } from './client';
export { CoreCommerceBackend } from './coreBackend';
export { SfccCommerceBackend } from './sfccBackend';
export type { CommerceBackend } from './backend';
export type {
  CommerceConfig,
  ProductSearchParams,
  OrderRequest,
  OrderResponse,
  CartItem,
} from './types';
export type { BasketItem, ShippingAddress, PaymentInfo } from './client';

let backendInstance: CommerceBackend | null = null;

/**
 * Resolve the active commerce backend.
 *
 * Default: Commerce on Core (this repo's ships-today implementation).
 * Set VITE_COMMERCE_BACKEND=sfcc to route through the SFCC/SCAPI stub —
 * useful for demoing the "flip a switch to Storefront Next" story once
 * a B2C Commerce instance is licensed.
 */
export function getCommerceBackend(): CommerceBackend {
  if (backendInstance) return backendInstance;

  const flag = (import.meta.env.VITE_COMMERCE_BACKEND || 'core').toLowerCase();
  if (flag === 'sfcc') {
    backendInstance = new SfccCommerceBackend();
  } else {
    backendInstance = new CoreCommerceBackend(getCommerceClient());
  }
  return backendInstance;
}
