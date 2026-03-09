/**
 * Query Salesforce ContentVersion records by tags stored in Description.
 * Used as fallback when CMS delivery API finds no matching content.
 */

export async function fetchContentVersionByTag(
  tag: string,
  token: string
): Promise<string | null> {
  if (!tag || !token) return null;

  try {
    const soql = `SELECT Id FROM ContentVersion WHERE Description LIKE '%${tag}%' AND IsLatest = true ORDER BY CreatedDate DESC LIMIT 1`;

    const response = await fetch('/api/sf-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soql, token }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const records = data.records || [];
    if (records.length === 0) return null;

    const versionId = records[0].Id;
    console.log(`[cms] ContentVersion fallback found "${tag}" → ${versionId}`);
    return `/api/sf-file/${versionId}`;
  } catch {
    return null;
  }
}
