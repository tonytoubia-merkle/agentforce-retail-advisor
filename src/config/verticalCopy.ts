/**
 * Vertical-specific copy and labels.
 *
 * Each vertical is written with a distinct voice — beauty leans couture
 * French, travel leans old-world grand-tour, fashion is Italian/Japanese
 * restraint, wellness is Scandinavian-reverent, CPG is farmers-market
 * warmth. Don't blend the voices; each vertical should feel like it came
 * from a different agency.
 *
 * Components that render vertical-aware UI should import
 * `getVerticalCopy(config)` and read labels from it. Default (beauty)
 * keys preserve exact legacy text so the existing
 * agentforce-retail-advisor.vercel.app deployment is unchanged when the
 * DEFAULT_CONFIG golden template is active.
 */
import type { DemoConfig, DemoVertical } from '@/types/demo';
import type { SceneSetting } from '@/types/scene';

export interface CatalogNavItem {
  label: string;
  /** Matches whatever string the demo's products use in `product.category`. */
  value: string;
}

export interface SecondaryAdvisorHero {
  /** Small uppercase eyebrow above the title. */
  eyebrow: string;
  /** First line of the big headline. */
  title: string;
  /** Second line of the headline, styled with gradient accent. */
  titleAccent: string;
  /** Paragraph below the title. */
  description: string;
  /** Primary CTA button label. */
  primaryCTA: string;
  /** Secondary CTA button label. */
  secondaryCTA: string;
  /** Four short feature chips shown to the right of the headline. */
  chips: Array<{ icon: string; title: string; desc: string }>;
}

/** Which display font the hero headline leans on.
 *  - `cormorant`: elegant wide-serif, high contrast (beauty, fashion)
 *  - `fraunces`: warm characterful serif (travel, wellness, cpg)
 *  - `sans`: Inter fallback (default)
 *
 *  The Google Fonts @link lives in index.html; HeroBanner picks the
 *  CSS family string based on this key. */
export type HeroDisplayFont = 'cormorant' | 'fraunces' | 'sans';

export interface VerticalCopy {
  advisorName: string;
  advisorSubtitle: string;
  primaryCTA: string;
  talkToCTA: string;
  catalogLabel: string;
  itemNoun: string;
  itemNounPlural: string;
  welcomePrompt: string;
  heroDefaultTagline: string;
  advisorDescription: string;
  priceUnit: string;
  secondaryAdvisorRoute?: 'skin' | 'booking' | 'stylist' | null;
  chatIcon: string;
  defaultSuggestedActions: string[];
  partnershipText: string | null;
  catalogNav: CatalogNavItem[];
  secondaryAdvisorHero: SecondaryAdvisorHero | null;
  defaultSceneSetting: SceneSetting;
  hero: {
    badge: string;
    headlineTop: string;
    headlineBottom: string;
    subtitle: string;
    heroImage: string;
    imageAlt: string;
    primaryCTA: string;
    trustPills: [string, string, string];
    authenticatedHeadlineTop: string;
    authenticatedSubtitle: string;
    /** Which editorial font the headline uses. */
    displayFont: HeroDisplayFont;
    /** Glyph between trust pills ('·' / '—' / '/' / '|'). */
    trustSeparator: string;
    /** Small editorial mark shown in the no-image fallback (e.g. "No. 07 · 2026"). */
    editorialMark: string;
  };
}

