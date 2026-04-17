import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScene } from '@/contexts/SceneContext';
import { useConversation } from '@/contexts/ConversationContext';
import { useCart } from '@/contexts/CartContext';
import { useDemo } from '@/contexts/DemoContext';
import { ChatInterface } from '@/components/ChatInterface';
import { BundleCanvas } from './BundleCanvas';
import { ProductShowcaseCanvas } from './ProductShowcaseCanvas';
import { InlineCart } from './InlineCart';
import { GenerativeBackground } from '@/components/GenerativeBackground';
import type { Product } from '@/types/product';
import type { AdvisorMode } from '@/types/scene';

interface ImmersiveLayoutProps {
  mode: AdvisorMode;
}

/**
 * Two-pane immersive advisor experience inspired by Adobe Experience Concierge.
 *
 * LEFT (420px): persistent chat + inline cart, on a dark gradient panel
 * RIGHT (flex-1): editorial visual canvas — bundle hotspots, product showcases,
 *                 or generative background. Swapped dynamically based on the
 *                 latest agent message containing products.
 *
 * Differentiation from Adobe: chat on the LEFT (Adobe puts it on the right).
 *
 * Activated by config.featureFlags.enableImmersiveLayout — falls back to
 * the legacy full-screen chat experience for demos that opt out.
 */
export const ImmersiveLayout: React.FC<ImmersiveLayoutProps> = ({ mode }) => {
  const { scene } = useScene();
  const { messages, sendMessage, isAgentTyping, suggestedActions } = useConversation();
  const { items: cartItems } = useCart();
  const { copy } = useDemo();

  // Find the latest agent message that carried products — drives the canvas
  const latest = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== 'agent') continue;
      const products: Product[] | undefined = m.uiDirective?.payload?.products;
      if (products && products.length > 0) {
        return { id: m.id, products, content: m.content };
      }
    }
    return null;
  }, [messages]);

  const isBundle = (latest?.products?.length ?? 0) >= 2;

  // Derive a short title from the agent's first sentence — used above bundles
  const bundleTitle = useMemo(() => {
    if (!latest) return '';
    const firstSentence = latest.content.split(/[.!?\n]/).find((s) => s.trim().length > 0) || '';
    return firstSentence.trim().slice(0, 80);
  }, [latest]);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-black">
      {/* ── LEFT PANE: Chat + Cart ─────────────────────────────────────── */}
      <div className="flex flex-col w-[420px] min-w-[380px] max-w-[480px] h-full bg-gradient-to-b from-stone-900 via-stone-950 to-black border-r border-white/5 relative">
        {/* Chat fills available space */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <ChatInterface
            position="bottom"
            messages={messages}
            onSendMessage={sendMessage}
            isAgentTyping={isAgentTyping}
            suggestedActions={suggestedActions}
            sceneLayout={scene.layout}
            advisorMode={mode}
          />
        </div>

        {/* Inline cart drawer at bottom of left pane */}
        <AnimatePresence>
          {cartItems.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <InlineCart />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── RIGHT PANE: Visual canvas ─────────────────────────────────── */}
      <div className="flex-1 h-full relative overflow-hidden">
        {/* Ambient background — always present */}
        <GenerativeBackground background={scene.background} setting={scene.setting} />

        {/* Foreground — swaps based on agent's latest directive */}
        <AnimatePresence mode="wait">
          {latest && isBundle ? (
            <motion.div
              key={`bundle-${latest.id}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0"
            >
              <BundleCanvas
                products={latest.products}
                title={bundleTitle || `${copy.advisorName} picks`}
              />
            </motion.div>
          ) : latest ? (
            <motion.div
              key={`product-${latest.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0"
            >
              <ProductShowcaseCanvas products={latest.products} title={bundleTitle} />
            </motion.div>
          ) : (
            <motion.div
              key="empty-canvas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center px-8 text-white/40 max-w-md">
                <div className="text-6xl mb-4 opacity-60">{copy.chatIcon}</div>
                <p className="text-lg font-light">{copy.welcomePrompt}</p>
                <p className="text-sm mt-2 text-white/30">
                  Chat with your {copy.advisorName.toLowerCase()} — your recommendations come to life here.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle watermark in corner */}
        <div className="absolute top-4 right-6 text-white/30 text-xs font-light tracking-widest uppercase pointer-events-none">
          Live Experience
        </div>
      </div>

      {/* Hide this layout when checkout or handoff is active — those still use their overlays */}
      {(scene.checkoutActive || scene.retailerHandoffActive) && (
        <div aria-hidden className="sr-only" />
      )}
    </div>
  );
};
