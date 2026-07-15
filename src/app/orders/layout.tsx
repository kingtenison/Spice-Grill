import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders | The Spice Grille",
  description: "View your order history from The Spice Grille. Track past and current orders of Afro-Caribbean cuisine in Moorhead, MN.",
  robots: { index: false, follow: true },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
