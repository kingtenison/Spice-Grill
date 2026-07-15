import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart | The Spice Grille",
  description: "Review your order from The Spice Grille. Authentic Afro-Caribbean cuisine for pickup or delivery in Moorhead, MN.",
  robots: { index: false, follow: true },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
