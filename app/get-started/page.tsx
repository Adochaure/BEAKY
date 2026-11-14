import Image from "next/image";
import Link from "next/link";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-[18px]">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5.1c-1.8 1.2-4 2-6.8 2-5.2 0-9.7-3.5-11.3-8.2H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.7 27.9a12 12 0 0 1 0-7.8v-5.3H5.8a20 20 0 0 0 0 18.4l6.9-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 11.9c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4 20 20 0 0 0 5.8 14.8l6.9 5.3c1.6-4.7 6.1-8.2 11.3-8.2Z"
      />
    </svg>
  );
}

export default function GetStartedPage() {
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

          <button
            type="button"
            className="mt-6 flex h-[50px] w-full items-center justify-center gap-3 rounded-xl border border-[#cf3340] bg-[#e63946] px-4 text-sm font-semibold text-white shadow-[0_2px_4px_rgba(23,43,50,0.12)] ring-1 ring-[#a92230] transition duration-200 hover:bg-[#bd2634] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e63946]"
          >
            <GoogleMark />
            Continue with Google
          </button>
        </div>
      </section>
    </main>
  );
}
