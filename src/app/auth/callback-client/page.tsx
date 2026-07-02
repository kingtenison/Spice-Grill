"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createAuthClientBrowser } from "@/lib/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/menu";

  useEffect(() => {
    const handleCallback = async () => {
      if (!code) {
        router.replace(`/login?error=No%20auth%20code%20provided`);
        return;
      }

      try {
        const supabase = createAuthClientBrowser();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("Auth callback error:", error);
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          const role = profile?.role;
          if (role === "admin") {
            router.replace("/admin");
          } else if (role === "employee") {
            router.replace("/employee");
          } else {
            router.replace(next);
          }
        } else {
          router.replace(next);
        }
      } catch (err: any) {
        router.replace(`/login?error=${encodeURIComponent(err.message || "auth_failed")}`);
      }
    };

    // Set a safety timeout to avoid indefinite loading
    const timeoutId = setTimeout(() => {
      console.warn("Auth callback timed out after 15s");
      router.replace(`/login?error=timeout`);
    }, 15000);

    handleCallback().finally(() => clearTimeout(timeoutId));
  }, [code, next, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackClientPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}