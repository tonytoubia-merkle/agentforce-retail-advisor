# Future: Portfolio & Marketer Management in an Agent-Assisted World

> **Status**: Concept exploration - saved for future reference
> **Context**: How do we think about assigning marketers/sellers to portfolios, event types, and regions when AI agents handle most execution?

---

## The Core Shift

**Traditional model**: Marketer owns customers → executes campaigns → measures results

**Agent-assisted model**: Marketer owns strategy → agent executes at scale → marketer handles exceptions + sets guardrails

The human role shifts from "doer" to "orchestrator" — but orchestration still needs structure.

---

## Portfolio Ownership Models

### Option 1: Event-Type Ownership
Marketers specialize by *what happens*:

| Portfolio Owner | Event Types Owned |
|-----------------|-------------------|
| Retention Lead | Cart abandonment, browse abandonment, win-back |
| Onboarding Lead | New signup, first purchase, welcome series |
| VIP Manager | High-value transactions, loyalty tier changes |
| Service Recovery | Complaints, returns, negative reviews |

**Pros**: Deep expertise in specific moments
**Cons**: Customer experiences multiple "owners" across their journey

### Option 2: Segment Ownership
Marketers own *customer cohorts*:

| Portfolio Owner | Segment |
|-----------------|---------|
| Emma | VIP customers (top 5% LTV) |
| James | At-risk customers (declining engagement) |
| Sofia | New customers (< 90 days) |
| Regional teams | Geographic territories |

**Pros**: Holistic customer view, relationship continuity
**Cons**: Requires generalist skills across all event types

### Option 3: Hybrid Matrix (Recommended)

```
                    EVENTS
              Abandon  Onboard  Winback  VIP-Touch
SEGMENTS    ┌────────┬────────┬────────┬────────┐
VIP         │ Agent  │ Agent  │ Agent  │ HUMAN  │  ← Only VIP touches need human
            │ + Emma │ + Emma │ + Emma │  Emma  │
            ├────────┼────────┼────────┼────────┤
At-Risk     │ Agent  │ Agent  │ HUMAN  │ Agent  │  ← Winback needs human judgment
            │ + James│ + James│ James  │ + James│
            ├────────┼────────┼────────┼────────┤
Standard    │ Agent  │ Agent  │ Agent  │ Agent  │  ← Fully automated
            │  only  │  only  │  only  │  only  │
            └────────┴────────┴────────┴────────┘
```

The agent handles everything; humans are assigned to cells where intervention matters.

---

## The Experience: Creating & Assigning Portfolio Owners

### 1. Portfolio Definition (Admin View)

```
┌─────────────────────────────────────────────────────────┐
│  PORTFOLIO BUILDER                                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Portfolio Name: [ VIP Retention - Americas ]            │
│                                                          │
│  SCOPE DIMENSIONS                                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Customer Segment   [x] VIP    [ ] Standard      │    │
│  │ Region             [x] Americas  [ ] EMEA       │    │
│  │ Product Affinity   [x] All                      │    │
│  │ Event Types        [x] Abandonment              │    │
│  │                    [x] Winback                  │    │
│  │                    [ ] Onboarding               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  AGENT AUTONOMY LEVEL                                    │
│  ○ Full Auto (agent handles, human reviews weekly)      │
│  ● Supervised (agent drafts, human approves)            │
│  ○ Assisted (human leads, agent suggests)               │
│                                                          │
│  ESCALATION TRIGGERS                                     │
│  [x] Order value > $500                                  │
│  [x] Customer expressed frustration                     │
│  [x] 3+ failed touchpoints                              │
│  [ ] Custom rule: _______________________               │
│                                                          │
│  ASSIGNED OWNER                                          │
│  [ Select marketer... ▼ ]   Capacity: 2,400 customers   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2. Marketer Dashboard (Owner View)

```
┌─────────────────────────────────────────────────────────────┐
│  MY PORTFOLIOS                          Emma Chen           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ VIP Retention   │  │ VIP Onboarding  │                   │
│  │ Americas        │  │ Americas        │                   │
│  │ ─────────────── │  │ ─────────────── │                   │
│  │ 2,341 customers │  │ 89 customers    │                   │
│  │ 12 need review  │  │ 3 need review   │                   │
│  │ Agent: 94% auto │  │ Agent: 88% auto │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  NEEDS YOUR ATTENTION (15)                    View All →    │
│  ─────────────────────────────────────────────────────────  │
│  ● Sarah M. — VIP abandoned $892 cart — Agent drafted       │
│    email, awaiting approval                    [Review]     │
│                                                              │
│  ● Marcus T. — Escalated: "frustrated with service"        │
│    Agent paused outreach                       [Take Over]  │
│                                                              │
│  ● Jennifer K. — 3 winback attempts failed                  │
│    Agent suggests phone call                   [Decide]     │
│                                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  AGENT ACTIVITY (last 24h)                                  │
│  ─────────────────────────────────────────────────────────  │
│  📧 47 emails sent autonomously                             │
│  💬 12 SMS sent autonomously                                │
│  ⏸️  3 paused for your review                               │
│  ✅ 8 conversions attributed                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Assignment Flow (Team Lead View)

