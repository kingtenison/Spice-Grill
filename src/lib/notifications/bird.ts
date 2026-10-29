import { SendSmsResult } from "./types";

/**
 * Normalizes any raw phone number string into E.164 standard (e.g., +14155550100).
 * Defaults to North American (+1) formatting for standard 10-digit numbers.
 */
export function formatToE164(raw: string | null | undefined, defaultCountryCode = "1"): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const startsWithPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) return null;

  if (startsWithPlus) {
    return `+${digits}`;
  }

  // 10 digits -> US/Canada (+1)
  if (digits.length === 10) {
    return `+${defaultCountryCode}${digits}`;
  }

  // 11 digits starting with 1 -> North America (+1)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // International number without '+'
  if (digits.length >= 11) {
    return `+${digits}`;
  }

  return `+${defaultCountryCode}${digits}`;
}

export function isBirdConfigured(): boolean {
  return Boolean(process.env.BIRD_API_KEY || process.env.MESSAGEBIRD_API_KEY);
}

export function getBirdSenderId(): string {
  // Alphanumeric sender ID max 11 chars or valid E.164 phone
  return (
    process.env.BIRD_SENDER_ID ||
    process.env.BIRD_ORIGINATOR ||
    process.env.BIRD_FROM ||
    "SpiceGrill"
  ).slice(0, 11);
}

export interface SendBirdSmsOptions {
  to: string;
  text: string;
  senderId?: string;
  category?: "transactional" | "marketing" | "authentication" | "service";
  reference?: string;
}

/**
 * Dispatches an SMS message using Bird.com (formerly MessageBird).
 * Intelligently supports both the modern Bird Platform API and the MessageBird REST API.
 */
export async function sendBirdSms(options: SendBirdSmsOptions): Promise<SendSmsResult> {
  const { to, text, reference } = options;
  const apiKey = (process.env.BIRD_API_KEY || process.env.MESSAGEBIRD_API_KEY || "").trim();

  if (!apiKey) {
    console.warn(
      `[Bird SMS] BIRD_API_KEY is not configured. SMS skipped (Dry Run). To: ${to}, Message: "${text.slice(0, 40)}..."`
    );
    return {
      success: false,
      provider: "mock",
      skipped: true,
      error: "BIRD_API_KEY is not configured. Please set BIRD_API_KEY in your environment.",
    };
  }

  const e164Recipient = formatToE164(to);
  if (!e164Recipient) {
    const errorMsg = `Invalid recipient phone number: "${to}"`;
    console.error(`[Bird SMS] ${errorMsg}`);
    return {
      success: false,
      provider: "mock",
      error: errorMsg,
    };
  }

  const senderId = (options.senderId || getBirdSenderId()).trim();
  const region = (process.env.BIRD_REGION || "us1").toLowerCase();
  const apiType = (process.env.BIRD_API_TYPE || "auto").toLowerCase();

  // Try Bird Platform API first unless specified as legacy rest
  if (apiType !== "rest") {
    try {
      const platformEndpoint = `https://${region}.platform.bird.com/v1/sms/messages`;
      console.log(`[Bird SMS] Sending SMS via Bird Platform (${platformEndpoint}) to ${e164Recipient}...`);

      const response = await fetch(platformEndpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          to: e164Recipient,
          from: senderId,
          text: text,
          category: options.category || "transactional",
          ...(reference ? { reference } : {}),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Bird SMS] ✅ SMS sent successfully via Bird Platform. ID: ${data.id || "ok"}`);
        return {
          success: true,
          provider: "bird_platform",
          messageId: data.id,
        };
      }

      const status = response.status;
      const errorJson = await response.json().catch(() => null);
      console.warn(`[Bird SMS] Bird Platform returned status ${status}:`, errorJson);

      const birdErrorMsg =
        errorJson?.error?.message ||
        errorJson?.title ||
        errorJson?.detail ||
        errorJson?.message ||
        `HTTP ${status}`;

      // If the error is not an auth mismatch (401), return the Bird platform error directly
      if (status !== 401 && status !== 404) {
        return {
          success: false,
          provider: "bird_platform",
          error: birdErrorMsg,
        };
      }
    } catch (platformErr: unknown) {
      console.warn("[Bird SMS] Bird Platform request failed, attempting REST fallback:", platformErr);
    }
  }

  // Fallback: MessageBird REST API
  try {
    const restEndpoint = "https://rest.messagebird.com/messages";
    console.log(`[Bird SMS] Sending SMS via MessageBird REST API to ${e164Recipient}...`);

    const authHeader = apiKey.toLowerCase().startsWith("accesskey ") ? apiKey : `AccessKey ${apiKey}`;

    const response = await fetch(restEndpoint, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        recipients: [e164Recipient],
        originator: senderId,
        body: text,
        ...(reference ? { reference } : {}),
      }),
    });

    const data = await response.json().catch(() => null);

    if (response.ok) {
      console.log(`[Bird SMS] ✅ SMS sent successfully via MessageBird REST API. ID: ${data?.id || "ok"}`);
      return {
        success: true,
        provider: "bird_rest",
        messageId: data?.id,
      };
    }

    const errorDetails = data?.errors?.[0]?.description || data?.message || `HTTP ${response.status}`;
    console.error(`[Bird SMS] ❌ MessageBird REST API failed: ${errorDetails}`);
    return {
      success: false,
      provider: "bird_rest",
      error: errorDetails,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to Bird API";
    console.error("[Bird SMS] ❌ Network error:", message);
    return {
      success: false,
      provider: "bird_rest",
      error: message,
    };
  }
}

