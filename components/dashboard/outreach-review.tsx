"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Info,
  LoaderCircle,
  Mail,
  Paperclip,
  Search,
  Send,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Job = {
  guid: string;
  title: string;
  companyName: string;
  excerpt?: string;
  description?: string;
  applicationLink: string;
};

type Recruiter = {
  email: string;
  name: string;
  title: string;
  department?: string;
  confidence: number | null;
  verification: "verified" | "hunter_indexed" | "inferred_pattern" | string;
  matchType?: "opportunity" | "recruiter" | "company";
};

type DraftStatus = "draft" | "approved" | "sending" | "sent";

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }): { requestAccessToken(options?: { hint?: string; prompt?: string }): void };
        };
      };
    };
  }
}

function requestGmailAccessToken(email: string) {
  return new Promise<string>((resolve, reject) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const tokenClient = window.google?.accounts?.oauth2;
    if (!clientId || !tokenClient) {
      reject(new Error("Google Identity Services is initializing. Please try again in a few seconds or use 'Open in Gmail'."));
      return;
    }
    const client = tokenClient.initTokenClient({
      client_id: clientId,
      scope: "openid email profile https://www.googleapis.com/auth/gmail.send",
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || "Gmail authorization was cancelled."));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => reject(new Error(error.message || "Google's permission window could not open.")),
    });
    client.requestAccessToken({ hint: email, prompt: "" });
  });
}

