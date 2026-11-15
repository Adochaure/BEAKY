"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/get-started");
      router.refresh();
    } catch {
      setError("Could not sign out. Try again.");
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={signOut}
        className={
          className ??
          "mt-2 inline-flex items-center gap-1.5 rounded-[6px] border border-[#e63946]/35 bg-[#e63946]/10 px-2.5 py-1 text-[10px] font-semibold text-[#e63946] transition hover:bg-[#e63946] hover:text-white focus-visible:outline-2 focus-visible:outline-[#e63946] disabled:opacity-50"
        }
      >
        <LogOut size={12} />
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error ? <span role="alert" className="mt-1 block text-[9px] text-[#ff9f97]">{error}</span> : null}
    </>
  );
}
