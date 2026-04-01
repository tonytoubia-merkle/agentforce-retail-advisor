import { useState, useMemo } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SceneProvider } from '@/contexts/SceneContext';
import { ConversationProvider } from '@/contexts/ConversationContext';
import { CustomerProvider } from '@/contexts/CustomerContext';
import { CampaignProvider } from '@/contexts/CampaignContext';
import { CartProvider } from '@/contexts/CartContext';
import { StoreProvider } from '@/contexts/StoreContext';
import { ActivityToastProvider } from '@/components/ActivityToast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdvisorPage } from '@/components/AdvisorPage';
import { StorefrontPage } from '@/components/Storefront';
import { MediaWallPage } from '@/components/MediaWall';
import { ProductProvider } from '@/contexts/ProductContext';
import { resolveUTMToCampaign } from '@/mocks/adCreatives';
import { setPersonalizationCampaign } from '@/services/personalization';
import { pushUtmToDataLayer } from '@/services/merkury/dataLayer';
import { DemoLog } from '@/components/DemoLog';
import type { CampaignAttribution } from '@/types/campaign';


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
 */
function SkinAdvisorWrapper() {
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
function AppShell({ initialCampaign }: { initialCampaign: CampaignAttribution | null }) {
  return (
    <ProductProvider>
      <CampaignProvider initialCampaign={initialCampaign}>
        <CartProvider>
          <StoreProvider>
            <SceneProvider>
              <ActivityToastProvider>
                <AnimatedRoutes />
              </ActivityToastProvider>
            </SceneProvider>
          </StoreProvider>
        </CartProvider>
      </CampaignProvider>
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

  return (
    <ErrorBoundary>
      <CustomerProvider>
        <div className="flex h-screen w-screen overflow-hidden">
          <div className={`flex-1 min-w-0 overflow-y-auto transition-all duration-300 ${demoLogOpen ? 'mr-[380px]' : ''}`}>
            <AppShell initialCampaign={initialCampaign} />
          </div>
          <DemoLog onOpenChange={setDemoLogOpen} />
        </div>
      </CustomerProvider>
    </ErrorBoundary>
  );
}

export default App;
