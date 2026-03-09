/**
 * Gemini generateContent client for image editing.
 *
 * Uses Gemini 2.5 Flash which supports image input + text prompt,
 * enabling real image editing (background removal, compositing, etc.)
 * unlike Imagen which only supports text-to-image generation.
 */

import { base64ToBlobUrl, imageUrlToBase64 } from '@/services/imagen/utils';
import type { SceneSetting } from '@/types/scene';

interface GeminiConfig {
  apiKey: string;
}

interface GeminiPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
}

export class GeminiClient {
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = config;
  }

  /**
   * Send an image + text prompt to Gemini and get back an edited image.
   */
  private async editImage(imageBase64: string, prompt: string, mimeType = 'image/jpeg'): Promise<string> {
    console.log('[gemini] editImage request — prompt:', prompt.substring(0, 80), '...');
    const response = await fetch('/api/gemini/generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              },
            },
          ],
        }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini generateContent failed (${response.status}): ${errText}`);
    }

    const data: GeminiResponse = await response.json();
    // Log raw response structure for debugging
    const rawParts = data.candidates?.[0]?.content?.parts;
    console.log('[gemini] response candidates:', data.candidates?.length ?? 0);
    if (rawParts) {
      console.log('[gemini] parts keys:', rawParts.map(p => Object.keys(p)));
    } else {
      console.error('[gemini] Full response:', JSON.stringify(data).substring(0, 1000));
      throw new Error('Gemini returned no content parts');
    }

    // Find the image part — check both inline_data and inlineData (API may use camelCase)
    const imagePart = rawParts.find((p: GeminiPart) =>
      p.inline_data?.data || (p as unknown as Record<string, { data?: string }>).inlineData?.data
    );
    const imageData = (imagePart as GeminiPart)?.inline_data
      || (imagePart as unknown as { inlineData?: { data: string; mime_type?: string; mimeType?: string } })?.inlineData;

    if (!imageData?.data) {
      console.error('[gemini] No image found. Raw parts:', JSON.stringify(rawParts).substring(0, 500));
      throw new Error('Gemini returned no image in response');
    }

    const mimeOut = imageData.mime_type
      || (imageData as unknown as { mimeType?: string }).mimeType
      || 'image/png';

    console.log('[gemini] editImage success — got image part, mime:', mimeOut);
    return base64ToBlobUrl(imageData.data, mimeOut);
  }

  /**
   * Remove the background from a product image, placing it on pure white.
   * This uses the actual product photo — Gemini can see the product and
   * isolate it from its background.
   */
  async removeBackground(productImageUrl: string): Promise<string> {
    const imageBase64 = await imageUrlToBase64(productImageUrl);

    return this.editImage(
      imageBase64,
      'Remove the background from this product image completely. Place the product on a perfectly pure solid white background (#FFFFFF). Keep the product exactly as it is — do not modify, reshape, or recolor the product itself. Only remove the background. The result should look like a professional e-commerce product photo on white.',
    );
  }

  /**
   * Edit a scene background image using a text instruction.
   * Takes a CMS scene image and applies edits (e.g., "add warm candlelight").
   */
  async editSceneBackground(seedImageUrl: string, editPrompt: string): Promise<string> {
    const imageBase64 = await imageUrlToBase64(seedImageUrl);

    return this.editImage(
      imageBase64,
      `${editPrompt}. Keep the overall scene composition. Do not add any products, bottles, or text. Professional interior photography quality.`,
    );
  }

  /**
   * Stage a product into a scene — remove background and prepare for compositing.
   * Returns a white-background product image that CSS mix-blend-mode: multiply
   * will composite onto the scene.
   */
  async stageProductInScene(
    productImageUrl: string,
    _setting: SceneSetting,
    _productName?: string
  ): Promise<string> {
    return this.removeBackground(productImageUrl);
  }
}

let geminiClient: GeminiClient | null = null;

export const getGeminiClient = (): GeminiClient => {
  if (!geminiClient) {
    geminiClient = new GeminiClient({
      apiKey: import.meta.env.VITE_IMAGEN_API_KEY || '',
    });
  }
  return geminiClient;
};
