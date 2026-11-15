"use client";

import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="relative w-full overflow-hidden border-t border-[#30291f14] bg-[#f7f3e8]/70 pt-12 sm:pt-16 text-[#172b32]">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        {/* Main Footer Row: Brand Info on Left + Clean Nav on Right */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between pb-12">
          {/* Brand & Ethos */}
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="https://ik.imagekit.io/adochaure/c2109e83-c24d-4008-bb62-d600bf9ad7d5.png"
                alt="Beaky"
                width={28}
                height={28}
                unoptimized
                className="size-7 object-contain"
              />
              <span
                className="text-[20px] font-bold leading-none tracking-[-0.06em] text-[#172b32]"
                style={{ fontFamily: "var(--font-doto)" }}
              >
                Beaky
              </span>
            </Link>

            <p className="mt-3 text-xs leading-relaxed text-[#675f54]">
              Thoughtful career discovery & verified recruiter outreach. Built for signal, crafted like art.
            </p>

            {/* System Status Pill */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#ded7cb] bg-white/70 px-3 py-1 text-[10px] font-medium text-[#4f483e]">
              <span className="size-2 rounded-full bg-[#2a9d8f] animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Clean Navigation Links */}
          <div className="flex flex-wrap gap-12 sm:gap-16">
            {/* Platform */}
            <div>
              <h4 className="text-[11px] font-mono font-bold tracking-[0.16em] uppercase text-[#171411]">
                Platform
              </h4>
              <ul className="mt-3 space-y-2.5 text-xs text-[#675f54]">
                <li>
                  <Link href="/features" className="hover:text-[#a92230] transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="hover:text-[#a92230] transition-colors">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[11px] font-mono font-bold tracking-[0.16em] uppercase text-[#171411]">
                Legal
              </h4>
              <ul className="mt-3 space-y-2.5 text-xs text-[#675f54]">
                <li>
                  <Link href="/privacy" className="hover:text-[#a92230] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-[#a92230] transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Hairline Copyright Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#30291f14] py-6 text-[11px] text-[#81776b] gap-3">
          <p>© 2026 Beaky. All rights reserved.</p>
          <p className="font-mono text-[10px] tracking-wider uppercase">
            Crafted for high-signal engineering careers
          </p>
        </div>
      </div>

      {/* Giant Half-Visible Typographic Signature at End */}
      <div
        aria-hidden="true"
        className="relative w-full overflow-hidden text-center select-none pointer-events-none -mb-3 sm:-mb-6"
      >
        <div
          className="text-[clamp(5.5rem,21vw,17rem)] font-bold tracking-[-0.06em] leading-[0.72] text-[#172b32]/[0.08] whitespace-nowrap translate-y-[24%] uppercase"
          style={{ fontFamily: "var(--font-doto), monospace" }}
        >
          BEAKY
        </div>
      </div>
    </footer>
  );
}
