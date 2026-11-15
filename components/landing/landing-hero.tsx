import Image from "next/image";
import { ArrowUpRight, Play } from "lucide-react";
import EmailJourneyExperience from "@/components/landing/email-journey-experience";
import { ButtonLink } from "@/components/ui/button-link";

export function LandingHero() {
  return (
    <section className="w-full">
      <div className="relative mx-auto flex w-[min(1120px,calc(100%_-_48px))] flex-col items-center pt-16 text-center max-sm:w-[calc(100%_-_36px)] max-sm:pt-12">
        <Image
          src="https://ik.imagekit.io/adochaure/0ba6097f-fcff-4aca-b9c7-3571b801c679.png"
          alt=""
          width={192}
          height={192}
          priority
          unoptimized
          className="pointer-events-none absolute top-0 left-0 size-48 object-contain max-lg:size-36 max-sm:left-[-18px] max-sm:size-24"
        />
        <Image
          src="https://ik.imagekit.io/adochaure/cec96c85-3710-4b6f-890c-7221a33ae016.png"
          alt=""
          width={112}
          height={112}
          unoptimized
          className="pointer-events-none absolute top-0 right-0 size-28 object-contain max-lg:size-20 max-sm:right-1 max-sm:size-12"
        />

        <div className="relative z-10 flex w-full flex-col items-center max-sm:mt-12">
          <h1
            className="max-w-[1160px] text-[clamp(2rem,4.2vw,3.5rem)] leading-[1.08] font-normal tracking-[-0.04em] text-black max-sm:text-[clamp(2rem,8vw,3rem)]"
            style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}
          >
            Emails crafted by AI
            <br />
            for opportunities <span className="italic">made for you.</span>
          </h1>

          <p className="mt-6 max-w-[790px] text-[13px] leading-[1.8] text-[#727b75] max-sm:mt-5 max-sm:max-w-[560px] max-sm:text-[14px] max-sm:leading-[1.7]">
            Jobs discovered, recruiters identified, personalized emails written, and resumes tailored — your entire job search, in one platform.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3 max-sm:mt-5 max-sm:gap-2">
            <ButtonLink
              href="/get-started"
              size="small"
              className="group min-w-[108px] text-white"
              style={{ color: "#ffffff" }}
            >
              Get started
              <ArrowUpRight
                aria-hidden="true"
                size={15}
                strokeWidth={1.8}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </ButtonLink>
            <ButtonLink
              href="https://adityachaure.xyz/vedio"
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="small"
              className="group min-w-[108px]"
            >
              <Play aria-hidden="true" size={13} fill="currentColor" />
              See demo
            </ButtonLink>
          </div>
        </div>
      </div>

      <EmailJourneyExperience />
    </section>
  );
}
