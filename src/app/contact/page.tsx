import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container px-4 pt-24 pb-12 mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Phone className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-gray-900">Phone</p>
              <p className="text-gray-600">(218) 477-1112</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Mail className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-gray-900">Email</p>
              <p className="text-gray-600">tsgmoorhead@gmail.com</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <MapPin className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-gray-900">Location</p>
              <p className="text-gray-600">320 Red River Ave Ste D, Moorhead, MN 56560-8302</p>
            </div>
          </div>
          <div className="pt-4">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
            >
              Order Now
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
