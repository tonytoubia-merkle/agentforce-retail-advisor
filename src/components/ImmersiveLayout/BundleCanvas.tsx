import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useDemo } from '@/contexts/DemoContext';
import { useSelection } from '@/contexts/SelectionContext';
import type { Product } from '@/types/product';

interface BundleCanvasProps {
  products: Product[];
  title: string;
  /** @deprecated Now rendered in BundleSummaryBar in the left pane. */
  whyYoullLoveIt?: string;
}

/** Short per-vertical subtitle (route, colors, benefits). Returns null for beauty. */
function getVerticalSubtitle(product: Product, vertical: string): string | null {
  const a = product.attributes || {};
  if (vertical === 'travel' && a.travel) {
    const route = [a.travel.origin, a.travel.destination].filter(Boolean).join(' → ');
    const duration = a.travel.durationMinutes
      ? `${Math.floor(a.travel.durationMinutes / 60)}h ${a.travel.durationMinutes % 60}m`
      : '';
    return [route, duration].filter(Boolean).join(' · ') || null;
  }
  if (vertical === 'fashion' && a.fashion?.color?.length) {
    return a.fashion.color.slice(0, 3).join(' · ');
  }
  if (vertical === 'wellness' && a.wellness?.benefits?.length) {
    return a.wellness.benefits.slice(0, 2).join(' · ');
  }
  return null;
}

/**
 * Editorial bundle canvas — large hero composed from individual product
 * images with numbered hotspots overlaid. Clicking a hotspot surfaces the
 * corresponding product card.
 *
 * The bundle summary (eyebrow, title, total, CTA) now lives in
 * BundleSummaryBar, which is anchored to the bottom of the LEFT chat pane.
 * This canvas is purely visual — full width, no right rail.
 *
 * Reference: Adobe Experience Concierge "bundle hotspot" pattern.
 */
export const BundleCanvas: React.FC<BundleCanvasProps> = ({ products }) => {
  const { addItem, isInCart } = useCart();
  const { config } = useDemo();
  const { activeProductId, setActiveProductId, toggleActiveProduct } = useSelection();

  const activeIdx = activeProductId ? products.findIndex((p) => p.id === activeProductId) : -1;
  const active = activeIdx >= 0 ? products[activeIdx] : null;
  const activeSubtitle = active ? getVerticalSubtitle(active, config.vertical) : null;

  // Deterministic hotspot positions — evenly spread across the canvas.
  const HOTSPOT_POSITIONS = [
    { top: '22%', left: '28%' },
    { top: '38%', left: '62%' },
    { top: '58%', left: '35%' },
    { top: '68%', left: '68%' },
    { top: '28%', left: '78%' },
    { top: '80%', left: '22%' },
  ];

  return (
    <div className="w-full h-full relative flex items-center justify-center p-12">
      {/* Soft editorial backdrop glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)',
        }}
      />

      {/* Product stage — each product floats in its allocated region */}
      <div className="relative w-full max-w-4xl aspect-[4/3]">
        {products.slice(0, 6).map((product, idx) => {
          const pos = HOTSPOT_POSITIONS[idx];
          const isActive = activeIdx === idx;
          return (
            <div key={product.id} className="absolute" style={pos}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: isActive ? 1.1 : 1,
                  filter: activeIdx >= 0 && !isActive ? 'blur(2px) opacity(0.5)' : 'none',
                }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="relative cursor-pointer"
                style={{ transform: 'translate(-50%, -50%)' }}
                onClick={() => toggleActiveProduct(product.id)}
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-2xl product-blend"
                />
                {/* Pulsing hotspot marker */}
                <div className="absolute -top-2 -right-2 flex items-center justify-center">
                  <span className="absolute w-8 h-8 rounded-full bg-white/30 animate-ping" />
                  <span className="relative w-7 h-7 rounded-full bg-white text-black text-sm font-semibold flex items-center justify-center shadow-lg">
                    {idx + 1}
                  </span>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Active product detail — slides in from bottom when a hotspot is clicked */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[32rem] max-w-[90%] bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 flex gap-4 shadow-2xl"
          >
            <img
              src={active.imageUrl}
              alt={active.name}
              className="w-20 h-20 object-contain flex-shrink-0 product-blend"
            />
            <div className="flex-1 text-white">
              <div className="text-[10px] uppercase tracking-widest text-white/50 mb-0.5">
                {active.brand}
              </div>
              <div className="font-medium text-sm leading-tight mb-1">{active.name}</div>
              {activeSubtitle && (
                <div className="text-[11px] text-white/60 mb-1">{activeSubtitle}</div>
              )}
              <div className="text-xs text-white/60 line-clamp-2 mb-2">
                {active.shortDescription || active.description}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">${active.price.toFixed(2)}</span>
                <button
                  onClick={() => addItem(active)}
                  disabled={isInCart(active.id)}
                  className="px-3 py-1 text-xs font-medium bg-white text-black rounded-full hover:bg-white/90 disabled:bg-white/30 disabled:text-white/50 transition-colors"
                >
                  {isInCart(active.id) ? 'In cart' : 'Add to cart'}
                </button>
              </div>
            </div>
            <button
              onClick={() => setActiveProductId(null)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-xs"
              aria-label="Close"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
