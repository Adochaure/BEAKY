import { ProfileSettings } from "@/components/dashboard/profile-settings";
import { connection } from "next/server";
import { normalizeCandidateProfile } from "@/lib/candidate-profile";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("resume_path, resume_name, gmail_notifications, custom_apis_enabled, gemini_api_key_ciphertext, groq_api_key_ciphertext, nvidia_api_key_ciphertext, candidate_profile")
    .maybeSingle();

  return (
    <ProfileSettings
      email={user?.email ?? ""}
      resumeName={profile?.resume_name ?? null}
      resumePath={profile?.resume_path ?? null}
      candidateProfile={normalizeCandidateProfile(profile?.candidate_profile)}
      gmailNotifications={profile?.gmail_notifications ?? true}
      customApisEnabled={profile?.custom_apis_enabled ?? false}
      savedApiKeys={{
        gemini: Boolean(profile?.gemini_api_key_ciphertext),
        groq: Boolean(profile?.groq_api_key_ciphertext),
        nvidia: Boolean(profile?.nvidia_api_key_ciphertext),
      }}
    />
  );
}
