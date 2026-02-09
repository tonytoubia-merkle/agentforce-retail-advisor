# Marketing Cloud Advanced Masterclass
## Orchestrating Connected Customer Journeys with the Full Salesforce Stack

**Duration**: 2 Hours
**Format**: Demo-driven workshop with hands-on campaign building
**Audience**: Salesforce practitioners, marketers, solution architects

---

# Before We Start: Get Set Up to Build This Yourself

## The Goal

By the end of this workshop, you'll have everything you need to **fork this project and deploy it to your own Salesforce org**. Don't just watch — build alongside us!

---

## Step 1: Fork the Repository

### Get the Code

```
📦 Repository: https://github.com/dentsu-sf/agentforce-retail-advisor
```

**Option A: Fork on GitHub** (Recommended)
1. Go to the repository URL above
2. Click **Fork** (top right)
3. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/agentforce-retail-advisor.git
   cd agentforce-retail-advisor
   ```

**Option B: Download ZIP**
1. Go to the repository
2. Click **Code** → **Download ZIP**
3. Extract to your projects folder

---

## Step 2: Get Your Tools

### Required Tools

| Tool | What It Does | Get It Here |
|------|--------------|-------------|
| **VS Code** | Code editor with Salesforce extensions | [code.visualstudio.com](https://code.visualstudio.com/) |
| **Salesforce CLI (sf)** | Deploy metadata, run Apex, manage orgs | [developer.salesforce.com/tools/salesforcecli](https://developer.salesforce.com/tools/salesforcecli) |
| **Node.js 18+** | Runs the local server | [nodejs.org](https://nodejs.org/) |
| **Git** | Version control | [git-scm.com](https://git-scm.com/) |

### Recommended Tools

| Tool | What It Does | Get It Here |
|------|--------------|-------------|
| **Claude Code** | AI pair programmer (built this demo!) | [claude.ai/code](https://claude.ai/code) or VS Code extension |
| **Postman** | API testing | [postman.com](https://www.postman.com/) |

### VS Code Extensions

Install these from the VS Code Extensions marketplace:

1. **Salesforce Extension Pack** — Apex, LWC, SOQL, deployment tools
2. **Prettier** — Code formatting
3. **ESLint** — JavaScript/TypeScript linting
4. **GitLens** — Git history and annotations

---

## Step 3: Get a Salesforce Org

### Option A: SDO (Simple Demo Org) — Recommended for Dentsu

Request an SDO with these features enabled:
- ✅ Data Cloud
- ✅ Marketing Cloud Advanced
- ✅ Agentforce
- ✅ Loyalty Management

**SDO Request**: [Internal SDO Request Link]

### Option B: Developer Edition + Trials

1. Sign up for a free Developer Edition: [developer.salesforce.com/signup](https://developer.salesforce.com/signup)
2. Enable trials for:
   - Data Cloud (Setup → Data Cloud Setup)
   - Agentforce (Setup → Einstein → Agentforce)

### Option C: Existing Sandbox

Use any sandbox with the required features. Just make sure you have admin access to:
- Create Connected Apps
- Deploy metadata
- Create custom objects

---

## Step 4: Connect Your Org

### Authenticate with Salesforce CLI

```bash
# Authenticate to your org (opens browser)
sf org login web --alias my-demo-org --instance-url https://your-instance.my.salesforce.com

# Verify connection
sf org display --target-org my-demo-org
```

### Create a Connected App

1. **Setup** → **App Manager** → **New Connected App**
2. Configure:
   - **Name**: Beaute Demo App
   - **API Name**: Beaute_Demo_App
   - **Contact Email**: your email
3. Enable OAuth:
   - ✅ Enable OAuth Settings
   - **Callback URL**: `https://localhost:3000/oauth/callback`
   - **Scopes**: `api`, `refresh_token`, `offline_access`
4. Enable Client Credentials:
   - ✅ Enable Client Credentials Flow
5. Save and get your **Consumer Key** and **Consumer Secret**

### Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your values
code .env.local
```

Fill in your credentials:

```bash
# .env.local
SF_CLIENT_ID=your-connected-app-consumer-key
SF_CLIENT_SECRET=your-connected-app-consumer-secret
SF_INSTANCE=https://your-instance.my.salesforce.com

VITE_AGENTFORCE_AGENT_ID=your-agent-id
VITE_AGENTFORCE_BASE_URL=https://your-instance.my.salesforce.com

VITE_DATACLOUD_BASE_URL=https://your-instance.my.salesforce.com

# Start with mock data while setting up
VITE_USE_MOCK_DATA=true
```

---

## Step 5: Deploy the Salesforce Metadata

### Deploy Custom Objects, Flows, and Agent

```bash
# Navigate to salesforce directory
cd salesforce

# Deploy all metadata to your org
sf project deploy start --target-org my-demo-org

# Verify deployment
sf project deploy report
```

### What Gets Deployed

| Component | Description |
|-----------|-------------|
| **Custom Objects** | Chat_Summary__c, Meaningful_Event__c, Browse_Session__c, Agent_Captured_Profile__c |
| **Custom Fields** | Merkury_Id__c, Skin_Type__c, Shipping_Status__c, etc. |
| **Flows** | Post-purchase journey trigger, welcome journey, etc. |
| **Apex Classes** | DataCloudProfileService, ChatSummaryService, etc. |
| **Agent** | Beauty Concierge (Agentforce) |

### Run Setup Scripts

```bash
# Seed demo data (contacts, products, loyalty)
sf apex run --file scripts/seed-demo-data.apex --target-org my-demo-org

