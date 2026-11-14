"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownUp,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  MapPin,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { OpportunityStatus, OpportunityType } from "@/lib/supabase/database.types";
type FilterStatus = "All opportunities" | OpportunityStatus;

type Opportunity = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: OpportunityType;
  url: string;
  description: string;
  status: OpportunityStatus;
  createdAt: string;
};

type OpportunityDraft = Omit<Opportunity, "id" | "status" | "createdAt">;

const FILTERS: FilterStatus[] = [
  "All opportunities",
  "Saved",
  "Outreach",
  "Replied",
  "Closed",
];

const EMPTY_DRAFT: OpportunityDraft = {
  title: "",
  company: "",
  location: "",
  type: "Job",
  url: "",
  description: "",
};

const statusStyles: Record<OpportunityStatus, string> = {
  Saved: "bg-[#eef4ee] text-[#52665a]",
  Outreach: "bg-[#fff0e8] text-[#a45d32]",
  Replied: "bg-[#e7f3ec] text-[#32744c]",
  Closed: "bg-[#f0efed] text-[#777b79]",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function StatusPill({ status }: { status: OpportunityStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[status]}`}>
      <span className="mr-1.5 size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

function OpportunityForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (draft: OpportunityDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<OpportunityDraft>(EMPTY_DRAFT);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function update<K extends keyof OpportunityDraft>(key: K, value: OpportunityDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (error) setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.company.trim()) {
      setError("Add a role title and company to save this opportunity.");
      return;
    }
    if (draft.url.trim()) {
      try {
        const parsedUrl = new URL(draft.url);
        if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
          setError("Job links must start with https:// or http://.");
          return;
        }
      } catch {
        setError("Enter a complete link starting with https://, or leave it blank.");
        return;
      }
    }
    setPending(true);
    try {
      await onSave({
        ...draft,
        title: draft.title.trim(),
        company: draft.company.trim(),
        location: draft.location.trim(),
        url: draft.url.trim(),
        description: draft.description.trim(),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this opportunity.");
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "mt-1.5 h-11 w-full rounded-xl border border-[#dce3df] bg-white px-3.5 text-sm text-[#172b32] outline-none transition placeholder:text-[#a1aaa6] focus:border-[#e63946] focus:ring-2 focus:ring-[#e63946]/10";
  const labelClass = "text-xs font-semibold text-[#526368]";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#13262b]/35 p-0 backdrop-blur-[3px] sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="add-opportunity-title"
        aria-modal="true"
        className="beaky-enter max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-[24px] border border-white bg-[#fbfcfa] p-5 shadow-[0_24px_80px_rgba(23,43,50,0.24)] sm:rounded-[24px] sm:p-7"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.16em] text-[#e63946] uppercase">
              Opportunity intake
            </p>
            <h2
              id="add-opportunity-title"
              className="mt-1.5 text-[25px] tracking-[-0.04em] text-[#172b32]"
              style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}
            >
              Save a role
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-[#788581]">
              Add a role you found and keep its details in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close form"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-[#718084] transition hover:bg-[#172b3209] hover:text-[#172b32] focus-visible:outline-2 focus-visible:outline-[#e63946]"
          >
            <X size={17} />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Role title <span className="text-[#e63946]">*</span>
              <input
                autoFocus
                className={inputClass}
                value={draft.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Product design intern"
                required
              />
            </label>
            <label className={labelClass}>
              Company <span className="text-[#e63946]">*</span>
              <input
                className={inputClass}
                value={draft.company}
                onChange={(event) => update("company", event.target.value)}
                placeholder="Company name"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Opportunity type
              <span className="relative mt-1.5 block">
                <select
                  className={`${inputClass} appearance-none pr-10`}
                  value={draft.type}
                  onChange={(event) => update("type", event.target.value as OpportunityType)}
                >
                  <option>Job</option>
                  <option>Internship</option>
                  <option>Fellowship</option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#899497]" size={15} />
              </span>
            </label>
            <label className={labelClass}>
              Location
              <input
                className={inputClass}
                value={draft.location}
                onChange={(event) => update("location", event.target.value)}
                placeholder="City, remote, or hybrid"
              />
            </label>
          </div>

          <label className={labelClass}>
            Job link <span className="font-normal text-[#899497]">(optional)</span>
            <input
              className={inputClass}
              type="url"
              value={draft.url}
              onChange={(event) => update("url", event.target.value)}
              placeholder="https://company.com/careers/role"
            />
          </label>

          <label className={labelClass}>
            Job description <span className="font-normal text-[#899497]">(optional)</span>
            <textarea
              className="mt-1.5 min-h-28 w-full resize-y rounded-xl border border-[#dce3df] bg-white px-3.5 py-3 text-sm leading-5 text-[#172b32] outline-none transition placeholder:text-[#a1aaa6] focus:border-[#e63946] focus:ring-2 focus:ring-[#e63946]/10"
              value={draft.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Paste the role description here so you can refer to it later."
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-lg bg-[#e6394610] px-3 py-2 text-xs text-[#bd2634]">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-[#172b320d] pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <span className="size-3.5 animate-spin rounded-full border-2 border-white/45 border-t-white" /> : <Check size={15} />}
              {pending ? "Saving…" : "Save opportunity"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function OpportunityWorkspace() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("All opportunities");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("opportunities")
          .select("id, title, company, location, opportunity_type, job_url, description, status, created_at")
          .order("created_at", { ascending: false });
        if (!active) return;
        if (error) {
          setLoadError(true);
        } else {
          let rows = data ?? [];
          const legacyJson = window.localStorage.getItem("beaky.opportunities.v1");
          if (legacyJson) {
            try {
              const parsed: unknown = JSON.parse(legacyJson);
              const legacy = Array.isArray(parsed) ? parsed.filter((item): item is Record<string, unknown> =>
                Boolean(item && typeof item === "object" && typeof item.title === "string" && typeof item.company === "string"),
              ) : [];
              const seen = new Set(rows.map((row) => `${row.title.toLowerCase()}|${row.company.toLowerCase()}`));
              const imports = legacy.filter((item) => {
                const key = `${String(item.title).toLowerCase()}|${String(item.company).toLowerCase()}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              }).map((item) => ({
                title: String(item.title).slice(0, 200),
                company: String(item.company).slice(0, 200),
                location: typeof item.location === "string" ? item.location : null,
                opportunity_type: (["Job", "Internship", "Fellowship"].includes(String(item.type)) ? item.type : "Job") as OpportunityType,
                job_url: typeof item.url === "string" ? item.url : null,
                description: typeof item.description === "string" ? item.description : null,
                status: (["Saved", "Outreach", "Replied", "Closed"].includes(String(item.status)) ? item.status : "Saved") as OpportunityStatus,
              }));
              if (imports.length) {
                const { data: userResult } = await supabase.auth.getUser();
                const userId = userResult.user?.id;
                if (userId) {
                  const { data: imported, error: importError } = await supabase
                    .from("opportunities")
                    .insert(imports.map((item) => ({ ...item, user_id: userId })))
                    .select("id, title, company, location, opportunity_type, job_url, description, status, created_at");
                  if (!importError && imported) rows = [...imported, ...rows];
                  if (!importError) window.localStorage.removeItem("beaky.opportunities.v1");
                }
              } else {
                window.localStorage.removeItem("beaky.opportunities.v1");
              }
            } catch {
              // Keep the original browser data if import or parsing fails.
            }
          }
          if (!active) return;
          setOpportunities(rows.map((row) => ({
            id: row.id,
            title: row.title,
            company: row.company,
            location: row.location ?? "",
            type: row.opportunity_type,
            url: row.job_url ?? "",
            description: row.description ?? "",
            status: row.status,
            createdAt: row.created_at,
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

  const filteredOpportunities = useMemo(() => {
    const term = search.trim().toLowerCase();
    return opportunities
      .filter((opportunity) => filter === "All opportunities" || opportunity.status === filter)
      .filter((opportunity) =>
        !term ||
        [opportunity.title, opportunity.company, opportunity.location, opportunity.type]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [filter, opportunities, search]);

  const counts = useMemo(
    () => ({
      total: opportunities.length,
      outreach: opportunities.filter((opportunity) => opportunity.status === "Outreach").length,
      replied: opportunities.filter((opportunity) => opportunity.status === "Replied").length,
    }),
    [opportunities],
  );

  async function addOpportunity(draft: OpportunityDraft) {
    const supabase = createClient();
    const { data: userResult, error: userError } = await supabase.auth.getUser();
    if (userError || !userResult.user) throw new Error("Sign in again to save this opportunity.");

    const { data, error } = await supabase
      .from("opportunities")
      .insert({
        user_id: userResult.user.id,
        title: draft.title,
        company: draft.company,
        location: draft.location || null,
        opportunity_type: draft.type,
        job_url: draft.url || null,
        description: draft.description || null,
      })
      .select("id, title, company, location, opportunity_type, job_url, description, status, created_at")
      .single();
    if (error || !data) throw new Error("Could not save this opportunity. Check your database migration and try again.");

    const next: Opportunity = {
      id: data.id,
      title: data.title,
      company: data.company,
      location: data.location ?? "",
      type: data.opportunity_type,
      url: data.job_url ?? "",
      description: data.description ?? "",
      status: data.status,
      createdAt: data.created_at,
    };
    setOpportunities((current) => [next, ...current]);
    setShowForm(false);
    setSavedMessage("Opportunity saved");
    window.setTimeout(() => setSavedMessage(""), 2600);
  }

  async function updateStatus(id: string, status: OpportunityStatus) {
    const supabase = createClient();
    const { error } = await supabase.from("opportunities").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      setSavedMessage("Could not update status. Please try again.");
      window.setTimeout(() => setSavedMessage(""), 3000);
      return;
    }
    setOpportunities((current) =>
      current.map((opportunity) => (opportunity.id === id ? { ...opportunity, status } : opportunity)),
    );
  }

  return (
    <main className="min-h-full bg-[#faf7f0] text-[#172b32]">
      <div className="mx-auto w-[min(1320px,calc(100%-64px))] pb-16 pt-9 max-sm:w-[calc(100%-32px)] max-sm:pt-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-bold tracking-[0.17em] text-[#e63946] uppercase">
              Your search, organized
            </p>
            <h1
              className="mt-2 text-[clamp(2rem,4vw,2.65rem)] leading-[1.08] tracking-[-0.05em] text-[#172b32]"
              style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}
            >
              Find your next opportunity.
            </h1>
            <p className="mt-2 max-w-[540px] text-sm leading-6 text-[#718084]">
              Keep interesting roles together and track each one as you reach out.
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="max-sm:w-full">
            <Plus size={15} strokeWidth={2.2} />
            Add opportunity
          </Button>
        </div>

        <section aria-label="Opportunity summary" className="mt-8 grid grid-cols-3 gap-3 max-sm:mt-6 max-sm:gap-2">
          {[
            { label: "Opportunities", value: counts.total, icon: BriefcaseBusiness },
            { label: "Outreach", value: counts.outreach, icon: ArrowUpRight },
            { label: "Replies", value: counts.replied, icon: Check },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-[16px] border border-white bg-white/75 p-4 shadow-[0_4px_18px_rgba(23,43,50,0.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(23,43,50,0.07)] max-sm:p-3"
            >
              <div className="flex items-center justify-between gap-1 text-[#7b8985]">
                <span className="text-[11px] font-medium max-sm:text-[10px]">{label}</span>
                <Icon size={14} className="text-[#e63946] max-sm:hidden" />
              </div>
              <p className="mt-2 text-[27px] leading-none font-semibold tracking-[-0.05em] text-[#172b32] max-sm:text-[23px]">
                {loaded ? value : "—"}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8 overflow-hidden rounded-[20px] border border-white bg-white/75 shadow-[0_10px_36px_rgba(23,43,50,0.045)] max-sm:mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#172b320c] px-5 py-4 max-sm:px-4">
            <div>
              <h2 className="text-sm font-semibold text-[#24383b]">Your opportunities</h2>
              <p className="mt-0.5 text-[11px] text-[#899497]">
                {opportunities.length} {opportunities.length === 1 ? "role" : "roles"} saved in this browser
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e9eeea] bg-[#fbfcfa] px-2.5 py-1 text-[10px] font-medium text-[#81908b]">
              <ArrowDownUp size={11} />
              Newest first
            </span>
          </div>

          <div className="flex flex-col gap-3 border-b border-[#172b320c] px-5 py-3.5 sm:flex-row sm:items-center sm:px-5">
            <label className="relative min-w-0 flex-1">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-[#98a39f]" size={15} />
              <input
                aria-label="Search opportunities"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search roles or companies"
                className="h-10 w-full rounded-xl border border-[#e2e8e3] bg-[#fbfcfa] pr-3 pl-9 text-xs text-[#172b32] outline-none transition placeholder:text-[#a1aaa6] focus:border-[#e63946]/60 focus:bg-white focus:ring-2 focus:ring-[#e63946]/10"
              />
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`shrink-0 rounded-lg px-2.5 py-2 text-[10px] font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#e63946] ${
                    filter === option
                      ? "bg-[#e63946] text-white shadow-[0_2px_4px_rgba(23,43,50,0.12)] ring-1 ring-[#a92230]"
                      : "text-[#718084] hover:bg-[#f1f5f0] hover:text-[#263a3d]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {!loaded ? (
            <div className="space-y-3 p-5" aria-label="Loading opportunities">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-[68px] animate-pulse rounded-xl bg-[#edf2ed]" />
              ))}
            </div>
          ) : loadError ? (
            <div role="alert" className="px-6 py-12 text-center text-xs text-[#a43d32]">
              Could not load saved jobs. Confirm the Supabase migration and try again.
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center sm:py-[72px]">
              <div className="grid size-12 place-items-center rounded-2xl border border-[#f0d5d2] bg-[#fff8f6] text-[#e63946]">
                {opportunities.length === 0 ? <BriefcaseBusiness size={20} /> : <Search size={19} />}
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-[-0.02em] text-[#263a3d]">
                {opportunities.length === 0 ? "Start with a role you like" : "No matching opportunities"}
              </h3>
              <p className="mt-1.5 max-w-[340px] text-xs leading-5 text-[#7b8985]">
                {opportunities.length === 0
                  ? "Add a job, internship, or fellowship and keep its details close while you plan your outreach."
                  : "Try another search or status filter, or add a new opportunity."}
              </p>
              {opportunities.length === 0 ? (
                <Button className="mt-5" onClick={() => setShowForm(true)}>
                  <Plus size={15} />
                  Add your first opportunity
                </Button>
              ) : null}
            </div>
          ) : (
            <ul className="divide-y divide-[#172b320b]">
              {filteredOpportunities.map((opportunity) => {
                const expanded = expandedId === opportunity.id;
                return (
                  <li key={opportunity.id} className="group transition-colors hover:bg-white/70">
                    <div className="flex items-center gap-3 px-5 py-4 max-sm:items-start max-sm:px-4">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#e9eeea] bg-[#f7faf6] text-[#e63946] transition duration-200 group-hover:scale-[1.03] group-hover:border-[#f0cfcc]">
                        <BriefcaseBusiness size={17} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : opportunity.id)}
                        aria-expanded={expanded}
                        className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e63946]"
                      >
                        <span className="block truncate text-[13px] font-semibold text-[#263a3d] transition-colors group-hover:text-[#172b32]">
                          {opportunity.title}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#81908b]">
                          <span>{opportunity.company}</span>
                          {opportunity.location ? (
                            <>
                              <span className="text-[#c5ceca]">·</span>
                              <span className="inline-flex items-center gap-1"><MapPin size={11} />{opportunity.location}</span>
                            </>
                          ) : null}
                          <span className="text-[#c5ceca]">·</span>
                          <span>{opportunity.type}</span>
                        </span>
                      </button>
                      <div className="flex shrink-0 items-center gap-3 max-sm:flex-col max-sm:items-end max-sm:gap-2">
                        <StatusPill status={opportunity.status} />
                        <span className="w-12 text-right text-[10px] text-[#9ba5a1] max-sm:hidden">
                          {formatDate(opportunity.createdAt)}
                        </span>
                        <ChevronDown
                          size={15}
                          className={`text-[#9ba5a1] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                    {expanded ? (
                      <div className="beaky-enter border-t border-[#172b3208] bg-[#fbfcfa] px-5 py-4 max-sm:px-4">
                        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold tracking-[0.12em] text-[#98a39f] uppercase">Role details</p>
                            {opportunity.description ? (
                              <p className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-[#5e706e] [scrollbar-width:thin]">
                                {opportunity.description}
                              </p>
                            ) : (
                              <p className="mt-2 text-xs text-[#98a39f]">No description added.</p>
                            )}
                            {opportunity.url ? (
                              <a
                                href={opportunity.url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#d83d48] transition hover:text-[#a92230]"
                              >
                                Open job posting <ArrowUpRight size={12} />
                              </a>
                            ) : null}
                          </div>
                          <label className="text-[10px] font-semibold text-[#718084]">
                            Update status
                            <span className="relative mt-1.5 block">
                              <select
                                value={opportunity.status}
                                onChange={(event) => updateStatus(opportunity.id, event.target.value as OpportunityStatus)}
                                className="h-9 min-w-[132px] appearance-none rounded-lg border border-[#dce3df] bg-white py-1 pl-3 pr-8 text-xs text-[#263a3d] outline-none transition focus:border-[#e63946] focus:ring-2 focus:ring-[#e63946]/10"
                              >
                                {(["Saved", "Outreach", "Replied", "Closed"] as const).map((status) => (
                                  <option key={status}>{status}</option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[#899497]" size={13} />
                            </span>
                          </label>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex items-center gap-2 border-t border-[#172b320c] bg-[#fbfcfa]/75 px-5 py-3 text-[10px] leading-4 text-[#899497] max-sm:px-4">
            <CircleHelp size={13} className="shrink-0" />
            Opportunities are saved locally in this browser for now.
          </div>
        </section>
      </div>

      {savedMessage ? (
        <div
          role="status"
          className="beaky-enter fixed right-5 bottom-5 z-[80] flex items-center gap-2 rounded-xl border border-[#d7eadb] bg-white px-4 py-3 text-xs font-semibold text-[#32744c] shadow-[0_8px_28px_rgba(23,43,50,0.14)] max-sm:right-3 max-sm:bottom-3"
        >
          <Check size={15} />
          Opportunity saved
        </div>
      ) : null}

      {showForm ? (
        <OpportunityForm onClose={() => setShowForm(false)} onSave={addOpportunity} />
      ) : null}
    </main>
  );
}
