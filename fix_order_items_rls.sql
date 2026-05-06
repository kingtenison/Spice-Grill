-- Temporarily disable RLS for order_items to allow order creation
-- This will be re-enabled with proper policies after testing
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Or alternatively, create a very permissive policy for testing
-- DROP POLICY IF EXISTS "Allow all operations on order_items" ON order_items;
-- CREATE POLICY "Allow all operations on order_items" ON order_items FOR ALL USING (true);