# Set up loyalty program
sf apex run --file scripts/setup-loyalty-program.apex --target-org my-demo-org
```

---

## Step 6: Run the App Locally

### Install Dependencies

```bash
# Back to project root
cd ..

# Install npm packages
npm install
```

### Start the Development Server

```bash
# Start both frontend and backend
npm run dev
```

### Verify It's Working

1. Open [http://localhost:5173](http://localhost:5173)
2. You should see the Beauté storefront
3. Open DevTools Console — look for `[sfp]` logs
4. Try switching personas in the profile dropdown

---

## Step 7: Configure Data Cloud (Optional but Recommended)

### Create Web Connector

1. **Data Cloud Setup** → **Web Connectors** → **New**
2. Configure:
   - **Name**: Beaute Web Events
   - **Event Types**: Page View, Add to Cart, Identity
3. Get your **Beacon URL** and **Dataset Name**
4. Add to `.env.local`:
   ```bash
   VITE_SFP_BEACON_URL=https://cdn.c360a.salesforce.com/beacon/c360a/YOUR-ID/scripts/c360a.min.js
   VITE_SFP_DATASET=your-dataset-name
   ```

### Configure Identity Resolution

1. **Data Cloud Setup** → **Identity Resolution**
2. Create rule for Merkury PID matching
3. Map Party Identification records

---

## Quick Start Checklist

```
□ Forked/cloned the repository
□ Installed VS Code + Salesforce Extension Pack
□ Installed Salesforce CLI (sf)
□ Installed Node.js 18+
□ Authenticated to Salesforce org
□ Created Connected App
□ Configured .env.local
□ Deployed Salesforce metadata
□ Ran seed scripts
□ Started local dev server
□ Verified app loads at localhost:5173
```

**Estimated setup time**: 30-45 minutes (first time) | 10 minutes (subsequent)

---

## Troubleshooting Setup Issues

| Issue | Solution |
|-------|----------|
| `sf: command not found` | Install Salesforce CLI and restart terminal |
| "Invalid grant" on auth | Re-run `sf org login web`, check Connected App settings |
| Deployment fails | Check org features enabled, verify admin permissions |
| App shows blank page | Check browser console for errors, verify `.env.local` values |
| No `[sfp]` logs | Web SDK not configured — check beacon URL |

---

## Resources

| Resource | Link |
|----------|------|
| **This Repository** | [GitHub Link] |
| **Salesforce CLI Docs** | [developer.salesforce.com/tools/salesforcecli](https://developer.salesforce.com/tools/salesforcecli) |
| **Data Cloud Docs** | [help.salesforce.com/s/articleView?id=sf.c360_a_data_cloud.htm](https://help.salesforce.com/s/articleView?id=sf.c360_a_data_cloud.htm) |
| **Agentforce Docs** | [developer.salesforce.com/docs/einstein/genai/guide/agents-intro.html](https://developer.salesforce.com/docs/einstein/genai/guide/agents-intro.html) |
| **Claude Code** | [claude.ai/code](https://claude.ai/code) |

---

*Now you're ready to follow along AND build your own version. Let's dive into Marketing Cloud Advanced!*

---

# The Central Thesis

**Marketing Cloud Advanced is the orchestration layer** — everything else feeds into it.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                │
│    │  Agentforce  │    │ Web Events   │    │  Commerce    │                │
│    │  (AI Agent)  │    │(Personalization)│  │  (Orders)    │                │
│    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                │
│           │                   │                   │                         │
│           ▼                   ▼                   ▼                         │
│    ┌─────────────────────────────────────────────────────────┐             │
│    │                      DATA CLOUD                          │             │
│    │         (Unified Profiles • Engagement Data)             │             │
│    └─────────────────────────┬───────────────────────────────┘             │
│                              │                                              │
│                              ▼                                              │
│    ┌─────────────────────────────────────────────────────────┐             │
│    │              MARKETING CLOUD ADVANCED                    │             │
│    │                                                          │             │
│    │   Record-Triggered Flows → Journey Orchestration         │             │
│    │   Triggered Actions → Real-Time Responses                │             │
│    │   Segments → Audience Targeting                          │             │
│    │   Campaigns → Multi-Channel Engagement                   │             │
│    │                                                          │             │
│    └─────────────────────────────────────────────────────────┘             │
│                              │                                              │
│                              ▼                                              │
│         ┌──────────┬──────────┬──────────┬──────────┐                      │
│         │  Email   │   SMS    │   Push   │  In-App  │                      │
│         └──────────┴──────────┴──────────┴──────────┘                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**The story**: How do events from across your ecosystem — AI conversations, web behavior, purchases — flow through Data Cloud and trigger intelligent, personalized journeys in Marketing Cloud Advanced?

---

# Workshop Agenda

| Part | Topic | Duration | Focus |
|------|-------|----------|-------|
| **0** | **Getting Started: Fork & Setup** | 5 min | Tools, repo, SDO setup overview |
| **1** | MC Advanced Architecture & The Trigger Model | 15 min | Core concepts |
| **2** | Data Cloud as the Foundation | 15 min | What feeds MC Advanced |
| **3** | Journey Triggers Deep Dive | 20 min | Record-Triggered Flows, Triggered Actions |
| **4** | Demo: The Complete Customer Journey | 20 min | Live walkthrough |
| **5** | **Hands-On: Build a Triggered Campaign** | 25 min | We build together |
| **6** | Supporting Capabilities (Agentforce, Personalization) | 15 min | How they feed MC Advanced |
| **7** | Exercise: Design Your Own Journey | 10 min | Apply what you learned |

> **Note**: The "Getting Started" section at the top of this document contains detailed setup instructions. We'll briefly walk through it at the start, but attendees can follow the full guide on their own time to replicate this demo.

---

# Part 1: MC Advanced Architecture & The Trigger Model (15 min)

## 1.1 What Makes MC Advanced Different

### The Evolution

| Generation | Product | Trigger Model |
|------------|---------|---------------|
| **1st** | Marketing Cloud (Classic) | API calls, Journey Builder entries |
| **2nd** | Marketing Cloud Engagement | Contact events, API triggers |
| **3rd** | **Marketing Cloud Advanced** | **Record-Triggered Flows on Core** |

### The Key Insight

**MC Advanced journeys are triggered by Salesforce record changes** — not API calls.

This means:
- ✅ **No custom code** to trigger a journey
- ✅ **Real-time execution** (Flows fire immediately)
- ✅ **Native Salesforce** (works with any object)
- ✅ **Declarative** (business users can modify)
- ✅ **Auditable** (Flow debug logs)

### The Pattern

```
Record Change → Record-Triggered Flow → Journey Entry → Messaging
```

Examples from this demo app:

| Record Change | Object | Field | Journey Triggered |
|---------------|--------|-------|-------------------|
| Contact created | Contact | (new record) | Welcome Journey |
| Order activated | Order | Status = 'Activated' | Post-Purchase Journey |
| Order shipped | Order | Shipping_Status__c = 'Shipped' | Ship Notification |
| Order delivered | Order | Shipping_Status__c = 'Delivered' | Delivery Confirmation |
| Cart abandoned | Browse_Session__c | Abandoned__c = true | Cart Abandonment |
| Loyalty tier change | LoyaltyMemberTier | Status = 'Active' | Tier Upgrade Journey |

## 1.2 MC Advanced Components

### Record-Triggered Flows

**What**: Salesforce Flows that fire when records are created or updated
**When to use**: Lifecycle journeys (welcome, post-purchase, renewal)
**How it works**: Flow evaluates criteria → calls journey entry action

```
┌─────────────────────────────────────────────────────────────┐
│                   Record-Triggered Flow                      │
│                                                              │
│  TRIGGER: Order.Status CHANGED TO 'Activated'                │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │   Start     │───▶│  Decision   │───▶│ Journey Entry   │  │
│  │ (Record     │    │ (Is first   │    │ Action          │  │
│  │  Change)    │    │  order?)    │    │                 │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│                     ┌─────────────┐                          │
│                     │ Update      │                          │
│                     │ Contact     │                          │
│                     │ (Last       │                          │
│                     │  Purchase)  │                          │
│                     └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Triggered Actions (Data Cloud)

