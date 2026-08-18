-- Little Brownie Co. — seed the current storefront catalog into Supabase.
-- Run after 0001_init.sql and 0002_products_extra.sql.
-- Safe to re-run: upserts by slug.

-- Mini Brownie Tub
with prod as (
  insert into products (slug, name, tagline, category, description, image_url, square_image_url, gallery, flavours, ingredients, best_seller, is_signature)
  values (
    'mini-brownie-tub', 'Mini Brownie Tub', 'Bite-sized fudge, packed in a kraft tub.', 'Bites', 'Our signature mini brownies packed into a kraft tub — the perfect on-the-go indulgence. Choose 6, 12 or 24 pieces.',
    'https://little-brownie-co.lovable.app/__l5e/assets-v1/f2f87756-7d8f-4adc-8498-b177ef8827fb/p20-portrait.jpg', 'https://little-brownie-co.lovable.app/__l5e/assets-v1/9c3462ef-1af0-4e66-a50a-4ae12a2095ca/p20-square.jpg',
    ARRAY['https://little-brownie-co.lovable.app/__l5e/assets-v1/f2f87756-7d8f-4adc-8498-b177ef8827fb/p20-portrait.jpg','https://little-brownie-co.lovable.app/__l5e/assets-v1/9c3462ef-1af0-4e66-a50a-4ae12a2095ca/p20-square.jpg'], ARRAY['Dark Chocolate','Nutella','Walnut'], ARRAY['Belgian dark chocolate','Cultured butter','Cane sugar','Unbleached flour','Cocoa','Sea salt'],
    true, false
  )
  on conflict (slug) do update set
    name = excluded.name, tagline = excluded.tagline, category = excluded.category,
    description = excluded.description, image_url = excluded.image_url, square_image_url = excluded.square_image_url,
    gallery = excluded.gallery, flavours = excluded.flavours, ingredients = excluded.ingredients,
    best_seller = excluded.best_seller, is_signature = excluded.is_signature
  returning id
),
del as (
  delete from product_variants where product_id = (select id from prod)
)
insert into product_variants (product_id, label, price, sort_order)
select (select id from prod), v.label, v.price, v.sort_order from (values
  ('6 pcs · Dark Chocolate', 215, 0),
  ('6 pcs · Nutella', 245, 1),
  ('6 pcs · Walnut', 265, 2),
  ('12 pcs · Dark Chocolate', 385, 3),
  ('12 pcs · Nutella', 425, 4),
  ('12 pcs · Walnut', 465, 5),
  ('24 pcs · Dark Chocolate', 665, 6),
  ('24 pcs · Nutella', 735, 7),
  ('24 pcs · Walnut', 775, 8)
) as v(label, price, sort_order);

-- Mini Brownie Tub · Assorted
with prod as (
  insert into products (slug, name, tagline, category, description, image_url, square_image_url, gallery, flavours, ingredients, best_seller, is_signature)
  values (
    'mini-brownie-tub-assorted', 'Mini Brownie Tub · Assorted', 'All three flavours in one tub.', 'Bites', 'Can''t decide? An even mix of dark chocolate, nutella and walnut minis in one tub.',
    'https://little-brownie-co.lovable.app/__l5e/assets-v1/7279dc98-9397-4a4c-a302-ea7331a8639f/p22-portrait.jpg', 'https://little-brownie-co.lovable.app/__l5e/assets-v1/d050b664-a514-4387-b6cd-6ab3b2f937b9/p22-square.jpg',
    ARRAY['https://little-brownie-co.lovable.app/__l5e/assets-v1/7279dc98-9397-4a4c-a302-ea7331a8639f/p22-portrait.jpg','https://little-brownie-co.lovable.app/__l5e/assets-v1/d050b664-a514-4387-b6cd-6ab3b2f937b9/p22-square.jpg'], ARRAY['Dark Chocolate','Nutella','Walnut'], ARRAY['Belgian dark chocolate','Nutella','Californian walnuts','Cultured butter','Cane sugar','Flour'],
    false, true
  )
  on conflict (slug) do update set
    name = excluded.name, tagline = excluded.tagline, category = excluded.category,
    description = excluded.description, image_url = excluded.image_url, square_image_url = excluded.square_image_url,
    gallery = excluded.gallery, flavours = excluded.flavours, ingredients = excluded.ingredients,
    best_seller = excluded.best_seller, is_signature = excluded.is_signature
  returning id
),
del as (
  delete from product_variants where product_id = (select id from prod)
)
insert into product_variants (product_id, label, price, sort_order)
select (select id from prod), v.label, v.price, v.sort_order from (values
  ('6 pcs · Assorted', 295, 0),
  ('12 pcs · Assorted', 475, 1),
  ('24 pcs · Assorted', 835, 2)
) as v(label, price, sort_order);

