import { buildScenePrompt } from '@/services/firefly/prompts';
import type { SceneSetting } from '@/types/scene';
import type { Product } from '@/types/product';
import type { ImagenConfig } from './types';
import { base64ToBlobUrl } from './utils';

export class ImagenClient {
  private config: ImagenConfig;

  constructor(config: ImagenConfig) {
    this.config = config;
  }

  /** Generate a scene background from a text prompt (Imagen 4). */
  async generateSceneBackground(
    setting: SceneSetting,
    _products: Product[]
  ): Promise<string> {
    const prompt = buildScenePrompt(setting);

    const response = await fetch('/api/imagen/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
          personGeneration: 'dont_allow',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Imagen generation failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    console.log('[imagen] response keys:', Object.keys(data), 'predictions count:', data.predictions?.length);
    if (data.predictions?.[0]) {
      console.log('[imagen] prediction keys:', Object.keys(data.predictions[0]));
    }
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Image) {
      const reason = data.predictions?.[0]?.raiFilteredReason || JSON.stringify(data).substring(0, 300);
      throw new Error(`Imagen returned no image data: ${reason}`);
    }

    return base64ToBlobUrl(base64Image);
  }

  /** Generate a scene background from a raw prompt string (no setting mapping). */
  async generateFromPrompt(prompt: string): Promise<string> {
    const response = await fetch('/api/imagen/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
          personGeneration: 'dont_allow',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Imagen generation failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Image) {
      const reason = data.predictions?.[0]?.raiFilteredReason || JSON.stringify(data).substring(0, 300);
      throw new Error(`Imagen returned no image data: ${reason}`);
    }

    return base64ToBlobUrl(base64Image);
  }

  /**
   * Edit a scene background using Gemini (real image editing with seed image).
   * Delegates to Gemini generateContent which supports image input + prompt.
   */
  async editSceneBackground(
    seedImageUrl: string,
    editPrompt: string
  ): Promise<string> {
    const { getGeminiClient } = await import('@/services/gemini/client');
    return getGeminiClient().editSceneBackground(seedImageUrl, editPrompt);
  }

  /**
   * Remove background from a product image using Gemini.
   * Returns the product on a pure white background — CSS mix-blend-mode: multiply
   * then composites it onto the scene.
   */
  async stageProductInScene(
    productImageUrl: string,
    setting: SceneSetting,
    productName?: string
  ): Promise<string> {
    const { getGeminiClient } = await import('@/services/gemini/client');
    return getGeminiClient().stageProductInScene(productImageUrl, setting, productName);
  }
}

let imagenClient: ImagenClient | null = null;

export const getImagenClient = (): ImagenClient => {
  if (!imagenClient) {
    imagenClient = new ImagenClient({
      apiKey: import.meta.env.VITE_IMAGEN_API_KEY || '',
    });
  }
  return imagenClient;
};
