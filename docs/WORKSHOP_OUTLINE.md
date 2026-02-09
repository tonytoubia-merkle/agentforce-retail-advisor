# Modern Salesforce Ecosystem Workshop
## Internal Working Session — 2 Hours

> **Format**: Harbor cruise through everything we've built. Minimal slides, maximum live demo.
> **Goal**: Help the team understand how Agentforce, Data Cloud, MC Advanced, and SF Personalization work together end-to-end.

---

## Pre-Workshop Setup Checklist

- [ ] App running locally (`npm run dev` + `npm run server`)
- [ ] Salesforce org open (Data Cloud, MC Advanced, Agentforce)
- [ ] VS Code open with codebase
- [ ] Browser dev tools ready (Network tab)
- [ ] Terminal ready for API calls
- [ ] Demo personas reset if needed

---

## Session Structure

| Time | Section | Format |
|------|---------|--------|
| 0:00 | Opening + Context | Slide |
| 0:10 | The Customer Journey (Live Demo) | App + Salesforce |
| 0:40 | Under the Hood: Data Flow | Code + Dev Tools |
| 1:00 | Break | 10 min |
| 1:10 | Build Session: Your First Integration | Hands-on |
| 1:40 | Discussion: What Would You Build? | Whiteboard |
| 1:55 | Wrap-up + Next Steps | Slide |

---

# SLIDE 1: The Modern Salesforce Stack (5 min)

**Title**: One Customer, One Platform, Many Touchpoints

**Visual**: Simple diagram showing the pieces:

```
┌─────────────────────────────────────────────────────────────┐
│                     CUSTOMER EXPERIENCE                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │   Web   │  │  Email  │  │   SMS   │  │ Conversational  │ │
│  │  Store  │  │ Journey │  │ Journey │  │   AI Agent      │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘ │
└───────┼────────────┼────────────┼─────────────────┼─────────┘
        │            │            │                 │
        ▼            ▼            ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA CLOUD                            │
│  Unified Customer Profile • Events • Segmentation           │
└─────────────────────────────────────────────────────────────┘
        │            │            │                 │
        ▼            ▼            ▼                 ▼
┌─────────┐  ┌─────────────┐  ┌───────────┐  ┌─────────────┐
│Commerce │  │ MC Advanced │  │Personali- │  │ Agentforce  │
│ Cloud   │  │  (Journeys) │  │  zation   │  │ (Einstein)  │
└─────────┘  └─────────────┘  └───────────┘  └─────────────┘
```

**Talking Points**:
- "We're going to see all of this working together in one retail demo"
- "This isn't theoretical — it's running right now"
- "By the end, you'll understand every data hop and API call"

---

# DEMO 1: The Anonymous Customer (10 min)

**What you're showing**: How SF Personalization + Data Cloud track behavior before we know who someone is

### Steps:

1. **Open the app fresh** (incognito or clear local storage)
   - Point out: "No login, no cookies — truly anonymous"

2. **Browse a few products**
   - Click into Serums category
   - View 2-3 products
   - Add one to cart but don't checkout

3. **Open browser dev tools → Network tab**
   - Filter for `evergage` or the beacon URL
   - Show the event payloads going to SF Personalization
   - "Every click, every product view — streaming to Data Cloud in real-time"

4. **Switch to Salesforce → Data Cloud**
   - Open the Web Connector ingestion logs
   - Show the anonymous profile being built
   - "They don't have a name yet, but we know their interests"

5. **Back to the app → Hero banner**
   - If personalization is working, the hero might already reflect interests
   - "SF Personalization is making real-time decisions about what to show"

### Key Point:
> "The customer hasn't given us anything — no email, no login. But Data Cloud is already building a behavioral profile. This is the foundation for everything else."

---

# DEMO 2: Identity Resolution — The Merkury Moment (10 min)

**What you're showing**: How pseudonymous recognition connects third-party data before first-party capture

### Steps:

1. **Open the persona selector** (profile dropdown)
   - Show the list of demo personas
   - "These simulate Merkury identity graph matches — third-party data enrichment"

2. **Select Sarah (Pseudonymous persona)**
   - Watch the UI update: "Welcome, Sarah"
   - But NOT logged in — still pseudonymous

3. **Explain the three identity tiers**:
   ```
   Anonymous → Appended (Merkury) → Known (CRM)
       ↓              ↓                  ↓
   Behavior only   + Demographics    + Purchase history
                   + Interests       + Loyalty
                   + Household       + Full profile
   ```

4. **Show VS Code → `src/contexts/CustomerContext.tsx`**
   - Show the `selectPersona` function
   - "Here's where we resolve identity and fetch enriched data"

