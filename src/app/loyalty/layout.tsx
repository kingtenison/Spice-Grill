import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loyalty Rewards | The Spice Grille",
  description: "Join The Spice Grille loyalty program. Earn points on every order and unlock exclusive rewards at our Afro-Caribbean restaurant in Moorhead, MN.",
  openGraph: {
    title: "Loyalty Rewards - The Spice Grille | Afro-Caribbean Cuisine",
    description: "Earn points on every order and unlock exclusive rewards at The Spice Grille in Moorhead, MN.",
    url: "https://thespicegrillemn.com/loyalty",
  },
  twitter: {
    title: "Loyalty Rewards - The Spice Grille",
    description: "Earn points on every order and unlock exclusive rewards.",
  },
};

export default function LoyaltyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
