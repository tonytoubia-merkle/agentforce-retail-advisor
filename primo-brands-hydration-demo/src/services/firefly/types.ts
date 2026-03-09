export interface FireflyConfig {
  clientId: string;
  clientSecret: string;
}

export interface GenerationOptions {
  width?: number;
  height?: number;
  style?: 'photorealistic' | 'artistic' | 'minimal';
}
