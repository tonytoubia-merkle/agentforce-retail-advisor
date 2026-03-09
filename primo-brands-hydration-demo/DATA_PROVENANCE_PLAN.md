# Data Provenance & Usage Tiers — Implementation Plan

## Problem

Not all customer data has the same trust level. Today, the agent context (`buildWelcomeMessage`) flattens everything into plain strings — purchase history, stated preferences, browse behavior, and Merkury-appended demographics all look the same to the agent. This means the agent can't distinguish between "the customer told us this" and "we inferred/appended this behind the scenes."

The result: risk of referencing data too directly when it was never voluntarily shared, which feels invasive.

## Proposed Data Usage Tiers

| Tier | Label | Source | Agent Can... | Example |
|------|-------|--------|-------------|---------|
| **0P** | `STATED` | Customer said it directly in chat | Reference explicitly: "You mentioned..." | "My birthday is in March" |
| **1P-EXPLICIT** | `DECLARED` | Preference center, profile forms, account creation | Reference explicitly: "Based on your profile..." | Skin type = sensitive (from preference form) |
| **1P-BEHAVIORAL** | `OBSERVED` | Purchase history, order data | Reference explicitly: "I see you've purchased..." | Bought Cloud Cream Cleanser on 11/15 |
| **1P-IMPLICIT** | `INFERRED` | Browse sessions, time-on-page, click patterns | Reference softly: "You were looking at..." | Browsed retinol serums for 8 minutes |
| **DERIVED** | `AGENT_INFERRED` | Agent's own inference from conversations | Reference softly: "It seems like you prefer..." | "Prefers lightweight textures" (agent noted) |
| **3P** | `APPENDED` | Merkury/third-party data append | **Never reference directly** — influence only | Interests: luxury beauty, anti-aging |

## Implementation Steps

### 1. Add `DataProvenance` type

```typescript
// src/types/customer.ts

export type DataProvenance =
  | 'stated'          // 0P: customer said it in conversation
  | 'declared'        // 1P-explicit: preference form, account profile
  | 'observed'        // 1P-behavioral: purchase history, orders
  | 'inferred'        // 1P-implicit: browse behavior, click patterns
  | 'agent_inferred'  // Derived: agent's inference from conversations
  | 'appended';       // 3P: Merkury or other third-party append

export type UsagePermission = 'direct' | 'soft' | 'influence_only';

export const PROVENANCE_USAGE: Record<DataProvenance, UsagePermission> = {
  stated: 'direct',
  declared: 'direct',
  observed: 'direct',
  inferred: 'soft',
  agent_inferred: 'soft',
  appended: 'influence_only',
};
```

### 2. Tag `CustomerSessionContext` fields with provenance

```typescript
// src/types/customer.ts

export interface TaggedContextField {
  value: string;
  provenance: DataProvenance;
  usage: UsagePermission; // computed from PROVENANCE_USAGE
}

export interface CustomerSessionContext {
  // ... existing fields ...

  // NEW: structured context with provenance tags
  taggedContext?: TaggedContextField[];
}
```

### 3. Build tagged context in `buildSessionContext`

In `ConversationContext.tsx`, when building the session context:

