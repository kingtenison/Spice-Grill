import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Tracking",
  description:
    "Track your The Spice Grille order in real-time. Live updates from kitchen to delivery for Afro-Caribbean cuisine in Moorhead, MN.",
  robots: { index: false, follow: true },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
