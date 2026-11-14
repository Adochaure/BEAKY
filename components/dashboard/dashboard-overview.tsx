"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Check, Mail, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { createClient } from "@/lib/supabase/client";

type OpportunityStatus = "Saved" | "Outreach" | "Replied" | "Closed";
type Opportunity = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Job" | "Internship" | "Fellowship";
  url: string;
  description: string;
  status: OpportunityStatus;
  createdAt: string;
};
type Range = "Week" | "Month" | "All";

const statusTone: Record<OpportunityStatus, string> = {
  Saved: "text-[#776957]",
  Outreach: "text-[#b35a35]",
  Replied: "text-[#43845d]",
  Closed: "text-[#8b8882]",
};

function activityLabel(date: Date, range: Range, index: number) {
  if (range === "Week") return new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
  if (range === "Month") return `W${index + 1}`;
  return new Intl.DateTimeFormat("en", { month: "short" }).format(date);
}

export function DashboardOverview() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [range, setRange] = useState<Range>("Week");
  const [loading, setLoading] = useState(true);
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
              opportunity_type: (["Job", "Internship", "Fellowship"].includes(String(item.type)) ? item.type : "Job") as Opportunity["type"],
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
            // Keep the browser copy if import or parsing fails.
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
      setLoading(false);
      } catch {
        if (active) {
          setLoadError(true);
          setLoading(false);
        }
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const summary = useMemo(
    () => ({
      opportunities: opportunities.length,
      outreach: opportunities.filter((item) => item.status === "Outreach").length,
      replies: opportunities.filter((item) => item.status === "Replied").length,
      closed: opportunities.filter((item) => item.status === "Closed").length,
    }),
    [opportunities],
  );

  const activity = useMemo(() => {
    const days = range === "Week" ? 7 : range === "Month" ? 30 : 180;
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const bucketSize = (days * 24 * 60 * 60 * 1000) / 7;
    return Array.from({ length: 7 }, (_, index) => {
      const bucketStart = new Date(start.getTime() + index * bucketSize);
      const bucketEnd = new Date(start.getTime() + (index + 1) * bucketSize);
      const count = opportunities.filter((item) => {
        const date = new Date(item.createdAt).getTime();
        return date >= bucketStart.getTime() && date < bucketEnd.getTime();
      }).length;
      return { label: activityLabel(bucketStart, range, index), count };
    });
  }, [opportunities, range]);

  const chart = useMemo(() => {
    const max = Math.max(1, ...activity.map((point) => point.count));
    const coords = activity.map((point, index) => ({
      x: 22 + (index * 956) / Math.max(1, activity.length - 1),
      y: 138 - (point.count / max) * 104,
    }));
    const line = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
    const area = `${line} L ${coords[coords.length - 1].x},150 L ${coords[0].x},150 Z`;
    return { coords, line, area };
  }, [activity]);

  const recent = [...opportunities]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const metrics = [
    { label: "Opportunities", value: summary.opportunities, note: "saved roles", icon: BriefcaseBusiness },
    { label: "In outreach", value: summary.outreach, note: "tracked manually", icon: ArrowUpRight },
    { label: "Replies", value: summary.replies, note: "marked by you", icon: Mail },
    { label: "Closed", value: summary.closed, note: "roles completed", icon: Check },
  ];

  return (
    <div className="mx-auto w-full max-w-[1480px] px-8 pb-14 pt-9 max-lg:px-6 max-sm:px-4 max-sm:pt-6">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.13em] text-[#83796d] uppercase">Your workspace</p>
        <h1
          className="mt-2 text-[clamp(2.15rem,4vw,2.9rem)] leading-[1.08] tracking-[-0.045em] text-[#171411]"
          style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}
        >
          What&apos;s up, Aditya.
        </h1>
        <p className="mt-2 text-sm text-[#766f67]">Here&apos;s what&apos;s happening with your outreach.</p>
      </div>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-5 border-b border-[#30291f1c] pb-5">
        <section aria-label="Outreach summary" className="grid flex-1 grid-cols-2 gap-y-4 sm:flex sm:items-stretch sm:gap-0">
          {metrics.map(({ label, value, note, icon: Icon }, index) => (
            <div
              key={label}
              className={`min-w-[120px] px-4 first:pl-0 max-sm:px-2 ${index > 0 ? "sm:border-l sm:border-[#30291f1c]" : ""}`}
            >
              <div className="flex items-center gap-2 text-[#1a1713]">
                <span className="text-[24px] leading-none tracking-[-0.04em]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>{loading ? "—" : value}</span>
                <Icon size={12} className="text-[#9a8d7c] sm:hidden" />
              </div>
              <p className="mt-1 text-[10px] font-medium text-[#4e4840]">{label}</p>
              <p className="mt-0.5 text-[8px] text-[#9c948a]">{note}</p>
            </div>
          ))}
        </section>

        <div className="flex items-center rounded-[8px] border border-[#ded8cd] bg-[#f8f4ec] p-1" aria-label="Chart time range">
          {(["Week", "Month", "All"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              aria-pressed={range === option}
              className={`rounded-[6px] px-3 py-1.5 text-[10px] font-medium transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#e63946] ${
                range === option ? "bg-[#211a14] text-white shadow-sm" : "text-[#786f63] hover:bg-white/75 hover:text-[#211a14]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-5" aria-label="Opportunity activity chart">
        <div className="relative h-[220px] w-full max-sm:h-[180px]">
          <svg viewBox="0 0 1000 160" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="activity-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#e63946" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#e63946" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[18, 50, 82, 114, 150].map((y) => (
              <line key={y} x1="0" x2="1000" y1={y} y2={y} stroke="#30291f" strokeOpacity="0.06" strokeDasharray="2 5" />
            ))}
            <path d={chart.area} fill="url(#activity-fill)" />
            <path d={chart.line} fill="none" stroke="#e63946" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
            {chart.coords.map((point, index) => (
              <circle key={index} cx={point.x} cy={point.y} r="3" fill="#faf7f0" stroke="#e63946" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
                <title>{`${activity[index].label}: ${activity[index].count} saved`}</title>
              </circle>
            ))}
          </svg>
          <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9px] text-[#aaa195]">
            {activity.map((point, index) => <span key={`${point.label}-${index}`}>{point.label}</span>)}
          </div>
        </div>
      </section>

      <section className="mt-6" aria-labelledby="recent-activity-title">
        <div className="flex items-center justify-between border-b border-[#30291f1c] pb-2.5">
          <div>
            <h2 id="recent-activity-title" className="text-[17px] tracking-[-0.02em] text-[#211a14]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>
              Recent activity
            </h2>
            <p className="mt-0.5 text-[10px] text-[#91887c]">Your latest saved opportunities and status updates.</p>
          </div>
          <Link href="/dashboard/saved-jobs" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#71675a] transition hover:text-[#e63946]">
            View saved jobs <ArrowUpRight size={12} />
          </Link>
        </div>

        {loadError ? (
          <p role="alert" className="py-8 text-xs text-[#a43d32]">Could not load your opportunities. Check the Supabase migration and connection settings.</p>
        ) : recent.length ? (
          <ul className="divide-y divide-[#30291f12]">
            {recent.map((opportunity) => (
              <li key={opportunity.id} className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-white/35">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-[#201b16]">{opportunity.title} <span className="text-[#7f766a]">· {opportunity.company}</span></p>
                  <p className="mt-1 text-[10px] text-[#958b7e]">{opportunity.location || opportunity.type}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-medium ${statusTone[opportunity.status]}`}>{opportunity.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#81786d]">Your saved roles and outreach updates will show up here.</p>
            <ButtonLink href="/dashboard/saved-jobs" size="small">
              <Search size={13} />Add your first opportunity
            </ButtonLink>
          </div>
        )}
      </section>
    </div>
  );
}
