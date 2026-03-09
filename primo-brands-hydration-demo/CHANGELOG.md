# Changelog — Retail Concierge (Post-Repo Split)

Changes made to `agentforce-retail-concierge` after forking off the Maison Luxury Advisor and Project Advisor into their own repositories.

---

## Rename: Concierge → Advisor (`26a8a3a`)

Renamed the app from "Beauty Concierge" to "Beauty Advisor" across the UI, mock data, and documentation. Salesforce metadata was left unchanged (already deployed with existing names).

- Renamed `ConciergePage` component → `AdvisorPage`
- Updated all UI-facing strings, page title, and doc references
- Removed Maison-specific code that was left over from the fork:
  - Deleted `MaisonContext`, `MaisonPage`, `MaisonSelector` components
  - Deleted `src/mocks/lv/`, `src/mocks/mh/`, `src/mocks/maisonData.ts`
  - Deleted `src/services/mock/maisonMockAgent.ts`
  - Deleted `src/types/maison.ts`
- Cleaned up scene type references (`MaisonSceneConfig` → standard scene types)

**Net effect:** −3,052 lines of maison/multi-brand code removed, codebase focused on single-brand retail advisor.

---

## Anonymous Identity Capture & Activity Toasts (`cf9d75b`)

Added the ability for anonymous visitors to identify themselves mid-conversation via email, plus visual feedback for background data captures.

### Auto-Select Anonymous on Startup
- App now starts with the anonymous persona selected by default (`CustomerContext` calls `selectPersona('anonymous')` on mount)
- IdentityPanel shows "Anonymous Visitor" as the active profile instead of "Select Identity"

### Mid-Conversation Identity Upgrade
- New `IDENTIFY_CUSTOMER` UI directive type in `src/types/agent.ts`
- `customerEmail` field added to `UIDirectivePayload`
- `identifyByEmail(email)` added to `CustomerContext`:
  - **Mock mode:** matches against existing personas by email, or creates a minimal new profile
  - **Real mode:** queries Data Cloud via new `getCustomerProfileByEmail()` in `src/services/datacloud/customerProfile.ts`
- Uses `isRefreshRef` pattern so the conversation continues without resetting
- `ConversationContext` handles the directive: calls `identifyByEmail`, then shows a toast on success

### Activity Toast Notifications
- New `ActivityToast` component (`src/components/ActivityToast/`) with Framer Motion animations
- Three capture types with distinct colors and icons:
  - `contact_created` (emerald) — new or retrieved contact
  - `meaningful_event` (amber) — life events, preferences captured
  - `profile_enrichment` (sky) — profile fields updated
- `CaptureNotification` interface added to `src/types/agent.ts`
- `captures` array added to `UIDirectivePayload` so the agent can signal multiple background captures per response
- `ActivityToastProvider` wraps `ConversationProvider` in `App.tsx`
- `ConversationContext` processes `captures` from every agent response and fires toasts

### Agentforce Topic Updates
- **New topic:** `IdentityCapture.agentTopic-meta.xml` — instructions for naturally prompting anonymous users for email, calling `Create Sales Contact Record`, and returning `IDENTIFY_CUSTOMER` directive with opt-in framing
- **Updated topics:** ProductDiscovery, ProductRecommendation, TravelConsultation — all now include:
  - Corrected action names (`Create Meaningful Event`, `Update Contact Profile`)
  - `CAPTURE NOTIFICATIONS` section instructing the agent to include a `captures` array in `uiDirective` payloads

---

## Fix: Anonymous Persona ID Mismatch (`9bcd878`)

- Fixed auto-select passing `'persona-anonymous'` instead of `'anonymous'` — `PERSONA_STUBS` uses the short ID, so `IdentityPanel` was showing "Select Identity" instead of "Anonymous Visitor" on startup

---

## Refine Topic Directive Instructions (`b8094f6`)

Addressed issues observed in live testing where the agent was not returning structured JSON directives correctly.

### Problem: Agent re-showing same product on follow-up questions
- The `CRITICAL — RESPONSE FORMAT` rule was too strict, requiring JSON in every response
- When a user asked a follow-up like "will that work in dry climates?", the agent re-rendered the same product card instead of answering conversationally
- **Fix:** Relaxed the rule — plain-text responses are now explicitly allowed for follow-up questions about already-shown products. If the follow-up implies a new context/destination, the agent should use a `CHANGE_SCENE` directive instead

### Problem: Identity capture returning plain text instead of JSON
- When a user shared their email, the agent responded with "Thanks for sharing your email!" as plain text — no `IDENTIFY_CUSTOMER` directive, so `identifyByEmail()` never ran and no toast appeared
- **Fix:** Added `CRITICAL — RESPONSE FORMAT` section to IdentityCapture topic explicitly stating that without the JSON block, the frontend cannot identify the customer

### Topics updated
- ProductRecommendation, ProductDiscovery, TravelConsultation — nuanced directive format rules
- IdentityCapture — mandatory JSON on email capture
