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

## Pending / Fix (`HEAD`, uncommitted)

- Fixed persona ID mismatch: auto-select was passing `'persona-anonymous'` but `PERSONA_STUBS` uses `'anonymous'` — IdentityPanel now correctly shows anonymous as active on startup
