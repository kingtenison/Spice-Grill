"use client";

export async function signOut() {
  const { createAuthClientBrowser } = await import("@/lib/supabase/client");
  const supabase = createAuthClientBrowser();
  try {
    await Promise.race([
      supabase.auth.signOut(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Signout timeout")), 3000))
    ]);
  } catch (err) {
    console.warn("Sign out call timed out or failed:", err);
  }
  // Clear any auth cookies manually to be absolutely sure the session is gone, then redirect
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });
  window.location.href = "/";
}
