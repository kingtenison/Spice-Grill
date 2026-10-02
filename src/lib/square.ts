import { SquareClient, SquareEnvironment } from "square";

let cachedClient: SquareClient | null = null;

export function getSquareClient(): SquareClient {
  if (cachedClient) return cachedClient;

  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("SQUARE_ACCESS_TOKEN is not configured");
  }

  const environment =
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;

  cachedClient = new SquareClient({ token, environment });
  return cachedClient;
}

export function isSquareConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID &&
      process.env.SQUARE_ACCESS_TOKEN
  );
}

export const SQUARE_CURRENCY = "USD";
