import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { CustomerProfile } from '@/types/customer';
import type { CampaignAttribution } from '@/types/campaign';
import { useCampaign } from '@/contexts/CampaignContext';
import { useDemo } from '@/contexts/DemoContext';
import type { VerticalCopy } from '@/config/verticalCopy';
import { isPersonalizationConfigured, getHeroCampaignDecision, type PersonalizationDecision } from '@/services/personalization';

interface HeroBannerProps {
  onShopNow: () => void;
  customer?: CustomerProfile | null;
  isAuthenticated?: boolean;
}

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
 * Variant resolution — only authenticated greeting + generic default.
 * All copy comes from verticalCopy.hero so travel / fashion / wellness /
 * cpg demos render their own headlines instead of beauty defaults.
 * All campaign/segment/interest personalization is driven by:
 *   1. Personalization_Variation__c (API-created, resolved in personalization service)
 *   2. SF Personalization SDK decisions (Hero_Banner point)
 */
function getHeroVariant(
  copy: VerticalCopy,
  customer?: CustomerProfile | null,
  isAuthenticated?: boolean,
  _campaign?: CampaignAttribution | null,
): HeroVariant {
  const tier = customer?.merkuryIdentity?.identityTier;
  const firstName = customer?.name?.split(' ')[0];

  // Authenticated known customer — personalized greeting
  if (isAuthenticated && tier === 'known' && firstName) {
    const loyaltyLine = customer?.loyalty
      ? `${customer.loyalty.tier.charAt(0).toUpperCase() + customer.loyalty.tier.slice(1)} Member · ${customer.loyalty.pointsBalance?.toLocaleString()} pts`
      : null;
    return {
      badge: 'For You',
      headlineTop: copy.hero.authenticatedHeadlineTop,
      headlineBottom: firstName,
      subtitle: loyaltyLine
        ? `${copy.hero.authenticatedSubtitle.replace(/\.$/, '')}. ${loyaltyLine}.`
        : copy.hero.authenticatedSubtitle,
      heroImage: copy.hero.heroImage,
      imageAlt: copy.hero.imageAlt,
      source: 'authenticated' as const,
    };
  }

  // Everyone else: vertical default. SF Personalization + custom variations override.
  return {
    badge: copy.hero.badge,
    headlineTop: copy.hero.headlineTop,
    headlineBottom: copy.hero.headlineBottom,
    subtitle: copy.hero.subtitle,
    heroImage: copy.hero.heroImage,
    imageAlt: copy.hero.imageAlt,
    source: 'default' as const,
  };
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopNow, customer, isAuthenticated }) => {
  const [sfpDecision, setSfpDecision] = useState<PersonalizationDecision | null>(null);
  const { campaign } = useCampaign();
  const { config, copy } = useDemo();
  const navigate = useNavigate();
  const onAdvisor = useCallback(() => navigate('/advisor'), [navigate]);

  // SF Personalization hero decision — only adopt when it carries meaningful display fields.
  useEffect(() => {
    if (!isPersonalizationConfigured()) return;
    getHeroCampaignDecision().then((d) => {
      if (d && (d.badge || d.headlineTop || d.headlineBottom || d.subtitle)) {
        setSfpDecision(d);
      }
    });
  }, [customer]);

  const variant = useMemo(() => {
    const localVariant = getHeroVariant(copy, customer, isAuthenticated, campaign);
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
  }, [sfpDecision, copy, customer, isAuthenticated, campaign]);

  // When verticalCopy.hero.heroImage is empty, render a branded gradient using
  // the demo's theme primary/accent colors instead of a beauty stock photo.
  const useImageFallback = !variant.heroImage;
  const primaryColor = config.theme.primaryColor;
  const accentColor = config.theme.accentColor;

  return (
    <section className="relative overflow-hidden bg-stone-50 min-h-[420px] lg:min-h-[520px]">
      <div className="relative max-w-7xl mx-auto h-full">
        <div className="grid lg:grid-cols-5 items-stretch min-h-[420px] lg:min-h-[520px]">

          {/* Text content */}
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
                className="px-7 py-3 text-white text-sm font-medium tracking-wide rounded-full hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                {copy.hero.primaryCTA}
              </button>
              <button
                onClick={onAdvisor}
                className="group px-7 py-3 text-stone-700 text-sm font-medium tracking-wide rounded-full border border-stone-300 hover:text-stone-900 transition-all flex items-center gap-2"
                style={{ borderColor: undefined }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
              >
                <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {copy.advisorName}
              </button>
            </div>

            {/* Trust strip — vertical-aware */}
            <div className="flex items-center gap-5 mt-10 text-xs text-stone-400 tracking-wide">
              <span>{copy.hero.trustPills[0]}</span>
              <span className="text-stone-300">|</span>
              <span>{copy.hero.trustPills[1]}</span>
              <span className="text-stone-300">|</span>
              <span>{copy.hero.trustPills[2]}</span>
            </div>
          </motion.div>

          {/* Hero image or brand-gradient fallback */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="absolute top-0 bottom-0 right-0 hidden lg:block"
            style={{ width: '58%' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-stone-50/80 to-transparent z-[5] pointer-events-none" />
            {useImageFallback ? (
              <div
                className="w-full h-full relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
                }}
                aria-label={variant.imageAlt}
              >
                {/* Soft editorial glow blobs for depth */}
                <div
                  className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-30 blur-3xl"
                  style={{ background: accentColor }}
                />
                <div
                  className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full opacity-20 blur-3xl"
                  style={{ background: primaryColor }}
                />
                {/* Large brand mark watermark */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white/10 font-extralight tracking-tight text-[10rem] leading-none select-none">
                    {(config.brandName || '')[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <img
                src={variant.heroImage}
                alt={variant.imageAlt}
                className="w-full h-full object-cover object-[25%_15%] drop-shadow-md"
              />
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
