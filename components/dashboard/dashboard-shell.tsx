"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  LayoutDashboard,
  Mail,
  Menu,
  Search,
  Settings2,
  UsersRound,
  UserRound,
  X,
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

function getInitials(name: string, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "BK";
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
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initials = getInitials(userName, userEmail);

  const currentNav = navigation.find(
    (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
  );

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <div className="flex min-h-screen bg-[#faf7f0] text-[#1c1916]">
        {/* Desktop Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[184px] shrink-0 flex-col border-r border-white/[0.06] bg-[#191919] text-white sm:flex">
          <div className="flex h-[52px] items-center border-b border-white/[0.07] px-4">
            <Link href="/" aria-label="Beaky home" className="inline-flex items-center gap-2">
              <Image
                src="https://ik.imagekit.io/adochaure/c2109e83-c24d-4008-bb62-d600bf9ad7d5.png"
                alt=""
                width={20}
                height={20}
                unoptimized
                className="size-5 object-contain brightness-0 invert"
              />
              <span className="text-[16px] font-bold tracking-[-0.06em]" style={{ fontFamily: "var(--font-doto)" }}>
                Beaky
              </span>
            </Link>
          </div>

          <nav aria-label="Workspace Navigation" className="flex flex-col gap-1 px-2.5 py-3">
            {navigation.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`group inline-flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[11px] font-medium transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 ${
                    active
                      ? "bg-[#333333] text-white shadow-sm"
                      : "text-[#b0a89d] hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <Icon size={14} strokeWidth={1.8} className={`shrink-0 ${active ? "text-[#e63946]" : "opacity-80"}`} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/[0.08] px-3.5 py-3.5">
            <p className="truncate text-[11px] font-semibold text-white">{userName || "Candidate"}</p>
            <p className="mt-0.5 truncate text-[9px] text-[#999]">{userEmail}</p>
            <SignOutButton />
          </div>
        </aside>

        {/* Mobile Slide-Out Drawer Overlay */}
        {mobileMenuOpen ? (
          <div
            className="fixed inset-0 z-50 flex sm:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative flex w-[260px] max-w-[85vw] flex-col bg-[#191919] text-white shadow-2xl">
              <div className="flex h-[52px] items-center justify-between border-b border-white/[0.08] px-4">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-2"
                >
                  <Image
                    src="https://ik.imagekit.io/adochaure/c2109e83-c24d-4008-bb62-d600bf9ad7d5.png"
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                    className="size-5 object-contain brightness-0 invert"
                  />
                  <span className="text-[16px] font-bold tracking-[-0.06em]" style={{ fontFamily: "var(--font-doto)" }}>
                    Beaky
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation"
                  className="grid size-8 place-items-center rounded-lg text-[#999] hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <nav aria-label="Mobile Drawer Links" className="flex flex-col gap-1.5 p-3">
                {navigation.map(({ label, href, icon: Icon }) => {
                  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`inline-flex items-center gap-3 rounded-[9px] px-3.5 py-2.5 text-[12px] font-medium transition ${
                        active
                          ? "bg-[#333333] text-white shadow-sm font-semibold"
                          : "text-[#b0a89d] hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.8} className={active ? "text-[#e63946]" : "opacity-80"} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto border-t border-white/[0.08] p-4">
                <p className="truncate text-[12px] font-semibold text-white">{userName || "Candidate"}</p>
                <p className="mt-0.5 truncate text-[10px] text-[#999]">{userEmail}</p>
                <div className="mt-3">
                  <SignOutButton />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Main Content Area */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {/* Top Bar for Desktop & Mobile Header */}
          <header className="sticky top-0 z-30 flex h-[52px] shrink-0 items-center justify-between border-b border-[#332d2415] bg-[#faf7f0]/95 px-4 backdrop-blur-md sm:px-8">
            {/* Mobile Hamburger & Logo */}
            <div className="flex items-center gap-3 sm:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="grid size-9 place-items-center rounded-lg border border-[#332d241a] bg-white text-[#211a14] shadow-sm transition hover:bg-[#faf7f0]"
              >
                <Menu size={18} />
              </button>
              <Link href="/dashboard" className="inline-flex items-center gap-1.5">
                <Image
                  src="https://ik.imagekit.io/adochaure/c2109e83-c24d-4008-bb62-d600bf9ad7d5.png"
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                  className="size-5 object-contain"
                />
                <span className="text-[15px] font-bold tracking-[-0.06em]" style={{ fontFamily: "var(--font-doto)" }}>
                  Beaky
                </span>
              </Link>
            </div>

            {/* Current Section Title indicator for mobile */}
            <div className="sm:hidden">
              <span className="rounded-full bg-[#30291f10] px-2.5 py-0.5 text-[10px] font-semibold text-[#514a40]">
                {currentNav?.label ?? "Workspace"}
              </span>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2 sm:ml-auto">
              <span aria-hidden="true" className="hidden sm:grid size-8 place-items-center rounded-lg text-[#8b8174]">
                <Settings2 size={15} strokeWidth={1.7} />
              </span>
              <div aria-hidden="true" className="hidden sm:block mx-1 h-4 w-px bg-[#332d2420]" />
              <div className="grid size-7 place-items-center rounded-full bg-[#211a14] text-[9px] font-semibold text-white shadow-sm">
                {initials}
              </div>
            </div>
          </header>

          {/* Quick Mobile Horizontal Navigation Bar for Fast Switching */}
          <div className="sticky top-[52px] z-20 border-b border-[#332d2415] bg-[#191919] sm:hidden">
            <div className="flex overflow-x-auto px-2 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navigation.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[11px] font-medium transition ${
                      active ? "bg-[#333] text-white font-semibold" : "text-[#b0a89d] hover:text-white"
                    }`}
                  >
                    <Icon size={13} className={active ? "text-[#e63946]" : "opacity-80"} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </>
  );
}
