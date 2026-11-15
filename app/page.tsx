import { LandingHero } from "@/components/landing/landing-hero";
import { SiteHeader } from "@/components/landing/site-header";
import { StampFeatureRow } from "@/components/landing/stamp-feature-row";
import { HowItWorksPipeline } from "@/components/landing/how-it-works-pipeline";
import { SiteFooter } from "@/components/landing/site-footer";

export default function Home() {
  return (
    <main
      className="relative isolate min-h-screen text-[#172b32]"
      style={{
        background:
          "linear-gradient(to top, rgba(230,57,70,0.16) 0%, rgba(230,57,70,0.06) 34%, #f1faee 78%)",
      }}
    >
      <SiteHeader />
      <LandingHero />
      <StampFeatureRow />
      <HowItWorksPipeline
        heading="How it works"
        subheading="From resume ingestion to verified hiring manager inboxes in six calm steps."
        className="pb-20 pt-4"
      />
      <SiteFooter />
    </main>
  );
}
