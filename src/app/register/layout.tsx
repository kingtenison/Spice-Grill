import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | The Spice Grille",
  description: "Create your The Spice Grille account to order authentic Afro-Caribbean cuisine for pickup or delivery in Moorhead, MN.",
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
