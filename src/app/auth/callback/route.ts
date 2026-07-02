import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/menu";

  // PKCE callback must be handled client-side
  // Redirect to client handler that has access to the code verifier
  if (code) {
    return redirect(`/auth/callback-client?code=${code}&next=${encodeURIComponent(next)}`);
  }

  return redirect(`/login?error=No%20auth%20code%20provided`);
}
