import type { SceneSetting } from '@/types/scene';

const channelId = import.meta.env.VITE_CMS_CHANNEL_ID || '';

function extractImageUrl(item: Record<string, unknown>): string | null {
  const nodes = item.contentNodes as Record<string, { url?: string }> | undefined;
  if (!nodes) return null;
  const url = nodes.source?.url || nodes.bannerImage?.url || nodes.thumbnail?.url || null;
  if (!url) return null;
  // Rewrite Salesforce CMS media paths to go through our proxy
  if (url.startsWith('/cms/delivery/media/')) {
    return `/api/cms-media${url.replace('/cms/delivery/media', '')}`;
  }
  // Only use URLs the browser can load directly (blob, data, or other proxied paths)
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('/api/')) {
    return url;
  }
  console.warn('[cms] Skipping non-loadable CMS URL:', url);
  return null;
}

/**
 * Fetch a pre-stored scene background from Salesforce CMS.
 * Assets are expected to be tagged with `scene-{setting}` (e.g. `scene-bathroom`).
 */
export async function fetchCmsBackground(
  setting: SceneSetting,
  token: string
): Promise<string | null> {
  return fetchCmsBackgroundByTag(`scene-${setting}`, token);
}

async function fetchCmsBackgroundById(
  assetId: string,
  token: string
): Promise<string | null> {
  if (!channelId || !assetId) return null;
  try {
    const url = `/api/cms/delivery/channels/${channelId}/contents/${assetId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return extractImageUrl(data);
  } catch {
    return null;
  }
}

async function fetchCmsBackgroundByTag(
  tag: string,
  token: string
): Promise<string | null> {
  if (!channelId || !tag) return null;
  try {
    const url = `/api/cms/delivery/channels/${channelId}/contents/query?managedContentType=cms_image&tags=${tag}&pageSize=1`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      console.log(`[cms] Tag lookup "${tag}" returned ${response.status}`);
      return null;
    }
    const data = await response.json();
    const items = data.items || [];
    console.log(`[cms] Tag lookup "${tag}" → ${items.length} items`);

    // Salesforce CMS delivery API may ignore tags filter and return all content.
    // Validate that the item actually has the requested tag before using it.
    const item = items.find((i: Record<string, unknown>) => {
      const tags = i.tags as Array<{ name?: string }> | undefined;
      if (!tags?.length) return false;
      return tags.some((t) => t.name === tag);
    });

    if (!item) {
      console.log(`[cms] No item with matching tag "${tag}" found (${items.length} total items returned)`);
      return null;
    }
    const imageUrl = extractImageUrl(item);
    console.log(`[cms] Tag lookup "${tag}" → URL:`, imageUrl);
    return imageUrl;
  } catch {
    return null;
  }
}

/**
 * Enhanced CMS lookup: tries asset ID → custom tag → scene-{setting} tag → ContentVersion fallback.
 */
export async function fetchCmsBackgroundEnhanced(
  params: { assetId?: string; tag?: string; setting?: SceneSetting },
  token: string
): Promise<string | null> {
  // CMS delivery lookups (require channelId)
  if (channelId) {
    if (params.assetId) {
      const url = await fetchCmsBackgroundById(params.assetId, token);
      if (url) return url;
    }

    if (params.tag) {
      const url = await fetchCmsBackgroundByTag(params.tag, token);
      if (url) return url;
    }

    if (params.setting) {
      const url = await fetchCmsBackgroundByTag(`scene-${params.setting}`, token);
      if (url) return url;
    }
  }

  // ContentVersion fallback — queries files uploaded via /api/cms-upload
  const { fetchContentVersionByTag } = await import('./readContentVersion');
  if (params.tag) {
    const url = await fetchContentVersionByTag(params.tag, token);
    if (url) return url;
  }
  if (params.setting) {
    return fetchContentVersionByTag(`scene-${params.setting}`, token);
  }

  return null;
}
