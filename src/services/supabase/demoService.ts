/**
 * Demo Builder — Supabase data service.
 * CRUD for demos, products, personas, campaigns, and deploy steps.
 */
import { getSupabase, isSupabaseConfigured } from './client';
import type {
  DemoConfig,
  DemoSummary,
  CreateDemoInput,
  DemoProduct,
  DemoProductInput,
  DemoPersona,
  DemoPersonaInput,
  DemoCampaign,
  DeployStep,
} from '@/types/demo';

// ─── Helpers: row ↔ type mappers ────────────────────────────────────

function rowToConfig(r: Record<string, unknown>): DemoConfig {
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    vertical: r.vertical as DemoConfig['vertical'],
    status: r.status as DemoConfig['status'],
    ownerEmail: r.owner_email as string,
    brandName: r.brand_name as string,
    brandTagline: r.brand_tagline as string | undefined,
    logoUrl: r.logo_url as string | undefined,
    faviconUrl: r.favicon_url as string | undefined,
    theme: r.theme as DemoConfig['theme'],
    salesforce: {
      instanceUrl: r.sf_instance_url as string | undefined,
      orgId: r.sf_org_id as string | undefined,
      clientId: r.sf_client_id as string | undefined,
      clientSecret: r.sf_client_secret as string | undefined,
      agentId: r.sf_agent_id as string | undefined,
      skinAgentId: r.sf_skin_agent_id as string | undefined,
    },
    imageProvider: r.image_provider as DemoConfig['imageProvider'],
    featureFlags: r.feature_flags as DemoConfig['featureFlags'],
    deployedAt: r.deployed_at as string | undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function rowToSummary(r: Record<string, unknown>): DemoSummary {
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    brandName: r.brand_name as string,
    vertical: r.vertical as DemoSummary['vertical'],
    status: r.status as DemoSummary['status'],
    ownerEmail: r.owner_email as string,
    deployedAt: r.deployed_at as string | undefined,
    createdAt: r.created_at as string,
  };
}

// ─── Demos CRUD ─────────────────────────────────────────────────────

export async function listDemos(): Promise<DemoSummary[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase()
    .from('demos')
    .select('id, slug, name, brand_name, vertical, status, owner_email, deployed_at, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToSummary);
}

export async function getDemo(idOrSlug: string): Promise<DemoConfig | null> {
  if (!isSupabaseConfigured()) return null;
  // Try by ID first, then by slug
  const isUuid = /^[0-9a-f]{8}-/.test(idOrSlug);
  const col = isUuid ? 'id' : 'slug';
  const { data, error } = await getSupabase()
    .from('demos')
    .select('*')
    .eq(col, idOrSlug)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToConfig(data) : null;
}

export async function createDemo(input: CreateDemoInput): Promise<DemoConfig> {
  const row = {
    slug: input.slug,
    name: input.name,
    vertical: input.vertical,
    owner_email: input.ownerEmail,
    brand_name: input.brandName,
    brand_tagline: input.brandTagline,
    ...(input.theme ? { theme: { ...defaultTheme(), ...input.theme } } : {}),
    ...(input.featureFlags ? { feature_flags: { ...defaultFlags(), ...input.featureFlags } } : {}),
  };
  const { data, error } = await getSupabase()
    .from('demos')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return rowToConfig(data);
}

export async function updateDemo(id: string, updates: Partial<Record<string, unknown>>): Promise<DemoConfig> {
  const { data, error } = await getSupabase()
    .from('demos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToConfig(data);
}

export async function deleteDemo(id: string): Promise<void> {
  const { error } = await getSupabase().from('demos').delete().eq('id', id);
  if (error) throw error;
}

// ─── Products ───────────────────────────────────────────────────────

export async function getDemoProducts(demoId: string): Promise<DemoProduct[]> {
  const { data, error } = await getSupabase()
    .from('demo_products')
    .select('*')
    .eq('demo_id', demoId)
    .order('sort_order');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    demoId: r.demo_id,
    externalId: r.external_id,
    name: r.name,
    brand: r.brand,
    category: r.category,
    price: Number(r.price),
    currency: r.currency,
    description: r.description,
    shortDescription: r.short_description,
    imageUrl: r.image_url,
    images: r.images ?? [],
    rating: Number(r.rating),
    reviewCount: r.review_count,
    inStock: r.in_stock,
    attributes: r.attributes ?? {},
    retailers: r.retailers ?? [],
    sortOrder: r.sort_order,
  }));
}

