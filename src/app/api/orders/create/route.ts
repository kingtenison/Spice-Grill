import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSquareClient, SQUARE_CURRENCY } from '@/lib/square';
import { SquareError } from 'square';
import {
  MAX_DELIVERY_RADIUS_MILES,
  DEFAULT_RESTAURANT_LAT,
  DEFAULT_RESTAURANT_LNG,
  haversineMiles,
} from '@/lib/delivery';

const TAX_RATE = 0.08;

// Keep in sync with /api/loyalty/validate (promotional coupons)
const PROMO_COUPONS: Record<string, { discountType: 'percentage' | 'fixed'; discountValue: number; minimumAmount: number }> = {
  WELCOME10: { discountType: 'percentage', discountValue: 10, minimumAmount: 25 },
  SAVE5: { discountType: 'fixed', discountValue: 5, minimumAmount: 30 },
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

async function recomputeCouponDiscount(
  supabase: SupabaseClient,
  code: string | undefined,
  userId: string | null,
  subtotal: number
): Promise<number> {
  if (!code) return 0;

  const upper = code.toUpperCase().trim();
  const promo = PROMO_COUPONS[upper];
  if (promo) {
    if (subtotal < promo.minimumAmount) {
      throw new Error(`Minimum order $${promo.minimumAmount} required for coupon ${upper}`);
    }
    return promo.discountType === 'percentage'
      ? subtotal * (promo.discountValue / 100)
      : Math.min(promo.discountValue, subtotal);
  }

  if (userId) {
    const { data, error } = await supabase
      .from('loyalty_coupons')
      .select('discount_type, discount_value, expires_at')
      .eq('code', upper)
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error(`Coupon ${upper} has expired`);
      }
      const value = Number(data.discount_value) || 0;
      return data.discount_type === 'percentage'
        ? subtotal * (value / 100)
        : Math.min(value, subtotal);
    }
  }

  throw new Error(`Invalid coupon code ${upper}`);
}

async function recomputeLoyaltyDiscount(
  supabase: SupabaseClient,
  userId: string | null,
  subtotal: number
): Promise<number> {
  if (!userId) return 0;
  const { data } = await supabase
    .from('loyalty_points')
    .select('tier')
    .eq('user_id', userId)
    .maybeSingle();
  const percent = data?.tier === 'Gold' ? 10 : data?.tier === 'Silver' ? 5 : 0;
  return percent > 0 ? round2(subtotal * (percent / 100)) : 0;
}

