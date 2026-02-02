import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AgentMessage } from '@/types/agent';
import type { CustomerSessionContext, CustomerProfile, AgentCapturedProfile, CapturedProfileField, ChatSummary } from '@/types/customer';
import { useScene } from './SceneContext';
import { useCustomer } from './CustomerContext';
import { generateMockResponse, setMockCustomerContext } from '@/services/mock/mockAgent';
import type { AgentResponse } from '@/types/agent';
import { getAgentforceClient } from '@/services/agentforce/client';
import { getDataCloudWriteService } from '@/services/datacloud';

const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

let sessionInitialized = false;

function buildSessionContext(customer: CustomerProfile): CustomerSessionContext {
  // Flatten recent orders into readable purchase summaries
  const recentOrders = (customer.orders || [])
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
    .slice(0, 3);
  const recentPurchases = recentOrders.flatMap((o) =>
    o.lineItems.map((li) => li.productId)
  );
  const recentActivity = recentOrders.map((o) => {
    const items = o.lineItems.map((li) => li.productName).join(', ');
    return `Order ${o.orderId} on ${o.orderDate} (${o.channel}): ${items}`;
  });

  // Chat context summaries
  const chatContext = (customer.chatSummaries || [])
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
    .slice(0, 3)
    .map((c) => `[${c.sessionDate}] ${c.summary}`);

  // Meaningful events
  const meaningfulEvents = (customer.meaningfulEvents || [])
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
    .map((e) => {
      const note = e.agentNote ? ` (Note: ${e.agentNote})` : '';
      return `[${e.capturedAt}] ${e.description}${note}`;
    });

  // Browse interests
  const browseInterests = (customer.browseSessions || [])
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
    .slice(0, 3)
    .map((b) => `Browsed ${b.categoriesBrowsed.join(', ')} on ${b.sessionDate} (${b.durationMinutes}min, ${b.device})`);

  // Also include legacy recentActivity if orders are empty
  if (!recentActivity.length && customer.recentActivity?.length) {
    recentActivity.push(...customer.recentActivity.map((a) => a.description));
  }
  if (!recentPurchases.length && customer.purchaseHistory?.length) {
    recentPurchases.push(...customer.purchaseHistory.map((p) => p.productId));
  }

  // Agent-captured profile fields — flatten to readable strings
  const captured = customer.agentCapturedProfile;
  const capturedProfile: string[] = [];
  const missingProfileFields: string[] = [];

  if (captured) {
    const fieldLabel: Record<string, string> = {
      birthday: 'Birthday', anniversary: 'Anniversary', partnerName: 'Partner name',
      giftsFor: 'Buys gifts for', upcomingOccasions: 'Upcoming occasions',
      morningRoutineTime: 'Morning routine', makeupFrequency: 'Makeup frequency',
      exerciseRoutine: 'Exercise', workEnvironment: 'Work environment',
      beautyPriority: 'Beauty priority', priceRange: 'Price sensitivity',
      sustainabilityPref: 'Sustainability', climateContext: 'Climate',
      waterIntake: 'Hydration habits', sleepPattern: 'Sleep pattern',
    };
    for (const [key, label] of Object.entries(fieldLabel)) {
      const field = captured[key as keyof AgentCapturedProfile] as CapturedProfileField | undefined;
      if (field) {
        const val = Array.isArray(field.value) ? field.value.join(', ') : field.value;
        capturedProfile.push(`${label}: ${val} (${field.confidence}, ${field.capturedFrom})`);
      } else {
        missingProfileFields.push(label);
      }
    }
  } else {
    // No captured profile at all — everything is missing
    missingProfileFields.push(
      'Birthday', 'Anniversary', 'Morning routine', 'Exercise',
      'Work environment', 'Beauty priority', 'Price sensitivity',
    );
  }

  return {
    customerId: customer.id,
    name: customer.name,
    email: customer.email,
    identityTier: customer.merkuryIdentity?.identityTier || 'anonymous',
    skinType: customer.beautyProfile.skinType,
    concerns: customer.beautyProfile.concerns,
    recentPurchases,
    recentActivity,
    appendedInterests: customer.appendedProfile?.interests || [],
    loyaltyTier: customer.loyalty?.tier || customer.loyaltyTier,
    loyaltyPoints: customer.loyalty?.pointsBalance,
    chatContext,
    meaningfulEvents,
    browseInterests,
    capturedProfile,
    missingProfileFields,
  };
}

