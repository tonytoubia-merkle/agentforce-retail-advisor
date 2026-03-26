/**
 * Product Catalog Service — fetches Product2 records from CRM via the proxy.
 * Replaces the static mock catalog (src/mocks/products.ts).
 *
 * Products are fetched once at app startup and cached in memory.
 * Exposes lookup helpers for by-ID, by-Salesforce-ID, and by-name resolution.
 */

import type { Product, ProductCategory, ProductAttributes } from '@/types/product';

// ── SOQL fields that map to the Product interface ────────────────────────────

const PRODUCT_FIELDS = [
  'Id', 'Name', 'ProductCode', 'Brand__c', 'Category__c', 'Price__c',
  'Description__c', 'Image_URL__c', 'Skin_Types__c', 'Concerns__c',
  'Rating__c', 'Is_Travel__c', 'In_Stock__c',
].join(',');

const PRODUCT_SOQL = `SELECT ${PRODUCT_FIELDS} FROM Product2 WHERE IsActive = true AND Category__c != null ORDER BY Category__c, Name LIMIT 200`;

// ── Cache ────────────────────────────────────────────────────────────────────

let cachedProducts: Product[] | null = null;
let byId: Map<string, Product> | null = null;
let bySalesforceId: Map<string, Product> | null = null;
let byName: Map<string, Product> | null = null;

function buildLookups(products: Product[]) {
  byId = new Map();
  bySalesforceId = new Map();
  byName = new Map();
  for (const p of products) {
    byId.set(p.id, p);
    if (p.salesforceId) bySalesforceId.set(p.salesforceId, p);
    byName.set(p.name.toLowerCase(), p);
  }
}

// ── Token helper (same pattern as DataCloudCustomerService) ──────────────────

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  const res = await fetch('/api/sf/token');
  if (!res.ok) throw new Error(`Token fetch failed (${res.status})`);
  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + ((data.expires_in || 7200) * 1000) - 300_000,
  };
  return tokenCache.token;
}

async function soqlQuery(soql: string): Promise<Record<string, unknown>[]> {
  const token = await getToken();
  const res = await fetch(`/api/datacloud/query/?q=${encodeURIComponent(soql)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`SOQL query failed (${res.status})`);
  const data = await res.json();
  return (data.records || []) as Record<string, unknown>[];
}

// ── Field mapping ────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
}

function normalizeCategory(raw: string | null): ProductCategory {
  if (!raw) return 'moisturizer';
  const slug = raw.toLowerCase().replace(/\s+/g, '-');
  // Map CRM categories to our ProductCategory union
  const map: Record<string, ProductCategory> = {
    'moisturizer': 'moisturizer', 'cleanser': 'cleanser', 'serum': 'serum',
    'sunscreen': 'sunscreen', 'mask': 'mask', 'toner': 'toner',
    'eye-care': 'eye-cream', 'eye-cream': 'eye-cream',
    'foundation': 'foundation', 'lipstick': 'lipstick', 'mascara': 'mascara',
    'blush': 'blush', 'fragrance': 'fragrance',
    'shampoo': 'shampoo', 'conditioner': 'conditioner',
    'hair-treatment': 'hair-treatment', 'spot-treatment': 'spot-treatment',
    'travel-kit': 'travel-kit',
    // Additional mappings for CRM values that don't match exactly
    'lip-care': 'lipstick', 'lip': 'lipstick',
    'exfoliant': 'serum', 'tool': 'moisturizer',
  };
  return map[slug] || (slug as ProductCategory);
}

function parseSemicolon(val: unknown): string[] {
  if (!val || typeof val !== 'string') return [];
  return val.split(';').map(s => s.trim()).filter(Boolean);
}

function mapProduct(r: Record<string, unknown>): Product {
  const name = (r.Name as string) || '';
  const imageUrl = (r.Image_URL__c as string) || '';
  const skinTypes = parseSemicolon(r.Skin_Types__c);
  const concerns = parseSemicolon(r.Concerns__c);
  const description = (r.Description__c as string) || '';

  const attributes: ProductAttributes = {
    skinType: skinTypes.map(s => s.toLowerCase()) as ProductAttributes['skinType'],
    concerns,
    isTravel: (r.Is_Travel__c as boolean) || false,
  };

  return {
    id: slugify(name),
    salesforceId: (r.Id as string) || undefined,
    name,
    brand: (r.Brand__c as string) || 'SERENE',
    category: normalizeCategory(r.Category__c as string),
    price: (r.Price__c as number) || 0,
    currency: 'USD',
    description,
    shortDescription: description.length > 120 ? description.substring(0, 120) + '...' : description,
    imageUrl,
    images: imageUrl ? [imageUrl] : [],
    attributes,
    rating: (r.Rating__c as number) || 0,
    reviewCount: 0,
    inStock: (r.In_Stock__c as boolean) !== false,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function fetchProductCatalog(): Promise<Product[]> {
  console.log('[catalog] Fetching Product2 catalog from CRM...');
  const records = await soqlQuery(PRODUCT_SOQL);
  const products = records.map(mapProduct);

  // Deduplicate by name (CRM may have duplicate Product2 records)
  const seen = new Set<string>();
  const deduped = products.filter(p => {
    const key = p.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  cachedProducts = deduped;
  buildLookups(deduped);
  console.log(`[catalog] Loaded ${deduped.length} products from CRM`);
  return deduped;
}

export function getProductCatalog(): Product[] {
  return cachedProducts || [];
}

export function getProductById(id: string): Product | undefined {
  return byId?.get(id);
}

export function getProductBySalesforceId(sfId: string): Product | undefined {
  return bySalesforceId?.get(sfId);
}

export function getProductByName(name: string): Product | undefined {
  return byName?.get(name.toLowerCase());
}

export function isCatalogLoaded(): boolean {
  return cachedProducts !== null;
}
