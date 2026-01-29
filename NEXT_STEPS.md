# Next Steps: Moving Beyond Mock Scenarios

This document outlines every gap between the current demo implementation and a fully functional Agentforce retail concierge, organized by priority.

---

## Priority 1: Fix Broken / Missing Demo Features

These items are needed for the demo to function properly in mock mode.

### 1.1 Add Fallback Background Images

The `useGenerativeBackground` hook references five fallback images that don't exist in `public/assets/fallback-backgrounds/`. Without them, scene transitions show blank backgrounds when generative mode is off.

**Action:** Add five 1920x1080 JPGs to `public/assets/fallback-backgrounds/`:
- `neutral.jpg` — Soft gradient/bokeh
- `bathroom-scene.jpg` — Marble counter, spa aesthetic
- `travel-scene.jpg` — Luggage and toiletry bag
- `outdoor-scene.jpg` — Green foliage, active lifestyle
- `lifestyle-scene.jpg` — Vanity/dresser setup

Source options: Unsplash, Adobe Stock, or generate with Firefly/Midjourney.

### 1.2 Render Suggested Actions

The mock agent returns `suggestedActions` (e.g., "Show me moisturizers", "I need travel products") but they're never displayed. This is a significant UX gap — users don't know what to ask.

**Files to modify:**
- `src/contexts/ConversationContext.tsx` — Store latest `suggestedActions` in state, expose via context
- `src/components/ChatInterface/ChatInterface.tsx` — Pass `suggestedActions` to a new component
- **New file:** `src/components/ChatInterface/SuggestedActions.tsx` — Render clickable pill buttons below messages that call `sendMessage` on click

### 1.3 Implement Order Confirmation Flow

`CheckoutOverlay.tsx` currently just logs to console and closes after 2 seconds. It needs a real confirmation state.

**Changes:**
- Add local state for `'idle' | 'processing' | 'confirmed'` in `CheckoutOverlay.tsx`
- Show a spinner during processing
- Show order confirmation with mock orderId and estimated delivery date
- Handle the `CONFIRM_ORDER` UIAction in `SceneContext.tsx` (currently unhandled)

### 1.4 Handle Missing UIActions

`SceneContext.tsx` → `processUIDirective` is missing handlers for:
- **`CHANGE_SCENE`** — Should update scene setting/background without changing products
- **`CONFIRM_ORDER`** — Should close checkout and show confirmation state

---

## Priority 2: Expand Mock Agent Coverage

The mock agent only handles 3 patterns. To make the demo feel real, expand significantly.

### 2.1 Add More Product-Specific Patterns

In `src/services/mock/mockAgent.ts`, add patterns for:

| Pattern | Response | UIAction |
|---------|----------|----------|
| `cleanser\|wash\|face wash` | Recommend a cleanser | `SHOW_PRODUCT` + bathroom scene |
| `serum\|vitamin c\|retinol` | Recommend a serum | `SHOW_PRODUCT` + lifestyle scene |
| `sunscreen\|spf\|sun protect` | Recommend SPF product | `SHOW_PRODUCT` + outdoor scene |
| `acne\|breakout\|pimple` | Target acne-prone products | `SHOW_PRODUCTS` |
| `anti-aging\|wrinkle\|fine lines` | Anti-aging routine | `SHOW_PRODUCTS` |
| `routine\|regimen\|skincare routine` | Full routine recommendation | `SHOW_PRODUCTS` |
| `recommend\|what should\|suggest` | Personalized picks based on profile | `SHOW_PRODUCTS` |

### 2.2 Add More Mock Products

`src/mocks/products.ts` only has 4 items (all SERENE brand). Add:
- A gentle cleanser
- A vitamin C serum
- A hydrating mask
- Products from 2–3 additional brands for variety
- Non-travel versions of some products

### 2.3 Context-Aware Responses

The mock agent doesn't track conversation state. Add:
- Track what product is currently displayed so "buy it" knows what "it" refers to
- Track which products have been shown to avoid repeating
- Use `MOCK_CUSTOMER.beautyProfile.skinType` to personalize the default recommendation

---

## Priority 3: Implement Missing Components

### 3.1 ProductDetails Floating Panel

Spec calls for `src/components/ProductShowcase/ProductDetails.tsx` — a panel showing:
- Star rating and review count
- Full ingredients list
- Skin type compatibility badges
- Size/format info
- "Customers also bought" (optional)

Trigger: Clicking a product card in grid view, or an "i" button on the hero view.

### 3.2 Voice Input

The mic button in `ChatInput.tsx` has no `onClick`. Implement using the Web Speech API:

```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
```

Add states: `idle → listening → transcribing → done`. Show visual feedback (pulsing mic icon, waveform).

**Fallback:** If browser doesn't support Speech API, hide the mic button or show a tooltip.

---

## Priority 4: Real API Integrations

### 4.1 Agentforce API Connection

Replace mock agent with real Agentforce. The client skeleton exists at `src/services/agentforce/client.ts`.

**Steps:**
1. Set up an Agentforce agent in your Salesforce org with Topics:
   - `ProductDiscovery` — Handles product search queries
   - `ProductRecommendation` — Personalized recommendations
   - `TravelConsultation` — Travel-specific product needs
   - `CheckoutAssistance` — Purchase flow
2. Configure the agent to return structured `uiDirective` JSON in its responses (via metadata or embedded JSON)
3. Update `src/contexts/ConversationContext.tsx` to conditionally use `AgentforceClient.sendMessage()` when `VITE_USE_MOCK_DATA=false`
4. Populate `.env.local` with real credentials:
   ```
   VITE_AGENTFORCE_BASE_URL=https://your-instance.salesforce.com/...
   VITE_AGENTFORCE_AGENT_ID=your-agent-id
   VITE_AGENTFORCE_ACCESS_TOKEN=your-access-token
   VITE_USE_MOCK_DATA=false
   ```

