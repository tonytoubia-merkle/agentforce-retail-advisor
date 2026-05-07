-- 005_tachibana_wave2_imagery.sql
-- Wave 2 imagery — 26 additional hero shots produced by Imagen 4. Together
-- with migration 004 (5 wave-1 pieces) this puts photographic heroes on
-- 31 of 34 catalog rows. The remaining three (Tachibana Voyage 24h,
-- Mizuhiki Bracelet, Kuwa-cha A5 Notebook) bounced off Imagen's content
-- filter on the first run; they keep the gradient placeholder until a
-- targeted re-run lands their PNGs.
--
-- Idempotent: same slug derivation as 004, deterministic outputs, safe
-- to re-run.

update demo_products dp
   set image_url = '/assets/tachibana/' || lower(
        regexp_replace(
          translate(dp.name, 'è', 'e'),  -- "Minaudière" → "Minaudiere" (handled in 004; harmless here)
          '[^a-zA-Z0-9]+', '-', 'g'
        )
       ) || '-hero.png'
  from demos d
 where dp.demo_id = d.id
   and d.slug    = 'tachibana'
   and dp.name in (
     -- Leather goods (11)
     'Kiri Tote Mini',
     'Sumi Slim Folio',
     'Hana Mini',
     'Hana Tote',
     'Camellia Backpack',
     'Sumi Card Case',
     'Sumi Bifold Wallet',
     'Kuwa-cha Long Wallet',
     'Kuwa-cha Belt 35mm',
     'Hisashi Document Folio',
     'Edo Pen Roll',
     -- Jewelry (6)
     'Tachibana Crest Pendant',
     'Kiku Cuff',
     'Mon Stud Earrings',
     'Hana Drop Earrings',
     'Sumi Lacquer Hairpin',
     'Mon Cufflinks',
     -- Outerwear (4)
     'Kuwa-cha Travel Coat',
     'Sumi Bomber',
     'Kinari Wrap',
     'Aijiro Haori',
     -- Lifestyle (5)
     'Paulownia Stationery Box',
     'Sumi Fountain Pen',
     'Tachibana Incense Set',
     'Kinari Tea Towel Set',
     'Mon Coasters'
   );

-- Sanity print.
do $$
declare
  with_image int;
  total int;
begin
  select count(*) into total
    from demo_products dp
    join demos d on d.id = dp.demo_id
   where d.slug = 'tachibana';
  select count(*) into with_image
    from demo_products dp
    join demos d on d.id = dp.demo_id
   where d.slug = 'tachibana'
     and coalesce(dp.image_url, '') <> '';
  raise notice 'Tachibana products with hero imagery: % / %', with_image, total;
end$$;
