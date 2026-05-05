import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function checkRole(allowedRoles: string[]) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login?error=profile_not_found");
  }

  const userRole = String(profile.role);
  if (!allowedRoles.includes(userRole)) {
    redirect("/login?error=unauthorized");
  }

  return { user, profile };
}
