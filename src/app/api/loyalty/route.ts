import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: loyalty, error } = await supabase
      .from('loyalty_points')
      .select('points, tier, updated_at')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Loyalty fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch loyalty points' }, { status: 500 })
    }

    const points = loyalty?.points || 0
    const tier = loyalty?.tier || 'Bronze'

    // Calculate next tier and progress
    let nextTier = 'Silver'
    let nextTierPoints = 501
    if (points >= 2001) {
      nextTier = 'Gold'
      nextTierPoints = points // already max
    } else if (points >= 501) {
      nextTier = 'Gold'
      nextTierPoints = 2001
    }

    const progress = nextTierPoints > points 
      ? Math.min(100, Math.round((points / nextTierPoints) * 100))
      : 100

    const pointsToNext = Math.max(0, nextTierPoints - points)

    // Also fetch user's unused redeemed coupons
    const { data: coupons } = await supabase
      .from('loyalty_coupons')
      .select('code, description, discount_value, discount_type, expires_at, created_at')
      .eq('user_id', user.id)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      points,
      tier,
      nextTier,
      nextTierPoints,
      progress,
      pointsToNext,
      updatedAt: loyalty?.updated_at,
      unusedCoupons: coupons || []
    })
  } catch (error) {
    console.error('Loyalty API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
