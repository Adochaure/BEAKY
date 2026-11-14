"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  LayoutDashboard,
  Mail,
  Search,
  Settings2,
  UsersRound,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jobs & Emails", href: "/dashboard/jobs", icon: Search },
  { label: "Saved Jobs", href: "/dashboard/saved-jobs", icon: Bookmark },
  { label: "Recruiters", href: "/dashboard/recruiters", icon: UsersRound },
  { label: "Email History", href: "/dashboard/email-history", icon: Mail },
  { label: "Profile", href: "/dashboard/profile", icon: UserRound },
];

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Workspace"
      className={mobile ? "flex min-w-max items-center gap-1 px-3 py-2" : "flex flex-col gap-1 px-2 py-3"}
    >
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`group inline-flex items-center gap-2 rounded-[8px] text-[11px] font-medium transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 ${
              mobile ? "px-3 py-2" : "px-3 py-[7px]"
            } ${
              active
                ? "bg-[#353535] text-white"
                : "text-[#c7c7c7] hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <Icon size={14} strokeWidth={1.8} className="shrink-0 opacity-90" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  children,
  userName,
  userEmail,
}: {
  children: ReactNode;
  userName: string;
  userEmail: string;
}) {
  return (
    <>
    <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
    <div className="flex min-h-screen bg-[#faf7f0] text-[#1c1916]">
      <aside className="sticky top-0 hidden h-screen w-[176px] shrink-0 flex-col border-r border-white/[0.06] bg-[#191919] text-white sm:flex">
        <div className="flex h-[50px] items-center border-b border-white/[0.07] px-3.5">
          <Link href="/" aria-label="Beaky home" className="inline-flex items-center gap-2">
            <Image
              src="https://ik.imagekit.io/adochaure/c2109e83-c24d-4008-bb62-d600bf9ad7d5.png"
              alt=""
              width={19}
              height={19}
              unoptimized
              className="size-[19px] object-contain brightness-0 invert"
            />
            <span className="text-[15px] font-bold tracking-[-0.06em]" style={{ fontFamily: "var(--font-doto)" }}>
              Beaky
            </span>
          </Link>
        </div>
        <NavigationLinks />
        <div className="mt-auto border-t border-white/[0.08] px-3.5 py-3.5">
          <p className="truncate text-[11px] font-semibold text-white">{userName}</p>
          <p className="mt-0.5 truncate text-[9px] text-[#999]">{userEmail}</p>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex h-[50px] shrink-0 items-center justify-end border-b border-[#332d2412] bg-[#faf7f0]/95 px-5 sm:px-8">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg text-[#8b8174]">
            <Settings2 size={15} strokeWidth={1.7} />
          </span>
          <div aria-hidden="true" className="mx-2 h-4 w-px bg-[#332d2420]" />
          <div className="grid size-7 place-items-center rounded-full bg-[#211a14] text-[9px] font-semibold text-white">
            AC
          </div>
        </header>
        <div className="sticky top-[50px] z-30 border-b border-[#332d2415] bg-[#191919] sm:hidden">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2 text-white">
            <Image
              src="https://ik.imagekit.io/adochaure/c2109e83-c24d-4008-bb62-d600bf9ad7d5.png"
              alt=""
              width={18}
              height={18}
              unoptimized
              className="size-[18px] object-contain brightness-0 invert"
            />
            <span className="text-sm font-bold tracking-[-0.06em]" style={{ fontFamily: "var(--font-doto)" }}>
              Beaky
            </span>
            <div className="ml-auto">
              <SignOutButton />
            </div>
          </div>
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <NavigationLinks mobile />
          </div>
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
    </>
  );
}
