import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }
  return value;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const providerError = request.nextUrl.searchParams.get("error");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (providerError) {
    console.warn("Google OAuth returned an error:", providerError);
    const reason = providerError === "access_denied" ? "cancelled" : "provider_error";
    return NextResponse.redirect(new URL(`/get-started?error=oauth_callback&reason=${reason}`, request.url));
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, request.url));
      console.error("Supabase OAuth code exchange failed:", error.code, error.message);
      return NextResponse.redirect(new URL("/get-started?error=oauth_callback&reason=exchange_failed", request.url));
    } catch (error) {
      console.error("OAuth callback could not complete:", error);
      return NextResponse.redirect(new URL("/get-started?error=oauth_callback&reason=server_error", request.url));
    }
  }

  const errorUrl = new URL("/get-started?error=oauth_callback&reason=missing_code", request.url);
  return NextResponse.redirect(errorUrl);
}
