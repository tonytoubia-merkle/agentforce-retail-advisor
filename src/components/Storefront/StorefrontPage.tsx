import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreHeader } from './StoreHeader';
import { HeroBanner } from './HeroBanner';
import { ProductSection } from './ProductSection';
import { CategoryPage } from './CategoryPage';
import { ProductDetailPage } from './ProductDetailPage';
import { CartPage } from './CartPage';
import { CheckoutPage } from './CheckoutPage';
import { OrderConfirmationPage } from './OrderConfirmationPage';
import { AccountPage } from './AccountPage';
import { AppointmentBooking } from './AppointmentBooking';
import { EmailSignup } from './EmailSignup';
import { ExitIntentOverlay } from './ExitIntentOverlay';
import { RecommendationsCarousel } from './RecommendationsCarousel';
import { useStore } from '@/contexts/StoreContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { useBrowseTracking } from '@/hooks/useBrowseTracking';
import { useProducts } from '@/contexts/ProductContext';
import { useDemo } from '@/contexts/DemoContext';
import type { Product, ProductCategory } from '@/types/product';

export const StorefrontPage: React.FC = () => {
  const { products, loading: productsLoading } = useProducts();
  const { view, selectedCategory, selectedProduct, navigateHome, navigateToCategory } = useStore();
  const { customer, isAuthenticated } = useCustomer();
  const { config, copy } = useDemo();
  const isBeauty = config.vertical === 'beauty';
  const firstCategory = copy.catalogNav[0]?.value || 'moisturizer';
  // Soft pastel tints applied in order to whatever catalogNav the vertical ships with.
  const CAT_TINTS = [
    'from-rose-100 to-pink-100',
    'from-sky-100 to-blue-100',
    'from-purple-100 to-violet-100',
    'from-amber-100 to-yellow-100',
    'from-emerald-100 to-green-100',
    'from-orange-100 to-amber-100',
    'from-teal-100 to-cyan-100',
    'from-violet-100 to-purple-100',
  ];
  const navigate = useNavigate();
  const navigateToAdvisor = useCallback(() => navigate('/advisor'), [navigate]);
  const navigateToSkinAdvisor = useCallback(() => navigate('/skin-advisor'), [navigate]);
  useBrowseTracking();

  // Group products by category for home page sections
  const productGroups = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach((p) => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [products]);

  // Get featured/bestseller products
  const featuredProducts = useMemo(() => {
    return products
      .filter((p) => (p.personalizationScore || 0) > 0.8 || p.rating > 4.5)
      .slice(0, 8);
  }, [products]);

  // Get new arrivals (just use first 8 for demo)
  const newArrivals = useMemo(() => {
    return products.slice(0, 8);
  }, [products]);

  // Skincare products
  const skincareProducts = useMemo(() => {
    return products
      .filter((p) =>
        ['moisturizer', 'cleanser', 'serum', 'sunscreen', 'mask', 'toner', 'eye-cream', 'spot-treatment'].includes(
          p.category
        )
      )
      .slice(0, 4);
  }, [products]);

  // Makeup products
  const makeupProducts = useMemo(() => {
    return products
      .filter((p) => ['foundation', 'lipstick', 'mascara', 'blush'].includes(p.category))
      .slice(0, 4);
  }, [products]);

  // Haircare products
  const haircareProducts = useMemo(() => {
    return products
      .filter((p) => ['shampoo', 'conditioner', 'hair-treatment'].includes(p.category))
      .slice(0, 4);
  }, [products]);

  // Fragrance products
  const fragranceProducts = useMemo(() => {
    return products.filter((p) => p.category === 'fragrance').slice(0, 4);
  }, [products]);

  const renderContent = () => {
    switch (view) {
      case 'category':
        if (!selectedCategory) return null;
        return <CategoryPage category={selectedCategory} products={products} />;

      case 'product':
        if (!selectedProduct) return null;
        return (
          <ProductDetailPage
            product={selectedProduct}
          />
        );

      case 'cart':
        return <CartPage />;

      case 'checkout':
        return <CheckoutPage />;

      case 'order-confirmation':
        return <OrderConfirmationPage />;

      case 'account':
        return <AccountPage />;

      case 'appointment':
        return <AppointmentBooking />;

      case 'home':
      default:
        return (
          <>
            <HeroBanner
              onShopNow={() => navigateToCategory(firstCategory as ProductCategory)}
              customer={customer}
              isAuthenticated={isAuthenticated}
            />

            {/* Loyalty banner for authenticated members */}
            {isAuthenticated && customer?.loyalty && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-3 text-sm">
                  <span className="text-amber-800 font-medium">
                    You have {customer.loyalty.pointsBalance?.toLocaleString()} points, {customer.name?.split(' ')[0]}!
                  </span>
                  <span className="text-amber-600 capitalize">
                    {customer.loyalty.tier} Member
                  </span>
                  <span className="text-amber-600">—</span>
                  <span className="text-amber-700">
                    Redeem for up to ${Math.floor((customer.loyalty.pointsBalance || 0) / 100)} off
                  </span>
                </div>
              </div>
            )}

            {/* SF Personalization — Product Recommendations */}
            <RecommendationsCarousel products={products} />

            {/* Categories quick links — grid is driven by vertical-aware catalogNav. */}
            {copy.catalogNav.length > 0 && (
              <section className="py-12 bg-stone-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                  <h2 className="text-2xl sm:text-3xl font-medium text-stone-900 mb-8 text-center">
                    Shop by {copy.catalogLabel === 'Flights' ? 'Route' : 'Category'}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {copy.catalogNav.map((cat, i) => (
                      <button
                        key={cat.value}
                        onClick={() => navigateToCategory(cat.value as ProductCategory)}
                        className={`bg-gradient-to-br ${CAT_TINTS[i % CAT_TINTS.length]} rounded-2xl p-6 sm:p-8 text-center hover:shadow-lg transition-shadow group`}
                      >
                        <span className="text-lg font-medium text-stone-900 group-hover:text-rose-600 transition-colors">
                          {cat.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Skincare Section (beauty-only) */}
            {isBeauty && skincareProducts.length > 0 && (
              <ProductSection
                title="Skincare Essentials"
                subtitle="Build your perfect routine"
                products={skincareProducts}
                showViewAll
                onViewAll={() => navigateToCategory('moisturizer' as ProductCategory)}
              />
            )}

            {/* Advisor CTA — background + button use demo theme */}
            <section
              className="py-16"
              style={{
                background: `linear-gradient(135deg, ${config.theme.accentColor}14, ${config.theme.primaryColor}10, ${config.theme.accentColor}14)`,
              }}
            >
              <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                <div
                  className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: config.theme.primaryColor }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-3xl sm:text-4xl font-medium text-stone-900 mb-4">
                  Not sure what to get?
                </h2>
                <p className="text-lg text-stone-600 mb-8 max-w-2xl mx-auto">
                  {copy.advisorDescription}
                </p>
                <button
                  onClick={() => navigateToAdvisor()}
                  className="px-8 py-4 text-white font-medium rounded-full hover:shadow-xl transition-all text-lg"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${config.theme.accentColor}, ${config.theme.primaryColor})`,
                  }}
                >
                  {copy.talkToCTA}
                </button>
              </div>
            </section>

            {/* Makeup Section (beauty-only) */}
            {isBeauty && makeupProducts.length > 0 && (
              <ProductSection
                title="Makeup Must-Haves"
                subtitle="Color that inspires"
                products={makeupProducts}
                showViewAll
                onViewAll={() => navigateToCategory('foundation' as ProductCategory)}
              />
            )}

            {/* Haircare Section (beauty-only) */}
            {isBeauty && haircareProducts.length > 0 && (
              <div className="bg-stone-50">
                <ProductSection
                  title="Hair Care"
                  subtitle="Healthy hair, beautiful you"
                  products={haircareProducts}
                  showViewAll
                  onViewAll={() => navigateToCategory('shampoo' as ProductCategory)}
                />
              </div>
            )}

            {/* Fragrance Section (beauty-only) */}
            {isBeauty && fragranceProducts.length > 0 && (
              <ProductSection
                title="Signature Scents"
                subtitle="Find your perfect fragrance"
                products={fragranceProducts}
                showViewAll
                onViewAll={() => navigateToCategory('fragrance' as ProductCategory)}
              />
            )}

            {/* Non-beauty: one ProductSection per catalogNav entry that has products */}
            {!isBeauty && copy.catalogNav.map((cat, i) => {
              const items = productGroups[cat.value];
              if (!items || items.length === 0) return null;
              const stripe = i % 2 === 1 ? 'bg-stone-50' : undefined;
              return (
                <div key={cat.value} className={stripe}>
                  <ProductSection
                    title={cat.label}
                    products={items.slice(0, 8)}
                    showViewAll
                    onViewAll={() => navigateToCategory(cat.value as ProductCategory)}
                  />
                </div>
              );
            })}

            {/* New Arrivals */}
            {newArrivals.length > 0 && (
              <div className="bg-stone-50">
                <ProductSection
                  title="New Arrivals"
                  subtitle="Fresh picks just for you"
                  products={newArrivals}
                />
              </div>
            )}

            {/* Secondary Advisor Hero — vertical-aware. Beauty shows skin analyzer;
                travel shows trip concierge; fashion shows stylist; wellness/cpg hide it. */}
            {copy.secondaryAdvisorHero && (
              <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-rose-950 to-purple-950 py-20 px-4">
                {/* decorative background blobs */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-20 -left-20 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-400/10 rounded-full blur-2xl" />
                </div>

                <div className="relative max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                  {/* Left: text */}
                  <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 border border-rose-400/30 rounded-full text-rose-300 text-xs font-medium tracking-wide uppercase mb-5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      {copy.secondaryAdvisorHero.eyebrow}
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-light text-white leading-tight mb-4">
                      {copy.secondaryAdvisorHero.title}<br />
                      <span className="font-semibold bg-gradient-to-r from-rose-300 to-purple-300 bg-clip-text text-transparent">
                        {copy.secondaryAdvisorHero.titleAccent}
                      </span>
                    </h2>
                    <p className="text-lg text-white/60 mb-8 max-w-lg mx-auto lg:mx-0">
                      {copy.secondaryAdvisorHero.description}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                      <button
                        onClick={copy.secondaryAdvisorRoute === 'skin' ? navigateToSkinAdvisor : navigateToAdvisor}
                        className="group px-8 py-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-rose-500/40 hover:scale-105 transition-all duration-200 text-base"
                      >
                        <span className="flex items-center gap-2 justify-center">
                          {copy.secondaryAdvisorHero.primaryCTA}
                        </span>
                      </button>
                      <button
                        onClick={navigateToAdvisor}
                        className="px-8 py-4 bg-white/10 border border-white/20 text-white/80 font-medium rounded-full hover:bg-white/15 hover:text-white transition-all text-base"
                      >
                        {copy.secondaryAdvisorHero.secondaryCTA}
                      </button>
                    </div>
                  </div>

                  {/* Right: feature chips */}
                  <div className="flex-shrink-0 grid grid-cols-2 gap-3 lg:w-72">
                    {copy.secondaryAdvisorHero.chips.map(({ icon, title, desc }) => (
                      <div key={title} className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                        <div className="text-2xl mb-2">{icon}</div>
                        <div className="text-white text-sm font-semibold mb-0.5">{title}</div>
                        <div className="text-white/50 text-xs leading-snug">{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Email Signup */}
            <EmailSignup />

            {/* Footer */}
            <footer className="text-white py-16" style={{ backgroundColor: config.theme.primaryColor }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {(config.brandName || 'B')[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xl font-semibold">
                        {config.id === 'default' && config.brandName === 'SERENE' ? 'BEAUTÉ' : config.brandName}
                      </span>
                    </div>
                    <p className="text-stone-400 text-sm">
                      {config.brandTagline || copy.heroDefaultTagline}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Shop</h4>
                    <ul className="space-y-2 text-sm text-stone-400">
                      {copy.catalogNav.slice(0, 4).map((cat) => (
                        <li key={cat.value}>
                          <button
                            onClick={() => navigateToCategory(cat.value as ProductCategory)}
                            className="hover:text-white transition-colors"
                          >
                            {cat.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Help</h4>
                    <ul className="space-y-2 text-sm text-stone-400">
                      <li><button className="hover:text-white transition-colors">Contact Us</button></li>
                      <li><button className="hover:text-white transition-colors">Shipping</button></li>
                      <li><button className="hover:text-white transition-colors">Returns</button></li>
                      <li><button className="hover:text-white transition-colors">FAQ</button></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Connect</h4>
                    <div className="flex gap-4">
                      <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                        </svg>
                      </button>
                      <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="border-t border-stone-800 mt-12 pt-8 text-center text-sm text-stone-500">
                  <p>© 2024 BEAUTÉ. All rights reserved. Demo site for Merkle x Agentforce.</p>
                </div>
              </div>
            </footer>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader />
      {renderContent()}
      <ExitIntentOverlay />
    </div>
  );
};