**What**: Real-time responses to Data Cloud engagement events
**When to use**: Behavioral triggers (cart abandonment, browse abandonment)
**How it works**: Streaming event → Data Cloud evaluates → triggers action

```
┌─────────────────────────────────────────────────────────────┐
│                    Triggered Action                          │
│                                                              │
│  EVENT: Add_To_Cart (no purchase within 30 minutes)          │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  Streaming  │───▶│   Data      │───▶│ Marketing       │  │
│  │   Event     │    │   Cloud     │    │ Action          │  │
│  │             │    │   Rules     │    │ (Send Email)    │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### When to Use Which

| Scenario | Use This | Why |
|----------|----------|-----|
| New customer welcome | Record-Triggered Flow | Contact record created |
| Post-purchase confirmation | Record-Triggered Flow | Order record activated |
| Cart abandonment | Triggered Action | Behavioral event + time delay |
| Browse abandonment | Triggered Action | Behavioral event + time delay |
| Loyalty tier upgrade | Record-Triggered Flow | LoyaltyMemberTier record created |
| Re-engagement | Data Cloud Segment + Campaign | Time-based, segment membership |

---

# Part 2: Data Cloud as the Foundation (15 min)

## 2.1 Why Data Cloud Matters for MC Advanced

**Data Cloud is the single source of truth** that MC Advanced reads from.

### What Data Cloud Provides

1. **Unified Customer Profiles**: All customer data in one place
2. **Engagement History**: Web events, purchases, agent interactions
3. **Identity Resolution**: Match anonymous → known customers
4. **Real-Time Segments**: Dynamic audiences for targeting
5. **Calculated Insights**: LTV, propensity scores, RFM

### The Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA SOURCES                                    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Web Events   │  │ Commerce     │  │ Agentforce   │  │ CRM (Contacts)   │ │
│  │ (SDK)        │  │ (Orders)     │  │ (Chats)      │  │                  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                 │                    │           │
└─────────┼─────────────────┼─────────────────┼────────────────────┼───────────┘
          │                 │                 │                    │
          ▼                 ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA CLOUD                                      │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    UNIFIED INDIVIDUAL (Profile)                       │   │
│  │                                                                       │   │
│  │  Contact Info │ Engagement Events │ Purchase History │ Loyalty Data   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ Identity Rules   │  │ Calculated       │  │ Segments                 │   │
│  │ (Merkury PID)    │  │ Insights (LTV)   │  │ (Cart Abandoners, etc.)  │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘   │
│                                                                              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │    MARKETING CLOUD ADVANCED   │
                    │    (Journey Orchestration)    │
                    └──────────────────────────────┘
```

## 2.2 Custom Objects for Journey Data

In this demo app, we created custom objects that capture data specifically for MC Advanced journeys:

