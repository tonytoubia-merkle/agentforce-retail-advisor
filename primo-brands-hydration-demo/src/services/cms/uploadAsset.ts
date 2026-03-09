/**
 * Upload generated images to Salesforce via ContentVersion API.
 *
 * Uses a dedicated server endpoint (/api/cms-upload) that posts to
 * the Salesforce ContentVersion REST API — works with any org,
 * no Enhanced CMS 2.0 workspace required.
 *
 * Tags are stored in the Description field for later retrieval.
 */

export interface CmsUploadResult {
  contentId: string;
  imageUrl: string;
}

async function blobUrlToBase64(blobUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  return { base64, mimeType: blob.type || 'image/png' };
}

/**
 * Upload a blob-URL image to Salesforce ContentVersion.
 * Returns the content version ID and a proxy image URL, or null on failure.
 */
export async function uploadImageToCms(
  blobUrl: string,
  title: string,
  tags: string[],
  token: string
): Promise<CmsUploadResult | null> {
  try {
    const { base64 } = await blobUrlToBase64(blobUrl);
    const fileName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '.png';

    const response = await fetch('/api/cms-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        fileName,
        title,
        tags,
        token,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[cms] Upload failed (${response.status}):`, errText);
      return null;
    }

    const data = await response.json();
    console.log(`[cms] Uploaded "${title}" [${tags.join(', ')}] → ${data.id}`);

    return { contentId: data.id, imageUrl: data.imageUrl || blobUrl };
  } catch (err) {
    console.warn('[cms] Upload error:', err);
    return null;
  }
}

/**
 * Fire-and-forget upload — doesn't block the caller.
 * Used after image generation to persist results in the background.
 */
export function uploadImageToCmsAsync(
  blobUrl: string,
  title: string,
  tags: string[],
  token: string
): void {
  uploadImageToCms(blobUrl, title, tags, token).catch((err) => {
    console.warn('Background CMS upload failed:', err);
  });
}
