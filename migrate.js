import { createClient } from '@supabase/supabase-js';

async function runMigration() {
  const supabase = createClient(
    'https://frcqhcihylyogmnbqmon.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3FoY2loeWx5b2dtbmJxbW9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgxNjY0OCwiZXhwIjoyMDkzMzkyNjQ4fQ.ovtrdODL4U6crFqU0WnuWUIxrvwHKlCZ00Y1HKPBi88'
  );

  try {
    console.log('Running migration...');

    // Add columns one by one since Supabase doesn't support multiple ALTER TABLE in one query easily
    const alterStatements = [
      'ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS ingredients TEXT[]',
      'ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS preparation_time INTEGER',
      'ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS cooking_method TEXT',
      'ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS nutritional_info JSONB',
      'ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens TEXT[]',
      'ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS dietary_tags TEXT[]',
      'ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS calories INTEGER',
      // Orders table updates
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address JSONB',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_checkout BOOLEAN DEFAULT FALSE',
      // Order items RLS policies
      `CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
        EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND (user_id = auth.uid() OR user_id IS NULL))
      )`,
      `CREATE POLICY "Users can create order items" ON order_items FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND (user_id = auth.uid() OR user_id IS NULL))
      )`,
      `CREATE POLICY "Admins can manage all order items" ON order_items FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )`,
      // Update existing records
      'UPDATE orders SET guest_checkout = (user_id IS NULL) WHERE guest_checkout IS NULL'
    ];

    for (const sql of alterStatements) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.error(`Failed to execute: ${sql}`, error);
      } else {
        console.log(`Executed: ${sql}`);
      }
    }

    console.log('Migration completed!');
  } catch (err) {
    console.error('Error:', err);
  }
}

runMigration();