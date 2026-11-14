"use client";

import { useRef, useState } from "react";
import { Check, Eye, EyeOff, FileText, LoaderCircle, Mail, Upload } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import type { CandidateProfile } from "@/lib/candidate-profile";
import { createClient } from "@/lib/supabase/client";

type ApiProvider = "gemini" | "groq" | "nvidia";

const inputClass =
  "h-10 w-full rounded-[8px] border border-[#d9d2c7] bg-transparent px-3 pr-10 text-[12px] text-[#241f19] outline-none transition placeholder:text-[#a59b8d] focus:border-[#a92230] focus:bg-white/50 focus:ring-2 focus:ring-[#e63946]/10";

function SettingSwitch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a92230] ${checked ? "bg-[#211a14]" : "bg-[#d9d2c7]"}`}
    >
      <span className={`size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[19px]" : "translate-x-[3px]"}`} />
    </button>
  );
}

function ProviderKey({
  label,
  provider,
  saved,
  value,
  onChange,
}: {
  label: string;
  provider: ApiProvider;
  saved: boolean;
  value: string;
  onChange: (provider: ApiProvider, value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-[8px] font-semibold tracking-[0.08em] text-[#8a8073] uppercase">{label} API key</span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(provider, event.target.value)}
          placeholder={saved ? "Saved securely · enter to replace" : `Enter ${label} API key`}
          className={inputClass}
        />
        <button
          type="button"
          aria-label={visible ? `Hide ${label} key` : `Show ${label} key`}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-2 grid w-7 place-items-center text-[#7d7368] transition hover:text-[#211a14]"
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </span>
    </label>
  );
}

export function ProfileSettings({
  email,
  resumeName,
  resumePath,
  candidateProfile: initialCandidateProfile,
  gmailNotifications: initialNotifications,
  customApisEnabled: initialCustomApis,
  savedApiKeys,
}: {
  email: string;
  resumeName: string | null;
  resumePath: string | null;
  candidateProfile: CandidateProfile | null;
  gmailNotifications: boolean;
  customApisEnabled: boolean;
  savedApiKeys: Record<ApiProvider, boolean>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [currentResume, setCurrentResume] = useState(resumeName);
  const [currentResumePath, setCurrentResumePath] = useState(resumePath);
  const [candidateProfile, setCandidateProfile] = useState(initialCandidateProfile);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [customApisEnabled, setCustomApisEnabled] = useState(initialCustomApis);
  const [keys, setKeys] = useState<Record<ApiProvider, string>>({ gemini: "", groq: "", nvidia: "" });
  const [busy, setBusy] = useState<"resume" | "notifications" | "apis" | "preview" | "analyze" | null>(null);
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
      setMessage("Resume uploaded.");
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
      setMessage("Resume profile extracted and saved.");
    } catch (caught) {
      reportError(caught instanceof Error ? caught.message : "Could not analyze the resume.");
    } finally {
      setBusy(null);
    }
  }

  async function saveNotifications(value: boolean) {
    setNotifications(value);
    setBusy("notifications");
    setError("");
    setMessage("");
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Sign in again to update your settings.");
      const { error: saveError } = await supabase.from("user_profiles").upsert({
        user_id: user.id,
        gmail_notifications: value,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id", defaultToNull: false });
      if (saveError) throw saveError;
      setMessage("Notification preference saved.");
    } catch (caught) {
      setNotifications(!value);
      reportError(caught instanceof Error ? caught.message : "Could not save this preference.");
    } finally {
      setBusy(null);
    }
  }

  function updateKey(provider: ApiProvider, value: string) {
    setKeys((current) => ({ ...current, [provider]: value }));
  }

  async function saveApiSettings() {
    setBusy("apis");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/profile/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: customApisEnabled, apiKeys: keys }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save API settings.");
      setKeys({ gemini: "", groq: "", nvidia: "" });
      setMessage("Custom API settings saved securely.");
    } catch (caught) {
      reportError(caught instanceof Error ? caught.message : "Could not save API settings.");
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
        <p className="mt-2 text-sm text-[#766f67]">Upload your resume, connect Gmail, and configure your API keys.</p>
      </header>

      <div className="mt-7 space-y-7">
        <section aria-labelledby="resume-heading">
          <h2 id="resume-heading" className="text-[17px] tracking-[-0.02em]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>Resume</h2>
          <p className="mt-1 text-[10px] text-[#8a8073]">Only text-based resumes (PDF) are accepted to gather candidate info. Maximum 5 MB.</p>
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
            className="group mt-4 flex min-h-[82px] w-full flex-col items-center justify-center gap-1 rounded-[9px] border border-dashed border-[#d9d2c7] bg-white/15 px-4 text-center transition duration-200 hover:border-[#a92230]/60 hover:bg-white/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a92230] disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#241f19]">
              {busy === "resume" ? <LoaderCircle size={14} className="animate-spin" /> : currentResume ? <FileText size={14} /> : <Upload size={14} />}
              {currentResume ?? "Choose a PDF resume"}
            </span>
            <span className="text-[9px] text-[#8a8073]">{currentResume ? "Click to replace · text PDF (max 5 MB)" : "Click to upload · text PDF (max 5 MB)"}</span>
          </button>
          {currentResume ? (
            <button type="button" onClick={() => void previewResume()} disabled={busy === "preview"} className="mt-2 inline-flex items-center gap-1 text-[10px] text-[#766f67] transition hover:text-[#a92230]">
              {busy === "preview" ? <LoaderCircle size={12} className="animate-spin" /> : <FileText size={12} />}
              Preview resume
            </button>
          ) : null}
          {currentResume ? (
            <div className="mt-4 rounded-[9px] border border-[#e2dbcf] bg-white/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-[#241f19]">Candidate profile</p>
                  <p className="mt-0.5 text-[9px] text-[#8a8073]">Extract skills and experience for job matching.</p>
                </div>
                <button type="button" onClick={() => void analyzeResume()} disabled={busy === "analyze"} className="inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-[#d9d2c7] bg-white/45 px-3 text-[9px] font-semibold text-[#514a40] transition hover:bg-white/80 disabled:opacity-60">
                  {busy === "analyze" ? <LoaderCircle size={12} className="animate-spin" /> : <Check size={12} />}
                  {busy === "analyze" ? "Analyzing…" : candidateProfile ? "Re-analyze resume" : "Analyze resume"}
                </button>
              </div>
              <p className="mt-2 text-[9px] leading-4 text-[#8a8073]">When you choose Analyze, the PDF is sent to your configured Gemini API key to extract profile details.</p>
              {candidateProfile ? (
                <div className="mt-3 border-t border-[#332d2412] pt-3">
                  <p className="text-[10px] leading-5 text-[#5f574c]">{candidateProfile.summary}</p>
                  {candidateProfile.skills.length ? <div className="mt-2 flex flex-wrap gap-1.5">{candidateProfile.skills.map((skill) => <span key={skill} className="rounded-full border border-[#e2dbcf] bg-[#faf7f0] px-2 py-1 text-[8px] text-[#665d52]">{skill}</span>)}</div> : null}
                  <p className="mt-2 text-[9px] text-[#8a8073]">{[candidateProfile.seniority, candidateProfile.years_experience === null ? "" : `${candidateProfile.years_experience} years`, candidateProfile.target_roles.join(" · ")].filter(Boolean).join(" · ")}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section aria-labelledby="gmail-heading" className="border-t border-[#332d2418] pt-5">
          <h2 id="gmail-heading" className="sr-only">Gmail</h2>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-md border border-[#e4ddd2] bg-white/40 text-[#a92230]"><Mail size={16} /></span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-[#241f19]">{email || "Google account"}</p>
                <p className="mt-0.5 text-[9px] text-[#8a8073]">Signed in to Beaky · Gmail permission is requested when you approve an email</p>
              </div>
            </div>
            <span className="rounded-md border border-[#d9d2c7] px-3 py-1.5 text-[10px] text-[#766f67]">Authorize on send</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#332d2412] pt-3">
            <div>
              <p className="text-[11px] font-semibold text-[#241f19]">Gmail notifications</p>
              <p className="mt-0.5 text-[9px] text-[#8a8073]">Alerts for dispatched and opened emails</p>
            </div>
            <SettingSwitch checked={notifications} onChange={(value) => void saveNotifications(value)} label="Gmail notifications" />
          </div>
        </section>

        <section aria-labelledby="apis-heading" className="border-t border-[#332d2418] pt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 id="apis-heading" className="text-[17px] tracking-[-0.02em]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>Custom APIs <span className="font-sans text-[12px] text-[#8a8073]">(Optional)</span></h2>
              <p className="mt-1 text-[10px] text-[#8a8073]">Override the platform’s default AI provider keys with your own.</p>
            </div>
            <SettingSwitch checked={customApisEnabled} onChange={setCustomApisEnabled} label="Use custom API keys" />
          </div>
          <div className={`mt-5 grid gap-3 md:grid-cols-3 ${customApisEnabled ? "" : "opacity-55"}`}>
            <ProviderKey label="Gemini" provider="gemini" saved={savedApiKeys.gemini} value={keys.gemini} onChange={updateKey} />
            <ProviderKey label="Groq" provider="groq" saved={savedApiKeys.groq} value={keys.groq} onChange={updateKey} />
            <ProviderKey label="NVIDIA" provider="nvidia" saved={savedApiKeys.nvidia} value={keys.nvidia} onChange={updateKey} />
          </div>
          <p className="mt-2 text-[10px] leading-5 text-[#8a8073]">
            Keys are encrypted before they are saved. Leave a field blank to keep its saved key.
          </p>
          <button
            type="button"
            onClick={() => void saveApiSettings()}
            disabled={busy === "apis"}
            className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-[#d9d2c7] bg-white/35 px-4 text-[10px] font-semibold text-[#241f19] shadow-[0_1px_2px_rgba(23,43,50,0.08)] transition duration-150 hover:border-[#b8ad9e] hover:bg-white/70 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a92230] disabled:cursor-wait disabled:opacity-60"
          >
            {busy === "apis" ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}
            Save API settings
          </button>
        </section>

        <div aria-live="polite" className="min-h-4 text-[10px]">
          {error ? <p role="alert" className="text-[#a43d32]">{error}</p> : message ? <p className="text-[#55754e]">{message}</p> : null}
        </div>

        <footer className="flex justify-end border-t border-[#332d2418] pt-4">
          <SignOutButton />
        </footer>
      </div>
    </div>
  );
}
