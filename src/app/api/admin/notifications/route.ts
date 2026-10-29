import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getNotificationConfigStatus,
  sendBirdSms,
  sendResendEmail,
  sendTestNotification,
  renderCampaignHtml,
} from "@/lib/notifications/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "employee"].includes(profile.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const status = getNotificationConfigStatus();
    return NextResponse.json({ status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "employee"].includes(profile.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { action, recipient, message, subject, promoCode, title } = body;

    // Action 1: Test SMS (Bird.com)
    if (action === "test_sms") {
      if (!recipient) {
        return NextResponse.json({ error: "Recipient phone number is required" }, { status: 400 });
      }
      const result = await sendBirdSms({
        to: recipient,
        text: message || "Spice Grill: Test SMS notification via Bird.com. SMS setup verified successfully!",
        category: "service",
        reference: "test-sms-manual",
      });
      return NextResponse.json({ result });
    }

    // Action 2: Test Email (Resend)
    if (action === "test_email") {
      if (!recipient) {
        return NextResponse.json({ error: "Recipient email address is required" }, { status: 400 });
      }
      const result = await sendResendEmail({
        to: recipient,
        subject: subject || "Spice Grill: Test Email Notification (Resend)",
        html: `
          <div style="font-family: sans-serif; padding: 24px; background: #f8fafc;">
            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
              <h2 style="color: #dc2626; margin-top: 0;">Spice Grill Email Connected!</h2>
              <p style="color: #334155;">${message || "This email confirms your Resend API integration is functioning properly."}</p>
              <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Spice Grill Moorhead, MN • Sent via Resend</p>
            </div>
          </div>`,
        text: message || "Spice Grill test email via Resend.",
      });
      return NextResponse.json({ result });
    }

    // Action 3: Broadcast Campaign (SMS + Email)
    if (action === "broadcast_campaign") {
      const results: { smsCount: number; emailCount: number; errors: string[] } = {
        smsCount: 0,
        emailCount: 0,
        errors: [],
      };

      const emailHtml = renderCampaignHtml(
        title || "Special Feast Announcement",
        message || "Enjoy an authentic gourmet dining experience at Spice Grill.",
        promoCode
      );

      // If specific recipient passed
      if (recipient) {
        if (recipient.includes("@")) {
          const res = await sendResendEmail({
            to: recipient,
            subject: title || "Spice Grill Announcement",
            html: emailHtml,
          });
          if (res.success) results.emailCount++;
          else if (res.error) results.errors.push(res.error);
        } else {
          const res = await sendBirdSms({
            to: recipient,
            text: `Spice Grill: ${title ? `${title} - ` : ""}${message}${promoCode ? ` Use code: ${promoCode}` : ""}`,
            category: "marketing",
          });
          if (res.success) results.smsCount++;
          else if (res.error) results.errors.push(res.error);
        }
      }

      return NextResponse.json({ success: true, results });
    }

    return NextResponse.json({ error: "Invalid action. Supported: test_sms, test_email, broadcast_campaign" }, { status: 400 });
  } catch (error: any) {
    console.error("Notifications API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