// ─── Default (beauty) — Maison de Beauté voice ────────────────────
//
// Reference: Maison Lancôme, Augustinus Bader's restraint, a French
// beauty editor who rolls her eyes at glow-up language. Whispered,
// confident, done with a straight face.

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
    eyebrow: 'Fifteen years of skin science · Now in conversation',
    title: 'Your skin,',
    titleAccent: 'attended to.',
    description:
      'Thirty seconds with our camera — or a few questions if you prefer. Our Concierge reads fifteen concerns, scores them, and composes a routine your skin recognizes. Then shows you where every bottle is sold, in store or online.',
    primaryCTA: 'Begin the Analysis',
    secondaryCTA: 'Talk it Through',
    chips: [
      { icon: '🔬', title: '15 Concerns, Scored', desc: 'Ranked by severity, not marketing' },
      { icon: '🧴', title: 'A Real Routine', desc: 'Morning + evening, nothing extra' },
      { icon: '📍', title: 'Sold Everywhere', desc: 'Find each bottle near you' },
      { icon: '🔒', title: 'Photos Stay Yours', desc: 'Nothing ever leaves your device' },
    ],
  },
  defaultSceneSetting: 'bathroom',
  hero: {
    badge: 'Maison de Beauté · Autumn 2026',
    headlineTop: 'Skin,',
    headlineBottom: 'attended to.',
    subtitle:
      'Small-batch skincare edited by dermatologists and worn by no one who needs convincing. Quiet rituals, loud results.',
    heroImage: '/assets/hero/hero-spa-mask.png',
    imageAlt: 'Editorial close-up of porcelain skin',
    primaryCTA: 'Enter the Atelier',
    trustPills: ['Made in Grasse', 'Vogue Editor 2025', 'Concierge Included'],
    authenticatedHeadlineTop: 'Your ritual,',
    authenticatedSubtitle: 'Re-edited as your skin changes.',
    displayFont: 'cormorant',
    trustSeparator: '·',
    editorialMark: 'Nº 07 · 2026',
  },
};

// ─── Travel / Hospitality — grand-tour voice ──────────────────────
//
// Reference: old Pan Am timetables, modern private-aviation decks,
// Monocle's travel section. Slow cadence, trust in craft, the idea
// that a journey deserves a little ceremony.

const TRAVEL: VerticalCopy = {
  advisorName: 'Travel Assistant',
  advisorSubtitle: 'Your Personal Travel Concierge',
  primaryCTA: 'Book Now',
  talkToCTA: 'Chat with Travel Assistant',
  catalogLabel: 'Journeys',
  itemNoun: 'flight',
  itemNounPlural: 'flights',
  welcomePrompt: 'Where would you like to go?',
  heroDefaultTagline: 'Journeys, Composed',
  advisorDescription:
    'Our concierge composes an itinerary from the trip you describe. Routes chosen for how you actually fly. Cabins paired with your loyalty tier. Seats mapped before you pay.',
  priceUnit: '',
  secondaryAdvisorRoute: 'booking',
  chatIcon: '✈️',
  defaultSuggestedActions: [
    'A long weekend in Lisbon',
    'Compare business-class to Tokyo',
    'Somewhere warm in February',
  ],
  partnershipText: null,
  catalogNav: [
    { label: 'Routes', value: 'route' },
    { label: 'Cabins', value: 'cabin' },
    { label: 'Deals', value: 'deal' },
    { label: 'Journeys', value: 'package' },
  ],
  secondaryAdvisorHero: {
    eyebrow: 'Concierge · Never Scripted',
    title: 'Tell us a story.',
    titleAccent: 'We book the chapters.',
    description:
      "Describe the trip you hope for — the weather, the pace, the meal you'd remember. Our concierge returns an itinerary that fits. Routes chosen for your sleep schedule. Cabins paired with your loyalty tier. Seats mapped before you pay.",
    primaryCTA: 'Begin the Itinerary',
    secondaryCTA: 'Browse the Atlas',
    chips: [
      { icon: '🌍', title: 'Two Hundred Ports', desc: 'Global partners, one roster' },
      { icon: '✈️', title: 'Cabin, Compared', desc: 'First, Business, Premium · side-by-side' },
      { icon: '💺', title: 'Your Seat, Held', desc: 'Mapped and held before payment' },
      { icon: '🎁', title: 'Upgrade, Aware', desc: 'Loyalty tier understood, always' },
    ],
  },
  defaultSceneSetting: 'travel',
  hero: {
    badge: 'Private Aviation · Open in 78 Countries',
    headlineTop: 'The long way',
    headlineBottom: 'is the right way.',
    subtitle:
      "Itineraries composed by people who've flown the route. Cabins paired with how you actually sleep. Seats mapped before you pay a cent.",
    heroImage:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Aircraft wing above cloud layer at golden hour',
    primaryCTA: 'Begin the Itinerary',
    trustPills: ['Open in 78 Countries', 'Human Concierge, 24h', 'IATA Member'],
    authenticatedHeadlineTop: 'The next journey,',
    authenticatedSubtitle: 'Held for you.',
    displayFont: 'fraunces',
    trustSeparator: '—',
    editorialMark: 'Voyage 014',
  },
};