/** Build a welcome message that embeds customer context so the agent can personalize. */
function buildWelcomeMessage(ctx: CustomerSessionContext): string {
  const isAppended = ctx.identityTier === 'appended';
  const isAnonymous = ctx.identityTier === 'anonymous';

  const lines: string[] = ['[WELCOME]'];

  if (isAppended) {
    // Appended: we resolved identity via Merkury but they never gave us their info directly.
    // DO NOT use their name or reference appended data directly — it would feel invasive.
    lines.push(`Customer: First-time visitor (identity resolved via Merkury, NOT a hand-raiser)`);
    lines.push(`Identity: appended`);
    lines.push(`[INSTRUCTION] Do NOT greet by name. Do NOT reference specific demographic or interest data directly. Instead, use appended signals to subtly curate product selections and scene choices. Frame recommendations as "popular picks", "trending", or "you might enjoy" — never "based on your profile" or "we know you like X".`);
  } else if (isAnonymous) {
    lines.push(`Customer: Anonymous visitor`);
    lines.push(`Identity: anonymous`);
  } else {
    lines.push(`Customer: ${ctx.name} (greet by first name)`, `Email: ${ctx.email || 'unknown'}`, `Identity: ${ctx.identityTier}`);
    if (ctx.email) lines.push(`[INSTRUCTION] The customer has been identified via their email address (${ctx.email}). Call Identify Customer By Email with this address to resolve their contactId before performing any profile updates or event captures.`);
  }

  if (ctx.skinType) lines.push(`Skin type: ${ctx.skinType}`);
  if (ctx.concerns?.length) lines.push(`Concerns: ${ctx.concerns.join(', ')}`);
  if (ctx.loyaltyTier) {
    const pts = ctx.loyaltyPoints ? ` (${ctx.loyaltyPoints} pts)` : '';
    lines.push(`Loyalty: ${ctx.loyaltyTier}${pts}`);
  }
  if (ctx.recentActivity?.length) lines.push(`Recent orders: ${ctx.recentActivity.join('; ')}`);
  if (ctx.chatContext?.length) lines.push(`Past conversations: ${ctx.chatContext.join('; ')}`);
  if (ctx.meaningfulEvents?.length) lines.push(`Key events: ${ctx.meaningfulEvents.join('; ')}`);
  if (ctx.browseInterests?.length) lines.push(`Recent browsing: ${ctx.browseInterests.join('; ')}`);
  if (ctx.appendedInterests?.length) {
    if (isAppended) {
      lines.push(`[SUBTLE CURATION SIGNALS — do NOT reference directly]: ${ctx.appendedInterests.join(', ')}`);
    } else {
      lines.push(`Interests (Merkury): ${ctx.appendedInterests.join(', ')}`);
    }
  }
  if (ctx.capturedProfile?.length) lines.push(`Known about this customer: ${ctx.capturedProfile.join('; ')}`);
  if (ctx.missingProfileFields?.length) lines.push(`[ENRICHMENT OPPORTUNITY] Try to naturally learn: ${ctx.missingProfileFields.join(', ')}`);
  return lines.join('\n');
}

async function getAgentResponse(content: string): Promise<AgentResponse> {
  if (useMockData) {
    return generateMockResponse(content);
  }
  const client = getAgentforceClient();
  if (!sessionInitialized) {
    await client.initSession();
    sessionInitialized = true;
  }
  return client.sendMessage(content);
}

/** Write a chat summary to Data Cloud when a conversation ends. */
function writeConversationSummary(customerId: string, msgs: AgentMessage[]): void {
  if (msgs.length < 2) return; // Need at least one exchange

  const topics = extractTopicsFromMessages(msgs);
  const summary: ChatSummary = {
    sessionDate: new Date().toISOString().split('T')[0],
    summary: `Customer discussed ${topics.join(', ')}. ${msgs.length} messages exchanged.`,
    sentiment: 'neutral',
    topicsDiscussed: topics,
  };

  const sessionId = uuidv4();
  getDataCloudWriteService().writeChatSummary(customerId, sessionId, summary).catch((err) => {
    console.error('[datacloud] Failed to write chat summary:', err);
  });
}

function extractTopicsFromMessages(msgs: AgentMessage[]): string[] {
  const allText = msgs.map((m) => m.content.toLowerCase()).join(' ');
  const topics: string[] = [];
  if (allText.includes('moisturizer') || allText.includes('hydrat')) topics.push('moisturizer');
  if (allText.includes('serum') || allText.includes('retinol')) topics.push('serum');
  if (allText.includes('cleanser')) topics.push('cleanser');
  if (allText.includes('sunscreen') || allText.includes('spf')) topics.push('sun protection');
  if (allText.includes('fragrance') || allText.includes('perfume')) topics.push('fragrance');
  if (allText.includes('travel')) topics.push('travel');
  if (allText.includes('gift') || allText.includes('anniversary')) topics.push('gifting');
  if (allText.includes('routine')) topics.push('skincare routine');
  if (allText.includes('checkout') || allText.includes('buy')) topics.push('purchase intent');
  return topics.length ? topics : ['general inquiry'];
}

