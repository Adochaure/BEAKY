"use client";

import { useEffect, useState } from "react";
import { Clock3, ExternalLink, Mail, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type EmailRow = {
  id: string;
  job_title: string;
  company: string;
  recruiter_email: string;
  subject: string;
  body: string;
  application_link: string;
  status: "draft" | "approved" | "sending" | "sent";
  created_at: string;
  sent_at: string | null;
};

const statusStyles = {
  draft: "bg-[#f0efed] text-[#71695f]",
  approved: "bg-[#fff0e8] text-[#a45d32]",
  sending: "bg-[#fff6e6] text-[#856132]",
  sent: "bg-[#e7f5ea] text-[#2c7448]",
} as const;

export function EmailHistory() {
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = createClient();
      const { data, error: queryError } = await supabase.from("outreach_drafts")
        .select("id, job_title, company, recruiter_email, subject, body, application_link, status, created_at, sent_at")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (queryError) setError("Could not load email activity. Confirm the outreach migration is installed.");
      else setEmails(data ?? []);
      setLoading(false);
    }
    void load().catch(() => {
      if (active) {
        setError("Could not load email activity.");
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1480px] px-8 pb-14 pt-9 max-lg:px-6 max-sm:px-4 max-sm:pt-6">
      <header>
        <h1 className="text-[clamp(2.15rem,4vw,2.9rem)] leading-[1.08] tracking-[-0.045em] text-[#171411]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>Email history.</h1>
        <p className="mt-2 text-sm text-[#766f67]">Your saved drafts and approved outreach, including messages sent from Gmail.</p>
      </header>

      <div className="mt-7 flex items-center justify-between border-b border-[#30291f1c] pb-3">
        <p className="text-[10px] text-[#958b7e]">{loading ? "Loading activity…" : `${emails.length} ${emails.length === 1 ? "message" : "messages"}`}</p>
        {emails.some((email) => email.status === "sent") ? <span className="inline-flex items-center gap-1 text-[9px] text-[#55754e]"><Send size={11} />Gmail connected when sent</span> : null}
      </div>

      {error ? <p role="alert" className="mt-4 rounded-lg border border-[#edc2bc] bg-[#fff0ed] px-3 py-2 text-[11px] text-[#a43d32]">{error}</p> : null}
      {!loading && !error && emails.length === 0 ? (
        <div className="mt-8 flex min-h-[260px] flex-col items-center justify-center border-y border-[#30291f1c] px-5 py-12 text-center">
          <div className="grid size-11 place-items-center rounded-full border border-[#e2dbcf] bg-[#f8f4ec] text-[#847866]"><Mail size={18} /></div>
          <h2 className="mt-4 text-[18px] text-[#211a14]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>No email drafts yet</h2>
          <p className="mt-1.5 max-w-[360px] text-xs leading-5 text-[#81786d]">Find a remote role in Jobs &amp; Emails, prepare an outreach message, and review it before sending.</p>
        </div>
      ) : null}

      <ul className="mt-1 divide-y divide-[#30291f18] border-b border-[#30291f18]">
        {emails.map((email) => (
          <li key={email.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-[#211a14]">{email.subject}</p>
              <p className="mt-1 truncate text-[10px] text-[#766f67]">{email.job_title} · {email.company} · To {email.recruiter_email}</p>
              <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-[9px] leading-4 text-[#8b8174]">{email.body}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
              <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize ${statusStyles[email.status]}`}>{email.status}</span>
              <span className="inline-flex items-center gap-1 text-[9px] text-[#8b8174]"><Clock3 size={10} />{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(email.sent_at ?? email.created_at))}</span>
              <a href={email.application_link} target="_blank" rel="noreferrer" aria-label={`Open ${email.job_title} listing`} className="inline-flex items-center gap-1 text-[9px] text-[#756b5d] transition hover:text-[#a92230]">Job <ExternalLink size={10} /></a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
