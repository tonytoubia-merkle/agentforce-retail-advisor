/**
 * Portfolio Management System Types
 *
 * In an agent-assisted marketing world, marketers become "orchestrators"
 * who own portfolios of customers/events rather than executing every touchpoint.
 */

// ─── Portfolio Owner (Marketer) ─────────────────────────────────

export type PortfolioRole = 'admin' | 'owner' | 'collaborator' | 'observer';

export interface PortfolioOwner {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: PortfolioRole;
  title: string;
  department: string;

  // Capacity management
  capacity: {
    maxCustomers: number;
    maxDailyInterventions: number;
    currentCustomers: number;
    currentInterventions: number;
  };

  // Permissions
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
    canViewAllPortfolios: boolean;
    canExportCustomerData: boolean;
    canModifyAttribution: boolean;
  };

  // Assignment
  assignedPortfolioIds: string[];
}

// ─── Portfolio Types ────────────────────────────────────────────

export type PortfolioType =
  | 'vip-relationships'      // High-value customers + meaningful events
  | 'retention-winback'      // At-risk, cart abandonment, browse abandonment
  | 'new-customer'           // Onboarding, welcome, first purchase
  | 'service-recovery'       // Complaints, returns, negative feedback
  | 'meaningful-events';     // Birthdays, anniversaries, milestones (can be standalone)

export type AgentAutonomyLevel =
  | 'full-auto'      // Agent handles all, human reviews weekly
  | 'supervised'     // Agent drafts, human approves
  | 'assisted'       // Human leads, agent suggests
  | 'manual';        // Human does everything, agent provides insights

export type EventType =
  | 'cart-abandonment'
  | 'browse-abandonment'
  | 'purchase'
  | 'first-purchase'
  | 'winback'
  | 'welcome'
  | 'loyalty-tier-change'
  | 'meaningful-event'
  | 'complaint'
  | 'return'
  | 'negative-feedback'
  | 'vip-touch'
  | 'high-value-order';

export type CustomerSegment =
  | 'vip'
  | 'loyal'
  | 'active'
  | 'at-risk'
  | 'lapsed'
  | 'new'
  | 'anonymous';

export type Region = 'americas' | 'emea' | 'apac' | 'global';

// ─── Portfolio Definition ───────────────────────────────────────

export interface EscalationTrigger {
  id: string;
  name: string;
  description: string;
  condition: string; // Human-readable condition
  enabled: boolean;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  type: PortfolioType;
  color: string; // For UI theming
  icon: string;  // Icon name

  // Scope
  scope: {
    segments: CustomerSegment[];
    eventTypes: EventType[];
    regions: Region[];
    productCategories?: string[];
  };

  // Agent configuration
  agentAutonomy: AgentAutonomyLevel;
  escalationTriggers: EscalationTrigger[];

  // Metrics
  metrics: {
    totalCustomers: number;
    activeCustomers: number;
    pendingActions: number;
    agentHandledToday: number;
    humanInterventionsToday: number;
    conversionRate: number;
    avgResponseTime: string;
  };

  // Ownership
  primaryOwnerId: string;
  collaboratorIds: string[];
}

// ─── Customer in Portfolio Context ──────────────────────────────

export type ActionUrgency = 'critical' | 'high' | 'medium' | 'low';
export type ActionStatus = 'pending' | 'in-progress' | 'completed' | 'escalated';

export interface PortfolioCustomer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  segment: CustomerSegment;
  loyaltyTier?: string;
  lifetimeValue: number;

  // Current state
  currentEvent?: {
    type: EventType;
    description: string;
    occurredAt: Date;
    data?: Record<string, unknown>;
  };

  // Required action
  pendingAction?: {
    id: string;
    type: 'approve-draft' | 'take-over' | 'decide' | 'review';
    description: string;
    urgency: ActionUrgency;
    status: ActionStatus;
    agentSuggestion?: string;
    createdAt: Date;
    dueAt?: Date;
  };

  // History
  recentInteractions: {
    date: Date;
    channel: string;
    type: string;
    handledBy: 'agent' | 'human';
    outcome?: string;
  }[];
}

// ─── Agent Activity ─────────────────────────────────────────────

export interface AgentActivity {
  id: string;
  portfolioId: string;
  customerId: string;
  customerName: string;
  timestamp: Date;
  action: string;
  channel: 'email' | 'sms' | 'push' | 'in-app';
  status: 'sent' | 'paused' | 'pending-approval' | 'failed';
  details?: string;
}

// ─── Portfolio Dashboard State ──────────────────────────────────

export interface PortfolioDashboardState {
  currentOwner: PortfolioOwner | null;
  selectedPortfolioId: string | null;
  portfolios: Portfolio[];
  owners: PortfolioOwner[];
  isAdmin: boolean;
}
