import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { RouteAwareNav } from "@/components/layout/RouteAwareNav";
import { DefaultSeoSchema } from "@/components/seo/JsonLd";

const siteUrl = "https://www.thespicegrille.com";
const siteName = "The Spice Grille";
const defaultTitle = "The Spice Grille - Afro-Caribbean Cuisine | Moorhead, MN";
const defaultDescription =
  "The Spice Grille brings a redefined mix of Afro-Caribbean cuisine to the Fargo-Moorhead area. Wood-fired grill, bold flavors, outdoor seating. 320 Red River Ave Ste D, Moorhead, MN.";
const ogImage = `${siteUrl}/Spice_Logo.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    "The Spice Grille",
    "Afro-Caribbean cuisine",
    "Moorhead MN restaurant",
    "Fargo African food",
    "West African restaurant",
    "Ghanaian food Minnesota",
    "wood-fired grill",
    "African restaurant Fargo-Moorhead",
    "Caribbean food Minnesota",
    "jollof rice",
    "waakye",
    "banku and tilapia",
    "African catering Moorhead",
    "dine-in Moorhead",
    "curbside pickup Moorhead",
  ],
  authors: [{ name: "The Spice Grille", url: siteUrl }],
  creator: "The Spice Grille",
  publisher: "The Spice Grille",
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: ogImage,
        width: 512,
        height: 512,
        alt: "The Spice Grille Logo - Afro-Caribbean Cuisine Moorhead MN",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [ogImage],
    creator: "@tsgmoorhead",
    site: "@tsgmoorhead",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "googled477b98dc47e7837",
  },
  category: "food",
  classification: "Restaurant",
  other: {
    "geo.region": "US-MN",
    "geo.placename": "Moorhead",
    "geo.position": "46.8739;-96.7676",
    "ICBM": "46.8739, -96.7676",
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
        
        {/* DNS Prefetch / Preconnect for performance */}
        <link rel="dns-prefetch" href="//fonts.cdnfonts.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.cdnfonts.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        
        {/* Fonts */}
        <link href="https://fonts.cdnfonts.com/css/justice-love" rel="stylesheet" />
        <link href="https://fonts.cdnfonts.com/css/nexa" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />

        {/* JSON-LD Structured Data */}
        <DefaultSeoSchema />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <Navbar />
        <RouteAwareNav />
        <main className="flex-grow pb-mobile-nav">
          {children}
        </main>
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('/sw.js', { scope: '/' });
}`}
        </Script>
      </body>
    </html>
  );
}

