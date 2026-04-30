import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useDemo } from '@/contexts/DemoContext';

interface UpgradeCandidate {
  itemIndex: number;
  productName: string;
  currentQty: number;
  currentLinePrice: number;
  upgradeLabel: string;
  upgradePrice: number;
  priceDelta: number;
  savingsPerUnit: number;
  rationale?: string;
}

/**
 * "Optimize your order" — single-click upgrade to a larger pack when a
 * cart line has product.attributes.bundleUpgrade seeded and the current
 * quantity meets the trigger threshold.
 *
 * Swaps the individual line for a new line representing the upgraded
 * product with quantity 1, preserving cart value logic via the existing
 * cart context (removeItem + addItem with synthetic upgraded product).
 *
 * Feature flag: featureFlags.cartOptimizer.
 */
export const BundleOptimizerCard: React.FC = () => {
  const { items, removeItem, addItem } = useCart();
  const { config } = useDemo();

  // Find the best upgrade candidate — the one with the highest per-unit
  // savings that's currently at or above the trigger quantity.
  const bestUpgrade = useMemo<UpgradeCandidate | null>(() => {
    let winner: UpgradeCandidate | null = null;

    items.forEach((item, idx) => {
      const upg = item.product.attributes?.bundleUpgrade;
      if (!upg) return;
      if (item.quantity < upg.replacesQuantity) return;

      const currentLinePrice = item.product.price * item.quantity;
      const upgradePrice = currentLinePrice + upg.priceDelta;
      // Per-unit savings assuming the upgrade covers replacesQuantity units
      // at the bigger pack's effective per-unit price
      const savingsPerUnit =
        (item.product.price * item.quantity - upgradePrice) / Math.max(upg.replacesQuantity, 1);

      const candidate: UpgradeCandidate = {
        itemIndex: idx,
        productName: item.product.name,
        currentQty: item.quantity,
        currentLinePrice,
        upgradeLabel: upg.label,
        upgradePrice,
        priceDelta: upg.priceDelta,
        savingsPerUnit: Math.max(0, -savingsPerUnit),
        rationale: upg.rationale,
      };
      if (!winner || candidate.savingsPerUnit > winner.savingsPerUnit) {
        winner = candidate;
      }
    });

    return winner;
  }, [items]);

  if (!config.featureFlags.cartOptimizer) return null;
  if (!bestUpgrade) return null;

  const handleUpgrade = () => {
    const original = items[bestUpgrade.itemIndex];
    if (!original) return;
    // Build a synthetic upgraded product — demo-legible, no backend round trip
    const upgradedProduct = {
      ...original.product,
      id: `${original.product.id}-bundle`,
      name: `${original.product.name} — ${bestUpgrade.upgradeLabel}`,
      price: bestUpgrade.upgradePrice,
      // Keep the same imagery + brand so the swap feels like the same product
    };
    removeItem(original.product.id);
    addItem(upgradedProduct, 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="mb-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4 flex items-center gap-4 shadow-sm"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8l-4 5m0 0l4 5h-8m-4-5H3m4 5v-5m-4 5h2m6-10a2 2 0 110 4 2 2 0 010-4z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.14em] text-emerald-700 mb-0.5">
          Optimize your order
        </div>
        <div className="text-sm font-medium text-stone-900">
          Swap {bestUpgrade.currentQty} × {bestUpgrade.productName} → {bestUpgrade.upgradeLabel}
        </div>
        <div className="text-xs text-stone-600">
          {bestUpgrade.rationale
            ? bestUpgrade.rationale
            : `Just +$${bestUpgrade.priceDelta.toFixed(2)} for the bigger pack`}
        </div>
      </div>
      <button
        onClick={handleUpgrade}
        className="px-4 py-2 text-white text-xs font-medium rounded-full hover:opacity-90 transition-opacity whitespace-nowrap bg-emerald-600"
      >
        Optimize (+${bestUpgrade.priceDelta.toFixed(2)})
      </button>
    </motion.div>
  );
};