-- Mini Brownie Loaf
with prod as (
  insert into products (slug, name, tagline, category, description, image_url, square_image_url, gallery, flavours, ingredients, best_seller, is_signature)
  values (
    'mini-brownie-loaf', 'Mini Brownie Loaf', 'A boxed loaf, sliced or whole.', 'Loaves', 'A shareable mini loaf baked and boxed the same morning. Perfect for tea time or gifting.',
    'https://little-brownie-co.lovable.app/__l5e/assets-v1/a60fd20c-007f-4d2f-a2aa-a3551d0d8a74/p21-portrait.jpg', 'https://little-brownie-co.lovable.app/__l5e/assets-v1/70730e76-8a7d-44d4-b107-8657b034dba9/p21-square.jpg',
    ARRAY['https://little-brownie-co.lovable.app/__l5e/assets-v1/a60fd20c-007f-4d2f-a2aa-a3551d0d8a74/p21-portrait.jpg','https://little-brownie-co.lovable.app/__l5e/assets-v1/70730e76-8a7d-44d4-b107-8657b034dba9/p21-square.jpg'], ARRAY['Dark Chocolate','Nutella','Walnut'], ARRAY['Belgian dark chocolate','Cultured butter','Eggless batter','Vanilla','Flour'],
    true, false
  )
  on conflict (slug) do update set
    name = excluded.name, tagline = excluded.tagline, category = excluded.category,
    description = excluded.description, image_url = excluded.image_url, square_image_url = excluded.square_image_url,
    gallery = excluded.gallery, flavours = excluded.flavours, ingredients = excluded.ingredients,
    best_seller = excluded.best_seller, is_signature = excluded.is_signature
  returning id
),
del as (
  delete from product_variants where product_id = (select id from prod)
)
insert into product_variants (product_id, label, price, sort_order)
select (select id from prod), v.label, v.price, v.sort_order from (values
  ('Dark Chocolate', 355, 0),
  ('Nutella', 385, 1),
  ('Walnut', 425, 2)
) as v(label, price, sort_order);

-- Assorted Brownie Box
with prod as (
  insert into products (slug, name, tagline, category, description, image_url, square_image_url, gallery, flavours, ingredients, best_seller, is_signature)
  values (
    'assorted-brownie-box', 'Assorted Brownie Box', 'Four mini loaves, your pick of flavours.', 'Hampers', 'Four mini loaves nestled in our kraft gift box with a hand-tied ribbon — the sweetest way to say thank you.',
    'https://little-brownie-co.lovable.app/__l5e/assets-v1/2bb233fb-df09-40d8-bb29-06330bc7f4bb/p23-portrait.jpg', 'https://little-brownie-co.lovable.app/__l5e/assets-v1/0a4100c5-e98a-4f54-b7ba-9a7fd40b6cbb/p23-square.jpg',
    ARRAY['https://little-brownie-co.lovable.app/__l5e/assets-v1/2bb233fb-df09-40d8-bb29-06330bc7f4bb/p23-portrait.jpg','https://little-brownie-co.lovable.app/__l5e/assets-v1/0a4100c5-e98a-4f54-b7ba-9a7fd40b6cbb/p23-square.jpg'], ARRAY['Dark Chocolate','Nutella','Walnut'], ARRAY['Belgian dark chocolate','Nutella','Walnuts','Cultured butter','Flour','Kraft gift box'],
    false, false
  )
  on conflict (slug) do update set
    name = excluded.name, tagline = excluded.tagline, category = excluded.category,
    description = excluded.description, image_url = excluded.image_url, square_image_url = excluded.square_image_url,
    gallery = excluded.gallery, flavours = excluded.flavours, ingredients = excluded.ingredients,
    best_seller = excluded.best_seller, is_signature = excluded.is_signature
  returning id
),
del as (
  delete from product_variants where product_id = (select id from prod)
)
insert into product_variants (product_id, label, price, sort_order)
select (select id from prod), v.label, v.price, v.sort_order from (values
  ('Dark + Nutella', 385, 0),
  ('Dark + Walnut', 415, 1),
  ('Nutella + Walnut', 435, 2),
  ('All Three Flavours', 585, 3)
) as v(label, price, sort_order);

