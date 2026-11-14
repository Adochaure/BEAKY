"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, LoaderCircle, Search, Send, X } from "lucide-react";
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

type Recruiter = { email: string; name: string; title: string; department?: string; confidence: number | null; verification: string; matchType?: "opportunity" | "recruiter" | "company" };
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
      reject(new Error("Gmail sending needs a Google web client ID and the Google Identity Services script."));
      return;
    }
    const client = tokenClient.initTokenClient({
      client_id: clientId,
      scope: "openid email profile https://www.googleapis.com/auth/gmail.send",
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || "Gmail permission was not granted."));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => reject(new Error(error.message || "Google’s permission window could not open.")),
    });
    client.requestAccessToken({ hint: email, prompt: "" });
  });
}

export function OutreachReview({ job, onClose, onSent }: { job: Job; onClose: () => void; onSent: () => void }) {
  const [email, setEmail] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("there");
  const [resumeName, setResumeName] = useState("");
  const [resumeReady, setResumeReady] = useState(false);
  const [tone, setTone] = useState("Engaging");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [draftId, setDraftId] = useState("");
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("draft");
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [finding, setFinding] = useState(false);
  const [busy, setBusy] = useState<"draft" | "save" | "send" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const supabase = createClient();
      const [{ data: { user } }, { data: profile }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("user_profiles").select("resume_path, resume_name").maybeSingle(),
      ]);
      if (!active) return;
      const userEmail = user?.email ?? "";
      setSenderEmail(userEmail);
      setSenderName(userEmail.includes("@") ? userEmail.slice(0, userEmail.indexOf("@")) : "there");
      setResumeReady(Boolean(profile?.resume_path));
      setResumeName(profile?.resume_name ?? "");
    }
    void loadProfile().catch(() => setError("Could not load your profile. Refresh and try again."));
    return () => { active = false; };
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
        body: JSON.stringify({ company: job.companyName, jobTitle: job.title, description: job.description ?? job.excerpt ?? "" }),
      });
      const result = await response.json() as { contacts?: Recruiter[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not find recruiters for this company.");
      setRecruiters(result.contacts ?? []);
      if (!result.contacts?.length) setNotice("No public recruiter emails were found for this company. Enter an email manually or try the company domain in the Recruiters page.");
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
    setNotice(`${contact.title || "Recruiter contact"} selected. Please review the address before sending.`);
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
        throw new Error(generated.error ?? "Could not generate a job-specific email.");
      }
      const draft = { subject: generated.subject, body: generated.body };
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
        subject: draft.subject,
        body: draft.body,
      }).select("id").single();
      if (insertError || !data) throw new Error("Could not save this draft. Confirm the outreach migration is installed.");
      setSubject(draft.subject);
      setBody(draft.body);
      setDraftId(data.id);
      setDraftStatus("draft");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create an email draft.");
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
      setNotice("Draft saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this draft.");
    } finally {
      setBusy(null);
    }
  }

  async function approveAndSend() {
    if (!draftId || !resumeReady || !senderEmail) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Add NEXT_PUBLIC_GOOGLE_CLIENT_ID and enable Gmail API to send messages.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !subject.trim() || !body.trim()) {
      setError("Review a valid recipient, subject, and message before sending.");
      return;
    }

    setBusy("send");
    setError("");
    setNotice("");
    // Open Google's consent flow directly from this click before awaiting network work.
    const tokenPromise = requestGmailAccessToken(senderEmail);
    void tokenPromise.catch(() => {});
    try {
      const supabase = createClient();
      const { error: approveError } = await supabase.from("outreach_drafts").update({
        status: "approved",
        recruiter_name: recruiterName.trim().slice(0, 200),
        recruiter_email: email.trim().toLowerCase(),
        subject: subject.trim(),
        body: body.trim(),
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", draftId).eq("status", "draft");
      if (approveError) throw new Error("Could not record your approval. Save the draft and try again.");
      setDraftStatus("approved");
      const accessToken = await tokenPromise;
      setDraftStatus("sending");
      const response = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draftId, accessToken }),
      });
      const result = await response.json() as { ok?: boolean; error?: string; uncertain?: boolean };
      if (!response.ok || !result.ok) {
        if (!result.uncertain) setDraftStatus("approved");
        throw new Error(result.error ?? "Gmail could not send this message.");
      }
      setDraftStatus("sent");
      setNotice("Email sent with your resume attached.");
      onSent();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send this email.");
    } finally {
      setBusy(null);
    }
  }

  const inputClass = "h-10 w-full rounded-lg border border-[#ded7cb] bg-white/55 px-3 text-[12px] text-[#241f19] outline-none transition placeholder:text-[#aaa093] focus:border-[#a92230] focus:ring-2 focus:ring-[#e63946]/10";
  const sendReady = Boolean(draftId && resumeReady && senderEmail && draftStatus !== "sent");

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#171411]/40 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="outreach-title" className="beaky-enter max-h-[94vh] w-full max-w-[760px] overflow-y-auto rounded-t-[20px] border border-white bg-[#faf7f0] p-5 shadow-[0_24px_80px_rgba(23,43,50,0.25)] sm:rounded-[20px] sm:p-7">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold tracking-[0.15em] text-[#a92230] uppercase">Human review before sending</p>
            <h2 id="outreach-title" className="mt-1 text-[25px] tracking-[-0.035em] text-[#171411]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>Prepare your email.</h2>
            <p className="mt-1 text-[11px] text-[#81786d]">{job.title} · {job.companyName}</p>
          </div>
          <button type="button" aria-label="Close" disabled={Boolean(busy)} onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#72695e] transition hover:bg-black/5 hover:text-[#171411] focus-visible:outline-2 focus-visible:outline-[#e63946]"><X size={16} /></button>
        </header>

        {!draftId ? (
          <form onSubmit={createDraft} className="mt-5 space-y-3.5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="min-w-0 flex-1 text-[10px] font-semibold text-[#675e52]">Recruiter email
                <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="recruiter@company.com" className={`${inputClass} mt-1.5`} />
              </label>
              <Button type="button" variant="outline" disabled={finding} onClick={() => void findRecruiter()} className="mt-auto h-10 shrink-0">
                {finding ? <LoaderCircle size={13} className="animate-spin" /> : <Search size={13} />}{finding ? "Searching…" : "Find recruiter"}
              </Button>
            </div>
            <label className="block text-[10px] font-semibold text-[#675e52]">Recruiter name <span className="font-normal text-[#9d9284]">(optional)</span>
              <input value={recruiterName} onChange={(event) => setRecruiterName(event.target.value)} placeholder="Hiring manager or recruiter" className={`${inputClass} mt-1.5`} />
            </label>
            <p className="rounded-lg border border-[#ead7b5] bg-[#fff6e6] px-3 py-2 text-[10px] leading-4 text-[#856132]">We’ll look for recruiter emails for this employer first. If none are listed, other company emails appear separately. Hunter may use credits; review every address before using it.</p>
            {recruiters.length ? (
              <div className="space-y-2">
                {(["opportunity", "recruiter", "company"] as const).map((matchType) => {
                  const group = recruiters.filter((contact) => contact.matchType === matchType);
                  if (!group.length) return null;
                  const groupLabel = matchType === "opportunity" ? "Email from this job posting" : matchType === "recruiter" ? "Recruiter matches" : "Other company emails";
                  return <div key={matchType}>
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#807669]">{groupLabel}</p>
                    <div className="max-h-44 divide-y divide-[#30291f18] overflow-y-auto rounded-lg border border-[#ded7cb] bg-white/55">
                      {group.map((contact) => (
                        <button key={contact.email} type="button" onClick={() => selectRecruiter(contact)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-white">
                          <span className="min-w-0"><span className="block truncate text-[11px] font-semibold text-[#241f19]">{contact.name || contact.email}</span><span className="mt-0.5 block truncate text-[9px] text-[#81786d]">{contact.email} · {contact.title || contact.department || "Company contact"}</span></span>
                          <span className="shrink-0 text-[8px] text-[#81786d]">{contact.verification}</span>
                        </button>
                      ))}
                    </div>
                  </div>;
                })}
              </div>
            ) : null}
            <label className="block text-[10px] font-semibold text-[#675e52]">Email tone
              <select value={tone} onChange={(event) => setTone(event.target.value)} className={`${inputClass} mt-1.5`}><option>Engaging</option><option>Professional</option><option>Formal</option></select>
            </label>
            {error ? <p role="alert" className="rounded-lg bg-[#a9223010] px-3 py-2 text-[10px] text-[#a43d32]">{error}</p> : null}
            <div className="flex justify-end border-t border-[#30291f1c] pt-4">
              <Button type="submit" disabled={busy === "draft"}>{busy === "draft" ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}{busy === "draft" ? "Creating draft…" : "Generate email"}</Button>
            </div>
          </form>
        ) : (
          <div className="mt-5 space-y-3.5">
      <label className="block text-[10px] font-semibold text-[#675e52]">To
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={draftStatus !== "draft"} className={`${inputClass} mt-1.5`} />
            </label>
            <label className="block text-[10px] font-semibold text-[#675e52]">Subject
              <input value={subject} maxLength={200} onChange={(event) => setSubject(event.target.value)} disabled={draftStatus !== "draft"} className={`${inputClass} mt-1.5`} />
            </label>
            <label className="block text-[10px] font-semibold text-[#675e52]">Message
              <textarea value={body} maxLength={15000} onChange={(event) => setBody(event.target.value)} disabled={draftStatus !== "draft"} className="mt-1.5 min-h-48 w-full resize-y rounded-lg border border-[#ded7cb] bg-white/55 px-3 py-2.5 text-[12px] leading-5 text-[#241f19] outline-none transition focus:border-[#a92230] focus:ring-2 focus:ring-[#e63946]/10" />
            </label>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#ded7cb] bg-white/35 px-3 py-2.5 text-[10px] text-[#514a40]">
              <span aria-hidden="true">📎</span>
              {resumeReady ? <><span className="font-semibold">{resumeName || "Resume.pdf"}</span><span className="text-[#81786d]">will be attached</span></> : <span>Upload a PDF resume in Profile before sending.</span>}
            </div>
            <p className="text-[9px] leading-4 text-[#81786d]">Generated from your analyzed resume profile and the full job description. Review and edit the draft before approving it.</p>
            {notice ? <p role="status" className="text-[10px] text-[#32744c]">{notice}</p> : null}
            {error ? <p role="alert" className="rounded-lg bg-[#a9223010] px-3 py-2 text-[10px] text-[#a43d32]">{error}</p> : null}
            {draftStatus === "sending" ? <p role="status" className="rounded-lg bg-[#fff6e6] px-3 py-2 text-[10px] text-[#856132]">Sending status is uncertain. Check Gmail Sent and Email History before trying again, to avoid a duplicate.</p> : null}
            <div className="flex flex-col-reverse gap-2 border-t border-[#30291f1c] pt-4 sm:flex-row sm:justify-between">
              <span className="self-center text-[9px] text-[#81786d]">From {senderEmail || "your Google account"}</span>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button type="button" variant="outline" disabled={Boolean(busy) || draftStatus !== "draft"} onClick={() => void saveDraft()}>{busy === "save" ? <LoaderCircle size={13} className="animate-spin" /> : null}Save draft</Button>
                <Button type="button" disabled={!sendReady || Boolean(busy) || draftStatus === "sending"} onClick={() => void approveAndSend()}>
                  {busy === "send" ? <LoaderCircle size={13} className="animate-spin" /> : draftStatus === "sent" ? <Check size={13} /> : <Send size={13} />}
                  {busy === "send" ? "Sending…" : draftStatus === "sent" ? "Sent" : "Approve & send"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
