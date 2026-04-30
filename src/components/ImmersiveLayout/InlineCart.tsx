import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useScene } from '@/contexts/SceneContext';
import { useDemo } from '@/contexts/DemoContext';

/**
 * Inline cart drawer anchored to the bottom of the left chat pane.
 *
 * Collapsed state: single bar with item count + subtotal + "Start checkout".
 * Expanded state: itemized list with quantity controls.
 *
 * Reference: Adobe Experience Concierge "Order Summary" inline pattern —
 * cart stays embedded in the advisor experience rather than living on a
 * separate page.
 */
export const InlineCart: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const { items, itemCount, subtotal, removeItem, updateQuantity } = useCart();
  const { openCheckout } = useScene();
  const { copy } = useDemo();

  if (items.length === 0) return null;

  return (
    <div className="border-t border-white/10 bg-black/60 backdrop-blur-md">
      {/* Expanded item list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-3">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-12 h-12 object-contain flex-shrink-0 product-blend"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">
                      {item.product.name}
                    </div>
                    <div className="text-white/50 text-[10px] truncate">{item.product.brand}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs flex items-center justify-center"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="text-white text-xs w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs flex items-center justify-center"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-white text-xs font-medium">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-white/40 hover:text-white/70 text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary bar */}
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          aria-label={expanded ? 'Collapse cart' : 'Expand cart'}
        >
          <div className="relative flex-shrink-0 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black text-[10px] font-semibold flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium">Order summary</div>
            <div className="text-white/50 text-[10px]">
              {itemCount} {itemCount === 1 ? copy.itemNoun : copy.itemNounPlural} · $
              {subtotal.toFixed(2)}
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-white/60 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <button
          onClick={openCheckout}
          className="px-4 py-2 bg-white text-black rounded-full text-xs font-medium hover:bg-white/90 transition-colors whitespace-nowrap"
        >
          Start Checkout
        </button>
      </div>
    </div>
  );
};
