"use client";

import React from "react";
import { UnifiedStampCard } from "./unified-stamp-card";

export const BEAKY_FEATURES = [
  {
    number: "01",
    title: "Discovery",
    description:
      "Automated multi-source ingestion aggregating verified engineering roles across Greenhouse, Lever, and WorkAtAStartup. Semantic matching filters out ghost jobs and highlights high-compensation matches tailored to your tech stack.",
    techSpec: "Multi-ATS Ingestion // Semantic Skill Match",
    image: "https://ik.imagekit.io/adochaure/bg1.gif?updatedAt=1785254423491",
  },
  {
    number: "02",
    title: "Verification",
    description:
      "Pinpoints exact technical recruiters and engineering managers for the target opening. Executes live DNS MX record lookups and SMTP handshakes before drafting, guaranteeing 0% bounce rates so your outreach safely lands.",
    techSpec: "Live DNS & MX Check // 0% Bounce Guarantee",
    image: "https://ik.imagekit.io/adochaure/Pixelart.jpg?updatedAt=1786202136543",
  },
  {
    number: "03",
    title: "Outreach",
    description:
      "Powered by Gemini AI with dynamic candidate context injection. Reads your resume repositories and maps them directly to the company's tech stack, producing natural, human-grade cold emails without corporate fluff.",
    techSpec: "Gemini 2.5 LLM // Zero-Template Output",
    image: "https://ik.imagekit.io/adochaure/By%20Hajin%20Bae(Ampliado).gif?updatedAt=1786796840694",
  },
  {
    number: "04",
    title: "Dispatch",
    description:
      "Zero-friction outreach with 1-click Auto-Send via Google Gmail API, instant web composer, or mobile Gmail deep-links. Automatically attaches your verified resume PDF and tracks pipeline state from sent to replied.",
    techSpec: "Gmail API Integration // PDF Attachment + Tracking",
    image:
      "https://ik.imagekit.io/adochaure/GIFcollection3-soman-ezgif.com-crop%20(1).gif?updatedAt=1786798484105",
  },
];

export interface StampFeatureRowProps {
  heading?: string;
  subheading?: string;
  className?: string;
}

export function StampFeatureRow({
  heading = "Crafted like an art. Built for conversion.",
  subheading = "Four quiet tools designed to turn cold job hunting into verified, high-reply outreach.",
  className = "",
}: StampFeatureRowProps) {
  return (
    <section className={`relative w-full py-14 sm:py-20 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto max-w-7xl">
        {/* Editorial Heading (Clean & Quiet: No capsule pill) */}
        {heading && (
          <div className="text-center mb-12 sm:mb-14">
            <h2
              className="text-[clamp(1.9rem,4vw,2.85rem)] leading-[1.12] tracking-[-0.035em] text-[#171411]"
              style={{ fontFamily: "CooperLtBT, Fraunces, Georgia, serif" }}
            >
              {heading}
            </h2>
            {subheading && (
              <p className="mx-auto mt-2.5 max-w-xl text-xs sm:text-sm leading-relaxed text-[#6d6457]">
                {subheading}
              </p>
            )}
          </div>
        )}

        {/* 4-Card Responsive Grid: Single Unified Stamp Card Per Feature */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-7 justify-items-center">
          {BEAKY_FEATURES.map((feature) => (
            <UnifiedStampCard
              key={feature.number}
              number={feature.number}
              title={feature.title}
              description={feature.description}
              techSpec={feature.techSpec}
              image={feature.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