```typescript
const taggedContext: TaggedContextField[] = [];

// 1P-EXPLICIT: from beauty profile (preference center)
if (customer.beautyProfile.skinType) {
  taggedContext.push({
    value: `Skin type: ${customer.beautyProfile.skinType}`,
    provenance: 'declared',
    usage: 'direct',
  });
}

// 1P-BEHAVIORAL: from order history
for (const order of customer.orders) {
  taggedContext.push({
    value: `Purchased ${order.lineItems.map(li => li.productName).join(', ')} on ${order.orderDate}`,
    provenance: 'observed',
    usage: 'direct',
  });
}

// 1P-IMPLICIT: from browse sessions
for (const session of customer.browseSessions) {
  taggedContext.push({
    value: `Browsed ${session.categoriesBrowsed.join(', ')}`,
    provenance: 'inferred',
    usage: 'soft',
  });
}

// AGENT-INFERRED: from agentCapturedProfile
if (customer.agentCapturedProfile) {
  for (const [key, field] of Object.entries(customer.agentCapturedProfile)) {
    if (!field) continue;
    const prov = field.confidence === 'stated' ? 'stated' : 'agent_inferred';
    taggedContext.push({
      value: `${key}: ${typeof field.value === 'string' ? field.value : JSON.stringify(field.value)}`,
      provenance: prov,
      usage: PROVENANCE_USAGE[prov],
    });
  }
}

// 3P-APPENDED: from Merkury
if (customer.appendedProfile?.interests) {
  for (const interest of customer.appendedProfile.interests) {
    taggedContext.push({
      value: interest,
      provenance: 'appended',
      usage: 'influence_only',
    });
  }
}
```

### 4. Update `buildWelcomeMessage` to emit tagged instructions

```typescript
function buildWelcomeMessage(ctx: CustomerSessionContext): string {
  const lines: string[] = ['[WELCOME]'];

  // ... identity header as today ...

  // Emit tagged context with usage instructions
  if (ctx.taggedContext?.length) {
    const direct = ctx.taggedContext.filter(f => f.usage === 'direct');
    const soft = ctx.taggedContext.filter(f => f.usage === 'soft');
    const influence = ctx.taggedContext.filter(f => f.usage === 'influence_only');

    if (direct.length) {
      lines.push(`[CONFIRMED — OK to reference directly]`);
      direct.forEach(f => lines.push(`  ${f.value}`));
    }
    if (soft.length) {
      lines.push(`[OBSERVED/INFERRED — reference gently, e.g. "it looks like..." or "you might enjoy..."]`);
      soft.forEach(f => lines.push(`  ${f.value}`));
    }
    if (influence.length) {
      lines.push(`[INFLUENCE ONLY — use to curate selections, NEVER reference directly]`);
      influence.forEach(f => lines.push(`  ${f.value}`));
    }
  }

  return lines.join('\n');
}
```

### 5. Update Agent Prompt Template

Add to `salesforce/AGENT_PROMPT_TEMPLATE.md`:

```markdown
## Data Usage Rules

Context provided to you is tagged with usage permissions:

- **[CONFIRMED]**: Customer stated or declared this directly. You may reference it explicitly.
  - ✅ "You mentioned your anniversary is coming up"
  - ✅ "Based on your sensitive skin profile..."
  - ✅ "I see you purchased the Cloud Cream Cleanser"

- **[OBSERVED/INFERRED]**: Behavioral signals or agent inferences. Reference gently.
  - ✅ "You were looking at retinol recently — still interested?"
  - ✅ "It seems like you prefer lightweight textures"
  - ❌ "Our data shows you browsed serums for 8 minutes"

- **[INFLUENCE ONLY]**: Third-party appended data. NEVER mention directly.
  - ✅ Lead with premium/luxury products (if affluent signal)
  - ✅ Set a wellness-themed scene (if wellness signal)
  - ❌ "I see you're interested in clean beauty"
  - ❌ "Based on your profile, you might like..."
  - ❌ Any mention of knowing their interests, demographics, or lifestyle
```

### 6. Update mock agent to respect tags

The mock agent should also check provenance when building responses. For example, when recommending products for an appended user, frame them as "popular" or "trending" rather than "perfect for you."

## Existing Infrastructure That Supports This

- `CapturedProfileField.confidence: 'stated' | 'inferred'` — already distinguishes how the agent learned something
- `AppendedProfile` — already separated from first-party data in the type system
- `CustomerSessionContext.appendedInterests` — already a separate field from `concerns`, `browseInterests`, etc.
- `identityTier` — already gates behavior in the mock agent

## Priority

This should be implemented before any real Agentforce deployment, since the real agent will need clear provenance tags in its system prompt to avoid privacy violations at scale. The mock agent changes are a good prototype but the real value is in the structured context sent to the LLM-powered agent.