5. **Show the API call in dev tools**
   - The Data Cloud query that fetches Sarah's profile
   - "Even though Sarah hasn't logged in, we know her skin type, her past interests"

### Key Point:
> "This is the 'aha' moment for clients. You can personalize BEFORE someone logs in, using identity graph data. The app doesn't wait for registration."

---

# DEMO 3: The Agentforce Conversation (10 min)

**What you're showing**: AI agent with full customer context, driving commerce actions

### Steps:

1. **Click "Beauty Advisor" button**
   - The chat interface opens

2. **Start with a question**: "What would you recommend for dry skin?"
   - Watch the agent respond with context-aware suggestions
   - "The agent knows Sarah's skin type, her past purchases, her browse history"

3. **Show VS Code → `src/services/agentforce/index.ts`**
   - Scroll to where context variables are set
   - "We're passing ALL of this to the agent: orders, loyalty, chat history, meaningful events"

4. **Ask the agent to add something to cart**
   - "Add the vitamin C serum to my cart"
   - Watch the directive come back and execute

5. **Show the directive parsing** (in code or console):
   ```json
   {
     "action": "RECOMMEND_PRODUCTS",
     "products": ["serum-vitamin-c"],
     "reasoning": "Based on your dry skin concerns..."
   }
   ```

6. **Ask about checkout**: "I'm ready to check out"
   - Agent initiates checkout flow
   - "The agent isn't just answering questions — it's driving the entire purchase journey"

### Key Point:
> "Agentforce isn't a chatbot bolted on. It has full context and can take real actions. It's an employee, not a FAQ widget."

---

# DEMO 4: The Purchase → Journey Trigger (10 min)

**What you're showing**: Order creation triggers MC Advanced journeys automatically

### Steps:

1. **Complete the checkout**
   - Fill in shipping info
   - Submit order
   - Watch the confirmation screen

2. **Show VS Code → `server/index.js`** (checkout endpoint)
   - "Here's where we create the real Salesforce Order"
   - Show the Order + OrderItem creation

3. **Switch to Salesforce → Setup → Flows**
   - Find the Record-Triggered Flow on Order
   - "When Order.Status = 'Activated', this flow fires"

4. **Show MC Advanced → Journey list**
   - Find the post-purchase journey
   - "The customer just got enrolled in this journey — triggered by the Order"

5. **Simulate shipping update** (via API or admin endpoint):
   ```bash
   curl -X POST localhost:3001/api/order/simulate-shipment \
     -H "Content-Type: application/json" \
     -d '{"orderId": "801xx...", "status": "Shipped"}'
   ```
   - "Status change triggers another flow — shipping confirmation email"

### Key Point:
> "MC Advanced journeys on Core are record-triggered. No separate journey builder UI needed for simple flows. Data changes = journey steps fire."

---

# BREAK (10 min)

---

# SLIDE 2: The Data Flow (5 min)

**Title**: Every Click, Every Purchase, Every Conversation

**Visual**: Data flow diagram

```
                     BROWSER
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   SF Personalization  Agentforce    Commerce
   (Web SDK events)    (Chat API)    (Checkout)
        │               │               │
        ▼               ▼               ▼
    ┌───────────────────────────────────────┐
    │            DATA CLOUD                  │
    │  ┌─────────────────────────────────┐  │
    │  │ Unified Individual (Profile)     │  │
    │  │ • Web events → behavior signals  │  │
    │  │ • Chat summaries → preferences   │  │
    │  │ • Orders → purchase history      │  │
    │  │ • Identity → Merkury resolution  │  │
    │  └─────────────────────────────────┘  │
    └───────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   Segmentation    Triggered        Real-time
   (Audience)      Actions          Personalization
        │               │               │
        ▼               ▼               ▼
   MC Advanced     Abandonment      SF Personalization
   Campaigns       Journeys         Decisions
```

**Talking Points**:
- "Data Cloud is the gravity well — everything flows into it"
- "Once it's there, three things happen: segmentation, triggers, real-time decisions"
- "Let's look at the code that makes this work"

---

# HANDS-ON: Under the Hood (30 min)

**Goal**: Participants trace a single event from click to action

### Exercise 1: Trace a Product View Event (10 min)

**Instructions**:
1. Open `src/services/personalization/index.ts`
2. Find `trackViewProduct()` function
3. Follow the data:
   - What fields are sent?
   - Where does the SDK send it?
   - How does Data Cloud receive it?

**Discussion Questions**:
- What would you add to this event?
- How would a segment use this data?

### Exercise 2: Add a Custom Event (15 min)

**Instructions**:
1. Create a new function: `trackWishlistAdd(product: Product)`
2. Send to SF Personalization with:
   - Product ID
   - Category
   - Price
   - Timestamp
