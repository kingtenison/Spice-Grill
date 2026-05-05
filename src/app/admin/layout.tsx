import { checkRole } from "@/lib/auth";
import AdminShell from "./shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await checkRole(["admin"]);
  return <AdminShell profile={profile}>{children}</AdminShell>;
}
