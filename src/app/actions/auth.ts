"use client";

import { createAuthClientBrowser } from "@/lib/supabase/client";

export async function signInWithPassword(email: string, password: string) {
  const supabase = createAuthClientBrowser();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUpWithPassword(email: string, password: string, metadata: Record<string, unknown>) {
  const supabase = createAuthClientBrowser();
  
  if (!email || !password) {
    return { data: null, error: { message: "Email and password are required" } };
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: typeof window !== 'undefined' ? window.location.origin + '/auth/callback-client' : undefined,
    }
  });
  return { data, error };
}

export async function signInWithGoogle() {
  const supabase = createAuthClientBrowser();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin + '/auth/callback-client' : undefined,
    }
  });
  return { data, error };
}

export async function signOut() {
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