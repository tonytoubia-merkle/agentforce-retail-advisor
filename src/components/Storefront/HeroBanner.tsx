import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { CustomerProfile } from '@/types/customer';
import type { CampaignAttribution } from '@/types/campaign';
import { useCampaign } from '@/contexts/CampaignContext';
import { isPersonalizationConfigured, getHeroCampaignDecision, type PersonalizationDecision } from '@/services/personalization';

interface HeroBannerProps {
  onShopNow: () => void;
  customer?: CustomerProfile | null;
  isAuthenticated?: boolean;
}

// Hero image mapping for personalization scenarios
const HERO_IMAGES = {
  authenticated: '/assets/hero/hero-glowing-skin.png',      // Known + signed in → radiant glow
  pseudonymous: '/assets/hero/hero-face-wash.png',          // Known + not signed in → fresh start
  cleanBeauty: '/assets/hero/hero-clean-botanicals.png',    // 3P clean/natural interests
  luxury: '/assets/hero/hero-luxury-textures.png',          // 3P luxury/premium interests
  wellness: '/assets/hero/hero-wellness-lifestyle.png',     // 3P wellness/fitness interests
  default: '/assets/hero/hero-spa-mask.png',                // Anonymous → aspirational spa
};

interface HeroVariant {
  badge: string;
  headlineTop: string;
  headlineBottom: string;
  subtitle: string;
  heroImage: string;
  imageAlt: string;
  /** Where the variant was resolved from — 'default' means no specific context matched */
  source: 'campaign' | 'authenticated' | 'appended' | 'default';
}

/**
 * Local hero variant — only authenticated greeting + generic default.
 * All campaign/segment/interest personalization is driven by:
 *   1. Personalization_Variation__c (API-created, resolved in personalization service)
 *   2. SF Personalization SDK decisions (Hero_Banner point)
 * No more hardcoded interest-based or campaign-theme-based variants.
 */
function getHeroVariant(customer?: CustomerProfile | null, isAuthenticated?: boolean, _campaign?: CampaignAttribution | null): HeroVariant {
  const tier = customer?.merkuryIdentity?.identityTier;
  const firstName = customer?.name?.split(' ')[0];

  // Authenticated known customer — personalized greeting
  if (isAuthenticated && tier === 'known' && firstName) {
    const loyaltyLine = customer?.loyalty
      ? `${customer.loyalty.tier.charAt(0).toUpperCase() + customer.loyalty.tier.slice(1)} Member · ${customer.loyalty.pointsBalance?.toLocaleString()} pts`
      : null;
    return {
      badge: 'For You',
      headlineTop: `Your Beauty Edit,`,
      headlineBottom: firstName,
      subtitle: loyaltyLine
        ? `Curated picks for you. ${loyaltyLine}.`
        : 'Curated skincare and beauty essentials, just for you.',
      heroImage: HERO_IMAGES.authenticated,
      imageAlt: 'Radiant glowing skin',
      source: 'authenticated' as const,
    };
  }

  // Everyone else: default. SF Personalization + custom variations override this.
  return {
    badge: 'New Season Collection',
    headlineTop: 'Discover Your',
    headlineBottom: 'Perfect Glow',
    subtitle: 'Curated skincare and beauty essentials, personalized to your unique needs.',
    heroImage: HERO_IMAGES.default,
    imageAlt: 'Luxurious spa treatment',
    source: 'default' as const,
  };
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopNow, customer, isAuthenticated }) => {
  const [sfpDecision, setSfpDecision] = useState<PersonalizationDecision | null>(null);
  const { campaign } = useCampaign();
  const navigate = useNavigate();
  const onBeautyAdvisor = useCallback(() => navigate('/advisor'), [navigate]);

  // Try SF Personalization campaign decision when customer changes.
  // Only adopt the decision if it carries at least one meaningful display field —
  // an empty-but-structurally-valid response (e.g. campaignId set, display fields blank)
  // should NOT override the local campaign/identity-driven variant.
  useEffect(() => {
    if (!isPersonalizationConfigured()) return;
    getHeroCampaignDecision().then((d) => {
      if (d && (d.badge || d.headlineTop || d.headlineBottom || d.subtitle)) {
        setSfpDecision(d);
      }
    });
  }, [customer]);

  // Priority: campaign/identity/appended variants (local) > SF Personalization > default.
  // SF Personalization only overrides when the local logic has no specific context
  // (i.e. source === 'default'). Campaign-driven and identity-driven variants are
  // more specific than a generic SF Personalization decision.
  const variant = useMemo(() => {
    const localVariant = getHeroVariant(customer, isAuthenticated, campaign);
    if (sfpDecision && localVariant.source === 'default') {
      return {
        ...localVariant,
        ...(sfpDecision.badge ? { badge: sfpDecision.badge } : {}),
        ...(sfpDecision.headlineTop ? { headlineTop: sfpDecision.headlineTop } : {}),
        ...(sfpDecision.headlineBottom ? { headlineBottom: sfpDecision.headlineBottom } : {}),
        ...(sfpDecision.subtitle ? { subtitle: sfpDecision.subtitle } : {}),
        heroImage: sfpDecision.heroImage || localVariant.heroImage,
        imageAlt: sfpDecision.imageAlt || localVariant.imageAlt,
      };
    }
    return localVariant;
  }, [sfpDecision, customer, isAuthenticated, campaign]);

  return (
    <section className="relative overflow-hidden bg-stone-50 min-h-[420px] lg:min-h-[520px]">
      {/* Full-width layout: image right, text left */}
      <div className="relative max-w-7xl mx-auto h-full">
        <div className="grid lg:grid-cols-5 items-stretch min-h-[420px] lg:min-h-[520px]">

          {/* Text content — 3 columns */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-3 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-10 lg:py-16 z-10"
          >
            <span className="inline-block self-start px-3 py-1 text-[11px] font-semibold tracking-widest uppercase text-stone-500 border border-stone-300 rounded-full mb-5">
              {variant.badge}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extralight text-stone-900 leading-[1.1] tracking-tight mb-2">
              {variant.headlineTop}
            </h1>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-medium text-stone-900 leading-[1.1] tracking-tight mb-6">
              {variant.headlineBottom}
            </h1>
            <p className="text-base text-stone-500 mb-8 max-w-md leading-relaxed">
              {variant.subtitle}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onShopNow}
                className="px-7 py-3 bg-stone-900 text-white text-sm font-medium tracking-wide rounded-full hover:bg-stone-800 transition-colors"
              >
                Shop Collection
              </button>
              <button
                onClick={onBeautyAdvisor}
                className="group px-7 py-3 text-stone-700 text-sm font-medium tracking-wide rounded-full border border-stone-300 hover:border-stone-900 hover:text-stone-900 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Beauty Advisor
              </button>
            </div>

            {/* Minimal trust strip */}
            <div className="flex items-center gap-5 mt-10 text-xs text-stone-400 tracking-wide">
              <span>50K+ Customers</span>
              <span className="text-stone-300">|</span>
              <span>4.9 Rating</span>
              <span className="text-stone-300">|</span>
              <span>Clean &amp; Cruelty-Free</span>
            </div>
          </motion.div>

          {/* Hero image — absolutely positioned, breaks out of column to the left */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="absolute top-0 bottom-0 right-0 hidden lg:block"
            style={{ width: '58%' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-stone-50/80 to-transparent z-[5] pointer-events-none" />
            <img
              src={variant.heroImage}
              alt={variant.imageAlt}
              className="w-full h-full object-cover object-[25%_15%] drop-shadow-md"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
