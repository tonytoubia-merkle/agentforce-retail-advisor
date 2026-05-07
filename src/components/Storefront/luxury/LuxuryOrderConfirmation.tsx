import { useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { Kamon } from './Kamon';

export const LuxuryOrderConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { lastOrderId, lastOrderResult, navigateHome } = useStore();
  const orderNumber = lastOrderResult?.orderNumber || lastOrderId || '橘-pending';
  const eta = lastOrderResult?.estimatedDelivery;

  return (
    <section className="tk-section--tight tk-container tk-text-center">
      <div style={{ color: 'var(--brass-soft)', display: 'inline-flex' }}>
        <Kamon size={56} />
      </div>
      <p className="t-caps tk-mt-lg" style={{ marginTop: 32 }}>The atelier has your order</p>
      <h1 className="t-display t-display--lg tk-mt-sm" style={{ maxWidth: '20ch', margin: '12px auto 0' }}>
        Thank you. The work begins.
      </h1>

      <div
        className="tk-paper tk-mt-xl"
        style={{ maxWidth: 560, margin: '56px auto 0', padding: 48, textAlign: 'left' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px' }}>
          <div>
            <p className="t-meta">Order</p>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 18, marginTop: 4, letterSpacing: '0.04em' }}>
              {orderNumber}
            </p>
          </div>
          <div>
            <p className="t-meta">Estimated atelier ship date</p>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 18, marginTop: 4 }}>
              {eta || 'Six to eight weeks'}
            </p>
          </div>
          <div>
            <p className="t-meta">Delivery</p>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 18, marginTop: 4 }}>White-glove · scheduled</p>
          </div>
          <div>
            <p className="t-meta">Restoration</p>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, marginTop: 4 }}>
              — begins with the first owner —
            </p>
          </div>
        </div>
      </div>

      <p className="t-soft tk-mt-xl" style={{ maxWidth: '52ch', margin: '48px auto 0' }}>
        A confirmation is on its way to your inbox. Your Bantō will write separately when the
        piece is ready to leave Kyoto. The passport is being prepared and will travel with it.
      </p>

      <div className="tk-flex tk-gap" style={{ justifyContent: 'center', marginTop: 32, gap: 16, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => navigate('/account')} className="tk-btn tk-btn--ink">
          View in My Maison
        </button>
        <button type="button" onClick={navigateHome} className="tk-btn tk-btn--ghost">
          Walk the maison
        </button>
      </div>
    </section>
  );
};
