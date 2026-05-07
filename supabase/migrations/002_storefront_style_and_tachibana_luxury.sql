-- 002_storefront_style_and_tachibana_luxury.sql
-- Adds the `storefront_style` column to the demos table so a demo can opt
-- into the editorial Kyoto-house storefront variant (Tachibana). Then
-- updates the existing Tachibana row (slug = 'tachibana') and patches the
-- per-product `attributes` JSONB so the luxury components render the
-- master craftsperson, material origin, lot, and Japanese name fields.
--
-- Default storefronts are unaffected: the column defaults to 'default',
-- and any demo without an explicit override renders as before.

-- ─── 1. Schema change ───────────────────────────────────────────────
alter table demos
  add column if not exists storefront_style text not null default 'default';

comment on column demos.storefront_style is
  'Visual variant for the SPA. ''default'' is the universal Tailwind grid layout; '
  '''luxury_maison'' is the editorial Kyoto-house variant (Tachibana). Both '
  'share the same data layer, contexts, Salesforce/Merkury/Data Cloud wiring.';

-- ─── 2. Tachibana opt-in ───────────────────────────────────────────
update demos
   set storefront_style = 'luxury_maison'
 where slug = 'tachibana';

-- ─── 3. Patch product attributes with luxury sub-shape ─────────────
-- Tachibana products were seeded under the fashion vertical with the
-- existing schema. Here we shim a `luxury` block onto each product so
-- the LuxuryHome / LuxuryCategoryPage / LuxuryProductDetailPage / Cart
-- can read master + material + tannery + jpName + lot.
--
-- This is keyed by product NAME, which is the most stable identifier
-- across re-seeds. If a name doesn't match, the row is left alone
-- (the components fall back to product.brand / product.category).

with tachibana as (
  select id from demos where slug = 'tachibana' limit 1
),
luxury_seeds(name, master, material, tannery, jp_name, lot) as (
  values
    ('Kiri Tote',         'Hideo Mori',          'Kuwa-cha',  'Pisa',   '桐 トート',   '橘-2024-K-0089'),
    ('Sumi Briefcase',    'Akiko Tanaka',        'Sumi',      'Pisa',   '墨',          '橘-2022-S-0421'),
    ('Tachibana Voyage',  'Junji Okada',         'Kuwa-cha',  'Pisa',   '橘 旅',       '橘-2026-V-0017'),
    ('Hana Minaudière',   'Yuki Sato',           'Sumi',      'Lucca',  '花',          '橘-2023-H-0204'),
    ('Hana Mini',         'Yuki Sato',           'Akakuchiba','Lucca',  '花 ミニ',     '橘-2024-H-0312'),
    ('Tachibana Crest',   'Marco Bianchi',       '18k Japanese gold', 'Vicenza', '橘 紋', '橘-2023-C-0061'),
    ('Sumi Card Case',    'Hideo Mori',          'Sumi',      'Pisa',   '墨 札',       '橘-2021-S-1109')
)
update demo_products dp
   set attributes = coalesce(dp.attributes, '{}'::jsonb) || jsonb_build_object(
       'luxury', jsonb_build_object(
         'master',   ls.master,
         'material', ls.material,
         'tannery',  ls.tannery,
         'jpName',   ls.jp_name,
         'lot',      ls.lot
       )
     )
  from luxury_seeds ls, tachibana t
 where dp.demo_id = t.id
   and dp.name = ls.name;
