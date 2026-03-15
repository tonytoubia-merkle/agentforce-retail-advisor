# Cetaphil.com → Agentic Experience Strategy

## Executive Summary

Cetaphil.com is a **trust and discovery engine**, not a transaction engine. Its entire job is to:
1. Build brand confidence through education and personalization
2. Capture skin profile data (which models strongly to in-store purchase attribution)
3. Route high-intent visitors to the right retailer at the right moment

This creates a unique design challenge: **we can build a deeply agentic experience without needing checkout flows**. The constraint (no direct commerce) is actually a *clarifying* one — the agent's only job is to understand the user's skin, earn their trust, capture their profile, and hand them off to a purchase moment with maximum intent.

---

## The Current Cetaphil Architecture (What We're Replicating)

### Static Tool Set Today
| Tool | Type | Data Captured | Attribution Value |
|------|------|---------------|-------------------|
| AI Skin Analysis | Selfie → report | Skin condition scores | Very High |
| Product Finder | Questionnaire (5–7 questions) | Skin type, concerns | High |
| "Where to Buy" | Static retailer links | Click destination | Medium |
| Newsletter signup | Email form | Email, intent | Medium |
| Ingredient pages | Content consumption | Interest signals | Low |

### The Attribution Insight
The Skin Analyzer is the highest-value touchpoint because:
- It captures **verifiable biometric-adjacent data** (not self-reported)
- Users who complete it have higher purchase intent
- The resulting "skin profile" can be matched against modeled in-store buyer cohorts
- It creates a **re-engagement asset** (email the report = permission marketing)

---

## The Agentic Opportunity

### Core Design Principle
> Replace every static form, quiz, and content page with a **conversation that progressively builds a skin profile** while feeling like personal consultancy.

The existing `agentforce-retail-advisor` already has the scaffolding: `UIDirective` actions, `CustomerContext` for progressive identity capture, `ConversationContext` for multi-turn dialogue, and Data Cloud for profile persistence. We redirect that infrastructure from "recommend and checkout" to "understand and route."

---

## Redesigned User Journeys

### Journey 1: The Skin Consultation (Replaces Product Finder + Skin Analyzer)

**Old flow:** Banner → click "AI Skin Analysis" → upload selfie → static report → product grid → "Buy Now" exits site.

**New agentic flow:**

```
Homepage → Conversational greeting → Progressive skin discovery →
Profile capture → Personalized routine → Retailer handoff with cart
```

**Agent conversation arc:**

```
AGENT: "Hi — I'm your Cetaphil skin advisor. Want me to build you a
        personalized routine? I'll ask a few questions, or if you'd
        like to try our AI analysis, I can walk you through that too."

[User: "sure, ask me questions"]

AGENT: "Great. What's been the biggest thing bothering your skin lately?
        Dryness, breakouts, redness, something else?"

[User: "I get really dry around my cheeks and some redness"]

AGENT: "That combination — dryness plus redness — often points to a
        compromised moisture barrier. A few more questions: Do you
        notice it's worse in winter or year-round?"

[Captures: skin_concern=dryness+redness, likely_barrier_damage=true]
[UIDirective: CAPTURE_ONLY → Data Cloud event]

AGENT: "Does your skin feel tight after cleansing, even with a gentle wash?"

[...continues building profile...]

AGENT: "Based on what you've told me, here's what I'd recommend for your
        morning and evening routine..."

[UIDirective: SHOW_PRODUCTS with personalized routine]

AGENT: "Want me to email you this routine so you can reference it while
        shopping? I can also check which of these are available at stores
        near you."

[UIDirective: IDENTIFY_CUSTOMER → email capture]
```

**Data captured without feeling extractive:**
- Skin type (dry/oily/combination/sensitive)
- Primary concerns (up to 3)
- Lifestyle context (seasons, indoor/outdoor, exercise frequency)
- Current routine products and pain points
- Purchase channel preference (online vs. in-store, retailer preference)
- Email for report delivery
- Location signal for retailer routing

---

### Journey 2: The Skin Analysis Enhancement (Supercharging the Selfie Tool)

**The problem with the current selfie tool:** It generates a report and stops. There's no conversation after the insight, so the user reads their score and bounces.

**The agentic enhancement:**

```
[User completes selfie analysis]

AGENT: "Your analysis is ready. I can see a few things worth talking
        through — your skin shows signs of mild dehydration and some
        UV sensitivity. Before I show your full report, can I ask:
        are you currently using any SPF in the morning?"

[This one question does two things: captures current routine gaps
 AND creates natural product recommendation entry point]

AGENT: "Your personalized report → [SHOW skin analysis UI card]
        Based on your scores, here's a simple routine that addresses
        the hydration gap and UV protection..."

[UIDirective: SHOW_PRODUCTS with analysis-matched routine]

AGENT: "I've saved your skin analysis to your profile. Want me to
        send it to your email with the product list? You can also
        add these to a wishlist and I'll alert you when they're on
        sale at your preferred retailer."
```

