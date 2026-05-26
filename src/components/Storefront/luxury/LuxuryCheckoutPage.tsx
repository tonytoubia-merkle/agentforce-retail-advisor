import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, type OrderResult } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { getDemoConfig } from '@/contexts/DemoContext';
import { trackPurchase } from '@/services/personalization';
import { getCommerceBackend } from '@/services/commerce';
import { Kamon } from './Kamon';

type Step = 'personalization' | 'delivery' | 'payment' | 'processing';

/**
 * LuxuryCheckoutPage — three slow steps in the maison cadence:
 *   1. Personalization (monogram, paulownia engraving, sealing wax)
 *   2. Delivery (white-glove, scheduled with the Bantō)
 *   3. Payment (the same SF Commerce Cloud / mock path the default uses)
 *
 * Reuses every SF wiring: Commerce checkout, trackPurchase, markConverted,
 * and the StoreContext order-confirmation route.
 */
export const LuxuryCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const useMockData = getDemoConfig().featureFlags.useMockData;
  const { navigateToOrderConfirmation } = useStore();
  const { items, subtotal, markConverted } = useCart();
  const { customer } = useCustomer();

  const [step, setStep] = useState<Step>('personalization');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: customer?.email || '',
    firstName: customer?.name?.split(' ')[0] || '',
    lastName: customer?.name?.split(' ').slice(1).join(' ') || '',
    address: customer?.shippingAddresses?.[0]?.line1 || '',
    city: customer?.shippingAddresses?.[0]?.city || '',
    state: customer?.shippingAddresses?.[0]?.state || '',
    zip: customer?.shippingAddresses?.[0]?.postalCode || '',
    monogram: '',
    sealingWax: 'kuwa-cha',
    paulownia: true,
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const total = subtotal; // White-glove + restoration included; no tax shown in maison view
  const update = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'personalization') return setStep('delivery');
    if (step === 'delivery') return setStep('payment');
    if (step === 'payment') {
      setStep('processing');
      setError(null);

      const lineItems = items.map((item) => ({
        product2Id: item.product.salesforceId || item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
      }));

      if (useMockData) {
        window.setTimeout(() => {
          const orderId = `橘-${Date.now().toString(36).toUpperCase()}`;
          trackPurchase(orderId, total, lineItems);
          markConverted();
          navigateToOrderConfirmation(orderId);
        }, 2400);
        return;
      }

      getCommerceBackend()
        .checkout({
          items: items.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.product.price,
            salesforceId: item.product.salesforceId,
          })),
          email: form.email || customer?.email || '',
          shippingAddress: {
            firstName: form.firstName,
            lastName: form.lastName,
            address1: form.address,
            city: form.city,
            stateCode: form.state,
            postalCode: form.zip,
            countryCode: 'US',
          },
        })
        .then((result) => {
          trackPurchase(result.orderId, total, lineItems);
          markConverted();
          navigateToOrderConfirmation(result.orderId, {
            success: result.status === 'confirmed',
            orderId: result.orderId,
            orderNumber: result.orderId,
            trackingNumber: '',
            carrier: '',
            estimatedDelivery: result.estimatedDelivery,
            shippingStatus: 'In atelier',
            pointsEarned: 0,
          } satisfies OrderResult);
        })
        .catch((err: Error) => {
          setError(err.message || 'The atelier could not be reached. Please try again.');
          setStep('payment');
        });
    }
  };

  if (items.length === 0 && step !== 'processing') {
    return (
      <section className="tk-section--tight tk-container tk-text-center" style={{ padding: '160px 0' }}>
        <div style={{ color: 'var(--brass-soft)', display: 'inline-flex' }}><Kamon size={48} /></div>
        <h1 className="t-display t-display--md tk-mt-lg">There is nothing to send.</h1>
        <p className="t-soft tk-mt" style={{ maxWidth: '40ch', margin: '12px auto 0' }}>
          Walk the maison and choose a piece first.
        </p>
        <button type="button" onClick={() => navigate('/')} className="tk-btn tk-btn--ghost" style={{ marginTop: 32 }}>
          Walk the maison
        </button>
      </section>
    );
  }

  if (step === 'processing') {
    return (
      <section className="tk-section--tight tk-container tk-text-center" style={{ padding: '180px 0' }}>
        <div style={{ color: 'var(--brass-soft)', display: 'inline-flex', animation: 'spin 4s linear infinite' }}>
          <Kamon size={56} />
        </div>
        <h1 className="t-display t-display--md tk-mt-lg">The atelier is preparing your order.</h1>
        <p className="t-soft tk-mt" style={{ maxWidth: '44ch', margin: '12px auto 0' }}>
          A confirmation will be in your inbox shortly. Your Bantō will write separately.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </section>
    );
  }

  return (
    <section className="tk-section--tight tk-container">
      <p className="t-caps">Checkout</p>
      <h1 className="t-display t-display--lg tk-mt-sm">Three considered steps.</h1>

      {/* Stepper */}
      <ol
        className="tk-flex tk-mt-xl"
        style={{ listStyle: 'none', padding: 0, margin: 0, gap: 32, color: 'var(--ink-quiet)', flexWrap: 'wrap' }}
      >
        {(['personalization', 'delivery', 'payment'] as Step[]).map((s, i) => {
          const idx = (['personalization', 'delivery', 'payment'] as Step[]).indexOf(step);
          const active = i <= idx;
          return (
            <li key={s} className="t-meta" style={{ color: active ? 'var(--ink)' : 'var(--ink-quiet)' }}>
              <span style={{ marginRight: 8, fontFamily: 'var(--serif)', fontSize: 16 }}>{`0${i + 1}`}</span>
              {s === 'personalization' ? 'Personalization' : s === 'delivery' ? 'Delivery' : 'Payment'}
            </li>
          );
        })}
      </ol>

      <div className="tk-twocol--off tk-mt-xl" style={{ alignItems: 'start', gap: 96, gridTemplateColumns: '2fr 1fr' }}>
        <form onSubmit={handleNext} className="tk-stack">
          {step === 'personalization' && (
            <>
              <div>
                <p className="t-caps">Monogram</p>
                <p className="t-soft tk-mt" style={{ fontSize: 14 }}>
                  Up to four characters, foil-pressed in iron-gall on the inside seam. Leave empty
                  to receive the piece unmarked.
                </p>
                <input
                  type="text"
                  maxLength={4}
                  value={form.monogram}
                  onChange={(e) => update('monogram', e.target.value)}
                  className="tk-mt"
                  style={{
                    marginTop: 16, padding: '14px 16px', width: 240, border: '1px solid var(--paper-edge)',
                    background: 'transparent', fontFamily: 'var(--serif)', fontSize: 18, letterSpacing: '0.16em',
                  }}
                />
              </div>
              <div>
                <p className="t-caps">Sealing wax</p>
                <div className="tk-flex tk-gap tk-mt" style={{ marginTop: 12, gap: 18, flexWrap: 'wrap' }}>
                  {(['kuwa-cha', 'sumi', 'akakuchiba'] as const).map((c) => (
                    <label key={c} className="tk-flex tk-gap" style={{ alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                      <input
                        type="radio"
                        name="wax"
                        value={c}
                        checked={form.sealingWax === c}
                        onChange={() => update('sealingWax', c)}
                      />
                      <span className="t-meta">{c}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="tk-flex tk-gap" style={{ alignItems: 'center', cursor: 'pointer', gap: 12 }}>
                  <input type="checkbox" checked={form.paulownia} onChange={(e) => update('paulownia', e.target.checked)} />
                  <span className="t-meta">Paulownia gift box (included)</span>
                </label>
              </div>
            </>
          )}

          {step === 'delivery' && (
            <>
              <div className="tk-flex tk-gap" style={{ gap: 24 }}>
                <input
                  required type="text" placeholder="First name" value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  style={{ flex: 1, padding: '14px 16px', border: '1px solid var(--paper-edge)', background: 'transparent', fontFamily: 'var(--serif)', fontSize: 18 }}
                />
                <input
                  required type="text" placeholder="Last name" value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  style={{ flex: 1, padding: '14px 16px', border: '1px solid var(--paper-edge)', background: 'transparent', fontFamily: 'var(--serif)', fontSize: 18 }}
                />
              </div>
              <input
                required type="email" placeholder="Email" value={form.email}
                onChange={(e) => update('email', e.target.value)}
                style={{ padding: '14px 16px', border: '1px solid var(--paper-edge)', background: 'transparent', fontFamily: 'var(--serif)', fontSize: 18 }}
              />
              <input
                required type="text" placeholder="Address" value={form.address}
                onChange={(e) => update('address', e.target.value)}
                style={{ padding: '14px 16px', border: '1px solid var(--paper-edge)', background: 'transparent', fontFamily: 'var(--serif)', fontSize: 18 }}
              />
              <div className="tk-flex tk-gap" style={{ gap: 24 }}>
                <input
                  required type="text" placeholder="City" value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  style={{ flex: 2, padding: '14px 16px', border: '1px solid var(--paper-edge)', background: 'transparent', fontFamily: 'var(--serif)', fontSize: 18 }}
                />
                <input
                  required type="text" placeholder="State" value={form.state}
                  onChange={(e) => update('state', e.target.value)}
                  style={{ flex: 1, padding: '14px 16px', border: '1px solid var(--paper-edge)', background: 'transparent', fontFamily: 'var(--serif)', fontSize: 18 }}
                />
                <input
                  required type="text" placeholder="ZIP" value={form.zip}
                  onChange={(e) => update('zip', e.target.value)}
                  style={{ flex: 1, padding: '14px 16px', border: '1px solid var(--paper-edge)', background: 'transparent', fontFamily: 'var(--serif)', fontSize: 18 }}
                />
              </div>
              <p className="t-soft" style={{ fontSize: 14 }}>
                Estimated atelier ship date — six to eight weeks for in-stock pieces, twelve to
                fourteen for commissions. Your Bantō will confirm.
              </p>
            </>
          )}

          {step === 'payment' && (
            <>
              {error && (
                <p className="t-quiet" style={{ color: 'var(--akakuchiba)' }}>{error}</p>
              )}
              <input
                required type="text" placeholder="Card number" value={form.cardNumber}
                onChange={(e) => update('cardNumber', e.target.value)}
                style={{ padding: '14px 16px', border: '1px solid var(--paper-edge)', background: 'transparent', fontFamily: 'var(--serif)', fontSize: 18, letterSpacing: '0.18em' }}
              />
              <div className="tk-flex tk-gap" style={{ gap: 24 }}>
                <input
                  required type="text" placeholder="MM/YY" value={form.expiry}
                  onChange={(e) => update('expiry', e.target.value)}
                  style={{ flex: 1, padding: '14px 16px', border: '1px solid var(--paper-edge)', background: 'transparent', fontFamily: 'var(--serif)', fontSize: 18 }}
                />
                <input
                  required type="text" placeholder="CVV" value={form.cvv}
                  onChange={(e) => update('cvv', e.target.value)}
                  style={{ flex: 1, padding: '14px 16px', border: '1px solid var(--paper-edge)', background: 'transparent', fontFamily: 'var(--serif)', fontSize: 18 }}
                />
              </div>
              <p className="t-soft" style={{ fontSize: 13 }}>
                Or, if you would prefer to settle by wire or through your concierge, your Bantō
                can arrange that. <button type="button" className="tk-link" onClick={() => navigate('/advisor')}>Reserve and contact your Bantō</button>
              </p>
            </>
          )}

          <div className="tk-flex tk-gap" style={{ marginTop: 32, justifyContent: 'space-between' }}>
            <button
              type="button"
              className="tk-link"
              onClick={() => {
                if (step === 'delivery') setStep('personalization');
                else if (step === 'payment') setStep('delivery');
                else navigate('/cart');
              }}
            >
              ← Back
            </button>
            <button type="submit" className="tk-btn tk-btn--ink">
              {step === 'payment' ? 'Place the order' : 'Continue'}
            </button>
          </div>
        </form>

        {/* Summary */}
        <aside style={{ position: 'sticky', top: 120 }}>
          <div className="tk-paper" style={{ padding: 32 }}>
            <p className="t-caps">In your bag</p>
            <hr className="tk-rule" style={{ margin: '20px 0' }} />
            <div className="tk-stack-sm">
              {items.map((item) => (
                <div key={item.product.id} className="tk-flex tk-flex--between" style={{ alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>
                      {item.product.name}
                      {item.quantity > 1 && <span className="t-meta" style={{ marginLeft: 8 }}>× {item.quantity}</span>}
                    </p>
                    <p className="t-meta">{item.product.attributes?.luxury?.master || item.product.brand}</p>
                  </div>
                  <p style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>
                    USD {(item.product.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <hr className="tk-rule" style={{ margin: '20px 0' }} />
            <div className="tk-flex tk-flex--between">
              <span className="t-display" style={{ fontSize: 18 }}>Total</span>
              <span className="t-display" style={{ fontSize: 20 }}>USD {total.toLocaleString()}</span>
            </div>
            <p className="t-soft" style={{ fontSize: 12, marginTop: 12 }}>
              White-glove delivery and lifetime restoration are included with every piece.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};
