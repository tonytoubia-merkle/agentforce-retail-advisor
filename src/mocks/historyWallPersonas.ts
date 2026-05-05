import type {
  OrderRecord,
  BrowseSession,
  ChatSummary,
  MeaningfulEvent,
  AgentCapturedProfile,
  AppendedProfile,
} from '@/types/customer';

// ─── Archetype System ──────────────────────────────────────────────────────────
// Each persona maps to an engagement archetype that drives distinct optimization
// strategies in campaign wizard (different message, timing, channel, and budget).

export type EngagementArchetype =
  | 'champion'          // High CLV, active, omnichannel → upsell / referral
  | 'engaged'           // Active, email-responsive, growing → cross-sell
  | 'browse-ghost'      // Browses constantly, never converts → conversion trigger
  | 'loyalty-dormant'   // Has points, went silent → points-expiry nudge
  | 'recently-lapsed'   // 3–6 months gone → win-back sequence
  | 'one-and-done'      // Single purchase, disappeared → re-engagement
  | 'long-lapsed'       // 12–22 months gone → loyalty-expiry + last-chance
  | 'churned'           // Years gone, email suppressed → reactivation test
  | 'new-purchaser'     // First order < 30 days → onboarding journey
  | 'cart-abandoner'    // In funnel, high intent, no purchase → abandonment flow
  | 'life-event'        // Time-sensitive occasion → trigger-based urgency
  | 'niche-collector'   // Deep single-category affinity → category specialist
  | 'gift-buyer'        // Buys for others, seasonal → gifting calendar
  | 'appended-prospect' // No brand data, 3P signal → lookalike acquisition
  | 'anonymous';        // No ID resolved → identity capture

export interface ArchetypeConfig {
  label: string;
  tagline: string;            // 1-sentence optimization story
  badgeBg: string;            // Tailwind classes for badge background
  badgeText: string;          // Tailwind classes for badge text
  cardBorder: string;         // Tailwind border-color class on hover
  dotColor: string;           // Tailwind dot color
}

export const ARCHETYPE_CONFIG: Record<EngagementArchetype, ArchetypeConfig> = {
  champion: {
    label: 'Champion',
    tagline: 'Upsell to premium tier + referral ask.',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    cardBorder: 'hover:border-amber-500/50',
    dotColor: 'bg-amber-400',
  },
  engaged: {
    label: 'Actively Engaged',
    tagline: 'Cross-sell adjacent categories while engagement is high.',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    cardBorder: 'hover:border-emerald-500/50',
    dotColor: 'bg-emerald-400',
  },
  'browse-ghost': {
    label: 'Browse Ghost',
    tagline: 'Trigger first-purchase incentive — high browse, zero conversion.',
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-300',
    cardBorder: 'hover:border-slate-500/50',
    dotColor: 'bg-slate-400',
  },
  'loyalty-dormant': {
    label: 'Loyalty Dormant',
    tagline: 'Points-expiry alert drives urgency back to site.',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    cardBorder: 'hover:border-purple-500/50',
    dotColor: 'bg-purple-400',
  },
  'recently-lapsed': {
    label: 'Recently Lapsed',
    tagline: 'Win-back window is open — personalized discount + social proof.',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-300',
    cardBorder: 'hover:border-orange-500/50',
    dotColor: 'bg-orange-400',
  },
  'one-and-done': {
    label: 'One-And-Done',
    tagline: 'Single-purchase re-engagement: "How did it work for you?"',
    badgeBg: 'bg-yellow-500/20',
    badgeText: 'text-yellow-300',
    cardBorder: 'hover:border-yellow-500/50',
    dotColor: 'bg-yellow-400',
  },
  'long-lapsed': {
    label: 'Long Lapsed',
    tagline: 'Loyalty expiry + new launch as re-entry reason.',
    badgeBg: 'bg-zinc-500/20',
    badgeText: 'text-zinc-300',
    cardBorder: 'hover:border-zinc-500/50',
    dotColor: 'bg-zinc-400',
  },
  churned: {
    label: 'Churned',
    tagline: 'Last-chance suppression test — only reactivate with high-value offer.',
    badgeBg: 'bg-red-900/30',
    badgeText: 'text-red-400',
    cardBorder: 'hover:border-red-800/50',
    dotColor: 'bg-red-500',
  },
  'new-purchaser': {
    label: 'New Purchaser',
    tagline: 'Onboarding sequence: welcome + how-to + loyalty enrollment.',
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-300',
    cardBorder: 'hover:border-teal-500/50',
    dotColor: 'bg-teal-400',
  },
  'cart-abandoner': {
    label: 'Cart Abandoner',
    tagline: 'Abandonment flow: 1 hr, 24 hr, 72 hr with social proof insert.',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-300',
    cardBorder: 'hover:border-sky-500/50',
    dotColor: 'bg-sky-400',
  },
  'life-event': {
    label: 'Life Event',
    tagline: 'Trigger-based journey — time-sensitive occasion detected.',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    cardBorder: 'hover:border-rose-500/50',
    dotColor: 'bg-rose-400',
  },
  'niche-collector': {
    label: 'Niche Collector',
    tagline: 'Hyper-personalized category newsletter + exclusive early access.',
    badgeBg: 'bg-amber-600/20',
    badgeText: 'text-amber-200',
    cardBorder: 'hover:border-amber-600/50',
    dotColor: 'bg-amber-500',
  },
  'gift-buyer': {
    label: 'Gift Buyer',
    tagline: 'Seasonal trigger calendar — next peak 3 weeks out.',
    badgeBg: 'bg-pink-500/20',
    badgeText: 'text-pink-300',
    cardBorder: 'hover:border-pink-500/50',
    dotColor: 'bg-pink-400',
  },
  'appended-prospect': {
    label: 'Appended Prospect',
    tagline: 'Lookalike acquisition — mirror top-tier customer attributes.',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    cardBorder: 'hover:border-indigo-500/50',
    dotColor: 'bg-indigo-400',
  },
  anonymous: {
    label: 'Anonymous',
    tagline: 'Identity capture — resolve before next touch.',
    badgeBg: 'bg-neutral-500/20',
    badgeText: 'text-neutral-400',
    cardBorder: 'hover:border-neutral-600/50',
    dotColor: 'bg-neutral-500',
  },
};

// ─── Persona Seed Data ─────────────────────────────────────────────────────────

export interface PersonaSeedData {
  orders: OrderRecord[];
  browseSessions: BrowseSession[];
  chatSummaries: ChatSummary[];
  meaningfulEvents: MeaningfulEvent[];
  agentCapturedProfile: AgentCapturedProfile;
  appendedProfile?: AppendedProfile;
  merkuryId?: string;
  identityTier: 'known' | 'appended' | 'anonymous';
}

export interface OptimizationStory {
  segment: string;
  recommendedJourneys: string[];
  suppressFrom: string[];
  flightingNote: string;
}

// ─── History Wall Persona ──────────────────────────────────────────────────────

export interface HistoryWallPersona {
  id: string;
  displayName: string;
  firstName: string;
  age: number;
  city: string;
  state: string;
  email: string;
  archetype: EngagementArchetype;
  avatarInitials: string;
  avatarGradient: string;         // Tailwind gradient bg classes

  // Quick-stats (shown on card face)
  orderCount: number;
  lifetimeValue: number;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints?: number;
  loyaltyExpired?: boolean;
  lastActiveDaysAgo: number;
  primaryChannel: string;
  keyInterests: string[];
  keyBehaviors: string[];         // Human-readable engagement signals

  // Rich seed data (flows to Salesforce when persona is claimed)
  seedData: PersonaSeedData;

  // What the optimization engine would do with this profile
  optimizationStory: OptimizationStory;
}

// ─── Helper: days-ago date string ─────────────────────────────────────────────
// Reference date: 2026-05-05

