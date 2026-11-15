"use client";

import { useRef, useState } from "react";
import { Check, FileText, LoaderCircle, Mail, Sparkles, Upload } from "lucide-react";
import type { CandidateProfile } from "@/lib/candidate-profile";
import { createClient } from "@/lib/supabase/client";

function SettingSwitch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a92230] ${
        checked ? "bg-[#211a14]" : "bg-[#d9d2c7]"
      }`}
    >
      <span
        className={`size-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[19px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export function ProfileSettings({
  email,
  resumeName,
  resumePath,
  candidateProfile: initialCandidateProfile,
  gmailNotifications: initialNotifications,
}: {
  email: string;
  resumeName: string | null;
  resumePath: string | null;
  candidateProfile: CandidateProfile | null;
  gmailNotifications: boolean;
  customApisEnabled?: boolean;
  savedApiKeys?: Record<string, boolean>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [currentResume, setCurrentResume] = useState(resumeName);
  const [currentResumePath, setCurrentResumePath] = useState(resumePath);
  const [candidateProfile, setCandidateProfile] = useState(initialCandidateProfile);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [busy, setBusy] = useState<"resume" | "notifications" | "preview" | "analyze" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function reportError(value: string) {
    setMessage("");
    setError(value);
  }

  async function uploadResume(file?: File) {
    if (!file) return;
    setError("");
    setMessage("");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      reportError("Choose a PDF resume.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reportError("The PDF must be 5 MB or smaller.");
      return;
    }

    setBusy("resume");
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Sign in again to upload your resume.");
      const path = `${user.id}/resume.pdf`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file, {
        upsert: true,
        contentType: "application/pdf",
      });
      if (uploadError) throw uploadError;
      const { error: profileError } = await supabase.from("user_profiles").upsert({
        user_id: user.id,
        resume_path: path,
        resume_name: file.name,
        candidate_profile: null,
        candidate_profile_updated_at: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id", defaultToNull: false });
      if (profileError) throw profileError;
      setCurrentResume(file.name);
      setCurrentResumePath(path);
      setCandidateProfile(null);
      setMessage("Resume uploaded. Click 'Analyze resume' to extract your matching skills.");
    } catch (caught) {
      reportError(caught instanceof Error ? caught.message : "Could not upload the resume.");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function analyzeResume() {
    setBusy("analyze");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/profile/analyze-resume", { method: "POST" });
      const result = await response.json() as { candidateProfile?: CandidateProfile; error?: string };
      if (!response.ok || !result.candidateProfile) throw new Error(result.error ?? "Could not analyze the resume.");
      setCandidateProfile(result.candidateProfile);
      setMessage("Resume analyzed successfully! Your skills and target roles are now updated for matching.");
    } catch (caught) {
      reportError(caught instanceof Error ? caught.message : "Could not analyze the resume.");
    } finally {
      setBusy(null);
    }
  }

  async function saveNotifications(next: boolean) {
    setNotifications(next);
    setBusy("notifications");
    setError("");
    setMessage("");
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Sign in again to update settings.");
      const { error: updateError } = await supabase.from("user_profiles").upsert({
        user_id: user.id,
        gmail_notifications: next,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id", defaultToNull: false });
      if (updateError) throw updateError;
      setMessage("Notification preferences updated.");
    } catch (caught) {
      setNotifications(!next);
      reportError(caught instanceof Error ? caught.message : "Could not update notification preferences.");
    } finally {
      setBusy(null);
    }
  }

  async function previewResume() {
    if (!currentResumePath) return;
    setBusy("preview");
    setError("");
    try {
      const supabase = createClient();
      const { data, error: urlError } = await supabase.storage.from("resumes").createSignedUrl(currentResumePath, 60);
      if (urlError) throw urlError;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      reportError(caught instanceof Error ? caught.message : "Could not open the resume.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] px-8 pb-14 pt-9 max-lg:px-6 max-sm:px-4 max-sm:pt-6">
      <header>
        <h1
          className="text-[clamp(2.15rem,4vw,2.9rem)] leading-[1.08] tracking-[-0.045em] text-[#171411]"
          style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}
        >
          Your profile.
        </h1>
        <p className="mt-2 text-sm text-[#766f67]">Upload your resume, extract verified skills, and connect your outreach settings.</p>
      </header>

      <div className="mt-7 space-y-7">
        <section aria-labelledby="resume-heading">
          <h2 id="resume-heading" className="text-[17px] tracking-[-0.02em]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>Resume</h2>
          <p className="mt-1 text-[10px] text-[#8a8073]">Text-based PDF resumes (max 5 MB) are used to extract verified experience and personalize role pitches.</p>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => void uploadResume(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy === "resume"}
            className="group mt-4 flex min-h-[82px] w-full flex-col items-center justify-center gap-1 rounded-[9px] border border-dashed border-[#d9d2c7] bg-white/25 px-4 text-center transition duration-200 hover:border-[#a92230]/60 hover:bg-white/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a92230] disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#241f19]">
              {busy === "resume" ? <LoaderCircle size={14} className="animate-spin" /> : currentResume ? <FileText size={14} /> : <Upload size={14} />}
              {currentResume ?? "Choose a PDF resume"}
            </span>
            <span className="text-[9px] text-[#8a8073]">{currentResume ? "Click to replace · text PDF (max 5 MB)" : "Click to upload · text PDF (max 5 MB)"}</span>
          </button>

          {currentResume ? (
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void previewResume()}
                disabled={busy === "preview"}
                className="inline-flex items-center gap-1 text-[10px] text-[#766f67] transition hover:text-[#a92230]"
              >
                {busy === "preview" ? <LoaderCircle size={12} className="animate-spin" /> : <FileText size={12} />}
                Preview uploaded PDF
              </button>
            </div>
          ) : null}

          {currentResume ? (
            <div className="mt-4 rounded-[12px] border border-[#e2dbcf] bg-white/45 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#241f19]">Extracted Candidate Profile</p>
                  <p className="mt-0.5 text-[10px] text-[#8a8073]">Skills, roles, and years of experience automatically extracted via Gemini AI.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void analyzeResume()}
                  disabled={busy === "analyze"}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#a92230] bg-white px-3 text-[10px] font-semibold text-[#a92230] transition hover:bg-[#a92230]/5 disabled:opacity-60 shadow-sm"
                >
                  {busy === "analyze" ? <LoaderCircle size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {busy === "analyze" ? "Analyzing with Gemini…" : candidateProfile ? "Re-analyze resume" : "Analyze resume"}
                </button>
              </div>

              {candidateProfile ? (
                <div className="mt-3 space-y-2 border-t border-[#332d2412] pt-3">
                  <p className="text-[11px] leading-relaxed text-[#4e463d]">{candidateProfile.summary}</p>
                  {candidateProfile.skills.length ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {candidateProfile.skills.map((skill) => (
                        <span key={skill} className="rounded-md border border-[#e2dbcf] bg-[#faf7f0] px-2 py-0.5 text-[9px] font-medium text-[#595045]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="text-[9px] text-[#8a8073]">
                    {[
                      candidateProfile.seniority,
                      candidateProfile.years_experience === null ? "" : `${candidateProfile.years_experience} years experience`,
                      candidateProfile.target_roles.join(" · "),
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-[10px] text-[#936523] bg-[#fbf3e3] border border-[#ebd5ae] rounded-md p-2.5">
                  Click &apos;Analyze resume&apos; to extract your candidate skills for auto-tailored cold outreach!
                </p>
              )}
            </div>
          ) : null}
        </section>

        <section aria-labelledby="gmail-heading" className="border-t border-[#332d2418] pt-5">
          <h2 id="gmail-heading" className="text-[17px] tracking-[-0.02em]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>Outreach &amp; Email</h2>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#e2dbcf] bg-white/45 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#e4ddd2] bg-white text-[#a92230] shadow-sm">
                <Mail size={16} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-[#241f19]">{email || "Google account"}</p>
                <p className="mt-0.5 text-[10px] text-[#8a8073]">Connected account · Dispatch pitches via Gmail Web or background API</p>
              </div>
            </div>
            <span className="rounded-md border border-[#2c7448]/30 bg-[#e7f5ea] px-2.5 py-1 text-[9px] font-semibold text-[#2c7448]">
              Ready for outreach
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#332d2412] pt-3">
            <div>
              <p className="text-[11px] font-semibold text-[#241f19]">Outreach Activity Notifications</p>
              <p className="mt-0.5 text-[10px] text-[#8a8073]">Notify when outreach emails are recorded and recruiter replies arrive.</p>
            </div>
            <SettingSwitch checked={notifications} onChange={(value) => void saveNotifications(value)} label="Activity notifications" />
          </div>
        </section>

        <div aria-live="polite" className="min-h-4 text-[10px]">
          {error ? <p role="alert" className="text-[#a43d32]">{error}</p> : message ? <p className="text-[#2c7448] font-medium">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
