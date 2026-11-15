import Link from "next/image";
import NextLink from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Beaky",
  description: "Privacy policy and Google API user data disclosure for Beaky.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#faf7f0] text-[#1c1916]">
      <header className="border-b border-[#332d2415] bg-[#faf7f0]/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <NextLink href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1c1916]">
            <ArrowLeft size={16} />
            <span>Back to Beaky</span>
          </NextLink>
          <span className="text-xs font-medium text-[#7d7367]">Effective Date: November 15, 2026</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#e63946]/10 text-[#a92230]">
            <ShieldCheck size={22} />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#171411]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>
              Privacy Policy
            </h1>
            <p className="mt-1 text-sm text-[#7d7367]">Beaky Career Discovery &amp; Outreach Platform</p>
          </div>
        </div>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-[#413930]">
          <section>
            <h2 className="text-base font-bold text-[#171411]">1. Introduction</h2>
            <p className="mt-2">
              Beaky (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the career search, recruiter discovery, and automated cold outreach platform. We are committed to protecting your personal information and respecting your privacy. This policy explains how we collect, store, and process your data when you use Beaky.
            </p>
          </section>

          <section className="rounded-xl border border-[#34a853]/30 bg-[#e7f5ea]/50 p-5">
            <h2 className="text-base font-bold text-[#205e38]">2. Google API Services User Data Policy &amp; Limited Use Disclosure</h2>
            <p className="mt-2 text-[#2c4a35]">
              Beaky uses Google APIs to enable users to connect their Google account and optionally dispatch approved job application emails via Gmail.
            </p>
            <p className="mt-3 font-semibold text-[#1f482d]">
              Beaky&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[#0f2c1a]"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-xs text-[#2c4a35]">
              <li>We only request access to the minimum scopes required: user identity (email/profile) and <code>https://www.googleapis.com/auth/gmail.send</code> to send emails you explicitly review and approve.</li>
              <li>We do not read your inbox, access private incoming emails, or scan messages.</li>
              <li>We never sell, rent, or transfer your Google user data to third parties, advertising platforms, data brokers, or AI model trainers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#171411]">3. Information We Collect</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li><strong>Account Information:</strong> Your name, email address, and authentication identifiers provided during sign up via Supabase and Google.</li>
              <li><strong>Resume &amp; Profile Data:</strong> PDF resumes you upload and candidate skills, experience levels, and target roles extracted using Gemini AI.</li>
              <li><strong>Outreach Drafts &amp; Contacts:</strong> Recruiter email addresses discovered or entered, tailored email drafts, and email dispatch audit history.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#171411]">4. How We Use Your Information</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Matching candidate profiles to job opportunities across remote, hybrid, and onsite listings.</li>
              <li>Drafting personalized 1-to-1 cold emails customized to the target employer.</li>
              <li>Dispatching approved emails via your chosen method (Gmail Web or background Gmail API).</li>
              <li>Tracking your outreach history in your personal dashboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#171411]">5. Data Storage &amp; Security</h2>
            <p className="mt-2">
              All data is stored securely using Supabase with PostgreSQL Row Level Security (RLS), ensuring only you can access your profile and drafts. PDF resumes are stored in private cloud storage buckets. Sensitive credentials and API encryption keys are protected using AES-256 standards.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#171411]">6. Your Rights &amp; Data Deletion</h2>
            <p className="mt-2">
              You can access, update, or delete your uploaded resume, candidate profile, or saved jobs at any time from your Beaky dashboard. To request complete deletion of your account and associated records, contact us at the email below.
            </p>
          </section>

          <section className="border-t border-[#332d2415] pt-6">
            <h2 className="text-base font-bold text-[#171411]">7. Contact Us</h2>
            <p className="mt-2">
              If you have any questions about this Privacy Policy or Beaky&apos;s data practices, please contact us at:
            </p>
            <p className="mt-2 font-semibold text-[#a92230]">
              Email: adochaure420@gmail.com
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
