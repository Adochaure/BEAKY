"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
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
        className="mt-2 inline-flex items-center gap-1.5 rounded-md text-[9px] text-[#aaa] transition hover:text-white focus-visible:outline-2 focus-visible:outline-white"
      >
        <LogOut size={11} />
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error ? <span role="alert" className="mt-1 block text-[9px] text-[#ff9f97]">{error}</span> : null}
    </>
  );
}
