/**
 * Vertical-specific copy and labels.
 *
 * The retail-advisor was originally hardcoded for beauty. This module
 * centralizes all brand-domain-specific strings so they can be swapped
 * based on the demo's vertical (beauty, travel, fashion, etc).
 *
 * Components should import `getVerticalCopy(config)` and read labels
 * from it instead of hardcoding strings. The default (beauty) keys
 * match the legacy copy so the existing agentforce-retail-advisor.vercel.app
 * deployment looks identical when `DEFAULT_CONFIG` is used.
 */
import type { DemoConfig, DemoVertical } from '@/types/demo';

export interface VerticalCopy {
  /** Name of the AI advisor for this vertical (e.g. "Beauty Advisor", "Travel Assistant") */
  advisorName: string;
  /** Short descriptor shown below the advisor name */
  advisorSubtitle: string;
  /** Verb for main CTA — "Shop Now", "Book Now", "Explore" */
  primaryCTA: string;
  /** Verb for secondary CTA — "Talk to Beauty Advisor", "Chat with Travel Expert" */
  talkToCTA: string;
  /** Label for the first nav link — "Products", "Flights" */
  catalogLabel: string;
  /** Noun for catalog items — "product", "flight", "style" */
  itemNoun: string;
  /** Plural — "products", "flights" */
  itemNounPlural: string;
  /** Welcome message hint — "What are you looking for?" / "Where would you like to go?" */
  welcomePrompt: string;
  /** Hero tagline default if demo.brandTagline is empty */
  heroDefaultTagline: string;
  /** Intro paragraph for advisor callout */
  advisorDescription: string;
  /** Currency/unit hint — empty for beauty, " one-way" for flights */
  priceUnit: string;
  /** Which advisor route is available — 'skin' for skin concierge, etc */
  secondaryAdvisorRoute?: 'skin' | 'booking' | 'stylist' | null;
  /** Emoji/icon for chat button */
  chatIcon: string;
}

// ─── Default (beauty) — matches legacy hardcoded copy exactly ───────

const BEAUTY: VerticalCopy = {
  advisorName: 'Beauty Advisor',
  advisorSubtitle: 'Your Personal Beauty Concierge',
  primaryCTA: 'Shop Now',
  talkToCTA: 'Talk to Beauty Advisor',
  catalogLabel: 'Products',
  itemNoun: 'product',
  itemNounPlural: 'products',
  welcomePrompt: 'What are you looking for today?',
  heroDefaultTagline: 'Your Personal Beauty Advisor',
  advisorDescription:
    'Our AI-powered Beauty Advisor provides personalized recommendations based on your unique skin type, concerns, and preferences.',
  priceUnit: '',
  secondaryAdvisorRoute: 'skin',
  chatIcon: '💬',
};

// ─── Travel / Hospitality ──────────────────────────────────────────

const TRAVEL: VerticalCopy = {
  advisorName: 'Travel Assistant',
  advisorSubtitle: 'Your Personal Travel Concierge',
  primaryCTA: 'Book Now',
  talkToCTA: 'Chat with Travel Assistant',
  catalogLabel: 'Flights',
  itemNoun: 'flight',
  itemNounPlural: 'flights',
  welcomePrompt: 'Where would you like to go?',
  heroDefaultTagline: 'Elevate Your Journey',
  advisorDescription:
    'Our AI-powered Travel Assistant helps you find the perfect flights, compare cabin classes, and plan seamless trips tailored to your preferences.',
  priceUnit: '',
  secondaryAdvisorRoute: 'booking',
  chatIcon: '✈️',
};

// ─── Fashion / Luxury ─────────────────────────────────────────────

const FASHION: VerticalCopy = {
  advisorName: 'Style Advisor',
  advisorSubtitle: 'Your Personal Stylist',
  primaryCTA: 'Shop the Collection',
  talkToCTA: 'Chat with Style Advisor',
  catalogLabel: 'Collection',
  itemNoun: 'style',
  itemNounPlural: 'styles',
  welcomePrompt: 'What style moment are we creating?',
  heroDefaultTagline: 'Your Personal Style Advisor',
  advisorDescription:
    'Our AI-powered Style Advisor curates looks tailored to your personal style, occasions, and wardrobe.',
  priceUnit: '',
  secondaryAdvisorRoute: 'stylist',
  chatIcon: '👗',
};

// ─── Wellness ─────────────────────────────────────────────────────

const WELLNESS: VerticalCopy = {
  advisorName: 'Wellness Advisor',
  advisorSubtitle: 'Your Personal Wellness Partner',
  primaryCTA: 'Shop Wellness',
  talkToCTA: 'Talk to Wellness Advisor',
  catalogLabel: 'Products',
  itemNoun: 'product',
  itemNounPlural: 'products',
  welcomePrompt: 'How can we support your wellness journey?',
  heroDefaultTagline: 'Your Daily Wellness Partner',
  advisorDescription:
    'Our AI-powered Wellness Advisor recommends supplements and products tailored to your goals.',
  priceUnit: '',
  secondaryAdvisorRoute: null,
  chatIcon: '🌿',
};

// ─── CPG / Grocery ───────────────────────────────────────────────

const CPG: VerticalCopy = {
  advisorName: 'Product Advisor',
  advisorSubtitle: 'Your Shopping Assistant',
  primaryCTA: 'Add to Cart',
  talkToCTA: 'Chat with Advisor',
  catalogLabel: 'Products',
  itemNoun: 'product',
  itemNounPlural: 'products',
  welcomePrompt: 'What are you shopping for?',
  heroDefaultTagline: 'Everyday Essentials, Elevated',
  advisorDescription:
    'Our AI-powered Advisor helps you discover products for any occasion.',
  priceUnit: '',
  secondaryAdvisorRoute: null,
  chatIcon: '🛒',
};

const COPY_BY_VERTICAL: Record<DemoVertical, VerticalCopy> = {
  beauty: BEAUTY,
  travel: TRAVEL,
  fashion: FASHION,
  wellness: WELLNESS,
  cpg: CPG,
};

/**
 * Get the vertical copy for a demo config.
 * Defaults to beauty so legacy (DEFAULT_CONFIG) deployments render unchanged.
 */
export function getVerticalCopy(config: Pick<DemoConfig, 'vertical'>): VerticalCopy {
  return COPY_BY_VERTICAL[config.vertical] || BEAUTY;
}
