/**
 * Frontend client for the Scene_Asset__c registry.
 * Queries, creates, and updates scene asset records via the SOQL/sObject proxy.
 */

export interface SceneAsset {
  id: string;
  setting: string;
  mood?: string;
  imageUrl: string;
  contentVersionId?: string;
  qualityScore: number;
  usageCount: number;
  sceneType: string;
}

/**
 * Find the best scene asset matching a setting and optional mood.
 */
export async function findSceneAsset(
  params: { setting: string; mood?: string; customerContext?: string; sceneType?: string },
  token: string
): Promise<SceneAsset | null> {
  if (!token) return null;

  try {
    const sceneType = params.sceneType || 'product';
    let soql = `SELECT Id, Setting__c, Mood__c, Image_URL__c, Content_Version_Id__c, Quality_Score__c, Usage_Count__c, Scene_Type__c FROM Scene_Asset__c WHERE Setting__c = '${params.setting}' AND Scene_Type__c = '${sceneType}' AND Quality_Score__c >= 2.0`;

    if (params.mood) {
      soql += ` AND Mood__c = '${params.mood}'`;
    }

    soql += ' ORDER BY Quality_Score__c DESC, Last_Used__c DESC NULLS LAST LIMIT 1';

    const response = await fetch('/api/sf-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soql, token }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const records = data.records || [];
    if (records.length === 0) return null;

    const rec = records[0];
    return {
      id: rec.Id,
      setting: rec.Setting__c,
      mood: rec.Mood__c,
      imageUrl: rec.Image_URL__c,
      contentVersionId: rec.Content_Version_Id__c,
      qualityScore: rec.Quality_Score__c || 3,
      usageCount: rec.Usage_Count__c || 0,
      sceneType: rec.Scene_Type__c,
    };
  } catch {
    return null;
  }
}

/**
 * Record that a scene was used (increment usage count, update last used).
 */
export async function recordSceneUsage(sceneAssetId: string, token: string): Promise<void> {
  if (!sceneAssetId || !token) return;

  try {
    await fetch(`/api/sf-record/${sceneAssetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sobject: 'Scene_Asset__c',
        fields: {
          Last_Used__c: new Date().toISOString(),
        },
        token,
      }),
    });
  } catch {
    // Best effort
  }
}

/**
 * Register a newly generated scene in the registry.
 */
export async function registerGeneratedScene(
  params: {
    setting: string;
    mood?: string;
    prompt?: string;
    contentVersionId?: string;
    imageUrl: string;
    products?: string;
    customerContext?: string;
    isEdited?: boolean;
    baseSceneId?: string;
    sceneType?: string;
  },
  token: string
): Promise<string | null> {
  if (!token) return null;

  try {
    const fields: Record<string, unknown> = {
      Setting__c: params.setting,
      Image_URL__c: params.imageUrl,
      Quality_Score__c: 3.0,
      Usage_Count__c: 1,
      Last_Used__c: new Date().toISOString(),
      Source__c: 'generated',
      Scene_Type__c: params.sceneType || 'product',
    };

    if (params.mood) fields.Mood__c = params.mood;
    if (params.prompt) fields.Generation_Prompt__c = params.prompt;
    if (params.contentVersionId) fields.Content_Version_Id__c = params.contentVersionId;
    if (params.products) fields.Products_Used__c = params.products;
    if (params.customerContext) fields.Customer_Context__c = params.customerContext;
    if (params.isEdited) fields.Is_Edited__c = true;
    if (params.baseSceneId) fields.Base_Scene__c = params.baseSceneId;

    const response = await fetch('/api/sf-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sobject: 'Scene_Asset__c',
        fields,
        token,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    console.log('[scene-registry] Registered scene:', data.id);
    return data.id;
  } catch {
    return null;
  }
}
