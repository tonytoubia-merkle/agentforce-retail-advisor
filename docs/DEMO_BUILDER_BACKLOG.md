# Demo Builder — Backlog & Open Items

## Needs Your Input / Action

### 1. Supabase Project Setup
- **Action needed**: Create a Supabase project and run `supabase/migrations/001_demo_builder_schema.sql`
- **Then**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`
- **For deploy scripts**: Also set `SUPABASE_SERVICE_KEY` (service role key, NOT anon key)

### 2. Anthropic API Key
- **Action needed**: Set `ANTHROPIC_API_KEY` in `.env.local` (or Vercel env vars)
- **Used by**: `/api/brand-research` (Claude-powered brand research pipeline)
- **Model**: Uses `claude-sonnet-4-6` — can adjust if needed

### 3. Domain & DNS
- **Decision**: What domain to use? `demo-combobulator.com` is placeholder
- **Action**: Purchase domain, configure wildcard DNS (`*.demo-combobulator.com` → Vercel)
- **Vercel**: Add wildcard domain in Vercel project settings

### 4. Salesforce Dev Hub
- **Action needed**: Authenticate a Dev Hub org for scratch org provisioning
- **Command**: `sf org login web --set-default-dev-hub --alias devhub`
- **Note**: The deploy script (`scripts/deploy/deploy-demo.sh`) expects `sf` CLI to be authenticated

### 5. Supabase Auth for Admin
- **Current state**: Admin UI has no authentication — anyone with the URL can access it
- **Recommendation**: Enable Supabase Auth with magic link (email-based, no password)
- **Scope**: Restrict to `@dentsu.com` or specific email domains
- **Priority**: Before sharing with sales engineers

### 6. `@anthropic-ai/sdk` Dependency
- **Action needed**: `npm install @anthropic-ai/sdk` (for the brand-research API endpoint)
- **Note**: Only needed on the server side (Vercel functions), not bundled into the client

---

## Built but Not Yet Wired (Incremental Work)

### 7. Runtime Config Propagation (Phase 2c — partial)
The `DemoContext` + `useDemoConfig` hooks exist and provide per-demo config, but the existing components still read from `import.meta.env.*` directly. Files that need updating:

| File | What to Change |
|------|----------------|
| `src/contexts/ConversationContext.tsx:19` | Replace `import.meta.env.VITE_USE_MOCK_DATA` with `useDemoFlags().useMockData` |
| `src/contexts/CustomerContext.tsx:11` | Same mock data flag |
| `src/components/PersonaSelector/PersonaSelector.tsx:9` | Same |
| `src/components/Storefront/DemoPanel.tsx:12` | Same |
| `src/components/Storefront/CheckoutPage.tsx:11` | Same |
| `src/hooks/useGenerativeBackground.ts:28` | Replace with `useImageProvider()` |
| `src/hooks/useProductStaging.ts:26-27` | Replace with `useDemoFlags()` + `useImageProvider()` |
| `src/services/agentforce/client.ts:696-708` | Accept config params instead of reading env |
| `src/App.tsx:42` | Read skin agent ID from `useSalesforceConfig()` |

**Why not done**: These are hook-to-context wiring changes that each touch working code. Safest to do them one at a time with testing to avoid regressions.

### 8. Demo-Aware Product Loading
`src/services/demoData/demoDataService.ts` can load products/personas/campaigns from Supabase. Wire into:
- `ProductContext.tsx` — call `loadDemoProducts(demoId)` first, fall back to `fetchProductCatalog()`
- `CustomerContext.tsx` — load personas from Supabase if available
- `MediaWallPage.tsx` — load campaigns from Supabase if available

### 9. Brand-Specific Mock Data Replacement
When a demo has products in Supabase, the mock data imports should be bypassed:
- `src/mocks/products.ts` (MOCK_PRODUCTS)
- `src/mocks/customerPersonas.ts` (PERSONAS, PERSONA_STUBS)
- `src/mocks/adCreatives.ts` (AD_CREATIVES)

---

## Future Enhancements (Phase 3+)

### 10. Real Scratch Org Provisioning
`api/demo-deploy.js` currently simulates deploy steps. To make it real:
- Use `child_process.exec` to call `sf` CLI, OR
- Use Salesforce REST APIs (Tooling API) directly from Node.js
- Auto-create Connected App + capture client ID/secret
- Auto-assign Permission Sets for field-level security

### 11. Vercel API Integration
Auto-add custom domains per demo:
- Use Vercel REST API: `POST /v10/projects/{projectId}/domains`
- Auto-set per-demo environment variables

### 12. Asset Pipeline
- Product image generation (Imagen/Firefly) based on brand + product descriptions
- Hero image generation per demo
- Logo scraping from brand website
- Store in Supabase Storage, reference in `demo_assets` table

### 13. Prompt Template Customization
- Build a template substitution engine that replaces `{{BRAND_NAME}}`, `{{PRODUCT_DOMAIN}}`, etc. in GenAI prompt templates before deploying to scratch org
- Store brand voice notes from AI research in `demo_prompt_overrides` table
- Generate per-demo versions of all 8 prompt templates

### 14. Campaign / Ad Creative Editor
- Similar to ProductEditor/PersonaEditor but for campaign creatives
- Gradient picker, UTM param builder, audience segment config

### 15. Demo Preview Mode
- In the admin wizard, show a live preview of the demo with the current config
- Iframe pointing to `?demo={slug}&preview=true` with theme injection

### 16. Webhook / CI Trigger
- After demo creation, trigger a GitHub Actions workflow or Vercel deploy hook
- Enables automated end-to-end deploy without manual intervention

### 17. Demo Analytics
- Track demo usage (page views, agent conversations, conversions) per demo
- Dashboard in admin showing which demos are getting engagement

### 18. Multi-Vertical Template Libraries
- "Fashion" template with fashion-specific product categories, personas
- "Wellness" template with supplement categories
- "CPG" template with grocery/household categories
- Each with pre-built Salesforce metadata variations

---

## Quick Start Checklist

1. [ ] Create Supabase project + run migration SQL
2. [ ] Set env vars in `.env.local`
3. [ ] `npm install @anthropic-ai/sdk`
4. [ ] Navigate to `http://localhost:5173/admin`
5. [ ] Create a demo via the wizard
6. [ ] Test AI research with a brand name
7. [ ] Review generated products/personas in the demo detail
