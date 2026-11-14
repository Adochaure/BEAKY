import Link from "next/link";
import { ArrowUpRight, Mail, UsersRound } from "lucide-react";

export function DashboardStatusPage({
  title,
  description,
  type,
}: {
  title: string;
  description: string;
  type: "recruiters" | "email";
}) {
  const Icon = type === "recruiters" ? UsersRound : Mail;

  return (
    <div className="mx-auto w-full max-w-[1480px] px-8 pb-14 pt-9 max-lg:px-6 max-sm:px-4 max-sm:pt-6">
      <div>
        <h1
          className="text-[clamp(2.15rem,4vw,2.9rem)] leading-[1.08] tracking-[-0.045em] text-[#171411]"
          style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}
        >
          {title}
        </h1>
        <p className="mt-2 text-sm text-[#766f67]">{description}</p>
      </div>

      <div className="mt-8 flex min-h-[260px] flex-col items-center justify-center border-y border-[#30291f1c] px-5 py-12 text-center">
        <div className="grid size-11 place-items-center rounded-full border border-[#e2dbcf] bg-[#f8f4ec] text-[#847866]">
          <Icon size={18} strokeWidth={1.6} />
        </div>
        <h2 className="mt-4 text-[18px] tracking-[-0.02em] text-[#211a14]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>
          No {type === "recruiters" ? "recruiter contacts" : "email activity"} yet
        </h2>
        <p className="mt-1.5 max-w-[360px] text-xs leading-5 text-[#81786d]">
          {type === "recruiters"
            ? "Recruiter contacts will appear here as you add them to your opportunities. Contact discovery is not connected yet."
            : "Email history will appear here after Gmail is connected. Sending is not enabled yet."}
        </p>
        <Link
          href={type === "recruiters" ? "/dashboard/saved-jobs" : "/dashboard/jobs"}
          className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#d83d48] transition hover:text-[#a92230]"
        >
          {type === "recruiters" ? "View saved opportunities" : "Go to Jobs & Emails"}
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
}
