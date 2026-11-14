"use client";

import { useState } from "react";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-[18px]">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5.1c-1.8 1.2-4 2-6.8 2-5.2 0-9.7-3.5-11.3-8.2H5.8v5.3A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.7 27.9a12 12 0 0 1 0-7.8v-5.3H5.8a20 20 0 0 0 0 18.4l6.9-5.3Z" />
      <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4 20 20 0 0 0 5.8 14.8l6.9 5.3c1.6-4.7 6.1-8.2 11.3-8.2Z" />
    </svg>
  );
}

export function GoogleSignInButton({
  setupError = false,
  callbackError = false,
  callbackReason,
}: {
  setupError?: boolean;
  callbackError?: boolean;
  callbackReason?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const configured = isSupabaseConfigured();

  async function signIn() {
    setError("");
    setPending(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=%2Fdashboard`,
        },
      });
      if (authError) throw authError;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Google sign-in could not be started.");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={!configured || pending}
        onClick={signIn}
        className="flex h-[50px] w-full items-center justify-center gap-3 rounded-xl border border-[#cf3340] bg-[#e63946] px-4 text-sm font-semibold text-white shadow-[0_2px_4px_rgba(23,43,50,0.12)] ring-1 ring-[#a92230] transition duration-200 hover:bg-[#bd2634] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e63946] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <span className="size-4 animate-spin rounded-full border-2 border-white/45 border-t-white" /> : <GoogleMark />}
        {pending ? "Opening Google…" : "Continue with Google"}
      </button>
      {!configured ? (
        <p role="status" className="mt-3 text-center text-[10px] leading-4 text-[#8a8073]">
          Add your Supabase URL and publishable key to <code>.env.local</code> to enable sign-in.
        </p>
      ) : null}
      {setupError ? (
        <p role="alert" className="mt-3 text-center text-[10px] leading-4 text-[#a43d32]">
          Supabase setup is incomplete. Add the project URL and publishable key, then run the database migration.
        </p>
      ) : null}
      {callbackError ? (
        <p role="alert" className="mt-3 text-center text-[10px] leading-4 text-[#a43d32]">
          {callbackReason === "cancelled"
            ? "Google sign-in was canceled. Try again when you’re ready."
            : callbackReason === "exchange_failed"
              ? "Supabase could not verify Google’s response. Check that Google is enabled in Supabase and its callback URL is correct."
              : callbackReason === "missing_code" || callbackReason === "provider_error"
                ? "Google did not return a sign-in code. Check the Google OAuth redirect URL in your provider settings."
                : "Google sign-in could not be completed. Check the server logs for the callback error, then try again."}
        </p>
      ) : null}
      {error ? <p role="alert" className="mt-3 text-center text-[10px] leading-4 text-[#a43d32]">{error}</p> : null}
    </div>
  );
}