**Why this works:** The selfie creates verified data. The conversation enriches it with behavioral context. The email capture closes the loop for attribution.

---

### Journey 3: The Intelligent "Where to Buy" (Replacing Static Links)

**Old flow:** Product page → "Where to Buy" button → static page with Amazon/Target/Walgreens logos → exit.

**New agentic flow:**

```
AGENT: "These products are available at most major retailers.
        Where do you usually shop for skincare?"

[User: "I normally go to Target"]

AGENT: "Perfect. Your recommended routine is available at Target.
        There's currently a [retailer promotion if available].
        Want me to build you a shopping list you can pull up in-store
        or add directly to your Target cart?"

[UIDirective: RETAILER_HANDOFF → deep link to Target with product
 list pre-filled, UTM attribution tags]
```

**The data value:** Instead of a raw click-out, we now know:
- Preferred retailer (high-value first-party signal)
- Product-level purchase intent (which SKUs they're interested in)
- Whether they prefer online or in-store (routing logic)
- Session duration indicates engagement depth before handoff

---

### Journey 4: The Routine Builder (New Agentic Surface)

**This is a net-new capability the static site can't offer:**

```
AGENT: "Let me build your ideal skincare routine. Tell me —
        morning routine, evening, or both?"

[Builds step-by-step: cleanser → toner → treatment → moisturizer → SPF]

[At each step, agent explains *why* each product fits their profile]
[User can ask questions mid-build: "is this okay for sensitive eyes?"]

[End result: personalized routine card]
[UIDirective: SHOW_ROUTINE_CARD — new directive type]
[Agent offers: email it, save it, find it at retailer]
```

---

## New UIDirective Types for Cetaphil Context

The existing directive system handles commerce. For Cetaphil, we extend it:

```typescript
type CetaphilUIAction =
  // Existing (reused)
  | 'SHOW_PRODUCT'
  | 'SHOW_PRODUCTS'
  | 'CAPTURE_ONLY'
  | 'IDENTIFY_CUSTOMER'

  // New for Cetaphil
  | 'SHOW_SKIN_REPORT'       // Display skin analysis results card
  | 'SHOW_ROUTINE'           // Display morning/evening routine card
  | 'RETAILER_HANDOFF'       // Route to retailer with attribution link
  | 'SHOW_INGREDIENT_DETAIL' // Expand ingredient education panel
  | 'LAUNCH_SKIN_ANALYSIS'   // Trigger selfie tool within chat
  | 'SAVE_ROUTINE'           // Email/save the built routine
  | 'STORE_LOCATOR'          // Map of nearby retailers with stock
```

---

## Scene Strategy for Cetaphil

The generative backgrounds are a differentiator. For Cetaphil, they should map to **skin moments** rather than retail environments:

| Scene | When | Background Prompt |
|-------|------|-------------------|
| `morning_ritual` | Cleanser/SPF conversations | Bright bathroom, morning light through window, clean white marble |
| `evening_wind_down` | Moisturizer/repair conversations | Warm candlelit bathroom, soft vanity lighting |
| `outdoor_skin` | SPF/UV conversations | Dappled sunlight through trees, fresh outdoor environment |
| `sensitive_moment` | Sensitivity/redness conversations | Soft, cool, clinical-minimal aesthetic |
| `travel_skincare` | Travel-specific routine | Hotel bathroom, travel toiletry bag, passport nearby |
| `seasonal_care` | Winter dryness, summer oiliness | Season-appropriate natural environment |

The scene changes as the conversation topic shifts — the environment *mirrors* the skin story being told.

---

## Data Architecture: The Skin Profile Graph

Every interaction should enrich a unified skin profile in Data Cloud:

```
SkinProfile {
  // Captured passively (from behavior)
  pages_viewed: string[]
  ingredients_explored: string[]
  products_engaged: string[]
  skin_analysis_completed: boolean
  time_in_consultation: number

  // Captured conversationally (from agent)
  skin_type: 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive'
  primary_concern: string
  secondary_concerns: string[]
  climate_zone: string
  current_routine_gaps: string[]
  spf_usage: boolean
  preferred_retailer: string
  shopping_mode: 'online' | 'in_store' | 'both'

  // Captured via skin analyzer (verified)
  hydration_score: number
  sensitivity_score: number
  uv_damage_indicators: string[]

  // Attribution
  session_id: string
  utm_source: string
  handoff_retailer: string
  handoff_products: string[]
  handoff_timestamp: Date
}
```

This profile enables the **purchase attribution model**: when a product is purchased in-store at Target 3 days after a digital consultation session, the session → profile → purchase chain can be modeled even without direct transaction data.

---

## Progressive Disclosure: The Identity Funnel

For a brand with no direct purchase, identity capture must be *earned* through value exchange:

```
Tier 0 — Anonymous
  └─ Scene renders, chat begins, product cards shown
  └─ No data required, full experience accessible

Tier 1 — Skin Profile Created (no email needed)
  └─ Triggered: After 3+ turns in consultation
  └─ Value prop: "Save your results to pick up where you left off"
  └─ Captures: Session-persistent profile (localStorage)
  └─ Data: Skin type, concerns, routine preferences

Tier 2 — Email Identified
  └─ Triggered: Routine complete / Skin analysis done / Retailer handoff
  └─ Value prop: "Email me this routine" / "Alert me to sales"
  └─ Captures: Email → CRM contact + Data Cloud profile
  └─ Data: All of Tier 1 + email, retailer preference

Tier 3 — Full Profile (repeat visitor)
  └─ Triggered: Return visit, cookie match or email link click
  └─ Value prop: "Welcome back — your skin report from last visit..."
  └─ Captures: Behavioral history, routine updates, purchase signals
  └─ Data: Full longitudinal skin profile
```

---

## Agent Tone & Persona for Cetaphil

The brand is "dermatologist recommended, gentle, trustworthy." The agent voice must match:

**Not this:**
> "Based on your selection, I've identified 3 SKUs that match your criteria!"

**This:**
> "Given what you've described, I'd start simple — a gentle cleanser and a fragrance-free moisturizer. Cetaphil's strength is that less is often more, especially for sensitive skin."

**Agent persona attributes:**
- Calm, knowledgeable, not salesy
- Uses plain language (not ingredient-forward unless user asks)
- Leads with the skin concern, not the product
- Offers to explain the *why* behind recommendations
- Never pressures toward a retailer — frames it as helpful routing

---

## What NOT to Build (Scope Discipline)

Given the "limited capabilities" constraint, explicitly avoid:

| Feature | Reason to Skip |
|---------|---------------|
| Real-time inventory lookup | API complexity, data freshness risk |
| Price comparison across retailers | Brand relationship risk |
| Loyalty points accumulation | No direct commerce relationship |
| User-generated reviews in-chat | Moderation overhead |
| Live dermatologist chat handoff | Liability, staffing |
| In-chat purchase with redirect | Adds friction vs. direct deep-link |

The agent should **route and enrich**, not transact or adjudicate.

---

## Implementation Priority Stack

### Phase 1 — Foundation (Replaces static Product Finder)
1. Conversational skin consultation flow (5–7 turn agent arc)
2. `SHOW_PRODUCTS` directive with routine framing
3. Basic profile capture to Data Cloud
4. Email capture at routine completion
5. Scene changes based on consultation topic

### Phase 2 — Skin Analysis Integration
6. `LAUNCH_SKIN_ANALYSIS` directive opens selfie modal
7. Post-analysis conversation arc (enrich report with context)
8. `SHOW_SKIN_REPORT` directive with visual score cards
9. Report email delivery with routine attachment

### Phase 3 — Retailer Routing Intelligence
10. Retailer preference capture in conversation
11. `RETAILER_HANDOFF` directive with UTM-tagged deep links
12. `STORE_LOCATOR` directive with map component
13. Promotional awareness (if retailer feed available)

### Phase 4 — Longitudinal Engagement
14. Return visitor recognition (cookie + email)
15. Profile comparison ("Your skin since last visit...")
16. Seasonal re-engagement flows
17. Routine update prompts ("It's been 3 months — ready to level up?")

---

## Mapping to Existing Repo Architecture

| Cetaphil Need | Existing Asset | Modification Required |
|---------------|----------------|-----------------------|
| Skin consultation conversation | `ConversationContext` + Agent topics | Add skin-specific agent topic files |
| Skin profile capture | `CustomerContext` + Data Cloud | Add `SkinProfile` type, new capture events |
| Routine display | `ProductShowcase` component | Add `RoutineCard` view mode |
| Retailer handoff | Mock checkout flow (stub) | Swap `CheckoutOverlay` → `RetailerHandoff` overlay |
| Skin analysis modal | Not yet built | New component, `LAUNCH_SKIN_ANALYSIS` directive |
| Scene changes by topic | `SceneContext` + `GenerativeBackground` | Add Cetaphil scene mapping config |
| Identity funnel | `IdentityPanel` | Add tier logic, value prop messaging |
| Agent persona | `AGENT_PROMPT_TEMPLATE.md` | Rewrite for Cetaphil brand voice |

---

## The Attribution Flywheel

The ultimate goal: close the loop between digital consultation and in-store purchase.

```
Digital Consultation
    │
    ├─ Skin Profile Created (Data Cloud)
    │
    ├─ Retailer Handoff (UTM attribution)
    │        │
    │        └─ Retailer purchase signal (if partner data share enabled)
    │
    ├─ Email Captured → remarketing list
    │        │
    │        └─ Post-purchase survey → confirms attribution
    │
    └─ Return Visit (cookie match)
             │
             └─ Updated profile → refined recommendations
             └─ "You visited us before your Target purchase — how is the routine going?"
```

Every conversation that ends with a retailer handoff + email capture is a *attributable touchpoint* — even if the purchase happens offline, 3 days later, at a different retailer than suggested.

This is the business case for the conversational approach: **richer signals, longer attribution windows, higher match rates** than a static "Where to Buy" click ever produces.
