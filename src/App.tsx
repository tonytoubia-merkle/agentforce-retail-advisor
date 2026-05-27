import { lazy, Suspense, useState, useMemo } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SceneProvider } from '@/contexts/SceneContext';
import { ConversationProvider } from '@/contexts/ConversationContext';
import { CustomerProvider } from '@/contexts/CustomerContext';
import { CampaignProvider } from '@/contexts/CampaignContext';
import { CartProvider } from '@/contexts/CartContext';
import { StoreProvider } from '@/contexts/StoreContext';
import { DemoProvider, useDemo } from '@/contexts/DemoContext';
import { ActivityToastProvider } from '@/components/ActivityToast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdvisorPage } from '@/components/AdvisorPage';
import { StorefrontPage } from '@/components/Storefront';
import { MediaWallPage } from '@/components/MediaWall';
import { HistoryWallPage } from '@/components/HistoryWall';
import { LeadScoreBadge } from '@/components/MerkuryLeadScore/LeadScoreBadge';
import { ProductProvider } from '@/contexts/ProductContext';
import { resolveUTMToCampaign } from '@/mocks/adCreatives';
import { setPersonalizationCampaign } from '@/services/personalization';
import { pushUtmToDataLayer } from '@/services/merkury/dataLayer';
import { DemoLog } from '@/components/DemoLog';
import { productDetailLoader } from '@/routes/productDetailLoader';
import { ProductDetailRoute, ProductDetailErrorBoundary } from '@/routes/ProductDetailRoute';
import { catalogLoader } from '@/routes/catalogLoader';
import { categoryLoader, productByCategoryLoader } from '@/routes/shopLoaders';
import type { CampaignAttribution } from '@/types/campaign';

