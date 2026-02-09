/**
 * Mock Portfolio Management Data
 *
 * Demo users and portfolios for the agent-assisted marketing system.
 */

import type {
  PortfolioOwner,
  Portfolio,
  PortfolioCustomer,
  AgentActivity,
} from '@/types/portfolio';

// ─── Portfolio Owners ───────────────────────────────────────────

export const PORTFOLIO_OWNERS: PortfolioOwner[] = [
  // Admin - Marketing Director (can see all)
  {
    id: 'owner-admin',
    name: 'Alex Morgan',
    email: 'alex.morgan@beaute.com',
    avatar: undefined,
    role: 'admin',
    title: 'Marketing Director',
    department: 'Marketing',
    capacity: {
      maxCustomers: 0, // Admins don't own customers directly
      maxDailyInterventions: 0,
      currentCustomers: 0,
      currentInterventions: 0,
    },
    permissions: {
      canDefineSegmentRules: true,
      canSetAgentAutonomy: true,
      canCreateEscalationTriggers: true,
      canApproveAgentDrafts: true,
      canOverrideAgentDecisions: true,
      canSendDirectOutreach: true,
      canTakeOverConversations: true,
      canViewPerformanceMetrics: true,
      canViewAllPortfolios: true,
      canExportCustomerData: true,
      canModifyAttribution: true,
    },
    assignedPortfolioIds: [], // Can view all, owns none
  },

  // VIP Relationships Owner
  {
    id: 'owner-emma',
    name: 'Emma Chen',
    email: 'emma.chen@beaute.com',
    avatar: undefined,
    role: 'owner',
    title: 'VIP Customer Success Manager',
    department: 'Customer Success',
    capacity: {
      maxCustomers: 500,
      maxDailyInterventions: 25,
      currentCustomers: 342,
      currentInterventions: 12,
    },
    permissions: {
      canDefineSegmentRules: true,
      canSetAgentAutonomy: true,
      canCreateEscalationTriggers: true,
      canApproveAgentDrafts: true,
      canOverrideAgentDecisions: true,
      canSendDirectOutreach: true,
      canTakeOverConversations: true,
      canViewPerformanceMetrics: true,
      canViewAllPortfolios: false,
      canExportCustomerData: true,
      canModifyAttribution: false,
    },
    assignedPortfolioIds: ['portfolio-vip', 'portfolio-meaningful'],
  },

  // Retention & Winback Owner
  {
    id: 'owner-james',
    name: 'James Rodriguez',
    email: 'james.rodriguez@beaute.com',
    avatar: undefined,
    role: 'owner',
    title: 'Retention Marketing Manager',
    department: 'Marketing',
    capacity: {
      maxCustomers: 2000,
      maxDailyInterventions: 50,
      currentCustomers: 1847,
      currentInterventions: 31,
    },
    permissions: {
      canDefineSegmentRules: true,
      canSetAgentAutonomy: true,
      canCreateEscalationTriggers: true,
      canApproveAgentDrafts: true,
      canOverrideAgentDecisions: true,
      canSendDirectOutreach: true,
      canTakeOverConversations: true,
      canViewPerformanceMetrics: true,
      canViewAllPortfolios: false,
      canExportCustomerData: true,
      canModifyAttribution: false,
    },
    assignedPortfolioIds: ['portfolio-retention'],
  },

  // New Customer Onboarding Owner
  {
    id: 'owner-sofia',
    name: 'Sofia Martinez',
    email: 'sofia.martinez@beaute.com',
    avatar: undefined,
    role: 'owner',
    title: 'Customer Onboarding Specialist',
    department: 'Customer Experience',
    capacity: {
      maxCustomers: 1500,
      maxDailyInterventions: 40,
      currentCustomers: 1203,
      currentInterventions: 18,
    },
    permissions: {
      canDefineSegmentRules: true,
      canSetAgentAutonomy: true,
      canCreateEscalationTriggers: true,
      canApproveAgentDrafts: true,
      canOverrideAgentDecisions: true,
      canSendDirectOutreach: true,
      canTakeOverConversations: true,
      canViewPerformanceMetrics: true,
      canViewAllPortfolios: false,
      canExportCustomerData: false,
      canModifyAttribution: false,
    },
    assignedPortfolioIds: ['portfolio-onboarding'],
  },

  // Service Recovery Owner
  {
    id: 'owner-marcus',
    name: 'Marcus Thompson',
    email: 'marcus.thompson@beaute.com',
    avatar: undefined,
    role: 'owner',
    title: 'Customer Service Recovery Lead',
    department: 'Customer Service',
    capacity: {
      maxCustomers: 300,
      maxDailyInterventions: 30,
      currentCustomers: 156,
      currentInterventions: 22,
    },
    permissions: {
      canDefineSegmentRules: true,
      canSetAgentAutonomy: false, // Service recovery needs human oversight
      canCreateEscalationTriggers: true,
      canApproveAgentDrafts: true,
      canOverrideAgentDecisions: true,
      canSendDirectOutreach: true,
      canTakeOverConversations: true,
      canViewPerformanceMetrics: true,
      canViewAllPortfolios: false,
      canExportCustomerData: true,
      canModifyAttribution: false,
    },
    assignedPortfolioIds: ['portfolio-service'],
  },
];