async function createDeliveryRecords(
  supabase: SupabaseClient,
  orderId: string,
  methodName: string,
  deliveryFee: number,
  serviceFee: number,
  smallOrderFee: number,
  distanceMilesRaw: number
): Promise<void> {
  const distanceMiles = Math.max(0, Number(distanceMilesRaw) || 0);
  if (!methodName || methodName === 'pickup') return;

  // Idempotent: one delivery assignment per order (a dev-mode re-run or
  // retry must not error on the unique order_id constraint)
  const { error: deliveryError } = await supabase
    .from('delivery_assignments')
    .upsert(
      {
        order_id: orderId,
        status: 'pending',
        estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString()
      },
      { onConflict: 'order_id' }
    );
  if (deliveryError) {
    console.error('Delivery assignment creation error:', deliveryError);
  }

  // Skip platform fees if they already exist for this order
  const { data: existingFees } = await supabase
    .from('platform_fees')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle();
  if (existingFees) return;

  // Create platform_fees record for financial tracking
  const totalCollected = deliveryFee + serviceFee + smallOrderFee;

  // Calculate dispatcher payout: base + mileage
  let dispatcherPayout = 0;
  if (distanceMiles > 0) {
    const { data: settings } = await supabase
      .from('delivery_settings')
      .select('driver_base_pay, driver_mileage_pay')
      .limit(1)
      .single();
    const basePay = settings?.driver_base_pay || 3.00;
    const mileagePay = settings?.driver_mileage_pay || 0.70;
    dispatcherPayout = basePay + (mileagePay * distanceMiles);
  }

  const platformNet = totalCollected - dispatcherPayout;

  const { error: feesError } = await supabase
    .from('platform_fees')
    .insert({
      order_id: orderId,
      delivery_fee: deliveryFee,
      service_fee: serviceFee,
      small_order_fee: smallOrderFee,
      total_collected: totalCollected,
      dispatcher_payout: dispatcherPayout,
      platform_net: platformNet,
      distance_miles: distanceMiles,
    });
  if (feesError) {
    console.error('Platform fees insert error:', feesError);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderData, orderItems } = body;

    if (!orderData || typeof orderData !== 'object' || Array.isArray(orderData)) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }
    if (!Array.isArray(orderItems)) {
      return NextResponse.json({ error: 'Invalid order items' }, { status: 400 });
    }

    // ------------------------------------------------------------------
    // Sanitize all user-supplied fields (HTML/control chars, length caps)
    // ------------------------------------------------------------------
    const stringFields: { key: string; max: number }[] = [
      { key: 'delivery_address', max: 500 },
      { key: 'shipping_address', max: 500 },
      { key: 'billing_address', max: 500 },
      { key: 'special_instructions', max: 500 },
      { key: 'coupon_code', max: 30 },
      { key: 'payment_token', max: 500 },
      { key: 'payment_reference', max: 100 },
    ];
    for (const { key, max } of stringFields) {
      if (orderData[key] !== undefined) {
        orderData[key] = sanitizeString(orderData[key], max);
        if (key === 'coupon_code') orderData[key] = String(orderData[key]).toUpperCase();
      }
    }

    if (orderData.payment_method !== undefined && !['card', 'cash'].includes(String(orderData.payment_method))) {
      orderData.payment_method = 'cash';
    }

    if (orderData.payment_status !== undefined && !['paid', 'pending', 'failed', 'refunded'].includes(String(orderData.payment_status))) {
      orderData.payment_status = 'pending';
    }

    if (orderData.user_id !== undefined && (typeof orderData.user_id !== 'string' || orderData.user_id.length < 8 || orderData.user_id.length > 64)) {
      orderData.user_id = null;
    }

    if (orderData.customer_location !== undefined) {
      const loc = orderData.customer_location;
      if (loc && typeof loc === 'object' && !Array.isArray(loc)) {
        const raw = loc as Record<string, unknown>;
        const lat = Number(raw.lat);
        const lng = Number(raw.lng);
        orderData.customer_location = {
          lat: Number.isFinite(lat) && Math.abs(lat) <= 90 ? lat : 0,
          lng: Number.isFinite(lng) && Math.abs(lng) <= 180 ? lng : 0,
          address: sanitizeString(raw.address, 300),
        };
      } else {
        orderData.customer_location = null;
      }
    }
    // ------------------------------------------------------------------

    const allowedFields = [
      'user_id', 'status', 'total_amount', 'subtotal', 'tax_amount',
      'shipping_cost', 'discount_amount', 'delivery_address', 'shipping_address',
      'billing_address', 'special_instructions', 'coupon_code', 'payment_method',
      'payment_status', 'payment_reference', 'guest_checkout', 'customer_location',
      'shipping_method', 'delivery_fee', 'service_fee', 'small_order_fee', 'distance_miles',
    ];

    const isCard = orderData?.payment_method === 'card';

    if (isCard && !orderData?.payment_token) {
      return NextResponse.json({ error: 'Payment token is required for card payments' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: settings } = await supabase
      .from('delivery_settings')
      .select('*')
      .maybeSingle();
    const restaurantLat = Number(settings?.restaurant_lat) || DEFAULT_RESTAURANT_LAT;
    const restaurantLng = Number(settings?.restaurant_lng) || DEFAULT_RESTAURANT_LNG;

    // ------------------------------------------------------------------
    // Delivery radius guard (US-only from Moorhead, MN) - server authority
    // ------------------------------------------------------------------
    const shippingMethodRaw = orderData?.shipping_method;
    const isPickup =
      shippingMethodRaw === 'pickup' ||
      (typeof shippingMethodRaw === 'object' &&
        shippingMethodRaw !== null &&
        (shippingMethodRaw as { id?: string })?.id === 'pickup');

    let deliveryMiles: number | null = null;
    if (!isPickup) {
      const loc = orderData?.customer_location as { lat?: number; lng?: number } | null;
      if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
        return NextResponse.json(
          { error: 'Delivery orders require a location. Please try again.' },
          { status: 400 }
        );
      }
      deliveryMiles = haversineMiles(restaurantLat, restaurantLng, loc.lat, loc.lng);
      if (deliveryMiles > MAX_DELIVERY_RADIUS_MILES) {
        return NextResponse.json(
          {
            error: `Delivery is not available to your location (${deliveryMiles.toFixed(0)} mi away). Maximum delivery radius is ${MAX_DELIVERY_RADIUS_MILES} mi. Please select pickup.`,
          },
          { status: 400 }
        );
      }
    }
    // ------------------------------------------------------------------

    // ------------------------------------------------------------------
    // Server-side price verification (protects against client tampering)
    // ------------------------------------------------------------------
    let dbSubtotal = 0;
    const priceMap = new Map<string, number>();

    if (orderItems.length > 0) {
      for (const item of orderItems) {
        if (typeof item?.menu_item_id !== 'string' || item.menu_item_id.length > 100) {
          return NextResponse.json({ error: 'Invalid order item' }, { status: 400 });
        }
      }
      const ids = orderItems.map((item: { menu_item_id: string }) => item.menu_item_id);
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('id, price, is_available')
        .in('id', ids);

      if (itemsError) {
        console.error('Menu items fetch error:', itemsError);
        return NextResponse.json({ error: 'Unable to verify order items' }, { status: 500 });
      }

      if (!items || items.length !== ids.length) {
        return NextResponse.json({ error: 'One or more menu items are no longer available' }, { status: 400 });
      }

      for (const item of items) {
        priceMap.set(item.id, Number(item.price) || 0);
        if (item.is_available === false) {
          return NextResponse.json({ error: 'One or more menu items are no longer available' }, { status: 400 });
        }
      }

      for (const line of orderItems) {
        const qty = Number(line.quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
          return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 });
        }
        const price = priceMap.get(line.menu_item_id);
        if (price === undefined || price <= 0) {
          return NextResponse.json({ error: 'Menu item pricing could not be verified' }, { status: 400 });
        }
        dbSubtotal += price * qty;
      }
    }
    dbSubtotal = round2(dbSubtotal);

    if (dbSubtotal <= 0) {
      return NextResponse.json({ error: 'Your cart is empty. Add items before checking out.' }, { status: 400 });
    }

    // Fees are recomputed server-side from delivery_settings + distance (never client-reported)
    const freeDeliveryRadius = Number(settings?.free_delivery_radius_miles) || 5;
    const serviceFeeRadius = Number(settings?.service_fee_radius_miles) || 5;
    const baseDeliveryFee = Number(settings?.delivery_fee) || 0;
    const baseServiceFee = Number(settings?.service_fee) || 0;
    const perMileRate = Number(settings?.per_mile_rate) || 0;
    const smallOrderThreshold = Number(settings?.small_order_threshold) || 15;
    const smallOrderFeeValue = Number(settings?.small_order_fee) || 0;

    let deliveryFee = 0;
    let serviceFee = 0;
    if (!isPickup && deliveryMiles !== null) {
      deliveryFee = deliveryMiles <= freeDeliveryRadius ? 0 : baseDeliveryFee;
      serviceFee =
        deliveryMiles <= serviceFeeRadius
          ? baseServiceFee
          : baseServiceFee + (deliveryMiles - serviceFeeRadius) * perMileRate;
    }
    const smallOrderFee = dbSubtotal < smallOrderThreshold ? smallOrderFeeValue : 0;
    deliveryFee = round2(deliveryFee);
    serviceFee = round2(serviceFee);
    const taxAmount = dbSubtotal * TAX_RATE;
    const couponDiscount = await recomputeCouponDiscount(
      supabase,
      orderData?.coupon_code,
      orderData?.user_id || null,
      dbSubtotal
    );
    const loyaltyDiscount = await recomputeLoyaltyDiscount(
      supabase,
      orderData?.user_id || null,
      dbSubtotal
    );

    const expectedTotal = Math.max(
      0,
      dbSubtotal + deliveryFee + serviceFee + smallOrderFee + taxAmount - couponDiscount - loyaltyDiscount
    );
    const clientTotal = Number(orderData?.total_amount);

    if (!Number.isFinite(clientTotal) || Math.abs(expectedTotal - clientTotal) > 0.02) {
      console.warn(`Price verification failed: expected ${expectedTotal}, client sent ${clientTotal}`);
      return NextResponse.json(
        { error: 'Order total could not be verified. Please review your cart and try again.' },
        { status: 400 }
      );
    }

    const chargeAmountCents = BigInt(Math.round(expectedTotal * 100));

    if (isCard && chargeAmountCents < BigInt(100)) {
      return NextResponse.json({ error: 'Minimum order amount for card payments is $1.00' }, { status: 400 });
    }
    // ------------------------------------------------------------------

    const orderRecord: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (orderData[field] !== undefined) {
        orderRecord[field] = orderData[field];
      }
    }

    // Server is authoritative over pricing
    orderRecord.subtotal = dbSubtotal;
    orderRecord.tax_amount = round2(taxAmount);
    orderRecord.discount_amount = round2(couponDiscount + loyaltyDiscount);
    orderRecord.total_amount = round2(expectedTotal);

    // Set shipping_cost to delivery_fee for backward compat
    orderRecord.shipping_cost = deliveryFee;

    let methodName = '';
    if (orderData.shipping_method) {
      const method = orderData.shipping_method;
      methodName = typeof method === 'object' ? (method.name || method.id || '') : method;
      methodName = sanitizeString(methodName, 50);
      if (methodName) {
        orderRecord.special_instructions = orderRecord.special_instructions
          ? `Delivery: ${methodName}\n${orderRecord.special_instructions}`
          : `Delivery: ${methodName}`;
      }
      if (method === 'pickup') {
        orderRecord.delivery_address = orderRecord.delivery_address || 'Pickup';
      }
      orderRecord.shipping_method = methodName;
    }

    // Payment is only ever set by the server.
    // Cash orders default to 'paid' (restaurant collects on delivery); there is no
    // admin "mark payment collected" control yet, so 'pending' would strand them.
    orderRecord.payment_status = isCard ? 'pending' : (orderData?.payment_status || 'paid');
    delete orderRecord.payment_token;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select()
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      return NextResponse.json({ error: orderError.message, code: orderError.code }, { status: 500 });
    }

    if (orderItems && orderItems.length > 0) {
      const itemsWithOrderId = orderItems.map((item: { menu_item_id: string; quantity: number; unit_price?: number }) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        // Use the verified server-side price, never the client-provided one
        unit_price: priceMap.get(item.menu_item_id) ?? item.unit_price,
        order_id: order.id,
      }));
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsWithOrderId);
      if (itemsError) {
        console.error('Order items insert error:', itemsError);
      }
    }

    // ------------------------------------------------------------------
    // Charge the card via Square
    // ------------------------------------------------------------------
    if (isCard) {
      try {
        const response = await getSquareClient().payments.create({
          sourceId: orderData.payment_token,
          idempotencyKey: order.id,
          amountMoney: { amount: chargeAmountCents, currency: SQUARE_CURRENCY },
          referenceId: order.id,
          note: `Spice Grill order #${order.id.slice(0, 8).toUpperCase()}`,
          autocomplete: true,
        });

        const payment = response.payment;
        const status = payment?.status;

        if (payment?.id && (status === 'COMPLETED' || status === 'APPROVED')) {
          const { error: paidError } = await supabase
            .from('orders')
            .update({ payment_status: 'paid', payment_reference: payment.id })
            .eq('id', order.id);
          if (paidError) {
            console.error('Failed to mark order paid:', paidError);
          }
          await createDeliveryRecords(
            supabase,
            order.id,
            methodName,
            deliveryFee,
            serviceFee,
            smallOrderFee,
            Number(orderData?.distance_miles) || 0
          );
          return NextResponse.json({ success: true, orderId: order.id });
        }

        await supabase
          .from('orders')
          .update({
            payment_status: status === 'FAILED' || status === 'CANCELED' ? 'failed' : 'pending',
            payment_reference: payment?.id || null,
          })
          .eq('id', order.id);

        return NextResponse.json({ error: 'Payment was not completed. Please try again.' }, { status: 402 });
      } catch (err) {
        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', order.id);

        const message =
          err instanceof SquareError
            ? (err.errors?.[0]?.detail as string) || 'Payment was declined. Please try another card.'
            : err instanceof Error
              ? err.message
              : 'Payment processing failed. Please try again.';
        return NextResponse.json({ error: message, code: 'PAYMENT_FAILED' }, { status: 402 });
      }
    }
    // ------------------------------------------------------------------

    await createDeliveryRecords(
      supabase,
      order.id,
      methodName,
      deliveryFee,
      serviceFee,
      smallOrderFee,
      Number(orderData?.distance_miles) || 0
    );

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error: unknown) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}
