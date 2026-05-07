-- 004_tachibana_wave1_imagery.sql
-- Point the first five Tachibana product rows at the wave-1 hero images
-- shipped under public/assets/tachibana/. The LuxuryPlate component
-- already prefers `image_url` over the gradient fallback, so these
-- pieces flip from gradient placeholders to real photography the moment
-- the next deploy lands.
--
-- Idempotent: re-running this is safe because the URLs are deterministic
-- and the WHERE clause matches by name.

update demo_products dp
   set image_url = '/assets/tachibana/' || lower(
        regexp_replace(
          translate(dp.name, 'è', 'e'),  -- "Minaudière" → "Minaudiere"
          '[^a-zA-Z0-9]+', '-', 'g'
        )
       ) || '-hero.png'
  from demos d
 where dp.demo_id = d.id
   and d.slug    = 'tachibana'
   and dp.name in (
     'Kiri Tote',
     'Sumi Briefcase',
     'Tachibana Voyage',
     'Hana Minaudière',
     'Tachibana Crest Signet'
   );

-- Sanity: print what landed.
do $$
declare
  rec record;
begin
  for rec in
    select dp.name, dp.image_url
      from demo_products dp
      join demos d on d.id = dp.demo_id
     where d.slug = 'tachibana'
       and dp.name in (
         'Kiri Tote', 'Sumi Briefcase', 'Tachibana Voyage',
         'Hana Minaudière', 'Tachibana Crest Signet'
       )
     order by dp.name
  loop
    raise notice '% → %', rec.name, rec.image_url;
  end loop;
end$$;
