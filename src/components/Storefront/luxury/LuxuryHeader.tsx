import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { useDemo } from '@/contexts/DemoContext';
import { Kamon } from './Kamon';
import type { ProductCategory } from '@/types/product';

/**
 * Maison-native nav categories. Aligned with the Tachibana product seed
 * (see `003_tachibana_products_seed.sql`). Hardcoded here because this
 * header is luxury-only — adding these to the shared `verticalCopy.ts`
 * would force them onto every fashion demo.
 */
const MAISON_CATEGORIES: { label: string; value: ProductCategory }[] = [
  { label: 'Leather goods', value: 'leather-goods' as ProductCategory },
  { label: 'Jewelry',       value: 'jewelry' as ProductCategory },
  { label: 'Outerwear',     value: 'outerwear' as ProductCategory },
  { label: 'Lifestyle',     value: 'lifestyle' as ProductCategory },
];

/**
 * LuxuryHeader — sticky kamon-marked nav.
 *
 * Lives outside the per-page panels so it stays in place across navigation.
 * Mirrors the structure of `_layout.html`'s nav from the Flask reference,
 * but uses the SPA's StoreContext / CartContext / CustomerContext so every
 * Salesforce-Personalization, Merkury, and Data Cloud signal still fires.
 */
export const LuxuryHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigateHome, navigateToCategory, navigateToCart, navigateToAccount } = useStore();
  const { itemCount } = useCart();
  const { isAuthenticated } = useCustomer();
  const { config } = useDemo();

  const path = location.pathname;

  return (
    <header className="tk-nav">
      <div className="tk-nav__inner">
        {/* Brand — kamon + name + JP characters */}
        <button onClick={navigateHome} className="tk-nav__brand" aria-label={`${config.brandName} home`}>
          <Kamon className="kamon" size={28} />
          <span>
            <span className="tk-nav__brand-name">{config.brandName}</span>
            <span className="tk-nav__brand-jp">橘</span>
          </span>
        </button>

        {/* Section nav — four maison categories + three editorial sections.
            `copy` is intentionally not consulted here; the maison's category
            taxonomy differs from generic fashion. */}
        <nav className="tk-nav__links" aria-label="Primary">
          {MAISON_CATEGORIES.map((c) => (
            <button
              key={c.value as string}
              type="button"
              className={`tk-nav__link ${path === `/shop/${c.value}` ? 'is-active' : ''}`}
              onClick={() => navigateToCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
          <button
            type="button"
            className={`tk-nav__link ${path === '/atelier' ? 'is-active' : ''}`}
            onClick={() => navigate('/atelier')}
          >
            Atelier
          </button>
          <button
            type="button"
            className={`tk-nav__link ${path === '/journal' ? 'is-active' : ''}`}
            onClick={() => navigate('/journal')}
          >
            Journal
          </button>
          <button
            type="button"
            className={`tk-nav__link ${path === '/restoration' ? 'is-active' : ''}`}
            onClick={() => navigate('/restoration')}
          >
            Restoration
          </button>
        </nav>

        {/* Right utilities — Sign In / My Maison + Bantō + Bag.
            Sign-in lives here rather than in the primary nav so the
            7-item nav has room to breathe between brand and the
            utility cluster. */}
        <div className="tk-flex tk-gap" style={{ alignItems: 'center', gap: 18, flexShrink: 0 }}>
          <button
            type="button"
            className={`tk-nav__link ${path === '/account' ? 'is-active' : ''}`}
            onClick={() => navigateToAccount()}
          >
            {isAuthenticated ? 'My Maison' : 'Sign in'}
          </button>
          <button
            type="button"
            className="tk-nav__link"
            onClick={() => navigate('/advisor')}
            aria-label="Speak with your Bantō"
          >
            Bantō
          </button>
          <button
            type="button"
            onClick={navigateToCart}
            className="tk-nav__link"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            aria-label="Bag"
          >
            Bag{itemCount > 0 ? ` · ${itemCount}` : ''}
          </button>
        </div>
      </div>
    </header>
  );
};
