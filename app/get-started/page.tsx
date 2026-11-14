import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; reason?: string | string[] }>;
}) {
  await connection();
  const { error: queryError, reason: queryReason } = await searchParams;
  const error = Array.isArray(queryError) ? queryError[0] : queryError;
  const reason = Array.isArray(queryReason) ? queryReason[0] : queryReason;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) redirect("/dashboard");
  }
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#f1faee] px-5 py-12 text-[#172b32]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_100%,rgba(230,57,70,0.16),transparent_55%)]"
      />

      <section className="w-full max-w-[440px] overflow-hidden rounded-[24px] border border-white bg-white/95 shadow-[0_18px_52px_rgba(23,43,50,0.14)] ring-1 ring-white/80 backdrop-blur">
        <div className="relative h-[190px] w-full sm:h-[220px]">
          <Image
            src="https://ik.imagekit.io/adochaure/Crimson%20Dithered%20Cloudscape.png"
            alt="Crimson clouds across a dithered sky"
            fill
            priority
            unoptimized
            sizes="(max-width: 440px) 100vw, 440px"
            className="object-cover object-center"
          />
          <Link
            href="/"
            aria-label="Beaky home"
            className="absolute top-4 left-4 inline-flex items-center gap-2"
          >
            <Image
              src="https://ik.imagekit.io/adochaure/c2109e83-c24d-4008-bb62-d600bf9ad7d5.png"
              alt=""
              width={38}
              height={38}
              unoptimized
              className="size-[38px] object-contain brightness-0 invert drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
            />
            <span
              className="text-[21px] font-bold leading-none tracking-[-0.06em] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
              style={{ fontFamily: "var(--font-doto)" }}
            >
              Beaky
            </span>
          </Link>
        </div>

        <div className="px-7 py-8 sm:px-9 sm:py-9">
          <h1
            className="text-center text-[32px] leading-[1.12] tracking-[-0.045em] text-[#172b32]"
            style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}
          >
            Sign in to Beaky
          </h1>

          <div className="mt-6">
            <GoogleSignInButton
              setupError={error === "supabase_not_configured"}
              callbackError={error === "oauth_callback"}
              callbackReason={reason}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
