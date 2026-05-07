import { useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useProducts } from '@/contexts/ProductContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { useDemo } from '@/contexts/DemoContext';
import { Kamon } from './Kamon';
import { LuxuryPlate, type PlateColor } from './LuxuryPlate';
import type { Product, ProductCategory } from '@/types/product';

const PLATE_ROTATION: PlateColor[] = ['kuwa-cha', 'sumi', 'kinari', 'akakuchiba', 'aijiro'];

/**
 * LuxuryHome — the editorial maison landing.
 *
 * Sections, in order:
 *   1. Hero plate (kuwa-cha) with a single line of brand copy
 *   2. House statement — three columns of declarative paragraphs
 *   3. Two-up "Pieces" — first two products from the catalog as plates
 *   4. From the atelier — Hideo Mori-style master profile teaser
 *   5. Restoration CTA
 *   6. Founder pull quote
 *
 * Every interactive element routes through StoreContext so SF Personalization
 * sees consistent navigation events.
 */
export const LuxuryHome: React.FC = () => {
  const navigate = useNavigate();
  const { navigateToProduct, navigateToCategory } = useStore();
  const { products } = useProducts();
  const { customer, isAuthenticated } = useCustomer();
  const { config, copy } = useDemo();

  const featured: Product[] = products.slice(0, 2);
  const greeting = isAuthenticated && customer?.name
    ? `Welcome, ${customer.name.split(' ')[0]}-san.`
    : null;

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="tk-section--tight tk-container">
        <p className="t-caps">Kyoto · Since 1923</p>
        {greeting && <p className="t-meta tk-mt" style={{ color: 'var(--brass-soft)' }}>{greeting}</p>}
        {/* Editorial hero — fixed copy on purpose. brand_tagline is for SEO
            / marketing emails and is a full sentence; the home wants the
            quiet two-line declaration of what the house is. */}
        <h1 className="t-display t-display--lg tk-mt-sm" style={{ maxWidth: '12ch' }}>
          A house of leather and lacquer.
        </h1>
        <p className="t-body-lg t-soft tk-mt-lg" style={{ maxWidth: '52ch' }}>
          We are a Kyoto atelier of twenty-three master craftspeople. Italian-tradition saddle work,
          finished by hand since 1958. Every piece carries the name of its maker, the date it left
          our workshop, and a passport that travels with it for the rest of its life.
        </p>
        <div className="tk-flex tk-gap tk-mt-xl">
          <button
            type="button"
            onClick={() => navigateToCategory((copy.catalogNav[0]?.value || 'all') as ProductCategory)}
            className="tk-btn tk-btn--ink"
          >
            Walk the maison
          </button>
          <button type="button" onClick={() => navigate('/advisor')} className="tk-btn tk-btn--ghost">
            Speak with your Bantō
          </button>
        </div>
      </section>

      <div className="tk-container">
        <div className="tk-kamon-divider"><Kamon /></div>
      </div>

      {/* ── House statement ─────────────────────────────────────── */}
      <section className="tk-section--tight tk-container">
        <p className="t-caps">The House</p>
        <h2 className="t-display t-display--md tk-mt-sm" style={{ maxWidth: '24ch' }}>
          We do not chase a season. We keep a discipline.
        </h2>
        <div className="tk-twocol--off tk-mt-xl" style={{ gap: 96 }}>
          <p className="t-body-lg t-soft">
            Our atelier follows a calendar of materials, not trends. Conceria 800 in Pisa for our
            kuwa-cha and sumi leathers. Nishijin silk for the linings, woven by the family our
            founder married into. A single 18k Japanese gold for hardware.
          </p>
          <p className="t-body-lg t-soft">
            A piece typically takes between eleven and thirty-two days, depending on the maker and
            the technique. We do not produce more than the atelier can finish to the standard set
            in 1923. Some seasons, the catalog is shorter.
          </p>
        </div>
      </section>

      <div className="tk-container">
        <div className="tk-kamon-divider"><Kamon /></div>
      </div>

      {/* ── Two-up Pieces ───────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="tk-section--tight tk-container">
          <p className="t-caps">Pieces</p>
          <h2 className="t-display t-display--md tk-mt-sm">In the maison this season.</h2>
          <div className="tk-twocol--off tk-mt-xl" style={{ gap: 64, gridTemplateColumns: '1fr 1fr' }}>
            {featured.map((p, i) => {
              const plate = PLATE_ROTATION[i % PLATE_ROTATION.length];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigateToProduct(p)}
                  className="tk-product-card"
                  style={{ display: 'block' }}
                >
                  <LuxuryPlate
                    color={plate}
                    className="tk-product-card__plate"
                    imageUrl={p.imageUrl || undefined}
                    alt={p.name}
                    caption={p.attributes?.luxury?.tannery || p.brand || 'Pisa'}
                  />
                  <div className="tk-product-card__title">
                    {p.name}
                    {p.attributes?.luxury?.jpName && (
                      <span className="tk-product-card__title-jp">{p.attributes.luxury.jpName}</span>
                    )}
                  </div>
                  <div className="tk-product-card__meta">
                    <span>
                      <strong>Master</strong> · {p.attributes?.luxury?.master || p.brand || 'House Atelier'}
                    </span>
                    <span>
                      <strong>{p.attributes?.luxury?.material || String(p.category)}</strong>
                      {p.attributes?.luxury?.tannery ? ` · ${p.attributes.luxury.tannery}` : ''}
                    </span>
                  </div>
                  <div className="tk-product-card__price">USD {p.price.toLocaleString()}</div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="tk-container">
        <div className="tk-kamon-divider"><Kamon /></div>
      </div>

      {/* ── From the atelier ────────────────────────────────────── */}
      <section className="tk-section--tight tk-container">
        <div className="tk-twocol--off" style={{ alignItems: 'start' }}>
          <LuxuryPlate color="kuwa-cha" caption="Hideo Mori · Kyoto" alt="Hideo Mori at the Kyoto atelier" />
          <div>
            <p className="t-caps">From the atelier</p>
            <h2 className="t-display t-display--md tk-mt-sm" style={{ maxWidth: '20ch' }}>
              Hideo Mori, on two stitches a minute.
            </h2>
            <p className="t-body-lg t-soft tk-mt-lg" style={{ maxWidth: '52ch' }}>
              Thirty-one years in the atelier. A Kiri Tote takes him eleven days. He does not work
              faster, and the piece does not wait for the season — when it is finished, it is sent.
              The next one is already on the bench.
            </p>
            <button type="button" onClick={() => navigate('/journal')} className="tk-link tk-mt-lg">
              Continue reading <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      <div className="tk-container">
        <div className="tk-kamon-divider"><Kamon /></div>
      </div>

      {/* ── Restoration CTA ─────────────────────────────────────── */}
      <section className="tk-section--tight tk-container tk-text-center">
        <p className="t-caps">Mottainai · もったいない</p>
        <h2 className="t-display t-display--md tk-mt-sm" style={{ maxWidth: '24ch', margin: '12px auto 0' }}>
          A piece returns. A piece is restored.
        </h2>
        <p className="t-body-lg t-soft tk-mt-lg" style={{ maxWidth: '56ch', margin: '24px auto 0' }}>
          Lifetime restoration is included with every Tachibana piece. Edge refinishing, hardware
          replacement, lining repair, full re-stitching by the original maker where possible. The
          passport records every visit.
        </p>
        <div className="tk-mt-lg" style={{ marginTop: 32 }}>
          <button type="button" onClick={() => navigate('/restoration')} className="tk-btn tk-btn--ghost">
            Begin a restoration
          </button>
        </div>
      </section>

      <div className="tk-container">
        <div className="tk-kamon-divider"><Kamon /></div>
      </div>

      {/* ── Founder pull quote ──────────────────────────────────── */}
      <section className="tk-section--tight tk-container tk-text-center">
        <p className="t-caps">Yuriko Tachibana, Fifth Generation</p>
        <blockquote
          className="t-display t-display--md tk-mt"
          style={{ fontStyle: 'italic', maxWidth: '32ch', margin: '24px auto 0' }}
        >
          “The piece you carry today must be one you can hand to your daughter. That is the
          discipline of the house.”
        </blockquote>
      </section>
    </>
  );
};
