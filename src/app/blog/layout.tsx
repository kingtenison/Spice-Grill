import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog & Stories",
  description:
    "Explore stories, recipes, and culinary news from The Spice Grille kitchen. Learn about Afro-Caribbean cuisine, West African cooking traditions, and what's happening at our Moorhead restaurant.",
  openGraph: {
    title: "Blog & Stories - The Spice Grille | Afro-Caribbean Cuisine",
    description: "Explore stories, recipes, and news from The Spice Grille kitchen in Moorhead, MN.",
    url: "https://thespicegrillemn.com/blog",
  },
  twitter: {
    title: "Blog & Stories - The Spice Grille",
    description: "Explore stories, recipes, and news from The Spice Grille kitchen.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
