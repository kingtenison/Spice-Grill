// Supabase Edge Function: Notify Order
// Channels: Resend (Email), Termii (SMS)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TERMII_API_KEY = Deno.env.get('TERMII_API_KEY')

serve(async (req: Request) => {
  try {
    const { order, user, type } = await req.json()

    // 1. Send Email via Resend
    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Fable Restaurant <orders@fable-os.com>',
          to: user.email,
          subject: `Order Update: ${order.id}`,
          html: `
            <h1>Order ${type}</h1>
            <p>Hi ${user.full_name},</p>
            <p>Your order <strong>${order.id}</strong> is now <strong>${order.status}</strong>.</p>
            <p>Total: $${order.total_amount}</p>
            <a href="https://fable-os.com/orders/${order.id}">Track your order</a>
          `,
        }),
      })
    }

    // 2. Send SMS via Termii
    if (TERMII_API_KEY && user.phone) {
      await fetch('https://api.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.phone,
          from: "Fable",
          sms: `Fable: Your order ${order.id} is now ${order.status}. Track here: https://fable-os.com/orders/${order.id}`,
          type: "plain",
          channel: "generic",
          api_key: TERMII_API_KEY,
        }),
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
