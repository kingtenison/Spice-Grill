import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account | The Spice Grille",
  description: "Manage your The Spice Grille account, view order history, and update preferences for Afro-Caribbean cuisine in Moorhead, MN.",
  robots: { index: false, follow: true },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
