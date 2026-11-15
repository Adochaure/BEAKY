"use client";

import React, { useId } from "react";

export interface StampframeProps {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  fill?: string;
  aspectRatio?: string;
  className?: string;
}

export default function Stampframe({
  children,
  width = "100%",
  height = "auto",
  fill = "#faf7f0",
  aspectRatio,
  className = "",
}: StampframeProps) {
  const id = useId().replace(/:/g, "");
  const maskId = `stamp-mask-${id}`;

  const numericWidth = typeof width === "number" ? width : 400;
  const numericHeight = typeof height === "number" ? height : 400;

  const spacing = 24;
  const holeRadius = 7;
  const holes: { cx: number; cy: number }[] = [];

  // Top + bottom
  for (let x = 12; x <= numericWidth - 12; x += spacing) {
    holes.push({ cx: x, cy: 0 });
    holes.push({ cx: x, cy: numericHeight });
  }

  // Left + right
  for (let y = 12; y <= numericHeight - 12; y += spacing) {
    holes.push({ cx: 0, cy: y });
    holes.push({ cx: numericWidth, cy: y });
  }

  const containerStyle: React.CSSProperties = {
    width,
    position: "relative",
    aspectRatio: aspectRatio ?? `${numericWidth / numericHeight}`,
  };

  if (height !== "auto") {
    containerStyle.height = height;
  }

  return (
    <div className={`relative ${className}`} style={containerStyle}>
      {/* STAMP FRAME */}
      <svg
        viewBox={`0 0 ${numericWidth} ${numericHeight}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          <mask id={maskId}>
            {/* White = visible */}
            <rect width={numericWidth} height={numericHeight} fill="white" />

            {/* Black = holes */}
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
        </defs>

        {/* Frame background */}
        <rect
          width={numericWidth}
          height={numericHeight}
          fill={fill}
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* YOUR CONTENT */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between overflow-hidden p-6 sm:p-7">
        {children}
      </div>
    </div>
  );
}
