import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the orders associated with the user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          menu_items(name, image_url)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('[API orders/user] Supabase error:', ordersError);
      return NextResponse.json({ error: ordersError.message }, { status: 400 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error: any) {
    console.error('[API orders/user] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
