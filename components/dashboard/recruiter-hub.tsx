"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Check,
  Clipboard,
  Download,
  Mail,
  Plus,
  Search,
  ShieldAlert,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { DomainStatus } from "@/lib/supabase/database.types";

type MailCheck = DomainStatus;
type ContactFilter = "All" | "Domain OK" | "No MX" | "Do not contact";

type RecruiterContact = {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  domain: string;
  mailCheck: MailCheck;
  checkMessage: string;
  checkedAt: string;
  doNotContact: boolean;
};

type ContactDraft = Pick<RecruiterContact, "name" | "title" | "company" | "email">;

const emptyDraft: ContactDraft = { name: "", title: "", company: "", email: "" };
const filterOptions: ContactFilter[] = ["All", "Domain OK", "No MX", "Do not contact"];

const checkLabels: Record<MailCheck, string> = {
  mx_found: "MX found",
  no_mx: "No MX",
  invalid_domain: "Invalid domain",
  check_failed: "Check unavailable",
};

const checkColors: Record<MailCheck, string> = {
  mx_found: "border-[#b8dfc4] bg-[#e7f5ea] text-[#2c7448]",
  no_mx: "border-[#ebd5ae] bg-[#fbf3e3] text-[#936523]",
  invalid_domain: "border-[#edc2bc] bg-[#fff0ed] text-[#a43d32]",
  check_failed: "border-[#ddd6ca] bg-[#f5f1e9] text-[#73695d]",
};

function ContactForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (contact: Omit<RecruiterContact, "id" | "doNotContact">) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ContactDraft>(emptyDraft);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/contacts/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: draft.email }),
      });
      const result = (await response.json()) as {
        domain?: string;
        status?: MailCheck;
        message?: string;
        error?: string;
      };
      if (!response.ok || !result.domain || !result.status) {
        throw new Error(result.error ?? "Could not check this email domain.");
      }
      await onSave({
        name: draft.name.trim(),
        title: draft.title.trim(),
        company: draft.company.trim(),
        email: draft.email.trim().toLowerCase(),
        domain: result.domain,
        mailCheck: result.status,
        checkMessage: result.message ?? "Domain check complete.",
        checkedAt: new Date().toISOString(),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not check this email domain.");
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "mt-1.5 h-10 w-full rounded-lg border border-[#ded7cb] bg-transparent px-3 text-[12px] text-[#241f19] outline-none transition placeholder:text-[#aaa093] focus:border-[#a92230] focus:bg-white/60 focus:ring-2 focus:ring-[#e63946]/10";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#171411]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-contact-title"
        className="beaky-enter max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-t-[20px] border border-white bg-[#faf7f0] p-5 shadow-[0_24px_80px_rgba(23,43,50,0.22)] sm:rounded-[20px] sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold tracking-[0.15em] text-[#8a8073] uppercase">Contact log</p>
            <h2 id="new-contact-title" className="mt-1 text-[25px] tracking-[-0.035em] text-[#171411]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>
              Add a recruiter
            </h2>
            <p className="mt-1 text-[11px] leading-5 text-[#81786d]">We&apos;ll check the domain&apos;s mail routing and save the result.</p>
          </div>
          <button type="button" aria-label="Close" disabled={pending} onClick={onClose} className="grid size-8 place-items-center rounded-lg text-[#72695e] transition hover:bg-black/5 hover:text-[#171411] focus-visible:outline-2 focus-visible:outline-[#e63946]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-semibold text-[#675e52]">
              Recruiter name <span className="font-normal text-[#9d9284]">(optional)</span>
              <input className={inputClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Name" />
            </label>
            <label className="text-[10px] font-semibold text-[#675e52]">
              Job title <span className="font-normal text-[#9d9284]">(optional)</span>
              <input className={inputClass} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Talent partner" />
            </label>
          </div>
          <label className="block text-[10px] font-semibold text-[#675e52]">
            Company <span className="text-[#a92230]">*</span>
            <input required className={inputClass} value={draft.company} onChange={(event) => setDraft({ ...draft, company: event.target.value })} placeholder="Company name" />
          </label>
          <label className="block text-[10px] font-semibold text-[#675e52]">
            Email address <span className="text-[#a92230]">*</span>
            <input required type="email" autoComplete="email" className={inputClass} value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} placeholder="recruiter@company.com" />
          </label>
          <p className="rounded-lg border border-[#e6dfd3] bg-white/45 px-3 py-2 text-[10px] leading-4 text-[#81786d]">
            An MX check confirms the domain has mail routing. It cannot confirm that this specific inbox exists.
          </p>
          {error ? <p role="alert" className="rounded-lg bg-[#a9223010] px-3 py-2 text-[11px] text-[#a43d32]">{error}</p> : null}
          <div className="flex flex-col-reverse gap-2 border-t border-[#30291f1c] pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <span className="size-3.5 animate-spin rounded-full border-2 border-white/45 border-t-white" /> : <Search size={14} />}
              {pending ? "Checking domain…" : "Check & save contact"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function csvCell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function RecruiterHub() {
  const [contacts, setContacts] = useState<RecruiterContact[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContactFilter>("All");
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("recruiter_contacts")
          .select("id, name, title, company, email, domain, domain_status, check_message, checked_at, do_not_contact")
          .order("checked_at", { ascending: false });
        if (!active) return;
        if (error) {
          setLoadError(true);
        } else {
          let rows = data ?? [];
          const legacyJson = window.localStorage.getItem("beaky.recruiter-contacts.v1");
          if (legacyJson) {
            try {
              const parsed: unknown = JSON.parse(legacyJson);
              const legacy = Array.isArray(parsed) ? parsed.filter((item): item is Record<string, unknown> =>
                Boolean(item && typeof item === "object" && typeof item.company === "string" && typeof item.email === "string"),
              ) : [];
              const seen = new Set(rows.map((row) => row.email.toLowerCase()));
              const allowedStatuses: MailCheck[] = ["mx_found", "no_mx", "invalid_domain", "check_failed"];
              const imports = legacy.filter((item) => {
                const email = String(item.email).trim().toLowerCase();
                if (seen.has(email)) return false;
                seen.add(email);
                return true;
              }).map((item) => ({
                name: typeof item.name === "string" ? item.name : "",
                title: typeof item.title === "string" ? item.title : "",
                company: String(item.company).slice(0, 200),
                email: String(item.email).trim().toLowerCase().slice(0, 254),
                domain: typeof item.domain === "string" ? item.domain : String(item.email).split("@").at(-1) ?? "",
                domain_status: (allowedStatuses.includes(item.mailCheck as MailCheck) ? item.mailCheck : "check_failed") as MailCheck,
                check_message: typeof item.checkMessage === "string" ? item.checkMessage : "Imported from this browser before Supabase was connected.",
                checked_at: typeof item.checkedAt === "string" && !Number.isNaN(Date.parse(item.checkedAt)) ? item.checkedAt : new Date().toISOString(),
                do_not_contact: item.doNotContact === true,
              }));
              if (imports.length) {
                const { data: userResult } = await supabase.auth.getUser();
                const userId = userResult.user?.id;
                if (userId) {
                  const { data: imported, error: importError } = await supabase
                    .from("recruiter_contacts")
                    .insert(imports.map((item) => ({ ...item, user_id: userId })))
                    .select("id, name, title, company, email, domain, domain_status, check_message, checked_at, do_not_contact");
                  if (!importError && imported) rows = [...imported, ...rows];
                  if (!importError) window.localStorage.removeItem("beaky.recruiter-contacts.v1");
                }
              } else {
                window.localStorage.removeItem("beaky.recruiter-contacts.v1");
              }
            } catch {
              // Keep the original browser data if import or parsing fails.
            }
          }
          if (!active) return;
          setContacts(rows.map((row) => ({
          id: row.id,
          name: row.name,
          title: row.title,
          company: row.company,
          email: row.email,
          domain: row.domain,
          mailCheck: row.domain_status,
          checkMessage: row.check_message,
          checkedAt: row.checked_at,
          doNotContact: row.do_not_contact,
          })));
        }
        setLoaded(true);
      } catch {
        if (active) {
          setLoadError(true);
          setLoaded(true);
        }
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const visibleContacts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contacts
      .filter((contact) => {
        if (filter === "Domain OK") return contact.mailCheck === "mx_found";
        if (filter === "No MX") return contact.mailCheck === "no_mx" || contact.mailCheck === "invalid_domain";
        if (filter === "Do not contact") return contact.doNotContact;
        return true;
      })
      .filter((contact) => !term || [contact.name, contact.title, contact.company, contact.email].join(" ").toLowerCase().includes(term))
      .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
  }, [contacts, filter, search]);

  async function saveContact(contact: Omit<RecruiterContact, "id" | "doNotContact">) {
    const supabase = createClient();
    const { data: userResult, error: userError } = await supabase.auth.getUser();
    if (userError || !userResult.user) throw new Error("Sign in again to save this recruiter.");

    const { data, error } = await supabase
      .from("recruiter_contacts")
      .insert({
        user_id: userResult.user.id,
        name: contact.name,
        title: contact.title,
        company: contact.company,
        email: contact.email,
        domain: contact.domain,
        domain_status: contact.mailCheck,
        check_message: contact.checkMessage,
        checked_at: contact.checkedAt,
      })
      .select("id, name, title, company, email, domain, domain_status, check_message, checked_at, do_not_contact")
      .single();
    if (error || !data) throw new Error("Could not save this contact. Check your database migration and try again.");

    const saved: RecruiterContact = {
      id: data.id,
      name: data.name,
      title: data.title,
      company: data.company,
      email: data.email,
      domain: data.domain,
      mailCheck: data.domain_status,
      checkMessage: data.check_message,
      checkedAt: data.checked_at,
      doNotContact: data.do_not_contact,
    };
    setContacts((current) => [saved, ...current]);
    setShowForm(false);
    setNotice("Contact checked and saved");
    window.setTimeout(() => setNotice(""), 2800);

    const { error: logError } = await supabase.from("discovery_logs").insert({
      user_id: userResult.user.id,
      contact_id: data.id,
      step: "mx_check",
      result: {
        domain: contact.domain,
        status: contact.mailCheck,
        message: contact.checkMessage,
      },
    });
    if (logError) {
      setNotice("Contact saved; activity log could not be recorded.");
      window.setTimeout(() => setNotice(""), 3500);
    }
  }

  async function toggleDoNotContact(id: string) {
    const contact = contacts.find((item) => item.id === id);
    if (!contact) return;
    const doNotContact = !contact.doNotContact;
    const supabase = createClient();
    const { error } = await supabase.from("recruiter_contacts").update({ do_not_contact: doNotContact, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      setNotice("Could not update contact preference.");
      window.setTimeout(() => setNotice(""), 2800);
      return;
    }
    setContacts((current) => current.map((item) => item.id === id ? { ...item, doNotContact } : item));
  }

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setNotice("Email copied");
      window.setTimeout(() => setNotice(""), 2200);
    } catch {
      setNotice("Clipboard access is unavailable in this browser");
      window.setTimeout(() => setNotice(""), 2800);
    }
  }

  function exportContacts() {
    const header = ["Name", "Title", "Company", "Email", "Domain check", "Do not contact", "Checked at"];
    const rows = visibleContacts.map((contact) => [
      contact.name,
      contact.title,
      contact.company,
      contact.email,
      checkLabels[contact.mailCheck],
      contact.doNotContact ? "Yes" : "No",
      contact.checkedAt,
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "beaky-recruiter-contacts.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] px-8 pb-14 pt-9 max-lg:px-6 max-sm:px-4 max-sm:pt-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[clamp(2.15rem,4vw,2.9rem)] leading-[1.08] tracking-[-0.045em] text-[#171411]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>
            Recruiter&apos;s hub.
          </h1>
          <p className="mt-2 text-sm text-[#766f67]">Recruiter contacts from your outreach and saved jobs.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="max-sm:w-full">
          <Plus size={14} /> Add contact
        </Button>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] text-[#958b7e]">{contacts.length} {contacts.length === 1 ? "contact" : "contacts"} in this browser</p>
        <div className="flex items-center gap-1 rounded-[8px] border border-[#ded8cd] bg-[#f8f4ec] p-1" aria-label="Filter contacts">
          {filterOptions.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
              className={`rounded-[6px] px-3 py-1.5 text-[10px] font-medium transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#e63946] max-sm:px-2 ${filter === option ? "bg-[#211a14] text-white shadow-sm" : "text-[#786f63] hover:bg-white/75 hover:text-[#211a14]"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-[#30291f1c] pb-3">
        <label className="relative w-full max-w-[300px]">
          <Search size={13} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-[#9a9083]" />
          <input
            aria-label="Search contacts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search contacts…"
            className="h-8 w-full rounded-[7px] border border-[#ded8cd] bg-transparent pr-3 pl-8 text-[11px] outline-none transition placeholder:text-[#a59b8d] focus:border-[#a92230] focus:bg-white/50"
          />
        </label>
        <Button variant="outline" size="small" onClick={exportContacts} disabled={!visibleContacts.length}>
          <Download size={12} /> Export
        </Button>
        <span className="ml-auto text-[10px] text-[#82796e]">{visibleContacts.length ? `1–${visibleContacts.length} of ${visibleContacts.length}` : "0 contacts"}</span>
      </div>

      {!loaded ? (
        <div className="space-y-3 py-5">{[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse bg-[#f2eee6]" />)}</div>
      ) : loadError ? (
        <div role="alert" className="py-12 text-center text-[11px] text-[#a43d32]">
          Could not load contacts. Confirm the Supabase migration and try again.
        </div>
      ) : visibleContacts.length ? (
        <ul className="divide-y divide-[#30291f12]">
          {visibleContacts.map((contact) => (
            <li key={contact.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-2 py-4 transition-colors hover:bg-white/40 sm:flex-nowrap">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-[#211a14]">{contact.company}</p>
                <p className="mt-1 truncate text-[10px] text-[#81786d]">
                  {[contact.name, contact.title].filter(Boolean).join(" · ") || "Recruiter contact"}
                </p>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Mail size={12} className="shrink-0 text-[#9a9083]" />
                <span className="truncate text-[11px] text-[#514a40]">{contact.email}</span>
                <button type="button" onClick={() => copyEmail(contact.email)} aria-label={`Copy ${contact.email}`} className="grid size-7 shrink-0 place-items-center rounded-md text-[#8d8377] transition hover:bg-[#201b1608] hover:text-[#211a14] focus-visible:outline-2 focus-visible:outline-[#e63946]">
                  <Clipboard size={12} />
                </button>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:w-[200px] sm:justify-end">
                <span title={contact.checkMessage} className={`inline-flex items-center gap-1 rounded-[5px] border px-2 py-1 text-[9px] font-medium ${checkColors[contact.mailCheck]}`}>
                  {contact.mailCheck === "mx_found" ? <Check size={10} /> : <ShieldAlert size={10} />}
                  {checkLabels[contact.mailCheck]}
                </span>
                <button
                  type="button"
                  aria-pressed={contact.doNotContact}
                  onClick={() => toggleDoNotContact(contact.id)}
                  className={`rounded-md px-2 py-1 text-[9px] font-medium transition focus-visible:outline-2 focus-visible:outline-[#e63946] ${contact.doNotContact ? "bg-[#211a14] text-white" : "text-[#897f73] hover:bg-[#201b1608] hover:text-[#211a14]"}`}
                >
                  {contact.doNotContact ? "Do not contact" : "Mark no contact"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex min-h-[245px] flex-col items-center justify-center px-5 py-12 text-center">
          <div className="grid size-10 place-items-center rounded-full border border-[#e2dbcf] bg-[#f8f4ec] text-[#847866]">
            {contacts.length ? <Search size={16} /> : <UsersRound size={16} />}
          </div>
          <h2 className="mt-4 text-[17px] tracking-[-0.02em] text-[#211a14]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>
            {contacts.length ? "No matching contacts" : "No recruiter contacts yet"}
          </h2>
          <p className="mt-1.5 max-w-[340px] text-[11px] leading-5 text-[#81786d]">
            {contacts.length ? "Try another search or filter." : "Add a recruiter email to check its domain and start your contact log."}
          </p>
          {!contacts.length ? <Button size="small" className="mt-4" onClick={() => setShowForm(true)}><Plus size={13} />Add first contact</Button> : null}
        </div>
      )}

      <p className="mt-3 border-t border-[#30291f12] pt-3 text-[9px] leading-4 text-[#9a9083]">
        An MX result checks domain mail routing only. It does not verify a person&apos;s inbox or prove they are a recruiter. Contacts are saved to your account.
      </p>

      {notice ? <div role="status" className="beaky-enter fixed right-5 bottom-5 z-[80] rounded-lg border border-[#ddd6ca] bg-[#faf7f0] px-4 py-3 text-[11px] font-medium text-[#4c4439] shadow-[0_8px_28px_rgba(23,43,50,0.14)] max-sm:right-3 max-sm:bottom-3">{notice}</div> : null}
      {showForm ? <ContactForm onClose={() => setShowForm(false)} onSave={saveContact} /> : null}
    </div>
  );
}
