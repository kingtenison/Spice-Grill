import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { code, subtotal } = body

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Code required' })
    }

    const upperCode = code.toUpperCase().trim()

    // 1. Check hardcoded promotional coupons (always available)
    const promoCoupons: Record<string, any> = {
      'WELCOME10': {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        description: '10% off your first order',
        minimumAmount: 25,
      },
      'SAVE5': {
        code: 'SAVE5',
        discountType: 'fixed',
        discountValue: 5,
        description: '$5 off orders over $30',
        minimumAmount: 30,
      },
    }

    const promo = promoCoupons[upperCode]
    if (promo) {
      if (promo.minimumAmount && subtotal < promo.minimumAmount) {
        return NextResponse.json({ valid: false, error: `Minimum order $${promo.minimumAmount} required` })
      }
      return NextResponse.json({ valid: true, coupon: promo })
    }

    // 2. Check loyalty redeemed coupons (only for logged-in users)
    if (user) {
      const { data: loyaltyCoupon, error } = await supabase
        .from('loyalty_coupons')
        .select('*')
        .eq('code', upperCode)
        .eq('user_id', user.id)
        .eq('is_used', false)
        .single()

      if (!error && loyaltyCoupon) {
        // Check expiry
        if (loyaltyCoupon.expires_at && new Date(loyaltyCoupon.expires_at) < new Date()) {
          return NextResponse.json({ valid: false, error: 'Coupon has expired' })
        }

        const coupon = {
          code: loyaltyCoupon.code,
          discountType: loyaltyCoupon.discount_type,
          discountValue: Number(loyaltyCoupon.discount_value),
          description: loyaltyCoupon.description || 'Loyalty Reward',
          minimumAmount: 0,
          isLoyaltyReward: true,
          loyaltyCouponId: loyaltyCoupon.id,
        }

        // Mark as used immediately upon validation (prevents reuse)
        await supabase
          .from('loyalty_coupons')
          .update({ is_used: true })
          .eq('id', loyaltyCoupon.id)

        return NextResponse.json({ valid: true, coupon })
      }
    }

    return NextResponse.json({ valid: false, error: 'Invalid coupon code' })
  } catch (error) {
    console.error('Coupon validate error:', error)
    return NextResponse.json({ valid: false, error: 'Validation failed' })
  }
}
