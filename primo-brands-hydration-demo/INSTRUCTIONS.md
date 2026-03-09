# Agentforce Retail Advisor — Architecture & Setup Instructions

## Overview

A React/TypeScript/Vite demo that connects to a Salesforce Agentforce agent to deliver an AI-powered beauty retail advisor. The agent recommends products, changes scene contexts, and drives the UI via structured JSON directives embedded in chat responses.

Key capabilities:
- **Agentforce Chat** — Real-time conversational agent via Salesforce Einstein AI Agent API
- **Generative Scene Backgrounds** — AI-generated backgrounds via Google Imagen 4 (or Adobe Firefly)
- **Product-in-Scene Compositing** — Products are staged into scenes using Imagen edit API
- **Salesforce CMS Persistence** — Generated images are saved to CMS for reuse across sessions
- **CSS Blend Fallback** — Instant product transparency via `mix-blend-mode` while AI compositing loads

---

## Architecture

### Image Pipeline (Tiered Resolution)

**Scene backgrounds:**
1. In-memory cache (per session)
2. Salesforce CMS lookup (by asset ID → custom tag → `scene-{setting}` tag)
3. Google Imagen 4 generation (or CMS seed image + Imagen edit)
4. CSS gradient fallback

**Product images:**
1. In-memory global cache (keyed `{productId}-{setting}`)
2. Salesforce CMS lookup (by tag `staged-{productId}-{setting}`)
3. Google Imagen edit API (product image + scene staging prompt)
4. CSS `mix-blend-mode: multiply` fallback (immediate, zero API cost)

**CMS Write-Back (fire-and-forget):**
After any successful generation, the blob URL image is uploaded to Salesforce CMS with descriptive tags. On subsequent visits, the CMS lookup finds the previously generated image, skipping the generation API call entirely.

### Agent Directive System

The Agentforce agent returns JSON `UIDirective` objects in chat responses:
```json
{
  "uiDirective": {
    "action": "SHOW_PRODUCTS",
    "payload": {
      "products": [...],
      "sceneContext": {
        "setting": "bathroom",
        "generateBackground": true,
        "backgroundPrompt": "warm evening candlelight",
        "cmsAssetId": "0PKxx...",
        "cmsTag": "scene-bathroom-evening",
        "editMode": true
      }
    }
  }
}
```

`editMode: true` uses a CMS image as a seed and applies the `backgroundPrompt` as an edit instruction via Imagen edit API.

### Vite Proxy Routes

All external API calls go through Vite dev middleware to avoid CORS:

| Local Path | Target |
|---|---|
| `/api/agentforce/*` | `https://api.salesforce.com/einstein/ai-agent/v1/*` |
| `/api/oauth/token` | `https://{instance}.my.salesforce.com/services/oauth2/token` |
| `/api/firefly/token` | `https://ims-na1.adobelogin.com/ims/token/v3` |
| `/api/firefly/generate` | `https://firefly-api.adobe.io/v3/images/generate` |
| `/api/imagen/generate` | `https://generativelanguage.googleapis.com/.../imagen-4.0-generate-001:predict` |
| `/api/imagen/edit` | `https://generativelanguage.googleapis.com/.../imagen-3.0-capability-001:predict` |
| `/api/agentforce-cms/*` | `https://{instance}.my.salesforce.com/services/data/v60.0/connect/cms/*` |

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

### Required — Agentforce
```
VITE_AGENTFORCE_BASE_URL=https://api.salesforce.com/einstein/ai-agent/v1
VITE_AGENTFORCE_AGENT_ID=<agent ID from Salesforce Setup>
VITE_AGENTFORCE_CLIENT_ID=<Connected App consumer key>
VITE_AGENTFORCE_CLIENT_SECRET=<Connected App consumer secret>
VITE_AGENTFORCE_INSTANCE_URL=https://your-instance.my.salesforce.com
```

### Image Generation
```
VITE_IMAGE_PROVIDER=imagen          # imagen | firefly | cms-only | none
VITE_IMAGEN_API_KEY=<Google AI API key>
VITE_FIREFLY_CLIENT_ID=<optional>
VITE_FIREFLY_CLIENT_SECRET=<optional>
```

### Salesforce CMS
```
VITE_CMS_CHANNEL_ID=<CMS channel ID for reading assets>
VITE_CMS_SPACE_ID=<CMS space ID for uploading generated images>
```

### Commerce Cloud (future)
```
VITE_COMMERCE_BASE_URL=https://your-instance.commercecloud.salesforce.com
VITE_COMMERCE_CLIENT_ID=<client ID>
VITE_COMMERCE_SITE_ID=<site ID>
VITE_COMMERCE_ACCESS_TOKEN=<access token>
```

