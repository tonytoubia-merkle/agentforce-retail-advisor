import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { useProducts } from '@/contexts/ProductContext';
import { useBrowseTracking } from '@/hooks/useBrowseTracking';
import { LuxuryHeader } from './LuxuryHeader';
import { LuxuryFooter } from './LuxuryFooter';
import { LuxuryHome } from './LuxuryHome';
import { LuxuryCategoryPage } from './LuxuryCategoryPage';
import { LuxuryProductDetailPage } from './LuxuryProductDetailPage';
import { LuxuryCartPage } from './LuxuryCartPage';
import { LuxuryCheckoutPage } from './LuxuryCheckoutPage';
import { LuxuryAccountPage } from './LuxuryAccountPage';
import { LuxuryAtelierPage } from './LuxuryAtelierPage';
import { LuxuryJournalPage } from './LuxuryJournalPage';
import { LuxuryRestorationPage } from './LuxuryRestorationPage';
import { LuxuryOrderConfirmation } from './LuxuryOrderConfirmation';
import './luxury.css';

/**
 * LuxuryStorefrontPage — entry for `storefrontStyle = 'luxury_maison'`.
 *
 * Mirrors the dispatcher pattern of the default StorefrontPage:
 *   - Uses StoreContext's `view` for shop / cart / checkout / account
 *   - Reads location.pathname directly for the maison-only routes
 *     (/atelier, /journal, /restoration), since those are not modeled
 *     in the shared StoreView union.
 *
 * All Salesforce wiring is unchanged: ProductContext, CartContext,
 * CustomerContext, browse-tracking, Personalization SDK, Merkury, Data
 * Cloud — exactly as the default storefront.
 */
export const LuxuryStorefrontPage: React.FC = () => {
  const { view, selectedCategory, selectedProduct } = useStore();
  const { products } = useProducts();
  const location = useLocation();
  useBrowseTracking();

  // Mark the body so the luxury CSS only applies inside this tree.
  // (kept on a wrapper div as well so SSR / strict-mode isn't fragile)
  useEffect(() => {
    document.body.classList.add('tk-luxury-body');
    return () => document.body.classList.remove('tk-luxury-body');
  }, []);

  const renderContent = () => {
    // Maison-only paths — these routes don't exist in the default StoreView.
    if (location.pathname === '/atelier')      return <LuxuryAtelierPage />;
    if (location.pathname === '/journal')      return <LuxuryJournalPage />;
    if (location.pathname === '/restoration')  return <LuxuryRestorationPage />;

    switch (view) {
      case 'category':
        if (!selectedCategory) return null;
        return <LuxuryCategoryPage category={selectedCategory} products={products} />;
      case 'product':
        if (!selectedProduct) return null;
        return <LuxuryProductDetailPage product={selectedProduct} />;
      case 'cart':
        return <LuxuryCartPage />;
      case 'checkout':
        return <LuxuryCheckoutPage />;
      case 'account':
        return <LuxuryAccountPage />;
      case 'order-confirmation':
        return <LuxuryOrderConfirmation />;
      case 'home':
      default:
        return <LuxuryHome />;
    }
  };

  return (
    <div className="tk-luxury">
      <LuxuryHeader />
      {renderContent()}
      <LuxuryFooter />
    </div>
  );
};
