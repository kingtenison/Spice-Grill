import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "Read stories, recipes, and culinary news from The Spice Grille kitchen in Moorhead, MN.",
    openGraph: {
      title: `${slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} | The Spice Grille Blog`,
      description: "Read stories and recipes from The Spice Grille kitchen.",
    },
  };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