### Chat_Summary__c

Captures agent conversation summaries for follow-up journeys.

| Field | Type | Purpose |
|-------|------|---------|
| Contact__c | Lookup | Links to customer |
| Session_Date__c | DateTime | When chat occurred |
| Summary_Text__c | Long Text | Conversation summary |
| Sentiment__c | Picklist | positive, neutral, negative |
| Topics_Discussed__c | Text | Comma-separated topics |

**Journey Use Case**: "Send follow-up email 24 hours after negative sentiment chat"

### Meaningful_Event__c

Captures life events and preferences for personalized journeys.

| Field | Type | Purpose |
|-------|------|---------|
| Contact__c | Lookup | Links to customer |
| Event_Type__c | Picklist | preference, life-event, intent, concern |
| Description__c | Text | What happened |
| Captured_At__c | DateTime | When captured |
| Agent_Note__c | Text | Agent's recommendation |
| Metadata_JSON__c | Long Text | Structured data (destination, dates, etc.) |

**Journey Use Case**: "Customer mentioned upcoming trip to Miami — send travel skincare guide 1 week before"

### Browse_Session__c

Captures web browsing behavior for abandonment journeys.

| Field | Type | Purpose |
|-------|------|---------|
| Contact__c | Lookup | Links to customer |
| Session_Date__c | DateTime | When browsing occurred |
| Categories_Browsed__c | Text | Product categories viewed |
| Products_Viewed__c | Text | Specific products viewed |
| Duration_Minutes__c | Number | Time spent |
| Cart_Value__c | Currency | Value of cart (if any) |
| Abandoned__c | Checkbox | Did they leave without purchase? |

**Journey Use Case**: "Cart abandonment email with viewed products"

## 2.3 Demo: Data Cloud Profile → Journey Context

**Demo Script**:

1. Open Data Cloud → **Profile Explorer**
2. Search for Sarah Chen
3. Show the unified profile with:
   - Contact data (from CRM)
   - Engagement events (from Web SDK)
   - Orders (from Commerce)
   - Chat summaries (from Agentforce)
4. "All of this data is available to MC Advanced for personalization"
5. Show a segment: "High-Value Customers with Recent Chat"
6. "This segment could trigger a VIP follow-up journey"

**Talking Point**:
> "Data Cloud doesn't just store data — it makes data *actionable* for MC Advanced. Every event, every interaction becomes a potential journey trigger."

---

# Part 3: Journey Triggers Deep Dive (20 min)

## 3.1 Record-Triggered Flow Anatomy

Let's examine the **Post-Purchase Journey** trigger from this app:

### Flow Definition

```xml
<!-- Post_Purchase_Journey.flow-meta.xml -->
<Flow>
  <label>Post Purchase Journey Trigger</label>
  <processType>AutoLaunchedFlow</processType>

  <!-- TRIGGER: When Order is saved -->
  <start>
    <locationX>50</locationX>
    <locationY>0</locationY>
    <object>Order</object>
    <recordTriggerType>CreateAndUpdate</recordTriggerType>
    <triggerType>RecordAfterSave</triggerType>

    <!-- FILTER: Only when Status becomes Activated -->
    <filters>
      <field>Status</field>
      <operator>EqualTo</operator>
      <value>
        <stringValue>Activated</stringValue>
      </value>
    </filters>

    <!-- Only run if Status actually changed -->
    <filterLogic>and</filterLogic>
    <doesRequireRecordChangedToMeetCriteria>true</doesRequireRecordChangedToMeetCriteria>
  </start>

  <!-- ACTION: Get related Contact -->
  <recordLookups>
    <name>Get_Contact</name>
    <connector>
      <targetReference>Send_Email</targetReference>
    </connector>
    <filterLogic>and</filterLogic>
    <filters>
      <field>AccountId</field>
      <operator>EqualTo</operator>
      <value>
        <elementReference>$Record.AccountId</elementReference>
      </value>
    </filters>
    <object>Contact</object>
    <outputReference>Contact</outputReference>
  </recordLookups>

  <!-- ACTION: Send post-purchase email -->
  <actionCalls>
    <name>Send_Email</name>
    <actionName>emailSimple</actionName>
    <actionType>emailSimple</actionType>
    <inputParameters>
      <name>emailAddresses</name>
      <value>
        <elementReference>Contact.Email</elementReference>
      </value>
    </inputParameters>
    <inputParameters>
      <name>emailSubject</name>
      <value>
        <stringValue>Thank you for your order!</stringValue>
      </value>
    </inputParameters>
    <inputParameters>
      <name>emailBody</name>
      <value>
        <elementReference>Email_Body_Formula</elementReference>
      </value>
    </inputParameters>
  </actionCalls>
</Flow>
```

### Key Configuration Points

| Setting | Value | Why |
|---------|-------|-----|
| `recordTriggerType` | CreateAndUpdate | Fire on both new and updated records |
| `triggerType` | RecordAfterSave | Fire after record is committed |
| `doesRequireRecordChangedToMeetCriteria` | true | Only fire if Status actually changed |
| `filterLogic` | and | All criteria must match |

### Flow Debug Logs

**Demo Script**:

1. Open **Setup** → **Flows** → **Post Purchase Journey Trigger**
2. Click **Debug** → **Run**
3. Create a test Order with Status = 'Activated'
4. Show the debug output:
   - "Flow started"
   - "Criteria met: Status = Activated"
   - "Record lookup: Found Contact"
   - "Email sent to: sarah.chen@example.com"
