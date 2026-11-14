
import { LandingHero } from "@/components/landing/landing-hero";
import { SiteHeader } from "@/components/landing/site-header";

export default function Home() {
  return (
    <main
      className="relative isolate min-h-screen text-[#172b32]"
      style={{
        background:
          "linear-gradient(to top, rgba(230,57,70,0.16) 0%, rgba(230,57,70,0.06) 34%, #f1faee 78%)"
      }}
    >
   
      <SiteHeader />
      <LandingHero />
    </main>
  );
}
