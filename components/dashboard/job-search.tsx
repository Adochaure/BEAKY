"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { ReactNode } from "react";
import { ArrowUpRight, BriefcaseBusiness, Check, ChevronDown, MapPin, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutreachReview } from "@/components/dashboard/outreach-review";
import { normalizeCandidateProfile, type CandidateProfile } from "@/lib/candidate-profile";
import { createClient } from "@/lib/supabase/client";
import type { OpportunityType } from "@/lib/supabase/database.types";

type Job = {
  guid: string;
  title: string;
  companyName: string;
  excerpt?: string;
  description?: string;
  employmentType?: string;
  seniority?: string;
  locationRestrictions?: string[];
  categories?: string[];
  minSalary?: number | null;
  maxSalary?: number | null;
  salaryPeriod?: string;
  currency?: string;
  pubDate: number;
  expiryDate?: number;
  applicationLink: string;
};

type SearchValues = {
  keywords: string;
  experience: string[];
  employmentType: string[];
  category: string[];
  country: string;
  worldwide: boolean;
  minSalary: string;
  maxSalary: string;
  count: number;
};

const initialValues: SearchValues = {
  keywords: "",
  experience: [],
  employmentType: [],
  category: [],
  country: "",
  worldwide: false,
  minSalary: "",
  maxSalary: "",
  count: 10,
};

const inputClass =
  "h-[42px] w-full rounded-[8px] border border-[#d9d2c7] bg-transparent px-3 text-[12px] text-[#241f19] outline-none transition placeholder:text-[#a59b8d] focus:border-[#a92230] focus:bg-white/50 focus:ring-2 focus:ring-[#e63946]/10";

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[8px] font-semibold tracking-[0.08em] text-[#8a8073] uppercase">{label}</span>
      {children}
    </label>
  );
}

function MultiSelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = value.length === 0 ? "Any" : value.length <= 2 ? value.join(", ") : `${value.length} selected`;
  return (
    <div className="relative min-w-0" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <span className="mb-1.5 block text-[8px] font-semibold tracking-[0.08em] text-[#8a8073] uppercase">{label}</span>
      <button type="button" aria-label={`${label}: ${selectedLabel}`} aria-expanded={open} onClick={() => setOpen((current) => !current)} className={`${inputClass} flex items-center justify-between gap-2 text-left`}>
        <span className="truncate">{selectedLabel}</span><ChevronDown size={13} className={`shrink-0 text-[#968b7d] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div role="group" aria-label={`${label} options`} className="absolute top-full right-0 left-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-[9px] border border-[#d9d2c7] bg-[#faf7f0] p-1.5 shadow-[0_8px_24px_rgba(23,43,50,0.12)]">
          {options.map((option) => {
            const checked = value.includes(option);
            return (
              <label key={option} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-[10px] text-[#514a40] transition hover:bg-white/75">
                <input type="checkbox" checked={checked} onChange={() => onChange(checked ? value.filter((item) => item !== option) : [...value, option])} className="size-3.5 accent-[#a92230]" />
                {option}
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const experienceOptions = ["Entry-level", "Mid-level", "Senior", "Manager", "Director", "Executive"];
const employmentOptions = ["Full Time", "Part Time", "Contractor", "Temporary", "Intern", "Volunteer", "Other"];
const categoryOptions = [
  "Technology", "Engineering", "Software Engineering", "Web Development", "Frontend Development", "Backend Development",
  "Full Stack Development", "Mobile Development", "DevOps", "Cloud Computing", "Data Science", "Machine Learning", "Artificial Intelligence",
  "Cybersecurity", "QA & Testing", "IT", "Product Management", "UX/UI Design", "Design", "Technical Support", "Networking",
  "Business", "Marketing", "Sales", "Customer Success",
];

function annualSalary(job: Job) {
  if (!job.minSalary && !job.maxSalary) return null;
  const multiplier: Record<string, number> = { hourly: 2080, weekly: 52, fortnightly: 26, monthly: 12, annual: 1 };
  return {
    min: job.minSalary == null ? null : job.minSalary * (multiplier[job.salaryPeriod ?? "annual"] ?? 1),
    max: job.maxSalary == null ? null : job.maxSalary * (multiplier[job.salaryPeriod ?? "annual"] ?? 1),
  };
}

function salaryLabel(job: Job) {
  const salary = annualSalary(job);
  if (!salary) return "Salary not listed";
  const currency = job.currency ?? "USD";
  const range = [salary.min, salary.max].filter((value): value is number => value != null)
    .map((value) => new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value));
  return `${currency} ${range.join("–")}${job.salaryPeriod && job.salaryPeriod !== "annual" ? ` / yr est.` : " / yr"}`;
}

function formatLocation(job: Job) {
  const locations = job.locationRestrictions?.filter(Boolean) ?? [];
  return locations.length ? locations.join(", ") : "Worldwide remote";
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(timestamp * 1000));
}

function jobSkillMatches(job: Job, skills: string[]) {
  const text = [job.title, job.companyName, job.excerpt, job.description, ...(job.categories ?? [])]
    .filter(Boolean)
    .join(" ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .toLocaleLowerCase();
  return skills.filter((skill) => {
    const escaped = skill.trim().toLocaleLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!escaped) return false;
    return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(text);
  });
}

export function JobSearch() {
  const [values, setValues] = useState(initialValues);
  const [submitted, setSubmitted] = useState(initialValues);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [savedLinks, setSavedLinks] = useState<Set<string>>(new Set());
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingGuid, setSavingGuid] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [outreachJob, setOutreachJob] = useState<Job | null>(null);

  useEffect(() => {
    let active = true;
    async function loadSaved() {
      try {
        const supabase = createClient();
        const [{ data, error: queryError }, { data: profileData }] = await Promise.all([
          supabase.from("opportunities").select("job_url").not("job_url", "is", null),
          supabase.from("user_profiles").select("candidate_profile").maybeSingle(),
        ]);
        if (active && !queryError) setSavedLinks(new Set(data.map((row) => row.job_url).filter((url): url is string => Boolean(url))));
        if (active) setCandidateProfile(normalizeCandidateProfile(profileData?.candidate_profile));
      } catch {
        // Job search remains available if saved-job lookup is temporarily unavailable.
      }
    }
    void loadSaved();
    return () => { active = false; };
  }, []);

  async function runSearch(filters: SearchValues, requestedPage: number) {
    setLoading(true);
    setError("");
    setNotice("");
    const params = new URLSearchParams({ page: String(requestedPage) });
    if (filters.keywords.trim()) params.set("q", filters.keywords.trim());
    if (filters.country.trim()) params.set("country", filters.country.trim());
    if (filters.worldwide) params.set("worldwide", "true");
    if (filters.experience.length) params.set("seniority", filters.experience.join(","));
    if (filters.employmentType.length) params.set("employment_type", filters.employmentType.join(","));
    try {
      const response = await fetch(`/api/jobs/search?${params.toString()}`);
      const result = await response.json() as { jobs?: Job[]; totalCount?: number; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Job search failed.");
      setJobs(Array.isArray(result.jobs) ? result.jobs : []);
      setTotalCount(typeof result.totalCount === "number" ? result.totalCount : 0);
      setSubmitted(filters);
      setPage(requestedPage);
      setHasSearched(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Job search failed. Try again.");
      setJobs([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(values, 1);
  }

  const filteredJobs = useMemo(() => {
    const min = Number(submitted.minSalary) || null;
    const max = Number(submitted.maxSalary) || null;
    return jobs.filter((job) => {
      if (submitted.category.length && !job.categories?.some((category) => submitted.category.some((selected) => category.toLowerCase().includes(selected.toLowerCase())))) return false;
      const salary = annualSalary(job);
      if (min && (job.currency !== "USD" || !salary?.max || salary.max < min)) return false;
      if (max && (job.currency !== "USD" || !salary?.min || salary.min > max)) return false;
      return true;
    }).slice(0, submitted.count);
  }, [jobs, submitted]);

  async function saveJob(job: Job) {
    if (savedLinks.has(job.applicationLink)) return;
    setSavingGuid(job.guid);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sign in again to save this job.");
      const { error: saveError } = await supabase.from("opportunities").insert({
        user_id: user.id,
        title: job.title.slice(0, 200),
        company: job.companyName.slice(0, 200),
        location: formatLocation(job).slice(0, 200),
        opportunity_type: job.employmentType === "Intern" ? "Internship" as OpportunityType : "Job" as OpportunityType,
        job_url: job.applicationLink,
        description: (job.excerpt ?? "").slice(0, 10000) || null,
      });
      if (saveError) throw saveError;
      setSavedLinks((current) => new Set(current).add(job.applicationLink));
      setNotice("Job saved to Saved Jobs.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this job.");
    } finally {
      setSavingGuid("");
    }
  }

  const field = (key: keyof SearchValues, value: string | string[] | boolean | number) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <div className="mx-auto w-full max-w-[1480px] px-8 pb-14 pt-9 max-lg:px-6 max-sm:px-4 max-sm:pt-6">
      <header>
        <h1 className="text-[clamp(2.15rem,4vw,2.9rem)] leading-[1.08] tracking-[-0.045em] text-[#171411]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>
          Jobs &amp; emails.
        </h1>
        <p className="mt-2 text-sm text-[#766f67]">Find remote roles that fit, then save the ones worth pursuing.</p>
      </header>

      <form onSubmit={submit} className="mt-8">
        <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
          <MultiSelectField label="Experience" options={experienceOptions} value={values.experience} onChange={(value) => field("experience", value)} />
          <MultiSelectField label="Job type" options={employmentOptions} value={values.employmentType} onChange={(value) => field("employmentType", value)} />
          <MultiSelectField label="Categories" options={categoryOptions} value={values.category} onChange={(value) => field("category", value)} />
          <FilterField label="Mode">
            <span className="relative block"><select className={`${inputClass} appearance-none pr-9`} value="Remote" disabled><option>Remote</option></select><ChevronDown size={13} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#968b7d]" /></span>
          </FilterField>
        </div>

        <div className="mt-4 grid gap-x-3 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
          <FilterField label="Keywords (optional)"><input className={inputClass} value={values.keywords} onChange={(event) => field("keywords", event.target.value)} placeholder="Frontend, ML, backend…" /></FilterField>
          <FilterField label="Country (optional)"><input className={inputClass} value={values.country} onChange={(event) => field("country", event.target.value)} placeholder="India, United States…" /></FilterField>
          <FilterField label="Number of jobs"><span className="relative block"><select className={`${inputClass} appearance-none pr-9`} value={values.count} onChange={(event) => field("count", Number(event.target.value))}><option value={10}>10</option><option value={20}>20</option></select><ChevronDown size={13} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#968b7d]" /></span></FilterField>
        </div>

        <div className="mt-4 grid gap-x-3 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
          <FilterField label="Minimum salary (USD / year)"><input className={inputClass} inputMode="numeric" value={values.minSalary} onChange={(event) => field("minSalary", event.target.value.replace(/[^\d]/g, ""))} placeholder="60000" /></FilterField>
          <FilterField label="Maximum salary (USD / year)"><input className={inputClass} inputMode="numeric" value={values.maxSalary} onChange={(event) => field("maxSalary", event.target.value.replace(/[^\d]/g, ""))} placeholder="180000" /></FilterField>
          <label className="flex items-center gap-2 self-end pb-3 text-[11px] text-[#5f574c]">
            <input type="checkbox" checked={values.worldwide} onChange={(event) => field("worldwide", event.target.checked)} className="size-3.5 accent-[#e63946]" />
            Worldwide-friendly roles
          </label>
        </div>

        <div className="mt-5 flex flex-col items-start justify-between gap-3 border-b border-[#30291f1c] pb-6 sm:flex-row sm:items-center">
          <p className="max-w-lg text-[9px] leading-4 text-[#8b8174]">Salary filters include USD listings only. Other salary amounts are shown as published.</p>
          <Button type="submit" disabled={loading} className="min-w-[116px] max-sm:w-full">
            {loading ? <span className="size-3.5 animate-spin rounded-full border-2 border-white/45 border-t-white" /> : <Search size={14} />}
            {loading ? "Searching…" : "Search jobs"}
          </Button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] leading-5 text-[#8b8174]">
          {hasSearched ? `${totalCount.toLocaleString()} matching remote roles · page ${page}` : "Search remote roles from the Himalayas job feed."}
        </p>
        <a href="https://himalayas.app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#756b5d] transition hover:text-[#a92230]">
          Listings sourced from Himalayas <ArrowUpRight size={12} />
        </a>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-lg border border-[#edc2bc] bg-[#fff0ed] px-3 py-2 text-[11px] text-[#a43d32]">{error}</p> : null}
      {notice ? <p role="status" className="mt-4 rounded-lg border border-[#b8dfc4] bg-[#e7f5ea] px-3 py-2 text-[11px] text-[#2c7448]">{notice}</p> : null}

      {hasSearched && filteredJobs.length === 0 && !loading ? (
        <div className="mt-5 flex min-h-52 flex-col items-center justify-center border-y border-[#30291f1c] px-5 py-12 text-center">
          <div className="grid size-10 place-items-center rounded-full border border-[#e2dbcf] bg-[#f8f4ec] text-[#847866]"><BriefcaseBusiness size={17} /></div>
          <h2 className="mt-3 text-[17px] text-[#211a14]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>{error ? "Search could not load" : "No roles match these filters"}</h2>
          <p className="mt-1.5 text-[10px] text-[#81786d]">Try a broader keyword or remove a filter.</p>
        </div>
      ) : null}

      {filteredJobs.length ? (
        <section aria-label="Job search results" className="mt-2 divide-y divide-[#30291f18] border-b border-[#30291f18]">
          {filteredJobs.map((job) => {
            const saved = savedLinks.has(job.applicationLink);
            const matchedSkills = candidateProfile ? jobSkillMatches(job, candidateProfile.skills) : [];
            const matchPercent = candidateProfile?.skills.length
              ? Math.round((matchedSkills.length / candidateProfile.skills.length) * 100)
              : null;
            return (
              <article key={job.guid} className="flex flex-col gap-4 py-5 transition-colors hover:bg-white/25 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-[14px] font-semibold text-[#211a14]">{job.title}</h2>
                  <p className="mt-1 text-[11px] text-[#766f67]">{job.companyName}{job.seniority ? ` · ${job.seniority}` : ""}</p>
                  <p className="mt-2 line-clamp-2 max-w-3xl text-[10px] leading-5 text-[#81786d]">{job.excerpt ?? "Open the listing to read the full role details."}</p>
                  {matchPercent !== null && matchedSkills.length ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label={`Matched ${matchedSkills.length} resume skills`}>
                      <span className="rounded-full border border-[#b7c5b3] bg-[#e9eee4] px-2 py-0.5 text-[8px] font-semibold text-[#39533b]">{matchPercent}% skill match</span>
                      {matchedSkills.slice(0, 4).map((skill) => <span key={skill} className="rounded-full bg-white/60 px-2 py-0.5 text-[8px] text-[#655d52]">{skill}</span>)}
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-[#8b8174]">
                    <span className="inline-flex items-center gap-1"><MapPin size={11} />{formatLocation(job)}</span>
                    {job.employmentType ? <span>{job.employmentType}</span> : null}
                    <span>{salaryLabel(job)}</span>
                    <span>Updated {formatDate(job.pubDate)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.categories?.slice(0, 3).map((category) => <span key={category} className="rounded-full border border-[#e2dbcf] px-2 py-0.5 text-[8px] text-[#786f63]">{category}</span>)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                  <button type="button" onClick={() => setOutreachJob(job)} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#d9d2c7] px-3 text-[10px] font-medium text-[#514a40] transition hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a92230]">
                    <Send size={12} /> Prepare email
                  </button>
                  <a href={job.applicationLink} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#008f68] px-3 text-[10px] font-semibold text-white shadow-[0_2px_4px_rgba(0,143,104,0.2)] transition hover:bg-[#007653] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a92230]">
                    Apply <ArrowUpRight size={12} />
                  </a>
                  <button type="button" onClick={() => void saveJob(job)} disabled={saved || savingGuid === job.guid} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#d9d2c7] px-3 text-[10px] font-medium text-[#514a40] transition hover:bg-white/70 disabled:cursor-default disabled:opacity-65">
                    {savingGuid === job.guid ? <span className="size-3 animate-spin rounded-full border-2 border-[#211a14]/20 border-t-[#211a14]" /> : <Check size={12} />}
                    {saved ? "Saved" : "Save job"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {hasSearched && jobs.length > 0 && !error ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[9px] text-[#8b8174]">Jobs can close before they expire; check the listing before applying.</p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1 || loading} onClick={() => void runSearch(submitted, page - 1)} className="rounded-md border border-[#d9d2c7] px-3 py-1.5 text-[10px] transition hover:bg-white/60 disabled:opacity-45">Previous</button>
            <button type="button" disabled={jobs.length < 20 || loading} onClick={() => void runSearch(submitted, page + 1)} className="rounded-md border border-[#d9d2c7] px-3 py-1.5 text-[10px] transition hover:bg-white/60 disabled:opacity-45">Next</button>
          </div>
        </div>
      ) : null}

      {outreachJob ? <OutreachReview job={outreachJob} candidateSkills={jobSkillMatches(outreachJob, candidateProfile?.skills ?? [])} onClose={() => setOutreachJob(null)} onSent={() => setNotice("Approved outreach was sent with your resume attached.")} /> : null}
    </div>
  );
}
