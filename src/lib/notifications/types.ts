export type OrderStatusType =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface CustomerContact {
  name: string;
  email: string | null;
  phone: string | null;
  formattedPhone: string | null;
  addressSummary?: string;
}

export interface NotificationOrderItem {
  name: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface OrderNotificationPayload {
  orderId: string;
  shortId: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  serviceFee: number;
  smallOrderFee: number;
  discountAmount: number;
  shippingMethod: string;
  isPickup: boolean;
  deliveryAddress: string;
  specialInstructions?: string;
  customer: CustomerContact;
  items: NotificationOrderItem[];
  trackingUrl: string;
  createdAt: string;
  dispatcher?: {
    name?: string;
    phone?: string;
  };
}

export interface SendSmsResult {
  success: boolean;
  provider: "bird_platform" | "bird_rest" | "mock";
  messageId?: string;
  error?: string;
  skipped?: boolean;
}

export interface SendEmailResult {
  success: boolean;
  provider: "resend" | "mock";
  id?: string;
  error?: string;
  skipped?: boolean;
}

