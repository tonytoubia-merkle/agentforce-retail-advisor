import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { CustomerProfile } from '@/types/customer';
import type { CampaignAttribution } from '@/types/campaign';
import { useCampaign } from '@/contexts/CampaignContext';
import { useDemo } from '@/contexts/DemoContext';
import { displayFontStack, type VerticalCopy } from '@/config/verticalCopy';
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
  source: 'campaign' | 'authenticated' | 'appended' | 'default';
}

/** Variant resolution — authenticated greeting vs. vertical default. */
function getHeroVariant(
  copy: VerticalCopy,
  customer?: CustomerProfile | null,
  isAuthenticated?: boolean,
  _campaign?: CampaignAttribution | null,
): HeroVariant {
  const tier = customer?.merkuryIdentity?.identityTier;
  const firstName = customer?.name?.split(' ')[0];

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

/**
 * Editorial fallback panel that renders when `heroImage` is empty.
 * Replaces the generic "letter watermark on a flat gradient" with a
 * layered composition: soft geometric panels, diffused accent blobs,
 * subtle grain, and a vertical editorial mark (e.g. "Voyage 014").
 */
const EditorialFallback: React.FC<{
  primary: string;
  accent: string;
  editorialMark: string;
  brandLetter: string;
  displayFontFamily: string;
  imageAlt: string;
}> = ({ primary, accent, editorialMark, brandLetter, displayFontFamily, imageAlt }) => {
  return (
    <div
      className="w-full h-full relative overflow-hidden"
      aria-label={imageAlt}
      style={{ background: primary }}
    >
      {/* Deep layered gradient base — warm→cool diagonal */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 80% 10%, ${accent}55 0%, transparent 50%),
                       radial-gradient(100% 70% at 20% 90%, ${primary} 0%, transparent 60%),
                       linear-gradient(135deg, ${primary} 0%, ${primary}dd 45%, ${accent}22 100%)`,
        }}
      />

      {/* Diffused accent blob — slow drift */}
      <motion.div
        initial={{ x: 40, y: -20, opacity: 0.35 }}
        animate={{ x: 0, y: 0, opacity: 0.5 }}
        transition={{ duration: 2.4, ease: 'easeOut' }}
        className="absolute top-[18%] right-[12%] w-[44%] h-[44%] rounded-full blur-[64px]"
        style={{ background: accent }}
      />
      <motion.div
        initial={{ x: -20, y: 30, opacity: 0.2 }}
        animate={{ x: 0, y: 0, opacity: 0.3 }}
        transition={{ duration: 2.8, ease: 'easeOut' }}
        className="absolute bottom-[14%] left-[8%] w-[36%] h-[36%] rounded-full blur-[72px]"
        style={{ background: primary }}
      />

      {/* Offset rectangle pane — editorial structure */}
      <div
        className="absolute top-[14%] left-[12%] right-[18%] bottom-[16%] border backdrop-blur-[2px]"
        style={{
          borderColor: `${accent}66`,
          background: `linear-gradient(180deg, transparent 0%, ${primary}22 100%)`,
        }}
      />

      {/* Vertical editorial mark — sits on the left edge of the pane */}
      <div
        className="absolute left-[14%] top-1/2 -translate-y-1/2 text-white/70 text-[10px] font-medium uppercase"
        style={{
          writingMode: 'vertical-rl',
          letterSpacing: '0.3em',
        }}
      >
        {editorialMark}
      </div>

      {/* Oversized brand letter — restrained typography treatment */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-white/10 font-light select-none leading-none"
          style={{
            fontFamily: displayFontFamily,
            fontSize: 'clamp(12rem, 22vw, 20rem)',
          }}
        >
          {brandLetter}
        </span>
      </div>

      {/* Hairline crosshair — barely-there decorative rule */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-[14%] right-[20%] h-px"
          style={{ background: `${accent}33` }}
        />
      </div>

      {/* Fine grain overlay — adds depth, disguises banding */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
};

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopNow, customer, isAuthenticated }) => {
  const [sfpDecision, setSfpDecision] = useState<PersonalizationDecision | null>(null);
  const { campaign } = useCampaign();
  const { config, copy } = useDemo();
  const navigate = useNavigate();
  const onAdvisor = useCallback(() => navigate('/advisor'), [navigate]);

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

  const useImageFallback = !variant.heroImage;
  const primaryColor = config.theme.primaryColor;
  const accentColor = config.theme.accentColor;
  const displayFamily = displayFontStack(copy.hero.displayFont);
  const brandLetter = (config.brandName || '')[0]?.toUpperCase() || '';

  // Shared spring-ease for staggered entrance
  const revealTransition = (delay: number) => ({
    duration: 0.9,
    delay,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  });

  return (
    <section className="relative overflow-hidden bg-stone-50 min-h-[460px] lg:min-h-[560px]">
      <div className="relative max-w-7xl mx-auto h-full">
        <div className="grid lg:grid-cols-5 items-stretch min-h-[460px] lg:min-h-[560px]">

          {/* ── Text content ────────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 lg:py-20 z-10 relative">
            {/* Editorial mark — subtle vertical slug on the left edge */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={revealTransition(0.05)}
              className="hidden lg:block absolute left-6 top-16 bottom-16 text-[9px] font-medium text-stone-400 uppercase"
              style={{ writingMode: 'vertical-rl', letterSpacing: '0.35em' }}
            >
              {copy.hero.editorialMark}
            </motion.span>

            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.1)}
              className="inline-block self-start px-3 py-1 text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-600 border border-stone-300 rounded-full mb-6"
            >
              {variant.badge}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.2)}
              className="text-[2.75rem] sm:text-5xl lg:text-[3.75rem] text-stone-900 leading-[1.05] tracking-tight mb-0"
              style={{
                fontFamily: displayFamily,
                fontWeight: 300,
                fontStyle: copy.hero.displayFont !== 'sans' ? 'italic' : 'normal',
              }}
            >
              {variant.headlineTop}
            </motion.h1>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.32)}
              className="text-[2.75rem] sm:text-5xl lg:text-[3.75rem] text-stone-900 leading-[1.05] tracking-tight mb-6"
              style={{
                fontFamily: displayFamily,
                fontWeight: 500,
              }}
            >
              {variant.headlineBottom}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.48)}
              className="text-base text-stone-500 mb-10 max-w-md leading-[1.6]"
            >
              {variant.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={revealTransition(0.62)}
              className="flex flex-wrap gap-3"
            >
              <button
                onClick={onShopNow}
                className="px-8 py-3 text-white text-sm font-medium tracking-wide rounded-full hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                {copy.hero.primaryCTA}
              </button>
              <button
                onClick={onAdvisor}
                className="group px-7 py-3 text-stone-700 text-sm font-medium tracking-wide rounded-full border border-stone-300 transition-colors flex items-center gap-2"
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
              >
                <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {copy.advisorName}
              </button>
            </motion.div>

            {/* Trust strip — separator char drawn from verticalCopy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={revealTransition(0.78)}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-12 text-[11px] text-stone-400 tracking-[0.12em] uppercase"
            >
              <span>{copy.hero.trustPills[0]}</span>
              <span className="text-stone-300" aria-hidden>{copy.hero.trustSeparator}</span>
              <span>{copy.hero.trustPills[1]}</span>
              <span className="text-stone-300" aria-hidden>{copy.hero.trustSeparator}</span>
              <span>{copy.hero.trustPills[2]}</span>
            </motion.div>
          </div>

          {/* ── Hero image or editorial fallback ───────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 bottom-0 right-0 hidden lg:block"
            style={{ width: '58%' }}
          >
            {/* Soft edge blend between text + image */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-stone-50/90 to-transparent z-[5] pointer-events-none" />
            {useImageFallback ? (
              <EditorialFallback
                primary={primaryColor}
                accent={accentColor}
                editorialMark={copy.hero.editorialMark}
                brandLetter={brandLetter}
                displayFontFamily={displayFamily}
                imageAlt={variant.imageAlt}
              />
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
