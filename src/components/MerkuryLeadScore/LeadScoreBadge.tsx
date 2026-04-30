import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomer } from '@/contexts/CustomerContext';
import { useCart } from '@/contexts/CartContext';
import { useDemo } from '@/contexts/DemoContext';
import { computeLeadScore, leadScoreColor } from '@/lib/leadScore';

/**
 * Floating "Merkury Lead Score" badge in the corner of the storefront +
 * advisor. Opt-in per demo via featureFlags.leadScoreCard. Meant as a
 * demo-legible representation of everything Merkury + 1P + 3P + behavior
 * adds up to in real time — the reader can hover it for the tooltip
 * that lists every contributing signal.
 *
 * The badge is visually opinionated (dark, editorial) but small enough
 * to stay out of the storefront's way. On a CPG demo step where the
 * voiceover says "scores her as a high-value prospect with a lead score
 * of 80", this is the UI element you point the camera at.
 */
export const LeadScoreBadge: React.FC = () => {
  const { customer, isAuthenticated } = useCustomer();
  const { subtotal, itemCount } = useCart();
  const { config } = useDemo();
  const [expanded, setExpanded] = useState(false);

  // All hooks must run before any conditional return — compute unconditionally
  // and gate visibility with the flag at render time.
  const breakdown = useMemo(
    () => computeLeadScore({ customer, isAuthenticated, cartSubtotal: subtotal, cartItemCount: itemCount }),
    [customer, isAuthenticated, subtotal, itemCount],
  );

  if (!config.featureFlags.leadScoreCard) return null;

  const color = leadScoreColor(breakdown.band);
  const bandLabel = breakdown.band.replace('-', ' ');

  return (
    <div
      className="fixed right-4 bottom-4 z-40 select-none"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-3 pl-3 pr-4 py-2.5 bg-stone-900/95 backdrop-blur-sm text-white rounded-full shadow-lg border border-white/10 hover:border-white/20 transition-colors"
        aria-label="Merkury lead score"
      >
        <span
          className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold"
          style={{ backgroundColor: color, color: '#0a0a0a' }}
        >
          {breakdown.score}
        </span>
        <span className="flex flex-col text-left leading-tight">
          <span className="text-[9px] uppercase tracking-[0.15em] text-white/50">
            Merkury Lead Score
          </span>
          <span className="text-[11px] font-medium capitalize" style={{ color }}>
            {bandLabel}
          </span>
        </span>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 bottom-[calc(100%+8px)] w-80 bg-stone-900/95 backdrop-blur-sm text-white rounded-xl shadow-xl border border-white/10 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                Signal breakdown
              </span>
              <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color }}>
                {bandLabel}
              </span>
            </div>

            {breakdown.contributors.length === 0 ? (
              <p className="text-xs text-white/60">
                No signals yet. This score rises as Merkury resolves identity, loyalty, and purchase behaviour.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {breakdown.contributors.map((c) => (
                  <li key={c.label} className="flex items-center justify-between text-xs">
                    <span className="text-white/80">{c.label}</span>
                    <span className="text-white/60 tabular-nums">+{c.delta}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                Resolved by
              </span>
              <span className="text-[10px] text-white/60">Merkury · Data Cloud · 1P behavior</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