// ─── Portfolios ─────────────────────────────────────────────────

export const PORTFOLIOS: Portfolio[] = [
  // VIP Relationships
  {
    id: 'portfolio-vip',
    name: 'VIP Relationships',
    description: 'High-value customers requiring personalized attention and white-glove service. Includes loyalty tier management and exclusive offers.',
    type: 'vip-relationships',
    color: 'purple',
    icon: 'crown',
    scope: {
      segments: ['vip'],
      eventTypes: ['vip-touch', 'high-value-order', 'loyalty-tier-change', 'purchase'],
      regions: ['global'],
    },
    agentAutonomy: 'supervised',
    escalationTriggers: [
      {
        id: 'esc-vip-1',
        name: 'High-Value Order',
        description: 'Orders exceeding $500',
        condition: 'order.value > 500',
        enabled: true,
      },
      {
        id: 'esc-vip-2',
        name: 'Tier Downgrade Risk',
        description: 'Customer at risk of losing VIP status',
        condition: 'loyalty.pointsToNextTier < 0 && daysUntilExpiry < 30',
        enabled: true,
      },
      {
        id: 'esc-vip-3',
        name: 'Negative Sentiment',
        description: 'Customer expressed frustration',
        condition: 'sentiment === "negative"',
        enabled: true,
      },
    ],
    metrics: {
      totalCustomers: 342,
      activeCustomers: 287,
      pendingActions: 8,
      agentHandledToday: 45,
      humanInterventionsToday: 12,
      conversionRate: 0.34,
      avgResponseTime: '2.3 hrs',
    },
    primaryOwnerId: 'owner-emma',
    collaboratorIds: [],
  },

  // Meaningful Events (under Emma's ownership but separate portfolio)
  {
    id: 'portfolio-meaningful',
    name: 'Meaningful Events',
    description: 'Birthdays, anniversaries, milestones, and other significant customer moments that deserve special recognition.',
    type: 'meaningful-events',
    color: 'pink',
    icon: 'gift',
    scope: {
      segments: ['vip', 'loyal', 'active'],
      eventTypes: ['meaningful-event'],
      regions: ['global'],
    },
    agentAutonomy: 'assisted', // Human crafts the message, agent helps with timing
    escalationTriggers: [
      {
        id: 'esc-me-1',
        name: 'VIP Birthday',
        description: 'Birthday of a VIP customer',
        condition: 'event.type === "birthday" && customer.segment === "vip"',
        enabled: true,
      },
      {
        id: 'esc-me-2',
        name: 'Major Milestone',
        description: '5+ year anniversary or 50+ orders',
        condition: 'event.type === "anniversary" && (years >= 5 || totalOrders >= 50)',
        enabled: true,
      },
    ],
    metrics: {
      totalCustomers: 1250,
      activeCustomers: 89, // Customers with upcoming events
      pendingActions: 15,
      agentHandledToday: 12,
      humanInterventionsToday: 8,
      conversionRate: 0.45,
      avgResponseTime: '4.1 hrs',
    },
    primaryOwnerId: 'owner-emma',
    collaboratorIds: [],
  },

  // Retention & Winback
  {
    id: 'portfolio-retention',
    name: 'Retention & Winback',
    description: 'At-risk customers, cart abandonment recovery, browse abandonment, and lapsed customer reactivation campaigns.',
    type: 'retention-winback',
    color: 'orange',
    icon: 'refresh',
    scope: {
      segments: ['at-risk', 'lapsed', 'active'],
      eventTypes: ['cart-abandonment', 'browse-abandonment', 'winback'],
      regions: ['global'],
    },
    agentAutonomy: 'full-auto',
    escalationTriggers: [
      {
        id: 'esc-ret-1',
        name: 'High-Value Cart',
        description: 'Abandoned cart over $200',
        condition: 'cart.value > 200',
        enabled: true,
      },
      {
        id: 'esc-ret-2',
        name: 'VIP Abandonment',
        description: 'VIP customer abandoned cart',
        condition: 'customer.segment === "vip"',
        enabled: true,
      },
      {
        id: 'esc-ret-3',
        name: 'Multiple Failures',
        description: '3+ touchpoints without response',
        condition: 'touchpoints.failed >= 3',
        enabled: true,
      },
    ],
    metrics: {
      totalCustomers: 1847,
      activeCustomers: 623,
      pendingActions: 12,
      agentHandledToday: 234,
      humanInterventionsToday: 31,
      conversionRate: 0.12,
      avgResponseTime: '45 min',
    },
    primaryOwnerId: 'owner-james',
    collaboratorIds: [],
  },

  // New Customer Onboarding
  {
    id: 'portfolio-onboarding',
    name: 'New Customer Onboarding',
    description: 'Welcome journeys, first-purchase guidance, and early relationship building for customers in their first 90 days.',
    type: 'new-customer',
    color: 'green',
    icon: 'user-plus',
    scope: {
      segments: ['new'],
      eventTypes: ['welcome', 'first-purchase', 'purchase'],
      regions: ['global'],
    },
    agentAutonomy: 'full-auto',
    escalationTriggers: [
      {
        id: 'esc-onb-1',
        name: 'No First Purchase',
        description: 'Registered 14+ days ago, no purchase',
        condition: 'daysSinceRegistration > 14 && totalOrders === 0',
        enabled: true,
      },
      {
        id: 'esc-onb-2',
        name: 'High-Value First Order',
        description: 'First order exceeds $150',
        condition: 'isFirstOrder && order.value > 150',
        enabled: true,
      },
    ],
    metrics: {
      totalCustomers: 1203,
      activeCustomers: 892,
      pendingActions: 5,
      agentHandledToday: 156,
      humanInterventionsToday: 18,
      conversionRate: 0.28,
      avgResponseTime: '1.2 hrs',
    },
    primaryOwnerId: 'owner-sofia',
    collaboratorIds: [],
  },

  // Service Recovery
  {
    id: 'portfolio-service',
    name: 'Service Recovery',
    description: 'Complaint resolution, return handling, and negative experience recovery. High-touch, human-led with agent support.',
    type: 'service-recovery',
    color: 'red',
    icon: 'life-buoy',
    scope: {
      segments: ['vip', 'loyal', 'active', 'at-risk'],
      eventTypes: ['complaint', 'return', 'negative-feedback'],
      regions: ['global'],
    },
    agentAutonomy: 'manual', // Always human-led for service recovery
    escalationTriggers: [
      {
        id: 'esc-svc-1',
        name: 'All Complaints',
        description: 'Every complaint requires human review',
        condition: 'event.type === "complaint"',
        enabled: true,
      },
      {
        id: 'esc-svc-2',
        name: 'VIP Issue',
        description: 'Any issue from VIP customer',
        condition: 'customer.segment === "vip"',
        enabled: true,
      },
      {
        id: 'esc-svc-3',
        name: 'Social Media Mention',
        description: 'Negative mention on social media',
        condition: 'channel === "social" && sentiment === "negative"',
        enabled: true,
      },
    ],
    metrics: {
      totalCustomers: 156,
      activeCustomers: 42,
      pendingActions: 18,
      agentHandledToday: 8,
      humanInterventionsToday: 22,
      conversionRate: 0.67, // Resolution rate
      avgResponseTime: '1.5 hrs',
    },
    primaryOwnerId: 'owner-marcus',
    collaboratorIds: [],
  },
];

