import type { Product } from './product';
import type { SceneSetting } from './scene';

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  uiDirective?: UIDirective;
  /** True while SSE text chunks are still arriving; cleared when stream completes. */
  isStreaming?: boolean;
}

export interface UIDirective {
  action: UIAction;
  payload: UIDirectivePayload;
}

export type UIAction =
  | 'SHOW_PRODUCT'
  | 'SHOW_PRODUCTS'
  | 'CHANGE_SCENE'
  | 'WELCOME_SCENE'
  | 'INITIATE_CHECKOUT'
  | 'CONFIRM_ORDER'
  | 'RESET_SCENE'
  | 'IDENTIFY_CUSTOMER'
  | 'CAPTURE_ONLY'
  // Skin Concierge actions
  | 'LAUNCH_SKIN_ANALYSIS'
  | 'SHOW_SKIN_REPORT'
  | 'RETAILER_HANDOFF';

export interface UIDirectivePayload {
  products?: Product[];
  welcomeMessage?: string;
  welcomeSubtext?: string;
  sceneContext?: {
    setting: SceneSetting;
    mood?: string;
    generateBackground?: boolean;
    backgroundPrompt?: string;
    cmsAssetId?: string;
    cmsTag?: string;
    editMode?: boolean;
    sceneAssetId?: string;
    imageUrl?: string;
  };
  checkoutData?: {
    products: Product[];
    useStoredPayment: boolean;
  };
  orderConfirmation?: {
    orderId: string;
    estimatedDelivery: string;
  };
  /** Email captured from anonymous user for identity resolution. */
  customerEmail?: string;
  /** Background captures that occurred alongside this response. */
  captures?: CaptureNotification[];
  /** Retailer handoff data — which retailers carry the recommended products. */
  retailerHandoff?: {
    retailers: RetailerLink[];
    headline?: string;
  };
}

export interface RetailerLink {
  name: string;
  url: string;
  /** Whether the retailer has physical store locations. */
  inStore: boolean;
  /** Whether online purchase is available. */
  online: boolean;
  /** Optional promo copy (e.g. "20% off this week"). */
  promo?: string;
}

/** A background data-capture event the agent performed silently. */
export interface CaptureNotification {
  type: 'contact_created' | 'meaningful_event' | 'profile_enrichment';
  label: string;
}

export interface AgentResponse {
  sessionId: string;
  message: string;
  uiDirective?: UIDirective;
  suggestedActions?: string[];
  confidence: number;
}