### Data Cloud (future)
```
VITE_DATACLOUD_BASE_URL=https://your-instance.salesforce.com
VITE_DATACLOUD_ACCESS_TOKEN=<access token>
VITE_CUSTOMER_ID=<customer ID>
```

### Feature Flags
```
VITE_USE_MOCK_DATA=true             # true = mock agent, false = real Agentforce
VITE_ENABLE_GENERATIVE_BACKGROUNDS=true
VITE_ENABLE_PRODUCT_TRANSPARENCY=true
```

---

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your credentials
npm run dev
```

The app runs at `http://localhost:5173`.

### Mock Mode
Set `VITE_USE_MOCK_DATA=true` to use the built-in mock agent (no Salesforce connection needed). The mock agent responds to keywords like "moisturizer", "sunscreen", "travel", "evening routine", etc.

### Live Mode
Set `VITE_USE_MOCK_DATA=false` and configure all Agentforce env vars. The Vite proxy handles OAuth token exchange and API forwarding.

---

## Key Files

### Services
- `src/services/agentforce/client.ts` — Agentforce session management, message sending, OAuth
- `src/services/agentforce/parseDirectives.ts` — UIDirective JSON parsing with invisible-char sanitization
- `src/services/imagen/client.ts` — Imagen 4 generate, edit, and product staging
- `src/services/imagen/utils.ts` — Base64/blob URL conversion helpers
- `src/services/firefly/client.ts` — Adobe Firefly generate (alternative provider)
- `src/services/firefly/prompts.ts` — Scene and staging prompts for all settings
- `src/services/cms/backgroundAssets.ts` — CMS read (by ID, tag, or setting)
- `src/services/cms/uploadAsset.ts` — CMS write-back (multipart upload with tags)
- `src/services/mock/mockAgent.ts` — Keyword-driven mock agent for demo

### Hooks
- `src/hooks/useGenerativeBackground.ts` — Tiered background resolution with CMS read/write
- `src/hooks/useProductStaging.ts` — Product-in-scene compositing with CMS read/write

### Contexts
- `src/contexts/SceneContext.tsx` — Scene state, background generation, directive handling
- `src/contexts/ConversationContext.tsx` — Chat history, message sending
- `src/contexts/CustomerContext.tsx` — Customer profile and preferences

### Components
- `src/components/AdvisorPage/` — Main page layout
- `src/components/ChatInterface/` — Chat input, messages, suggested actions
- `src/components/ProductShowcase/` — ProductHero, ProductCard, ProductDetails
- `src/components/CheckoutOverlay/` — Checkout flow

### Types
- `src/types/agent.ts` — UIDirective, UIAction, payload shapes
- `src/types/scene.ts` — SceneSetting union type
- `src/types/product.ts` — Product interface

---

## Salesforce CMS Setup

### For Reading (pre-stored scene backgrounds)
1. Create a CMS Workspace in Salesforce Setup
2. Create a CMS Channel and note the channel ID → `VITE_CMS_CHANNEL_ID`
3. Upload scene background images tagged with `scene-bathroom`, `scene-travel`, etc.
4. Publish the content to the channel

### For Writing (persisting generated images)
1. Note the CMS Space ID from Setup → `VITE_CMS_SPACE_ID`
2. Ensure the Connected App's OAuth scope includes CMS content management
3. Generated images are auto-uploaded with tags like:
   - `scene-bathroom` — generated scene backgrounds
   - `scene-bathroom` + `edited` — Imagen-edited scene backgrounds
   - `staged-moisturizer-sensitive-bathroom` — product composited into scene

---

## Imagen API Setup

1. Go to Google AI Studio and create an API key
2. Set `VITE_IMAGEN_API_KEY` in `.env.local`
3. Set `VITE_IMAGE_PROVIDER=imagen`
4. The app uses two Imagen endpoints:
   - **Imagen 4** (`imagen-4.0-generate-001`) for scene background generation
   - **Imagen 3 Capability** (`imagen-3.0-capability-001`) for image editing (scene edits + product staging)

---

## Production Considerations

### Current State (Demo)
- Vite dev server proxy handles CORS — not suitable for production
- OAuth tokens are exchanged client-side through the proxy
- Mock product data with Unsplash placeholder images
- In-memory caches are per-tab, per-session

### Production Roadmap
1. **Backend proxy** — Move API proxying to a proper backend (Express, Salesforce Functions, etc.)
2. **Commerce Cloud integration** — Replace mock products with real B2C Commerce catalog
3. **Data Cloud integration** — Real customer profiles and purchase history for personalization
4. **Remove.bg / Clipdrop API** — For production-quality background removal on product images with non-white backgrounds
5. **CDN caching** — Cache CMS image URLs at the CDN layer
6. **Rate limiting** — Imagen API has usage limits; implement queuing for high traffic
7. **Image optimization** — Resize/compress generated images before CMS upload
8. **Error boundaries** — Graceful degradation when APIs are unavailable
