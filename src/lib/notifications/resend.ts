import { Resend } from "resend";
import { OrderNotificationPayload, SendEmailResult } from "./types";

let resendInstance: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) return null;
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getResendFromEmail(): string {
  // Uses verified domain thespicegrille.com
  return process.env.RESEND_FROM_EMAIL || "Spice Grill <orders@thespicegrille.com>";
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Sends an email using the Resend SDK.
 */
export async function sendResendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, text, replyTo } = options;
  const resend = getResendClient();

  if (!resend) {
    console.warn(
      `[Resend Email] RESEND_API_KEY is not configured. Email skipped (Dry Run). To: ${to}, Subject: "${subject}"`
    );
    return {
      success: false,
      provider: "mock",
      skipped: true,
      error: "RESEND_API_KEY is not configured. Please set RESEND_API_KEY in your environment.",
    };
  }

  const from = getResendFromEmail();
  const recipientList = Array.isArray(to) ? to : [to];

  // Filter out empty recipients
  const validRecipients = recipientList.filter((r) => Boolean(r && r.includes("@")));
  if (validRecipients.length === 0) {
    const errorMsg = "No valid email recipients specified.";
    console.error(`[Resend Email] ${errorMsg}`);
    return {
      success: false,
      provider: "mock",
      error: errorMsg,
    };
  }

  try {
    console.log(`[Resend Email] Sending email "${subject}" from "${from}" to ${validRecipients.join(", ")}...`);

    const { data, error } = await resend.emails.send({
      from,
      to: validRecipients,
      subject,
      html,
      ...(text ? { text } : {}),
      ...(replyTo ? { reply_to: replyTo } : {}),
    });

    if (error) {
      console.error("[Resend Email] ❌ Resend API returned error:", error);
      return {
        success: false,
        provider: "resend",
        error: error.message || "Failed to send email via Resend",
      };
    }

    console.log(`[Resend Email] ✅ Email sent successfully. ID: ${data?.id}`);
    return {
      success: true,
      provider: "resend",
      id: data?.id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error contacting Resend";
    console.error("[Resend Email] ❌ Exception during send:", message);
    return {
      success: false,
      provider: "resend",
      error: message,
    };
  }
}

/**
 * Generates responsive, brand-styled HTML for Order Confirmation
 */
