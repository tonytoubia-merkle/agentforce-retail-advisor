/**
 * Retailer Distribution Catalog
 *
 * Real-world brand distribution is managed at the brand/category level via
 * retail partnership agreements — not per-SKU. This catalog mirrors that:
 *
 *   1. Brand-level default retailers (every product from SERENE is at Target, etc.)
 *   2. Category-level overrides (clinical products may go to pharmacy chains instead)
 *   3. Product-level overrides via the optional `product.retailers` field (rare edge cases)
 *
 * `getRetailersForProduct()` resolves in that priority order.
 *
 * In production this would be fetched from a CMS or Commerce Cloud attribute set,
 * not a static file — but the resolution logic stays the same.
 */

import type { ProductRetailer } from '@/types/product';
import type { Product } from '@/types/product';

// ─── Brand-level defaults ─────────────────────────────────────────────────────
// Every product in the brand ships through these channels unless overridden.

const BRAND_RETAILERS: Record<string, ProductRetailer[]> = {
  SERENE: [
    {
      name: 'Sephora',
      url: 'https://www.sephora.com/search?keyword=SERENE+skincare',
      inStore: true,
      online: true,
    },
    {
      name: 'Ulta Beauty',
      url: 'https://www.ulta.com/search?query=SERENE+skincare',
      inStore: true,
      online: true,
    },
    {
      name: 'Target',
      url: 'https://www.target.com/s?searchTerm=SERENE+skincare',
      inStore: true,
      online: true,
    },
    {
      name: 'Amazon',
      url: 'https://www.amazon.com/s?k=SERENE+skincare',
      inStore: false,
      online: true,
    },
  ],

  LUMIERE: [
    {
      name: 'Sephora',
      url: 'https://www.sephora.com/search?keyword=LUMIERE+beauty',
      inStore: true,
      online: true,
    },
    {
      name: 'Nordstrom',
      url: 'https://www.nordstrom.com/sr?keyword=LUMIERE+beauty',
      inStore: true,
      online: true,
    },
    {
      name: 'Ulta Beauty',
      url: 'https://www.ulta.com/search?query=LUMIERE',
      inStore: true,
      online: true,
    },
    {
      name: 'Amazon',
      url: 'https://www.amazon.com/s?k=LUMIERE+beauty',
      inStore: false,
      online: true,
    },
  ],

  DERMAFIX: [
    {
      name: 'Walgreens',
      url: 'https://www.walgreens.com/search/results.jsp?Ntt=DERMAFIX',
      inStore: true,
      online: true,
    },
    {
      name: 'CVS',
      url: 'https://www.cvs.com/search/?searchTerm=DERMAFIX',
      inStore: true,
      online: true,
    },
    {
      name: 'Target',
      url: 'https://www.target.com/s?searchTerm=DERMAFIX+skincare',
      inStore: true,
      online: true,
    },
    {
      name: 'Amazon',
      url: 'https://www.amazon.com/s?k=DERMAFIX+skincare',
      inStore: false,
      online: true,
    },
  ],

  MAISON: [
    {
      name: 'Nordstrom',
      url: 'https://www.nordstrom.com/sr?keyword=MAISON+fragrance',
      inStore: true,
      online: true,
    },
    {
      name: 'Sephora',
      url: 'https://www.sephora.com/search?keyword=MAISON',
      inStore: true,
      online: true,
    },
    {
      name: 'Amazon',
      url: 'https://www.amazon.com/s?k=MAISON+fragrance',
      inStore: false,
      online: true,
    },
  ],
};

// ─── Category-level overrides ─────────────────────────────────────────────────
// Some product categories have different retail distribution regardless of brand.
// e.g. clinical/acne products often go to pharmacy chains first.

