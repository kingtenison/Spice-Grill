-- Insert categories for homepage menu items
INSERT INTO public.categories (name, slug, image_url) VALUES
('Mains', 'mains', '/Fried Yam and Fish.jpg'),
('Signature', 'signature', '/Pounded _Yam and Egusi.jpg'),
('Drinks', 'drinks', '/Mango_Drink.jpg')
ON CONFLICT (slug) DO NOTHING;

-- Get category IDs for insertion
DO $$
DECLARE
    mains_id uuid;
    signature_id uuid;
    drinks_id uuid;
BEGIN
    SELECT id INTO mains_id FROM public.categories WHERE slug = 'mains' LIMIT 1;
    SELECT id INTO signature_id FROM public.categories WHERE slug = 'signature' LIMIT 1;
    SELECT id INTO drinks_id FROM public.categories WHERE slug = 'drinks' LIMIT 1;

    -- Insert menu items from homepage
    INSERT INTO public.menu_items (category_id, name, description, price, image_url, is_available, stock_quantity) VALUES
    (mains_id, 'Fried Yam & Fish', 'Golden, crispy yam slices paired with perfectly seasoned fried fish. A beloved West African classic that crunchs with every bite.', 14, '/Fried Yam and Fish.jpg', true, 50),
    (mains_id, 'Fried Chicken', 'Juicy, succulent chicken coated in our secret spice blend and fried to golden perfection. Crispy outside, tender inside.', 12, '/Fried_chicken.jpg', true, 50),
    (mains_id, 'Fried Rice', 'Wok-tossed rice with aromatic spices, fresh vegetables, and your choice of protein. A fiery, satisfying plate that hits every note.', 13, '/Fried_Rice.png', true, 50),
    (signature_id, 'Pounded Yam & Egusi Soup', 'Smooth, pillowy pounded yam served with rich, melon seed-based egusi soup. A timeless Nigerian delicacy done right.', 16, '/Pounded _Yam and Egusi.jpg', true, 30),
    (signature_id, 'Waakye', 'Fragrant rice and beans cooked together with millet leaves, served with gari, spaghetti, and your favorite protein. The ultimate comfort plate.', 15, '/Waakye.jpg', true, 30),
    (signature_id, 'Grilled Tilapia', 'Whole tilapia grilled over open flame with our signature pepper sauce. Smoky, spicy, and impossibly fresh.', 18, '/Tilapia.jpg', true, 20),
    (signature_id, 'Kenkey with Pepper', 'Fermented corn dough served with fiery homemade pepper sauce and fresh fish. A bold Ghanaian staple that packs serious heat.', 13, '/Kenkey+with+Pepper-+Sheeda+Travel+Tribe.png', true, 30),
    (drinks_id, 'Fresh Mango Drink', 'Sun-ripened mangoes blended into a smooth, tropical refresher. Sweet, creamy, and the perfect companion to any spicy dish.', 5, '/Mango_Drink.jpg', true, 100),
    (drinks_id, 'Pineapple Punch', 'Tangy, sweet pineapple juice with a hint of ginger. Refreshingly bright and bursting with island sunshine.', 5, '/Pineapple_Drink.png', true, 100),
    (drinks_id, 'Strawberry Bliss', 'Luscious strawberries blended into a vibrant, silky drink. A sweet escape in every sip.', 5, '/Strawberry_Drink.jpg', true, 100)
    ON CONFLICT DO NOTHING;
END $$;