export function renderOrderConfirmationHtml(payload: OrderNotificationPayload): string {
  const {
    shortId,
    customer,
    items,
    subtotal,
    deliveryFee,
    serviceFee,
    taxAmount,
    discountAmount,
    totalAmount,
    isPickup,
    deliveryAddress,
    specialInstructions,
    trackingUrl,
  } = payload;

  const itemRowsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 600; font-size: 14px;">
          ${item.quantity}x ${item.name}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: 700; font-size: 14px;">
          $${item.lineTotal.toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spice Grill Order #${shortId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #b91c1c 0%, #ea580c 100%); padding: 32px 28px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">SPICE GRILL</h1>
              <p style="margin: 6px 0 0; color: #fed7aa; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Moorhead Authentic Flavors</p>
            </td>
          </tr>

          <!-- Confirmation Hero -->
          <tr>
            <td style="padding: 32px 28px 20px; text-align: center;">
              <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 12px; font-weight: 800; text-transform: uppercase; padding: 6px 14px; border-radius: 9999px; margin-bottom: 12px;">
                ✓ Order Confirmed
              </div>
              <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a;">Thank you, ${customer.name || "Customer"}!</h2>
              <p style="margin: 8px 0 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                We have received your order <strong>#${shortId}</strong> and our chefs are getting ready to prepare your feast.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 28px 24px;">
              <a href="${trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 28px; border-radius: 14px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);">
                Track Order Live &rarr;
              </a>
            </td>
          </tr>

          <!-- Fulfillment Details -->
          <tr>
            <td style="padding: 0 28px 20px;">
              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 0.5px;">
                      ${isPickup ? "Pickup Location" : "Delivery Destination"}
                    </p>
                    <p style="margin: 4px 0 0; font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.4;">
                      ${isPickup ? "Spice Grill • 320 Red River Ave Ste D, Moorhead, MN" : deliveryAddress}
                    </p>
                    ${specialInstructions ? `<p style="margin: 8px 0 0; font-size: 12px; color: #475569; font-style: italic;"><strong>Note:</strong> ${specialInstructions}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Ordered Table -->
          <tr>
            <td style="padding: 0 28px 24px;">
              <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; font-weight: 800; color: #475569; letter-spacing: 0.5px;">Order Summary</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                ${itemRowsHtml}
              </table>

              <!-- Totals -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 16px;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b; font-size: 13px;">Subtotal</td>
                  <td style="padding: 4px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 13px;">$${subtotal.toFixed(2)}</td>
                </tr>
                ${
                  deliveryFee > 0
                    ? `<tr>
                  <td style="padding: 4px 0; color: #64748b; font-size: 13px;">Delivery Fee</td>
                  <td style="padding: 4px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 13px;">$${deliveryFee.toFixed(2)}</td>
                </tr>`
                    : ""
                }
                ${
                  serviceFee > 0
                    ? `<tr>
                  <td style="padding: 4px 0; color: #64748b; font-size: 13px;">Service Fee</td>
                  <td style="padding: 4px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 13px;">$${serviceFee.toFixed(2)}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 4px 0; color: #64748b; font-size: 13px;">Sales Tax</td>
                  <td style="padding: 4px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 13px;">$${taxAmount.toFixed(2)}</td>
                </tr>
                ${
                  discountAmount > 0
                    ? `<tr>
                  <td style="padding: 4px 0; color: #16a34a; font-size: 13px; font-weight: 700;">Discounts & Rewards</td>
                  <td style="padding: 4px 0; text-align: right; color: #16a34a; font-weight: 700; font-size: 13px;">-$${discountAmount.toFixed(2)}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 12px 0 0; color: #0f172a; font-size: 17px; font-weight: 900; border-top: 2px solid #0f172a;">Total Amount</td>
                  <td style="padding: 12px 0 0; text-align: right; color: #dc2626; font-size: 18px; font-weight: 900; border-top: 2px solid #0f172a;">$${totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                Spice Grill • 320 Red River Ave Ste D, Moorhead, MN<br>
                Need help with your order? Call us at <strong>(701) 000-0000</strong> or reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates responsive HTML for Order Status Updates
 */
export function renderOrderStatusUpdateHtml(
  payload: OrderNotificationPayload,
  statusLabel: string,
  statusDescription: string
): string {
  const { shortId, customer, trackingUrl, isPickup, dispatcher } = payload;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order #${shortId} Status Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #b91c1c 0%, #ea580c 100%); padding: 28px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900;">SPICE GRILL</h1>
              <p style="margin: 4px 0 0; color: #fed7aa; font-size: 12px; font-weight: 700; text-transform: uppercase;">Order Status Update</p>
            </td>
          </tr>

          <!-- Status Card -->
          <tr>
            <td style="padding: 32px 28px; text-align: center;">
              <div style="display: inline-block; background-color: #fef3c7; border: 1px solid #fde68a; color: #92400e; font-size: 12px; font-weight: 800; text-transform: uppercase; padding: 6px 14px; border-radius: 9999px; margin-bottom: 14px;">
                Status: ${statusLabel}
              </div>
              <h2 style="margin: 0; font-size: 22px; font-weight: 900; color: #0f172a;">Hello ${customer.name || "Customer"},</h2>
              <p style="margin: 12px 0 0; color: #334155; font-size: 15px; line-height: 1.6;">
                ${statusDescription}
              </p>

              ${
                dispatcher?.name
                  ? `<div style="margin: 20px 0; padding: 14px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; text-align: left;">
                      <p style="margin: 0; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #1e40af;">Assigned Dispatcher</p>
                      <p style="margin: 4px 0 0; font-size: 14px; font-weight: 700; color: #1e3a8a;">${dispatcher.name} ${dispatcher.phone ? `(${dispatcher.phone})` : ""}</p>
                    </div>`
                  : ""
              }

              <div style="margin-top: 28px;">
                <a href="${trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 28px; border-radius: 14px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);">
                  View Live Tracking &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Order #${shortId} • Spice Grill Moorhead<br>
                ${isPickup ? "Pickup at 320 Red River Ave Ste D, Moorhead, MN" : "Thank you for dining with us!"}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates promotional campaign HTML
 */
export function renderCampaignHtml(title: string, message: string, promoCode?: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thespicegrille.com";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #b91c1c 0%, #ea580c 100%); padding: 36px 28px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 900;">SPICE GRILL</h1>
              <p style="margin: 6px 0 0; color: #fed7aa; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Special Announcement</p>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 32px 28px; text-align: center;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 900; color: #0f172a;">${title}</h2>
              <p style="margin: 16px 0 0; color: #475569; font-size: 15px; line-height: 1.6;">
                ${message}
              </p>

              ${
                promoCode
                  ? `<div style="margin: 24px auto; max-width: 260px; padding: 14px; background-color: #fef2f2; border: 2px dashed #f87171; border-radius: 12px;">
                      <p style="margin: 0; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #b91c1c;">Use Promo Code</p>
                      <p style="margin: 4px 0 0; font-size: 20px; font-weight: 900; color: #dc2626; letter-spacing: 2px;">${promoCode}</p>
                    </div>`
                  : ""
              }

              <div style="margin-top: 28px;">
                <a href="${appUrl}/menu" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);">
                  Explore Menu & Order &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Spice Grill • 320 Red River Ave Ste D, Moorhead, MN<br>
                You received this email because you are a registered patron of Spice Grill.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Diagnostic test email template
 */
export function renderTestEmailHtml(): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background-color: #f8fafc; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
    <h2 style="color: #dc2626; margin-top: 0;">🔥 Spice Grill & Resend Connected</h2>
    <p style="color: #334155;">This is a test notification confirming that Resend email delivery is properly configured and functioning!</p>
    <p style="color: #64748b; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
}

