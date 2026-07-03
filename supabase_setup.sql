-- BREW & CO. - Supabase Database Schema Setup SQL Migration
-- Copy and paste this script directly into your Supabase Dashboard SQL Editor (https://supabase.com -> Project -> SQL Editor)

-- 1. Create Tables

-- Site Settings (CMS configuration)
CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL
);

-- Menu Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  sort_order INT DEFAULT 0
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Gallery Items (Masonry)
CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title VARCHAR(255),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Customer Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  review TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0
);


-- 2. Enable Row-Level Security (RLS)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;


-- 3. Create Public Read Policies
CREATE POLICY "Allow public read access on site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read access on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public read access on gallery_items" ON gallery_items FOR SELECT USING (true);
CREATE POLICY "Allow public read access on testimonials" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Allow public read access on faqs" ON faqs FOR SELECT USING (true);


-- 4. Create Authenticated Write Policies (for Admin Dashboard)
CREATE POLICY "Allow admin write access on site_settings" ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write access on categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write access on menu_items" ON menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write access on gallery_items" ON gallery_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write access on testimonials" ON testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write access on faqs" ON faqs FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 5. Insert Seed / Default Data for Brew & Co.

-- Site settings
INSERT INTO site_settings (key, value) VALUES
('hero', '{"title": "Brewed to Inspire.", "subtitle": "Every cup tells a story of craftsmanship, passion, and unforgettable flavor.", "cta_primary": "Explore Menu", "cta_secondary": "Visit Our Café"}'),
('about', '{"content": "Brew & Co is a specialty coffee shop in Sorsogon dedicated to crafting exceptional coffee experiences. Every cup is prepared with passion, premium ingredients, and attention to detail. Whether you''re catching up with friends, working remotely, or simply relaxing, Brew & Co offers a warm and modern café experience."}'),
('contact', '{"address": "Magsaysay St., Sorsogon City, Philippines", "phone": "+63 912 345 6789", "email": "hello@brewandco.com", "facebook": "https://facebook.com/brewandco.sorsogon", "instagram": "https://instagram.com/brewandco.sorsogon", "hours_json": {"monday_friday": "8:00 AM - 10:00 PM", "saturday_sunday": "9:00 AM - 11:00 PM"}}'),
('seo', '{"title": "Brew & Co | Premium Specialty Coffee Shop in Sorsogon", "description": "Immersive 3D specialty coffee experience in Sorsogon City, Philippines. Taste our craft and join the community.", "keywords": "coffee, specialty coffee, sorsogon, philippines, brew and co, cafe"}'),
('theme', '{"primary": "#1B1B1B", "secondary": "#4E342E", "accent": "#C58B47", "cream": "#F7F1E8", "gold": "#D6A756"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Categories
INSERT INTO categories (name, slug, sort_order) VALUES
('Coffee', 'coffee', 1),
('Non Coffee', 'non-coffee', 2),
('Tea', 'tea', 3),
('Pastries', 'pastries', 4),
('Desserts', 'desserts', 5)
ON CONFLICT (slug) DO NOTHING;

-- Retrieve dynamic category IDs using subqueries to populate default drinks
DO $$
DECLARE
  coffee_id UUID;
  non_coffee_id UUID;
  pastry_id UUID;
BEGIN
  SELECT id INTO coffee_id FROM categories WHERE slug = 'coffee';
  SELECT id INTO non_coffee_id FROM categories WHERE slug = 'non-coffee';
  SELECT id INTO pastry_id FROM categories WHERE slug = 'pastries';

  IF coffee_id IS NOT NULL THEN
    INSERT INTO menu_items (category_id, name, description, price, is_featured) VALUES
    (coffee_id, 'Spanish Latte', 'Smooth espresso base paired with condensed milk and froth, rich and balanced.', 140.00, true),
    (coffee_id, 'Iced Americano', 'Premium double shot espresso poured over iced mineral water, crisp and light.', 110.00, true),
    (coffee_id, 'Caramel Macchiato', 'Sweetened milk combined with espresso shots, drizzled with caramel sauce.', 150.00, true),
    (coffee_id, 'Signature Brew', 'Our house blend slow-dripped specialty coffee, showcasing local Sorsogon beans.', 160.00, true),
    (coffee_id, 'Cold Brew', 'Specialty beans steeped in cold water for 18 hours, presenting a clean chocolate flavor.', 130.00, false);
  END IF;

  IF non_coffee_id IS NOT NULL THEN
    INSERT INTO menu_items (category_id, name, description, price, is_featured) VALUES
    (non_coffee_id, 'Matcha Latte', 'Organic Japanese ceremonial green tea whisked with rich steamed milk.', 150.00, true),
    (non_coffee_id, 'Dark Cocoa Mocha', 'Classic espresso combined with pure dark chocolate and velvety steamed milk.', 145.00, false);
  END IF;

  IF pastry_id IS NOT NULL THEN
    INSERT INTO menu_items (category_id, name, description, price, is_featured) VALUES
    (pastry_id, 'Butter Croissant', 'Flaky, buttery French puff pastry, baked fresh daily.', 95.00, false),
    (pastry_id, 'Chocolate Danish', 'Sweet leavened pastry filled with premium bittersweet chocolate center.', 105.00, false);
  END IF;
END $$;

-- Gallery Items
INSERT INTO gallery_items (image_url, title, sort_order) VALUES
('https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=600', 'Barista Crafting Coffee', 1),
('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600', 'Espresso Pull', 2),
('https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=600', 'Cozy Interior Corner', 3),
('https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600', 'Latte Art Cup', 4),
('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600', 'Signature Iced Coffee', 5),
('https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600', 'Outdoor Seating Area', 6)
ON CONFLICT (id) DO NOTHING;

-- Testimonials
INSERT INTO testimonials (name, review, rating, photo_url) VALUES
('Ramon Valenzuela', 'The Spanish Latte is divine! Best specialty coffee shop in Sorsogon. Highly recommended design and vibe.', 5, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'),
('Sarah Benson', 'A great place to work remotely. Very fast internet, comfortable seats, and the Signature Brew is excellent!', 5, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150'),
('Julian Estacio', 'Outstanding pastries and very warm hospitality. The croissants are crispy and perfectly buttery.', 4, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150')
ON CONFLICT (id) DO NOTHING;

-- FAQs
INSERT INTO faqs (question, answer, sort_order) VALUES
('Where is Brew & Co located?', 'We are located at Magsaysay St., Sorsogon City, Philippines (right near the city center).', 1),
('Do you offer delivery?', 'Yes, we partner with local delivery services in Sorsogon. You can also order directly via phone.', 2),
('Is there space for group meetings or working?', 'Absolutely! We offer charging outlets, fast high-speed Wi-Fi, and spacious table options perfect for digital nomads and meetings.', 3),
('Are your beans locally sourced?', 'We serve a curated selection of both premium international single-origins and high-quality local Philippine coffee beans.', 4)
ON CONFLICT (id) DO NOTHING;
