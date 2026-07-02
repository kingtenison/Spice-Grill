import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { RouteAwareNav } from "@/components/layout/RouteAwareNav";

export const metadata: Metadata = {
  title: "The Spice Grille - Afro-Caribbean Cuisine | Moorhead, MN",
  description: "The Spice Grille brings a redefined mix of Afro-Caribbean cuisine to the Fargo-Moorhead area. Wood-fired grill, bold flavors, outdoor seating. 28 Moorhead Center Mall Avenue, Moorhead, MN.",
  keywords: "The Spice Grille, Afro-Caribbean cuisine, Moorhead MN, Fargo, wood-fired grill, African restaurant, Caribbean food, dine-in, curbside pickup",
  authors: [{ name: "The Spice Grille" }],
  creator: "The Spice Grille",
  publisher: "The Spice Grille",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thespicegrillemn.com",
    title: "The Spice Grille - Afro-Caribbean Cuisine | Moorhead, MN",
    description: "Bringing you a redefined mix of Afro-Caribbean cuisine to the Fargo-Moorhead area.",
    siteName: "The Spice Grille",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Spice Grille - Afro-Caribbean Cuisine | Moorhead, MN",
    description: "Bringing you a redefined mix of Afro-Caribbean cuisine to the Fargo-Moorhead area.",
    creator: "@tsgmoorhead",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ef4444" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Apple iOS Specific */}
        <link rel="apple-touch-icon" href="/Spice_Logo.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Spice Grille" />
        
        {/* Fonts */}
        <link href="https://fonts.cdnfonts.com/css/justice-love" rel="stylesheet" />
        <link href="https://fonts.cdnfonts.com/css/nexa" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <Navbar />
        <RouteAwareNav />
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}

