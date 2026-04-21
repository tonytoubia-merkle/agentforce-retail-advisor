import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { useDemo } from '@/contexts/DemoContext';

/**
 * "Unlock member pricing" — shown when an authenticated customer with a
 * cart over the threshold isn't yet enrolled in the loyalty program.
 *
 * Clicking enroll flips customer.loyalty on via the customer context's
 * enrollInLoyalty helper. The copy is brand-aware via useDemo.
 *
 * Feature flag: featureFlags.loyaltyEnrollPrompt.
 */
export const LoyaltyEnrollCard: React.FC<{ minimumSubtotal?: number }> = ({
  minimumSubtotal = 40,
}) => {
  const { subtotal } = useCart();
  const { customer, isAuthenticated, enrollInLoyalty } = useCustomer();
  const { config, copy } = useDemo();

  if (!config.featureFlags.loyaltyEnrollPrompt) return null;
  if (!isAuthenticated || !customer) return null;
  if (customer.loyalty) return null; // Already a member
  if (subtotal < minimumSubtotal) return null;

  // Estimate first-shop rewards — for demo clarity: 10% of subtotal in points,
  // plus a round-number welcome bonus.
  const pointsEarned = Math.floor(subtotal * 10);
  const welcomeBonus = 500;

  const handleEnroll = () => {
    const fn = enrollInLoyalty as (() => void) | undefined;
    if (typeof fn === 'function') {
      fn();
    }
  };

  const brandName = config.brandName || copy.advisorName;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 flex items-center gap-4 shadow-sm"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.14em] text-amber-700 mb-0.5">
          Unlock member pricing
        </div>
        <div className="text-sm font-medium text-stone-900">
          Join {brandName} Rewards — free, takes a second.
        </div>
        <div className="text-xs text-stone-600">
          Earn <span className="font-semibold text-stone-900">{pointsEarned.toLocaleString()}</span> points
          on this order + a <span className="font-semibold text-stone-900">{welcomeBonus}-point</span> welcome bonus.
        </div>
      </div>
      <button
        onClick={handleEnroll}
        className="px-4 py-2 text-white text-xs font-medium rounded-full hover:opacity-90 transition-opacity whitespace-nowrap bg-amber-600"
      >
        Join &amp; save
      </button>
    </motion.div>
  );
};