const CATEGORY_RETAILER_OVERRIDES: Partial<Record<string, ProductRetailer[]>> = {
  sunscreen: [
    {
      name: 'Target',
      url: 'https://www.target.com/s?searchTerm=sunscreen+SPF',
      inStore: true,
      online: true,
      promo: 'Buy 2 get 1 free on sunscreens',
    },
    {
      name: 'Walgreens',
      url: 'https://www.walgreens.com/search/results.jsp?Ntt=sunscreen',
      inStore: true,
      online: true,
    },
    {
      name: 'CVS',
      url: 'https://www.cvs.com/search/?searchTerm=sunscreen',
      inStore: true,
      online: true,
    },
    {
      name: 'Amazon',
      url: 'https://www.amazon.com/s?k=mineral+sunscreen+spf',
      inStore: false,
      online: true,
    },
  ],

  'spot-treatment': [
    {
      name: 'CVS',
      url: 'https://www.cvs.com/search/?searchTerm=acne+spot+treatment',
      inStore: true,
      online: true,
      promo: 'Buy 1 get 1 50% off',
    },
    {
      name: 'Walgreens',
      url: 'https://www.walgreens.com/search/results.jsp?Ntt=acne+spot+treatment',
      inStore: true,
      online: true,
    },
    {
      name: 'Target',
      url: 'https://www.target.com/s?searchTerm=acne+spot+treatment',
      inStore: true,
      online: true,
    },
    {
      name: 'Amazon',
      url: 'https://www.amazon.com/s?k=acne+blemish+patch',
      inStore: false,
      online: true,
    },
  ],
};

// ─── Lookup function ──────────────────────────────────────────────────────────

/**
 * Resolves the retailer list for a product using the priority chain:
 *   product.retailers (explicit override) → category override → brand default → fallback
 *
 * Returns retailer links with product-name-enriched deep-link URLs when possible.
 */
export function getRetailersForProduct(product: Product): ProductRetailer[] {
  // 1. Product-level explicit override (rare — only for flagship or exclusive products)
  if (product.retailers && product.retailers.length > 0) {
    return product.retailers;
  }

  // 2. Category-level override
  const categoryOverride = CATEGORY_RETAILER_OVERRIDES[product.category];
  if (categoryOverride) {
    return enrichUrlsWithProductName(categoryOverride, product.name);
  }

  // 3. Brand-level default
  const brandRetailers = BRAND_RETAILERS[product.brand];
  if (brandRetailers) {
    return enrichUrlsWithProductName(brandRetailers, product.name);
  }

  // 4. Universal fallback (should not be reached for catalog products)
  return [
    {
      name: 'Amazon',
      url: `https://www.amazon.com/s?k=${encodeURIComponent(product.name)}`,
      inStore: false,
      online: true,
    },
  ];
}

/**
 * Appends the product name to retailer search URLs so the search lands
 * on the specific product, not just the brand page.
 */
function enrichUrlsWithProductName(
  retailers: ProductRetailer[],
  productName: string
): ProductRetailer[] {
  const encoded = encodeURIComponent(productName);
  return retailers.map((r) => ({
    ...r,
    url: r.url.includes('searchTerm=') || r.url.includes('Ntt=') || r.url.includes('k=') || r.url.includes('keyword=') || r.url.includes('query=')
      ? r.url + '+' + encoded
      : r.url,
  }));
}

/**
 * Returns retailers for a basket of products, deduplicated and merged.
 * Used by the RETAILER_HANDOFF directive when multiple products are shown.
 * Retailers that carry ALL products are ranked first.
 */
export function getRetailersForProducts(products: Product[]): ProductRetailer[] {
  if (products.length === 0) return [];
  if (products.length === 1) return getRetailersForProduct(products[0]);

  // Count how many products each retailer carries
  const retailerCounts = new Map<string, { retailer: ProductRetailer; count: number }>();

  for (const product of products) {
    const retailers = getRetailersForProduct(product);
    for (const r of retailers) {
      const existing = retailerCounts.get(r.name);
      if (existing) {
        existing.count += 1;
        // Keep the promo if either has one
        if (r.promo && !existing.retailer.promo) {
          existing.retailer = { ...existing.retailer, promo: r.promo };
        }
      } else {
        retailerCounts.set(r.name, { retailer: r, count: 1 });
      }
    }
  }

  // Sort: retailers carrying all products first, then by count desc
  return Array.from(retailerCounts.values())
    .sort((a, b) => b.count - a.count)
    .map(({ retailer }) => retailer);
}
