"use client";

import React from "react";
import {
  FileText,
  Briefcase,
  UserCheck,
  Feather,
  Scissors,
  Send,
} from "lucide-react";

export interface PipelineStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent?: boolean;
}

export const HOW_IT_WORKS_STEPS: PipelineStep[] = [
  {
    id: "step-1",
    title: "UPLOAD & PARSE",
    description:
      "Ingest your PDF or DOCX resume, then extract technical skills, achievements, impact metrics, and career context into a structured candidate knowledge graph.",
    icon: <FileText size={18} strokeWidth={1.8} className="text-[#554e44]" />,
  },
  {
    id: "step-2",
    title: "FIND JOBS",
    description:
      "Matches your target profile against open positions, tech stacks, salary expectations, and live hiring requirements across top global companies.",
    icon: <Briefcase size={18} strokeWidth={1.8} className="text-[#554e44]" />,
  },
  {
    id: "step-3",
    title: "FIND RECRUITERS",
    description:
      "Uncovers verified direct emails for hiring leads and recruiters using real-time protocol, DNS, and SMTP validation before you reach out.",
    icon: <UserCheck size={18} strokeWidth={1.8} className="text-[#554e44]" />,
  },
  {
    id: "step-4",
    title: "GENERATE & ANTI-CLICHÉ",
    description:
      "Crafts hyper-personalized pitches from your experience and purges corporate fluff like 'hope this finds you well' for an authentic tone.",
    icon: <Feather size={18} strokeWidth={1.8} className="text-[#554e44]" />,
  },
  {
    id: "step-5",
    title: "SURGICALLY TAILOR",
    description:
      "Enhances the highest-impact bullet points with matched job keywords and metrics while preserving your original fonts, margins, and resume layout.",
    icon: <Scissors size={18} strokeWidth={1.8} className="text-[#e63946]" />,
    accent: true,
  },
  {
    id: "step-6",
    title: "DISPATCH & TRACK",
    description:
      "Sends from your personal Gmail with automated 3-step follow-ups, open tracking, reply detection, and automatic sequence pausing.",
    icon: <Send size={18} strokeWidth={1.8} className="text-[#554e44]" />,
  },
];

export interface HowItWorksPipelineProps {
  stepIndicator?: string;
  heading?: string;
  subheading?: string;
  className?: string;
}

export function HowItWorksPipeline({
  stepIndicator = "STEP-BY-STEP WORKFLOW — CANDIDATE TO INTERVIEW",
  heading,
  subheading,
  className = "",
}: HowItWorksPipelineProps) {
  return (
    <section className={`w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto max-w-4xl">
        {/* Optional Section Header */}
        {(heading || subheading) && (
          <div className="text-center mb-10 sm:mb-12">
            {heading && (
              <h2
                className="text-[clamp(1.9rem,4vw,2.75rem)] leading-tight tracking-[-0.035em] text-[#171411]"
                style={{ fontFamily: "CooperLtBT, Fraunces, Georgia, serif" }}
              >
                {heading}
              </h2>
            )}
            {subheading && (
              <p className="mx-auto mt-2.5 max-w-lg text-xs sm:text-sm leading-relaxed text-[#6d6457]">
                {subheading}
              </p>
            )}
          </div>
        )}

        {/* The Clean Step Table (Faithfully matching the reference visual) */}
        <div className="overflow-hidden rounded-xl border border-[#ded7cb] bg-[#faf7f0]/85 shadow-xs">
          {/* Top Step Banner */}
          <div className="border-b border-[#ded7cb] px-6 py-4 sm:px-8 bg-[#f5efe3]/60">
            <span
              className="text-[11px] sm:text-[11.5px] font-mono font-bold tracking-[0.18em] text-[#786e60] uppercase"
              style={{ fontFamily: "var(--font-doto), monospace" }}
            >
              {stepIndicator}
            </span>
          </div>

          {/* Dividing Rows */}
          <div className="divide-y divide-[#ded7cb]/80">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div
                key={step.id}
                className="flex items-start gap-4 sm:gap-5 px-6 py-6 sm:px-8 sm:py-7 transition-colors duration-150 hover:bg-white/40"
              >
                {/* Left Icon Column */}
                <div className="shrink-0 mt-0.5 grid size-7 sm:size-8 place-items-center rounded-md bg-white/70 border border-[#ded7cb]/80 shadow-2xs">
                  {step.icon}
                </div>

                {/* Right Text Column */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-[12px] sm:text-[12.5px] font-mono font-bold tracking-[0.16em] uppercase ${
                      step.accent ? "text-[#a92230]" : "text-[#171411]"
                    }`}
                    style={{ fontFamily: "var(--font-doto), monospace" }}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] sm:text-[14px] leading-relaxed text-[#5c5448]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
