import Link from "next/link";
import { CalendarDays, Clock, Users } from "lucide-react";

export default function ReservationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container px-4 pt-24 pb-12 mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Reservations</h1>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
          <p className="text-gray-600 text-lg">
            Reserve your table at The Spice Grille for an unforgettable Afro-Caribbean dining experience.
          </p>
          <div className="flex items-center gap-4">
            <CalendarDays className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-gray-900">Book a Table</p>
              <p className="text-gray-600">Call us at (123) 456-7890</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Clock className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-gray-900">Hours</p>
              <p className="text-gray-600">Mon–Sun: 11:00 AM – 10:00 PM</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Users className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-gray-900">Groups</p>
              <p className="text-gray-600">Parties of 6+ welcome</p>
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
