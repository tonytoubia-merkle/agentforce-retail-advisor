/**
 * Known beauty categories — the legacy golden-template demo uses these as a
 * typed union so TypeScript autocompletes mocks/seed data. For multi-tenant
 * demos (travel / fashion / wellness / cpg) each vertical seeds its own
 * category strings, so the actual stored type is just `string`.
 *
 * Components that render category-aware UI should pass `product.category`
 * through case-insensitive matchers rather than comparing against the
 * legacy union.
 */
export type KnownBeautyCategory =
  | 'moisturizer'
  | 'cleanser'
  | 'serum'
  | 'sunscreen'
  | 'mask'
  | 'toner'
  | 'travel-kit'
  | 'eye-cream'
  | 'foundation'
  | 'lipstick'
  | 'mascara'
  | 'blush'
  | 'fragrance'
  | 'shampoo'
  | 'conditioner'
  | 'hair-treatment'
  | 'spot-treatment';

/** Free-form category string. Any vertical can seed its own values. */
export type ProductCategory = KnownBeautyCategory | (string & {});

/** Beauty-specific product attributes. Only populated on beauty-vertical products. */
export interface BeautyAttributes {
  skinType?: ('dry' | 'oily' | 'combination' | 'sensitive' | 'normal')[];
  concerns?: string[];
  ingredients?: string[];
  keyIngredients?: string[];
  isFragranceFree?: boolean;
  isVegan?: boolean;
  isCrueltyFree?: boolean;
  isParabenFree?: boolean;
  isHypoallergenic?: boolean;
  isDermatologistTested?: boolean;
}

/** Travel-vertical attributes (flights, hotels, packages). */
export interface TravelAttributes {
  origin?: string;
  destination?: string;
  cabinClass?: 'economy' | 'premium-economy' | 'business' | 'first';
  durationMinutes?: number;
  stops?: number;
  airline?: string;
  flightNumber?: string;
  amenities?: string[];
  loyaltyEligible?: boolean;
  departureDate?: string;
  returnDate?: string;
}

/** Fashion-vertical attributes. */
export interface FashionAttributes {
  size?: string[];
  color?: string[];
  material?: string[];
  occasion?: string[];
  season?: ('spring' | 'summer' | 'fall' | 'winter')[];
  fit?: string;
  careInstructions?: string;
}

/** Wellness-vertical attributes. */
export interface WellnessAttributes {
  benefits?: string[];
  goals?: string[];
  dosage?: string;
  certifications?: string[];
}

export interface ProductAttributes extends BeautyAttributes {
  /** Shared across all verticals. */
  size?: string;
  isTravel?: boolean;

  /** Per-vertical sub-shapes. Populated only for the matching vertical;
   *  card/detail components should read these conditionally via `config.vertical`. */
  travel?: TravelAttributes;
  fashion?: FashionAttributes;
  wellness?: WellnessAttributes;
}

export interface ProductRetailer {
  name: string;
  url: string;
  inStore: boolean;
  online: boolean;
  promo?: string;
}

export interface Product {
  id: string;
  /** Salesforce Product2 record ID for Data Cloud integration */
  salesforceId?: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  currency: string;
  description: string;
  shortDescription: string;
  imageUrl: string;
  images: string[];
  attributes: ProductAttributes;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  personalizationScore?: number;
  /** Retailers carrying this product — used by the Skin Concierge "Where to Buy" flow. */
  retailers?: ProductRetailer[];
}
