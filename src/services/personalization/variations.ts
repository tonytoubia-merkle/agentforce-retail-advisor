/**
 * Client-side resolver for Personalization_Variation__c records.
 *
 * Queries variations from CRM via the existing sf-query proxy and evaluates
 * segment rules against visitor context on the client. This avoids a round-trip
 * to the Apex REST endpoint for resolution and works with the same proxy infra.
 *
 * Architecture:
 *   1. On first call per point, fetch all active variations via SOQL
 *   2. Cache in memory (TTL: 2 minutes)
 *   3. Evaluate segment rules against visitor context
 *   4. Return the highest-priority match
 *
 * Falls through to null if no variations match — callers should use the
 * SF Personalization SDK decision as the primary source and overlay
 * custom variations only when they have a match.
 */

import { demoLog } from '@/services/demoLog';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VariationRecord {
  id: string;
  variationName: string;
  pointName: string;
  segmentRules: Record<string, unknown>;
  content: Record<string, unknown>;
  priority: number;
  channel: string;
  startDate: string | null;
  endDate: string | null;
  createdByAPI: boolean;
}

export interface VisitorContext {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  identity_tier?: string;
  interests?: string[];
  age_range?: string;
  gender?: string;
  skin_type?: string;
  channel?: string;
  [key: string]: unknown;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const cache = new Map<string, { variations: VariationRecord[]; fetchedAt: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

// ─── SOQL fetch ───────────────────────────────────────────────────────────────

async function fetchVariations(pointName: string): Promise<VariationRecord[]> {
  const cached = cache.get(pointName);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.variations;
  }

  const soql = `SELECT Id, Variation_Name__c, Point_Name__c, Segment_Rules__c, Content_JSON__c, Priority__c, Channel__c, Start_Date__c, End_Date__c, Created_By_API__c FROM Personalization_Variation__c WHERE Point_Name__c = '${pointName}' AND Is_Active__c = true ORDER BY Priority__c DESC`;

  try {
    // Get server token first (sf-query requires it)
    let token: string | undefined;
    try {
      const tokenResp = await fetch('/api/sf/token', { method: 'POST' });
      if (tokenResp.ok) {
        const tokenData = await tokenResp.json();
        token = tokenData.access_token;
      }
    } catch { /* fall through — proxy will reject without token */ }

    const resp = await fetch('/api/sf-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soql, token }),
    });

    if (!resp.ok) {
      console.warn('[variations] SOQL fetch failed:', resp.status);
      return [];
    }

    const data = await resp.json();
    const records = (data.records || []).map((r: Record<string, unknown>) => ({
      id: r.Id as string,
      variationName: r.Variation_Name__c as string,
      pointName: r.Point_Name__c as string,
      segmentRules: safeParseJSON(r.Segment_Rules__c as string),
      content: safeParseJSON(r.Content_JSON__c as string),
      priority: (r.Priority__c as number) || 0,
      channel: (r.Channel__c as string) || 'All',
      startDate: r.Start_Date__c as string | null,
      endDate: r.End_Date__c as string | null,
      createdByAPI: r.Created_By_API__c as boolean,
    }));

    cache.set(pointName, { variations: records, fetchedAt: Date.now() });
    return records;
  } catch (err) {
    console.warn('[variations] fetch error:', err);
    return [];
  }
}

function safeParseJSON(str: string | null | undefined): Record<string, unknown> {
  if (!str) return {};
  try { return JSON.parse(str); } catch { return {}; }
}

// ─── Rule matching ────────────────────────────────────────────────────────────

function matchesAllRules(rules: Record<string, unknown>, ctx: VisitorContext): boolean {
  const ruleKeys = Object.keys(rules);
  if (ruleKeys.length === 0) return true; // default variation

  for (const key of ruleKeys) {
    const ruleVal = rules[key];
    const ctxVal = ctx[key];
    if (ctxVal === undefined || ctxVal === null) return false;

    if (Array.isArray(ruleVal)) {
      // Array rule: at least one element must match in context
      const ruleStrs = ruleVal.map(v => String(v).toLowerCase());
      if (Array.isArray(ctxVal)) {
        const ctxStrs = ctxVal.map(v => String(v).toLowerCase());
        if (!ruleStrs.some(r => ctxStrs.includes(r))) return false;
      } else {
        if (!ruleStrs.includes(String(ctxVal).toLowerCase())) return false;
      }
    } else {
      // Exact match (case-insensitive)
      if (String(ruleVal).toLowerCase() !== String(ctxVal).toLowerCase()) return false;
    }
  }
  return true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve the best custom variation for a personalization point.
 * Returns null if no variations exist or none match the visitor context.
 */
export async function resolveVariation(
  pointName: string,
  visitorCtx: VisitorContext,
): Promise<VariationRecord | null> {
  const variations = await fetchVariations(pointName);
  if (variations.length === 0) return null;

  const now = new Date();

  for (const v of variations) {
    // Date range filter
    if (v.startDate && new Date(v.startDate) > now) continue;
    if (v.endDate && new Date(v.endDate) < now) continue;

    // Channel filter
    const channel = visitorCtx.channel || 'Web';
    if (v.channel !== 'All' && v.channel !== channel) continue;

    // Rule matching
    if (matchesAllRules(v.segmentRules, visitorCtx)) {
      demoLog.log({
        category: 'personalization',
        title: `Custom Variation Matched: ${pointName}`,
        subtitle: v.variationName,
        details: {
          variationId: v.id,
          priority: v.priority,
          rules: v.segmentRules,
          createdByAPI: v.createdByAPI,
        },
      });
      return v;
    }
  }

  return null;
}

/**
 * Create a new variation via the existing sf-record proxy.
 */
export async function createVariation(params: {
  pointName: string;
  variationName: string;
  content: Record<string, unknown>;
  segmentRules?: Record<string, unknown>;
  priority?: number;
  channel?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ id: string } | null> {
  const resp = await fetch('/api/sf-record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sobject: 'Personalization_Variation__c',
      fields: {
        Point_Name__c: params.pointName,
        Variation_Name__c: params.variationName,
        Content_JSON__c: JSON.stringify(params.content),
        Segment_Rules__c: JSON.stringify(params.segmentRules || {}),
        Priority__c: params.priority ?? 100,
        Is_Active__c: true,
        Channel__c: params.channel || 'All',
        Created_By_API__c: true,
        ...(params.startDate && { Start_Date__c: params.startDate }),
        ...(params.endDate && { End_Date__c: params.endDate }),
      },
    }),
  });

  if (!resp.ok) {
    console.error('[variations] create failed:', await resp.text());
    return null;
  }

  const data = await resp.json();
  // Invalidate cache
  cache.delete(params.pointName);

  demoLog.log({
    category: 'personalization',
    title: 'Variation Created via API',
    subtitle: `${params.variationName} → ${params.pointName}`,
    details: { id: data.id, rules: params.segmentRules, priority: params.priority },
  });

  return { id: data.id };
}

/**
 * Invalidate the client-side cache for a point (e.g., after creating a variation).
 */
export function invalidateVariationCache(pointName?: string): void {
  if (pointName) {
    cache.delete(pointName);
  } else {
    cache.clear();
  }
}
