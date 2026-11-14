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
  title: "Beaky — Find your way in",
  description:
    "Find the right opportunity, reach the right person, and put your best self forward with Beaky. Thoughtful outreach, always on your terms.",
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