5. "This is how you troubleshoot journey triggers"

## 3.2 Triggered Actions (Data Cloud)

### Cart Abandonment Example

For real-time behavioral triggers, we use **Data Cloud Triggered Actions**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRIGGERED ACTION: Cart Abandonment                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ EVENT CRITERIA                                                       │    │
│  │                                                                       │    │
│  │ Source: Web Connector                                                 │    │
│  │ Event: Add_To_Cart                                                    │    │
│  │                                                                       │    │
│  │ Conditions:                                                           │    │
│  │   • Cart value > $50                                                  │    │
│  │   • No Purchase event within 30 minutes                               │    │
│  │   • Customer has email address                                        │    │
│  │   • Not in suppression segment (recent purchaser)                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ACTION                                                               │    │
│  │                                                                       │    │
│  │ Type: Marketing Cloud Action                                          │    │
│  │ Template: Cart_Abandonment_Email                                      │    │
│  │                                                                       │    │
│  │ Personalization:                                                      │    │
│  │   • {{FirstName}} — from Unified Individual                           │    │
│  │   • {{CartProducts}} — from event payload                             │    │
│  │   • {{CartTotal}} — from event payload                                │    │
│  │   • {{RecommendedProducts}} — from Einstein Recommendations           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Configuring in Data Cloud

**Demo Script**:

1. Open **Data Cloud Setup** → **Triggered Actions**
2. Show the "Cart Abandonment" action
3. Walk through:
   - Event source (Web Connector)
   - Event type (Add_To_Cart)
   - Wait condition (30 minutes, no Purchase)
   - Action (Marketing Cloud email template)
4. "This fires in real-time when criteria are met — no batch processing"

## 3.3 Journey Triggers Comparison

| Trigger Type | Latency | Data Source | Best For |
|--------------|---------|-------------|----------|
| **Record-Triggered Flow** | Immediate | CRM objects | Lifecycle events (welcome, purchase, renewal) |
| **Triggered Action** | Near real-time | Data Cloud events | Behavioral triggers (abandonment, browse) |
| **Scheduled Segment** | Batch (hourly/daily) | Data Cloud segments | Re-engagement, win-back campaigns |
| **API Entry** | On-demand | External systems | Custom integrations |

---

# Part 4: Demo — The Complete Customer Journey (20 min)

## 4.1 Journey Map

Let's trace a complete customer journey through the system:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SARAH CHEN'S CUSTOMER JOURNEY                             │
│                                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  │ 1. LAND │───▶│ 2. BROWSE│───▶│ 3. CHAT │───▶│ 4. BUY  │───▶│ 5. SHIP │   │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘   │
│       │              │              │              │              │         │
│       ▼              ▼              ▼              ▼              ▼         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  │Identity │    │ Browse  │    │ Chat    │    │ Order   │    │ Order   │   │
│  │ Sync    │    │ Events  │    │ Summary │    │ Created │    │ Shipped │   │
│  │ (SDK)   │    │ (SDK)   │    │ (Apex)  │    │ (REST)  │    │ (Apex)  │   │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘   │
│       │              │              │              │              │         │
│       ▼              ▼              ▼              ▼              ▼         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                          DATA CLOUD                                   │  │
│  │  Unified Profile: Sarah Chen                                          │  │
│  │  - Identity resolved via Merkury PID                                  │  │
│  │  - Browse history: Retinol serums                                     │  │
│  │  - Chat: Interested in gentle retinol                                 │  │
│  │  - Order: Hydra-Calm Moisturizer ($58)                                │  │
│  │  - Loyalty: Gold tier, 2,450 points                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│       │              │              │              │              │         │
│       ▼              ▼              ▼              ▼              ▼         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    MARKETING CLOUD ADVANCED                           │  │
│  │                                                                       │  │
│  │  Journey 1: Welcome (on Contact create) ✓ Completed                   │  │
│  │  Journey 2: Post-Purchase (on Order activate) ✓ Sent                  │  │
│  │  Journey 3: Ship Notification (on Shipping_Status) ◐ Pending          │  │
│  │  Journey 4: Product Review Request (7 days post-delivery) ○ Scheduled │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Live Demo Walkthrough

### Step 1: Anonymous → Identified

**Demo Script**:
1. Start as Anonymous Visitor
2. Browse products (show Web SDK events in console)
3. Open chat with AI advisor
4. Agent asks for email to provide personalized recommendations
5. Enter email → Contact created in Salesforce
6. **Key moment**: "A welcome journey just triggered!"
7. Show Flow debug log: "Contact created → Welcome email sent"

**Talking Point**:
> "The moment she identified herself, a Record-Triggered Flow fired. No API call from our app — the Flow just watched for new Contact records."

### Step 2: Browse → Abandonment Trigger

**Demo Script**:
1. Browse serum products
2. Add item to cart
3. Wait (or simulate) 30 minutes without purchase
4. Show Triggered Action in Data Cloud
5. **Key moment**: "A cart abandonment email is now queued"

**Talking Point**:
> "This is a Triggered Action watching for Add_To_Cart events with no Purchase follow-up. Real-time behavioral marketing."

### Step 3: Purchase → Post-Purchase Journey

**Demo Script**:
1. Complete checkout
2. Show Order record created in Salesforce (Status: Activated)
3. Show Flow debug: "Order.Status changed to Activated"
4. **Key moment**: "Post-purchase email sent automatically"
5. Show email preview with order details

**Talking Point**:
> "We didn't call any API. We just activated the Order. The Flow did the rest."

