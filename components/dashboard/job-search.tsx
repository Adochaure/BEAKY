"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Award,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  Globe2,
  GraduationCap,
  Home,
  MapPin,
  Search,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutreachReview } from "@/components/dashboard/outreach-review";
import { normalizeCandidateProfile, type CandidateProfile } from "@/lib/candidate-profile";
import { createClient } from "@/lib/supabase/client";
import type { OpportunityType } from "@/lib/supabase/database.types";

export type WorkplaceType = "Remote" | "Hybrid" | "Onsite";

export type Job = {
  guid: string;
  title: string;
  companyName: string;
  excerpt?: string;
  description?: string;
  employmentType?: string;
  seniority?: string;
  workplaceType?: WorkplaceType;
  locationRestrictions?: string[];
  categories?: string[];
  minSalary?: number | null;
  maxSalary?: number | null;
  salaryPeriod?: string;
  currency?: string;
  salaryLabel?: string;
  isHighPay?: boolean;
  pubDate: number;
  expiryDate?: number;
  applicationLink: string;
  source?: string;
};

type SearchValues = {
  keywords: string;
  category: string[];
  experience: string[];
  employmentType: string[];
  country: string;
  workplace: "all" | "remote" | "hybrid" | "onsite";
  highPayOnly: boolean;
  sort: "recent" | "salary_desc";
  worldwide: boolean;
  minSalary: string;
  maxSalary: string;
  count: number;
};