export function OutreachReview({
  job,
  candidateSkills = [],
  onClose,
  onSent,
}: {
  job: Job;
  candidateSkills?: string[];
  onClose: () => void;
  onSent: () => void;
}) {
  const [email, setEmail] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [resumePath, setResumePath] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeReady, setResumeReady] = useState(false);
  const [resumeSignedUrl, setResumeSignedUrl] = useState("");
  const [tone, setTone] = useState("Engaging");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [draftId, setDraftId] = useState("");
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("draft");
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [finding, setFinding] = useState(false);
  const [busy, setBusy] = useState<"draft" | "save" | "send" | "web_send" | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    let active = true;
    setIsMobile(typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    async function loadProfile() {
      const supabase = createClient();
      const [{ data: { user } }, { data: profile }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("user_profiles").select("resume_path, resume_name, candidate_profile").maybeSingle(),
      ]);
      if (!active) return;
      const userEmail = user?.email ?? "";
      setSenderEmail(userEmail);
      setResumeReady(Boolean(profile?.resume_path));
      setResumeName(profile?.resume_name ?? "");
      setResumePath(profile?.resume_path ?? "");
      setHasProfile(Boolean(profile?.candidate_profile));

      if (profile?.resume_path) {
        supabase.storage
          .from("resumes")
          .createSignedUrl(profile.resume_path, 60 * 60 * 24 * 7)
          .then(({ data: signed }) => {
            if (active && signed?.signedUrl) {
              setResumeSignedUrl(signed.signedUrl);
            }
          })
          .catch(() => {});
      }
    }
    void loadProfile().catch(() => setError("Could not load your profile. Refresh and try again."));
    return () => {
      active = false;
    };
  }, []);

  async function findRecruiter() {
    setFinding(true);
    setError("");
    setNotice("");
    setRecruiters([]);
    try {
      const response = await fetch("/api/contacts/find", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          company: job.companyName,
          jobTitle: job.title,
          description: job.description ?? job.excerpt ?? "",
          applicationLink: job.applicationLink,
        }),
      });
      const result = await response.json() as {
        contacts?: Recruiter[];
        domainDeliverable?: boolean;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Could not find recruiters for this company.");
      const list = result.contacts ?? [];
      setRecruiters(list);
      if (!list.length) {
        setNotice("No public email address found for this company. You can enter an email manually or apply directly on their portal link above.");
      } else if (list.some((c) => c.verification === "verified" || c.verification === "hunter_indexed")) {
        setNotice(`Found ${list.length} indexed contacts from verified sources.`);
      } else {
        setNotice("Generated domain pattern. If email delivery fails, please submit via the official portal.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not find recruiters for this company.");
    } finally {
      setFinding(false);
    }
  }

  function selectRecruiter(contact: Recruiter) {
    setEmail(contact.email);
    setRecruiterName(contact.name);
    setRecruiters([]);
    if (contact.verification === "inferred_pattern") {
      setNotice(`Inferred company address selected (${contact.email}). If delivery bounces, submit on their official portal.`);
    } else {
      setNotice(`Selected ${contact.name || contact.email}. Ready to draft.`);
    }
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid recruiter email address.");
      return;
    }
    if (!senderEmail) {
      setError("Sign in again before creating an email draft.");
      return;
    }
    setBusy("draft");
    setError("");
    setNotice("");
    try {
      const generationResponse = await fetch("/api/outreach/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ job, recruiterName, tone }),
      });
      const generated = await generationResponse.json() as { subject?: string; body?: string; error?: string };
      if (!generationResponse.ok || !generated.subject || !generated.body) {
        throw new Error(generated.error ?? "Could not generate a role-specific email.");
      }

      const draftBody = generated.body;

      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sign in again to save this draft.");

      const { data, error: insertError } = await supabase.from("outreach_drafts").insert({
        user_id: user.id,
        job_guid: job.guid,
        job_title: job.title.slice(0, 200),
        company: job.companyName.slice(0, 200),
        application_link: job.applicationLink,
        recruiter_name: recruiterName.trim().slice(0, 200),
        recruiter_email: email.trim().toLowerCase(),
        subject: generated.subject,
        body: draftBody,
      }).select("id").single();

      if (insertError || !data) throw new Error("Could not save this draft to database.");
      setSubject(generated.subject);
      setBody(draftBody);
      setDraftId(data.id);
      setDraftStatus("draft");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create email draft.");
    } finally {
      setBusy(null);
    }
  }

  async function saveDraft() {
    if (!draftId) return;
    setBusy("save");
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.from("outreach_drafts").update({
        recruiter_name: recruiterName.trim().slice(0, 200),
        recruiter_email: email.trim().toLowerCase(),
        subject: subject.trim(),
        body: body.trim(),
        updated_at: new Date().toISOString(),
      }).eq("id", draftId).eq("status", "draft");
      if (updateError) throw new Error("Could not save the latest draft edits.");
      setNotice("Draft saved successfully.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this draft.");
    } finally {
      setBusy(null);
    }
  }

  // Direct background Gmail API send (for registered Google Cloud testers)
  async function approveAndSendViaGmail() {
    if (!draftId || !senderEmail) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !subject.trim() || !body.trim()) {
      setError("Add a valid recipient, subject, and message before sending.");
      return;
    }

    setBusy("send");
    setError("");
    setNotice("");

    try {
      const tokenPromise = requestGmailAccessToken(senderEmail);
      const accessToken = await tokenPromise;
      setDraftStatus("sending");

      const response = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draftId, accessToken, dispatchMode: "gmail_api" }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Gmail API could not send this message.");
      }
      setDraftStatus("sent");
      setNotice("Outreach sent via Gmail API with resume attached!");
      onSent();
    } catch (caught) {
      const msg = caught instanceof Error ? caught.message : String(caught);
      if (msg.toLowerCase().includes("access_denied") || msg.toLowerCase().includes("verification") || msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("cancelled")) {
        setError("Google OAuth is in 'Testing' mode. To send right now without Google Cloud setup, click 'Open in Gmail'. To enable 1-click background API sending, add your email to 'Test users' in Google Cloud Console.");
      } else {
        setError(msg || "Could not send via Gmail API. Try 'Open in Gmail'.");
      }
      setDraftStatus("draft");
    } finally {
      setBusy(null);
    }
  }

  // Universal dispatch: Mobile Gmail App with attached resume / Desktop Gmail Web
  async function launchGmail() {
    if (!draftId) return;
    setBusy("web_send");
    setError("");

    try {
      // 1. Record as sent in Beaky database
      await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draftId, dispatchMode: "gmail_web" }),
      });

      const isMobileDevice = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

      // 2. On Mobile: Use Web Share API with attached PDF resume if available
      if (isMobileDevice && resumePath && typeof navigator.share === "function") {
        try {
          const supabase = createClient();
          const { data: blob } = await supabase.storage.from("resumes").download(resumePath);
          if (blob) {
            const resumeFile = new File([blob], resumeName || "Resume.pdf", { type: "application/pdf" });
            if (navigator.canShare && navigator.canShare({ files: [resumeFile] })) {
              await navigator.share({
                title: subject,
                text: `${body}\n\nTo: ${email}`,
                files: [resumeFile],
              });
              setDraftStatus("sent");
              setNotice("Opened in mobile app with resume attached! Dispatch recorded.");
              onSent();
              return;
            }
          }
        } catch {
          // If native share was cancelled or failed, continue to direct app scheme
        }
      }

      // 3. Mobile Deep-linking to Native Gmail App
      if (isMobileDevice) {
        if (isAndroid) {
          // Android Intent directly targeting Gmail package
          const intentUrl = `intent:#Intent;action=android.intent.action.SENDTO;data=mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)};package=com.google.android.gm;end`;
          const fallbackMailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.location.href = intentUrl;
          setTimeout(() => {
            window.location.href = fallbackMailto;
          }, 1200);
        } else if (isIOS) {
          // iOS Gmail app custom scheme: googlegmail:///co
          const iosGmail = `googlegmail:///co?to=${encodeURIComponent(email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          const fallbackMailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.location.href = iosGmail;
          setTimeout(() => {
            window.location.href = fallbackMailto;
          }, 1200);
        } else {
          window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }
      } else {
        // Desktop: Open web Gmail composer in new tab
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(gmailUrl, "_blank", "noopener,noreferrer");
      }

      setDraftStatus("sent");
      setNotice(isMobileDevice ? "Opening native Gmail app! Record logged." : "Draft opened in Gmail Web! Record logged to Email History.");
      onSent();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open mail app.");
    } finally {
      setBusy(null);
    }
  }

  async function copyPitch() {
    if (!subject && !body) return;
    const textToCopy = `To: ${email}\nSubject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setNotice("Copied recipient, subject, and message to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Could not copy message to clipboard.");
    }
  }

  const inputClass = "h-10 w-full rounded-lg border border-[#ded7cb] bg-white/60 px-3 text-[12px] text-[#241f19] outline-none transition placeholder:text-[#aaa093] focus:border-[#a92230] focus:ring-2 focus:ring-[#e63946]/10";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#171411]/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="outreach-title" className="beaky-enter max-h-[94vh] w-full max-w-[760px] overflow-y-auto rounded-t-[20px] border border-white bg-[#faf7f0] p-5 shadow-[0_24px_80px_rgba(23,43,50,0.25)] sm:rounded-[20px] sm:p-7">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold tracking-[0.15em] text-[#a92230] uppercase">1-to-1 Outreach Engine</p>
            <h2 id="outreach-title" className="mt-1 text-[25px] tracking-[-0.035em] text-[#171411]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>
              Tailor and dispatch.
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#81786d]">
              <span>{job.title} · {job.companyName}</span>
              {job.applicationLink ? (
                <>
                  <span>·</span>
                  <a
                    href={job.applicationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#a92230] hover:underline"
                  >
                    <span>Official Portal</span>
                    <ExternalLink size={10} />
                  </a>
                </>
              ) : null}
            </div>
          </div>
          <button type="button" aria-label="Close" disabled={Boolean(busy)} onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#72695e] transition hover:bg-black/5 hover:text-[#171411]">
            <X size={16} />
          </button>
        </header>

        {!hasProfile ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#ebd5ae] bg-[#fbf3e3] p-3 text-[11px] text-[#936523]">
            <Info size={14} className="shrink-0 text-[#936523]" />
            <span>
              <strong className="font-semibold">Tip:</strong> Go to <strong>Profile</strong> and click <strong>Analyze resume</strong> to personalize this email using your verified experience and projects.
            </span>
          </div>
        ) : null}

        {!draftId ? (
          <form onSubmit={createDraft} className="mt-5 space-y-3.5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="min-w-0 flex-1 text-[10px] font-semibold text-[#675e52]">
                Recruiter / Hiring Manager Email
                <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="recruiter@company.com" className={`${inputClass} mt-1.5`} />
              </label>
              <Button type="button" variant="outline" disabled={finding} onClick={() => void findRecruiter()} className="mt-auto h-10 shrink-0">
                {finding ? <LoaderCircle size={13} className="animate-spin" /> : <Search size={13} />}
                {finding ? "Searching Directory…" : "Find Recruiter"}
              </Button>
            </div>

            <label className="block text-[10px] font-semibold text-[#675e52]">
              Recruiter Name <span className="font-normal text-[#9d9284]">(optional)</span>
              <input value={recruiterName} onChange={(event) => setRecruiterName(event.target.value)} placeholder="e.g. Sarah Jenkins or Talent Acquisition" className={`${inputClass} mt-1.5`} />
            </label>

            {recruiters.length ? (
              <div className="space-y-2">
                <p className="text-[9px] font-semibold tracking-[0.08em] text-[#807669] uppercase">Discovered Contacts</p>
                <div className="max-h-44 divide-y divide-[#30291f18] overflow-y-auto rounded-lg border border-[#ded7cb] bg-white/55">
                  {recruiters.map((contact) => (
                    <button key={contact.email} type="button" onClick={() => selectRecruiter(contact)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-white">
                      <span className="min-w-0">
                        <span className="block truncate text-[11px] font-semibold text-[#241f19]">{contact.name || contact.email}</span>
                        <span className="mt-0.5 block truncate text-[9px] text-[#81786d]">{contact.email} · {contact.title || "Company contact"}</span>
                      </span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider ${
                        contact.verification === "verified"
                          ? "bg-[#e7f5ea] text-[#2c7448]"
                          : contact.verification === "hunter_indexed"
                          ? "bg-[#e8f1fa] text-[#1e5d8a]"
                          : "bg-[#fbf3e3] text-[#936523]"
                      }`}>
                        {contact.verification === "verified"
                          ? "Verified"
                          : contact.verification === "hunter_indexed"
                          ? "Hunter Index"
                          : "Inferred"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <label className="block text-[10px] font-semibold text-[#675e52]">
              Email Tone
              <select value={tone} onChange={(event) => setTone(event.target.value)} className={`${inputClass} mt-1.5`}>
                <option>Engaging</option>
                <option>Professional</option>
                <option>Formal</option>
              </select>
            </label>

            {notice ? <p role="status" className="rounded-lg bg-[#e7f5ea] px-3 py-2 text-[10px] font-medium text-[#2c7448]">{notice}</p> : null}
            {error ? <p role="alert" className="rounded-lg bg-[#a9223010] px-3 py-2 text-[10px] text-[#a43d32]">{error}</p> : null}

            <div className="flex justify-end border-t border-[#30291f1c] pt-4">
              <Button type="submit" disabled={busy === "draft"}>
                {busy === "draft" ? <LoaderCircle size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {busy === "draft" ? "Drafting with Gemini…" : "Generate Tailored Draft"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-5 space-y-3.5">
            <label className="block text-[10px] font-semibold text-[#675e52]">
              Recipient (To)
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={draftStatus === "sent"} className={`${inputClass} mt-1.5`} />
            </label>
            <label className="block text-[10px] font-semibold text-[#675e52]">
              Subject
              <input value={subject} maxLength={200} onChange={(event) => setSubject(event.target.value)} disabled={draftStatus === "sent"} className={`${inputClass} mt-1.5`} />
            </label>
            <label className="block text-[10px] font-semibold text-[#675e52]">
              Message Body (Editable)
              <textarea value={body} maxLength={15000} onChange={(event) => setBody(event.target.value)} disabled={draftStatus === "sent"} className="mt-1.5 min-h-48 w-full resize-y rounded-lg border border-[#ded7cb] bg-white/60 px-3 py-2.5 text-[12px] leading-5 text-[#241f19] outline-none transition focus:border-[#a92230] focus:ring-2 focus:ring-[#e63946]/10" />
            </label>

            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#ded7cb] bg-white/40 px-3 py-2 text-[10px] text-[#514a40]">
              <Paperclip size={13} className="text-[#81786d]" />
              {resumeReady ? (
                <>
                  <span className="font-semibold">{resumeName || "Resume.pdf"}</span>
                  <span className="text-[#81786d]">
                    {isMobile ? "will attach to Gmail app / include direct PDF link" : "will attach to dispatch & include direct PDF link"}
                  </span>
                </>
              ) : (
                <span className="text-[#a92230]">Upload a PDF resume in Profile to include as attachment.</span>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-[#f9f7f4] border border-[#ded7cb]/80 p-2 text-[10px] text-[#514a40]">
              <Info size={13} className="text-[#81786d] shrink-0 mt-0.5" />
              <span>
                {isMobile ? (
                  <>
                    <strong>Mobile quick send:</strong> Click <strong>&quot;Open in Gmail App&quot;</strong> to open your phone&apos;s Gmail app with your resume attached, or copy to send anywhere.
                  </>
                ) : (
                  <>
                    <strong>Two ways to send:</strong> Click <strong>&quot;Open in Gmail Web&quot;</strong> for zero-setup instant sending in your browser, or use <strong>&quot;API Send&quot;</strong> if you are a whitelisted Google Cloud tester.
                  </>
                )}
              </span>
            </div>

            {notice ? <p role="status" className="rounded-lg bg-[#e7f5ea] px-3 py-2 text-[10px] font-medium text-[#2c7448]">{notice}</p> : null}
            {error ? <p role="alert" className="rounded-lg bg-[#a9223010] px-3 py-2 text-[10px] text-[#a43d32]">{error}</p> : null}

            <div className="flex flex-col-reverse gap-2 border-t border-[#30291f1c] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[10px] text-[#81786d]">Sending from {senderEmail}</span>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="small" disabled={Boolean(busy)} onClick={() => void copyPitch()}>
                  {copied ? <Check size={12} className="text-[#2c7448]" /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy"}
                </Button>

                <Button type="button" variant="outline" size="small" disabled={Boolean(busy) || draftStatus === "sent"} onClick={() => void saveDraft()}>
                  {busy === "save" ? <LoaderCircle size={12} className="animate-spin" /> : null}
                  Save Draft
                </Button>

                {/* Primary 1-Click Send for Mobile (Gmail App) & Desktop (Gmail Web) */}
                <button
                  type="button"
                  disabled={Boolean(busy) || draftStatus === "sent"}
                  onClick={() => void launchGmail()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#a92230] bg-[#a92230] px-3.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#8e1b26] active:translate-y-px"
                >
                  {isMobile ? <Share2 size={12} /> : <ExternalLink size={12} />}
                  {isMobile ? "Open in Gmail App" : "Open in Gmail Web"}
                </button>

                {/* Direct Gmail API */}
                <Button
                  type="button"
                  variant="outline"
                  size="small"
                  disabled={Boolean(busy) || draftStatus === "sent"}
                  onClick={() => void approveAndSendViaGmail()}
                  title="Direct background API send (for registered Google Cloud testers)"
                >
                  {busy === "send" ? <LoaderCircle size={12} className="animate-spin" /> : draftStatus === "sent" ? <Check size={12} /> : <Send size={12} />}
                  {busy === "send" ? "Sending via API…" : draftStatus === "sent" ? "Sent" : "API Send"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