### Step 4: Ship → Delivery Notifications

**Demo Script**:
1. Simulate shipment: Update Order.Shipping_Status__c = 'Shipped'
2. Show Flow trigger for ship notification
3. Simulate delivery: Update to 'Delivered'
4. Show delivery confirmation trigger
5. "7 days from now, a review request journey will fire"

**Talking Point**:
> "The entire post-purchase experience — 4 touchpoints — is orchestrated by Record-Triggered Flows. Zero code."

### Step 5: Agent Capture → Future Journey

**Demo Script**:
1. Go back to chat
2. Tell agent: "I'm planning a trip to Miami next month"
3. Show Meaningful_Event__c created with:
   - Event_Type__c: 'life-event'
   - Description__c: 'Trip to Miami next month'
   - Metadata_JSON__c: `{"destination": "Miami", "climate": "hot", "trip_date": "2026-03-15"}`
4. "This could trigger a travel skincare journey 1 week before the trip"

**Talking Point**:
> "Agentforce doesn't just answer questions — it captures intent. That intent becomes a journey trigger."

---

# Part 5: Hands-On — Build a Triggered Campaign Together (25 min)

## 5.1 The Scenario

Let's build a **"Chat Follow-Up"** journey together:

**Business Requirement**:
> "24 hours after an agent chat with negative or neutral sentiment, send a follow-up email checking in on the customer."

### What We'll Build

| Component | Type | Purpose |
|-----------|------|---------|
| **Flow** | Record-Triggered Flow | Fires when Chat_Summary__c is created |
| **Decision** | Flow Element | Check sentiment is negative/neutral |
| **Wait** | Flow Element | Wait 24 hours |
| **Action** | Email Action | Send follow-up email |

## 5.2 Step-by-Step Build

### Step 1: Create the Flow

1. **Setup** → **Flows** → **New Flow**
2. Select **Record-Triggered Flow**
3. Configure trigger:
   - Object: `Chat_Summary__c`
   - Trigger: "A record is created"
   - Condition Requirements: "All Conditions Are Met"

### Step 2: Add Entry Conditions

```
Field: Chat_Summary__c.Sentiment__c
Operator: Equals
Value: "negative"

— OR —

Field: Chat_Summary__c.Sentiment__c
Operator: Equals
Value: "neutral"
```

**Configuration**:
- Condition Logic: `1 OR 2`
- When to Run: "After the record is saved"

### Step 3: Get the Related Contact

Add a **Get Records** element:

| Setting | Value |
|---------|-------|
| Object | Contact |
| Filter | Id Equals {!$Record.Contact__c} |
| Store | Single record |
| Variable | Contact_Record |

### Step 4: Add a Decision (Has Email?)

Add a **Decision** element:

| Outcome | Condition |
|---------|-----------|
| Has Email | Contact_Record.Email Is Not Null |
| No Email | Default |

### Step 5: Add a Scheduled Path (24-Hour Wait)

On the "Has Email" path:
1. Click the path
2. Select **Add Scheduled Path**
3. Configure:
   - Time Source: "When the record is created"
   - Offset: 24 Hours After

### Step 6: Add Email Action

Add an **Action** element on the scheduled path:

| Setting | Value |
|---------|-------|
| Action Type | Send Email |
| Recipient | {!Contact_Record.Email} |
| Subject | "Following up on your recent chat" |
| Body | (Use merge fields for personalization) |

### Email Body Template

```html
Hi {!Contact_Record.FirstName},

We noticed you chatted with our Beauty Advisor yesterday. We wanted to
check in and make sure we addressed all your questions.

Here's a summary of what you discussed:
{!$Record.Summary_Text__c}

If you have any follow-up questions, reply to this email or start a
new chat anytime.

Best,
The Beauté Team
```

### Step 7: Activate and Test

1. Click **Save** → Name: "Chat Follow-Up Journey"
2. Click **Activate**
3. **Test**: Create a Chat_Summary__c record with Sentiment__c = 'negative'
4. Check scheduled actions: **Setup** → **Scheduled Jobs**
5. Verify email is queued for 24 hours from now

## 5.3 Verification Checklist

| Step | Check |
|------|-------|
| Flow activated | ✅ Status shows "Active" |
| Trigger criteria | ✅ Only negative/neutral sentiment |
| Contact lookup | ✅ Gets related Contact record |
| Email check | ✅ Only sends if email exists |
| 24-hour delay | ✅ Uses scheduled path, not wait element |
| Personalization | ✅ Email includes name and summary |

## 5.4 Enhancements to Consider

Now that the basic flow works, discuss with the group:

1. **Add suppression**: Don't send if customer made a purchase in the last 24 hours
2. **Add escalation**: If sentiment was negative AND no response, create a Case
3. **A/B testing**: Test different subject lines
4. **Channel preference**: Check if customer prefers SMS over email

---

# Part 6: Supporting Capabilities (15 min)

## 6.1 How Agentforce Feeds MC Advanced

### The Pattern

```
Customer Chat → Agentforce → Apex Service → Custom Object → Record-Triggered Flow → Journey
```

### Data Captured by Agent

| Data Type | Object | Journey Use Case |
|-----------|--------|------------------|
| Chat summaries | Chat_Summary__c | Follow-up based on sentiment |
| Meaningful events | Meaningful_Event__c | Life event-triggered campaigns |
| Profile captures | Agent_Captured_Profile__c | Progressive profiling journeys |
| Intent signals | Meaningful_Event__c | Personalized recommendations |

### Example: Agent Captures Trip Intent

