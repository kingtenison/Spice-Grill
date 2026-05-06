"use client";

import { ChefHat, ClipboardList, History, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";

interface EmployeeShellProps {
  children: React.ReactNode;
  profile: { role: string; full_name: string; email?: string } | null;
}

export default function EmployeeShell({ children, profile }: EmployeeShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-red-50/20 flex flex-col">
      {/* Employee Navbar */}
      <nav className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-gray-900">Staff Panel</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            href="/employee" 
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              pathname === "/employee" ? "bg-red-600 text-white shadow-lg shadow-red-500/10" : "hover:bg-red-50 text-gray-600"
            )}
          >
            <ClipboardList className="w-4 h-4" /> Active
          </Link>
          <Link 
            href="/employee/history" 
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              pathname === "/employee/history" ? "bg-red-600 text-white shadow-lg shadow-red-500/10" : "hover:bg-red-50 text-gray-600"
            )}
          >
            <History className="w-4 h-4" /> History
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900">{profile?.full_name || "Staff"}</p>
            <p className="text-[10px] text-gray-600 uppercase font-bold">Employee</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="p-2 text-gray-600 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </nav>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Sticky Bar */}
      <div className="md:hidden sticky bottom-0 bg-white border-t border-gray-200 p-2 flex justify-around">
        <Link href="/employee" className="p-3 text-red-600"><ClipboardList /></Link>
        <Link href="/employee/history" className="p-3 text-gray-600"><History /></Link>
        <form action={signOut}>
          <button type="submit" className="p-3 text-gray-600"><LogOut /></button>
        </form>
      </div>
    </div>
  );
}
