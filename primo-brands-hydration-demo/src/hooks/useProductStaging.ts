import { useState, useEffect, useRef } from 'react';
import type { SceneSetting } from '@/types/scene';

type ImageProvider = 'imagen' | 'firefly' | 'cms-only' | 'none';

/** Cache keyed by `${productId}-${setting}` to avoid re-generating. */
const globalCache: Record<string, string> = {};

/**
 * Stages a product image into the current scene using Imagen edit API.
 * Returns the composited image URL (or the original if staging is unavailable).
 */
export function useProductStaging(
  productId: string,
  originalImageUrl: string,
  setting: SceneSetting,
  productName?: string
) {
  const [stagedUrl, setStagedUrl] = useState<string | null>(null);
  const [isStaging, setIsStaging] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    const enabled = import.meta.env.VITE_ENABLE_GENERATIVE_BACKGROUNDS === 'true';
    const provider = (import.meta.env.VITE_IMAGE_PROVIDER as ImageProvider) || 'none';

    if (!enabled || provider !== 'imagen' || !originalImageUrl) {
      setStagedUrl(null);
      return;
    }

    const cacheKey = `${productId}-${setting}`;
    if (globalCache[cacheKey]) {
      setStagedUrl(globalCache[cacheKey]);
      return;
    }

    setIsStaging(true);

    (async () => {
      try {
        // Check CMS / ContentVersion for previously staged image
        try {
          const tag = `staged-${productId}-${setting}`;
          const { getAgentforceClient } = await import('@/services/agentforce/client');
          const token = await getAgentforceClient().getAccessToken();

          // Try CMS delivery first, then ContentVersion fallback
          if (import.meta.env.VITE_CMS_CHANNEL_ID) {
            const { fetchCmsBackgroundEnhanced } = await import('@/services/cms/backgroundAssets');
            const cmsUrl = await fetchCmsBackgroundEnhanced({ tag }, token);
            if (cmsUrl && !abortRef.current) {
              globalCache[cacheKey] = cmsUrl;
              setStagedUrl(cmsUrl);
              setIsStaging(false);
              return;
            }
          }
          // Skip ContentVersion fallback — those URLs require auth
          // headers that <img> tags can't send, resulting in 400 errors.
        } catch {
          // Lookup failed, continue to generate
        }

        const { getImagenClient } = await import('@/services/imagen/client');
        const url = await getImagenClient().stageProductInScene(originalImageUrl, setting, productName);
        if (!abortRef.current) {
          globalCache[cacheKey] = url;
          setStagedUrl(url);

          // Persist to CMS in background
          if (import.meta.env.VITE_CMS_CHANNEL_ID) {
            try {
              const { uploadImageToCmsAsync } = await import('@/services/cms/uploadAsset');
              const { getAgentforceClient } = await import('@/services/agentforce/client');
              const tok = await getAgentforceClient().getAccessToken();
              uploadImageToCmsAsync(
                url,
                `Staged ${productId} in ${setting}`,
                [`staged-${productId}-${setting}`],
                tok
              );
            } catch { /* best-effort */ }
          }
        }
      } catch (err: unknown) {
        console.error('Product staging failed, using original image:', err instanceof Error ? err.message : err);
        if (!abortRef.current) {
          setStagedUrl(null);
        }
      } finally {
        if (!abortRef.current) {
          setIsStaging(false);
        }
      }
    })();

    return () => {
      abortRef.current = true;
    };
  }, [productId, originalImageUrl, setting]);

  return {
    imageUrl: stagedUrl || originalImageUrl,
    isStaging,
    isStaged: !!stagedUrl,
  };
}
