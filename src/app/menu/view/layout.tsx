import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR Menu Viewer",
  description: "Browse The Spice Grille's full menu with our digital menu viewer. Authentic Afro-Caribbean cuisine in Moorhead, MN.",
  robots: { index: true, follow: true },
};

export default function MenuViewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
