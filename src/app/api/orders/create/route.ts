import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderData, orderItems } = body;

    const allowedFields = [
      'user_id', 'status', 'total_amount', 'subtotal', 'tax_amount',
      'shipping_cost', 'discount_amount', 'delivery_address', 'shipping_address',
      'billing_address', 'special_instructions', 'coupon_code', 'payment_method',
      'payment_status', 'payment_reference', 'guest_checkout', 'customer_location',
      'shipping_method', 'delivery_fee', 'service_fee', 'small_order_fee', 'distance_miles',
    ];

    const orderRecord: any = {};
    for (const field of allowedFields) {
      if (orderData[field] !== undefined) {
        orderRecord[field] = orderData[field];
      }
    }

    // Set shipping_cost to delivery_fee for backward compat
    if (orderData.delivery_fee !== undefined) {
      orderRecord.shipping_cost = orderData.delivery_fee;
    }

    let methodName = '';
    if (orderData.shipping_method) {
      const method = orderData.shipping_method;
      methodName = typeof method === 'object' ? (method.name || method.id || '') : method;
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
      const itemsWithOrderId = orderItems.map((item: any) => ({
        ...item,
        order_id: order.id,
      }));
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsWithOrderId);
      if (itemsError) {
        console.error('Order items insert error:', itemsError);
      }
    }

    if (methodName && methodName !== 'pickup') {
      const { error: deliveryError } = await supabase
        .from('delivery_assignments')
        .insert({ 
          order_id: order.id, 
          status: 'pending',
          estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString()
        });
      if (deliveryError) {
        console.error('Delivery assignment creation error:', deliveryError);
      }

      // Create platform_fees record for financial tracking
      const deliveryFee = orderData.delivery_fee || 0;
      const serviceFee = orderData.service_fee || 0;
      const smallOrderFee = orderData.small_order_fee || 0;
      const distanceMiles = orderData.distance_miles || 0;
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
          order_id: order.id,
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

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