const initialValues: SearchValues = {
  keywords: "",
  category: [],
  experience: [],
  employmentType: [],
  country: "",
  workplace: "all",
  highPayOnly: false,
  sort: "recent",
  worldwide: false,
  minSalary: "",
  maxSalary: "",
  count: 20,
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

const experienceOptions = ["Entry-level", "Mid-level", "Senior", "Lead", "Staff", "Manager"];
const employmentOptions = ["Full Time", "Intern", "Fellowship", "Part Time", "Contractor"];
const categoryOptions = [
  "Technology",
  "Engineering",
  "Software Engineering",
  "Artificial Intelligence",
  "Machine Learning",
  "Full Stack Development",
  "Backend Development",
  "Frontend Development",
  "DevOps",
  "Cloud Computing",
  "Data Science",
  "Product Management",
  "Cybersecurity",
  "Design & UX",
  "Fintech",
  "Business & Marketing",
];

function formatLocation(job: Job) {
  const locations = job.locationRestrictions?.filter(Boolean) ?? [];
  return locations.length ? locations.join(", ") : "Global";
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
  const [values, setValues] = useState<SearchValues>(initialValues);
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
  const [activeChip, setActiveChip] = useState<string>("all");

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const supabase = createClient();
        const [{ data, error: queryError }, { data: profileData }] = await Promise.all([
          supabase.from("opportunities").select("job_url").not("job_url", "is", null),
          supabase.from("user_profiles").select("candidate_profile").maybeSingle(),
        ]);
        if (active && !queryError) setSavedLinks(new Set(data.map((row) => row.job_url).filter((url): url is string => Boolean(url))));
        if (active) setCandidateProfile(normalizeCandidateProfile(profileData?.candidate_profile));
      } catch {
        // Continue
      }
      void runSearch(initialValues, 1);
    }
    void init();
    return () => { active = false; };
  }, []);

  async function runSearch(filters: SearchValues, requestedPage: number) {
    setLoading(true);
    setError("");
    setNotice("");
    const params = new URLSearchParams({
      page: String(requestedPage),
      workplace: filters.workplace,
      sort: filters.sort,
    });
    if (filters.keywords.trim()) params.set("q", filters.keywords.trim());
    if (filters.country.trim()) params.set("country", filters.country.trim());
    if (filters.highPayOnly) params.set("high_pay", "true");
    if (filters.category.length) params.set("category", filters.category.join(","));
    if (filters.experience.length) params.set("seniority", filters.experience.join(","));
    if (filters.employmentType.length) params.set("employment_type", filters.employmentType.join(","));

    try {
      const response = await fetch(`/api/jobs/search?${params.toString()}`);
      const result = await response.json() as { jobs?: Job[]; totalCount?: number; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Job search failed.");
      setJobs(Array.isArray(result.jobs) ? result.jobs : []);
      setTotalCount(typeof result.totalCount === "number" ? result.totalCount : 0);
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

  function applyPreset(chipId: string) {
    setActiveChip(chipId);
    let next = { ...values };
    if (chipId === "all") {
      next = { ...values, workplace: "all", highPayOnly: false, employmentType: [], category: [] };
    } else if (chipId === "high_pay") {
      next = { ...values, highPayOnly: true, sort: "salary_desc" };
    } else if (chipId === "internships") {
      next = { ...values, employmentType: ["Intern", "Fellowship"] };
    } else if (chipId === "remote") {
      next = { ...values, workplace: "remote" };
    } else if (chipId === "hybrid") {
      next = { ...values, workplace: "hybrid" };
    } else if (chipId === "onsite") {
      next = { ...values, workplace: "onsite" };
    } else if (chipId === "tech") {
      next = { ...values, category: ["Technology", "Software Engineering", "Artificial Intelligence"] };
    } else if (chipId === "india") {
      next = { ...values, country: "India" };
    }
    setValues(next);
    void runSearch(next, 1);
  }

  async function saveJob(job: Job) {
    if (savedLinks.has(job.applicationLink)) return;
    setSavingGuid(job.guid);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sign in again to save this job.");

      const isIntern = job.employmentType?.toLowerCase().includes("intern");
      const isFellow = job.employmentType?.toLowerCase().includes("fellow");
      const type: OpportunityType = isIntern ? "Internship" : isFellow ? "Fellowship" : "Job";

      const { error: saveError } = await supabase.from("opportunities").insert({
        user_id: user.id,
        title: job.title.slice(0, 200),
        company: job.companyName.slice(0, 200),
        location: formatLocation(job).slice(0, 200),
        opportunity_type: type,
        job_url: job.applicationLink,
        description: (job.description ?? job.excerpt ?? "").slice(0, 10000) || null,
      });
      if (saveError) throw saveError;
      setSavedLinks((current) => new Set(current).add(job.applicationLink));
      setNotice("Role saved to your Saved Jobs workspace.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this job.");
    } finally {
      setSavingGuid("");
    }
  }

  const field = (key: keyof SearchValues, value: unknown) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <div className="mx-auto w-full max-w-[1480px] px-8 pb-14 pt-9 max-lg:px-6 max-sm:px-4 max-sm:pt-6">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[clamp(2.15rem,4vw,2.9rem)] leading-[1.08] tracking-[-0.045em] text-[#171411]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>
              Jobs &amp; opportunities.
            </h1>
            <p className="mt-2 text-sm text-[#766f67]">
              Explore high-paying roles, internships, and fellowships across Remote, Hybrid, and Onsite locations.
            </p>
          </div>
          {candidateProfile ? (
            <div className="flex items-center gap-2 rounded-lg border border-[#b8dfc4] bg-[#e7f5ea] px-3 py-2 text-[11px] text-[#2c7448]">
              <Check size={13} className="shrink-0" />
              <span>
                <strong className="font-semibold">Profile active:</strong> Matching {candidateProfile.skills.length} skills from your analyzed resume
              </span>
            </div>
          ) : null}
        </div>
      </header>

      {/* Quick Filter Presets - Clean Lucide icons, no emojis */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-[#30291f18] pb-4">
        {[
          { id: "all", label: "All Roles", icon: BriefcaseBusiness },
          { id: "high_pay", label: "High Pay ($120k+ / ₹25L+)", icon: TrendingUp },
          { id: "tech", label: "Tech & Engineering", icon: Sparkles },
          { id: "internships", label: "Internships & Fellowships", icon: GraduationCap },
          { id: "remote", label: "Remote", icon: Home },
          { id: "hybrid", label: "Hybrid", icon: Building2 },
          { id: "onsite", label: "Onsite", icon: MapPin },
          { id: "india", label: "India Tech Hubs", icon: Globe2 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => applyPreset(id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
              activeChip === id
                ? "bg-[#211a14] text-white shadow-sm"
                : "border border-[#ded7cb] bg-[#faf7f0] text-[#6b6256] hover:bg-white hover:text-[#211a14]"
            }`}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5">
        <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
          <MultiSelectField label="Industry / Category" options={categoryOptions} value={values.category} onChange={(value) => field("category", value)} />
          <FilterField label="Work Mode">
            <span className="relative block">
              <select
                className={`${inputClass} appearance-none pr-9`}
                value={values.workplace}
                onChange={(event) => field("workplace", event.target.value as SearchValues["workplace"])}
              >
                <option value="all">All Modes (Remote, Hybrid, Onsite)</option>
                <option value="remote">Remote Only</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite Only</option>
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#968b7d]" />
            </span>
          </FilterField>
          <MultiSelectField label="Experience / Seniority" options={experienceOptions} value={values.experience} onChange={(value) => field("experience", value)} />
          <MultiSelectField label="Opportunity Type" options={employmentOptions} value={values.employmentType} onChange={(value) => field("employmentType", value)} />
        </div>

        <div className="mt-4 grid gap-x-3 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
          <FilterField label="Keywords (Role, Tech, Company)">
            <input className={inputClass} value={values.keywords} onChange={(event) => field("keywords", event.target.value)} placeholder="AI, React, Python, Backend…" />
          </FilterField>
          <FilterField label="Location / City / Country">
            <input className={inputClass} value={values.country} onChange={(event) => field("country", event.target.value)} placeholder="Bengaluru, San Francisco, India, Global…" />
          </FilterField>
          <FilterField label="Sort By">
            <span className="relative block">
              <select
                className={`${inputClass} appearance-none pr-9`}
                value={values.sort}
                onChange={(event) => field("sort", event.target.value as SearchValues["sort"])}
              >
                <option value="recent">Most Recent</option>
                <option value="salary_desc">Highest Pay First</option>
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#968b7d]" />
            </span>
          </FilterField>
          <div className="flex items-center gap-2 self-end pb-2.5">
            <label className="flex items-center gap-2 text-[11px] font-medium text-[#4b4339]">
              <input type="checkbox" checked={values.highPayOnly} onChange={(event) => field("highPayOnly", event.target.checked)} className="size-4 accent-[#a92230]" />
              <TrendingUp size={13} className="text-[#a45d32]" />
              High Pay Roles Only
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-start justify-between gap-3 border-b border-[#30291f1c] pb-6 sm:flex-row sm:items-center">
          <p className="max-w-lg text-[10px] leading-4 text-[#8b8174]">
            Unified pipeline: aggregates live feeds from Himalayas, Arbeitnow, and verified tech company boards.
          </p>
          <Button type="submit" disabled={loading} className="min-w-[120px] max-sm:w-full">
            {loading ? <span className="size-3.5 animate-spin rounded-full border-2 border-white/45 border-t-white" /> : <Search size={14} />}
            {loading ? "Searching…" : "Apply Filters"}
          </Button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] leading-5 text-[#8b8174]">
          {hasSearched ? `${totalCount.toLocaleString()} matching opportunities found · page ${page}` : "Discovering top roles…"}
        </p>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-lg border border-[#edc2bc] bg-[#fff0ed] px-3 py-2 text-[11px] text-[#a43d32]">{error}</p> : null}
      {notice ? <p role="status" className="mt-4 rounded-lg border border-[#b8dfc4] bg-[#e7f5ea] px-3 py-2 text-[11px] text-[#2c7448]">{notice}</p> : null}

      {jobs.length === 0 && !loading ? (
        <div className="mt-5 flex min-h-52 flex-col items-center justify-center border-y border-[#30291f1c] px-5 py-12 text-center">
          <div className="grid size-10 place-items-center rounded-full border border-[#e2dbcf] bg-[#f8f4ec] text-[#847866]"><BriefcaseBusiness size={17} /></div>
          <h2 className="mt-3 text-[17px] text-[#211a14]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>No roles match these filters</h2>
          <p className="mt-1.5 text-[10px] text-[#81786d]">Try switching to &quot;All Modes&quot; or clearing the keyword filter.</p>
        </div>
      ) : null}

      {jobs.length ? (
        <section aria-label="Opportunities" className="mt-2 divide-y divide-[#30291f18] border-b border-[#30291f18]">
          {jobs.map((job) => {
            const saved = savedLinks.has(job.applicationLink);
            const matchedSkills = candidateProfile ? jobSkillMatches(job, candidateProfile.skills) : [];
            const matchPercent = candidateProfile?.skills.length
              ? Math.round((matchedSkills.length / Math.min(10, candidateProfile.skills.length)) * 100)
              : null;

            const workplaceStyle =
              job.workplaceType === "Remote"
                ? "border-[#b8dfc4] bg-[#e7f5ea] text-[#2c7448]"
                : job.workplaceType === "Hybrid"
                  ? "border-[#c4cbee] bg-[#edf0fb] text-[#3c4a8a]"
                  : "border-[#e9cfb3] bg-[#fcf5ec] text-[#8b5c2a]";

            return (
              <article key={job.guid} className="flex flex-col gap-4 py-5 transition-colors hover:bg-white/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-[15px] font-semibold text-[#211a14]">{job.title}</h2>
                    {job.isHighPay ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#ebd5ae] bg-[#fdf7ec] px-2 py-0.5 text-[8px] font-bold text-[#946726]">
                        <Sparkles size={9} /> High Pay
                      </span>
                    ) : null}
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-semibold ${workplaceStyle}`}>
                      {job.workplaceType === "Remote" ? <Home size={9} /> : job.workplaceType === "Hybrid" ? <Building2 size={9} /> : <MapPin size={9} />}
                      {job.workplaceType}
                    </span>
                    {job.employmentType?.toLowerCase().includes("intern") ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#cadfd6] bg-[#f2f8f5] px-2 py-0.5 text-[8px] font-bold text-[#2d6e52]">
                        <GraduationCap size={9} /> Internship
                      </span>
                    ) : null}
                    {job.employmentType?.toLowerCase().includes("fellow") ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#dfcceb] bg-[#f8f1fc] px-2 py-0.5 text-[8px] font-bold text-[#6a348e]">
                        <Award size={9} /> Fellowship
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-[11px] text-[#766f67]">
                    <span className="font-semibold text-[#3a342c]">{job.companyName}</span>
                    {job.seniority ? ` · ${job.seniority}` : ""}
                    <span className="text-[#968b7e]"> · Sourced from {job.source ?? "ATS"}</span>
                  </p>

                  <p className="mt-2 line-clamp-2 max-w-3xl text-[10px] leading-5 text-[#81786d]">
                    {job.excerpt ?? job.description?.slice(0, 200)}
                  </p>

                  {matchPercent !== null && matchedSkills.length ? (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5" aria-label={`Matched ${matchedSkills.length} resume skills`}>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#b7c5b3] bg-[#e9eee4] px-2 py-0.5 text-[8px] font-semibold text-[#39533b]">
                        <Check size={9} /> {matchPercent}% resume match
                      </span>
                      {matchedSkills.slice(0, 5).map((skill) => (
                        <span key={skill} className="rounded-full bg-white/70 px-2 py-0.5 text-[8px] text-[#655d52]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-[#8b8174]">
                    <span className="inline-flex items-center gap-1"><MapPin size={11} />{formatLocation(job)}</span>
                    <span className="font-semibold text-[#544b3f]">{job.salaryLabel}</span>
                    <span>Updated {formatDate(job.pubDate)}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.categories?.slice(0, 4).map((category) => (
                      <span key={category} className="rounded-full border border-[#e2dbcf] px-2 py-0.5 text-[8px] text-[#786f63]">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                  <button
                    type="button"
                    onClick={() => setOutreachJob(job)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#a92230] bg-[#a92230]/5 px-3 text-[10px] font-semibold text-[#a92230] transition hover:bg-[#a92230] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a92230]"
                  >
                    <Send size={12} /> Prepare Email
                  </button>
                  <a
                    href={job.applicationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#008f68] px-3 text-[10px] font-semibold text-white shadow-[0_2px_4px_rgba(0,143,104,0.2)] transition hover:bg-[#007653] active:translate-y-px"
                  >
                    Apply <ArrowUpRight size={12} />
                  </a>
                  <button
                    type="button"
                    onClick={() => void saveJob(job)}
                    disabled={saved || savingGuid === job.guid}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#d9d2c7] px-3 text-[10px] font-medium text-[#514a40] transition hover:bg-white/70 disabled:cursor-default disabled:opacity-65"
                  >
                    {savingGuid === job.guid ? <span className="size-3 animate-spin rounded-full border-2 border-[#211a14]/20 border-t-[#211a14]" /> : <Check size={12} />}
                    {saved ? "Saved" : "Save role"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {jobs.length > 0 && !error ? (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-[10px] text-[#8b8174]">Page {page} · Active opportunity pipeline</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => void runSearch(values, page - 1)}
              className="rounded-md border border-[#d9d2c7] px-3 py-1.5 text-[10px] transition hover:bg-white/60 disabled:opacity-45"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={jobs.length < 20 || loading}
              onClick={() => void runSearch(values, page + 1)}
              className="rounded-md border border-[#d9d2c7] px-3 py-1.5 text-[10px] transition hover:bg-white/60 disabled:opacity-45"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {outreachJob ? (
        <OutreachReview
          job={{
            guid: outreachJob.guid,
            title: outreachJob.title,
            companyName: outreachJob.companyName,
            excerpt: outreachJob.excerpt,
            description: outreachJob.description,
            applicationLink: outreachJob.applicationLink,
          }}
          onClose={() => setOutreachJob(null)}
          onSent={() => setNotice("Approved outreach was dispatched with your resume attached.")}
        />
      ) : null}
    </div>
  );
}