**Key concern:** The agent must return `uiDirective` payloads that match the `UIDirective` type. Either:
- Return structured JSON in the agent's response metadata, or
- Embed JSON in the response text (the `parseDirectives.ts` parser handles this fallback)

### 4.2 Adobe Firefly / Generative Backgrounds

The Firefly client exists at `src/services/firefly/client.ts`. To enable:

1. Get an Adobe Firefly API key from [Adobe Developer Console](https://developer.adobe.com/)
2. Set env vars:
   ```
   VITE_FIREFLY_API_KEY=your-key
   VITE_ENABLE_GENERATIVE_BACKGROUNDS=true
   ```
3. The `useGenerativeBackground` hook will automatically use Firefly instead of fallback images
4. Verify the Firefly API v2 endpoint and request format match the current client implementation — Adobe may have updated their API

**Alternative:** Use DALL-E 3 via OpenAI API. Replace the Firefly client with an OpenAI client using the same interface.

### 4.3 Commerce Cloud Integration

Create `src/services/commerce/`:

| File | Purpose |
|------|---------|
| `client.ts` | Commerce Cloud API client (product search, cart, checkout) |
| `products.ts` | Product catalog queries with filters (category, skin type, price range) |
| `checkout.ts` | Cart management, payment processing, order creation |
| `index.ts` | Barrel exports |

**Integration points:**
- Replace `MOCK_PRODUCTS` array with real catalog queries
- Replace `console.log` in checkout with real order creation
- Add inventory checks before showing products

### 4.4 Data Cloud Integration

Create `src/services/datacloud/`:

| File | Purpose |
|------|---------|
| `customerProfile.ts` | Fetch real customer profiles from Salesforce Data Cloud |
| `index.ts` | Barrel exports |

**Integration points:**
- Replace `MOCK_CUSTOMER` in `CustomerContext.tsx` with real profile fetch
- Use real purchase history for personalization
- Use real beauty profile for product matching

---

## Priority 5: Salesforce Metadata & Deployment

### 5.1 Create Salesforce Project Structure

The spec defines a full `salesforce/` directory that doesn't exist yet. This is needed to deploy the Agentforce agent and supporting resources to a Salesforce org.

**Files to create:**
```
salesforce/
├── sfdx-project.json
└── force-app/main/default/
    ├── agents/Beauty_Concierge/
    │   ├── Beauty_Concierge.agent-meta.xml
    │   └── topics/
    │       ├── ProductDiscovery.agentTopic-meta.xml
    │       ├── ProductRecommendation.agentTopic-meta.xml
    │       ├── TravelConsultation.agentTopic-meta.xml
    │       └── CheckoutAssistance.agentTopic-meta.xml
    ├── flows/
    │   ├── Search_Product_Catalog.flow-meta.xml
    │   └── Generate_Scene_Context.flow-meta.xml
    └── classes/
        ├── ProductCatalogService.cls
        ├── ProductCatalogService.cls-meta.xml
        ├── SceneGeneratorService.cls
        └── SceneGeneratorService.cls-meta.xml
```

### 5.2 Agent Topic Configuration

Each topic needs:
- **Scope** — What questions it handles
- **Instructions** — How to respond, including uiDirective format
- **Actions** — Which Flows/Apex to invoke
- **Example utterances** — For classification training

---

## Priority 6: Polish & Production Readiness

### 6.1 Testing

No tests exist currently. Add:
- **Unit tests** for `sceneReducer`, `parseUIDirective`, `generateMockResponse`
- **Component tests** for ChatInterface, ProductShowcase, CheckoutOverlay (React Testing Library)
- **Integration tests** for the full demo flow (Playwright or Cypress)

### 6.2 Error Handling

Current error handling is minimal (`console.error` + generic message). Add:
- Network error retry logic with exponential backoff
- User-facing error states in the UI (not just console logs)
- Graceful degradation when services are unavailable

### 6.3 Mobile Responsiveness

The layout uses Tailwind responsive classes but hasn't been tested on mobile. Verify:
- Chat input usability on small screens
- Product hero layout stacking on mobile
- Checkout overlay full-screen on mobile
- Touch interactions for product cards

### 6.4 Analytics

Add event tracking for:
- Message sent / agent response received
- Product viewed / product added to bag
- Checkout started / completed / abandoned
- Scene transitions
- Session duration

### 6.5 Performance

- Lazy-load the Firefly client (already done via dynamic import)
- Add image optimization (srcset, lazy loading, WebP)
- Memoize expensive renders in ProductGrid
- Add skeleton loading states for product images

---

## Quick Reference: Environment Variables

```bash
# Mock mode (current default)
VITE_USE_MOCK_DATA=true
VITE_ENABLE_GENERATIVE_BACKGROUNDS=false

# Real APIs
VITE_USE_MOCK_DATA=false
VITE_ENABLE_GENERATIVE_BACKGROUNDS=true
VITE_AGENTFORCE_BASE_URL=https://your-instance.salesforce.com/services/data/v60.0/einstein/ai-agents
VITE_AGENTFORCE_AGENT_ID=<agent-id>
VITE_AGENTFORCE_ACCESS_TOKEN=<token>
VITE_FIREFLY_API_KEY=<key>
VITE_FIREFLY_BASE_URL=https://firefly-api.adobe.io
```
