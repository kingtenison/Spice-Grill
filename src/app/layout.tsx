import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { RouteAwareNav } from "@/components/layout/RouteAwareNav";

export const metadata: Metadata = {
  title: "Spice Grill - Premium Wood-Fired Dining | USA",
  description: "Spice Grill brings the art of wood-fired cooking to life. Experience bold flavors, premium cuts, and unforgettable dining. Located in the USA. View menu, make reservations, order online.",
  keywords: "Spice Grill, wood-fired grill, steakhouse, American cuisine, restaurant, dining, BBQ, grilled meats, fine dining, USA",
  authors: [{ name: "Spice Grill" }],
  creator: "Spice Grill",
  publisher: "Spice Grill",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://spicegrill.com",
    title: "Spice Grill - Premium Wood-Fired Dining",
    description: "Experience the art of wood-fired cooking at Spice Grill. Bold flavors, perfect flame, unforgettable moments.",
    siteName: "Spice Grill",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spice Grill - Premium Wood-Fired Dining",
    description: "Experience the art of wood-fired cooking at Spice Grill.",
    creator: "@spicegrill",
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
    >
      <head>
        <link href="https://fonts.cdnfonts.com/css/justice-love" rel="stylesheet" />
        <link href="https://fonts.cdnfonts.com/css/codec-warm-trial" rel="stylesheet" />
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