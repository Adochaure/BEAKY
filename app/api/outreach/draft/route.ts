import { NextRequest, NextResponse } from "next/server";
import { normalizeCandidateProfile } from "@/lib/candidate-profile";
import { decryptApiKey } from "@/lib/server/api-key-crypto";
import { callGeminiJson } from "@/lib/server/gemini";
import { createClient } from "@/lib/supabase/server";

const draftSchema = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
} as const;

function cleanJobText(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeDraftText(text: string, replacements: Record<string, string>): string {
  let result = text;
  for (const [key, val] of Object.entries(replacements)) {
    const pattern = new RegExp(`\\[${key}\\]`, "gi");
    result = result.replace(pattern, val);
  }
  // Strip any accidental brackets or placeholder tokens
  result = result
    .replace(/\[(?:Insert|Your|Add|Candidate|Recruiter|Company|Role|Phone|Link)\s*[^\]]*\]/gi, "")
    .replace(/\b(?:\[.*?\])\b/g, "");
  return result.trim();
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Sign in again before generating an email." }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid email draft request." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || !("job" in payload)) {
    return NextResponse.json({ error: "Choose a job before generating an email." }, { status: 400 });
  }
  const body = payload as { job?: Record<string, unknown>; recruiterName?: unknown; tone?: unknown };
  const job = body.job;
  const title = typeof job?.title === "string" ? job.title.trim().slice(0, 200) : "";
  const company = typeof job?.companyName === "string" ? job.companyName.trim().slice(0, 200) : "";
  const excerpt = typeof job?.excerpt === "string" ? cleanJobText(job.excerpt).slice(0, 1800) : "";
  const description = typeof job?.description === "string" ? cleanJobText(job.description).slice(0, 18_000) : "";
  const recruiterName = typeof body.recruiterName === "string" ? body.recruiterName.replace(/[\r\n\0]/g, " ").trim().slice(0, 100) : "";
  const tone = typeof body.tone === "string" && ["Engaging", "Professional", "Formal"].includes(body.tone) ? body.tone : "Professional";
  if (!title || !company) return NextResponse.json({ error: "This job is missing its title or company." }, { status: 400 });

  const { data: profile, error: profileError } = await supabase.from("user_profiles")
    .select("candidate_profile, custom_apis_enabled, gemini_api_key_ciphertext")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: "Could not load your candidate profile." }, { status: 500 });
  const candidateProfile = normalizeCandidateProfile(profile?.candidate_profile);
  if (!candidateProfile) return NextResponse.json({ error: "Analyze your resume in Profile before generating a tailored email." }, { status: 400 });

  let apiKey = process.env.GEMINI_API_KEY ?? "";
  if (profile?.custom_apis_enabled && profile?.gemini_api_key_ciphertext) {
    try {
      apiKey = decryptApiKey(profile.gemini_api_key_ciphertext);
    } catch {
      // Fallback to server key
    }
  }
  if (!apiKey) return NextResponse.json({ error: "Gemini AI is currently initializing. Please try again in a moment." }, { status: 503 });

  // Determine realistic candidate display name
  const metaFullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const metaName = typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";
  const candidateName = metaFullName || metaName || (user.email ? user.email.split("@")[0].replace(/[._0-9]/g, " ").trim() : "Candidate");
  const formattedCandidateName = candidateName
    ? candidateName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "Candidate";

  const greetingRecipient = recruiterName
    ? (recruiterName.split(" ")[0] || recruiterName)
    : `${company} Hiring Team`;

  const jobContext = [excerpt, description].filter(Boolean).join("\n\n").slice(0, 19_000);

  const prompt = [
    "You are an executive talent outreach copywriter.",
    "Draft a top-notch, highly compelling, human, and professional cold application email for the candidate.",
    "",
    "ROLE & CANDIDATE DETAILS:",
    `- Role: ${title}`,
    `- Company: ${company}`,
    `- Recruiter / Hiring Lead: ${greetingRecipient}`,
    `- Candidate Name: ${formattedCandidateName}`,
    `- Chosen Tone: ${tone}`,
    `- Candidate Verified Qualifications: ${JSON.stringify(candidateProfile)}`,
    `- Job Overview: ${jobContext.slice(0, 2000)}`,
    "",
    "CRITICAL WRITING RULES:",
    "1. Structure:",
    `   - Salutation: 'Hi ${greetingRecipient},' or 'Dear ${greetingRecipient},'`,
    "   - Opening (1 sentence): A polite, high-impact statement expressing strong interest in the role at the company.",
    "   - Value Match (2-3 crisp sentences): Directly connect 1-2 key skills or verified achievements from the candidate profile to the company's technical stack or mission. Be specific, concrete, and punchy.",
    "   - Call to Action (1 sentence): Mention that your resume is attached for review and offer a brief 15-minute introductory conversation.",
    `   - Sign-off: 'Best regards,' followed by '${formattedCandidateName}' on a new line.`,
    "2. Quality & Formatting:",
    "   - Total length: 90 to 140 words. No unnecessary fluff or sycophancy.",
    "   - Separate paragraphs with double newlines ('\\n\\n') for clean email readability.",
    "   - NO markdown formatting anywhere in the body (no asterisks, no bolding, no bullet points).",
    "   - NEVER include placeholders like [Your Name], [Company], [Link], [Phone], or any brackets.",
    "   - NEVER invent achievements, degrees, or employers not present in the candidate profile.",
    "3. Subject Line:",
    `   - Craft a crisp, high-open-rate subject line (e.g. 'Application: ${title} — ${formattedCandidateName}' or '${title} at ${company} — ${formattedCandidateName}').`,
    "",
    "Return pure JSON conforming to the schema with 'subject' and 'body'.",
  ].join("\n");

  try {
    const draft = await callGeminiJson<{ subject?: string; body?: string }>({
      apiKey,
      prompt,
      schema: draftSchema,
      preferredModel: process.env.GEMINI_RESUME_MODEL || process.env.GEMINI_MODEL,
    });

    if (!draft || typeof draft.subject !== "string" || typeof draft.body !== "string" || !draft.subject.trim() || !draft.body.trim()) {
      return NextResponse.json({ error: "Gemini returned an incomplete email draft." }, { status: 502 });
    }

    const cleanSubject = sanitizeDraftText(draft.subject, {
      Company: company,
      Role: title,
      Candidate: formattedCandidateName,
    }).replace(/[\r\n\0]/g, " ").trim().slice(0, 200);

    const cleanBody = sanitizeDraftText(draft.body, {
      Company: company,
      Role: title,
      Candidate: formattedCandidateName,
      Recruiter: greetingRecipient,
    }).replace(/\0/g, "").trim().slice(0, 15_000);

    // Audit log in discovery_logs
    try {
      await supabase.from("discovery_logs").insert({
        user_id: user.id,
        step: "email_draft_generated",
        result: {
          company,
          role: title,
          recipient: greetingRecipient,
          tone,
        },
      });
    } catch {
      // Ignore non-fatal log error
    }

    return NextResponse.json({
      subject: cleanSubject,
      body: cleanBody,
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Could not generate email draft.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
