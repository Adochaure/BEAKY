import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Dashboard rendering depends on the signed-in user's Supabase session.
  await connection();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect("/get-started?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/get-started");

  const email = typeof data.claims.email === "string" ? data.claims.email : "Signed-in account";
  const displayName = email.includes("@") ? email.split("@")[0] : email;
  return <DashboardShell userName={displayName} userEmail={email}>{children}</DashboardShell>;
}
