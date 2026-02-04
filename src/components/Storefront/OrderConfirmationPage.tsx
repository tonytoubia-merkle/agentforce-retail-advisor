import { motion } from 'framer-motion';
import { useStore } from '@/contexts/StoreContext';
import { useCustomer } from '@/contexts/CustomerContext';

interface OrderConfirmationPageProps {
  onBeautyAdvisor: () => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ onBeautyAdvisor }) => {
  const { lastOrderId, navigateHome } = useStore();
  const { customer } = useCustomer();

  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(
    'en-US',
    { weekday: 'long', month: 'long', day: 'numeric' }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-rose-50 flex items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full mx-4"
      >
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center"
          >
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-2xl font-semibold text-stone-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-stone-600 mb-6">
              Thank you{customer?.name ? `, ${customer.name.split(' ')[0]}` : ''}! Your order has been placed.
            </p>

            {/* Order details */}
            <div className="bg-stone-50 rounded-2xl p-4 mb-6 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-stone-500">Order Number</span>
                <span className="text-sm font-medium text-stone-900">{lastOrderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-500">Estimated Delivery</span>
                <span className="text-sm font-medium text-stone-900">{estimatedDelivery}</span>
              </div>
            </div>

            {/* Confirmation email note */}
            <p className="text-sm text-stone-500 mb-8">
              A confirmation email has been sent to {customer?.email || 'your email address'}.
            </p>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={navigateHome}
                className="w-full px-6 py-3 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors"
              >
                Continue Shopping
              </button>

              <button
                onClick={onBeautyAdvisor}
                className="w-full px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-500 text-white font-medium rounded-full hover:shadow-lg hover:shadow-rose-500/25 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Get personalized tips
              </button>
            </div>
          </motion.div>
        </div>

        {/* Loyalty points earned (if applicable) */}
        {customer?.loyalty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 text-center"
          >
            <p className="text-sm text-amber-800">
              <span className="font-semibold">+50 points</span> added to your{' '}
              <span className="capitalize">{customer.loyalty.tier}</span> rewards account!
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
