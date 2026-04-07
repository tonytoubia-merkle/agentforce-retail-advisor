-- Demo Builder Schema
-- Runs inside the existing demo-combobulator Supabase instance.
-- Leverages existing: public.users (id, email, name)
-- No table name conflicts with: projects, recordings, voices

-- ─── Core demo registry ─────────────────────────────────────────────
create table if not exists demos (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,              -- subdomain: {slug}.demo-combobulator.com
  name          text not null,                     -- display name: "Gucci US Demo"
  vertical      text not null default 'beauty',    -- beauty | fashion | wellness | cpg
  status        text not null default 'draft',     -- draft | deploying | live | archived | error

  -- Owner — FK to existing users table
  owner_id      uuid references public.users(id),
  owner_email   text not null,                     -- denormalized for quick display

  -- Optional link to combobulator projects table
  project_id    uuid references public.projects(id),

  -- Brand identity
  brand_name    text not null,                     -- "Gucci", "Lush", etc.
  brand_tagline text,
  logo_url      text,
  favicon_url   text,

  -- Theme (CSS custom properties)
  theme         jsonb not null default '{
    "primaryColor": "#1a1a2e",
    "accentColor": "#e94560",
    "backgroundColor": "#0f0f23",
    "textColor": "#ffffff",
    "fontFamily": "Inter, system-ui, sans-serif"
  }'::jsonb,

  -- Salesforce org connection
  sf_instance_url   text,                          -- https://xxx.my.salesforce.com
  sf_org_id         text,
  sf_client_id      text,
  sf_client_secret  text,
  sf_agent_id       text,                          -- beauty concierge agent ID
  sf_skin_agent_id  text,                          -- skin concierge agent ID (optional)

  -- External service keys (per-demo overrides; falls back to platform defaults)
  image_provider    text default 'none',           -- imagen | firefly | cms-only | none
  imagen_api_key    text,
  firefly_client_id text,
  firefly_secret    text,

  -- Data Cloud
  datacloud_base_url    text,
  datacloud_token       text,

  -- Commerce Cloud
  commerce_base_url     text,
  commerce_client_id    text,
  commerce_site_id      text,
  commerce_token        text,

  -- Feature flags
  feature_flags   jsonb not null default '{
    "useMockData": true,
    "enableGenerativeBackgrounds": false,
    "enableProductTransparency": true,
    "enableSkinAdvisor": false
  }'::jsonb,

  -- Template source — which golden template repo/branch this was forked from
  template_repo   text default 'agentforce-retail-advisor',
  template_branch text default 'main',

  -- Deployment metadata
  vercel_project_id  text,
  vercel_domain      text,
  deployed_at        timestamptz,
  deploy_log         text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Products per demo ──────────────────────────────────────────────
create table if not exists demo_products (
  id            uuid primary key default gen_random_uuid(),
  demo_id       uuid not null references demos(id) on delete cascade,
  external_id   text,                              -- original product ID for mapping
  name          text not null,
  brand         text not null,
  category      text not null,
  price         numeric(10,2) not null,
  currency      text not null default 'USD',
  description   text,
  short_description text,
  image_url     text,
  images        text[] default '{}',
  rating        numeric(2,1) default 4.5,
  review_count  integer default 0,
  in_stock      boolean default true,
  -- Attributes stored as JSONB for flexibility across verticals
  attributes    jsonb not null default '{}'::jsonb,
  -- Retailers for where-to-buy flow
  retailers     jsonb default '[]'::jsonb,
  sort_order    integer default 0,
  created_at    timestamptz not null default now()
);

create index idx_demo_products_demo on demo_products(demo_id);

-- ─── Customer personas per demo ─────────────────────────────────────
create table if not exists demo_personas (
  id            uuid primary key default gen_random_uuid(),
  demo_id       uuid not null references demos(id) on delete cascade,
  persona_key   text not null,                     -- "sarah", "james", etc.
  label         text not null,                     -- "Sarah Chen"
  subtitle      text,                              -- "Loyal Gold Member"
  traits        text[] default '{}',               -- ["sensitive skin", "fragrance-free"]
  -- Full profile as JSONB (matches CustomerProfile shape)
  profile       jsonb not null default '{}'::jsonb,
  sort_order    integer default 0,
  created_at    timestamptz not null default now(),
  unique(demo_id, persona_key)
);

