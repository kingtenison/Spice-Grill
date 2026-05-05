import { checkRole } from "@/lib/auth";

export default async function AdminGate({ children }: { children: React.ReactNode }) {
  await checkRole(["admin"]);
  return <>{children}</>;
}
