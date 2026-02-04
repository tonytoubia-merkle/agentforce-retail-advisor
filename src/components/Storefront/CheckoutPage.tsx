import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { useCustomer } from '@/contexts/CustomerContext';

export const CheckoutPage: React.FC = () => {
  const { navigateToOrderConfirmation, goBack } = useStore();
  const { items, subtotal, clearCart } = useCart();
  const { customer } = useCustomer();

  const [step, setStep] = useState<'info' | 'shipping' | 'payment' | 'processing'>('info');
  const [formData, setFormData] = useState({
    email: customer?.email || '',
    firstName: customer?.name?.split(' ')[0] || '',
    lastName: customer?.name?.split(' ').slice(1).join(' ') || '',
    address: customer?.shippingAddresses?.[0]?.line1 || '',
    city: customer?.shippingAddresses?.[0]?.city || '',
    state: customer?.shippingAddresses?.[0]?.state || '',
    zip: customer?.shippingAddresses?.[0]?.postalCode || '',
    cardNumber: customer?.savedPaymentMethods?.[0] ? `•••• •••• •••• ${customer.savedPaymentMethods[0].last4}` : '',
    expiry: '',
    cvv: '',
  });

  const shipping = subtotal >= 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'info') {
      setStep('shipping');
    } else if (step === 'shipping') {
      setStep('payment');
    } else if (step === 'payment') {
      setStep('processing');
      // Simulate processing
      setTimeout(() => {
        const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
        clearCart();
        navigateToOrderConfirmation(orderId);
      }, 2000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (items.length === 0 && step !== 'processing') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500">Your cart is empty.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Cart
          </button>
          <h1 className="text-2xl font-medium text-stone-900">Checkout</h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {['info', 'shipping', 'payment'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-stone-900 text-white'
                    : ['info', 'shipping', 'payment'].indexOf(step) > i
                      ? 'bg-rose-500 text-white'
                      : 'bg-stone-200 text-stone-500'
                }`}
              >
                {['info', 'shipping', 'payment'].indexOf(step) > i ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div
                  className={`w-16 h-0.5 mx-2 ${
                    ['info', 'shipping', 'payment'].indexOf(step) > i
                      ? 'bg-rose-500'
                      : 'bg-stone-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 'processing' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-6">
              <svg className="animate-spin w-full h-full text-rose-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-stone-900 mb-2">Processing your order...</h2>
            <p className="text-stone-500">Please don't close this page.</p>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  {step === 'info' && (
                    <>
                      <h2 className="text-lg font-medium text-stone-900 mb-6">Contact Information</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            placeholder="your@email.com"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 'shipping' && (
                    <>
                      <h2 className="text-lg font-medium text-stone-900 mb-6">Shipping Address</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">
                            Street Address
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                              State
                            </label>
                            <input
                              type="text"
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="w-1/2">
                          <label className="block text-sm font-medium text-stone-700 mb-1">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            name="zip"
                            value={formData.zip}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {step === 'payment' && (
                    <>
                      <h2 className="text-lg font-medium text-stone-900 mb-6">Payment Method</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">
                            Card Number
                          </label>
                          <input
                            type="text"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            placeholder="1234 5678 9012 3456"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              name="expiry"
                              value={formData.expiry}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                              placeholder="MM/YY"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                              CVV
                            </label>
                            <input
                              type="text"
                              name="cvv"
                              value={formData.cvv}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                              placeholder="123"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="w-full mt-8 px-6 py-4 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors"
                  >
                    {step === 'payment' ? `Pay $${total.toFixed(2)}` : 'Continue'}
                  </button>
                </motion.div>
              </form>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
                <h2 className="text-lg font-medium text-stone-900 mb-4">Order Summary</h2>

                {/* Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-stone-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="max-w-full max-h-full object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 line-clamp-1">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium text-stone-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-stone-100 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Subtotal</span>
                    <span className="text-stone-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Shipping</span>
                    <span className="text-stone-900">
                      {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Tax</span>
                    <span className="text-stone-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-stone-100 text-base font-medium">
                    <span className="text-stone-900">Total</span>
                    <span className="text-stone-900">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
