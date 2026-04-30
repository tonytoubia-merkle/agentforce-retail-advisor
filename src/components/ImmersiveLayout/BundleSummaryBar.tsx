import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useDemo } from '@/contexts/DemoContext';
import type { Product } from '@/types/product';

interface BundleSummaryBarProps {
  products: Product[];
  title: string;
  whyYoullLoveIt?: string;
}

/** Eyebrow label above the bundle title — vertical-aware. */
function bundleEyebrow(vertical: string): string {
  switch (vertical) {
    case 'travel':   return 'Trip Plan';
    case 'fashion':  return 'Curated Look';
    case 'wellness': return 'Routine';
    case 'cpg':      return 'Bundle';
    default:         return 'Curated Bundle';
  }
}

/**
 * Compact bundle summary bar for the left chat pane.
 *
 * Replaces the previous right-rail in BundleCanvas. Shows the bundle
 * eyebrow/title, total, and CTA — products are intentionally NOT listed
 * here because they already render as cards in the chat stream above.
 *
 * Collapsed: slim bar with title + total + CTA.
 * Expanded:  shows the optional "Why you'll love it" copy.
 */
export const BundleSummaryBar: React.FC<BundleSummaryBarProps> = ({ products, title, whyYoullLoveIt }) => {
  const [expanded, setExpanded] = useState(false);
  const { addItem, isInCart } = useCart();
  const { config } = useDemo();

  const total = products.reduce((s, p) => s + p.price, 0);
  const eyebrow = bundleEyebrow(config.vertical);
  const bundleCta =
    config.vertical === 'travel'
      ? 'Hold this itinerary'
      : config.vertical === 'fashion'
        ? 'Shop the full look'
        : config.vertical === 'wellness'
          ? 'Add full routine'
          : 'Add bundle to cart';

  // Whether all products are already in cart
  const allInCart = products.every((p) => isInCart(p.id));

  const addBundle = () => {
    products.forEach((p) => !isInCart(p.id) && addItem(p));
  };

  return (
    <div className="border-t border-white/10 bg-black/60 backdrop-blur-md">
      {/* Optional "Why you'll love it" — expandable */}
      <AnimatePresence initial={false}>
        {expanded && whyYoullLoveIt && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1">
              <div className="text-[9px] uppercase tracking-widest text-white/40 mb-1">
                Why you'll love it
              </div>
              <p className="text-white/70 text-[11px] leading-relaxed">{whyYoullLoveIt}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-3 flex items-center gap-3">
        {/* Title block (clickable to expand if there's a why) */}
        <button
          onClick={() => whyYoullLoveIt && setExpanded(!expanded)}
          className="flex-1 min-w-0 text-left"
          disabled={!whyYoullLoveIt}
        >
          <div className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">
            {eyebrow} · {products.length} items
          </div>
          <div className="text-white text-xs font-medium truncate leading-tight">
            {title}
          </div>
        </button>

        {/* Total */}
        <div className="flex-shrink-0 text-right">
          <div className="text-[9px] uppercase tracking-widest text-white/40">Total</div>
          <div className="text-white text-sm font-medium">${total.toFixed(2)}</div>
        </div>

        {/* CTA */}
        <button
          onClick={addBundle}
          disabled={allInCart}
          className="flex-shrink-0 px-4 py-2 bg-white text-black rounded-full text-xs font-medium hover:bg-white/90 disabled:bg-white/30 disabled:text-white/50 transition-colors"
        >
          {allInCart ? 'In cart' : bundleCta}
        </button>
      </div>
    </div>
  );
};