create index idx_demo_personas_demo on demo_personas(demo_id);

-- ─── Campaign / ad creatives per demo ───────────────────────────────
create table if not exists demo_campaigns (
  id            uuid primary key default gen_random_uuid(),
  demo_id       uuid not null references demos(id) on delete cascade,
  campaign_key  text not null,
  platform      text not null,                     -- instagram, youtube, etc.
  headline      text not null,
  description   text,
  creative_type text default 'static-image',
  gradient_from text,
  gradient_to   text,
  product_image text,
  campaign_name text not null,
  campaign_theme text,
  utm_params    jsonb not null default '{}'::jsonb,
  audience_segment jsonb default '{}'::jsonb,
  targeting_strategy text,
  inferred_interests text[] default '{}',
  inferred_intent_signals text[] default '{}',
  sort_order    integer default 0,
  created_at    timestamptz not null default now(),
  unique(demo_id, campaign_key)
);

create index idx_demo_campaigns_demo on demo_campaigns(demo_id);

-- ─── Brand assets (logos, heroes, backgrounds, product images) ──────
create table if not exists demo_assets (
  id            uuid primary key default gen_random_uuid(),
  demo_id       uuid not null references demos(id) on delete cascade,
  asset_type    text not null,                     -- logo | favicon | hero | background | product
  asset_key     text not null,                     -- unique key within type: "hero-clean-botanicals"
  url           text not null,                     -- Supabase Storage URL or external CDN
  alt_text      text,
  metadata      jsonb default '{}'::jsonb,         -- width, height, tags, etc.
  created_at    timestamptz not null default now(),
  unique(demo_id, asset_type, asset_key)
);

create index idx_demo_assets_demo on demo_assets(demo_id);

-- ─── Agent prompt overrides per demo ────────────────────────────────
create table if not exists demo_prompt_overrides (
  id            uuid primary key default gen_random_uuid(),
  demo_id       uuid not null references demos(id) on delete cascade,
  template_name text not null,                     -- e.g. "Product_Card_UI_Directive"
  variables     jsonb not null default '{}'::jsonb, -- key-value pairs for template substitution
  content_override text,                           -- full content override (optional)
  created_at    timestamptz not null default now(),
  unique(demo_id, template_name)
);

create index idx_demo_prompts_demo on demo_prompt_overrides(demo_id);

-- ─── Deploy history / audit log ─────────────────────────────────────
create table if not exists demo_deploys (
  id            uuid primary key default gen_random_uuid(),
  demo_id       uuid not null references demos(id) on delete cascade,
  action        text not null,                     -- create_org | deploy_metadata | seed_data | configure_vercel
  status        text not null default 'pending',   -- pending | running | success | failed
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  log           text,
  error         text
);

create index idx_demo_deploys_demo on demo_deploys(demo_id);

-- ─── RLS policies ───────────────────────────────────────────────────
-- Uses the existing users table for ownership. For now, permissive
-- policies since this is an internal tool. Tighten later with
-- auth.uid() checks if needed.
alter table demos enable row level security;
alter table demo_products enable row level security;
alter table demo_personas enable row level security;
alter table demo_campaigns enable row level security;
alter table demo_assets enable row level security;
alter table demo_prompt_overrides enable row level security;
alter table demo_deploys enable row level security;

-- Anon + authenticated access (internal tool — all logged-in users can manage demos)
create policy "Authenticated full access" on demos for all using (true) with check (true);
create policy "Authenticated full access" on demo_products for all using (true) with check (true);
create policy "Authenticated full access" on demo_personas for all using (true) with check (true);
create policy "Authenticated full access" on demo_campaigns for all using (true) with check (true);
create policy "Authenticated full access" on demo_assets for all using (true) with check (true);
create policy "Authenticated full access" on demo_prompt_overrides for all using (true) with check (true);
create policy "Authenticated full access" on demo_deploys for all using (true) with check (true);

-- ─── Updated_at trigger ─────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger demos_updated_at
  before update on demos
  for each row execute function update_updated_at();