```typescript
// Agent captures: "I'm going to Miami next month"
const event = {
  Contact__c: contactId,
  Event_Type__c: 'life-event',
  Description__c: 'Trip to Miami next month',
  Captured_At__c: new Date().toISOString(),
  Agent_Note__c: 'Recommend travel-size SPF and hydrating mist',
  Metadata_JSON__c: JSON.stringify({
    destination: 'Miami',
    climate: 'hot_humid',
    trip_date: '2026-03-15',
    trip_end: '2026-03-22'
  })
};

// Insert creates record → Flow evaluates → Journey scheduled for trip_date - 7 days
```

### Record-Triggered Flow for Trip Journey

```
TRIGGER: Meaningful_Event__c created
WHERE: Event_Type__c = 'life-event'
  AND Description__c CONTAINS 'trip'

SCHEDULED PATH: trip_date - 7 days (from Metadata_JSON__c)

ACTION: Send "Travel Skincare Guide" email with:
  - Destination-specific tips
  - Recommended products for climate
  - Travel-size product links
```

## 6.2 How SF Personalization Feeds MC Advanced

### Web SDK → Data Cloud → Triggered Actions

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Web SDK Event   │───▶│ Data Cloud      │───▶│ Triggered       │
│                 │    │ Web Connector   │    │ Action          │
│ • Page view     │    │                 │    │                 │
│ • Add to cart   │    │ Ingests to DLO  │    │ Evaluates       │
│ • Identity sync │    │ Maps to profile │    │ criteria        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                                                      ▼
                                              ┌─────────────────┐
                                              │ Marketing       │
                                              │ Action          │
                                              │                 │
                                              │ • Email         │
                                              │ • SMS           │
                                              │ • Push          │
                                              └─────────────────┘
```

### Events We Track

| Event | SDK Method | Triggered Action Use |
|-------|------------|---------------------|
| Page View | `notifyNavigation()` | Browse abandonment |
| Product View | `notifyNavigation('product')` | Product interest campaigns |
| Add to Cart | `trackAddToCart()` | Cart abandonment |
| Identity Sync | `syncIdentity()` | Match anonymous → known |

### Code: Tracking Add to Cart

```typescript
// src/services/personalization/index.ts
export function trackAddToCart(product: Product, quantity: number = 1) {
  const sdk = getSdk();
  if (!sdk) return;

  sdk.sendEvent({
    interaction: { name: 'Add To Cart' },
    lineItem: {
      catalogObjectType: 'Product',
      catalogObjectId: product.salesforceId || product.id,
      quantity,
      price: product.price,
      attributes: {
        name: product.name,
        category: product.category,
        brand: product.brand,
      }
    },
  });

  console.log('[sfp] Tracked Add To Cart:', product.id);
}
```

## 6.3 How Commerce Feeds MC Advanced

### Order Lifecycle → Journey Triggers

| Order Status Change | Flow Trigger | Journey |
|---------------------|--------------|---------|
| Draft → Activated | Status = 'Activated' | Post-purchase confirmation |
| Activated → Processing | (internal, no journey) | — |
| Processing → Shipped | Shipping_Status__c = 'Shipped' | Ship notification |
| Shipped → Delivered | Shipping_Status__c = 'Delivered' | Delivery confirmation |
| Delivered + 7 days | Scheduled path | Review request |

### Code: Order Creation Triggers Journey

```javascript
// server/index.js - POST /api/checkout

// 1. Create Order (Draft)
const order = await sfFetch('POST', '/sobjects/Order', {
  AccountId: accountId,
  Status: 'Draft',  // Doesn't trigger journey yet
  ...
});

// 2. Create OrderItems
for (const item of items) {
  await sfFetch('POST', '/sobjects/OrderItem', { ... });
}

// 3. Activate Order → THIS triggers the journey!
await sfFetch('PATCH', `/sobjects/Order/${orderId}`, {
  Status: 'Activated'  // Record-Triggered Flow fires here
});

// No API call to MC Advanced — the Flow handles it
```

---

# Part 7: Exercise — Design Your Own Journey (10 min)

## 7.1 The Challenge

Using what you learned, design a journey for one of these scenarios:

### Option A: Loyalty Tier Upgrade
> When a customer reaches Gold tier, send a congratulations email with exclusive benefits and a special offer.

### Option B: Product Restock Reminder
> 60 days after a customer buys a consumable product (cleanser, moisturizer), remind them to reorder.

### Option C: Negative Review Follow-Up
> When a product review with rating ≤ 2 is submitted, trigger a service recovery journey.

### Option D: Your Own Idea
> Design a journey relevant to your work or clients.

## 7.2 Design Template

Fill out this template for your journey:

```
JOURNEY NAME: _______________________

TRIGGER TYPE:
  □ Record-Triggered Flow
  □ Triggered Action (Data Cloud)
  □ Scheduled Segment

TRIGGER OBJECT: _______________________

TRIGGER CRITERIA:
  Field: _____________  Operator: _______  Value: _______
  Field: _____________  Operator: _______  Value: _______

TIMING:
  □ Immediate
  □ Scheduled delay: _______ hours/days after _______

CHANNELS:
  □ Email
  □ SMS
  □ Push notification
  □ In-app message

PERSONALIZATION DATA NEEDED:
  • _______________
  • _______________
  • _______________

SUPPRESSION RULES:
  Don't send if: _______________

