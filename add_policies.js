import { createClient } from '@supabase/supabase-js';

async function addRLSPolicies() {
  const supabase = createClient(
    'https://frcqhcihylyogmnbqmon.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyY3FoY2loeWx5b2dtbmJxbW9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgxNjY0OCwiZXhwIjoyMDkzMzkyNjQ4fQ.ovtrdODL4U6crFqU0WnuWUIxrvwHKlCZ00Y1HKPBi88'
  );

  try {
    console.log('Adding RLS policies for order_items...');

    // Add RLS policies for order_items
    const policies = [
      `CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
        EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND (user_id = auth.uid() OR user_id IS NULL))
      )`,
      `CREATE POLICY "Users can create order items" ON order_items FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND (user_id = auth.uid() OR user_id IS NULL))
      )`,
      `CREATE POLICY "Admins can manage all order items" ON order_items FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )`
    ];

    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      if (error) {
        console.error(`Failed to create policy:`, error);
      } else {
        console.log(`Created policy successfully`);
      }
    }

    console.log('RLS policies setup completed!');
  } catch (err) {
    console.error('Error:', err);
  }
}

addRLSPolicies();