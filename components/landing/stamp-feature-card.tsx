"use client";

import Image from "next/image";
import { type ReactNode } from "react";

export type FeatureCardProps = {
  number: string;
  title: string;
  subtitle: string;
  tag: string;
  imagePosition?: "top" | "bottom";
  imageSrc?: string;
  illustrationFallback: ReactNode;
};

// Generates the postage stamp circular perforation bite marks along the edges
export function StampFeatureCard({
  number,
  title,
  subtitle,
  tag,
  imagePosition = "bottom",
  imageSrc,
  illustrationFallback,
}: FeatureCardProps) {
  const isImageTop = imagePosition === "top";

  return (
    <div className="group relative flex w-full max-w-[340px] flex-col overflow-hidden bg-[#faf7f0] text-[#1c1916] shadow-[0_20px_50px_rgba(0,0,0,0.45)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_65px_rgba(0,0,0,0.6)]">
      {/* Postage Stamp Perforations Overlays (matching dark #141312 background) */}
      {/* Top Edge Perforations */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1.5 inset-x-0 z-20 h-3"
        style={{
          backgroundImage: "radial-gradient(circle 3.5px at 50% 0, #141312 3.5px, transparent 4px)",
          backgroundSize: "14px 12px",
          backgroundRepeat: "repeat-x",
        }}
      />
      {/* Bottom Edge Perforations */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1.5 inset-x-0 z-20 h-3"
        style={{
          backgroundImage: "radial-gradient(circle 3.5px at 50% 100%, #141312 3.5px, transparent 4px)",
          backgroundSize: "14px 12px",
          backgroundRepeat: "repeat-x",
        }}
      />
      {/* Left Edge Perforations */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-1.5 inset-y-0 z-20 w-3"
        style={{
          backgroundImage: "radial-gradient(circle 3.5px at 0 50%, #141312 3.5px, transparent 4px)",
          backgroundSize: "12px 14px",
          backgroundRepeat: "repeat-y",
        }}
      />
      {/* Right Edge Perforations */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-1.5 inset-y-0 z-20 w-3"
        style={{
          backgroundImage: "radial-gradient(circle 3.5px at 100% 50%, #141312 3.5px, transparent 4px)",
          backgroundSize: "12px 14px",
          backgroundRepeat: "repeat-y",
        }}
      />

      {/* Card Content: Text Section */}
      <div
        className={`flex flex-col justify-between p-6 sm:p-7 ${
          isImageTop ? "order-2 min-h-[220px]" : "order-1 min-h-[220px]"
        }`}
      >
        <div>
          {/* Header Row: Beaky Stamp Emblem & Feature Number */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#171411]">
                <path d="M12 2L3 9L12 16L21 9L12 2Z" fill="currentColor" />
                <path d="M3 15L12 22L21 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[9px] font-bold tracking-[0.15em] text-[#81786d] uppercase">{tag}</span>
            </span>
            <span className="text-[18px] font-bold tracking-tight text-[#171411]" style={{ fontFamily: "var(--font-doto), monospace" }}>
              {number}
            </span>
          </div>

          {/* Title */}
          <h3
            className="mt-4 text-[20px] leading-[1.2] tracking-[-0.03em] text-[#171411]"
            style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}
          >
            {title}
          </h3>

          {/* Subtitle */}
          <p className="mt-2 text-[12px] leading-relaxed text-[#675f54]">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Card Content: Illustration Image Section */}
      <div
        className={`relative h-[220px] w-full overflow-hidden bg-[#e9e4d7] ${
          isImageTop ? "order-1 border-b border-[#30291f14]" : "order-2 border-t border-[#30291f14]"
        }`}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 340px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          illustrationFallback
        )}
      </div>
    </div>
  );
}