function daysAgo(n: number): string {
  const d = new Date('2026-05-05');
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ─── Persona 1: Jade Morrison — Champion ──────────────────────────────────────
const jadeMorrison: HistoryWallPersona = {
  id: 'jade-morrison',
  displayName: 'Jade Morrison',
  firstName: 'Jade',
  age: 36,
  city: 'Seattle',
  state: 'WA',
  email: 'jade.morrison@example.com',
  archetype: 'champion',
  avatarInitials: 'JM',
  avatarGradient: 'from-amber-400 to-amber-600',
  orderCount: 7,
  lifetimeValue: 842,
  loyaltyTier: 'platinum',
  loyaltyPoints: 8200,
  lastActiveDaysAgo: 3,
  primaryChannel: 'Email + App',
  keyInterests: ['anti-aging serums', 'retinol', 'SPF routine'],
  keyBehaviors: ['90% email open rate', 'in-app browse weekly', 'repeats best-sellers'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-JD-98101',
    orders: [
      {
        orderId: 'ORD-2024-0310', orderDate: daysAgo(450), channel: 'online', status: 'completed',
        totalAmount: 94, lineItems: [{ productId: 'serum-retinol', productName: 'Retinol Renewal Serum', quantity: 1, unitPrice: 94 }],
      },
      {
        orderId: 'ORD-2024-0711', orderDate: daysAgo(360), channel: 'in-store', status: 'completed',
        totalAmount: 158, lineItems: [
          { productId: 'moisturizer-sensitive', productName: 'Hydra-Calm Moisturizer', quantity: 1, unitPrice: 58 },
          { productId: 'sunscreen-lightweight', productName: 'Invisible Shield SPF 50', quantity: 2, unitPrice: 50 },
        ],
      },
      {
        orderId: 'ORD-2024-1103', orderDate: daysAgo(270), channel: 'online', status: 'completed',
        totalAmount: 122, lineItems: [{ productId: 'serum-vitamin-c', productName: 'Glow Boost Vitamin C Serum', quantity: 1, unitPrice: 72 }, { productId: 'toner-aha', productName: 'Glow Tonic AHA Toner', quantity: 1, unitPrice: 50 }],
      },
      {
        orderId: 'ORD-2025-0218', orderDate: daysAgo(175), channel: 'online', status: 'completed',
        totalAmount: 188, lineItems: [{ productId: 'serum-retinol', productName: 'Retinol Renewal Serum', quantity: 1, unitPrice: 94 }, { productId: 'eye-cream', productName: 'Firming Eye Concentrate', quantity: 1, unitPrice: 94 }],
      },
      {
        orderId: 'ORD-2025-0601', orderDate: daysAgo(90), channel: 'mobile-app', status: 'completed',
        totalAmount: 72, lineItems: [{ productId: 'serum-vitamin-c', productName: 'Glow Boost Vitamin C Serum', quantity: 1, unitPrice: 72 }],
      },
      {
        orderId: 'ORD-2025-0812', orderDate: daysAgo(55), channel: 'online', status: 'completed',
        totalAmount: 94, lineItems: [{ productId: 'serum-retinol', productName: 'Retinol Renewal Serum', quantity: 1, unitPrice: 94 }],
      },
      {
        orderId: 'ORD-2025-0916', orderDate: daysAgo(21), channel: 'online', status: 'completed',
        totalAmount: 114, lineItems: [{ productId: 'moisturizer-sensitive', productName: 'Hydra-Calm Moisturizer', quantity: 1, unitPrice: 58 }, { productId: 'sunscreen-lightweight', productName: 'Invisible Shield SPF 50', quantity: 1, unitPrice: 56 }],
      },
    ],
    browseSessions: [
      { sessionDate: daysAgo(3), categoriesBrowsed: ['serum', 'eye-cream'], productsViewed: ['serum-retinol', 'peptide-serum', 'eye-cream'], durationMinutes: 14, device: 'mobile' },
      { sessionDate: daysAgo(18), categoriesBrowsed: ['moisturizer', 'spf'], productsViewed: ['moisturizer-sensitive', 'sunscreen-lightweight'], durationMinutes: 9, device: 'desktop' },
    ],
    chatSummaries: [
      { sessionDate: daysAgo(55), summary: 'Customer asked for help building a retinol tolerance schedule for her 30s. Agent recommended starting with 0.25% 2x/week, introduced Vitamin C in AM. Very engaged, asked follow-up questions about purging.', sentiment: 'positive', topicsDiscussed: ['retinol', 'vitamin C', 'routine building', 'anti-aging'] },
      { sessionDate: daysAgo(90), summary: 'Re-order of Vitamin C serum. Customer mentioned she\'s been using it for 3 months with noticeable improvement in skin tone. Asked about complementary peptide serum.', sentiment: 'positive', topicsDiscussed: ['vitamin C', 'peptides', 'replenishment', 'loyalty rewards'] },
    ],
    meaningfulEvents: [
      { eventType: 'milestone', description: 'Turning 40 next year — mentioned wanting to "get ahead of it" with a serious anti-aging routine', capturedAt: daysAgo(55), agentNote: 'High motivation, elevated willingness to invest. Flag for premium launch outreach.', urgency: 'Future' },
      { eventType: 'preference', description: 'Prefers fragrance-free formulations — has mild rosacea triggers', capturedAt: daysAgo(270), urgency: 'No Date' },
    ],
    agentCapturedProfile: {
      morningRoutineTime: { value: '10-15 minutes', capturedAt: daysAgo(55), capturedFrom: 'chat session', confidence: 'stated' },
      beautyPriority: { value: 'Active ingredients and clinical results over luxury branding', capturedAt: daysAgo(55), capturedFrom: 'chat session', confidence: 'stated' },
      climateContext: { value: 'Pacific Northwest — high humidity most of year, gel-cream textures preferred', capturedAt: daysAgo(270), capturedFrom: 'inferred from order pattern', confidence: 'inferred' },
      sleepPattern: { value: 'Consistent 7-8 hrs — good candidate for overnight treatments', capturedAt: daysAgo(55), capturedFrom: 'chat session', confidence: 'stated' },
    },
  },
  optimizationStory: {
    segment: 'VIP Platinum — High CLV, Active',
    recommendedJourneys: ['Platinum early-access launch email', 'Peptide serum cross-sell (logical next step)', 'Referral program invitation', 'Birthday milestone campaign (12 months out)'],
    suppressFrom: ['Acquisition campaigns', 'Win-back sequences', 'Generic broadcast'],
    flightingNote: 'Email at 7 AM PST Mon/Thu (highest open rate). Supplement with in-app push after email.',
  },
};

// ─── Persona 2: Carmen Ortiz — Actively Engaged ───────────────────────────────
const carmenOrtiz: HistoryWallPersona = {
  id: 'carmen-ortiz',
  displayName: 'Carmen Ortiz',
  firstName: 'Carmen',
  age: 42,
  city: 'Miami',
  state: 'FL',
  email: 'carmen.ortiz@example.com',
  archetype: 'engaged',
  avatarInitials: 'CO',
  avatarGradient: 'from-emerald-400 to-teal-600',
  orderCount: 4,
  lifetimeValue: 394,
  loyaltyTier: 'gold',
  loyaltyPoints: 3100,
  lastActiveDaysAgo: 10,
  primaryChannel: 'Email',
  keyInterests: ['hydration', 'SPF', 'fragrance'],
  keyBehaviors: ['88% email open rate', '6 of last 8 campaigns clicked', 'new job life event'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-CO-33101',
    orders: [
      {
        orderId: 'ORD-2024-0820', orderDate: daysAgo(350), channel: 'online', status: 'completed',
        totalAmount: 78, lineItems: [{ productId: 'moisturizer-sensitive', productName: 'Hydra-Calm Moisturizer', quantity: 1, unitPrice: 58 }, { productId: 'cleanser-gentle', productName: 'Cloud Cream Cleanser', quantity: 1, unitPrice: 20 }],
      },
      {
        orderId: 'ORD-2024-1210', orderDate: daysAgo(230), channel: 'online', status: 'completed',
        totalAmount: 102, lineItems: [{ productId: 'sunscreen-lightweight', productName: 'Invisible Shield SPF 50', quantity: 1, unitPrice: 56 }, { productId: 'fragrance-floral', productName: 'Jardin de Nuit Eau de Parfum', quantity: 1, unitPrice: 46 }],
      },
      {
        orderId: 'ORD-2025-0315', orderDate: daysAgo(115), channel: 'online', status: 'completed',
        totalAmount: 94, lineItems: [{ productId: 'toner-aha', productName: 'Glow Tonic AHA Toner', quantity: 1, unitPrice: 34 }, { productId: 'sunscreen-lightweight', productName: 'Invisible Shield SPF 50', quantity: 1, unitPrice: 60 }],
      },
      {
        orderId: 'ORD-2025-0614', orderDate: daysAgo(30), channel: 'online', status: 'completed',
        totalAmount: 120, lineItems: [{ productId: 'fragrance-floral', productName: 'Jardin de Nuit Eau de Parfum', quantity: 1, unitPrice: 120 }],
      },
    ],
    browseSessions: [
      { sessionDate: daysAgo(10), categoriesBrowsed: ['moisturizer', 'serum'], productsViewed: ['moisturizer-sensitive', 'serum-vitamin-c'], durationMinutes: 11, device: 'mobile', utmSource: 'email', utmCampaign: 'summer-glow' },
      { sessionDate: daysAgo(25), categoriesBrowsed: ['fragrance'], productsViewed: ['fragrance-floral', 'fragrance-woody'], durationMinutes: 7, device: 'mobile' },
    ],
    chatSummaries: [
      { sessionDate: daysAgo(115), summary: 'Carmen asked for humid-climate skincare recommendations for Miami summers. Agent suggested lightweight SPF + AHA toner. She mentioned she starts a new corporate job soon and wants her skin to look its best.', sentiment: 'positive', topicsDiscussed: ['humid climate', 'SPF', 'AHA', 'workplace confidence'] },
    ],
    meaningfulEvents: [
      { eventType: 'life-event', description: 'Starting a new corporate job in 2 weeks — wants to present a polished, confident appearance', capturedAt: daysAgo(115), agentNote: 'Strong purchase trigger. Recommend "office-ready skin" editorial + serum bundle.', urgency: 'This Week', eventDate: daysAgo(-14) },
      { eventType: 'preference', description: 'Uses SPF religiously — lives in Miami, very UV-aware', capturedAt: daysAgo(350), urgency: 'No Date' },
    ],
    agentCapturedProfile: {
      workEnvironment: { value: 'Corporate office with AC — transitioning from WFH', capturedAt: daysAgo(115), capturedFrom: 'chat session', confidence: 'stated' },
      climateContext: { value: 'Miami — extreme humidity + UV. Lightweight, non-greasy textures only.', capturedAt: daysAgo(350), capturedFrom: 'chat session', confidence: 'stated' },
      beautyPriority: { value: 'Polished, put-together look with minimal daily effort', capturedAt: daysAgo(115), capturedFrom: 'chat session', confidence: 'stated' },
    },
  },
  optimizationStory: {
    segment: 'Gold — Engaged & Growing',
    recommendedJourneys: ['New job "confidence bundle" email series', 'SPF replenishment reminder (30-day cycle)', 'Fragrance new-drop early access (high category affinity)', 'Gold → Platinum upgrade prompt (300 pts away)'],
    suppressFrom: ['Win-back', 'Acquisition', 'Discount-heavy campaigns'],
    flightingNote: 'Email 8 AM ET Tue/Thu — mobile-first. Avoid Friday afternoon; low open rate.',
  },
};

// ─── Persona 3: Taylor Nguyen — Browse Ghost ──────────────────────────────────
const taylorNguyen: HistoryWallPersona = {
  id: 'taylor-nguyen',
  displayName: 'Taylor Nguyen',
  firstName: 'Taylor',
  age: 28,
  city: 'Chicago',
  state: 'IL',
  email: 'taylor.nguyen@example.com',
  archetype: 'browse-ghost',
  avatarInitials: 'TN',
  avatarGradient: 'from-slate-400 to-slate-600',
  orderCount: 0,
  lifetimeValue: 0,
  loyaltyTier: undefined,
  loyaltyPoints: undefined,
  lastActiveDaysAgo: 1,
  primaryChannel: 'Social (Instagram)',
  keyInterests: ['foundation', 'skincare', 'clean beauty'],
  keyBehaviors: ['0 orders from 12 sessions', '847 product page views', 'cart abandoned 4×'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-TN-60614',
    orders: [],
    browseSessions: [
      { sessionDate: daysAgo(1), categoriesBrowsed: ['foundation', 'tinted-moisturizer'], productsViewed: ['foundation-dewy', 'tinted-spf', 'blush-silk'], durationMinutes: 18, device: 'mobile', utmSource: 'instagram' },
      { sessionDate: daysAgo(8), categoriesBrowsed: ['cleanser', 'moisturizer'], productsViewed: ['cleanser-gentle', 'moisturizer-sensitive'], durationMinutes: 12, device: 'mobile', utmSource: 'instagram' },
      { sessionDate: daysAgo(15), categoriesBrowsed: ['serum'], productsViewed: ['serum-vitamin-c', 'serum-niacinamide', 'serum-retinol'], durationMinutes: 22, device: 'mobile' },
      { sessionDate: daysAgo(22), categoriesBrowsed: ['foundation'], productsViewed: ['foundation-dewy'], durationMinutes: 8, device: 'mobile', utmSource: 'instagram' },
      { sessionDate: daysAgo(30), categoriesBrowsed: ['skincare'], productsViewed: ['cleanser-gentle', 'moisturizer-sensitive', 'toner-aha'], durationMinutes: 15, device: 'desktop' },
    ],
    chatSummaries: [],
    meaningfulEvents: [
      { eventType: 'intent', description: 'Cart abandoned with Cloud Cream Cleanser + Glow Tonic AHA ($70 total) — 4th abandonment event in 30 days', capturedAt: daysAgo(1), agentNote: 'Price sensitivity likely. Test $10-off first-purchase offer.', urgency: 'Immediate' },
      { eventType: 'preference', description: 'Consistently browses clean beauty and fragrance-free labels', capturedAt: daysAgo(15), urgency: 'No Date' },
    ],
    agentCapturedProfile: {},
    appendedProfile: {
      ageRange: '25-32',
      gender: 'non-binary',
      householdIncome: '$65k-$80k',
      hasChildren: false,
      homeOwnership: 'rent',
      interests: ['clean beauty', 'skincare routines', 'Instagram beauty', 'budget-conscious'],
      lifestyleSignals: ['urban renter', 'social media native', 'research-before-buy'],
      geoRegion: 'Chicago Metro',
    },
  },
  optimizationStory: {
    segment: 'High-Intent Non-Converter',
    recommendedJourneys: ['First-purchase 15% off (time-limited, 48hr)', 'Cart abandonment sequence 1hr/24hr/72hr', '"Your clean routine starter kit" editorial', 'Post-purchase onboarding if converts'],
    suppressFrom: ['Loyalty upsell (no account)', 'Replenishment emails', 'Cross-sell before first purchase'],
    flightingNote: 'Instagram Stories retargeting primary. Email as secondary. Offer window: Tue–Thu evening, not weekends.',
  },
};

// ─── Persona 4: Brennan Chase — Loyalty Dormant ───────────────────────────────
const brennanChase: HistoryWallPersona = {
  id: 'brennan-chase',
  displayName: 'Brennan Chase',
  firstName: 'Brennan',
  age: 34,
  city: 'Denver',
  state: 'CO',
  email: 'brennan.chase@example.com',
  archetype: 'loyalty-dormant',
  avatarInitials: 'BC',
  avatarGradient: 'from-purple-400 to-violet-600',
  orderCount: 2,
  lifetimeValue: 178,
  loyaltyTier: 'silver',
  loyaltyPoints: 1840,
  lastActiveDaysAgo: 156,
  primaryChannel: 'Email',
  keyInterests: ["men's skincare", 'SPF', 'moisturizer'],
  keyBehaviors: ['1,840 pts unused', '5 months no login', 'email unengaged last 90 days'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-BC-80202',
    orders: [
      {
        orderId: 'ORD-2024-0904', orderDate: daysAgo(345), channel: 'online', status: 'completed',
        totalAmount: 74, lineItems: [{ productId: 'cleanser-acne', productName: 'Clear Start Salicylic Cleanser', quantity: 1, unitPrice: 32 }, { productId: 'moisturizer-mens', productName: 'Daily Defense Moisturizer', quantity: 1, unitPrice: 42 }],
      },
      {
        orderId: 'ORD-2024-1201', orderDate: daysAgo(210), channel: 'online', status: 'completed',
        totalAmount: 104, lineItems: [{ productId: 'sunscreen-lightweight', productName: 'Invisible Shield SPF 50', quantity: 1, unitPrice: 56 }, { productId: 'serum-niacinamide', productName: 'Pore Refine Niacinamide Serum', quantity: 1, unitPrice: 48 }],
      },
    ],
    browseSessions: [
      { sessionDate: daysAgo(156), categoriesBrowsed: ['moisturizer', 'spf'], productsViewed: ['moisturizer-mens', 'sunscreen-lightweight'], durationMinutes: 6, device: 'desktop' },
    ],
    chatSummaries: [
      { sessionDate: daysAgo(345), summary: 'First interaction — Brennan wanted a simple 3-step men\'s routine. Agent recommended cleanser + niacinamide serum + SPF. Very brief session, purchased directly.', sentiment: 'positive', topicsDiscussed: ['minimal routine', "men's skincare", 'SPF'] },
    ],
    meaningfulEvents: [
      { eventType: 'intent', description: '1,840 loyalty points expiring in 47 days — customer unaware', capturedAt: daysAgo(0), agentNote: 'Points expiry urgency is the re-engagement hook. Pair with new men\'s launch.', urgency: 'This Month', eventDate: daysAgo(-47) },
    ],
    agentCapturedProfile: {
      morningRoutineTime: { value: '3 minutes max', capturedAt: daysAgo(345), capturedFrom: 'chat session', confidence: 'stated' },
      beautyPriority: { value: 'Simple, effective, not fussy', capturedAt: daysAgo(345), capturedFrom: 'chat session', confidence: 'stated' },
    },
  },
  optimizationStory: {
    segment: 'Silver Dormant — Points at Risk',
    recommendedJourneys: ['Points-expiry alert email (47 days)', 'Re-engagement: "Your routine is due for a refresh"', 'SMS nudge if email unopened after 7 days', 'SPF replenishment (last bought 7 months ago)'],
    suppressFrom: ['Luxury campaigns', 'Women\'s category', 'Complex routine builders'],
    flightingNote: 'Single strong subject line: "Your 1,840 points expire in X days." No discount needed — points are currency.',
  },
};

// ─── Persona 5: Simone Laurent — Recently Lapsed ──────────────────────────────
const simoneLaurent: HistoryWallPersona = {
  id: 'simone-laurent',
  displayName: 'Simone Laurent',
  firstName: 'Simone',
  age: 31,
  city: 'Portland',
  state: 'OR',
  email: 'simone.laurent@example.com',
  archetype: 'recently-lapsed',
  avatarInitials: 'SL',
  avatarGradient: 'from-orange-400 to-amber-600',
  orderCount: 3,
  lifetimeValue: 221,
  loyaltyTier: 'silver',
  loyaltyPoints: 760,
  lastActiveDaysAgo: 152,
  primaryChannel: 'Email',
  keyInterests: ['clean beauty', 'fragrance-free', 'serum'],
  keyBehaviors: ['5 months no purchase', '2 emails opened but not clicked', 'was a consistent quarterly buyer'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-SL-97201',
    orders: [
      {
        orderId: 'ORD-2024-0602', orderDate: daysAgo(430), channel: 'online', status: 'completed',
        totalAmount: 68, lineItems: [{ productId: 'cleanser-gentle', productName: 'Cloud Cream Cleanser', quantity: 1, unitPrice: 36 }, { productId: 'toner-aha', productName: 'Glow Tonic AHA Toner', quantity: 1, unitPrice: 32 }],
      },
      {
        orderId: 'ORD-2024-0921', orderDate: daysAgo(310), channel: 'online', status: 'completed',
        totalAmount: 72, lineItems: [{ productId: 'serum-niacinamide', productName: 'Pore Refine Niacinamide Serum', quantity: 1, unitPrice: 72 }],
      },
      {
        orderId: 'ORD-2024-1215', orderDate: daysAgo(152), channel: 'online', status: 'completed',
        totalAmount: 81, lineItems: [{ productId: 'cleanser-gentle', productName: 'Cloud Cream Cleanser', quantity: 1, unitPrice: 36 }, { productId: 'serum-niacinamide', productName: 'Pore Refine Niacinamide Serum', quantity: 1, unitPrice: 45 }],
      },
    ],
    browseSessions: [
      { sessionDate: daysAgo(152), categoriesBrowsed: ['cleanser', 'serum'], productsViewed: ['cleanser-gentle', 'serum-niacinamide'], durationMinutes: 5, device: 'mobile' },
    ],
    chatSummaries: [
      { sessionDate: daysAgo(310), summary: 'Simone asked about niacinamide for combination skin — concerned about pore size. Agent confirmed compatibility with her cleanser. Short, decisive purchase session.', sentiment: 'positive', topicsDiscussed: ['niacinamide', 'combination skin', 'pores', 'clean ingredients'] },
    ],
    meaningfulEvents: [
      { eventType: 'concern', description: 'Fell off the radar after December purchase — no stated reason, not unsubscribed', capturedAt: daysAgo(30), agentNote: 'Win-back window still open. Quarterly buyer pattern suggests natural re-entry around now.', urgency: 'This Month' },
      { eventType: 'preference', description: 'Strong clean beauty preference — avoid synthetic fragrance and parabens', capturedAt: daysAgo(310), urgency: 'No Date' },
    ],
    agentCapturedProfile: {
      sustainabilityPref: { value: 'Fragrance-free, paraben-free, cruelty-free only', capturedAt: daysAgo(310), capturedFrom: 'chat session', confidence: 'stated' },
    },
  },
  optimizationStory: {
    segment: 'Silver — Recently Lapsed (90–180 days)',
    recommendedJourneys: ['"We miss you" personalized win-back email with $12 credit', 'Clean beauty editorial — new arrivals matching her profile', 'Sequential email: Week 1 product story / Week 3 offer / Week 5 last-chance'],
    suppressFrom: ['Acquisition spend', 'Generic broadcast'],
    flightingNote: 'Email only — no SMS (not opted in). Send on Wednesday morning, 9 AM PT based on past open patterns.',
  },
};

// ─── Persona 6: Kevin Park — One-And-Done ─────────────────────────────────────
const kevinPark: HistoryWallPersona = {
  id: 'kevin-park',
  displayName: 'Kevin Park',
  firstName: 'Kevin',
  age: 26,
  city: 'Boston',
  state: 'MA',
  email: 'kevin.park@example.com',
  archetype: 'one-and-done',
  avatarInitials: 'KP',
  avatarGradient: 'from-yellow-400 to-amber-500',
  orderCount: 1,
  lifetimeValue: 46,
  lastActiveDaysAgo: 186,
  primaryChannel: 'Email',
  keyInterests: ['gift purchases', 'fragrance'],
  keyBehaviors: ['1 order (gift)', '6 months silent', 'opened welcome email, no further clicks'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-KP-02101',
    orders: [
      {
        orderId: 'ORD-2024-1102', orderDate: daysAgo(186), channel: 'online', status: 'completed',
        totalAmount: 46, lineItems: [{ productId: 'fragrance-floral', productName: 'Jardin de Nuit Eau de Parfum (Travel)', quantity: 1, unitPrice: 46, isGift: true }],
      },
    ],
    browseSessions: [
      { sessionDate: daysAgo(186), categoriesBrowsed: ['fragrance', 'gift-sets'], productsViewed: ['fragrance-floral', 'fragrance-woody', 'gift-set-holiday'], durationMinutes: 14, device: 'desktop' },
    ],
    chatSummaries: [],
    meaningfulEvents: [
      { eventType: 'intent', description: 'Gift purchase for a birthday — browsed gift sets, chose travel fragrance', capturedAt: daysAgo(186), urgency: 'Past' },
      { eventType: 'life-event', description: 'Mother\'s Day is 14 days away — Kevin likely has a gifting need', capturedAt: daysAgo(0), agentNote: "His last purchase was a gift. High probability Mother's Day trigger applies.", urgency: 'This Month', eventDate: daysAgo(-14) },
    ],
    agentCapturedProfile: {},
  },
  optimizationStory: {
    segment: 'Gift Buyer — Single Purchase, Dormant',
    recommendedJourneys: ["Mother's Day gifting email (timely)", '"Complete the set" follow-up for fragrance buyer', 'Loyalty enrollment as conversion incentive', 'Post-gift "Does she love it?" engagement'],
    suppressFrom: ['Skincare routine builders', 'Clinical/ingredient-heavy content', 'High-frequency sends'],
    flightingNote: 'Event-driven only — gifting occasions are the trigger. Do not spray with generic campaigns.',
  },
};

// ─── Persona 7: Helena Voss — Long Lapsed ─────────────────────────────────────
const helenaVoss: HistoryWallPersona = {
  id: 'helena-voss',
  displayName: 'Helena Voss',
  firstName: 'Helena',
  age: 48,
  city: 'Houston',
  state: 'TX',
  email: 'helena.voss@example.com',
  archetype: 'long-lapsed',
  avatarInitials: 'HV',
  avatarGradient: 'from-zinc-400 to-zinc-600',
  orderCount: 3,
  lifetimeValue: 312,
  loyaltyTier: undefined,
  loyaltyExpired: true,
  lastActiveDaysAgo: 670,
  primaryChannel: 'Unknown (lapsed)',
  keyInterests: ['luxury skincare', 'anti-aging', 'SPF'],
  keyBehaviors: ['loyalty gold tier expired', '22 months no activity', 'was a high-CLV customer'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-HV-77001',
    orders: [
      {
        orderId: 'ORD-2023-0314', orderDate: daysAgo(775), channel: 'in-store', status: 'completed',
        totalAmount: 102, lineItems: [{ productId: 'eye-cream', productName: 'Firming Eye Concentrate', quantity: 1, unitPrice: 102 }],
      },
      {
        orderId: 'ORD-2023-0701', orderDate: daysAgo(680), channel: 'online', status: 'completed',
        totalAmount: 94, lineItems: [{ productId: 'serum-retinol', productName: 'Retinol Renewal Serum', quantity: 1, unitPrice: 94 }],
      },
      {
        orderId: 'ORD-2023-1118', orderDate: daysAgo(590), channel: 'online', status: 'completed',
        totalAmount: 116, lineItems: [{ productId: 'serum-retinol', productName: 'Retinol Renewal Serum', quantity: 1, unitPrice: 94 }, { productId: 'cleanser-gentle', productName: 'Cloud Cream Cleanser', quantity: 1, unitPrice: 22 }],
      },
    ],
    browseSessions: [],
    chatSummaries: [
      { sessionDate: daysAgo(680), summary: 'Helena browsed in-store and purchased eye cream. Associate noted interest in a full anti-aging regimen. Followed up online with retinol.', sentiment: 'positive', topicsDiscussed: ['anti-aging', 'retinol', 'eye cream', 'luxury skincare'] },
    ],
    meaningfulEvents: [
      { eventType: 'life-event', description: 'Was a consistent buyer for 12 months, then completely disengaged. No return or complaint on record — likely switched brands.', capturedAt: daysAgo(100), agentNote: 'Long-lapsed reactivation requires a meaningful hook — new hero product or substantial loyalty reactivation offer.', urgency: 'Future' },
    ],
    agentCapturedProfile: {
      beautyPriority: { value: 'Clinical efficacy, visible results within weeks', capturedAt: daysAgo(680), capturedFrom: 'in-store associate note', confidence: 'stated' },
      priceRange: { value: 'Not price-sensitive — shops luxury tier', capturedAt: daysAgo(680), capturedFrom: 'purchase pattern', confidence: 'inferred' },
    },
  },
  optimizationStory: {
    segment: 'Gold Lapsed > 18 Months',
    recommendedJourneys: ['Re-engagement: new hero anti-aging launch with "What\'s new since you\'ve been gone" framing', 'Loyalty reactivation offer: re-join, earn double points first 3 months', 'VIP in-store event invitation'],
    suppressFrom: ['Standard promotions', 'Entry-level product intro', 'Points expiry (expired)'],
    flightingNote: 'Email with premium creative. Single send — do not sequence. If no open in 14 days, suppress permanently.',
  },
};

// ─── Persona 8: Robert Finley — Churned ───────────────────────────────────────
const robertFinley: HistoryWallPersona = {
  id: 'robert-finley',
  displayName: 'Robert Finley',
  firstName: 'Robert',
  age: 52,
  city: 'Philadelphia',
  state: 'PA',
  email: 'robert.finley@example.com',
  archetype: 'churned',
  avatarInitials: 'RF',
  avatarGradient: 'from-stone-500 to-stone-700',
  orderCount: 4,
  lifetimeValue: 308,
  loyaltyTier: 'bronze',
  loyaltyPoints: 120,
  lastActiveDaysAgo: 545,
  primaryChannel: 'Unknown',
  keyInterests: ["men's grooming", 'moisturizer', 'cleanser'],
  keyBehaviors: ['18 months since last purchase', 'email soft-bounced twice', 'bronze tier, barely engaged'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-RF-19101',
    orders: [
      { orderId: 'ORD-2022-0510', orderDate: daysAgo(1100), channel: 'online', status: 'completed', totalAmount: 64, lineItems: [{ productId: 'cleanser-acne', productName: 'Clear Start Salicylic Cleanser', quantity: 1, unitPrice: 32 }, { productId: 'moisturizer-mens', productName: 'Daily Defense Moisturizer', quantity: 1, unitPrice: 32 }] },
      { orderId: 'ORD-2022-1201', orderDate: daysAgo(890), channel: 'online', status: 'completed', totalAmount: 80, lineItems: [{ productId: 'sunscreen-lightweight', productName: 'Invisible Shield SPF 50', quantity: 1, unitPrice: 56 }, { productId: 'cleanser-acne', productName: 'Clear Start Salicylic Cleanser', quantity: 1, unitPrice: 24 }] },
      { orderId: 'ORD-2023-0620', orderDate: daysAgo(730), channel: 'online', status: 'completed', totalAmount: 74, lineItems: [{ productId: 'moisturizer-mens', productName: 'Daily Defense Moisturizer', quantity: 1, unitPrice: 42 }, { productId: 'cleanser-gentle', productName: 'Cloud Cream Cleanser', quantity: 1, unitPrice: 32 }] },
      { orderId: 'ORD-2023-1110', orderDate: daysAgo(545), channel: 'online', status: 'completed', totalAmount: 90, lineItems: [{ productId: 'serum-niacinamide', productName: 'Pore Refine Niacinamide Serum', quantity: 1, unitPrice: 48 }, { productId: 'sunscreen-lightweight', productName: 'Invisible Shield SPF 50', quantity: 1, unitPrice: 42 }] },
    ],
    browseSessions: [],
    chatSummaries: [],
    meaningfulEvents: [
      { eventType: 'concern', description: 'Email soft-bounced twice in the last 6 months — deliverability risk. May have changed email.', capturedAt: daysAgo(60), urgency: 'No Date' },
    ],
    agentCapturedProfile: {},
  },
  optimizationStory: {
    segment: 'Churned > 12 Months',
    recommendedJourneys: ['Reactivation: single email, premium offer, no sequence', 'Identity refresh: request updated email via re-engagement landing page'],
    suppressFrom: ['All standard campaign sends', 'SMS (not opted in)', 'Loyalty tier messaging (expired)'],
    flightingNote: 'Treat as acquisition: if email bounces again, suppress entirely and move to paid lookalike seed.',
  },
};

// ─── Persona 9: Zoe Chen — New Purchaser ──────────────────────────────────────
const zoeChen: HistoryWallPersona = {
  id: 'zoe-chen',
  displayName: 'Zoe Chen',
  firstName: 'Zoe',
  age: 23,
  city: 'Austin',
  state: 'TX',
  email: 'zoe.chen@example.com',
  archetype: 'new-purchaser',
  avatarInitials: 'ZC',
  avatarGradient: 'from-teal-400 to-cyan-600',
  orderCount: 1,
  lifetimeValue: 36,
  lastActiveDaysAgo: 12,
  primaryChannel: 'Email (welcome)',
  keyInterests: ['cleanser', 'starter routine', 'hydration'],
  keyBehaviors: ['first purchase 12 days ago', 'welcome email opened (not clicked)', 'browsed once post-purchase'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-ZC-78701',
    orders: [
      {
        orderId: 'ORD-2026-0423', orderDate: daysAgo(12), channel: 'online', status: 'completed',
        totalAmount: 36, lineItems: [{ productId: 'cleanser-gentle', productName: 'Cloud Cream Cleanser', quantity: 1, unitPrice: 36 }],
      },
    ],
    browseSessions: [
      { sessionDate: daysAgo(12), categoriesBrowsed: ['cleanser', 'moisturizer'], productsViewed: ['cleanser-gentle', 'moisturizer-sensitive'], durationMinutes: 8, device: 'mobile', utmSource: 'instagram' },
      { sessionDate: daysAgo(8), categoriesBrowsed: ['moisturizer', 'toner'], productsViewed: ['moisturizer-sensitive', 'toner-aha', 'cleanser-gentle'], durationMinutes: 6, device: 'mobile' },
    ],
    chatSummaries: [],
    meaningfulEvents: [
      { eventType: 'intent', description: 'First-time buyer browsing moisturizers and toner 4 days after cleanser purchase — building her first full routine', capturedAt: daysAgo(8), agentNote: 'Classic onboarding pattern. Next step: moisturizer recommendation to complete basic routine.', urgency: 'This Week' },
      { eventType: 'preference', description: 'Prefers simple, beginner-friendly routines — not overwhelming', capturedAt: daysAgo(12), urgency: 'No Date' },
    ],
    agentCapturedProfile: {
      morningRoutineTime: { value: '5 minutes', capturedAt: daysAgo(12), capturedFrom: 'inferred from product choice', confidence: 'inferred' },
      beautyPriority: { value: 'Starting simple and building up', capturedAt: daysAgo(12), capturedFrom: 'purchase pattern', confidence: 'inferred' },
    },
  },
  optimizationStory: {
    segment: 'New Purchaser — Day 12 Onboarding Window',
    recommendedJourneys: ['"Complete your routine" email: moisturizer as natural next step', 'Day 7: product tutorial / usage tips for cleanser', 'Day 14: loyalty enrollment invitation + double-points offer', 'Day 30: re-order reminder if no second purchase'],
    suppressFrom: ['Advanced routine builders', 'Luxury tier', 'Cross-category (fragrance, makeup) until routine anchored'],
    flightingNote: 'Email + in-app. Strike while onboarding window is open (days 7–21 are critical). Do not overwhelm — 1 email per week max.',
  },
};

// ─── Persona 10: Marcus Bell — Cart Abandoner ─────────────────────────────────
const marcusBell: HistoryWallPersona = {
  id: 'marcus-bell',
  displayName: 'Marcus Bell',
  firstName: 'Marcus',
  age: 29,
  city: 'Atlanta',
  state: 'GA',
  email: 'marcus.bell@example.com',
  archetype: 'cart-abandoner',
  avatarInitials: 'MB',
  avatarGradient: 'from-sky-400 to-blue-600',
  orderCount: 0,
  lifetimeValue: 0,
  lastActiveDaysAgo: 2,
  primaryChannel: 'Instagram',
  keyInterests: ['cleanser', 'SPF', 'men\'s skincare'],
  keyBehaviors: ['$89 cart abandoned 2 days ago', '3 sessions in 2 weeks', 'Instagram organic referral'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-MB-30301',
    orders: [],
    browseSessions: [
      { sessionDate: daysAgo(2), categoriesBrowsed: ['cleanser', 'spf'], productsViewed: ['cleanser-gentle', 'sunscreen-lightweight'], durationMinutes: 16, device: 'mobile', utmSource: 'instagram' },
      { sessionDate: daysAgo(9), categoriesBrowsed: ['skincare'], productsViewed: ['cleanser-gentle', 'moisturizer-mens', 'sunscreen-lightweight'], durationMinutes: 11, device: 'mobile', utmSource: 'instagram' },
      { sessionDate: daysAgo(14), categoriesBrowsed: ['cleanser', 'moisturizer'], productsViewed: ['cleanser-gentle', 'moisturizer-mens'], durationMinutes: 8, device: 'mobile', utmSource: 'instagram' },
    ],
    chatSummaries: [],
    meaningfulEvents: [
      { eventType: 'intent', description: 'Cart: Cloud Cream Cleanser ($36) + Invisible Shield SPF 50 ($53) — abandoned at payment step 2 days ago', capturedAt: daysAgo(2), agentNote: 'High purchase intent. Classic 3-session browser. Abandonment at payment = friction, not disinterest.', urgency: 'Immediate' },
    ],
    agentCapturedProfile: {},
    appendedProfile: {
      ageRange: '25-32',
      gender: 'male',
      householdIncome: '$70k-$90k',
      hasChildren: false,
      homeOwnership: 'rent',
      interests: ["men's grooming", 'fitness', 'skincare'],
      lifestyleSignals: ['urban professional', 'fitness-focused', 'Instagram-influenced'],
      geoRegion: 'Atlanta Metro',
    },
  },
  optimizationStory: {
    segment: 'High-Intent Cart Abandoner',
    recommendedJourneys: ['1-hr abandonment: "Still thinking?" with product reminder', '24-hr: social proof ("4,200 five-star reviews")', '72-hr: 10% off first order, expires in 48hrs', 'Instagram retargeting parallel to email sequence'],
    suppressFrom: ['Loyalty emails (no account)', 'Cross-sell before first conversion'],
    flightingNote: 'Email + Instagram retargeting running in parallel. First 24hrs is the highest-conversion window.',
  },
};

// ─── Persona 11: Alyssa Kim — Life Event (Wedding) ────────────────────────────
const alyssaKim: HistoryWallPersona = {
  id: 'alyssa-kim',
  displayName: 'Alyssa Kim',
  firstName: 'Alyssa',
  age: 27,
  city: 'San Francisco',
  state: 'CA',
  email: 'alyssa.kim@example.com',
  archetype: 'life-event',
  avatarInitials: 'AK',
  avatarGradient: 'from-rose-400 to-pink-600',
  orderCount: 2,
  lifetimeValue: 148,
  loyaltyTier: 'silver',
  loyaltyPoints: 1020,
  lastActiveDaysAgo: 5,
  primaryChannel: 'Email + SMS',
  keyInterests: ['bridal skincare', 'glow', 'hyperpigmentation'],
  keyBehaviors: ['wedding in 6 weeks', 'high urgency + AOV potential', 'researching full bridal routine'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-AK-94102',
    orders: [
      {
        orderId: 'ORD-2025-0108', orderDate: daysAgo(180), channel: 'online', status: 'completed',
        totalAmount: 72, lineItems: [{ productId: 'serum-vitamin-c', productName: 'Glow Boost Vitamin C Serum', quantity: 1, unitPrice: 72 }],
      },
      {
        orderId: 'ORD-2025-0310', orderDate: daysAgo(110), channel: 'online', status: 'completed',
        totalAmount: 76, lineItems: [{ productId: 'toner-aha', productName: 'Glow Tonic AHA Toner', quantity: 1, unitPrice: 34 }, { productId: 'cleanser-gentle', productName: 'Cloud Cream Cleanser', quantity: 1, unitPrice: 42 }],
      },
    ],
    browseSessions: [
      { sessionDate: daysAgo(5), categoriesBrowsed: ['serum', 'moisturizer', 'eye-cream'], productsViewed: ['serum-vitamin-c', 'moisturizer-sensitive', 'eye-cream', 'serum-retinol'], durationMinutes: 24, device: 'mobile' },
      { sessionDate: daysAgo(12), categoriesBrowsed: ['serum', 'spf'], productsViewed: ['serum-vitamin-c', 'sunscreen-lightweight', 'peptide-serum'], durationMinutes: 18, device: 'desktop' },
    ],
    chatSummaries: [
      { sessionDate: daysAgo(5), summary: 'Alyssa revealed she is getting married in 6 weeks and wants a complete bridal glow routine. Focused on Vitamin C brightening, reducing hyperpigmentation, and achieving luminous skin for the wedding day. Agent built a 6-week countdown plan.', sentiment: 'positive', topicsDiscussed: ['bridal skincare', 'Vitamin C', 'hyperpigmentation', 'glow routine', 'wedding prep'] },
    ],
    meaningfulEvents: [
      { eventType: 'life-event', description: 'Getting married in 6 weeks — building a full bridal skincare routine for luminous skin on wedding day', capturedAt: daysAgo(5), agentNote: 'Highest-urgency life event. Full bridal routine = $250-400 AOV potential. 6-week countdown is the campaign arc.', urgency: 'This Month', relativeTimeText: 'in 6 weeks', eventDate: daysAgo(-42) },
      { eventType: 'intent', description: 'Specifically researching hyperpigmentation correction + luminosity for photography', capturedAt: daysAgo(5), urgency: 'This Month' },
    ],
    agentCapturedProfile: {
      upcomingOccasions: { value: ['wedding'], capturedAt: daysAgo(5), capturedFrom: 'chat session', confidence: 'stated' },
      beautyPriority: { value: 'Luminous, camera-ready skin for wedding day. Results in 6 weeks.', capturedAt: daysAgo(5), capturedFrom: 'chat session', confidence: 'stated' },
      morningRoutineTime: { value: '15 minutes (increasing for wedding prep)', capturedAt: daysAgo(5), capturedFrom: 'chat session', confidence: 'stated' },
    },
  },
  optimizationStory: {
    segment: 'Life Event — Bridal (Weeks 1–6)',
    recommendedJourneys: ['"6-Week Bridal Glow Countdown" email series (1 per week)', 'Week 1: Vitamin C + AHA routine setup', 'Week 3: Eye cream + SPF add-on', 'Week 5: Full kit bundle with bridal discount', '"Wedding is tomorrow" SMS with usage reminders'],
    suppressFrom: ['Generic promotions', 'Unrelated categories', 'Points-expiry nudges during countdown'],
    flightingNote: 'Time-boxed urgency campaign. Email + SMS. Count down to wedding day — personalize by name and event. Maximum AOV opportunity.',
  },
};

// ─── Persona 12: Diego Ramirez — Life Event (New Parent) ──────────────────────
const diegoRamirez: HistoryWallPersona = {
  id: 'diego-ramirez',
  displayName: 'Diego Ramirez',
  firstName: 'Diego',
  age: 33,
  city: 'Brooklyn',
  state: 'NY',
  email: 'diego.ramirez@example.com',
  archetype: 'life-event',
  avatarInitials: 'DR',
  avatarGradient: 'from-violet-400 to-purple-600',
  orderCount: 2,
  lifetimeValue: 134,
  loyaltyTier: 'bronze',
  loyaltyPoints: 460,
  lastActiveDaysAgo: 8,
  primaryChannel: 'Email',
  keyInterests: ['clean ingredients', 'fragrance-free', 'baby-safe'],
  keyBehaviors: ['baby born 3 months ago', 'shifted to fragrance-free + clean', 'concern about ingredient safety'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-DR-11201',
    orders: [
      {
        orderId: 'ORD-2024-1005', orderDate: daysAgo(220), channel: 'online', status: 'completed',
        totalAmount: 68, lineItems: [{ productId: 'cleanser-gentle', productName: 'Cloud Cream Cleanser', quantity: 1, unitPrice: 36 }, { productId: 'moisturizer-mens', productName: 'Daily Defense Moisturizer', quantity: 1, unitPrice: 32 }],
      },
      {
        orderId: 'ORD-2025-0118', orderDate: daysAgo(78), channel: 'online', status: 'completed',
        totalAmount: 66, lineItems: [{ productId: 'cleanser-gentle', productName: 'Cloud Cream Cleanser (fragrance-free)', quantity: 1, unitPrice: 36 }, { productId: 'sunscreen-lightweight', productName: 'Invisible Shield SPF 50', quantity: 1, unitPrice: 30 }],
      },
    ],
    browseSessions: [
      { sessionDate: daysAgo(8), categoriesBrowsed: ['cleanser', 'moisturizer'], productsViewed: ['cleanser-gentle', 'moisturizer-sensitive'], durationMinutes: 10, device: 'mobile' },
      { sessionDate: daysAgo(78), categoriesBrowsed: ['clean-beauty'], productsViewed: ['cleanser-gentle', 'sunscreen-lightweight'], durationMinutes: 12, device: 'mobile' },
    ],
    chatSummaries: [
      { sessionDate: daysAgo(78), summary: 'Diego explained his wife just had a baby 3 months ago and they\'ve both become much more conscious of ingredients in household products. He\'s switching his personal care routine to fragrance-free and non-toxic formulas. Agent confirmed all clean, baby-safe options.', sentiment: 'positive', topicsDiscussed: ['clean ingredients', 'fragrance-free', 'new parent', 'safety-conscious', 'lifestyle shift'] },
    ],
    meaningfulEvents: [
      { eventType: 'life-event', description: 'New baby born ~3 months ago — shifting entire household to fragrance-free, clean formulations', capturedAt: daysAgo(78), agentNote: 'Long-term loyalty play. Household influence extends beyond personal use. Flag for clean beauty editorial series.', urgency: 'Recent Past' },
      { eventType: 'preference', description: 'Ingredient safety is now primary filter for all purchases — parabens, fragrance, phthalates excluded', capturedAt: daysAgo(78), urgency: 'No Date' },
    ],
    agentCapturedProfile: {
      sustainabilityPref: { value: 'Fragrance-free, paraben-free, EWG-safe, baby-household-safe', capturedAt: daysAgo(78), capturedFrom: 'chat session', confidence: 'stated' },
      waterIntake: { value: 'Sleep-deprived new parent — noted exhaustion in conversation', capturedAt: daysAgo(78), capturedFrom: 'chat session', confidence: 'inferred' },
      sleepPattern: { value: 'Disrupted — newborn schedule', capturedAt: daysAgo(78), capturedFrom: 'chat session', confidence: 'inferred' },
    },
  },
  optimizationStory: {
    segment: 'New Parent — Lifestyle Shift to Clean Beauty',
    recommendedJourneys: ['"Clean home, clean routine" editorial series', 'Monthly clean beauty replenishment subscription offer', '"Baby-safe home favorites" curated bundle', 'Partner product introduction (expand household CLV)'],
    suppressFrom: ['Fragrance category', 'Heavy-ingredient content', 'Advanced actives (retinol, high-% AHA)'],
    flightingNote: 'Daytime email (11 AM–1 PM) — new parents often on phone during feeding. Clean, simple, reassuring tone.',
  },
};

// ─── Persona 13: Isabelle Fontaine — Niche Collector (Fragrance) ──────────────
const isabelleFontaine: HistoryWallPersona = {
  id: 'isabelle-fontaine',
  displayName: 'Isabelle Fontaine',
  firstName: 'Isabelle',
  age: 45,
  city: 'New York',
  state: 'NY',
  email: 'isabelle.fontaine@example.com',
  archetype: 'niche-collector',
  avatarInitials: 'IF',
  avatarGradient: 'from-amber-500 to-yellow-600',
  orderCount: 6,
  lifetimeValue: 1280,
  loyaltyTier: 'platinum',
  loyaltyPoints: 9100,
  lastActiveDaysAgo: 30,
  primaryChannel: 'Email',
  keyInterests: ['fragrance', 'woody-oriental', 'exclusive launches'],
  keyBehaviors: ['zero skincare purchases', 'all 6 orders are fragrance', '$213 avg order value'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-IF-10001',
    orders: [
      { orderId: 'ORD-2023-1101', orderDate: daysAgo(800), channel: 'online', status: 'completed', totalAmount: 215, lineItems: [{ productId: 'fragrance-woody', productName: 'Oud Noir Eau de Parfum', quantity: 1, unitPrice: 215 }] },
      { orderId: 'ORD-2024-0210', orderDate: daysAgo(650), channel: 'in-store', status: 'completed', totalAmount: 195, lineItems: [{ productId: 'fragrance-oriental', productName: 'Ambre Mystique Extrait', quantity: 1, unitPrice: 195 }] },
      { orderId: 'ORD-2024-0501', orderDate: daysAgo(520), channel: 'online', status: 'completed', totalAmount: 245, lineItems: [{ productId: 'fragrance-exclusive', productName: 'Nuit de Jasmin Limited Edition', quantity: 1, unitPrice: 245 }] },
      { orderId: 'ORD-2024-0811', orderDate: daysAgo(395), channel: 'online', status: 'completed', totalAmount: 195, lineItems: [{ productId: 'fragrance-woody', productName: 'Oud Noir Eau de Parfum', quantity: 1, unitPrice: 195 }] },
      { orderId: 'ORD-2024-1205', orderDate: daysAgo(270), channel: 'in-store', status: 'completed', totalAmount: 225, lineItems: [{ productId: 'fragrance-oriental', productName: 'Santal Lumière Parfum', quantity: 1, unitPrice: 225 }] },
      { orderId: 'ORD-2025-0305', orderDate: daysAgo(61), channel: 'online', status: 'completed', totalAmount: 205, lineItems: [{ productId: 'fragrance-woody', productName: 'Oud Noir Refill Set', quantity: 1, unitPrice: 205 }] },
    ],
    browseSessions: [
      { sessionDate: daysAgo(30), categoriesBrowsed: ['fragrance'], productsViewed: ['fragrance-woody', 'fragrance-exclusive', 'fragrance-oriental'], durationMinutes: 19, device: 'desktop' },
    ],
    chatSummaries: [
      { sessionDate: daysAgo(395), summary: 'Isabelle is a serious fragrance collector — described her collection as "35+ bottles, organized by mood." She only buys woody-oriental and gourmand notes. Has zero interest in skincare. Explicitly asked to not be recommended skincare products.', sentiment: 'positive', topicsDiscussed: ['fragrance', 'woody-oriental', 'collector', 'niche perfumery', 'no skincare'] },
    ],
    meaningfulEvents: [
      { eventType: 'preference', description: 'Fragrance collector — only buys woody, oriental, and gourmand notes. Explicitly not interested in skincare or makeup.', capturedAt: daysAgo(395), urgency: 'No Date' },
      { eventType: 'intent', description: 'Browsed new launch section 30 days ago — likely anticipating an exclusive pre-order opportunity', capturedAt: daysAgo(30), urgency: 'This Month' },
    ],
    agentCapturedProfile: {
      beautyPriority: { value: 'Fragrance only — refuses cross-category recommendations', capturedAt: daysAgo(395), capturedFrom: 'chat session', confidence: 'stated' },
      priceRange: { value: '$150-$300 per fragrance — not price-sensitive within category', capturedAt: daysAgo(650), capturedFrom: 'purchase pattern', confidence: 'inferred' },
    },
  },
  optimizationStory: {
    segment: 'Platinum Fragrance Collector',
    recommendedJourneys: ['Fragrance exclusive early-access launch email', 'Refill subscription offer for repeat SKUs', '"New arrival: your style" — woody-oriental editorial', 'VIP in-store fragrance event invitation'],
    suppressFrom: ['ALL skincare campaigns', 'Makeup', 'Wellness', 'Generic brand sends', 'Acquisition'],
    flightingNote: 'Fragrance category only. One well-curated email per launch cycle. Over-communication will cause unsubscribe.',
  },
};

// ─── Persona 14: Donna Walsh — Gift Buyer ─────────────────────────────────────
const donnaWalsh: HistoryWallPersona = {
  id: 'donna-walsh',
  displayName: 'Donna Walsh',
  firstName: 'Donna',
  age: 54,
  city: 'Nashville',
  state: 'TN',
  email: 'donna.walsh@example.com',
  archetype: 'gift-buyer',
  avatarInitials: 'DW',
  avatarGradient: 'from-pink-400 to-rose-600',
  orderCount: 8,
  lifetimeValue: 892,
  loyaltyTier: 'gold',
  loyaltyPoints: 3400,
  lastActiveDaysAgo: 90,
  primaryChannel: 'Email',
  keyInterests: ['gift sets', 'fragrance', 'luxury skincare'],
  keyBehaviors: ['all 8 orders are gifts', 'buys Nov/Feb/May', 'Mother\'s Day is 14 days away'],
  seedData: {
    identityTier: 'known',
    merkuryId: 'MRK-DW-37201',
    orders: [
      { orderId: 'ORD-2022-1202', orderDate: daysAgo(885), channel: 'online', status: 'completed', totalAmount: 98, lineItems: [{ productId: 'gift-set-holiday', productName: 'Holiday Gift Set', quantity: 1, unitPrice: 98, isGift: true }] },
      { orderId: 'ORD-2023-0210', orderDate: daysAgo(820), channel: 'online', status: 'completed', totalAmount: 125, lineItems: [{ productId: 'fragrance-floral', productName: 'Jardin de Nuit Eau de Parfum', quantity: 1, unitPrice: 125, isGift: true }] },
      { orderId: 'ORD-2023-0506', orderDate: daysAgo(729), channel: 'online', status: 'completed', totalAmount: 112, lineItems: [{ productId: 'gift-set-skincare', productName: 'Glow Starter Gift Set', quantity: 1, unitPrice: 112, isGift: true }] },
      { orderId: 'ORD-2023-1128', orderDate: daysAgo(525), channel: 'online', status: 'completed', totalAmount: 145, lineItems: [{ productId: 'fragrance-woody', productName: 'Oud Noir Holiday Gift Set', quantity: 1, unitPrice: 145, isGift: true }] },
      { orderId: 'ORD-2024-0214', orderDate: daysAgo(446), channel: 'online', status: 'completed', totalAmount: 115, lineItems: [{ productId: 'gift-set-skincare', productName: 'Love Your Skin Gift Set', quantity: 1, unitPrice: 115, isGift: true }] },
      { orderId: 'ORD-2024-0511', orderDate: daysAgo(359), channel: 'online', status: 'completed', totalAmount: 128, lineItems: [{ productId: 'fragrance-floral', productName: 'Jardin de Nuit Gift Box', quantity: 1, unitPrice: 128, isGift: true }] },
      { orderId: 'ORD-2024-1201', orderDate: daysAgo(155), channel: 'online', status: 'completed', totalAmount: 162, lineItems: [{ productId: 'gift-set-luxury', productName: 'Luxe Holiday Collection', quantity: 1, unitPrice: 162, isGift: true }] },
      { orderId: 'ORD-2025-0209', orderDate: daysAgo(85), channel: 'online', status: 'completed', totalAmount: 145, lineItems: [{ productId: 'gift-set-skincare', productName: 'Valentine\'s Radiance Set', quantity: 1, unitPrice: 145, isGift: true }] },
    ],
    browseSessions: [
      { sessionDate: daysAgo(90), categoriesBrowsed: ['gift-sets', 'fragrance'], productsViewed: ['gift-set-holiday', 'fragrance-floral', 'gift-set-skincare'], durationMinutes: 12, device: 'desktop', utmSource: 'email', utmCampaign: 'valentines-gifts' },
    ],
    chatSummaries: [
      { sessionDate: daysAgo(359), summary: "Donna buys exclusively for her daughters (2) and mother. She's never purchased anything for herself. Very decisive shopper once she knows what occasion she's buying for. Remembers what she bought before and avoids repeating.", sentiment: 'positive', topicsDiscussed: ['gifting', 'daughters', 'mother', 'occasion shopping', 'gift sets'] },
    ],
    meaningfulEvents: [
      { eventType: 'life-event', description: "Mother's Day is 14 days away — Donna's highest-peak buying occasion. She has bought for Mother's Day every year since 2022.", capturedAt: daysAgo(0), agentNote: "Alert: Mother's Day window open. Send gifting campaign immediately.", urgency: 'This Month', eventDate: daysAgo(-14) },
      { eventType: 'preference', description: 'Never buys for herself — all purchases are gifts for daughters and her own mother', capturedAt: daysAgo(359), urgency: 'No Date' },
    ],
    agentCapturedProfile: {
      giftsFor: { value: ['daughters (x2)', 'mother'], capturedAt: daysAgo(359), capturedFrom: 'chat session', confidence: 'stated' },
      upcomingOccasions: { value: ["Mother's Day", 'Christmas', "Valentine's Day"], capturedAt: daysAgo(359), capturedFrom: 'chat session', confidence: 'stated' },
      beautyPriority: { value: 'Presentation and giftability — beautiful packaging is critical', capturedAt: daysAgo(359), capturedFrom: 'chat session', confidence: 'stated' },
    },
  },
  optimizationStory: {
    segment: 'Seasonal Gift Buyer — Mother\'s Day Window',
    recommendedJourneys: ["Mother's Day gifting email NOW (14-day window)", '"Shop by recipient" editorial — daughters vs mother', 'Year-round gifting calendar: remind 3 weeks before each peak', '"Gift that ships in time" urgency as event approaches'],
    suppressFrom: ['Self-care editorial', 'Loyalty tier upsell', 'Routine-building content', 'Heavy skincare science'],
    flightingNote: "Email immediately — she's already in gifting mode. Don't wait for the weekend push. She buys Tuesday-Thursday morning.",
  },
};

// ─── Persona 15: Reena Patel — Appended Prospect ──────────────────────────────
const reenaPatel: HistoryWallPersona = {
  id: 'reena-patel',
  displayName: 'Reena Patel',
  firstName: 'Reena',
  age: 31,
  city: 'Brooklyn',
  state: 'NY',
  email: '',
  archetype: 'appended-prospect',
  avatarInitials: 'RP',
  avatarGradient: 'from-indigo-400 to-purple-600',
  orderCount: 0,
  lifetimeValue: 0,
  lastActiveDaysAgo: 999,
  primaryChannel: 'Unknown — paid social likely',
  keyInterests: ['clean beauty', 'wellness', 'yoga', 'luxury skincare'],
  keyBehaviors: ['no brand interaction', '$120k HHI', 'mirrors top-5 customer attributes', 'lookalike seed'],
  seedData: {
    identityTier: 'appended',
    merkuryId: 'MRK-RP-11215',
    orders: [],
    browseSessions: [],
    chatSummaries: [],
    meaningfulEvents: [],
    agentCapturedProfile: {},
    appendedProfile: {
      ageRange: '28-35',
      gender: 'female',
      householdIncome: '$115k-$130k',
      hasChildren: false,
      homeOwnership: 'rent',
      educationLevel: "master's",
      interests: ['luxury clean beauty', 'yoga', 'wellness', 'plant-based lifestyle', 'sustainable brands'],
      lifestyleSignals: ['urban professional', 'wellness-focused', 'fitness-routine-driven', 'clean-label buyer'],
      geoRegion: 'New York Metro',
    },
  },
  optimizationStory: {
    segment: 'Merkury Lookalike — Acquisition Target',
    recommendedJourneys: ['Paid social: clean beauty editorial (Instagram/Pinterest)', '"Meet SERENE" brand awareness campaign', 'First-purchase incentive: $15 off with email capture', 'Lookalike seed for Meta + Google audience expansion'],
    suppressFrom: ['CRM emails (no email address)', 'Loyalty program (no account)', 'Win-back sequences'],
    flightingNote: 'Paid social only until email captured. Mirror messaging of top-CLV cohort. Clean beauty + sustainability angle.',
  },
};

// ─── Persona 16: Anonymous Drop-In ────────────────────────────────────────────
const anonymousDropIn: HistoryWallPersona = {
  id: 'anonymous-drop-in',
  displayName: 'Anonymous Drop-In',
  firstName: 'Anonymous',
  age: 0,
  city: 'Unknown',
  state: '',
  email: '',
  archetype: 'anonymous',
  avatarInitials: '?',
  avatarGradient: 'from-neutral-500 to-neutral-700',
  orderCount: 0,
  lifetimeValue: 0,
  lastActiveDaysAgo: 1,
  primaryChannel: 'Instagram Story',
  keyInterests: ['unknown'],
  keyBehaviors: ['40-second session', 'Instagram story referral', 'no Merkury PID match', 'page bounced'],
  seedData: {
    identityTier: 'anonymous',
    orders: [],
    browseSessions: [
      { sessionDate: daysAgo(1), categoriesBrowsed: ['homepage'], productsViewed: [], durationMinutes: 1, device: 'mobile', utmSource: 'instagram', utmCampaign: 'story-reel-052026' },
    ],
    chatSummaries: [],
    meaningfulEvents: [],
    agentCapturedProfile: {},
  },
  optimizationStory: {
    segment: 'Anonymous — Identity Capture Needed',
    recommendedJourneys: ['First-session identity capture: email gate with offer', 'Merkury PID resolution on next visit', 'Retargeting pixel — Instagram/Meta custom audience build'],
    suppressFrom: ['All CRM journeys (no identity)', 'Personalized content'],
    flightingNote: 'Cannot personalize without identity. Priority: capture email via first-visit overlay or incentive. Every anonymous session is a lost optimization opportunity.',
  },
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const HISTORY_WALL_PERSONAS: HistoryWallPersona[] = [
  jadeMorrison,
  carmenOrtiz,
  taylorNguyen,
  brennanChase,
  simoneLaurent,
  kevinPark,
  helenaVoss,
  robertFinley,
  zoeChen,
  marcusBell,
  alyssaKim,
  diegoRamirez,
  isabelleFontaine,
  donnaWalsh,
  reenaPatel,
  anonymousDropIn,
];

export const ARCHETYPE_FILTER_GROUPS = [
  { label: 'All', archetypes: null },
  { label: 'Active', archetypes: ['champion', 'engaged'] as EngagementArchetype[] },
  { label: 'At Risk', archetypes: ['browse-ghost', 'loyalty-dormant', 'recently-lapsed', 'one-and-done'] as EngagementArchetype[] },
  { label: 'Lapsed', archetypes: ['long-lapsed', 'churned'] as EngagementArchetype[] },
  { label: 'New', archetypes: ['new-purchaser', 'cart-abandoner'] as EngagementArchetype[] },
  { label: 'Life Event', archetypes: ['life-event'] as EngagementArchetype[] },
  { label: 'Prospect', archetypes: ['niche-collector', 'gift-buyer', 'appended-prospect', 'anonymous'] as EngagementArchetype[] },
] as const;

export function getPersonaById(id: string): HistoryWallPersona | undefined {
  return HISTORY_WALL_PERSONAS.find((p) => p.id === id);
}