// ─── Fashion / Luxury — Italian/Japanese restraint ────────────────
//
// Reference: The Row, Margiela, Aesop's copywriting. Austere, confident,
// declarative. No exclamation points. No "curated for you." The clothes
// are the subject; we speak about them, not at the reader.

const FASHION: VerticalCopy = {
  advisorName: 'Style Advisor',
  advisorSubtitle: 'Personal Stylist',
  primaryCTA: 'Open the Collection',
  talkToCTA: 'Speak with a Stylist',
  catalogLabel: 'Collection',
  itemNoun: 'piece',
  itemNounPlural: 'pieces',
  welcomePrompt: 'What are we dressing for?',
  heroDefaultTagline: 'Clothes That Keep Their Word',
  advisorDescription:
    'The stylist reads the room — the temperature, the dress code, the mood — and returns a full look. Outerwear to earrings. Alternatives at every price. Alterations included, always.',
  priceUnit: '',
  secondaryAdvisorRoute: 'stylist',
  chatIcon: '👗',
  defaultSuggestedActions: [
    'A winter capsule',
    'What to wear to a spring wedding',
    'Build a travel wardrobe',
  ],
  partnershipText: null,
  catalogNav: [
    { label: 'New Arrivals', value: 'new' },
    { label: 'Ready-to-Wear', value: 'dress' },
    { label: 'Outerwear', value: 'outerwear' },
    { label: 'Accessories', value: 'accessory' },
  ],
  secondaryAdvisorHero: {
    eyebrow: 'Personal Styling · Included',
    title: 'Name',
    titleAccent: 'the occasion.',
    description:
      'Your stylist reads the room — the temperature, the dress code, the mood — and returns a full look. Outerwear to earrings. Alternatives at every price. Alterations included, always.',
    primaryCTA: 'Style the Moment',
    secondaryCTA: 'Walk the Collection',
    chips: [
      { icon: '👗', title: 'Head-to-Toe Looks', desc: 'Every piece in conversation' },
      { icon: '🎨', title: 'Shaped to Your Line', desc: 'Fit, drape, rise — all yours' },
      { icon: '💎', title: 'Price, Your Decision', desc: 'Alternatives at every tier' },
      { icon: '🛍️', title: 'Add the Whole Look', desc: 'One click, every layer' },
    ],
  },
  defaultSceneSetting: 'lifestyle',
  hero: {
    badge: 'Collection 07',
    headlineTop: 'Clothes',
    headlineBottom: 'that keep their word.',
    subtitle:
      'Made once. Fitted forever. The stylist knows your closet; the rest is rhythm.',
    heroImage:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Fashion editorial — tailored silhouette, soft studio light',
    primaryCTA: 'Open the Collection',
    trustPills: ['Made to Be Worn Out', 'Altered Free, For Life', 'Thirty-Day Returns'],
    authenticatedHeadlineTop: 'The next wear,',
    authenticatedSubtitle: 'Cut to your line.',
    displayFont: 'cormorant',
    trustSeparator: '/',
    editorialMark: 'S/S 26',
  },
};

// ─── Wellness — Scandinavian-Japanese reverence ───────────────────
//
// Reference: Aesop, Ilia, Japanese functional apothecary. No detox
// language. No miracle words. Evidence-first, quiet, respectful of
// the reader's time. A practice, not a purchase.

