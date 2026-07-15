import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Full Menu",
  description:
    "Browse The Spice Grille's full menu of authentic Afro-Caribbean cuisine. From jollof rice and waakye to grilled tilapia and egusi soup — bold West African flavors in Moorhead, MN.",
  openGraph: {
    title: "Menu - The Spice Grille | Afro-Caribbean Cuisine Moorhead, MN",
    description:
      "Browse our full menu of Afro-Caribbean dishes. Jollof rice, waakye, banku, grilled tilapia, egusi soup, and more.",
    url: "https://www.thespicegrille.com/menu",
  },
  twitter: {
    title: "Menu - The Spice Grille | Afro-Caribbean Cuisine",
    description: "Browse our full menu of Afro-Caribbean dishes in Moorhead, MN.",
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
