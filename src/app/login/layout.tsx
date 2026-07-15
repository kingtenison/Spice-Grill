import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | The Spice Grille",
  description: "Sign in to your The Spice Grille account to order Afro-Caribbean cuisine for pickup or delivery in Moorhead, MN.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
