import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

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
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">{children}</body>
    </html>
  );
}