import type { SceneSetting } from '@/types/scene';

/**
 * Brand standards for BEAUTÉ beauty brand.
 * Applied to all generated backgrounds for visual consistency.
 */
export const BRAND_CONTEXT = `
Luxury beauty brand aesthetic. Soft, elegant, aspirational mood.
Color palette: muted pastels, warm neutrals, soft rose gold accents.
Lighting: soft diffused natural light, gentle highlights, no harsh shadows.
Style: high-end editorial photography, magazine-quality, sophisticated.
`.trim();

/**
 * Composition guidance for chat/product overlay.
 * Ensures the generated background leaves space for UI elements.
 */
export const COMPOSITION_GUIDANCE = `
IMPORTANT COMPOSITION: This image will be used as a background behind a chat interface.
Keep the CENTER of the image relatively simple, muted, and low-contrast.
Place visual interest, textures, and details toward the EDGES and CORNERS.
The middle 40% should be subtle enough to allow text and product overlays to remain readable.
Avoid bright highlights, text, or busy patterns in the center area.
`.trim();

export const SCENE_PROMPTS: Record<SceneSetting, string> = {
  neutral:
    'Elegant minimalist empty surface with soft bokeh lights in the background, sophisticated neutral tones, studio lighting, clean uncluttered space',

  bathroom:
    'Luxurious modern bathroom counter with white marble surface, soft natural morning light streaming through a frosted window, potted eucalyptus plant, high-end spa aesthetic, empty counter with no products or bottles',

  travel:
    'Stylish hotel room with a leather carry-on suitcase on a bed, warm golden hour light, passport and boarding pass visible, wanderlust travel aesthetic, no toiletries or products visible',

  outdoor:
    'Fresh outdoor wooden table with lush green foliage, morning dew on leaves, dappled sunlight, healthy active lifestyle setting, empty table surface with no objects',

  lifestyle:
    'Sophisticated vanity dresser with round mirror, soft pink and cream tones, natural daylight from a large window, clean empty surface with no products or cosmetics',

  bedroom:
    'Cozy bedroom nightstand with warm amber lamp light, soft linen textures, dark moody evening atmosphere, a small empty tray on the nightstand, no products or bottles',

  vanity:
    'Glamorous makeup vanity station with Hollywood mirror lights, velvet blush-pink seat, clean marble countertop, warm flattering light, empty surface with no cosmetics',

  gym:
    'Modern gym locker room shelf, clean concrete and brushed metal surfaces, bright even overhead lighting, a folded white towel nearby, empty shelf with no bottles or products',

  office:
    'Minimalist modern office desk near a large window, natural daylight, clean white surface with a small plant, calm productive atmosphere, empty desk with no objects',
};

export function buildScenePrompt(setting: SceneSetting): string {
  const base = SCENE_PROMPTS[setting];
  return `${base}.

${BRAND_CONTEXT}

${COMPOSITION_GUIDANCE}

Empty background scene only, no products, no bottles, no cosmetics, no text or labels. Professional interior photography, ultra high quality, photorealistic.`;
}

/**
 * Wrap an agent-provided prompt with brand and composition guidance.
 * Used for "novel" prompts like specific locations or weather conditions.
 */
export function wrapAgentPrompt(rawPrompt: string): string {
  return `${rawPrompt}.

${BRAND_CONTEXT}

${COMPOSITION_GUIDANCE}

Do not include any products, bottles, containers, or packaging in the image. Scene only, no objects. Ultra high quality, photorealistic.`;
}

/**
 * Prompts for generating a product image on a pure white background.
 * The white background is then removed via CSS mix-blend-mode: multiply,
 * allowing the product to composite onto the scene background.
 */
export const STAGING_PROMPTS: Record<SceneSetting, string> = {
  neutral:
    'A single elegant skincare bottle, soft studio lighting from above and side, subtle shadow beneath the product',

  bathroom:
    'A single elegant skincare bottle with a slight dewy moisture effect on the surface, soft diffused lighting',

  travel:
    'A single compact travel-size skincare bottle, clean studio lighting, slight reflection on surface',

  outdoor:
    'A single elegant skincare bottle with a fresh natural feel, bright even studio lighting, crisp and clean',

  lifestyle:
    'A single luxurious skincare bottle, warm soft studio lighting, gentle highlight on the cap, slight reflection',

  bedroom:
    'A single elegant skincare bottle with warm amber tones, soft intimate lighting, gentle glow on the surface',

  vanity:
    'A single beauty product with glamorous lighting, Hollywood mirror-style illumination, flattering warm glow',

  gym:
    'A single compact product bottle, bright clean lighting, modern minimal aesthetic, crisp shadows',

  office:
    'A single minimalist beauty product, clean natural daylight, subtle shadow, professional product shot',
};

export function buildStagingPrompt(setting: SceneSetting): string {
  const base = STAGING_PROMPTS[setting];
  return `${base}. Product centered on a perfectly pure white background. No other objects, no surface, no scene, no environment — ONLY the product on solid white. Professional e-commerce product photography, ultra high quality, photorealistic. No text, no labels, no logos.`;
}
