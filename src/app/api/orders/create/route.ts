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
      'shipping_method',
    ];

    const orderRecord: any = {};
    for (const field of allowedFields) {
      if (orderData[field] !== undefined) {
        orderRecord[field] = orderData[field];
      }
    }

    if (orderData.shipping_method) {
      const method = orderData.shipping_method;
      const methodName = typeof method === 'object' ? (method.name || method.id || '') : method;
      if (methodName) {
        orderRecord.special_instructions = orderRecord.special_instructions
          ? `Shipping: ${methodName}\n${orderRecord.special_instructions}`
          : `Shipping: ${methodName}`;
      }
      if (method === 'pickup') {
        orderRecord.delivery_address = orderRecord.delivery_address || 'Pickup';
      }
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

    if (orderData.shipping_method && typeof orderData.shipping_method === 'string' && orderData.shipping_method !== 'pickup') {
      const { error: deliveryError } = await supabase
        .from('delivery_assignments')
        .insert({ 
          order_id: order.id, 
          status: 'pending',
          estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString() // 45 min estimate
        });
      if (deliveryError) {
        console.error('Delivery assignment creation error:', deliveryError);
      }
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
