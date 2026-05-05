import { createClient } from "@/lib/supabase/server";

export default async function DebugAuthPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user?.id || '');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Info</h1>
      
      <h2 className="text-lg font-semibold mt-4">User:</h2>
      <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({ userId: user?.id, email: user?.email }, null, 2)}</pre>
      
      <h2 className="text-lg font-semibold mt-4">Profile:</h2>
      <pre className="bg-gray-100 p-4 rounded">{JSON.stringify({ profile, profileError }, null, 2)}</pre>
    </div>
  );
}