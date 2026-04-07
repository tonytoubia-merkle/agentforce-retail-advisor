/**
 * Demo Data Service — provides demo-aware product, persona, and campaign data.
 *
 * Resolution order:
 *   1. If a non-default demo is active AND Supabase has data → use Supabase
 *   2. Otherwise → fall back to the golden template mocks
 *
 * This allows the original beauty demo to work unchanged (mock data),
 * while custom demos get their own product catalogs, personas, and campaigns.
 */
import type { Product, ProductCategory, ProductAttributes } from '@/types/product';
import type { DemoProduct, DemoPersona, DemoCampaign } from '@/types/demo';
import type { PersonaMeta } from '@/mocks/customerPersonas';
import type { AdCreative } from '@/types/campaign';

// Lazy-loaded to avoid import errors when Supabase isn't configured
let _supabaseService: typeof import('@/services/supabase/demoService') | null = null;
async function getSvc() {
  if (!_supabaseService) {
    _supabaseService = await import('@/services/supabase/demoService');
  }
  return _supabaseService;
}

// ─── Products ───────────────────────────────────────────────────────

/** Convert a Supabase DemoProduct row to the app's Product interface */
function demoProductToProduct(dp: DemoProduct): Product {
  const attrs = dp.attributes as Record<string, unknown>;
  return {
    id: dp.externalId || dp.id,
    salesforceId: undefined,
    name: dp.name,
    brand: dp.brand,
    category: (dp.category || 'moisturizer') as ProductCategory,
    price: dp.price,
    currency: dp.currency,
    description: dp.description || '',
    shortDescription: dp.shortDescription || '',
    imageUrl: dp.imageUrl || '',
    images: dp.images || [],
    attributes: {
      skinType: attrs.skinType as ProductAttributes['skinType'],
      concerns: attrs.concerns as string[],
      ingredients: attrs.ingredients as string[],
      size: attrs.size as string,
      isTravel: attrs.isTravel as boolean,
      isFragranceFree: attrs.isFragranceFree as boolean,
      isVegan: attrs.isVegan as boolean,
      isCrueltyFree: attrs.isCrueltyFree as boolean,
      isParabenFree: attrs.isParabenFree as boolean,
      isHypoallergenic: attrs.isHypoallergenic as boolean,
      isDermatologistTested: attrs.isDermatologistTested as boolean,
      keyIngredients: attrs.keyIngredients as string[],
    },
    rating: dp.rating,
    reviewCount: dp.reviewCount,
    inStock: dp.inStock,
    retailers: dp.retailers,
  };
}

export async function loadDemoProducts(demoId: string): Promise<Product[] | null> {
  try {
    const svc = await getSvc();
    const products = await svc.getDemoProducts(demoId);
    if (products.length === 0) return null; // fall back to mocks
    return products.map(demoProductToProduct);
  } catch {
    return null;
  }
}

// ─── Personas ───────────────────────────────────────────────────────

function demoPersonaToPersonaMeta(dp: DemoPersona): PersonaMeta {
  return {
    id: dp.personaKey,
    label: dp.label,
    subtitle: dp.subtitle || '',
    traits: dp.traits,
    profile: dp.profile as unknown as PersonaMeta['profile'],
  };
}

export async function loadDemoPersonas(demoId: string): Promise<PersonaMeta[] | null> {
  try {
    const svc = await getSvc();
    const personas = await svc.getDemoPersonas(demoId);
    if (personas.length === 0) return null;
    return personas.map(demoPersonaToPersonaMeta);
  } catch {
    return null;
  }
}

// ─── Campaigns ──────────────────────────────────────────────────────

function demoCampaignToAdCreative(dc: DemoCampaign): AdCreative {
  return {
    id: dc.campaignKey,
    platform: dc.platform as AdCreative['platform'],
    headline: dc.headline,
    description: dc.description || '',
    creativeType: (dc.creativeType || 'static-image') as AdCreative['creativeType'],
    gradientFrom: dc.gradientFrom || '#1a1a2e',
    gradientTo: dc.gradientTo || '#e94560',
    productImage: dc.productImage,
    campaignName: dc.campaignName,
    campaignTheme: dc.campaignTheme || '',
    utmParams: dc.utmParams as unknown as AdCreative['utmParams'],
    audienceSegment: dc.audienceSegment as unknown as AdCreative['audienceSegment'],
    targetingStrategy: (dc.targetingStrategy || 'interest-based') as AdCreative['targetingStrategy'],
    inferredInterests: dc.inferredInterests,
    inferredIntentSignals: dc.inferredIntentSignals,
  };
}

export async function loadDemoCampaigns(demoId: string): Promise<AdCreative[] | null> {
  try {
    const svc = await getSvc();
    const campaigns = await svc.getDemoCampaigns(demoId);
    if (campaigns.length === 0) return null;
    return campaigns.map(demoCampaignToAdCreative);
  } catch {
    return null;
  }
}
