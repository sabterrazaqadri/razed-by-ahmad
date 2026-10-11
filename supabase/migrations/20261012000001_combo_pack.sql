-- Combo pack: all three extraits (7°, On My Way, Scent Me to Sleep — Rs 7,500
-- separately) for Rs 6,000 with free delivery. Image is served from /public.
-- Already applied to production on 2026-10-12; safe to re-run.

with p as (
  insert into public.products (slug, name, tagline, description, notes_top, notes_heart, notes_base, family, badge, bottle_variant, images, is_active, is_featured, sort_order)
  values ('combo-pack', 'The Combo Pack',
    'All three extraits — 7°, On My Way and Scent Me to Sleep — worth Rs 7,500, for Rs 6,000 with free delivery.',
    E'The whole collection in one box: 7° (50 ml), On My Way (50 ml) and Scent Me to Sleep (50 ml).\n\nBought separately they come to Rs 7,500. Together they are Rs 6,000, and delivery is free.',
    '{"7°"}', '{"On My Way"}', '{"Scent Me to Sleep"}', null, 'Combo offer', 'a', '{/Collection.png}', true, false, 1)
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, size_ml, price, compare_at_price, stock, is_default)
select id, 150, 6000, 7500, 100, true from p;
