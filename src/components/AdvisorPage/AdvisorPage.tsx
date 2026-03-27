import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useScene } from '@/contexts/SceneContext';
import { useConversation } from '@/contexts/ConversationContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { GenerativeBackground } from '@/components/GenerativeBackground';
import { ChatInterface } from '@/components/ChatInterface';
import { CheckoutOverlay } from '@/components/CheckoutOverlay';
import { SkinAnalysisModal, SkinConciergeWelcome } from '@/components/SkinAnalysis';
import { RetailerHandoff } from '@/components/RetailerHandoff';
import { WelcomeScreen } from '@/components/WelcomeScreen/WelcomeScreen';
import { WelcomeLoader } from '@/components/WelcomeScreen/WelcomeLoader';
import { DemoPanel } from '@/components/Storefront/DemoPanel';
import { ProfileDropdown } from '@/components/Storefront/ProfileDropdown';
import type { AdvisorMode } from '@/types/scene';

interface AdvisorPageProps {
  mode?: AdvisorMode;
}

export const AdvisorPage: React.FC<AdvisorPageProps> = ({ mode = 'beauty' }) => {
  const { scene, setAdvisorMode } = useScene();
  const { messages, sendMessage, isAgentTyping, isLoadingWelcome, suggestedActions } = useConversation();
  const navigate = useNavigate();
  const location = useLocation();
  const { customer } = useCustomer();
  const productContextSent = useRef(false);

  // Skin concierge has its own landing — show it until the user takes an action
  const [skinWelcomeActive, setSkinWelcomeActive] = useState(mode === 'skin-concierge');

  // Sync mode into SceneContext so product cards read it without prop drilling
  useEffect(() => {
    setAdvisorMode(mode);
  }, [mode, setAdvisorMode]);

  // ─── Product Context from Storefront ─────────────────────────────
  // When user clicks "Ask our Beauty Advisor" from a product page,
  // auto-send a contextualized message based on identity tier.
  useEffect(() => {
    const state = location.state as { productContext?: Record<string, unknown> } | null;
    if (!state?.productContext || productContextSent.current || isLoadingWelcome) return;
    productContextSent.current = true;

    const p = state.productContext;
    const name = p.name as string || '';
    const brand = p.brand as string || '';
    const description = p.description as string || '';
    const price = p.price as number || 0;
    const concerns = (p.concerns as string[]) || [];
    const tier = customer?.merkuryIdentity?.identityTier || 'anonymous';

    // Build the message based on identity tier and data provenance
    let message = '';

    if (tier === 'known' && customer) {
      // KNOWN: Use 1P data (stated/observed) directly — reference their profile
      const profileConcerns = customer.beautyProfile?.concerns || [];
      const skinType = customer.beautyProfile?.skinType || '';
      const matchingConcerns = concerns.filter(c =>
        profileConcerns.some(pc => pc.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(pc.toLowerCase()))
      );

      if (matchingConcerns.length > 0) {
        message = `I'm looking at the ${name} by ${brand} ($${price}). I noticed it addresses ${matchingConcerns.join(' and ')}, which are concerns on my profile. Can you tell me more about how this would work for my ${skinType} skin?`;
      } else {
        message = `I'm interested in the ${name} by ${brand} ($${price}). Would this be a good fit for my ${skinType} skin? Any tips on how to incorporate it into my routine?`;
      }
    } else if (tier === 'appended' && customer?.appendedProfile) {
      // APPENDED: 3P data is INFLUENCE ONLY — do NOT reference it directly.
      // Frame as general interest, let the agent use appended signals silently.
      message = `I was just browsing and came across the ${name} by ${brand}. It looks interesting — can you tell me more about it and who it's best suited for?`;
    } else {
      // ANONYMOUS: No personalization — product description + open question
      message = `I'd like to learn more about the ${name} by ${brand} ($${price}). ${description ? description.split('.')[0] + '.' : ''} Can you help me understand if this would be right for me?`;
    }

    // Wait for welcome to finish, then send
    const timer = setTimeout(() => {
      sendMessage(message);
      // Clear the route state so refreshing doesn't re-send
      navigate(location.pathname, { replace: true, state: null });
    }, 500);

    return () => clearTimeout(timer);
  }, [location.state, isLoadingWelcome, customer, sendMessage, navigate, location.pathname]);

  // Skin concierge always uses a fixed consultative gradient — bypasses scene state entirely
  const SKIN_CONCIERGE_BG = {
    type: 'gradient' as const,
    value: 'linear-gradient(150deg, #071419 0%, #0d2530 35%, #0c2a34 55%, #0a1e28 80%, #051018 100%)',
  };

  return (
    <div className="relative min-h-screen">
      <GenerativeBackground
        background={mode === 'skin-concierge' ? SKIN_CONCIERGE_BG : scene.background}
        setting={scene.setting}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white bg-black/20 hover:bg-black/30 backdrop-blur-sm rounded-full transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Store
        </button>

        <div className="flex items-center gap-2">
          {mode === 'skin-concierge' && (
            <span className="px-3 py-1 text-xs font-medium text-white/70 bg-black/20 backdrop-blur-sm rounded-full border border-white/10">
              Skin Concierge
            </span>
          )}
          <ProfileDropdown />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'skin-concierge' && skinWelcomeActive ? (
          <SkinConciergeWelcome key="skin-welcome" onDismiss={() => setSkinWelcomeActive(false)} />
        ) : isLoadingWelcome ? (
          <WelcomeLoader key="loader" />
        ) : scene.welcomeActive ? (
          <WelcomeScreen key="welcome" />
        ) : (
          <motion.div
            key="main-chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 min-h-screen flex flex-col"
          >
            <ChatInterface
              position={scene.chatPosition}
              messages={messages}
              onSendMessage={sendMessage}
              isAgentTyping={isAgentTyping}
              isMinimized={scene.layout === 'checkout' || scene.retailerHandoffActive}
              suggestedActions={suggestedActions}
              sceneLayout={scene.layout}
              advisorMode={mode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beauty mode: standard checkout overlay */}
      {mode === 'beauty' && (
        <AnimatePresence>
          {scene.checkoutActive && <CheckoutOverlay />}
        </AnimatePresence>
      )}

      {/* Skin Concierge mode: skin analysis modal + retailer handoff */}
      {mode === 'skin-concierge' && (
        <>
          <AnimatePresence>
            {scene.skinAnalysisActive && <SkinAnalysisModal />}
          </AnimatePresence>
          <AnimatePresence>
            {scene.retailerHandoffActive && <RetailerHandoff />}
          </AnimatePresence>
        </>
      )}

      <DemoPanel />
    </div>
  );
};
