import { useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { Kamon } from './Kamon';

const PLATE_ROTATION = ['kuwa-cha', 'sumi', 'kinari', 'akakuchiba', 'aijiro'] as const;

/**
 * LuxuryCartPage — single-column line items, quiet sticky summary on the
 * right. Each line item shows master + material + monogram + paulownia
 * (gift-box) status, like the Flask cart.html reference.
 */
export const LuxuryCartPage: React.FC = () => {
  const navigate = useNavigate();
  const { navigateToCheckout, navigateToProduct, navigateHome } = useStore();
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  const shipping = subtotal >= 1000 ? 0 : 0; // White-glove always included for the maison
  const total = subtotal + shipping;

  return (
    <>
      <section className="tk-section--tight tk-container">
        <p className="t-caps">Your bag</p>
        <h1 className="t-display t-display--lg tk-mt-sm">Pieces, before they leave Kyoto.</h1>

        {items.length === 0 ? (
          <div className="tk-mt-xl tk-text-center" style={{ padding: '120px 0' }}>
            <div className="tk-flex" style={{ justifyContent: 'center', color: 'var(--brass-soft)' }}>
              <Kamon size={48} />
            </div>
            <h2 className="t-display t-display--md tk-mt-lg">Your bag is empty.</h2>
            <p className="t-soft tk-mt" style={{ maxWidth: '40ch', margin: '20px auto 0' }}>
              When you find a piece you would like, it will be set aside here while you decide.
            </p>
            <div className="tk-mt-lg" style={{ marginTop: 32 }}>
              <button type="button" onClick={navigateHome} className="tk-btn tk-btn--ghost">
                Walk the maison
              </button>
            </div>
          </div>
        ) : (
          <div className="tk-twocol--off tk-mt-xl" style={{ alignItems: 'start', gap: 96, gridTemplateColumns: '2fr 1fr' }}>
            {/* Lines */}
            <div className="tk-stack" style={{ gap: 0 }}>
              {items.map((item, i) => {
                const plate = PLATE_ROTATION[i % PLATE_ROTATION.length];
                const lux = item.product.attributes?.luxury;
                const master = lux?.master || item.product.brand;
                const material = lux?.material || String(item.product.category);
                const tannery = lux?.tannery || 'Pisa';
                return (
                  <article
                    key={item.product.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr',
                      gap: 32,
                      padding: '32px 0',
                      borderBottom: '1px solid var(--paper-edge)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => navigateToProduct(item.product)}
                      className={`tk-plate tk-plate--${plate}`}
                      style={{ aspectRatio: '3 / 4', cursor: 'pointer', border: 0, padding: 0 }}
                    >
                      <Kamon className="tk-plate__mark" />
                    </button>
                    <div>
                      <button
                        type="button"
                        onClick={() => navigateToProduct(item.product)}
                        style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }}
                      >
                        <h3 className="t-display" style={{ fontSize: 22 }}>
                          {item.product.name}
                          {lux?.jpName && (
                            <span className="tk-product-card__title-jp">{lux.jpName}</span>
                          )}
                        </h3>
                      </button>
                      <p className="t-meta tk-mt-sm">Master · {master} &nbsp;·&nbsp; {material} · {tannery}</p>

                      <div
                        className="tk-mt"
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px', maxWidth: 480, marginTop: 18 }}
                      >
                        <div>
                          <p className="t-meta">Monogram</p>
                          <p className="t-soft" style={{ marginTop: 4, fontSize: 14, fontStyle: 'italic' }}>
                            — none —
                          </p>
                        </div>
                        <div>
                          <p className="t-meta">Paulownia box</p>
                          <p className="t-soft" style={{ marginTop: 4, fontSize: 14 }}>Included</p>
                        </div>
                      </div>

                      <div className="tk-flex tk-flex--between tk-mt-lg" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <div className="tk-flex tk-gap" style={{ alignItems: 'center', gap: 18 }}>
                          <button
                            type="button"
                            className="tk-link"
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            aria-label="Decrease"
                          >
                            −
                          </button>
                          <span style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>{item.quantity}</span>
                          <button
                            type="button"
                            className="tk-link"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            aria-label="Increase"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="tk-link"
                            style={{ marginLeft: 24, color: 'var(--ink-quiet)' }}
                            onClick={() => removeItem(item.product.id)}
                          >
                            Remove
                          </button>
                        </div>
                        <p className="t-display" style={{ fontSize: 22 }}>
                          USD {(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Summary */}
            <aside style={{ position: 'sticky', top: 120 }}>
              <div className="tk-paper" style={{ padding: 32 }}>
                <p className="t-caps">Order summary</p>
                <hr className="tk-rule" style={{ margin: '20px 0' }} />
                <div className="tk-stack-sm">
                  <div className="tk-flex tk-flex--between">
                    <span className="t-soft">Subtotal</span>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>USD {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="tk-flex tk-flex--between">
                    <span className="t-soft">White-glove delivery</span>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic' }}>Included</span>
                  </div>
                  <div className="tk-flex tk-flex--between">
                    <span className="t-soft">Lifetime restoration</span>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic' }}>Included</span>
                  </div>
                </div>
                <hr className="tk-rule" style={{ margin: '20px 0' }} />
                <div className="tk-flex tk-flex--between">
                  <span className="t-display" style={{ fontSize: 20 }}>Total</span>
                  <span className="t-display" style={{ fontSize: 22 }}>USD {total.toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={navigateToCheckout}
                  className="tk-btn tk-btn--ink"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 32 }}
                >
                  Continue to checkout
                </button>
              </div>

              <div className="tk-mt-lg" style={{ marginTop: 32, padding: 24, borderTop: '1px solid var(--paper-edge)' }}>
                <p className="t-caps">Or, the parallel path</p>
                <p className="t-soft tk-mt" style={{ fontSize: 14 }}>
                  Hold these pieces and let your Bantō walk you through them — by phone, by video,
                  or in any of our houses.
                </p>
                <button type="button" onClick={() => navigate('/advisor')} className="tk-link tk-mt">
                  Speak with your Bantō →
                </button>
              </div>
            </aside>
          </div>
        )}
      </section>
    </>
  );
};
