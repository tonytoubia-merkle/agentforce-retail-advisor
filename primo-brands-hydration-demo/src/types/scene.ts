export type SceneLayout = 
  | 'conversation-centered'
  | 'product-hero'
  | 'product-grid'
  | 'checkout';

/** Well-known settings with pre-seeded images and fallback gradients. */
export type KnownSceneSetting =
  | 'neutral'
  | 'bathroom'
  | 'travel'
  | 'outdoor'
  | 'lifestyle'
  | 'bedroom'
  | 'vanity'
  | 'gym'
  | 'office';

/**
 * Scene setting can be a well-known value OR a free-form string from the agent.
 * Free-form settings (e.g. "streets-of-new-york") won't match pre-seeded images
 * and will always trigger generation via backgroundPrompt.
 */
export type SceneSetting = KnownSceneSetting | (string & {});

export interface SceneBackground {
  type: 'gradient' | 'image' | 'generative';
  value: string;
  generationPrompt?: string;
  isLoading?: boolean;
}

export interface WelcomeData {
  message: string;
  subtext?: string;
}

export interface SceneState {
  layout: SceneLayout;
  setting: SceneSetting;
  background: SceneBackground;
  chatPosition: 'center' | 'bottom' | 'minimized';
  products: import('./product').Product[];
  checkoutActive: boolean;
  welcomeActive: boolean;
  welcomeData?: WelcomeData;
  transitionKey: string;
}

export interface SceneTransition {
  from: SceneLayout;
  to: SceneLayout;
  animation: 'fade' | 'morph' | 'slide-up' | 'expand';
  duration: number;
}