-- The Little Brownie Box
with prod as (
  insert into products (slug, name, tagline, category, description, image_url, square_image_url, gallery, flavours, ingredients, best_seller, is_signature)
  values (
    'the-little-brownie-box', 'The Little Brownie Box', 'Nine hand-cut squares of pure fudge.', 'Signature', 'Our classic fudge squares, hand-cut and boxed. Crackled on top, molten in the middle.',
    'https://little-brownie-co.lovable.app/__l5e/assets-v1/9fb627a3-dd5a-4170-a030-fb27c8224379/p24-portrait.jpg', 'https://little-brownie-co.lovable.app/__l5e/assets-v1/a0cda977-9c8e-4666-8076-fcd34af22ee4/p24-square.jpg',
    ARRAY['https://little-brownie-co.lovable.app/__l5e/assets-v1/9fb627a3-dd5a-4170-a030-fb27c8224379/p24-portrait.jpg','https://little-brownie-co.lovable.app/__l5e/assets-v1/a0cda977-9c8e-4666-8076-fcd34af22ee4/p24-square.jpg'], ARRAY['Dark Chocolate','Nutella'], ARRAY['Belgian dark chocolate','Cultured butter','Cane sugar','Flour','Sea salt'],
    false, true
  )
  on conflict (slug) do update set
    name = excluded.name, tagline = excluded.tagline, category = excluded.category,
    description = excluded.description, image_url = excluded.image_url, square_image_url = excluded.square_image_url,
    gallery = excluded.gallery, flavours = excluded.flavours, ingredients = excluded.ingredients,
    best_seller = excluded.best_seller, is_signature = excluded.is_signature
  returning id
),
del as (
  delete from product_variants where product_id = (select id from prod)
)
insert into product_variants (product_id, label, price, sort_order)
select (select id from prod), v.label, v.price, v.sort_order from (values
  ('Dark Chocolate', 355, 0),
  ('Nutella', 395, 1)
) as v(label, price, sort_order);

-- Brownie Slab
with prod as (
  insert into products (slug, name, tagline, category, description, image_url, square_image_url, gallery, flavours, ingredients, best_seller, is_signature)
  values (
    'brownie-slab', 'Brownie Slab', 'One big slab. Cut it your way.', 'Signature', 'An uncut brownie slab for parties and platters — slice it into as many squares as you like.',
    'https://little-brownie-co.lovable.app/__l5e/assets-v1/a921eb7a-d262-428f-9c67-8a157784e7b7/p25-portrait.jpg', 'https://little-brownie-co.lovable.app/__l5e/assets-v1/e148bada-6c80-4384-be82-a48a22674002/p25-square.jpg',
    ARRAY['https://little-brownie-co.lovable.app/__l5e/assets-v1/a921eb7a-d262-428f-9c67-8a157784e7b7/p25-portrait.jpg','https://little-brownie-co.lovable.app/__l5e/assets-v1/e148bada-6c80-4384-be82-a48a22674002/p25-square.jpg'], ARRAY['Dark Chocolate','Nutella'], ARRAY['Belgian dark chocolate','Cultured butter','Cane sugar','Flour','Cocoa'],
    false, true
  )
  on conflict (slug) do update set
    name = excluded.name, tagline = excluded.tagline, category = excluded.category,
    description = excluded.description, image_url = excluded.image_url, square_image_url = excluded.square_image_url,
    gallery = excluded.gallery, flavours = excluded.flavours, ingredients = excluded.ingredients,
    best_seller = excluded.best_seller, is_signature = excluded.is_signature
  returning id
),
del as (
  delete from product_variants where product_id = (select id from prod)
)
insert into product_variants (product_id, label, price, sort_order)
select (select id from prod), v.label, v.price, v.sort_order from (values
  ('Dark Chocolate', 585, 0),
  ('Nutella', 665, 1)
) as v(label, price, sort_order);

-- Choco Lava Cake
with prod as (
  insert into products (slug, name, tagline, category, description, image_url, square_image_url, gallery, flavours, ingredients, best_seller, is_signature)
  values (
    'choco-lava-cake', 'Choco Lava Cake', 'Molten centre, heart-shaped tin.', 'Cakes', 'Baked to order in a heart tin and delivered warm-ready — warm for 20 seconds and the centre flows.',
    'https://little-brownie-co.lovable.app/__l5e/assets-v1/65ecc123-5950-4a55-b38e-3320c54a1cca/p26-portrait.jpg', 'https://little-brownie-co.lovable.app/__l5e/assets-v1/8b62b807-87ff-44c5-aca6-5cb916d938bb/p26-square.jpg',
    ARRAY['https://little-brownie-co.lovable.app/__l5e/assets-v1/65ecc123-5950-4a55-b38e-3320c54a1cca/p26-portrait.jpg','https://little-brownie-co.lovable.app/__l5e/assets-v1/8b62b807-87ff-44c5-aca6-5cb916d938bb/p26-square.jpg'], ARRAY['Dark Chocolate','Nutella'], ARRAY['Belgian dark chocolate','Cultured butter','Cocoa','Flour','Vanilla'],
    false, false
  )
  on conflict (slug) do update set
    name = excluded.name, tagline = excluded.tagline, category = excluded.category,
    description = excluded.description, image_url = excluded.image_url, square_image_url = excluded.square_image_url,
    gallery = excluded.gallery, flavours = excluded.flavours, ingredients = excluded.ingredients,
    best_seller = excluded.best_seller, is_signature = excluded.is_signature
  returning id
),
del as (
  delete from product_variants where product_id = (select id from prod)
)
insert into product_variants (product_id, label, price, sort_order)
select (select id from prod), v.label, v.price, v.sort_order from (values
  ('Dark Chocolate', 195, 0),
  ('Nutella', 225, 1)
) as v(label, price, sort_order);

