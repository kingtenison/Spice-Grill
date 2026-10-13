"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  ExternalLink,
  Users as UsersIcon,
  ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  created_at: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/customers");
        const data = await res.json();
        setCustomers(data.customers || []);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Customers CRM</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
              {filteredCustomers.length}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">Manage guest records, customer loyalty contacts, and order profiles.</p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 font-medium text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
          <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No customers found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {filteredCustomers.map((customer) => (
              <div 
                key={customer.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center font-bold text-red-600 text-sm shrink-0">
                    {customer.full_name?.[0]?.toUpperCase() || "C"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                      {customer.full_name || "Guest Customer"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium">{customer.phone}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  {customer.phone ? (
                    <a
                      href={`tel:${customer.phone}`}
                      className="flex-1 min-h-[42px] px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call Customer
                    </a>
                  ) : null}
                  <Link
                    href={`/admin/orders?q=${encodeURIComponent(customer.full_name || "")}`}
                    className="flex-1 min-h-[42px] px-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    View Orders
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Registration Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center font-bold text-red-600 text-xs shrink-0">
                          {customer.full_name?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{customer.full_name || "—"}</p>
                          {customer.email && <p className="text-xs text-slate-400">{customer.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {customer.phone ? (
                        <a href={`tel:${customer.phone}`} className="hover:text-red-600 transition-colors">
                          {customer.phone}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(customer.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {customer.phone && (
                          <a
                            href={`tel:${customer.phone}`}
                            className="p-2 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Call customer"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          href={`/admin/orders?q=${encodeURIComponent(customer.full_name || "")}`}
                          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                          title="View customer orders"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}