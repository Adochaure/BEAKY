# Supabase setup

## 1. Add project credentials

Create a Supabase project, copy `.env.example` to `.env.local`, and replace both placeholders with the project URL and publishable key from **Project Settings → API Keys**. Do not add a service-role key to this app.

## 2. Create the database tables

Run the SQL files in `supabase/migrations/` in the Supabase SQL Editor. They create the opportunities, recruiter contacts, discovery log, profile settings, candidate profile fields, and private resume storage, with row-level security policies that restrict records and files to their owner. If the first migrations are already installed, run only `20261114030000_candidate_profile.sql` for resume analysis.

To save custom API keys, set `USER_API_KEYS_ENCRYPTION_KEY` on the server to a private 32-byte key encoded as 64 hexadecimal characters. Generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Do not expose this key with a `NEXT_PUBLIC_` variable.

Job search works without another key and is limited to remote listings from [Himalayas](https://himalayas.app). An optional free `HIMALAYAS_API_KEY` raises the API rate limit; keep it server-side and restart the app after adding it.

For recruiter lookup, set `HUNTER_API_KEY` on the server. Hunter's HR department search can consume credits from that Hunter account, so Beaky asks before each lookup and shows suggested addresses for review. Without this key, enter a recruiter address manually.

For resume analysis, save your Gemini API key in Profile (with custom API keys enabled) or set `GEMINI_API_KEY` on the server. Analysis runs only after you click **Analyze resume**; that sends your PDF to Gemini to extract skills and experience for job matching and email drafts. The per-user Gemini key is encrypted using `USER_API_KEYS_ENCRYPTION_KEY`.

For Gmail sending, set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to your Google **Web application** OAuth client ID. In Google Cloud, enable the Gmail API and add each app origin (for local development, `http://localhost:3000`) under Authorized JavaScript origins. Add your own account as a test user while the OAuth consent screen is in testing. Beaky requests the `gmail.send` permission only when you approve an email; every send includes the PDF resume selected in Profile.

## 3. Enable Google sign-in

In **Authentication → Sign In / Providers**, enable Google and add your Google OAuth client ID and secret. In the Google Cloud OAuth client, add the callback URL shown by Supabase under its Google provider settings.

In **Authentication → URL Configuration**, add these app redirect URLs:

- `http://localhost:3000/auth/callback`
- Your deployed app URL followed by `/auth/callback`

The app uses Supabase Auth's PKCE flow and exchanges the callback code for a cookie-backed session.

## 4. Start the app

Restart the Next.js dev server after creating `.env.local`. Then open `/get-started` and use **Continue with Google**. The authenticated dashboard is at `/dashboard`.