export async function upsertDemoProducts(demoId: string, products: DemoProductInput[]): Promise<void> {
  const rows = products.map((p, i) => ({
    demo_id: demoId,
    external_id: p.externalId,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    currency: p.currency,
    description: p.description,
    short_description: p.shortDescription,
    image_url: p.imageUrl,
    images: p.images,
    rating: p.rating,
    review_count: p.reviewCount,
    in_stock: p.inStock,
    attributes: p.attributes,
    retailers: p.retailers,
    sort_order: p.sortOrder ?? i,
  }));
  // Replace all products for this demo
  const sb = getSupabase();
  await sb.from('demo_products').delete().eq('demo_id', demoId);
  if (rows.length > 0) {
    const { error } = await sb.from('demo_products').insert(rows);
    if (error) throw error;
  }
}

// ─── Personas ───────────────────────────────────────────────────────

export async function getDemoPersonas(demoId: string): Promise<DemoPersona[]> {
  const { data, error } = await getSupabase()
    .from('demo_personas')
    .select('*')
    .eq('demo_id', demoId)
    .order('sort_order');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    demoId: r.demo_id,
    personaKey: r.persona_key,
    label: r.label,
    subtitle: r.subtitle,
    traits: r.traits ?? [],
    profile: r.profile ?? {},
    sortOrder: r.sort_order,
  }));
}

export async function upsertDemoPersonas(demoId: string, personas: DemoPersonaInput[]): Promise<void> {
  const rows = personas.map((p, i) => ({
    demo_id: demoId,
    persona_key: p.personaKey,
    label: p.label,
    subtitle: p.subtitle,
    traits: p.traits,
    profile: p.profile,
    sort_order: p.sortOrder ?? i,
  }));
  const sb = getSupabase();
  await sb.from('demo_personas').delete().eq('demo_id', demoId);
  if (rows.length > 0) {
    const { error } = await sb.from('demo_personas').insert(rows);
    if (error) throw error;
  }
}

// ─── Campaigns ──────────────────────────────────────────────────────

export async function getDemoCampaigns(demoId: string): Promise<DemoCampaign[]> {
  const { data, error } = await getSupabase()
    .from('demo_campaigns')
    .select('*')
    .eq('demo_id', demoId)
    .order('sort_order');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    demoId: r.demo_id,
    campaignKey: r.campaign_key,
    platform: r.platform,
    headline: r.headline,
    description: r.description,
    creativeType: r.creative_type,
    gradientFrom: r.gradient_from,
    gradientTo: r.gradient_to,
    productImage: r.product_image,
    campaignName: r.campaign_name,
    campaignTheme: r.campaign_theme,
    utmParams: r.utm_params ?? {},
    audienceSegment: r.audience_segment ?? {},
    targetingStrategy: r.targeting_strategy,
    inferredInterests: r.inferred_interests ?? [],
    inferredIntentSignals: r.inferred_intent_signals ?? [],
    sortOrder: r.sort_order,
  }));
}

// ─── Deploy Steps ───────────────────────────────────────────────────

export async function getDeploySteps(demoId: string): Promise<DeployStep[]> {
  const { data, error } = await getSupabase()
    .from('demo_deploys')
    .select('*')
    .eq('demo_id', demoId)
    .order('started_at');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    demoId: r.demo_id,
    action: r.action,
    status: r.status,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    log: r.log,
    error: r.error,
  }));
}

// ─── Defaults ───────────────────────────────────────────────────────

function defaultTheme() {
  return {
    primaryColor: '#1a1a2e',
    accentColor: '#e94560',
    backgroundColor: '#0f0f23',
    textColor: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
  };
}

function defaultFlags() {
  return {
    useMockData: true,
    enableGenerativeBackgrounds: false,
    enableProductTransparency: true,
    enableSkinAdvisor: false,
    // Reusable primitives default off — each demo opts in explicitly
    // from the admin Custom Features section.
    enableImmersiveLayout: false,
    leadScoreCard: false,
    frequentlyBoughtReminder: false,
    cartOptimizer: false,
    loyaltyEnrollPrompt: false,
  };
}
