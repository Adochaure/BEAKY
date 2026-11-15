import { SiteHeader } from "@/components/landing/site-header";
import { HowItWorksPipeline } from "@/components/landing/how-it-works-pipeline";
import { SiteFooter } from "@/components/landing/site-footer";

export const metadata = {
  title: "How It Works — Beaky | The 6-Step Career Outreach Pipeline",
  description:
    "See how Beaky ingests your resume, matches verified roles, confirms recruiter emails with live MX checks, and dispatches human-grade pitches.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#faf7f0] text-[#1c1916]">
      {/* Navigation Header */}
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-8 sm:pt-20 sm:pb-12 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#a92230] uppercase">
            Platform Workflow
          </p>
          <h1
            className="mt-3 text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.08] tracking-[-0.045em] text-[#171411]"
            style={{ fontFamily: "CooperLtBT, Fraunces, Georgia, serif" }}
          >
            How Beaky Works
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#6d6457] sm:text-base">
            From raw resume ingestion to verified hiring manager inboxes—a clean, disciplined 6-step pipeline designed for zero bounce rates and maximum reply velocity.
          </p>
        </div>
      </section>

      {/* The 6-Step Workflow Table (Matching the reference UI) */}
      <HowItWorksPipeline
        stepIndicator="STEP-BY-STEP WORKFLOW — CANDIDATE TO INTERVIEW"
        className="pt-0 pb-16"
      />

      {/* Site Footer with Giant Half-Visible Signature */}
      <SiteFooter />
    </div>
  );
}
