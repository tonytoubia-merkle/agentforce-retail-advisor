import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useDemo } from '@/contexts/DemoContext';
import type { Product } from '@/types/product';

interface BundleCanvasProps {
  products: Product[];
  title: string;
  whyYoullLoveIt?: string;
}

/**
 * Editorial bundle display — large hero photo composed from individual
 * product images, with numbered hotspots overlaid. Clicking a hotspot
 * surfaces the corresponding product card.
 *
 * Reference: Adobe Experience Concierge "bundle hotspot" pattern.
 */
export const BundleCanvas: React.FC<BundleCanvasProps> = ({ products, title, whyYoullLoveIt }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const { addItem, isInCart } = useCart();
  const { copy } = useDemo();

  const total = products.reduce((s, p) => s + p.price, 0);
  const active = activeIdx !== null ? products[activeIdx] : null;

  // Deterministic hotspot positions — evenly spread across the canvas
  // Positions chosen to feel editorial, not rigid grid. Up to 6 products.
  const HOTSPOT_POSITIONS = [
    { top: '22%', left: '28%' },
    { top: '38%', left: '62%' },
    { top: '58%', left: '35%' },
    { top: '68%', left: '68%' },
    { top: '28%', left: '78%' },
    { top: '80%', left: '22%' },
  ];

  return (
    <div className="w-full h-full flex items-stretch">
      {/* Bundle hero — floating product arrangement */}
      <div className="flex-1 relative p-12 flex items-center justify-center">
        {/* Soft editorial backdrop glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)',
          }}
        />

        {/* Product stage — each product floats in its allocated region */}
        <div className="relative w-full max-w-3xl aspect-[4/3]">
          {products.slice(0, 6).map((product, idx) => {
            const pos = HOTSPOT_POSITIONS[idx];
            const isActive = activeIdx === idx;
            return (
              <div key={product.id} className="absolute" style={pos}>
                {/* Product floating image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: isActive ? 1.1 : 1,
                    filter: activeIdx !== null && !isActive ? 'blur(2px) opacity(0.5)' : 'none',
                  }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                  className="relative cursor-pointer"
                  style={{ transform: 'translate(-50%, -50%)' }}
                  onClick={() => setActiveIdx(isActive ? null : idx)}
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
                onClick={() => setActiveIdx(null)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-xs"
                aria-label="Close"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right rail — bundle summary (editorial side panel) */}
      <div className="w-80 border-l border-white/10 bg-black/40 backdrop-blur-sm p-8 flex flex-col overflow-y-auto">
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
            Curated Bundle
          </div>
          <h2 className="text-white text-xl font-light leading-snug">{title}</h2>
        </div>

        {whyYoullLoveIt && (
          <div className="mb-6 pb-6 border-b border-white/10">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
              Why you'll love it
            </div>
            <p className="text-white/70 text-sm leading-relaxed">{whyYoullLoveIt}</p>
          </div>
        )}

        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-3">
            In this bundle
          </div>
          <ul className="space-y-3">
            {products.map((p, idx) => (
              <li
                key={p.id}
                className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  activeIdx === idx ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
                onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">{p.name}</div>
                  <div className="text-white/50 text-xs truncate">{p.brand}</div>
                </div>
                <span className="text-white/80 text-sm">${p.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/70 text-sm">Bundle total</span>
            <span className="text-white text-lg font-medium">${total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => products.forEach((p) => !isInCart(p.id) && addItem(p))}
            className="w-full py-3 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
          >
            {copy.primaryCTA === 'Shop Now' ? 'Add bundle to cart' : `${copy.primaryCTA} — all items`}
          </button>
        </div>
      </div>
    </div>
  );
};
