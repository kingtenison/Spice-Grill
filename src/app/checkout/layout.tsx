import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | The Spice Grille",
  description: "Complete your order at The Spice Grille. Secure checkout for Afro-Caribbean cuisine pickup and delivery in Moorhead, MN.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
