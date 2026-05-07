"use client";

import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { BottomNav } from "@/components/layout/BottomNav";

export function RouteAwareNav() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) return null;
  return (
    <>
      <SidebarNav />
      <BottomNav />
    </>
  );
}