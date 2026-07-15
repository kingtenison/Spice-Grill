import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found - The Spice Grille | Afro-Caribbean Cuisine Moorhead, MN",
  description: "The page you're looking for doesn't exist. Return to The Spice Grille homepage to explore our Afro-Caribbean menu.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <div className="text-red-600 font-heading text-[120px] leading-none font-bold mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          Looks like this dish isn&apos;t on the menu. Let&apos;s get you back to something delicious.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-colors"
        >
          Back to Homepage
        </Link>
      </div>
    </div>
  );
}