interface ConversationContextValue {
  messages: AgentMessage[];
  isAgentTyping: boolean;
  isLoadingWelcome: boolean;
  suggestedActions: string[];
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => void;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [isLoadingWelcome, setIsLoadingWelcome] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([
    'Show me moisturizers',
    'I need travel products',
    'What do you recommend?',
  ]);
  const { processUIDirective, resetScene } = useScene();
  const { customer } = useCustomer();
  const messagesRef = useRef<AgentMessage[]>([]);
  const prevCustomerIdRef = useRef<string | null>(null);

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Write conversation summary when switching away from a customer
  useEffect(() => {
    const prevId = prevCustomerIdRef.current;
    prevCustomerIdRef.current = customer?.id || null;

    if (prevId && prevId !== customer?.id && messagesRef.current.length > 1) {
      writeConversationSummary(prevId, messagesRef.current);
    }
  }, [customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // When persona changes, reset conversation and trigger welcome
  useEffect(() => {
    if (!customer) return;

    const sessionCtx = buildSessionContext(customer);

    if (useMockData) {
      setMockCustomerContext(sessionCtx);
    } else {
      sessionInitialized = false;
    }

    // Clear conversation, scene state, and trigger welcome
    resetScene();
    setMessages([]);
    setSuggestedActions([]);
    setIsLoadingWelcome(true);

    const welcomeMsg = buildWelcomeMessage(sessionCtx);

    const timer = setTimeout(async () => {
      try {
        // Await session init so profile variables are available to the agent
        if (!useMockData) {
          try {
            await getAgentforceClient().initSession(sessionCtx);
            sessionInitialized = true;
          } catch (err) {
            console.error('Failed to init session:', err);
          }
        }
        const response = await getAgentResponse(welcomeMsg);
        const agentMessage: AgentMessage = {
          id: uuidv4(),
          role: 'agent',
          content: response.message,
          timestamp: new Date(),
          uiDirective: response.uiDirective,
        };
        setMessages([agentMessage]);
        let actions = response.suggestedActions || [];
        // Build context-aware fallback suggestions if agent didn't provide any
        if (!actions.length && response.uiDirective?.action === 'WELCOME_SCENE') {
          if (sessionCtx.identityTier === 'known' && sessionCtx.recentPurchases?.length) {
            actions = ['Restock my favorites', "What's new for me?", 'Show me something different'];
          } else if (sessionCtx.identityTier === 'appended') {
            actions = ['What do you recommend?', 'Show me bestsellers', 'Help me find my routine'];
          } else {
            actions = ['Show me moisturizers', 'I need travel products', 'What do you recommend?'];
          }
        }
        setSuggestedActions(actions);

        if (response.uiDirective) {
          await processUIDirective(response.uiDirective);
        }
      } catch (error) {
        console.error('Welcome failed:', error);
      } finally {
        setIsLoadingWelcome(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customer]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: AgentMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setSuggestedActions([]);
    setIsAgentTyping(true);

    try {
      const response = await getAgentResponse(content);

      const agentMessage: AgentMessage = {
        id: uuidv4(),
        role: 'agent',
        content: response.message,
        timestamp: new Date(),
        uiDirective: response.uiDirective,
      };
      setMessages((prev) => [...prev, agentMessage]);
      setSuggestedActions(response.suggestedActions || []);
      // Stop typing indicator before processing directive so background
      // transitions don't show a second typing bubble.
      setIsAgentTyping(false);

      if (response.uiDirective) {
        await processUIDirective(response.uiDirective);
      }
    } catch (error) {
      console.error('Failed to get agent response:', error);
      const errorMessage: AgentMessage = {
        id: uuidv4(),
        role: 'agent',
        content: "I'm sorry, I encountered an issue. Could you try again?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsAgentTyping(false);
    }
  }, [processUIDirective]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setSuggestedActions([
      'Show me moisturizers',
      'I need travel products',
      'What do you recommend?',
    ]);
  }, []);

  return (
    <ConversationContext.Provider
      value={{ messages, isAgentTyping, isLoadingWelcome, suggestedActions, sendMessage, clearConversation }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = (): ConversationContextValue => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within ConversationProvider');
  }
  return context;
};
