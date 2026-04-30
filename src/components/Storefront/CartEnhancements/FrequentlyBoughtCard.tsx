import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { useDemo } from '@/contexts/DemoContext';
import { useProducts } from '@/contexts/ProductContext';
import type { Product } from '@/types/product';

/**
 * "You usually buy X — add it?" prompt for authenticated customers with
 * a purchase history. Surfaces the most frequently purchased product that
 * isn't already in the cart. Reads from customer.orders[].lineItems, so
 * seeded demo personas with historical orders light this up immediately.
 *
 * Feature flag: featureFlags.frequentlyBoughtReminder.
 */
export const FrequentlyBoughtCard: React.FC = () => {
  const { items, addItem, isInCart } = useCart();
  const { customer, isAuthenticated } = useCustomer();
  const { products } = useProducts();
  const { config } = useDemo();

  const suggestion = useMemo<Product | null>(() => {
    if (!isAuthenticated || !customer?.orders?.length) return null;

    // Count purchases by productId across all past orders
    const counts = new Map<string, number>();
    for (const order of customer.orders) {
      for (const li of order.lineItems || []) {
        const prev = counts.get(li.productId) || 0;
        counts.set(li.productId, prev + (li.quantity || 1));
      }
    }

    // Rank by purchase frequency, excluding anything already in the cart
    const inCartIds = new Set(items.map((i) => i.product.id));
    const ranked = Array.from(counts.entries())
      .filter(([id]) => !inCartIds.has(id))
      .sort((a, b) => b[1] - a[1]);

    for (const [id] of ranked) {
      const product = products.find((p) => p.id === id);
      if (product) return product;
    }
    return null;
  }, [customer, items, products, isAuthenticated]);

  if (!config.featureFlags.frequentlyBoughtReminder) return null;
  if (!suggestion || isInCart(suggestion.id)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-4 rounded-xl border border-stone-200 bg-white p-4 flex items-center gap-4 shadow-sm"
    >
      {suggestion.imageUrl && (
        <img
          src={suggestion.imageUrl}
          alt={suggestion.name}
          className="w-14 h-14 object-contain flex-shrink-0 rounded-lg bg-stone-50"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.14em] text-stone-500 mb-0.5">
          You usually reorder
        </div>
        <div className="text-sm font-medium text-stone-900 truncate">{suggestion.name}</div>
        <div className="text-xs text-stone-500">
          ${suggestion.price.toFixed(2)} · based on your last orders
        </div>
      </div>
      <button
        onClick={() => addItem(suggestion, 1)}
        className="px-4 py-2 text-white text-xs font-medium rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
        style={{ backgroundColor: config.theme.primaryColor }}
      >
        Add to cart
      </button>
    </motion.div>
  );
};
