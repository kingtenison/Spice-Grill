import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { WebhooksHelper } from 'square';

export const dynamic = 'force-dynamic';

const SQUARE_STATUS_MAP: Record<string, 'paid' | 'pending' | 'failed' | 'refunded'> = {
  COMPLETED: 'paid',
  APPROVED: 'pending',
  PENDING: 'pending',
  FAILED: 'failed',
  CANCELED: 'failed',
  REFUNDED: 'refunded',
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader =
    request.headers.get('x-square-hmacsha256-signature') || '';

  try {
    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
    const notificationUrl =
      process.env.SQUARE_WEBHOOK_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/square/webhook`;

    if (!signatureKey) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const valid = await WebhooksHelper.verifySignature({
      requestBody: rawBody,
      signatureHeader,
      signatureKey,
      notificationUrl,
    });

    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventType: string = payload.type;
    const data = payload.data;

    if (!data || typeof data.id !== 'string') {
      return NextResponse.json({ received: true });
    }

    let newStatus: 'paid' | 'pending' | 'failed' | 'refunded' | null = null;
    let orderId: string | null = null;
    let paymentReference: string | null = null;

    if (eventType === 'payment.updated') {
      const payment = data.object?.payment;
      if (payment?.reference_id && payment.status) {
        orderId = payment.reference_id;
        newStatus = SQUARE_STATUS_MAP[payment.status] || null;
      }
    } else if (eventType === 'refund.updated') {
      const refund = data.object?.refund;
      if (refund?.payment_id && refund.status === 'COMPLETED') {
        paymentReference = refund.payment_id;
        newStatus = 'refunded';
      }
    }

    if (newStatus && (orderId || paymentReference)) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const query = orderId
        ? supabase.from('orders').select('id, payment_status').eq('id', orderId).maybeSingle()
        : supabase.from('orders').select('id, payment_status').eq('payment_reference', paymentReference).maybeSingle();

      const { data: existing } = await query;
      if (existing && existing.payment_status !== newStatus) {
        const { error } = await supabase
          .from('orders')
          .update({ payment_status: newStatus })
          .eq('id', existing.id);
        if (error) {
          console.error('Webhook: failed to update order status:', error);
          return NextResponse.json({ error: 'Status update failed' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Square webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
