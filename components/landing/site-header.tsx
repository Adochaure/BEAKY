import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

const links = [
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/how-it-works" },
  { label: "About us", href: "/about" },
  { label: "Workspace", href: "/dashboard" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#172b3212] bg-[#f1faee]/75 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[68px] w-[min(1000px,calc(100%-48px))] items-center max-sm:min-h-0 max-sm:w-[calc(100%-32px)] max-sm:flex-wrap max-sm:py-2">
        <Link
          className="inline-flex w-fit items-center gap-2 text-[#172b32]"
          href="/"
          aria-label="Beaky home"
        >
          <Image
            src="https://ik.imagekit.io/adochaure/c2109e83-c24d-4008-bb62-d600bf9ad7d5.png"
            alt=""
            width={32}
            height={32}
            priority
            unoptimized
            className="size-8 object-contain"
          />
          <span
            className="text-[20px] font-bold leading-none tracking-[-0.06em]"
            style={{ fontFamily: "var(--font-doto)" }}
          >
            Beaky
          </span>
        </Link>

        <nav
          className="ml-auto mr-8 flex items-center justify-end gap-8 text-xs font-medium text-[#526368] max-sm:hidden"
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <a
              className="relative whitespace-nowrap py-2 transition-colors duration-200 hover:text-[#172b32] after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:origin-left after:scale-x-0 after:bg-[#e63946] after:transition-transform after:duration-200 hover:after:scale-x-100"
              href={link.href}
              key={link.label}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-0 flex items-center gap-2 max-sm:ml-auto">
          <ButtonLink
            className="group text-white"
            href="/get-started"
            size="small"
            style={{ color: "#ffffff" }}
          >
            Get started
            <ArrowUpRight
              aria-hidden="true"
              size={13}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </ButtonLink>

          <details className="group relative hidden max-sm:block">
            <summary
              aria-label="Toggle navigation menu"
              className="grid size-8 cursor-pointer list-none place-items-center rounded-[9px] text-[#263a3d] transition-colors hover:bg-black/5 [&::-webkit-details-marker]:hidden"
            >
              <Menu aria-hidden="true" size={18} strokeWidth={1.8} />
            </summary>
            <div className="absolute top-full right-0 z-20 mt-2 flex w-44 flex-col rounded-xl border border-[#172b3218] bg-[#f1faee] p-2 shadow-[0_8px_24px_rgba(23,43,50,0.12)]">
              {links.map((link) => (
                <a
                  className="rounded-lg px-3 py-2.5 text-xs font-medium text-[#526368] transition-colors hover:bg-black/5 hover:text-[#172b32]"
                  href={link.href}
                  key={link.label}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