SUCCESS METRIC: _______________________
```

## 7.3 Share and Discuss

Take 5 minutes to complete your design, then we'll hear 2-3 examples.

**Discussion Questions**:
- What object does your trigger watch?
- What data do you need for personalization?
- How would you test this journey?

---

# Appendix A: MC Advanced Quick Reference

## A.1 Record-Triggered Flow Best Practices

| Practice | Why |
|----------|-----|
| Use "After Save" trigger | Ensures record is committed |
| Add `doesRequireRecordChangedToMeetCriteria` | Prevents duplicate fires |
| Use scheduled paths for delays | More reliable than wait elements |
| Get related records explicitly | Don't assume cross-object access |
| Check email exists before sending | Avoid failures |
| Add fault paths | Handle errors gracefully |

## A.2 Triggered Action Best Practices

| Practice | Why |
|----------|-----|
| Set reasonable time windows | 30 min for cart, 24 hr for browse |
| Use suppression segments | Avoid sending to recent purchasers |
| Include fallback content | Handle missing personalization data |
| Monitor delivery rates | Catch issues early |
| A/B test templates | Optimize engagement |

## A.3 Common Journey Patterns

| Pattern | Trigger | Timing | Channel |
|---------|---------|--------|---------|
| Welcome | Contact created | Immediate | Email |
| Post-Purchase | Order activated | Immediate | Email |
| Ship Notification | Shipping_Status__c = 'Shipped' | Immediate | Email + SMS |
| Cart Abandonment | Add_To_Cart, no Purchase | 30-60 min | Email |
| Browse Abandonment | Page view, no Add_To_Cart | 24 hr | Email |
| Review Request | Order delivered | 7 days | Email |
| Loyalty Tier Upgrade | LoyaltyMemberTier created | Immediate | Email |
| Win-Back | No engagement | 90 days | Email |

---

# Appendix B: Data Model Reference

## B.1 Standard Objects for MC Advanced

| Object | Key Fields | Journey Use |
|--------|------------|-------------|
| Contact | Email, Phone, FirstName, LastName | Recipient data |
| Account | Name, BillingAddress | Household context |
| Order | Status, TotalAmount, EffectiveDate | Purchase journeys |
| OrderItem | Product2Id, Quantity, UnitPrice | Order details |
| Case | Status, Priority, ContactId | Service journeys |
| LoyaltyProgramMember | MemberStatus, ContactId | Loyalty journeys |
| LoyaltyMemberTier | Status, LoyaltyTier.Name | Tier change journeys |

## B.2 Custom Objects in This App

| Object | Purpose | Key Fields |
|--------|---------|------------|
| Chat_Summary__c | Agent conversation data | Sentiment__c, Topics_Discussed__c |
| Meaningful_Event__c | Life events and intent | Event_Type__c, Metadata_JSON__c |
| Browse_Session__c | Web behavior | Products_Viewed__c, Abandoned__c |
| Agent_Captured_Profile__c | Progressive profiling | Field_Name__c, Field_Value__c |

## B.3 Custom Fields on Standard Objects

| Object.Field | Type | Purpose |
|--------------|------|---------|
| Contact.Merkury_Id__c | Text | Identity resolution |
| Contact.Skin_Type__c | Picklist | Personalization |
| Order.Shipping_Status__c | Picklist | Ship journey trigger |
| Order.Tracking_Number__c | Text | Email personalization |
| Order.Estimated_Delivery__c | Date | Email personalization |

---

# Appendix C: Troubleshooting

## C.1 Flow Not Firing

| Symptom | Cause | Solution |
|---------|-------|----------|
| Flow never runs | Criteria not met | Check filter conditions |
| Flow runs twice | Missing `doesRequireRecordChangedToMeetCriteria` | Add to trigger |
| Flow errors | Missing related record | Add null check before actions |
| Email not sent | No email on Contact | Add decision element to check |

## C.2 Triggered Action Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Action never fires | Event not ingested | Check Web Connector logs |
| Action fires too often | Missing suppression | Add segment exclusion |
| Wrong timing | Time window misconfigured | Review wait conditions |
| Missing personalization | Field not mapped | Check event payload |

## C.3 Debug Tools

| Tool | Location | Use For |
|------|----------|---------|
| Flow Debug | Setup → Flows → Debug | Test flows interactively |
| Debug Logs | Setup → Debug Logs | Apex and Flow execution |
| Data Cloud Event Inspector | Data Cloud Setup | View ingested events |
| Triggered Action Logs | Data Cloud → Triggered Actions | Action execution history |

---

# Appendix D: Resources

## Documentation

- [Marketing Cloud Advanced Overview](https://help.salesforce.com/s/articleView?id=sf.mc_advanced_overview.htm)
- [Record-Triggered Flows](https://help.salesforce.com/s/articleView?id=sf.flow_concepts_trigger_record.htm)
- [Data Cloud Triggered Actions](https://help.salesforce.com/s/articleView?id=sf.c360_a_triggered_actions.htm)
- [Data Cloud Web SDK](https://developer.salesforce.com/docs/atlas.en-us.c360a_api.meta/c360a_api/c360a_api_web_sdk.htm)

## This Demo App

- **Repository**: [GitHub URL]
- **Live Demo**: [Vercel URL]
- **Custom Objects**: `salesforce/force-app/main/default/objects/`
- **Flows**: `salesforce/force-app/main/default/flows/`

---

# Workshop Feedback

**What was most valuable?**

**What would you like more depth on?**

**What journey will you build next?**

---

*Workshop created with Claude Code — the same AI assistant that helped build this demo application.*

*Marketing Cloud Advanced: Where every customer moment becomes a journey opportunity.*
