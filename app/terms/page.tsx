import NextLink from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Beaky",
  description: "Terms of service and user agreement for the Beaky platform.",
};

export default function TermsPage() {
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
          <span className="grid size-10 place-items-center rounded-xl bg-[#a92230]/10 text-[#a92230]">
            <FileText size={22} />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#171411]" style={{ fontFamily: 'CooperLtBT, Fraunces, Georgia, serif' }}>
              Terms of Service
            </h1>
            <p className="mt-1 text-sm text-[#7d7367]">User Agreement for Beaky</p>
          </div>
        </div>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-[#413930]">
          <section>
            <h2 className="text-base font-bold text-[#171411]">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By creating an account or using Beaky (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#171411]">2. Description of the Service</h2>
            <p className="mt-2">
              Beaky provides job seekers with AI-assisted career discovery, verified recruiter email lookup, tailored application email drafting, and dispatch integration through Gmail and standard email clients.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#171411]">3. User Responsibilities &amp; Acceptable Use</h2>
            <p className="mt-2">You agree that you will:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-[#52493e]">
              <li>Provide accurate, truthful resume information and not misrepresent credentials or work history.</li>
              <li>Only send legitimate, individualized employment inquiries to recruiters and hiring leads.</li>
              <li>Not use Beaky to send unsolicited mass spam, commercial promotions, harassment, or malicious content.</li>
              <li>Comply with all applicable anti-spam laws (including the CAN-SPAM Act and GDPR).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#171411]">4. Third-Party Integrations</h2>
            <p className="mt-2">
              The Service integrates with third-party providers including Google (Gmail API), Supabase, Hunter.io, and Google Gemini. Your use of these third-party services is subject to their respective terms and policies. Beaky is not responsible for third-party service outages or policy changes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#171411]">5. Intellectual Property</h2>
            <p className="mt-2">
              You retain all ownership of the resumes, materials, and messages you create. Beaky and its associated software, branding, and interfaces are the proprietary property of Beaky and its creators.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#171411]">6. Disclaimer of Warranties &amp; Limitation of Liability</h2>
            <p className="mt-2">
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Beaky makes no guarantee that any outreach will result in job offers, responses, or interviews. In no event shall Beaky be liable for any indirect, incidental, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section className="border-t border-[#332d2415] pt-6">
            <h2 className="text-base font-bold text-[#171411]">7. Contact Information</h2>
            <p className="mt-2">
              For questions regarding these Terms, contact us at:
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
