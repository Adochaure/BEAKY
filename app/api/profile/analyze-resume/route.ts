import { NextResponse } from "next/server";
import { normalizeCandidateProfile } from "@/lib/candidate-profile";
import { decryptApiKey } from "@/lib/server/api-key-crypto";
import { callGeminiJson } from "@/lib/server/gemini";
import { extractTextFromPdf } from "@/lib/server/pdf-extractor";
import { createClient } from "@/lib/supabase/server";

const resumeSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    skills: { type: "array", items: { type: "string" } },
    target_roles: { type: "array", items: { type: "string" } },
    years_experience: { type: "number", nullable: true },
    seniority: { type: "string" },
  },
  required: ["summary", "skills", "target_roles", "seniority"],
} as const;

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Sign in again to analyze your resume." }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from("user_profiles")
    .select("resume_path, custom_apis_enabled, gemini_api_key_ciphertext")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError || !profile?.resume_path) return NextResponse.json({ error: "Upload a PDF resume in Profile first." }, { status: 400 });

  let apiKey = process.env.GEMINI_API_KEY ?? "";
  if (profile.custom_apis_enabled && profile.gemini_api_key_ciphertext) {
    try {
      apiKey = decryptApiKey(profile.gemini_api_key_ciphertext);
    } catch {
      return NextResponse.json({ error: "Could not unlock your saved Gemini key. Check USER_API_KEYS_ENCRYPTION_KEY on the server." }, { status: 503 });
    }
  }
  if (!apiKey) return NextResponse.json({ error: "Add a Gemini API key in Profile or set GEMINI_API_KEY on the server." }, { status: 503 });

  const { data: resume, error: resumeError } = await supabase.storage.from("resumes").download(profile.resume_path);
  if (resumeError || !resume) return NextResponse.json({ error: "Could not load your saved PDF. Upload it again from Profile." }, { status: 400 });
  if (resume.size > 5 * 1024 * 1024 || resume.type !== "application/pdf") {
    return NextResponse.json({ error: "The saved resume must be a PDF no larger than 5 MB." }, { status: 400 });
  }

  const pdfBuffer = Buffer.from(await resume.arrayBuffer());
  const extractedText = extractTextFromPdf(pdfBuffer);

  const prompt = [
    "You are an expert technical recruiter analyzing a candidate resume for high-match job and internship applications.",
    "Extract a structured, factual candidate profile from the resume below.",
    "Extract ONLY qualifications, tools, frameworks, and roles explicitly supported by the resume. Do NOT hallucinate.",
    "Fields to return:",
    "- summary: Factual candidate overview (under 90 words) highlighting primary domain, key achievements, and technologies.",
    "- skills: Array of up to 30 distinct skills, languages, tools, frameworks, databases, or libraries found in the resume.",
    "- target_roles: Array of 3 to 10 best matching role titles (e.g. 'Software Engineer', 'Full Stack Developer', 'ML Intern').",
    "- years_experience: Estimated numeric years of total professional/internship experience, or null if fresher/student.",
    "- seniority: One of 'Entry-level', 'Mid-level', 'Senior', or 'Fresher / Student'.",
    extractedText.length >= 40
      ? `\n--- RESUME TEXT ---\n${extractedText.slice(0, 15000)}\n--- END RESUME TEXT ---`
      : "\nPlease analyze the attached document pages.",
  ].join("\n");

  try {
    const parsed = await callGeminiJson<Record<string, unknown>>({
      apiKey,
      prompt,
      schema: resumeSchema,
      preferredModel: process.env.GEMINI_RESUME_MODEL || process.env.GEMINI_MODEL,
      inlinePdfBase64: extractedText.length < 40 ? pdfBuffer.toString("base64") : undefined,
    });

    const candidateProfile = normalizeCandidateProfile(parsed);
    if (!candidateProfile) {
      return NextResponse.json({ error: "Could not extract structured candidate details from this PDF." }, { status: 422 });
    }

    const updatedAt = new Date().toISOString();
    const { error: saveError } = await supabase.from("user_profiles").upsert({
      user_id: user.id,
      candidate_profile: candidateProfile,
      candidate_profile_updated_at: updatedAt,
      updated_at: updatedAt,
    }, { onConflict: "user_id", defaultToNull: false });

    if (saveError) {
      console.error("Could not save extracted candidate profile:", saveError.message);
      return NextResponse.json({ error: "Profile was analyzed but could not be saved to Supabase." }, { status: 500 });
    }

    // Record audit log
    try {
      await supabase.from("discovery_logs").insert({
        user_id: user.id,
        step: "resume_analysis",
        result: {
          skillsCount: candidateProfile.skills.length,
          extractedTextLength: extractedText.length,
          roles: candidateProfile.target_roles,
          seniority: candidateProfile.seniority,
        },
      });
    } catch {
      // Ignore non-fatal log insert error
    }

    return NextResponse.json({ candidateProfile, updatedAt, extractedWords: extractedText.split(/\s+/).length }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Gemini resume analysis failed:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Gemini could not analyze this resume. Try again.",
    }, { status: 502 });
  }
}
