import { useSyncExternalStore } from 'react';
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

export type CommerceBackendId = 'core' | 'sfcc';

// ── State ──────────────────────────────────────────────────────────
//
// The active backend can be swapped at runtime (DemoPanel/footer toggle).
// Default is read from VITE_COMMERCE_BACKEND on first access; switching
// after that point is a setter call + a notification to subscribers.

function readInitialId(): CommerceBackendId {
  const flag = (import.meta.env.VITE_COMMERCE_BACKEND || 'core').toLowerCase();
  return flag === 'sfcc' ? 'sfcc' : 'core';
}

let backendId: CommerceBackendId = readInitialId();
let backendInstance: CommerceBackend | null = null;
const subscribers = new Set<() => void>();

function makeBackend(id: CommerceBackendId): CommerceBackend {
  return id === 'sfcc'
    ? new SfccCommerceBackend()
    : new CoreCommerceBackend(getCommerceClient());
}

/**
 * Resolve the active commerce backend.
 *
 * Default: Commerce on Core (this repo's ships-today implementation).
 * Set VITE_COMMERCE_BACKEND=sfcc at build time, or call setCommerceBackend()
 * at runtime, to route through the SFCC/SCAPI stub — useful for demoing the
 * "flip a switch to B2C Commerce" story once licensing lands.
 */
export function getCommerceBackend(): CommerceBackend {
  if (!backendInstance) backendInstance = makeBackend(backendId);
  return backendInstance;
}

/** Identifier for the currently-active backend (for UI labels / log lines). */
export function getCommerceBackendId(): CommerceBackendId {
  return backendId;
}

/**
 * Swap the active commerce backend at runtime. Notifies subscribers so any
 * mounted React tree using useCommerceBackendId() re-renders, and so the
 * router can re-run loaders against the new backend.
 */
export function setCommerceBackend(id: CommerceBackendId): void {
  if (id === backendId) return;
  backendId = id;
  backendInstance = makeBackend(id);
  for (const sub of subscribers) sub();
}

/** Subscribe to backend changes. Returns an unsubscribe. */
export function subscribeToCommerceBackend(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

/** React hook: returns the active backend id, re-rendering on switches. */
export function useCommerceBackendId(): CommerceBackendId {
  return useSyncExternalStore(
    subscribeToCommerceBackend,
    getCommerceBackendId,
    getCommerceBackendId,
  );
}

/** Human-facing label for a backend id. Centralised so footer + log agree. */
export function commerceBackendLabel(id: CommerceBackendId): string {
  return id === 'sfcc' ? 'B2C Commerce (Storefront Next)' : 'Commerce on Core';
}
