import { getServiceClient } from "@/lib/supabase/service";
import { formatToE164, isBirdConfigured, sendBirdSms, getBirdSenderId } from "./bird";
import {
  isResendConfigured,
  renderOrderConfirmationHtml,
  renderOrderStatusUpdateHtml,
  renderCampaignHtml,
  renderTestEmailHtml,
  sendResendEmail,
  getResendFromEmail,
} from "./resend";
import { CustomerContact, NotificationOrderItem, OrderNotificationPayload } from "./types";

export {
  sendBirdSms,
  isBirdConfigured,
  formatToE164,
  getBirdSenderId,
  sendResendEmail,
  isResendConfigured,
  getResendFromEmail,
  renderOrderConfirmationHtml,
  renderOrderStatusUpdateHtml,
  renderCampaignHtml,
  renderTestEmailHtml,
};

/**
 * Extracts and normalizes customer name, phone, and email from an order record.
 * Handles structured jsonb (shipping_address) and formatted string (delivery_address).
 */
export function extractCustomerContact(order: Record<string, any>): CustomerContact {
  let name = "";
  let email: string | null = null;
  let phone: string | null = null;
  let addressSummary = "";

  // 1. Try structured shipping_address JSON
  if (order.shipping_address && typeof order.shipping_address === "object") {
    const s = order.shipping_address;
    if (s.name && typeof s.name === "string") name = s.name.trim();
    if (s.email && typeof s.email === "string") email = s.email.trim();
    if (s.phone && typeof s.phone === "string") phone = s.phone.trim();
    if (s.street) {
      addressSummary = `${s.street}, ${s.city || ""} ${s.state || ""} ${s.zipCode || ""}`.trim();
    }
  }

  // 2. Try profiles relation if available
  if (order.profiles) {
    if (!name && order.profiles.full_name) name = order.profiles.full_name.trim();
    if (!phone && order.profiles.phone) phone = order.profiles.phone.trim();
  }

  // 3. Fallback: Parse delivery_address text string
  // Commonly formatted as: "Name - Phone - Email - Street, City, State Zip"
  if (typeof order.delivery_address === "string" && order.delivery_address.trim()) {
    const text = order.delivery_address.trim();
    const parts = text.split(" - ").map((p: string) => p.trim());

    if (!name && parts.length > 0 && parts[0] && !parts[0].includes("@") && !/\d{5,}/.test(parts[0])) {
      name = parts[0];
    }

    if (!email) {
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) email = emailMatch[0];
    }

    if (!phone) {
      // Look for 10-15 digit phone patterns
      const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
      if (phoneMatch) phone = phoneMatch[0];
    }

    if (!addressSummary) {
      addressSummary = text;
    }
  }

  if (!name) name = "Valued Customer";

  return {
    name,
    email,
    phone,
    formattedPhone: formatToE164(phone),
    addressSummary: addressSummary || order.delivery_address || "Pickup",
  };
}

/**
 * Loads order record and builds standard notification payload.
 */
