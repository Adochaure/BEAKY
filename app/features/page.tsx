import { ArrowUpRight, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { StampFeatureRow } from "@/components/landing/stamp-feature-row";
import { SiteFooter } from "@/components/landing/site-footer";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata = {
  title: "Features — Beaky | Thoughtful Career Discovery & Outreach",
  description:
    "Explore Beaky's features: opportunity intelligence, recruiter verification, Gemini email drafting, and zero-friction dispatch.",
};

const AI_IMAGE_PROMPTS = [
  {
    card: "Card 01 — Opportunity Discovery (Pixel Art / Ambient Room)",
    prompt:
      "A detailed 16-bit retro isometric pixel art of a cozy Tokyo developer apartment room at night. Ambient cyan and amber desk lamp glow, multiple monitors showing code and terminal logs, rain streaming down window overlooking city skyline, nostalgic warm lo-fi aesthetic. --ar 1:1",
    aspect: "Square 1:1 or 4:3",
    targetFile: "public/images/feature-01.jpg",
  },
  {
    card: "Card 02 — Recruiter Intelligence (Retro Pixel Art)",
    prompt:
      "A nostalgic retro pixel art illustration of a serene city street at dusk. Warm convenience store neon glow, telephone poles with silhouette wires against pastel twilight sky, detailed pixel dithering, peaceful urban solitude, 90s anime aesthetic. --ar 1:1",
    aspect: "Square 1:1 or 4:3",
    targetFile: "public/images/feature-02.jpg",
  },
  {
    card: "Card 03 — 1-to-1 Pitch Drafting (Surreal Dreamscape)",
    prompt:
      "A surreal retro anime artwork by Hajin Bae. A serene figure overlooking a vast tranquil ocean with floating geometric portals and soft pastel twilight clouds, dreamlike atmosphere, delicate line art, vintage risograph textures. --ar 1:1",
    aspect: "Square 1:1 or 4:3",
    targetFile: "public/images/feature-03.jpg",
  },
  {
    card: "Card 04 — Dispatch & Tracking (Futuristic Dispatch Terminal)",
    prompt:
      "A retro-futuristic postal and dispatch terminal aesthetic. Isometric vector art, glowing mail capsules, minimalist postal stamps, deep obsidian and crimson accents, Japanese typography accents, clean tech UI. --ar 1:1",
    aspect: "Square 1:1 or 4:3",
    targetFile: "public/images/feature-04.jpg",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#faf7f0] text-[#1c1916]">
      {/* Navigation Header */}
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-12 sm:pt-20 sm:pb-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#a92230] uppercase">
            Platform Capabilities
          </p>
          <h1
            className="mt-4 text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.08] tracking-[-0.045em] text-[#171411]"
            style={{ fontFamily: "CooperLtBT, Fraunces, Georgia, serif" }}
          >
            Crafted like an art. Built for conversion.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#6d6457] sm:text-base">
            Every tool you need to uncover verified opportunities, reach genuine hiring leaders, and dispatch tailored pitches that actually get read.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/get-started" size="small" className="text-white font-semibold">
              <span>Start your search</span>
              <ArrowUpRight size={13} />
            </ButtonLink>
            <ButtonLink href="/dashboard/jobs" variant="outline" size="small">
              Explore Live Roles
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Stamp Features Gallery (Unified stamp cards with top-down image merge) */}
      <StampFeatureRow
        heading="Four pillars of thoughtful outreach."
        subheading="Perforated like classic correspondence, engineered for high-signal engineering careers."
        className="pt-2 pb-20"
      />

      {/* AI Image Prompts Generator Section */}
      <section className="mx-auto max-w-4xl px-6 py-16 border-t border-[#30291f14]">
        <div className="rounded-2xl border border-[#ded7cb] bg-white/70 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#e63946]/10 text-[#a92230]">
              <Sparkles size={20} />
            </span>
            <div>
              <h3
                className="text-xl font-bold text-[#171411]"
                style={{ fontFamily: "CooperLtBT, Fraunces, Georgia, serif" }}
              >
                AI Image Prompts for Custom Stamp Artwork
              </h3>
              <p className="mt-0.5 text-xs text-[#766f65]">
                Generate custom replacement visuals using Midjourney, Flux, DALL-E 3, or Ideogram.
              </p>
            </div>
          </div>

          <div className="mt-6 divide-y divide-[#30291f14]">
            {AI_IMAGE_PROMPTS.map((item) => (
              <div key={item.card} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[12px] font-bold text-[#171411]">{item.card}</h4>
                  <span className="text-[9px] font-mono text-[#81786d] bg-[#faf7f0] border border-[#ded7cb] px-2 py-0.5 rounded">
                    {item.aspect}
                  </span>
                </div>
                <div className="mt-2 rounded-lg bg-[#faf7f0] border border-[#ded7cb]/80 p-3 text-[11px] font-mono text-[#332c25] leading-relaxed select-all">
                  {item.prompt}
                </div>
                <p className="mt-1.5 text-[10px] text-[#81786d]">
                  Save generated image to:{" "}
                  <code className="text-[#a92230] font-semibold">{item.targetFile}</code>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
