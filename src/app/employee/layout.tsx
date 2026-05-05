import { checkRole } from "@/lib/auth";
import EmployeeShell from "./shell";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await checkRole(["admin", "employee"]);

  return <EmployeeShell profile={profile}>{children}</EmployeeShell>;
}

