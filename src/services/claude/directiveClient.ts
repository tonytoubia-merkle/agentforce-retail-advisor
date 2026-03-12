/**
 * Claude-powered UIDirective generation.
 *
 * Runs in parallel with the Agentforce call so the UI can update optimistically
 * within ~300-500ms instead of waiting 3-7s for Agentforce Prompt Templates.
 *
 * The Agentforce agent remains the authoritative source for:
 *   - Conversational response text
 *   - CRM actions (Create_Meaningful_Event, IDENTIFY_CUSTOMER, etc.)
 *   - Business-logic directives (when Prompt Templates do fire)
 *
 * Claude Haiku handles the fast, reliable UI orchestration layer:
 *   - Product selection from the local catalog
 *   - Scene context determination
 *   - Suggested action generation
 */
import type { UIDirective } from '@/types/agent';
import { MOCK_PRODUCTS } from '@/mocks/products';
import { parseUIDirective } from '@/services/agentforce/parseDirectives';

// Build a compact catalog string once at module load — keeps the Claude prompt
// small for speed. Only the fields Claude needs: id, name, category, brand,
// price, skin type compatibility, concerns addressed, and a short description.
const CATALOG_LINES = MOCK_PRODUCTS.map((p) => {
  const st = (p.attributes?.skinType || []).join(',');
  const co = (p.attributes?.concerns || []).join(',');
  const desc = (p.shortDescription || p.description || '').substring(0, 70);
  return `${p.id}|${p.name}|${p.category}|${p.brand}|$${p.price}|${st}|${co}|${desc}`;
}).join('\n');

const SYSTEM_PROMPT = `You are a UI orchestration layer for a luxury beauty retail advisor.
Your sole job: given a customer message and context, return a UIDirective JSON object that tells the UI what to display.

PRODUCT CATALOG (format: id|name|category|brand|price|skinType|concerns|description):
${CATALOG_LINES}

VALID SCENE SETTINGS: bathroom, vanity, travel, outdoor, gym, office, bedroom, lifestyle, neutral

RESPONSE FORMAT: Return ONLY a JSON object. No preamble, no explanation, no markdown fences.

SCHEMA for SHOW_PRODUCTS:
{"uiDirective":{"action":"SHOW_PRODUCTS","payload":{"products":[{"id":"<catalog-id>","name":"<name>","brand":"<brand>","category":"<category>","price":<number>}],"sceneContext":{"setting":"<setting>","mood":"<1-3 words>"},"message":"<1 sentence>","suggestedActions":["<filter>","<filter>","<filter>"]}}}

SCHEMA for CHANGE_SCENE:
{"uiDirective":{"action":"CHANGE_SCENE","payload":{"sceneContext":{"setting":"<setting>","mood":"<1-3 words>"},"message":"<1 sentence>"}}}

SCHEMA for no UI change:
{"uiDirective":null}

ACTIONS:
- "SHOW_PRODUCTS": user asks for products, recommendations, comparisons, "show me", "I need", "looking for", "what's good for", "suggest", category names (moisturizer, serum, lipstick, etc.)
- "CHANGE_SCENE": user mentions a life context/setting with NO product request (e.g., "I'm traveling next week", "going to the gym", "for my office")
- null ({"uiDirective":null}): purely conversational — greetings, thank yous, questions about the advisor, life events being shared, "I'm planning a trip to X" without a product ask

RULES:
1. Select 2-4 products from the catalog that BEST match the request AND customer context (skin type, concerns, past purchases)
2. Prefer products that address the customer's stated concerns
3. Never recommend a product the customer recently purchased (unless they ask for a restock)
4. sceneContext.setting: pick the most relevant for the product category or activity
5. suggestedActions: 3 short refinement filters relevant to the context (e.g., "Fragrance-free", "Under $50", "Travel size")
6. payload.message: brief 1-sentence personalized intro (the Agentforce agent provides the full conversational response)
7. When uncertain between SHOW_PRODUCTS and null, prefer SHOW_PRODUCTS`;

export interface DirectiveRequest {
  message: string;
  customerContext: {
    name?: string;
    skinType?: string;
    concerns?: string[];
    loyaltyTier?: string;
    recentPurchaseIds?: string[];
  };
  currentScene: {
    setting: string;
    layout: string;
    shownProductIds?: string[];
  };
}

/**
 * Generate a UIDirective from Claude Haiku in ~300-500ms.
 * Returns undefined on any failure — callers should treat this as a
 * no-op and continue with the Agentforce response.
 */
export async function generateUIDirective(
  request: DirectiveRequest,
  signal?: AbortSignal,
): Promise<UIDirective | undefined> {
  const { message, customerContext, currentScene } = request;

  // Build a compact context block
  const ctxParts: string[] = [];
  if (customerContext.name) ctxParts.push(`Name: ${customerContext.name}`);
  if (customerContext.skinType) ctxParts.push(`Skin: ${customerContext.skinType}`);
  if (customerContext.concerns?.length) ctxParts.push(`Concerns: ${customerContext.concerns.join(', ')}`);
  if (customerContext.loyaltyTier) ctxParts.push(`Loyalty: ${customerContext.loyaltyTier}`);
  if (customerContext.recentPurchaseIds?.length) {
    ctxParts.push(`Recent purchases: ${customerContext.recentPurchaseIds.slice(0, 4).join(', ')}`);
  }

  const userContent = [
    `CUSTOMER: ${ctxParts.join('; ') || 'Anonymous visitor'}`,
    `CURRENT SCENE: setting=${currentScene.setting}, layout=${currentScene.layout}${
      currentScene.shownProductIds?.length
        ? `, showing=[${currentScene.shownProductIds.slice(0, 5).join(',')}]`
        : ''
    }`,
    `CUSTOMER MESSAGE: "${message}"`,
  ].join('\n');

  try {
    const response = await fetch('/api/claude/directive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({ system: SYSTEM_PROMPT, message: userContent }),
    });

    if (!response.ok) {
      console.warn('[claude-directive] API error:', response.status);
      return undefined;
    }

    const data = await response.json();
    const text = (data.content?.[0]?.text || '').trim();
    if (!text) return undefined;

    const parsed = parseUIDirective({ message: text, rawText: text });
    if (parsed) {
      console.log(
        '[claude-directive] Generated:',
        parsed.action,
        JSON.stringify(parsed.payload).substring(0, 200),
      );
    }
    return parsed;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return undefined;
    console.warn('[claude-directive] Failed (non-fatal):', err);
    return undefined;
  }
}
