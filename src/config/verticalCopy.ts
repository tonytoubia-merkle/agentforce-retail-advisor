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
import type { SceneSetting } from '@/types/scene';

export interface CatalogNavItem {
  label: string;
  /** Matches whatever string the demo's products use in `product.category`. */
  value: string;
}

export interface SecondaryAdvisorHero {
  /** Small uppercase eyebrow above the title (e.g. "AI-Powered · Free · No Account Needed"). */
  eyebrow: string;
  /** First line of the big headline (e.g. "Know your skin."). */
  title: string;
  /** Second line of the headline, styled with gradient accent (e.g. "Build your routine."). */
  titleAccent: string;
  /** Paragraph below the title. */
  description: string;
  /** Primary CTA button label (e.g. "Analyze My Skin"). */
  primaryCTA: string;
  /** Secondary CTA button label. */
  secondaryCTA: string;
  /** Four short feature chips shown to the right of the headline. */
  chips: Array<{ icon: string; title: string; desc: string }>;
}

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
  /** Which secondary advisor experience exists (skin analysis / booking / stylist / none). */
  secondaryAdvisorRoute?: 'skin' | 'booking' | 'stylist' | null;
  /** Emoji/icon for chat button */
  chatIcon: string;
  /** 3 quick-action suggestions shown as chips when the chat opens. Vertical-aware
   *  so a travel demo doesn't prompt the visitor with "Show me moisturizers". */
  defaultSuggestedActions: string[];
  /** "Powered by X" text shown in the secondary advisor modal header.
   *  null = hide the attribution line entirely (use when no partnership exists for this vertical). */
  partnershipText: string | null;
  /** Category navigation shown in the StoreHeader for this vertical.
   *  Values must match whatever strings the demo's seeded products use in `product.category`. */
  catalogNav: CatalogNavItem[];
  /** Structured hero block promoting the secondary advisor experience on the storefront.
   *  Renders the skin-analysis hero for beauty; booking concierge for travel; etc.
   *  null = hide the hero section entirely. */
  secondaryAdvisorHero: SecondaryAdvisorHero | null;
  /** Fallback scene setting when the agent doesn't specify one and product categories
   *  don't match any inference rules. Beauty defaults to 'bathroom'; travel to 'travel' etc. */
  defaultSceneSetting: SceneSetting;
  /** Storefront hero block — headline, subtitle, CTA, and trust strip.
   *  `heroImage` is optional; empty string means "render a brand-color gradient
   *  instead" so non-beauty demos don't ship with a woman-in-face-mask photo. */
  hero: {
    badge: string;
    headlineTop: string;
    headlineBottom: string;
    subtitle: string;
    heroImage: string;
    imageAlt: string;
    /** The primary CTA label (Shop Collection / Explore Routes / Shop the Look) */
    primaryCTA: string;
    /** Three short pills shown under the CTAs — social proof / brand traits */
    trustPills: [string, string, string];
    /** Authenticated greeting prefix — "Your Beauty Edit," / "Your Trip Plan," etc.
     *  Rendered with the customer's first name on the line below. */
    authenticatedHeadlineTop: string;
    /** Authenticated-user subtitle (pre-loyalty suffix) */
    authenticatedSubtitle: string;
  };
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
  defaultSuggestedActions: [
    'Show me moisturizers',
    'I need travel products',
    'What do you recommend?',
  ],
  partnershipText: 'Powered by BEAUTÉ in partnership with Perfect Corp',
  catalogNav: [
    { label: 'Skincare', value: 'moisturizer' },
    { label: 'Cleansers', value: 'cleanser' },
    { label: 'Serums', value: 'serum' },
    { label: 'Sunscreen', value: 'sunscreen' },
    { label: 'Makeup', value: 'foundation' },
    { label: 'Lips', value: 'lipstick' },
    { label: 'Fragrance', value: 'fragrance' },
    { label: 'Haircare', value: 'shampoo' },
  ],
  secondaryAdvisorHero: {
    eyebrow: 'AI-Powered · Free · No Account Needed',
    title: 'Know your skin.',
    titleAccent: 'Build your routine.',
    description:
      "Take a 30-second selfie analysis or answer a few questions. Our Skin Concierge identifies your skin type, flags your top concerns, and recommends a complete routine — then shows you exactly where to buy each product.",
    primaryCTA: 'Analyze My Skin',
    secondaryCTA: 'Answer Questions Instead',
    chips: [
      { icon: '🔬', title: '15 Skin Concerns', desc: 'Scored and ranked by severity' },
      { icon: '🧴', title: 'Routine Builder', desc: 'Morning + evening, complete' },
      { icon: '📍', title: 'Where to Buy', desc: 'In-store & online retailers' },
      { icon: '🔒', title: '100% Private', desc: 'Photos never leave your device' },
    ],
  },
  defaultSceneSetting: 'bathroom',
  hero: {
    badge: 'New Season Collection',
    headlineTop: 'Discover Your',
    headlineBottom: 'Perfect Glow',
    subtitle: 'Curated skincare and beauty essentials, personalized to your unique needs.',
    heroImage: '/assets/hero/hero-spa-mask.png',
    imageAlt: 'Luxurious spa treatment',
    primaryCTA: 'Shop Collection',
    trustPills: ['50K+ Customers', '4.9 Rating', 'Clean & Cruelty-Free'],
    authenticatedHeadlineTop: 'Your Beauty Edit,',
    authenticatedSubtitle: 'Curated skincare and beauty essentials, just for you.',
  },
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
  defaultSuggestedActions: [
    'Flights to Tokyo next month',
    'Compare business-class options',
    'Plan a beach getaway',
  ],
  partnershipText: null,
  catalogNav: [
    { label: 'Routes', value: 'route' },
    { label: 'Cabin Classes', value: 'cabin' },
    { label: 'Deals', value: 'deal' },
    { label: 'Packages', value: 'package' },
  ],
  secondaryAdvisorHero: {
    eyebrow: 'AI-Powered · Personalized Trip Planning',
    title: 'Tell us where.',
    titleAccent: 'We handle the rest.',
    description:
      "Describe the trip you have in mind and our concierge builds a full itinerary — flights, cabin class, dates, seat maps — in seconds. Compare routes, hold seats, and book when you're ready.",
    primaryCTA: 'Plan My Trip',
    secondaryCTA: 'Browse Destinations',
    chips: [
      { icon: '🌍', title: '200+ Destinations', desc: 'Global route network' },
      { icon: '✈️', title: 'Cabin Compare', desc: 'Business · Premium · Economy' },
      { icon: '💺', title: 'Seat Selection', desc: 'Pick before you pay' },
      { icon: '🎁', title: 'Loyalty Aware', desc: 'Upgrade eligibility built-in' },
    ],
  },
  defaultSceneSetting: 'travel',
  hero: {
    badge: 'New Destinations · Business Class',
    headlineTop: 'Fly Further.',
    headlineBottom: 'Feel at Home.',
    subtitle: 'Curated routes, cabin comparisons, and seat-level personalization — planned with you, not at you.',
    // Empty → brand-gradient fallback (demo can override via config.heroImageUrl)
    heroImage: '',
    imageAlt: 'Aircraft cabin',
    primaryCTA: 'Explore Routes',
    trustPills: ['200+ Destinations', 'Loyalty Aware', 'Concierge Support'],
    authenticatedHeadlineTop: 'Your Trip Plan,',
    authenticatedSubtitle: 'Itineraries tailored to how you fly.',
  },
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
  defaultSuggestedActions: [
    "What's trending this season?",
    'Build a capsule wardrobe',
    'Outfit for a dinner party',
  ],
  partnershipText: null,
  catalogNav: [
    { label: 'New Arrivals', value: 'new' },
    { label: 'Dresses', value: 'dress' },
    { label: 'Outerwear', value: 'outerwear' },
    { label: 'Accessories', value: 'accessory' },
  ],
  secondaryAdvisorHero: {
    eyebrow: 'Personal Styling · Made For You',
    title: 'Tell us the occasion.',
    titleAccent: "We'll style the look.",
    description:
      'Share your occasion, fit preferences, and mood. Our stylist curates a full look — outerwear, accessories, shoes — with alternatives at every price point.',
    primaryCTA: 'Style Me',
    secondaryCTA: 'Browse the Collection',
    chips: [
      { icon: '👗', title: 'Head-to-toe Looks', desc: 'Every piece works together' },
      { icon: '🎨', title: 'Color & Fit', desc: 'Shaped around your preferences' },
      { icon: '💎', title: 'Any Budget', desc: 'Alternatives at every tier' },
      { icon: '🛍️', title: 'One-Click Shop', desc: 'Add the whole look at once' },
    ],
  },
  defaultSceneSetting: 'lifestyle',
  hero: {
    badge: 'The Collection',
    headlineTop: 'Dress With',
    headlineBottom: 'Intention.',
    subtitle: "Curated looks tailored to your style, occasion, and wardrobe — edited by a stylist who knows your closet.",
    heroImage: '',
    imageAlt: 'Curated fashion editorial',
    primaryCTA: 'Shop the Collection',
    trustPills: ['Head-to-Toe Styling', 'Free Alterations', 'Complimentary Returns'],
    authenticatedHeadlineTop: 'Your Style Edit,',
    authenticatedSubtitle: 'Looks curated to your fit and occasions.',
  },
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
  defaultSuggestedActions: [
    'Help me sleep better',
    'Boost my energy',
    'Recommendations for stress',
  ],
  partnershipText: null,
  catalogNav: [
    { label: 'Supplements', value: 'supplement' },
    { label: 'Sleep', value: 'sleep' },
    { label: 'Energy', value: 'energy' },
    { label: 'Recovery', value: 'recovery' },
  ],
  secondaryAdvisorHero: null,
  defaultSceneSetting: 'lifestyle',
  hero: {
    badge: 'Feel Better. Daily.',
    headlineTop: 'A Routine',
    headlineBottom: 'That Works.',
    subtitle: 'Evidence-based supplements and wellness essentials, personalized to your goals.',
    heroImage: '',
    imageAlt: 'Wellness routine',
    primaryCTA: 'Shop Wellness',
    trustPills: ['Third-Party Tested', 'Transparent Labels', 'Easy Returns'],
    authenticatedHeadlineTop: 'Your Routine,',
    authenticatedSubtitle: 'Tailored to how you feel today.',
  },
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
  defaultSuggestedActions: [
    "What's on sale this week?",
    'Show me bestsellers',
    'Plan weekly essentials',
  ],
  partnershipText: null,
  catalogNav: [
    { label: 'Pantry', value: 'pantry' },
    { label: 'Beverages', value: 'beverage' },
    { label: 'Snacks', value: 'snack' },
    { label: 'Household', value: 'household' },
  ],
  secondaryAdvisorHero: null,
  defaultSceneSetting: 'neutral',
  hero: {
    badge: 'This Week',
    headlineTop: 'Stocked With',
    headlineBottom: 'Care.',
    subtitle: 'Everyday essentials and this-week favorites — smarter suggestions, fewer trips.',
    heroImage: '',
    imageAlt: 'Curated everyday essentials',
    primaryCTA: 'Start Shopping',
    trustPills: ['Free Pickup', 'Weekly Deals', 'Same-Day Delivery'],
    authenticatedHeadlineTop: 'Your Basket,',
    authenticatedSubtitle: 'The usuals, ready when you are.',
  },
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
