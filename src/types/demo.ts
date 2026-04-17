// ─── Demo Builder Types ─────────────────────────────────────────────

export type DemoVertical = 'beauty' | 'fashion' | 'travel' | 'wellness' | 'cpg';
export type DemoStatus = 'draft' | 'deploying' | 'live' | 'archived' | 'error';
export type ImageProvider = 'imagen' | 'firefly' | 'cms-only' | 'none';

export interface DemoTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

export interface DemoFeatureFlags {
  useMockData: boolean;
  enableGenerativeBackgrounds: boolean;
  enableProductTransparency: boolean;
  enableSkinAdvisor: boolean;
}

export interface DemoSalesforceConfig {
  instanceUrl?: string;
  orgId?: string;
  clientId?: string;
  clientSecret?: string;
  agentId?: string;
  skinAgentId?: string;
}

export interface DemoConfig {
  id: string;
  slug: string;
  name: string;
  vertical: DemoVertical;
  status: DemoStatus;
  ownerId?: string;         // FK to combobulator users table
  ownerEmail: string;
  projectId?: string;       // FK to combobulator projects table

  // Brand identity
  brandName: string;
  brandTagline?: string;
  logoUrl?: string;
  faviconUrl?: string;

  // Theme
  theme: DemoTheme;

  // Salesforce
  salesforce: DemoSalesforceConfig;

  // Image generation
  imageProvider: ImageProvider;

  // Feature flags
  featureFlags: DemoFeatureFlags;

  // Timestamps
  deployedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Minimal info shown on the admin dashboard list */
export interface DemoSummary {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  vertical: DemoVertical;
  status: DemoStatus;
  ownerEmail: string;
  deployedAt?: string;
  createdAt: string;
}

/** Payload for creating a new demo */
export interface CreateDemoInput {
  slug: string;
  name: string;
  vertical: DemoVertical;
  ownerEmail: string;
  brandName: string;
  brandTagline?: string;
  theme?: Partial<DemoTheme>;
  featureFlags?: Partial<DemoFeatureFlags>;
}

/** Payload for the AI research phase */
export interface BrandResearchRequest {
  brandName: string;
  brandUrl?: string;
  vertical: DemoVertical;
  notes?: string;
}

export interface BrandResearchResult {
  suggestedTheme: DemoTheme;
  suggestedTagline: string;
  productSuggestions: DemoProductInput[];
  personaSuggestions: DemoPersonaInput[];
  brandVoiceNotes: string;
}

/** Product as stored per-demo */
export interface DemoProduct {
  id: string;
  demoId: string;
  externalId?: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  description?: string;
  shortDescription?: string;
  imageUrl?: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  attributes: Record<string, unknown>;
  retailers: Array<{ name: string; url: string; inStore: boolean; online: boolean; promo?: string }>;
  sortOrder: number;
}

export type DemoProductInput = Omit<DemoProduct, 'id' | 'demoId' | 'sortOrder'> & {
  sortOrder?: number;
};

/** Persona as stored per-demo */
export interface DemoPersona {
  id: string;
  demoId: string;
  personaKey: string;
  label: string;
  subtitle?: string;
  traits: string[];
  profile: Record<string, unknown>;
  sortOrder: number;
}

export type DemoPersonaInput = Omit<DemoPersona, 'id' | 'demoId' | 'sortOrder'> & {
  sortOrder?: number;
};

/** Campaign / ad creative per-demo */
export interface DemoCampaign {
  id: string;
  demoId: string;
  campaignKey: string;
  platform: string;
  headline: string;
  description?: string;
  creativeType: string;
  gradientFrom?: string;
  gradientTo?: string;
  productImage?: string;
  campaignName: string;
  campaignTheme?: string;
  utmParams: Record<string, string>;
  audienceSegment: Record<string, unknown>;
  targetingStrategy?: string;
  inferredInterests: string[];
  inferredIntentSignals: string[];
  sortOrder: number;
}

/** Deploy step record */
export type DeployAction = 'create_org' | 'deploy_metadata' | 'seed_data' | 'configure_vercel';
export type DeployStepStatus = 'pending' | 'running' | 'success' | 'failed';

export interface DeployStep {
  id: string;
  demoId: string;
  action: DeployAction;
  status: DeployStepStatus;
  startedAt: string;
  completedAt?: string;
  log?: string;
  error?: string;
}
