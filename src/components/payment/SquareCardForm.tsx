"use client";

import { useEffect, useRef, useState } from "react";

export type SquareCardFormHandle = {
  tokenize: (verificationDetails?: Record<string, unknown>) => Promise<string>;
};

interface SquareCardFormProps {
  onReady: (handle: SquareCardFormHandle) => void;
  onError?: (message: string) => void;
}

declare global {
  interface Window {
    Square?: {
      payments: (applicationId: string, locationId?: string) => SquarePayments;
    };
  }
}

interface SquarePayments {
  card: () => Promise<SquareCard>;
}

interface SquareCard {
  attach: (containerSelector: string) => Promise<void>;
  destroy: () => void;
  tokenize: (verificationDetails?: Record<string, unknown>) => Promise<SquareTokenizeResult>;
}

interface SquareTokenizeResult {
  status: string;
  token?: string;
  errors?: { code?: string; detail?: string; field?: string }[];
}

// Sandbox and production load different SDK builds:
// https://developer.squareup.com/docs/web-payments/overview
const SANDBOX_SDK_URL = "https://sandbox.web.squarecdn.com/v1/square.js";
const PRODUCTION_SDK_URL = "https://web.squarecdn.com/v1/square.js";
const CARD_CONTAINER_ID = "square-card-container";

function getSquareSdkUrl(): string {
  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || "";
  return applicationId.startsWith("sandbox") ? SANDBOX_SDK_URL : PRODUCTION_SDK_URL;
}

function loadSquareScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Square SDK can only load in the browser"));
      return;
    }
    if (window.Square) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = getSquareSdkUrl();
    script.async = true;
    script.onload = () =>
      window.Square ? resolve() : reject(new Error("Square SDK failed to initialize"));
    script.onerror = () => reject(new Error("Failed to load Square SDK"));
    document.head.appendChild(script);
  });
}

export default function SquareCardForm({ onReady, onError }: SquareCardFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<SquareCard | null>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  }, [onReady, onError]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
        if (!applicationId) {
          throw new Error("Square is not configured (missing application ID)");
        }

        await loadSquareScript();
        if (cancelled || !window.Square) return;

        const payments = window.Square.payments(applicationId, locationId);
        const card = await payments.card();
        if (cancelled) return;

        cardRef.current = card;
        await card.attach(`#${CARD_CONTAINER_ID}`);
        if (cancelled) return;

        setIsLoading(false);
        onReadyRef.current({
          tokenize: async (verificationDetails?: Record<string, unknown>) => {
            const result = await card.tokenize(verificationDetails);
            if (result.status === "OK") {
              return result.token as string;
            }
            const detail =
              result.errors?.[0]?.detail ||
              "Unable to process your card. Please check the card details and try again.";
            throw new Error(detail);
          },
        });
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "Unable to initialize card payment. Please try again.";
        setError(message);
        onErrorRef.current?.(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      try {
        cardRef.current?.destroy?.();
      } catch {
        /* already destroyed */
      }
      cardRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-3">
      {isLoading && (
        <p className="text-sm text-gray-500">Loading secure card entry...</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div id={CARD_CONTAINER_ID} ref={containerRef} />
    </div>
  );
}