-- Brownie Cake · Loaded Chocolate
with prod as (
  insert into products (slug, name, tagline, category, description, image_url, square_image_url, gallery, flavours, ingredients, best_seller, is_signature)
  values (
    'brownie-cake', 'Brownie Cake · Loaded Chocolate', 'Because birthdays deserve brownie, not cake.', 'Cakes', 'A celebration centrepiece — layered brownie cake finished with ganache, truffles and chocolate bark. Add a topper for ₹10.',
    'https://little-brownie-co.lovable.app/__l5e/assets-v1/3f3b4338-3037-4473-a012-db23f01ab17c/p27-portrait.jpg', 'https://little-brownie-co.lovable.app/__l5e/assets-v1/6f7eaa31-dc78-40aa-ab9c-330672745036/p27-square.jpg',
    ARRAY['https://little-brownie-co.lovable.app/__l5e/assets-v1/3f3b4338-3037-4473-a012-db23f01ab17c/p27-portrait.jpg','https://little-brownie-co.lovable.app/__l5e/assets-v1/6f7eaa31-dc78-40aa-ab9c-330672745036/p27-square.jpg'], ARRAY['Loaded Chocolate','Truffle'], ARRAY['Brownie sponge','Chocolate ganache','Truffles','Chocolate bars'],
    true, false
  )
  on conflict (slug) do update set
    name = excluded.name, tagline = excluded.tagline, category = excluded.category,
    description = excluded.description, image_url = excluded.image_url, square_image_url = excluded.square_image_url,
    gallery = excluded.gallery, flavours = excluded.flavours, ingredients = excluded.ingredients,
    best_seller = excluded.best_seller, is_signature = excluded.is_signature
  returning id
),
del as (
  delete from product_variants where product_id = (select id from prod)
)
insert into product_variants (product_id, label, price, sort_order)
select (select id from prod), v.label, v.price, v.sort_order from (values
  ('250g Bento', 425, 0),
  ('500g', 755, 1),
  ('1 kg', 1450, 2)
) as v(label, price, sort_order);

-- Signature Dips
with prod as (
  insert into products (slug, name, tagline, category, description, image_url, square_image_url, gallery, flavours, ingredients, best_seller, is_signature)
  values (
    'signature-dips', 'Signature Dips', 'Pourable chocolate, for the extra bit.', 'Add-ons', 'A little pot of warm, pourable chocolate to go with any brownie order.',
    'https://little-brownie-co.lovable.app/__l5e/assets-v1/2c6b0536-206d-4ba6-9577-064a7134a6fc/p28-portrait.jpg', 'https://little-brownie-co.lovable.app/__l5e/assets-v1/51a61472-40e7-41f4-9fbb-689133ebc7a8/p28-square.jpg',
    ARRAY['https://little-brownie-co.lovable.app/__l5e/assets-v1/2c6b0536-206d-4ba6-9577-064a7134a6fc/p28-portrait.jpg','https://little-brownie-co.lovable.app/__l5e/assets-v1/51a61472-40e7-41f4-9fbb-689133ebc7a8/p28-square.jpg'], ARRAY['Dark Chocolate','Nutella'], ARRAY['Belgian couverture','Fresh cream','Nutella'],
    false, false
  )
  on conflict (slug) do update set
    name = excluded.name, tagline = excluded.tagline, category = excluded.category,
    description = excluded.description, image_url = excluded.image_url, square_image_url = excluded.square_image_url,
    gallery = excluded.gallery, flavours = excluded.flavours, ingredients = excluded.ingredients,
    best_seller = excluded.best_seller, is_signature = excluded.is_signature
  returning id
),
del as (
  delete from product_variants where product_id = (select id from prod)
)
insert into product_variants (product_id, label, price, sort_order)
select (select id from prod), v.label, v.price, v.sort_order from (values
  ('Dark Chocolate Dip', 25, 0),
  ('Nutella Dip', 35, 1)
) as v(label, price, sort_order);
