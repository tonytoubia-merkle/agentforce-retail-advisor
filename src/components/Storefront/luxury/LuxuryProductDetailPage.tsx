import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { Kamon } from './Kamon';
import type { Product } from '@/types/product';

interface Props {
  product: Product;
}

const PLATES = ['kuwa-cha', 'sumi', 'kinari'] as const;

/**
 * LuxuryProductDetailPage — long-form, editorial PDP.
 *
 * Layout (mirrors product.html):
 *   • Breadcrumb (Maison · Category · piece)
 *   • Two-column hero — three stacked plates left, sticky title/price right
 *   • Shokunin (the maker)
 *   • Material (the leather + tannery)
 *   • Wabi-sabi notes (patina at year ten)
 *   • Mottainai (lifetime restoration)
 *   • Digital product passport preview
 */
export const LuxuryProductDetailPage: React.FC<Props> = ({ product }) => {
  const navigate = useNavigate();
  const { navigateHome, navigateToCategory, navigateToCart } = useStore();
  const { addItem, isInCart } = useCart();
  const [adding, setAdding] = useState(false);

  const inCart = isInCart(product.id);
  const handleAdd = useCallback(() => {
    if (inCart) return navigateToCart();
    setAdding(true);
    addItem(product, 1);
    window.setTimeout(() => setAdding(false), 600);
  }, [inCart, addItem, navigateToCart, product]);

  const lux = product.attributes?.luxury;
  const master = lux?.master || product.brand || 'House Atelier';
  const material = lux?.material || String(product.category);
  const tannery = lux?.tannery || 'Pisa, Italy';
  const jpName = lux?.jpName || '';
  const lot = lux?.lot || `橘-${new Date().getFullYear()}-${product.id.slice(0, 4).toUpperCase()}`;

  return (
    <>
      <section className="tk-section--tight tk-container">
        <p className="t-caps">
          <button
            type="button"
            onClick={navigateHome}
            style={{ color: 'inherit', background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' }}
          >
            Maison
          </button>
          {' · '}
          <button
            type="button"
            onClick={() => navigateToCategory(product.category)}
            style={{ color: 'inherit', background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' }}
          >
            {String(product.category)}
          </button>
          {' · '}
          <span style={{ color: 'var(--ink)' }}>{product.name}</span>
        </p>
      </section>

      <section className="tk-container" style={{ paddingBottom: 80 }}>
        <div className="tk-twocol--off" style={{ alignItems: 'start', gap: 96 }}>
          {/* Left — three stacked plates */}
          <div className="tk-stack">
            {PLATES.map((plate, i) => (
              <div key={plate} className={`tk-plate tk-plate--${plate} tk-plate--portrait`}>
                <Kamon className="tk-plate__mark" />
                <span className="tk-plate__caption">
                  {i === 0 && `${material} · ${tannery}`}
                  {i === 1 && `Master · ${master}`}
                  {i === 2 && `Lot · ${lot}`}
                </span>
              </div>
            ))}
          </div>

          {/* Right — sticky title / monogram / price */}
          <aside style={{ position: 'sticky', top: 120 }}>
            <p className="t-caps">{material}</p>
            <h1 className="t-display t-display--lg tk-mt-sm" style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}>
              {product.name}
              {jpName && <span className="tk-product-card__title-jp" style={{ fontSize: '0.4em', marginLeft: 16 }}>{jpName}</span>}
            </h1>
            <p className="t-meta tk-mt">Master · {master}</p>
            <p className="t-meta">{material} · {tannery}</p>
            <p className="t-display tk-mt-lg" style={{ fontSize: 28, letterSpacing: '0.04em' }}>
              USD {product.price.toLocaleString()}
            </p>
            <p className="t-soft tk-mt" style={{ fontSize: 14 }}>
              Bespoke commissioning: 8–14 weeks · Edge in your choice of brass-soft or sumi
            </p>

            <hr className="tk-rule" style={{ margin: '32px 0' }} />

            <div className="tk-stack-sm">
              <button type="button" onClick={handleAdd} className="tk-btn tk-btn--ink">
                {inCart ? 'View in bag' : adding ? 'Added · view bag' : 'Add to bag'}
              </button>
              <button type="button" onClick={() => navigate('/advisor')} className="tk-btn tk-btn--ghost">
                Reserve · speak with your Bantō
              </button>
              <button type="button" onClick={() => navigate('/atelier')} className="tk-link tk-mt">
                Or book a private viewing in any of our houses →
              </button>
            </div>

            <hr className="tk-rule" style={{ margin: '32px 0' }} />

            <div className="t-meta tk-stack-sm">
              <p>· Hand-stitched in Kyoto, two stitches per minute</p>
              <p>· Conceria 800 vegetable-tanned leather, twenty-eight days in the pits</p>
              <p>· 18k Japanese gold hardware, by Marco Bianchi (Vicenza)</p>
              <p>· Nishijin silk lining, woven in Kyoto since 1924</p>
              <p>· Lifetime restoration included</p>
            </div>
          </aside>
        </div>
      </section>

      <div className="tk-container">
        <div className="tk-kamon-divider"><Kamon /></div>
      </div>

      {/* ── Shokunin ────────────────────────────────────────────── */}
      <section className="tk-section--tight tk-container">
        <div className="tk-twocol--off" style={{ alignItems: 'start', gap: 96 }}>
          <div>
            <p className="t-caps">Shokunin · 職人</p>
            <h2 className="t-display t-display--md tk-mt-sm" style={{ maxWidth: '20ch' }}>
              {master}, who made it.
            </h2>
          </div>
          <div>
            <p className="t-body-lg t-soft">
              {master} has been at the atelier for thirty-one years. They learned the saddle stitch
              from their father in Pisa and the tessen-magari (folded edge) from Junji Okada in
              Kyoto. They sign every piece on the inside seam — small, in iron-gall ink, where
              only the lining ever sees it.
            </p>
            <p className="t-body-lg t-soft tk-mt-lg">
              The {product.name.toLowerCase()} is one of theirs. It will not be made by anyone else.
            </p>
          </div>
        </div>
      </section>

      <div className="tk-container">
        <div className="tk-kamon-divider"><Kamon /></div>
      </div>

      {/* ── Material ────────────────────────────────────────────── */}
      <section className="tk-section--tight tk-container">
        <div className="tk-twocol--off" style={{ alignItems: 'start', gap: 96 }}>
          <div>
            <p className="t-caps">Material · {material}</p>
            <h2 className="t-display t-display--md tk-mt-sm" style={{ maxWidth: '20ch' }}>
              Twenty-eight days in the pits.
            </h2>
          </div>
          <div>
            <p className="t-body-lg t-soft">
              Conceria 800 has supplied our hides since 1954. Bull-hide, vegetable-tanned with
              chestnut and oak in concrete pits, hand-finished with cera-d&apos;abete (fir-tree wax).
              No chrome. No accelerated tanning. Twenty-eight days, every season.
            </p>
            <p className="t-body-lg t-soft tk-mt-lg">
              The kuwa-cha shade is finished in our atelier with a single application of mulberry-
              tea dye, applied warm. Two craftspeople. Three afternoons. The color settles in over
              the first year of use.
            </p>
          </div>
        </div>
      </section>

      <div className="tk-container">
        <div className="tk-kamon-divider"><Kamon /></div>
      </div>

      {/* ── Wabi-sabi ───────────────────────────────────────────── */}
      <section className="tk-section--tight tk-container">
        <div className="tk-twocol--off" style={{ alignItems: 'start', gap: 96 }}>
          <div>
            <p className="t-caps">Wabi-Sabi · 侘寂</p>
            <h2 className="t-display t-display--md tk-mt-sm" style={{ maxWidth: '20ch' }}>
              At year ten.
            </h2>
          </div>
          <div>
            <p className="t-body-lg t-soft">
              The handles will deepen first — the oils on your hand, the shape of your grip. The
              corners will round, slightly. The interior will gather a soft sheen from your
              belongings. None of this is wear. All of it is the piece becoming yours.
            </p>
          </div>
        </div>
      </section>

      <div className="tk-container">
        <div className="tk-kamon-divider"><Kamon /></div>
      </div>

      {/* ── Mottainai ───────────────────────────────────────────── */}
      <section className="tk-section--tight tk-container">
        <div className="tk-twocol--off" style={{ alignItems: 'start', gap: 96 }}>
          <div>
            <p className="t-caps">Mottainai · もったいない</p>
            <h2 className="t-display t-display--md tk-mt-sm" style={{ maxWidth: '20ch' }}>
              When the time comes.
            </h2>
          </div>
          <div>
            <p className="t-body-lg t-soft">
              Edge refinishing, full re-stitching, hardware replacement, lining repair — included
              with every piece, for as long as the piece exists. The passport carries the date of
              every visit and the name of the maker who restored it.
            </p>
            <button type="button" onClick={() => navigate('/restoration')} className="tk-link tk-mt-lg">
              Begin a restoration <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      <div className="tk-container">
        <div className="tk-kamon-divider"><Kamon /></div>
      </div>

      {/* ── Passport preview ────────────────────────────────────── */}
      <section className="tk-section--tight tk-container tk-text-center">
        <p className="t-caps">Product Passport</p>
        <div
          className="tk-paper tk-mt-lg"
          style={{ maxWidth: 640, margin: '32px auto 0', padding: 56, textAlign: 'left' }}
        >
          <div className="tk-flex tk-flex--between" style={{ alignItems: 'flex-start' }}>
            <div>
              <p className="t-meta">Master</p>
              <p className="t-display" style={{ fontSize: 22, marginTop: 4 }}>{master}</p>
            </div>
            <Kamon size={36} className="kamon" />
          </div>
          <hr className="tk-rule" style={{ margin: '24px 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <p className="t-meta">Lot</p>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 18, marginTop: 4, letterSpacing: '0.04em' }}>{lot}</p>
            </div>
            <div>
              <p className="t-meta">Atelier date</p>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 18, marginTop: 4 }}>
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="t-meta">Tannery</p>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 18, marginTop: 4 }}>{tannery}</p>
            </div>
            <div>
              <p className="t-meta">Restoration</p>
              <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, marginTop: 4 }}>
                — begins with the first owner —
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
