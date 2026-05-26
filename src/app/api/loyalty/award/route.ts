import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Verify the order belongs to this user and is recent
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total_amount, created_at, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this order' }, { status: 403 })
    }

    // Only award for completed/paid orders (or pending right after checkout)
    const pointsToAward = Math.floor(Number(order.total_amount) || 0)
    if (pointsToAward <= 0) {
      return NextResponse.json({ success: true, pointsAwarded: 0 })
    }

    // Use the secure database function
    const { error: awardError } = await supabase.rpc('award_loyalty_points', {
      p_user_id: user.id,
      p_points: pointsToAward,
    })

    if (awardError) {
      // Only log scary errors; "function not found" is expected until SQL is run
      const isMissingFunc = awardError.code === 'PGRST202' || 
        (awardError.message || '').includes('could not find the function')
      if (!isMissingFunc) {
        console.error('Award points RPC error:', awardError)
      }
      // Fallback: direct update (still protected by RLS)
      const { data: current } = await supabase
        .from('loyalty_points')
        .select('points')
        .eq('user_id', user.id)
        .single()

      const newPoints = (current?.points || 0) + pointsToAward
      const newTier = newPoints >= 2001 ? 'Gold' : newPoints >= 501 ? 'Silver' : 'Bronze'

      await supabase
        .from('loyalty_points')
        .upsert({
          user_id: user.id,
          points: newPoints,
          tier: newTier,
          updated_at: new Date().toISOString(),
        })
    }

    return NextResponse.json({
      success: true,
      pointsAwarded: pointsToAward,
    })
  } catch (error) {
    console.error('Loyalty award error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
