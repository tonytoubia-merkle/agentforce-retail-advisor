import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { useDemo } from '@/contexts/DemoContext';
import { Kamon } from './Kamon';
import type { ProductCategory } from '@/types/product';

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
  const { config, copy } = useDemo();

  const path = location.pathname;
  const isActive = (test: (p: string) => boolean) => test(path);

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

        {/* Section nav — Maison / Atelier / Journal / My Maison */}
        <nav className="tk-nav__links" aria-label="Primary">
          <button
            type="button"
            className={`tk-nav__link ${isActive((p) => p.startsWith('/shop')) ? 'is-active' : ''}`}
            onClick={() => navigateToCategory((copy.catalogNav[0]?.value || 'all') as ProductCategory)}
          >
            Maison
          </button>
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
          <button
            type="button"
            className={`tk-nav__link ${path === '/account' ? 'is-active' : ''}`}
            onClick={() => navigateToAccount()}
          >
            {isAuthenticated ? 'My Maison' : 'Sign in'}
          </button>
        </nav>

        {/* Right utilities — quiet bag + advisor */}
        <div className="tk-flex tk-gap" style={{ alignItems: 'center', gap: 24 }}>
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