export async function buildOrderNotificationPayload(orderId: string): Promise<OrderNotificationPayload | null> {
  const db = getServiceClient();

  const { data: order, error } = await db
    .from("orders")
    .select(
      `
      *,
      profiles (
        full_name,
        phone
      ),
      order_items (
        quantity,
        unit_price,
        menu_items (
          name,
          price
        )
      ),
      delivery_assignments (
        status,
        dispatchers (
          name,
          phone
        )
      )
    `
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    console.error(`[Notifications] Could not fetch order #${orderId}:`, error);
    return null;
  }

  const customer = extractCustomerContact(order);

  // If email is still missing and user_id exists, try looking up the Supabase auth user
  if (!customer.email && order.user_id) {
    try {
      const { data: authUser } = await db.auth.admin.getUserById(order.user_id);
      if (authUser?.user?.email) {
        customer.email = authUser.user.email;
      }
      if (!customer.phone && authUser?.user?.phone) {
        customer.phone = authUser.user.phone;
        customer.formattedPhone = formatToE164(authUser.user.phone);
      }
    } catch {
      // Non-blocking
    }
  }

  const items: NotificationOrderItem[] = (order.order_items || []).map((it: any) => {
    const name = it.menu_items?.name || "Delicious Item";
    const quantity = Number(it.quantity) || 1;
    const price = Number(it.unit_price) || Number(it.menu_items?.price) || 0;
    return {
      name,
      quantity,
      price,
      lineTotal: Math.round(quantity * price * 100) / 100,
    };
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://thespicegrille.com").replace(/\/$/, "");
  const trackingUrl = `${appUrl}/track/${order.id}`;

  const isPickup =
    order.shipping_method === "pickup" ||
    String(order.delivery_address || "").toLowerCase().includes("pickup");

  const shortId = order.id.slice(-6).toUpperCase();

  const dispatcher = order.delivery_assignments?.[0]?.dispatchers;

  return {
    orderId: order.id,
    shortId,
    status: order.status || "pending",
    totalAmount: Number(order.total_amount) || 0,
    subtotal: Number(order.subtotal) || 0,
    taxAmount: Number(order.tax_amount) || 0,
    deliveryFee: Number(order.delivery_fee ?? order.shipping_cost) || 0,
    serviceFee: Number(order.service_fee) || 0,
    smallOrderFee: Number(order.small_order_fee) || 0,
    discountAmount: Number(order.discount_amount) || 0,
    shippingMethod: order.shipping_method || (isPickup ? "pickup" : "delivery"),
    isPickup,
    deliveryAddress: customer.addressSummary || "Moorhead, MN",
    specialInstructions: order.special_instructions || undefined,
    customer,
    items,
    trackingUrl,
    createdAt: order.created_at || new Date().toISOString(),
    dispatcher: dispatcher ? { name: dispatcher.name, phone: dispatcher.phone } : undefined,
  };
}

/**
 * Triggers order placement notifications (Customer SMS + Customer Email + Admin Alert)
 */
export async function notifyOrderCreated(orderId: string): Promise<{ sms: boolean; email: boolean }> {
  console.log(`[Notifications] Initiating notifications for new order: ${orderId}`);
  const payload = await buildOrderNotificationPayload(orderId);

  if (!payload) {
    console.warn(`[Notifications] Cannot send notifications: order ${orderId} not found.`);
    return { sms: false, email: false };
  }

  let smsSent = false;
  let emailSent = false;

  const { shortId, totalAmount, customer, trackingUrl, isPickup } = payload;

  // 1. Send SMS via Bird.com
  if (customer.formattedPhone) {
    const fulfillmentText = isPickup ? "Pickup order ready shortly" : "Our kitchen is preparing your feast";
    const smsMessage = `Spice Grill: Thank you for your order #${shortId}! Total: $${totalAmount.toFixed(2)}. ${fulfillmentText}. Track live: ${trackingUrl}`;

    try {
      const res = await sendBirdSms({
        to: customer.formattedPhone,
        text: smsMessage,
        category: "transactional",
        reference: `order-${shortId}`,
      });
      smsSent = res.success;
    } catch (smsErr) {
      console.error("[Notifications] Error dispatching Bird SMS:", smsErr);
    }
  } else {
    console.log(`[Notifications] No valid customer phone found for order #${shortId}. SMS skipped.`);
  }

  // 2. Send Email via Resend
  if (customer.email) {
    try {
      const html = renderOrderConfirmationHtml(payload);
      const res = await sendResendEmail({
        to: customer.email,
        subject: `Your Spice Grill Order is Confirmed! (#${shortId})`,
        html,
      });
      emailSent = res.success;
    } catch (emailErr) {
      console.error("[Notifications] Error dispatching Resend Email:", emailErr);
    }
  } else {
    console.log(`[Notifications] No customer email found for order #${shortId}. Email skipped.`);
  }

  // 3. Optional Admin Alerts
  const adminPhone = process.env.ADMIN_NOTIFICATION_PHONE;
  if (adminPhone) {
    const adminSms = `Spice Grill Alert 🔔: New order #${shortId} received for $${totalAmount.toFixed(2)} from ${customer.name}. Check admin dashboard.`;
    sendBirdSms({
      to: adminPhone,
      text: adminSms,
      category: "transactional",
      reference: `admin-${shortId}`,
    }).catch((err) => console.warn("[Notifications] Failed admin SMS alert:", err));
  }

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail && adminEmail !== customer.email) {
    const html = renderOrderConfirmationHtml(payload);
    sendResendEmail({
      to: adminEmail,
      subject: `[Admin Alert] New Order #${shortId} ($${totalAmount.toFixed(2)})`,
      html,
    }).catch((err) => console.warn("[Notifications] Failed admin email alert:", err));
  }

  return { sms: smsSent, email: emailSent };
}

/**
 * Triggers status update notifications (Accepted, Preparing, Ready, Out for Delivery, Delivered, Cancelled)
 */
export async function notifyOrderStatusChanged(
  orderId: string,
  newStatus: string
): Promise<{ sms: boolean; email: boolean }> {
  console.log(`[Notifications] Order ${orderId} status changed to "${newStatus}"`);
  const payload = await buildOrderNotificationPayload(orderId);

  if (!payload) {
    return { sms: false, email: false };
  }

  const { shortId, customer, trackingUrl, isPickup, dispatcher } = payload;

  interface StatusText {
    label: string;
    description: string;
    smsText: string;
  }

  const statusConfigs: Record<string, StatusText> = {
    accepted: {
      label: "Order Accepted",
      description: "Our kitchen has accepted your order and scheduled it for preparation.",
      smsText: `Spice Grill: Order #${shortId} has been accepted by the kitchen! Track: ${trackingUrl}`,
    },
    preparing: {
      label: "Cooking in Kitchen",
      description: "Our chefs are cooking your dishes with fresh spices and care.",
      smsText: `Spice Grill: Chefs are now cooking your order #${shortId}! Track: ${trackingUrl}`,
    },
    ready: {
      label: isPickup ? "Ready for Pickup!" : "Ready & Packed",
      description: isPickup
        ? "Your hot meal is freshly packed! You can pick it up at Spice Grill (320 Red River Ave Ste D, Moorhead, MN)."
        : "Your order is packed and waiting for our delivery driver to collect.",
      smsText: isPickup
        ? `Spice Grill: Your order #${shortId} is READY for pickup at 320 Red River Ave Ste D, Moorhead, MN! See you soon!`
        : `Spice Grill: Order #${shortId} is freshly packed and ready for delivery driver pickup.`,
    },
    out_for_delivery: {
      label: "Out for Delivery",
      description: `Great news! Your order is on the way.${dispatcher?.name ? ` Your delivery driver is ${dispatcher.name}.` : ""}`,
      smsText: `Spice Grill: Order #${shortId} is OUT FOR DELIVERY! Driver is on the way. Track live: ${trackingUrl}`,
    },
    delivered: {
      label: "Delivered",
      description: "Your order has been delivered! Enjoy your authentic feast.",
      smsText: `Spice Grill: Order #${shortId} has been delivered! Enjoy your meal! Thank you for dining with Spice Grill.`,
    },
    cancelled: {
      label: "Order Cancelled",
      description: "Your order has been cancelled. If you believe this is an error, please contact the restaurant directly.",
      smsText: `Spice Grill: Order #${shortId} has been cancelled. Contact (701) 000-0000 for any questions.`,
    },
  };

  const config = statusConfigs[newStatus.toLowerCase()];
  if (!config) {
    console.log(`[Notifications] No customer notification required for status "${newStatus}".`);
    return { sms: false, email: false };
  }

  let smsSent = false;
  let emailSent = false;

  // SMS
  if (customer.formattedPhone) {
    try {
      const res = await sendBirdSms({
        to: customer.formattedPhone,
        text: config.smsText,
        category: "transactional",
        reference: `status-${shortId}-${newStatus}`,
      });
      smsSent = res.success;
    } catch (e) {
      console.error("[Notifications] SMS status error:", e);
    }
  }

  // Email
  if (customer.email) {
    try {
      const html = renderOrderStatusUpdateHtml(payload, config.label, config.description);
      const res = await sendResendEmail({
        to: customer.email,
        subject: `Update on Order #${shortId}: ${config.label}`,
        html,
      });
      emailSent = res.success;
    } catch (e) {
      console.error("[Notifications] Email status error:", e);
    }
  }

  return { sms: smsSent, email: emailSent };
}

/**
 * Diagnostics and test dispatch helper
 */
export async function sendTestNotification(options: {
  channel: "sms" | "email" | "both";
  recipient: string;
  message?: string;
}): Promise<{ smsResult?: any; emailResult?: any }> {
  const { channel, recipient, message } = options;
  const results: { smsResult?: any; emailResult?: any } = {};

  const testText = message || "Spice Grill: Test SMS notification via Bird.com API. Integration successful!";

  if (channel === "sms" || channel === "both") {
    results.smsResult = await sendBirdSms({
      to: recipient,
      text: testText,
      category: "service",
      reference: "test-notification",
    });
  }

  if (channel === "email" || channel === "both") {
    results.emailResult = await sendResendEmail({
      to: recipient,
      subject: "Spice Grill & Resend: Test Notification",
      html: renderTestEmailHtml(),
      text: testText,
    });
  }

  return results;
}

/**
 * Checks provider configuration status
 */
export function getNotificationConfigStatus() {
  return {
    bird: {
      configured: isBirdConfigured(),
      region: process.env.BIRD_REGION || "us1",
      senderId: process.env.BIRD_SENDER_ID || process.env.BIRD_ORIGINATOR || "SpiceGrill",
    },
    resend: {
      configured: isResendConfigured(),
      fromEmail: process.env.RESEND_FROM_EMAIL || "Spice Grill <onboarding@resend.dev>",
    },
  };
}
