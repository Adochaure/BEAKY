import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptApiKey, isEncryptionKeyConfigured } from "@/lib/server/api-key-crypto";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Sign in again to save settings." }, { status: 401 });

  let body: { enabled?: unknown; apiKeys?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid settings payload." }, { status: 400 });
  }

  if (typeof body.enabled !== "boolean" || !body.apiKeys || typeof body.apiKeys !== "object") {
    return NextResponse.json({ error: "Invalid settings payload." }, { status: 400 });
  }

  const fields = ["gemini", "groq", "nvidia"] as const;
  const values = fields.map((field) => body.apiKeys?.[field] ?? "");
  if (values.some((value) => typeof value !== "string" || value.length > 5000)) {
    return NextResponse.json({ error: "API keys must be 5,000 characters or fewer." }, { status: 400 });
  }

  const hasKeys = values.some((value) => typeof value === "string" && value.trim().length > 0);
  if (hasKeys && !isEncryptionKeyConfigured()) {
    return NextResponse.json({ error: "Secure API key storage is not configured on this server yet." }, { status: 503 });
  }

  const { data: existing, error: existingError } = await supabase.from("user_profiles")
    .select("gemini_api_key_ciphertext, groq_api_key_ciphertext, nvidia_api_key_ciphertext")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: "Could not load the saved API settings." }, { status: 500 });

  const profile: {
    user_id: string;
    custom_apis_enabled: boolean;
    updated_at: string;
    gemini_api_key_ciphertext?: string | null;
    groq_api_key_ciphertext?: string | null;
    nvidia_api_key_ciphertext?: string | null;
  } = {
    user_id: user.id,
    custom_apis_enabled: body.enabled,
    updated_at: new Date().toISOString(),
    gemini_api_key_ciphertext: existing?.gemini_api_key_ciphertext ?? null,
    groq_api_key_ciphertext: existing?.groq_api_key_ciphertext ?? null,
    nvidia_api_key_ciphertext: existing?.nvidia_api_key_ciphertext ?? null,
  };

  if (hasKeys) {
    try {
      fields.forEach((field, index) => {
        const value = (values[index] as string).trim();
        if (value) profile[`${field}_api_key_ciphertext` as "gemini_api_key_ciphertext" | "groq_api_key_ciphertext" | "nvidia_api_key_ciphertext"] = encryptApiKey(value);
      });
    } catch {
      return NextResponse.json({ error: "Secure API key storage is not configured correctly on this server." }, { status: 503 });
    }
  }

  const { error } = await supabase.from("user_profiles").upsert(profile, { onConflict: "user_id" });
  if (error) {
    console.error("Could not save profile API settings:", error.message);
    return NextResponse.json({ error: "Could not save API settings." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
