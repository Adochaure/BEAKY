"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";
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

type ActivityLog = {
  id: string;
  step: string;
  result: Record<string, unknown>;
  created_at: string;
};

const statusStyles = {
  draft: "bg-[#f0efed] text-[#71695f]",
  approved: "bg-[#fff0e8] text-[#a45d32]",
  sending: "bg-[#fff6e6] text-[#856132]",
  sent: "bg-[#e7f5ea] text-[#2c7448]",
} as const;

export function EmailHistory() {
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<"emails" | "logs">("emails");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = createClient();
      try {
        const [{ data: draftsData, error: draftsError }, { data: logsData }] = await Promise.all([
          supabase.from("outreach_drafts")
            .select("id, job_title, company, recruiter_email, subject, body, application_link, status, created_at, sent_at")
            .order("created_at", { ascending: false }),
          supabase.from("discovery_logs")
            .select("id, step, result, created_at")
            .order("created_at", { ascending: false })
            .limit(40),
        ]);

        if (!active) return;
        if (draftsError) setError("Could not load email activity. Confirm the outreach migration is installed.");
        else setEmails(draftsData ?? []);

        setLogs((logsData as unknown as ActivityLog[]) ?? []);
      } catch {
        if (active) setError("Could not load activity records.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  function formatTime(iso: string) {
    try {
      return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  function launchGmail(email: EmailRow) {
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email.recruiter_email)}&su=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] px-8 pb-14 pt-9 max-lg:px-6 max-sm:px-4 max-sm:pt-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[clamp(2.15rem,4vw,2.9rem)] leading-[1.08] tracking-[-0.045em] text-[#171411]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>
            Email &amp; connector history.
          </h1>
          <p className="mt-2 text-sm text-[#766f67]">
            Review all tailored cold emails, dispatched messages, and live connector activity logs.
          </p>
        </div>

        {/* View switcher */}
        <div className="flex items-center rounded-[8px] border border-[#ded8cd] bg-[#f8f4ec] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("emails")}
            className={`rounded-[6px] px-3 py-1.5 text-[11px] font-semibold transition ${
              activeTab === "emails"
                ? "bg-[#211a14] text-white shadow-sm"
                : "text-[#786f63] hover:text-[#211a14]"
            }`}
          >
            Outreach Messages ({emails.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[11px] font-semibold transition ${
              activeTab === "logs"
                ? "bg-[#211a14] text-white shadow-sm"
                : "text-[#786f63] hover:text-[#211a14]"
            }`}
          >
            <Activity size={12} />
            Connector Logs ({logs.length})
          </button>
        </div>
      </header>

      {error ? <p role="alert" className="mt-4 rounded-lg border border-[#edc2bc] bg-[#fff0ed] px-3 py-2 text-[11px] text-[#a43d32]">{error}</p> : null}

      {activeTab === "emails" ? (
        <div className="mt-6">
          <div className="flex items-center justify-between border-b border-[#30291f1c] pb-3 text-[10px] text-[#958b7e]">
            <span>{loading ? "Loading messages…" : `${emails.length} total messages in workspace`}</span>
            {emails.some((e) => e.status === "sent") ? (
              <span className="inline-flex items-center gap-1 text-[#2c7448]">
                <CheckCircle2 size={12} /> Dispatched from personal Gmail
              </span>
            ) : null}
          </div>

          {!loading && !error && emails.length === 0 ? (
            <div className="mt-8 flex min-h-[260px] flex-col items-center justify-center border-y border-[#30291f1c] px-5 py-12 text-center">
              <div className="grid size-11 place-items-center rounded-full border border-[#e2dbcf] bg-[#f8f4ec] text-[#847866]"><Mail size={18} /></div>
              <h2 className="mt-4 text-[18px] text-[#211a14]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>No email drafts yet</h2>
              <p className="mt-1.5 max-w-[360px] text-xs leading-5 text-[#81786d]">Go to Jobs &amp; Opportunities, choose a role, and click &quot;Prepare Email&quot; to generate your first tailored message.</p>
            </div>
          ) : null}

          <ul className="divide-y divide-[#30291f18] border-b border-[#30291f18]">
            {emails.map((email) => (
              <li key={email.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold text-[#211a14]">{email.subject}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold capitalize ${statusStyles[email.status]}`}>
                      {email.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-[#766f67]">
                    <span className="font-semibold text-[#3a342c]">{email.company}</span> · {email.job_title} · <span className="text-[#a92230]">To: {email.recruiter_email}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-[10px] leading-4 text-[#8b8174]">{email.body}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                  <span className="inline-flex items-center gap-1 text-[9px] text-[#8b8174]">
                    <Clock3 size={11} /> {formatTime(email.sent_at ?? email.created_at)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => launchGmail(email)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#ded7cb] bg-white px-2.5 py-1 text-[9px] font-semibold text-[#211a14] transition hover:bg-[#faf7f0]"
                    >
                      <Send size={10} /> Open in Gmail
                    </button>
                    {email.application_link ? (
                      <a
                        href={email.application_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-[#ded7cb] bg-white px-2.5 py-1 text-[9px] text-[#756b5d] transition hover:text-[#a92230]"
                      >
                        Listing <ExternalLink size={10} />
                      </a>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* Connector & Discovery Activity Logs */
        <div className="mt-6">
          <div className="flex items-center justify-between border-b border-[#30291f1c] pb-3 text-[10px] text-[#958b7e]">
            <span>Audit trail of recruiter MX checks, AI generations, and Gmail dispatches</span>
          </div>

          {!loading && logs.length === 0 ? (
            <div className="mt-8 flex min-h-[220px] flex-col items-center justify-center border-y border-[#30291f1c] px-5 py-12 text-center">
              <div className="grid size-11 place-items-center rounded-full border border-[#e2dbcf] bg-[#f8f4ec] text-[#847866]"><Activity size={18} /></div>
              <h2 className="mt-4 text-[17px] text-[#211a14]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>No connector activity yet</h2>
              <p className="mt-1 text-xs text-[#81786d]">Actions taken in Beaky are recorded here in real time.</p>
            </div>
          ) : null}

          <ul className="divide-y divide-[#30291f18] border-b border-[#30291f18]">
            {logs.map((log) => {
              const isSend = log.step.includes("send");
              const isDraft = log.step.includes("draft");
              const isAnalysis = log.step.includes("resume");

              const badgeColor = isSend
                ? "bg-[#e7f5ea] text-[#2c7448] border-[#b8dfc4]"
                : isDraft
                  ? "bg-[#f5eefc] text-[#6b3191] border-[#dfc6f5]"
                  : isAnalysis
                    ? "bg-[#edf4fb] text-[#2d5f8b] border-[#bed6ee]"
                    : "bg-[#fcf5e8] text-[#8e6022] border-[#ebd6ab]";

              return (
                <li key={log.id} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                        {log.step.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] font-medium text-[#211a14]">
                        {isSend
                          ? `Outreach dispatched to ${(log.result as Record<string, unknown>).to ?? "recruiter"}`
                          : isDraft
                            ? `Draft generated for ${(log.result as Record<string, unknown>).company ?? "company"}`
                            : isAnalysis
                              ? `Resume analyzed · ${(log.result as Record<string, unknown>).skillsCount ?? 0} skills extracted`
                              : "Verification check performed"}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#786f62]">
                      {JSON.stringify(log.result).slice(0, 160)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-[#968b7e]">
                    {formatTime(log.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