3. Test it in the app

**Code Scaffold**:
```typescript
// In src/services/personalization/index.ts

export async function trackWishlistAdd(product: Product): Promise<void> {
  const sdk = await getSfpSdk();
  if (!sdk) return;

  sdk.sendEvent({
    // What goes here?
  });
}
```

### Exercise 3: Query Data Cloud (5 min)

**Instructions**:
1. Open Salesforce → Data Cloud → Query Explorer
2. Write a SOQL query to find all customers who viewed a product but didn't purchase
3. How would you use this for a campaign?

---

# DISCUSSION: What Would You Build? (15 min)

**Prompt**: Given what you've seen, what use cases would you pitch to a client?

### Discussion Framework:

| Use Case | Which Components? | Data Required |
|----------|-------------------|---------------|
| ? | ? | ? |

**Starter Ideas**:
- Abandoned cart SMS with dynamic product image
- "Your stylist picked these for you" email with agent-generated recommendations
- In-app banner that changes based on weather + skin concern
- Loyalty milestone celebration journey
- Post-purchase feedback capture via agent

**For Each Idea, Ask**:
1. What event triggers it?
2. What data does it need?
3. Which cloud executes it?
4. How does the customer experience it?

---

# SLIDE 3: Getting Started (5 min)

**Title**: Your Starter Kit

**Content**:

### 1. Clone the Repo
```bash
git clone <this-repo>
npm install
cp .env.example .env.local
```

### 2. Configure Your Org
- Create Connected App (OAuth Client Credentials)
- Enable Data Cloud
- Configure Web Connector
- Create demo personas

### 3. Start Building
```bash
npm run dev      # Frontend
npm run server   # API proxy
```

### 4. Key Files to Study
| Area | Files |
|------|-------|
| Customer context | `src/contexts/CustomerContext.tsx` |
| Agentforce integration | `src/services/agentforce/index.ts` |
| SF Personalization | `src/services/personalization/index.ts` |
| Checkout flow | `server/index.js` (checkout endpoint) |
| Demo personas | `src/mocks/customerPersonas.ts` |

### 5. Documentation
- `docs/PERSONALIZATION_SETUP_INSTRUCTIONS.md`
- `docs/FUTURE_PORTFOLIO_MANAGEMENT.md` (future concepts)
- Salesforce Data Cloud docs
- Agentforce API reference

---

# WRAP-UP

**Three Takeaways**:

1. **Data Cloud is the center of gravity**
   - Everything flows in, insights flow out
   - Identity resolution enables personalization before login

2. **Agentforce is an employee, not a feature**
   - Full context, real actions
   - Drives commerce, not just conversations

3. **MC Advanced journeys are record-triggered**
   - No separate builder for simple flows
   - Data changes = journey steps fire

**Next Steps**:
- Get access to the demo org
- Run the app locally with mock data
- Pick one integration to deep-dive next week

**Questions?**

---

# APPENDIX: Quick Reference

## API Endpoints (Local Server)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/products` | Product catalog |
| `POST /api/contacts` | Create CRM contact |
| `POST /api/checkout` | Create Order |
| `POST /api/agentforce/sessions` | Start agent session |
| `POST /api/agentforce/sessions/:id/messages` | Send message |
| `GET /api/datacloud/query` | Proxy SOQL queries |
| `POST /api/order/simulate-shipment` | OMS simulation |

## Key Context Variables (Agentforce)

| Variable | Type | Description |
|----------|------|-------------|
| `customerId` | String | Contact ID |
| `customerEmail` | String | Email address |
| `loyaltyTier` | String | Bronze/Silver/Gold |
| `recentOrders` | JSON | Last 5 orders |
| `chatSummaries` | JSON | Past conversation context |
| `browseInterests` | JSON | Categories viewed |
| `capturedProfile` | JSON | Agent-learned preferences |

## Demo Personas

| Name | Tier | Skin Type | Best For Demoing |
|------|------|-----------|------------------|
| Sarah | Known | Dry | Full personalization |
| Emma | Appended | Oily | Merkury enrichment |
| Guest | Anonymous | — | New user journey |

---

# BACKUP DEMOS (If Time Permits)

## Generative Hero Banner
1. Show Firefly/Imagen integration
2. Demonstrate prompt → image generation
3. Show how SF Personalization chooses which hero to show

## Loyalty Flow
1. Complete purchase
2. Show points accrual
3. Show tier calculation
4. Demonstrate redemption

## OMS Simulation
1. Create order
2. Simulate: Processing → Shipped → Delivered
3. Show each status change triggers a flow
4. Track emails sent at each stage
