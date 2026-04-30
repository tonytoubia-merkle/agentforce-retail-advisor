import { motion } from 'framer-motion';
import { useSelection } from '@/contexts/SelectionContext';
import { useDemo } from '@/contexts/DemoContext';
import type { Product } from '@/types/product';

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

interface ChatProductListProps {
  products: Product[];
}

/**
 * Compact text-only product list for the chat pane.
 *
 * Replaces the previous large product cards (ProductShowcase) inside
 * the chat. Products are now visually shown in the right canvas pane;
 * this list mirrors them as numbered rows that select bidirectionally
 * with the canvas hotspots/cards.
 *
 * Each row: number badge + name + subtitle + price. Click toggles
 * active selection — which highlights the corresponding hotspot/card
 * in the canvas.
 */
export const ChatProductList: React.FC<ChatProductListProps> = ({ products }) => {
  const { activeProductId, toggleActiveProduct } = useSelection();
  const { config } = useDemo();

  return (
    <motion.ul
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mr-auto max-w-[90%] mt-2 mb-2 space-y-1 bg-black/30 backdrop-blur-sm rounded-2xl rounded-bl-md p-2 border border-white/5"
    >
      {products.map((product, idx) => {
        const isActive = activeProductId === product.id;
        const subtitle = getVerticalSubtitle(product, config.vertical);
        return (
          <li key={product.id}>
            <button
              onClick={() => toggleActiveProduct(product.id)}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-white/10 ring-1 ring-white/30'
                  : 'hover:bg-white/5'
              }`}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center transition-colors ${
                  isActive ? 'bg-white text-black' : 'bg-white/15 text-white/80'
                }`}
              >
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-white text-[12px] font-medium truncate leading-tight">
                  {product.name}
                </div>
                {subtitle && (
                  <div className="text-white/45 text-[10px] truncate">{subtitle}</div>
                )}
              </div>
              <span className="text-white/70 text-[11px] tabular-nums flex-shrink-0">
                ${product.price.toFixed(2)}
              </span>
            </button>
          </li>
        );
      })}
    </motion.ul>
  );
};