// Lazy admin section — pulls in Supabase, not needed on the demo path
const AdminLayout = lazy(() => import('@/components/Admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const DemoDashboard = lazy(() => import('@/components/Admin/DemoDashboard').then(m => ({ default: m.DemoDashboard })));
const NewDemoWizard = lazy(() => import('@/components/Admin/NewDemoWizard').then(m => ({ default: m.NewDemoWizard })));
const DemoDetail = lazy(() => import('@/components/Admin/DemoDetail').then(m => ({ default: m.DemoDetail })));

// ── Advisor wrappers ────────────────────────────────────────────────────────

function AdvisorWrapper() {
  return (
    <ConversationProvider>
      <AdvisorPage mode="beauty" />
    </ConversationProvider>
  );
}

function SkinAdvisorWrapper() {
  const { copy } = useDemo();
  if (copy.secondaryAdvisorRoute !== 'skin') {
    return <Navigate to="/advisor" replace />;
  }
  const skinAgentId = import.meta.env.VITE_SKIN_ADVISOR_AGENT_ID as string | undefined;
  return (
    <ConversationProvider agentId={skinAgentId}>
      <AdvisorPage mode="skin-concierge" />
    </ConversationProvider>
  );
}

// ── Animated outlet — fades between top-level sections ──────────────────────

function AnimatedOutlet() {
  const location = useLocation();

  const animationKey = useMemo(() => {
    if (location.pathname === '/advisor') return 'advisor';
    if (location.pathname === '/skin-advisor') return 'skin-advisor';
    if (location.pathname === '/media-wall') return 'media';
    if (location.pathname === '/history-wall') return 'history-wall';
    if (location.pathname.startsWith('/p/')) return 'product-detail';
    return 'storefront';
  }, [location.pathname]);

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={animationKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={animationKey === 'advisor' || animationKey === 'skin-advisor' ? 'relative' : undefined}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

// ── Demo root — provider stack + animated outlet ────────────────────────────

function DemoRoot() {
  // Parse UTM from URL once on mount (lazy initializer — no re-renders).
  // UTM demoLog entries are NOT logged here — they fire from useBrowseTracking
  // (inside StorefrontPage) after DemoLog is mounted and polling.
  const [initialCampaign] = useState<CampaignAttribution | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    if (utmSource) {
      const utmCampaign = params.get('utm_campaign') || '';
      const utmMedium = params.get('utm_medium') || '';
      setPersonalizationCampaign(utmCampaign, utmSource, utmMedium);
      pushUtmToDataLayer(utmCampaign, utmSource, utmMedium);
      const attribution = resolveUTMToCampaign(params);
      window.history.replaceState({}, '', window.location.pathname);
      return attribution;
    }
    return null;
  });

  const [demoLogOpen, setDemoLogOpen] = useState(false);

  return (
    <ErrorBoundary>
      <DemoProvider>
        <CustomerProvider>
          <CampaignProvider initialCampaign={initialCampaign}>
            <div className="h-screen overflow-hidden flex">
              <main className={`relative h-full flex-1 min-w-0 overflow-y-scroll overflow-x-hidden ${demoLogOpen ? 'w-[calc(100%-380px)]' : 'w-full'}`}>
                <ProductProvider>
                  <CartProvider>
                    <StoreProvider>
                      <SceneProvider>
                        <ActivityToastProvider>
                          <AnimatedOutlet />
                          {/* Floating Merkury lead-score badge — self-gates on
                              featureFlags.leadScoreCard, renders null otherwise. */}
                          <LeadScoreBadge />
                        </ActivityToastProvider>
                      </SceneProvider>
                    </StoreProvider>
                  </CartProvider>
                </ProductProvider>
              </main>
              <DemoLog onOpenChange={setDemoLogOpen} />
            </div>
          </CampaignProvider>
        </CustomerProvider>
      </DemoProvider>
    </ErrorBoundary>
  );
}

// ── Admin root — no demo providers ──────────────────────────────────────────

function AdminRoot() {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <AdminLayout />
      </Suspense>
    </ErrorBoundary>
  );
}

const lazyAdmin = (El: React.ComponentType) => (
  <Suspense fallback={null}>
    <El />
  </Suspense>
);

// ── Router definition ───────────────────────────────────────────────────────

const router = createBrowserRouter([
  {
    path: '/admin',
    element: <AdminRoot />,
    children: [
      { index: true, element: lazyAdmin(DemoDashboard) },
      { path: 'new', element: lazyAdmin(NewDemoWizard) },
      { path: 'demo/:demoId', element: lazyAdmin(DemoDetail) },
    ],
  },
  {
    path: '/',
    element: <DemoRoot />,
    // Root catalog loader (Phase 2C) — replaces the useEffect fetch in
    // ProductProvider. id is referenced by useRouteLoaderData('demo-root').
    id: 'demo-root',
    loader: catalogLoader,
    children: [
      { path: 'advisor', element: <AdvisorWrapper /> },
      { path: 'skin-advisor', element: <SkinAdvisorWrapper /> },
      { path: 'media-wall', element: <MediaWallPage /> },
      { path: 'history-wall', element: <HistoryWallPage /> },
      // Phase 2B pilot: data-router route fetching a single product through
      // getCommerceBackend() (Connect API today, SCAPI when the flag flips).
      {
        path: 'p/:salesforceId',
        element: <ProductDetailRoute />,
        loader: productDetailLoader,
        errorElement: <ProductDetailErrorBoundary />,
      },
      // Phase 2C: explicit shop routes with per-route loaders. Element stays
      // StorefrontPage so the storefront chrome (header, banners, luxury
      // variant) renders the same as before — the loaders make the data
      // dependency explicit and give each route its own error surface.
      // Phase 3d: route ids so CategoryPage / ProductDetailPage can consume
      // the loader data via useRouteLoaderData() (with prop fallback).
      {
        id: 'shop-product',
        path: 'shop/:category/:productId',
        element: <StorefrontPage />,
        loader: productByCategoryLoader,
      },
      {
        id: 'shop-category',
        path: 'shop/:category',
        element: <StorefrontPage />,
        loader: categoryLoader,
      },
      // Catch-all — StorefrontPage derives view from URL via StoreContext
      // for the remaining paths (/, /cart, /checkout, /account, /appointment,
      // /order-confirmation).
      { path: '*', element: <StorefrontPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
