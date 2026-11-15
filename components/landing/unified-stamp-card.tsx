"use client";

import Image from "next/image";
import React, { useId } from "react";

export interface UnifiedStampCardProps {
  number: string;
  title: string;
  description: string;
  techSpec?: string;
  image: string;
  className?: string;
}

export function UnifiedStampCard({
  number,
  title,
  description,
  techSpec,
  image,
  className = "",
}: UnifiedStampCardProps) {
  const id = useId().replace(/:/g, "");
  const maskId = `stamp-card-mask-${id}`;
  const gradientId = `stamp-card-fade-${id}`;
  const topVignetteId = `stamp-card-top-${id}`;

  const numericWidth = 340;
  const numericHeight = 520;
  const imageHeight = 225; // Top-to-middle image area (~43% of card)

  const spacing = 24;
  const holeRadius = 7;
  const holes: { cx: number; cy: number }[] = [];

  // Top + Bottom Edge Perforations
  for (let x = 14; x <= numericWidth - 14; x += spacing) {
    holes.push({ cx: x, cy: 0 });
    holes.push({ cx: x, cy: numericHeight });
  }

  // Left + Right Edge Perforations
  for (let y = 16; y <= numericHeight - 16; y += spacing) {
    holes.push({ cx: 0, cy: y });
    holes.push({ cx: numericWidth, cy: y });
  }

  return (
    <div
      className={`relative w-full max-w-[340px] stamp-drop-shadow transition duration-300 hover:-translate-y-1.5 ${className}`}
      style={{
        aspectRatio: `${numericWidth} / ${numericHeight}`,
      }}
    >
      {/* SVG Stamp Canvas with Edge Perforations & Masked Media */}
      <svg
        viewBox={`0 0 ${numericWidth} ${numericHeight}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          {/* Perforated Postage Stamp Mask */}
          <mask id={maskId}>
            <rect width={numericWidth} height={numericHeight} fill="white" />
            {holes.map((hole, index) => (
              <circle
                key={index}
                cx={hole.cx}
                cy={hole.cy}
                r={holeRadius}
                fill="black"
              />
            ))}
          </mask>

          {/* Smooth Middle Fade: Blends image seamlessly into #faf7f0 cream card */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#faf7f0" stopOpacity="0" />
            <stop offset="55%" stopColor="#faf7f0" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#faf7f0" stopOpacity="1" />
          </linearGradient>

          {/* Top Edge Vignette: Ensures white logo and number pop clearly over any GIF */}
          <linearGradient id={topVignetteId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0.65)" />
            <stop offset="60%" stopColor="rgba(0,0,0,0.2)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>

        {/* 1. Base Cream Card (#faf7f0) */}
        <rect
          width={numericWidth}
          height={numericHeight}
          fill="#faf7f0"
          mask={`url(#${maskId})`}
        />

        {/* 2. Top-to-Middle Image / GIF */}
        <image
          href={image}
          xlinkHref={image}
          x="0"
          y="0"
          width={numericWidth}
          height={imageHeight}
          preserveAspectRatio="xMidYMid slice"
          mask={`url(#${maskId})`}
        />

        {/* 3. Top Vignette Overlay for Crisp Contrast */}
        <rect
          x="0"
          y="0"
          width={numericWidth}
          height="95"
          fill={`url(#${topVignetteId})`}
          mask={`url(#${maskId})`}
          pointerEvents="none"
        />

        {/* 4. Middle Gradient Merge (Fades image into cream card body) */}
        <rect
          x="0"
          y="115"
          width={numericWidth}
          height={imageHeight - 115}
          fill={`url(#${gradientId})`}
          mask={`url(#${maskId})`}
          pointerEvents="none"
        />

        {/* 5. Subtle Stamp Framing Inset Line */}
        <rect
          x="10"
          y="10"
          width={numericWidth - 20}
          height={numericHeight - 20}
          fill="none"
          stroke="rgba(48,41,31,0.06)"
          strokeWidth="1"
          mask={`url(#${maskId})`}
          pointerEvents="none"
        />
      </svg>

      {/* HTML Content Overlay: Top Bar & Rich Technical Feature Text */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 pb-6.5">
        {/* Top Header Row: Beaky Logo on Left + White Card Number on Right */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="https://ik.imagekit.io/adochaure/c2109e83-c24d-4008-bb62-d600bf9ad7d5.png"
              alt="Beaky"
              width={34}
              height={34}
              unoptimized
              className="size-8 sm:size-8.5 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
            />
          </div>

          {/* White Card Number */}
          <span
            className="text-[26px] font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
            style={{ fontFamily: "var(--font-doto), monospace" }}
          >
            {number}
          </span>
        </div>

        {/* Lower Half: Substantial Technical Intelligence for Judges */}
        <div className="mt-auto pt-2">
          {/* Main Clean Heading: e.g. "Discovery" */}
          <h3
            className="text-[20px] sm:text-[22px] font-bold leading-tight tracking-[-0.03em] text-[#171411]"
            style={{ fontFamily: "CooperLtBT, Fraunces, Georgia, serif" }}
          >
            {title}
          </h3>

          {/* Substantial, Clear Description */}
          <p className="mt-2 text-[12px] sm:text-[12.5px] leading-relaxed text-[#5c5549]">
            {description}
          </p>

          {/* Technical Spec Pill */}
          {techSpec && (
            <div className="mt-3 border-t border-[#ded7cb]/70 pt-2.5">
              <span className="text-[10px] font-mono tracking-wider text-[#8a7f72] uppercase">
                {techSpec}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
