-- Insert default categories if they don't exist
INSERT INTO public.categories (name, slug) VALUES
('Dessert', 'dessert'),
('Appetizer', 'appetizer'),
('Drinks', 'drinks'),
('Main Course', 'main-course'),
('Salad', 'salad')
ON CONFLICT (slug) DO NOTHING;