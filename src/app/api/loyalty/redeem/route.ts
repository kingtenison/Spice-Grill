import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const REWARDS = {
  fries: {
    points: 200,
    discountType: 'fixed' as const,
    discountValue: 8.99,
    description: 'Free Truffle Fries',
  },
  cocktail: {
    points: 350,
    discountType: 'fixed' as const,
    discountValue: 12,
    description: 'Signature Cocktail',
  },
  discount10: {
    points: 500,
    discountType: 'fixed' as const,
    discountValue: 10,
    description: '$10 Discount',
  },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rewardKey } = body

    const reward = REWARDS[rewardKey as keyof typeof REWARDS]
    if (!reward) {
      return NextResponse.json({ error: 'Invalid reward' }, { status: 400 })
    }

    // Try the atomic DB function first (preferred)
    const { data, error } = await supabase.rpc('redeem_loyalty_points', {
      p_user_id: user.id,
      p_points_cost: reward.points,
      p_discount_type: reward.discountType,
      p_discount_value: reward.discountValue,
      p_description: reward.description,
    })

    if (!error) {
      const result = Array.isArray(data) ? data[0] : data
      if (result?.success) {
        return NextResponse.json({
          success: true,
          code: result.coupon_code,
          reward: {
            name: reward.description,
            points: reward.points,
            discountType: reward.discountType,
            discountValue: reward.discountValue,
          }
        })
      }
      return NextResponse.json({ 
        error: result?.message || 'Insufficient points' 
      }, { status: 400 })
    }

    // Fallback (when the SQL function hasn't been created yet in the DB)
    const isMissingFunc = error.code === 'PGRST202' || 
      (error.message || '').toLowerCase().includes('could not find the function')

    if (!isMissingFunc) {
      console.error('Redeem RPC error:', error)
      return NextResponse.json({ error: 'Failed to redeem reward' }, { status: 500 })
    }

    // Manual fallback implementation
    const { data: currentLoyalty, error: fetchErr } = await supabase
      .from('loyalty_points')
      .select('points')
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !currentLoyalty) {
      return NextResponse.json({ error: 'Could not load your points' }, { status: 500 })
    }

    if (currentLoyalty.points < reward.points) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
    }

    const newPoints = currentLoyalty.points - reward.points
    const newTier = newPoints >= 2001 ? 'Gold' : newPoints >= 501 ? 'Silver' : 'Bronze'

    // Generate a nice code
    const code = `REWARD-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    // Update points + tier
    const { error: updateErr } = await supabase
      .from('loyalty_points')
      .update({ points: newPoints, tier: newTier, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (updateErr) {
      console.error('Fallback points update failed:', updateErr)
      return NextResponse.json({ error: 'Could not deduct points' }, { status: 500 })
    }

    // Create the coupon record (requires the loyalty_coupons table to exist)
    const { error: couponErr } = await supabase
      .from('loyalty_coupons')
      .insert({
        user_id: user.id,
        code,
        discount_type: reward.discountType,
        discount_value: reward.discountValue,
        description: reward.description,
        points_cost: reward.points,
        is_used: false,
      })

    if (couponErr) {
      // Roll back points if coupon creation fails
      await supabase
        .from('loyalty_points')
        .update({ points: currentLoyalty.points, tier: currentLoyalty.points >= 2001 ? 'Gold' : currentLoyalty.points >= 501 ? 'Silver' : 'Bronze', updated_at: new Date().toISOString() })
        .eq('user_id', user.id)

      console.error('Fallback coupon insert failed:', couponErr)
      return NextResponse.json({ error: 'Reward table not ready yet. Please run the database SQL.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      code,
      reward: {
        name: reward.description,
        points: reward.points,
        discountType: reward.discountType,
        discountValue: reward.discountValue,
      }
    })
  } catch (error) {
    console.error('Loyalty redeem error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