```
┌─────────────────────────────────────────────────────────────┐
│  TEAM CAPACITY & ASSIGNMENTS                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TEAM MEMBERS                                                │
│  ┌────────────┬───────────┬───────────┬──────────────────┐  │
│  │ Name       │ Capacity  │ Assigned  │ Utilization      │  │
│  ├────────────┼───────────┼───────────┼──────────────────┤  │
│  │ Emma C.    │ 3,000     │ 2,430     │ ████████░░ 81%   │  │
│  │ James R.   │ 2,500     │ 2,100     │ ████████░░ 84%   │  │
│  │ Sofia M.   │ 2,000     │ 1,200     │ ██████░░░░ 60%   │  │
│  │ Unassigned │ —         │ 4,500     │ ⚠️ Needs owner   │  │
│  └────────────┴───────────┴───────────┴──────────────────┘  │
│                                                              │
│  UNASSIGNED PORTFOLIOS                                       │
│  ─────────────────────────────────────────────────────────  │
│  ⚠️ EMEA VIP Retention (1,200 customers)     [Assign →]     │
│  ⚠️ APAC Onboarding (3,300 customers)        [Assign →]     │
│                                                              │
│  AUTO-BALANCE OPTIONS                                        │
│  [ ] Enable auto-rebalancing when utilization > 90%         │
│  [ ] Route overflow to shared pool                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. What's the Unit of Ownership?

| Option | Unit | Tradeoff |
|--------|------|----------|
| Customer-centric | Individual customer record | High personalization, complex handoffs |
| Segment-centric | Cohort/segment | Scalable, less personal |
| Event-centric | Individual interaction | Deep expertise, fragmented journey |
| Campaign-centric | Specific initiative | Clear scope, short-lived |

**Recommendation**: Segment-centric with event-type routing rules. Own the segment, but define which events require human touch.

### 2. Agent Autonomy Levels

```
Level 1: FULL AUTO
├── Agent executes all touchpoints
├── Human reviews weekly summary
└── Escalates only on defined triggers

Level 2: SUPERVISED
├── Agent drafts all communications
├── Human approves before send
└── Agent learns from approvals/edits

Level 3: ASSISTED
├── Human creates touchpoints
├── Agent suggests timing, content, channel
└── Agent handles scheduling/logistics

Level 4: MANUAL + INSIGHTS
├── Human does everything
├── Agent provides real-time recommendations
└── Used for highest-value relationships
```

### 3. Conflict Resolution: Multi-Dimensional Overlap

When a customer fits multiple portfolios:

```
Customer: Sarah
├── VIP tier → owned by VIP team
├── Located in EMEA → owned by EMEA team
├── Fragrance affinity → owned by fragrance specialist
└── Currently in complaint flow → owned by service recovery

WHO OWNS THIS MOMENT?
```

**Resolution strategies**:
- **Primary/Secondary**: VIP status trumps region trumps product
- **Event takes precedence**: Complaint flow overrides everything during resolution
- **Collaborative**: All owners see activity, one is "active" at a time
- **Agent decides**: Route to owner with most context on this customer

### 4. Permission Model

```typescript
interface PortfolioOwner {
  id: string;
  name: string;
  role: 'owner' | 'collaborator' | 'observer';

  permissions: {
    // Strategy
    canDefineSegmentRules: boolean;
    canSetAgentAutonomy: boolean;
    canCreateEscalationTriggers: boolean;

    // Execution
    canApproveAgentDrafts: boolean;
    canOverrideAgentDecisions: boolean;
    canSendDirectOutreach: boolean;
    canTakeOverConversations: boolean;

    // Analysis
    canViewPerformanceMetrics: boolean;
    canExportCustomerData: boolean;
    canModifyAttribution: boolean;
  };

  scope: {
    regions: Region[];
    segments: CustomerSegment[];
    eventTypes: EventType[];
    productCategories: ProductCategory[];
  };

  capacity: {
    maxCustomers: number;
    maxDailyInterventions: number;
  };
}
```

---

## The "New" Marketer Role

In this model, the marketer's job becomes:

1. **Portfolio Architect**: Define segments, set rules, tune agent behavior
2. **Exception Handler**: Handle what the agent can't/shouldn't do alone
3. **Quality Controller**: Review agent outputs, provide corrections that train the system
4. **Relationship Steward**: Take over for moments that matter (VIP, complaints, high-stakes)
5. **Strategist**: Analyze patterns across their portfolio, propose new approaches

---

## Future Development Areas

- Data models and API contracts for portfolio management
- UI wireframes for portfolio builder
- Agent handoff protocol specification
- Performance attribution model (human vs agent contribution)
- Trust/autonomy level progression system
