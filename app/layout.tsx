import type { Metadata } from "next";
import { Doto } from "next/font/google";
import "./globals.css";

const doto = Doto({
  variable: "--font-doto",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beaky — Autonomous Cold Email & Recruiter Outreach Agent",
  description:
    "Autonomous cold email agent that discovers verified engineering roles, validates recruiter emails via live DNS MX checks, and dispatches bespoke 1-to-1 cold emails with resume attached via Gmail API.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${doto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
