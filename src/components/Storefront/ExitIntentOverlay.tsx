import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExitIntent } from '@/hooks/useExitIntent';
import { useCampaign } from '@/contexts/CampaignContext';
import { useDemo } from '@/contexts/DemoContext';
import { getUtmFromDataLayer } from '@/services/merkury/dataLayer';
import {
  isPersonalizationConfigured,
  getExitIntentDecision,
  trackPersonalizationEngagement,
} from '@/services/personalization';
import type { ExitIntentDecision } from '@/services/personalization';
import type { CampaignAttribution } from '@/types/campaign';

const FALLBACK_DECISION: ExitIntentDecision = {
  headline: "Wait — here's a small something",
  bodyText: "Take 10% off your first order when you buy today.",
  discountCode: 'WELCOME10',
  discountPercent: 10,
  ctaText: 'Claim My Discount',
};

/** UTM source → exit intent decision map. Kept vertical-neutral so travel /
 *  fashion / wellness / CPG demos don't see "beauty inspo" copy. The CTA
 *  button label uses generic action verbs ("Complete the Purchase") so it
 *  reads right regardless of what's being sold. */
const SOURCE_DECISIONS: Record<string, ExitIntentDecision> = {
  instagram: {
    headline: "Saw us on Instagram?",
    bodyText: "15% off what you came here to see — today only.",
    discountCode: 'INSTA15',
    discountPercent: 15,
    ctaText: 'Use My Discount',
  },
  tiktok: {
    headline: "The one TikTok sent you to.",
    bodyText: "15% off the arrival that earned the algorithm's attention.",
    discountCode: 'TIKTOK15',
    discountPercent: 15,
    ctaText: 'Use My Discount',
  },
  google: {
    headline: "Found what you were looking for?",
    bodyText: "Finish the search with 10% off your first order.",
    discountCode: 'SEARCH10',
    discountPercent: 10,
    ctaText: 'Claim My Discount',
  },
  youtube: {
    headline: "Seen us on YouTube?",
    bodyText: "15% off the pick your favorite creator recommended.",
    discountCode: 'YOUTUBE15',
    discountPercent: 15,
    ctaText: 'Claim the Offer',
  },
  pinterest: {
    headline: "From your board, to your door.",
    bodyText: "What you pinned is 10% off right now.",
    discountCode: 'PIN10',
    discountPercent: 10,
    ctaText: 'Redeem 10% Off',
  },
  hulu: {
    headline: "Back from the break?",
    bodyText: "15% off what our Hulu spot was pointing you toward.",
    discountCode: 'STREAM15',
    discountPercent: 15,
    ctaText: 'Claim 15% Off',
  },
  email: {
    headline: "Welcome back.",
    bodyText: "As a subscriber, 20% off your next order — just this once.",
    discountCode: 'VIP20',
    discountPercent: 20,
    ctaText: 'Redeem My Offer',
  },
};

/**
 * Resolve an exit intent decision based on UTM source.
 * Priority: campaign context (React state) → window.dataLayer (pre-React) → generic fallback.
 */
function getUtmSourceDecision(campaign: CampaignAttribution | null): ExitIntentDecision {
  const source = campaign?.adCreative?.utmParams?.utm_source
    || getUtmFromDataLayer()?.source
    || '';
  return SOURCE_DECISIONS[source.toLowerCase()] || FALLBACK_DECISION;
}

export const ExitIntentOverlay: React.FC = () => {
  const { triggered, dismiss } = useExitIntent();
  const { campaign } = useCampaign();
  const { copy } = useDemo();
  const [decision, setDecision] = useState<ExitIntentDecision | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch personalization decision when exit intent triggers
  // Priority: SF Personalization → UTM source mock → generic fallback
  useEffect(() => {
    if (!triggered) return;

    let cancelled = false;

    async function fetchDecision() {
      setLoading(true);
      try {
        if (isPersonalizationConfigured()) {
          const sfpDecision = await getExitIntentDecision();
          if (!cancelled && sfpDecision?.headline) {
            setDecision(sfpDecision);
            trackPersonalizationEngagement(
              sfpDecision.personalizationId,
              sfpDecision.personalizationContentId,
            );
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fall through to UTM source fallback
      }
      if (!cancelled) {
        setDecision(getUtmSourceDecision(campaign));
        setLoading(false);
      }
    }

    fetchDecision();
    return () => { cancelled = true; };
  }, [triggered, campaign]);

  const handleCopyCode = useCallback(() => {
    if (!decision?.discountCode) return;
    navigator.clipboard.writeText(decision.discountCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [decision?.discountCode]);

  const handleClaim = useCallback(() => {
    if (decision?.discountCode) {
      navigator.clipboard.writeText(decision.discountCode);
    }
    dismiss();
  }, [decision?.discountCode, dismiss]);

  return (
    <AnimatePresence>
      {triggered && decision && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={decision.backgroundColor ? { backgroundColor: decision.backgroundColor } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background image from SF Personalization */}
            {decision.imageUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: `url(${decision.imageUrl})` }}
              />
            )}

            {/* Top gradient accent */}
            <div className="h-1.5 bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400" />

            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 transition-colors text-stone-500 hover:text-stone-700"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="px-8 pt-8 pb-6 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                Exclusive Offer
              </div>

              {/* Headline */}
              <h2 className="text-2xl font-semibold text-stone-900 mb-3">
                {decision.headline}
              </h2>

              {/* Body text */}
              <p className="text-stone-600 mb-6 leading-relaxed">
                {decision.bodyText}
              </p>

              {/* Discount code */}
              {decision.discountCode && (
                <div className="mb-6">
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Your code</p>
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-stone-50 border-2 border-dashed border-stone-300 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-colors group"
                  >
                    <span className="text-xl font-bold tracking-widest text-stone-900 group-hover:text-rose-700">
                      {decision.discountCode}
                    </span>
                    <svg className="w-4 h-4 text-stone-400 group-hover:text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {copied && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-green-600 mt-2"
                    >
                      Copied to clipboard!
                    </motion.p>
                  )}
                </div>
              )}

              {/* CTA button */}
              <button
                onClick={handleClaim}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 transition-all"
              >
                {decision.ctaText}
              </button>

              {/* No thanks link */}
              <button
                onClick={dismiss}
                className="mt-3 text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                No thanks, I'll pass
              </button>
            </div>

            {/* Bottom brand line — vertical-aware */}
            <div className="px-8 py-3 bg-stone-50 border-t border-stone-100 text-center">
              <p className="text-xs text-stone-400">
                {copy.exitIntentBrandLine}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
