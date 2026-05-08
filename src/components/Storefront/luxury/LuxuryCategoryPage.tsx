import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { Kamon } from './Kamon';
import { LuxuryPlate, type PlateColor } from './LuxuryPlate';
import type { Product, ProductCategory } from '@/types/product';

const PLATE_ROTATION: PlateColor[] = ['kuwa-cha', 'sumi', 'kinari', 'akakuchiba', 'aijiro'];

/**
 * Per-category editorial copy. Keyed by the seed migration's category
 * slugs. Falls back to a generic display name when a piece lives under
 * a category that doesn't match here (legacy fashion catalogNav values
 * like 'new', 'dress', 'accessory', etc.).
 */
const CATEGORY_COPY: Record<string, { label: string; intro: string }> = {
  'leather-goods': {
    label: 'Leather goods',
    intro:
      'The volume of the house. Hand-stitched in Kyoto by twenty-three master craftspeople. Italian-tradition saddle work, finished in our atelier since 1958. Each piece carries the name of its maker.',
  },
  jewelry: {
    label: 'Jewelry',
    intro:
      '18k Japanese gold by Marco Bianchi in Vicenza, lacquer by Tetsuya Asano in Wajima. The kamon, miniaturised — the chrysanthemum, in low relief. Worn alone or as the only mark of the house.',
  },
  outerwear: {
    label: 'Outerwear',
    intro:
      'Leather coats hand-cut in Kyoto from our Pisa-tanned hides; haori and wraps woven on Nishijin looms by the Nishikawa workshop. Made each season in numbers the atelier can finish.',
  },
  lifestyle: {
    label: 'Lifestyle',
    intro:
      'Paulownia, urushi, Nishijin, Kyoto incense. The objects of an ordinary day at the atelier — a stationery box, a fountain pen, a tea towel — made to the same standard as the leather.',
  },
};

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

  const filtered = useMemo(
    () => products.filter((p) => p.category === category),
    [products, category],
  );

  const slug = String(category);
  const copy = CATEGORY_COPY[slug] || {
    label: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    intro:
      'Hand-finished in Kyoto. Each piece carries the name of its maker, the date it left our workshop, and a passport that travels with it for the rest of its life.',
  };
  const collectionLabel = copy.label;

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
          {copy.intro}
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
              // Prefer luxury.material; fall back to a humanised category label
              // (so a missing-luxury row reads "Leather goods" instead of
              // "leather-goods" in the plate caption).
              const material =
                lux?.material ||
                String(p.category).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <button key={p.id} type="button" onClick={() => navigateToProduct(p)} className="tk-product-card">
                  <LuxuryPlate
                    color={plate}
                    className="tk-product-card__plate"
                    imageUrl={p.imageUrl || undefined}
                    alt={p.name}
                    caption={`${material}${lux?.tannery ? ` · ${lux.tannery}` : ''}`}
                  />
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
