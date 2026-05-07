import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useDemo } from '@/contexts/DemoContext';
import { Kamon } from './Kamon';
import type { Product, ProductCategory } from '@/types/product';

const PLATE_ROTATION = ['kuwa-cha', 'sumi', 'kinari', 'akakuchiba', 'aijiro'] as const;

interface Props {
  category: ProductCategory;
  products: Product[];
}

/**
 * LuxuryCategoryPage — single-collection grid in the maison style.
 *
 * Mirrors `collection.html` from the Flask reference: kamon header, intro
 * paragraph, three-column grid of plate cards, kamon divider, and a
 * commissioning panel that points at the atelier.
 */
export const LuxuryCategoryPage: React.FC<Props> = ({ category, products }) => {
  const navigate = useNavigate();
  const { navigateToProduct } = useStore();
  const { copy } = useDemo();

  const filtered = useMemo(
    () => products.filter((p) => p.category === category),
    [products, category],
  );

  const navItem = copy.catalogNav.find((c) => c.value === category);
  const collectionLabel = navItem?.label || (typeof category === 'string' ? category : 'Pieces');

  return (
    <>
      <section className="tk-section--tight tk-container">
        <p className="t-caps">
          Maison &nbsp;·&nbsp;{' '}
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{ color: 'inherit', borderBottom: '1px solid var(--paper-edge)', background: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}
          >
            All categories
          </button>
        </p>
        <h1 className="t-display t-display--lg tk-mt-sm">{collectionLabel}</h1>
        <p className="t-body-lg t-soft tk-mt-lg" style={{ maxWidth: '60ch' }}>
          The volume of the house. Hand-stitched in Kyoto by twenty-three master craftspeople.
          Italian-tradition saddle work, finished in our atelier since 1958. Each piece carries
          the name of its maker.
        </p>
      </section>

      <div className="tk-container">
        <div className="tk-kamon-divider"><Kamon /></div>
      </div>

      <section className="tk-section--tight tk-container">
        {filtered.length === 0 ? (
          <p className="t-quiet" style={{ textAlign: 'center' }}>
            — the bench is empty this week. write to your Bantō for the next opening —
          </p>
        ) : (
          <div className="tk-collection-grid">
            {filtered.map((p, i) => {
              const plate = PLATE_ROTATION[i % PLATE_ROTATION.length];
              const lux = p.attributes?.luxury;
              const material = lux?.material || String(p.category);
              return (
                <button key={p.id} type="button" onClick={() => navigateToProduct(p)} className="tk-product-card">
                  <div className={`tk-plate tk-plate--${plate} tk-plate--portrait tk-product-card__plate`}>
                    <Kamon className="tk-plate__mark" />
                    <span className="tk-plate__caption">
                      {material}{lux?.tannery ? ` · ${lux.tannery}` : ''}
                    </span>
                  </div>
                  <div className="tk-product-card__title">
                    {p.name}
                    {lux?.jpName && <span className="tk-product-card__title-jp">{lux.jpName}</span>}
                  </div>
                  <div className="tk-product-card__meta">
                    <span><strong>Master</strong> · {lux?.master || p.brand}</span>
                    <span>
                      <strong>{material}</strong>
                      {lux?.tannery ? ` · ${lux.tannery}` : ''}
                    </span>
                  </div>
                  <div className="tk-product-card__price">USD {p.price.toLocaleString()}</div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="tk-container">
        <div className="tk-kamon-divider"><Kamon /></div>
      </div>

      <section className="tk-section--tight tk-container tk-text-center">
        <p className="t-caps">Commissioning</p>
        <h3 className="t-display t-display--md tk-mt-sm" style={{ maxWidth: '22ch', margin: '12px auto 0' }}>
          A piece can be made in your hand.
        </h3>
        <p className="t-body-lg t-soft tk-mt-lg" style={{ maxWidth: '56ch', margin: '24px auto 0' }}>
          Most of the maison is bespoke-orderable in our materials, hardware, and lining choices.
          Commissioning takes between eight and fourteen weeks. Speak with your Bantō at any of
          our houses, or write to the atelier in Kyoto.
        </p>
        <div className="tk-mt-lg" style={{ marginTop: 32 }}>
          <button type="button" onClick={() => navigate('/atelier')} className="tk-btn tk-btn--ghost">
            Book an appointment
          </button>
        </div>
      </section>
    </>
  );
};
