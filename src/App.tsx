import { lazy, useState, useMemo } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import { LeadScoreBadge } from '@/components/MerkuryLeadScore/LeadScoreBadge';
import { ProductProvider } from '@/contexts/ProductContext';
import { resolveUTMToCampaign } from '@/mocks/adCreatives';
import { setPersonalizationCampaign } from '@/services/personalization';
import { pushUtmToDataLayer } from '@/services/merkury/dataLayer';
import { DemoLog } from '@/components/DemoLog';
import type { CampaignAttribution } from '@/types/campaign';

// Lazy-load admin components — they pull in Supabase which isn't needed for the demo path
const AdminLayout = lazy(() => import('@/components/Admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const DemoDashboard = lazy(() => import('@/components/Admin/DemoDashboard').then(m => ({ default: m.DemoDashboard })));
const NewDemoWizard = lazy(() => import('@/components/Admin/NewDemoWizard').then(m => ({ default: m.NewDemoWizard })));
const DemoDetail = lazy(() => import('@/components/Admin/DemoDetail').then(m => ({ default: m.DemoDetail })));


/**
 * AdvisorWrapper — wraps AdvisorPage (beauty mode) with ConversationProvider.
 */
function AdvisorWrapper() {
  return (
    <ConversationProvider>
      <AdvisorPage mode="beauty" />
    </ConversationProvider>
  );
}

/**
 * SkinAdvisorWrapper — wraps AdvisorPage in skin-concierge mode.
 * Uses its own ConversationProvider (with skin concierge agent ID) so history
 * and session are fully isolated from the beauty advisor.
 *
 * Gated by `copy.secondaryAdvisorRoute === 'skin'` — a non-beauty demo
 * (e.g. travel) that deep-links to `/skin-advisor` gets redirected to the
 * main advisor instead of rendering a beauty-only flow.
 */
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

/**
 * AnimatedRoutes — wraps Routes in AnimatePresence.
 * Uses a section-level key so only storefront ↔ advisor ↔ media transitions fade.
 */
function AnimatedRoutes() {
  const location = useLocation();

  const animationKey = useMemo(() => {
    if (location.pathname === '/advisor') return 'advisor';
    if (location.pathname === '/skin-advisor') return 'skin-advisor';
    if (location.pathname === '/media-wall') return 'media';
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
        <Routes location={location}>
          <Route path="/advisor" element={<AdvisorWrapper />} />
          <Route path="/skin-advisor" element={<SkinAdvisorWrapper />} />
          <Route path="/media-wall" element={<MediaWallPage />} />
          <Route path="*" element={<StorefrontPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * AppShell — provider tree + animated routes.
 */
function AppShell() {
  return (
    <ProductProvider>
      <CartProvider>
        <StoreProvider>
          <SceneProvider>
            <ActivityToastProvider>
              <AnimatedRoutes />
              {/* Floating Merkury lead-score badge — self-gates on
                  featureFlags.leadScoreCard, renders null otherwise. */}
              <LeadScoreBadge />
            </ActivityToastProvider>
          </SceneProvider>
        </StoreProvider>
      </CartProvider>
    </ProductProvider>
  );
}

/**
 * Root App — parses UTM params once on mount (before any providers),
 * then hands the result to AppShell as initialCampaign.
 */
function App() {
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

  const isAdminRoute = window.location.pathname.startsWith('/admin');

  // Admin routes — completely separate UI, no demo providers needed
  if (isAdminRoute) {
    return (
      <ErrorBoundary>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DemoDashboard />} />
            <Route path="new" element={<NewDemoWizard />} />
            <Route path="demo/:demoId" element={<DemoDetail />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    );
  }

  // Demo routes — original app with DemoProvider wrapper
  return (
    <ErrorBoundary>
      <DemoProvider>
        <CustomerProvider>
          <CampaignProvider initialCampaign={initialCampaign}>
            <div className="h-screen overflow-hidden flex">
              <main className={`h-full flex-1 min-w-0 overflow-y-scroll overflow-x-hidden ${demoLogOpen ? 'w-[calc(100%-380px)]' : 'w-full'}`}>
                <AppShell />
              </main>
              <DemoLog onOpenChange={setDemoLogOpen} />
            </div>
          </CampaignProvider>
        </CustomerProvider>
      </DemoProvider>
    </ErrorBoundary>
  );
}

export default App;