// ─── Sample Customers Needing Attention ─────────────────────────

export const PENDING_CUSTOMERS: PortfolioCustomer[] = [
  // VIP Portfolio
  {
    id: 'cust-sarah-m',
    name: 'Sarah Mitchell',
    email: 'sarah.m@email.com',
    segment: 'vip',
    loyaltyTier: 'Gold',
    lifetimeValue: 4892,
    currentEvent: {
      type: 'cart-abandonment',
      description: 'Abandoned $892 cart with luxury skincare set',
      occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      data: { cartValue: 892, items: 4 },
    },
    pendingAction: {
      id: 'action-1',
      type: 'approve-draft',
      description: 'Agent drafted personalized recovery email with 15% VIP offer',
      urgency: 'high',
      status: 'pending',
      agentSuggestion: 'Personalized email with exclusive 15% discount and free expedited shipping',
      createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
    recentInteractions: [
      { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), channel: 'email', type: 'purchase-confirmation', handledBy: 'agent', outcome: 'delivered' },
      { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), channel: 'sms', type: 'loyalty-reminder', handledBy: 'agent', outcome: 'clicked' },
    ],
  },
  {
    id: 'cust-marcus-t',
    name: 'Marcus Taylor',
    email: 'marcus.t@email.com',
    segment: 'vip',
    loyaltyTier: 'Gold',
    lifetimeValue: 6234,
    currentEvent: {
      type: 'complaint',
      description: 'Expressed frustration about delayed order in chat',
      occurredAt: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
    },
    pendingAction: {
      id: 'action-2',
      type: 'take-over',
      description: 'Agent paused outreach - customer frustrated, needs human touch',
      urgency: 'critical',
      status: 'escalated',
      agentSuggestion: 'Recommend personal call with apology and compensation offer',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
    recentInteractions: [
      { date: new Date(Date.now() - 45 * 60 * 1000), channel: 'chat', type: 'complaint', handledBy: 'agent', outcome: 'escalated' },
    ],
  },

  // Retention Portfolio
  {
    id: 'cust-jennifer-k',
    name: 'Jennifer Kim',
    email: 'jennifer.k@email.com',
    segment: 'at-risk',
    loyaltyTier: 'Silver',
    lifetimeValue: 1567,
    currentEvent: {
      type: 'winback',
      description: 'No purchase in 120 days, 3 winback attempts failed',
      occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    pendingAction: {
      id: 'action-3',
      type: 'decide',
      description: '3 winback attempts failed - agent suggests phone call',
      urgency: 'medium',
      status: 'pending',
      agentSuggestion: 'Personal phone call with exclusive return offer or remove from active campaigns',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    recentInteractions: [
      { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), channel: 'email', type: 'winback', handledBy: 'agent', outcome: 'no-response' },
      { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), channel: 'email', type: 'winback', handledBy: 'agent', outcome: 'no-response' },
      { date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), channel: 'sms', type: 'winback', handledBy: 'agent', outcome: 'no-response' },
    ],
  },

  // Meaningful Events
  {
    id: 'cust-olivia-r',
    name: 'Olivia Reynolds',
    email: 'olivia.r@email.com',
    segment: 'vip',
    loyaltyTier: 'Gold',
    lifetimeValue: 8945,
    currentEvent: {
      type: 'meaningful-event',
      description: 'Birthday in 3 days - 5 year anniversary as customer',
      occurredAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      data: { eventType: 'birthday', yearsAsCustomer: 5, totalOrders: 67 },
    },
    pendingAction: {
      id: 'action-4',
      type: 'review',
      description: 'Review personalized birthday message and gift selection',
      urgency: 'medium',
      status: 'pending',
      agentSuggestion: 'Handwritten note + complimentary deluxe sample set + double points on next order',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    recentInteractions: [],
  },

  // Onboarding
  {
    id: 'cust-david-l',
    name: 'David Lee',
    email: 'david.l@email.com',
    segment: 'new',
    loyaltyTier: 'Bronze',
    lifetimeValue: 0,
    currentEvent: {
      type: 'welcome',
      description: 'Registered 16 days ago, no purchase yet',
      occurredAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
    },
    pendingAction: {
      id: 'action-5',
      type: 'decide',
      description: 'New customer hasn\'t purchased after 16 days - intervention needed?',
      urgency: 'low',
      status: 'pending',
      agentSuggestion: 'Personal outreach with skin type quiz or first-purchase incentive',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    recentInteractions: [
      { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), channel: 'email', type: 'welcome', handledBy: 'agent', outcome: 'opened' },
      { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), channel: 'email', type: 'product-education', handledBy: 'agent', outcome: 'opened' },
    ],
  },

  // Service Recovery
  {
    id: 'cust-amanda-w',
    name: 'Amanda Wright',
    email: 'amanda.w@email.com',
    segment: 'loyal',
    loyaltyTier: 'Silver',
    lifetimeValue: 2340,
    currentEvent: {
      type: 'return',
      description: 'Returning $180 order - product caused allergic reaction',
      occurredAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    pendingAction: {
      id: 'action-6',
      type: 'take-over',
      description: 'Health-related return requires personal attention',
      urgency: 'high',
      status: 'pending',
      agentSuggestion: 'Personal call to ensure wellbeing, full refund, replacement with hypoallergenic alternatives',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    recentInteractions: [
      { date: new Date(Date.now() - 4 * 60 * 60 * 1000), channel: 'email', type: 'return-request', handledBy: 'agent', outcome: 'escalated' },
    ],
  },
];

// ─── Recent Agent Activity ──────────────────────────────────────

export const AGENT_ACTIVITY: AgentActivity[] = [
  {
    id: 'activity-1',
    portfolioId: 'portfolio-retention',
    customerId: 'cust-anon-1',
    customerName: 'Michael Brown',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    action: 'Sent cart abandonment email',
    channel: 'email',
    status: 'sent',
    details: 'Personalized reminder with 10% off code',
  },
  {
    id: 'activity-2',
    portfolioId: 'portfolio-retention',
    customerId: 'cust-anon-2',
    customerName: 'Lisa Chen',
    timestamp: new Date(Date.now() - 32 * 60 * 1000),
    action: 'Sent browse abandonment SMS',
    channel: 'sms',
    status: 'sent',
    details: 'Gentle reminder about viewed products',
  },
  {
    id: 'activity-3',
    portfolioId: 'portfolio-onboarding',
    customerId: 'cust-anon-3',
    customerName: 'Robert Johnson',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    action: 'Sent welcome series email #2',
    channel: 'email',
    status: 'sent',
    details: 'Product education and routine builder',
  },
  {
    id: 'activity-4',
    portfolioId: 'portfolio-vip',
    customerId: 'cust-sarah-m',
    customerName: 'Sarah Mitchell',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    action: 'Drafted VIP recovery email',
    channel: 'email',
    status: 'pending-approval',
    details: 'Awaiting Emma\'s approval',
  },
  {
    id: 'activity-5',
    portfolioId: 'portfolio-service',
    customerId: 'cust-marcus-t',
    customerName: 'Marcus Taylor',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    action: 'Paused automated outreach',
    channel: 'email',
    status: 'paused',
    details: 'Customer frustrated - escalated to Marcus T.',
  },
  {
    id: 'activity-6',
    portfolioId: 'portfolio-meaningful',
    customerId: 'cust-anon-4',
    customerName: 'Emma Williams',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    action: 'Sent birthday greeting',
    channel: 'email',
    status: 'sent',
    details: 'Personalized birthday message with special offer',
  },
];

// ─── Helper Functions ───────────────────────────────────────────

export function getOwnerById(id: string): PortfolioOwner | undefined {
  return PORTFOLIO_OWNERS.find(o => o.id === id);
}

export function getPortfolioById(id: string): Portfolio | undefined {
  return PORTFOLIOS.find(p => p.id === id);
}

export function getPortfoliosForOwner(ownerId: string): Portfolio[] {
  const owner = getOwnerById(ownerId);
  if (!owner) return [];

  if (owner.permissions.canViewAllPortfolios) {
    return PORTFOLIOS;
  }

  return PORTFOLIOS.filter(p => owner.assignedPortfolioIds.includes(p.id));
}

export function getPendingCustomersForPortfolio(portfolioId: string): PortfolioCustomer[] {
  const portfolio = getPortfolioById(portfolioId);
  if (!portfolio) return [];

  return PENDING_CUSTOMERS.filter(c => {
    if (!c.currentEvent) return false;
    return portfolio.scope.eventTypes.includes(c.currentEvent.type);
  });
}

export function getAgentActivityForPortfolio(portfolioId: string): AgentActivity[] {
  return AGENT_ACTIVITY.filter(a => a.portfolioId === portfolioId);
}