const WELLNESS: VerticalCopy = {
  advisorName: 'Wellness Advisor',
  advisorSubtitle: 'A Quieter Routine',
  primaryCTA: 'Begin the Practice',
  talkToCTA: 'Speak with an Advisor',
  catalogLabel: 'The Practice',
  itemNoun: 'formulation',
  itemNounPlural: 'formulations',
  welcomePrompt: 'Where would you like to feel different?',
  heroDefaultTagline: 'Small, Slow, Repeatable',
  advisorDescription:
    'Evidence-graded formulations chosen for the goal you describe — sleep, energy, focus, recovery. No stack trees. No detox language. Just the habit, built around your day.',
  priceUnit: '',
  secondaryAdvisorRoute: null,
  chatIcon: '🌿',
  defaultSuggestedActions: [
    'Help me sleep better',
    "I'm tired most afternoons",
    'Support for a stressful month',
  ],
  partnershipText: null,
  catalogNav: [
    { label: 'Foundations', value: 'supplement' },
    { label: 'Rest', value: 'sleep' },
    { label: 'Steady Energy', value: 'energy' },
    { label: 'Recovery', value: 'recovery' },
  ],
  secondaryAdvisorHero: null,
  defaultSceneSetting: 'lifestyle',
  hero: {
    badge: 'Daily Practice',
    headlineTop: 'Small, slow,',
    headlineBottom: 'repeatable.',
    subtitle:
      'Evidence-graded formulations and the quiet habits that surround them. No detox. No three-a.m. anxiety emails.',
    heroImage:
      'https://images.unsplash.com/photo-1519824145371-296894a0daa9?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Amber apothecary bottles on warm stone',
    primaryCTA: 'Begin the Practice',
    trustPills: ['USP-Verified', 'Third-Party Tested', 'No Affiliate Ingredients'],
    authenticatedHeadlineTop: 'Your practice,',
    authenticatedSubtitle: 'Returning to shape.',
    displayFont: 'fraunces',
    trustSeparator: '·',
    editorialMark: 'Vol. II',
  },
};

// ─── CPG / Grocery — farmers-market honesty ───────────────────────
//
// Reference: Union Square Greenmarket, a chef's weeknight dinner
// voice, Bon Appétit copy. Warm, specific, not cute. Speaks like it
// knows what dinner is on Tuesday.

const CPG: VerticalCopy = {
  advisorName: 'Pantry Advisor',
  advisorSubtitle: 'Stock the Good Stuff',
  primaryCTA: 'Shop the List',
  talkToCTA: 'Ask the Pantry Advisor',
  catalogLabel: 'The List',
  itemNoun: 'staple',
  itemNounPlural: 'staples',
  welcomePrompt: "What's for dinner this week?",
  heroDefaultTagline: 'The Good Stuff, The Easy Way',
  advisorDescription:
    'A short list of pantry staples selected by cooks you would actually eat dinner with. Replenish the weeknight basics; discover one new favorite a week.',
  priceUnit: '',
  secondaryAdvisorRoute: null,
  chatIcon: '🛒',
  defaultSuggestedActions: [
    'Plan three weeknight dinners',
    'Restock the pantry basics',
    "What's new in olive oil?",
  ],
  partnershipText: null,
  catalogNav: [
    { label: 'Pantry', value: 'pantry' },
    { label: 'Fridge', value: 'beverage' },
    { label: 'Snacks', value: 'snack' },
    { label: 'Home', value: 'household' },
  ],
  secondaryAdvisorHero: null,
  defaultSceneSetting: 'neutral',
  hero: {
    badge: "This Week's List",
    headlineTop: 'The good stuff,',
    headlineBottom: 'the easy way.',
    subtitle:
      "A short list of pantry staples picked by cooks you'd actually eat dinner with. New favorites weekly, at the door by six.",
    heroImage:
      'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Olive oil, bread, and herbs — weeknight pantry still life',
    primaryCTA: 'Shop the List',
    trustPills: ['Cold-Chain Verified', 'Same-Day by 6 PM', "Beats the Store You're At"],
    authenticatedHeadlineTop: 'Your basket,',
    authenticatedSubtitle: 'Already thinking of Tuesday.',
    displayFont: 'fraunces',
    trustSeparator: '·',
    editorialMark: 'Wk 47',
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

/** Resolve a HeroDisplayFont key to a CSS font-family stack. */
export function displayFontStack(font: HeroDisplayFont): string {
  switch (font) {
    case 'cormorant':
      return "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
    case 'fraunces':
      return "'Fraunces', 'Georgia', serif";
    case 'sans':
    default:
      return "'Inter', system-ui, sans-serif";
  }
}
