-- Seed data matching the approved prototype. Safe to re-run: it only inserts
-- rows that are missing.

insert into public.site_settings
  (id, whatsapp_number, free_delivery_day, spinner_day, spinner_enabled,
   announcement_text, hero_headline, hero_sub, currency, about_text)
values (
  1, '923323426801', 1, 6, true,
  'Every Monday ships free — the courier is on us',
  E'What stays\nafter the *fire*',
  'Six extraits built from smoke, resin and oud — the notes that keep working long after the top has burned off. Blended in batches of fifty, bottled by hand.',
  'PKR',
  E'The house began with a single accord that would not settle — oud over burnt saffron, too heavy for anything on the shelf. Six years later it is Oud Noir, and everything else in the collection was built to sit beside it.\n\nNothing leaves the studio until it has been worn for a full day by the person who made it.'
)
on conflict (id) do nothing;

with p as (
  insert into public.products
    (slug, name, tagline, description, notes_top, notes_heart, notes_base,
     family, badge, bottle_variant, is_featured, sort_order)
  values
    ('oud-noir', 'Oud Noir',
     'Burnt saffron over Laotian oud, cut with Taif rose so it reads warm rather than medicinal. The heaviest thing the house makes.',
     'Oud Noir is where the house started: a single accord of Laotian oud and saffron that refused to settle. Taif rose and cade keep it from turning medicinal; birch tar and labdanum carry it well into the next morning. Wear it in the evening, and sparingly.',
     '{Saffron,"Pink pepper",Bergamot}', '{"Taif rose",Cade,"Tobacco leaf"}', '{"Laotian oud","Birch tar",Labdanum}',
     'oud', 'Best seller', 'a', true, 10),
    ('amber-dusk', 'Amber Dusk',
     'Labdanum and benzoin warmed through with tonka. Resinous and soft — the one people ask about across a room.',
     'A slow amber built on Spanish labdanum and Siamese benzoin. Tonka and vanilla round the edges; a thread of clove keeps it from going sweet. Close to the skin after the first hour, and it stays there.',
     '{Labdanum,Mandarin,Cardamom}', '{Benzoin,Cistus,Clove}', '{Tonka,Vanilla,Sandalwood}',
     'amber', null, 'b', true, 20),
    ('taif-rose', 'Taif Rose',
     'Rose from the Taif highlands over geranium and a dry patchouli base. A rose for people who do not wear rose.',
     'Taif rose absolute, pressed in small harvests, sits over geranium and pink pepper. Patchouli and a trace of oud keep it dry and grown-up rather than powdery.',
     '{Rose,"Pink pepper",Lychee}', '{Geranium,"Taif rose absolute",Saffron}', '{Patchouli,Oud,Musk}',
     'floral', null, 'c', true, 30),
    ('smoke-and-salt', 'Smoke & Salt',
     'Ambergris and sea salt over vetiver and cade. A coastline after a fire.',
     'A mineral, smoky extrait: ambergris and sea salt up top, vetiver and incense in the heart, and cade and birch tar underneath. Dry, clean, and quietly loud.',
     '{Ambergris,"Sea salt",Elemi}', '{Vetiver,Incense,Cypress}', '{Cade,"Birch tar",Driftwood}',
     'smoke', 'New', 'c', false, 40),
    ('musk-blanc', 'Musk Blanc',
     'White musk, iris and clean cotton. The lightest extrait in the house, and the most worn.',
     'White musks layered over orris butter and heliotrope, finished with cashmeran. Skin-close and clean — made for daytime and for people who dislike perfume.',
     '{"White musk",Aldehydes,Pear}', '{Iris,"Orris butter",Heliotrope}', '{Cotton,Cashmeran,Sandalwood}',
     'musk', null, 'b', false, 50),
    ('zaffran', 'Zaffran',
     'Saffron and soft leather over dates and amber. Rich, a little sweet, entirely unapologetic.',
     'Kashmiri saffron and cardamom open onto a supple leather accord. Medjool dates, oud and amber carry the base. Made in the smallest batches of the collection.',
     '{Saffron,Cardamom,Nutmeg}', '{Leather,Rose,Cumin}', '{Dates,Oud,Amber}',
     'oud', 'Low stock', 'a', false, 60)
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.product_variants (product_id, size_ml, price, stock, is_default)
select p.id, v.size_ml, v.price, v.stock, v.size_ml = 50
from p
join (values
  ('oud-noir',        30,  7900, 20), ('oud-noir',        50, 11500, 30), ('oud-noir',        100, 19400, 12),
  ('amber-dusk',      30,  6100, 20), ('amber-dusk',      50,  8900, 30), ('amber-dusk',      100, 15000, 12),
  ('taif-rose',       30,  6700, 20), ('taif-rose',       50,  9750, 30), ('taif-rose',       100, 16450, 12),
  ('smoke-and-salt',  30,  7000, 20), ('smoke-and-salt',  50, 10200, 30), ('smoke-and-salt',  100, 17200, 12),
  ('musk-blanc',      30,  5100, 20), ('musk-blanc',      50,  7400, 30), ('musk-blanc',      100, 12500, 12),
  ('zaffran',         30,  8450,  3), ('zaffran',         50, 12300,  4), ('zaffran',         100, 20750,  2)
) as v(slug, size_ml, price, stock) on v.slug = p.slug;

insert into public.spin_prizes (label, short_label, weight, is_active, sort_order)
select * from (values
  ('10% off your next order',      '10% OFF',       4, true, 1),
  ('Free 10 ml travel vial',       'FREE VIAL',     1, true, 2),
  ('Free delivery on this order',  'FREE DELIVERY', 3, true, 3),
  ('Better luck next time',    'TRY AGAIN',     4, true, 4),
  ('15% off your next order',      '15% OFF',       2, true, 5),
  ('Signature gift box',           'GIFT BOX',      1, true, 6),
  ('5% off your next order',       '5% OFF',        5, true, 7),
  ('Mystery 5 ml sample',          'MYSTERY VIAL',  2, true, 8)
) as t(label, short_label, weight, is_active, sort_order)
where not exists (select 1 from public.spin_prizes);
