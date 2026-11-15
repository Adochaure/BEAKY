import dns from "node:dns/promises";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const searches = new Map<string, number[]>();

function limited(address: string) {
  const now = Date.now();
  const recent = (searches.get(address) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 30) {
    searches.set(address, recent);
    return true;
  }
  recent.push(now);
  searches.set(address, recent);
  for (const [key, times] of searches) {
    if (!times.some((time) => now - time < 60_000)) searches.delete(key);
  }
  return false;
}

// Check if a domain has active MX records before suggesting an email to prevent bounces
async function hasActiveMx(domain: string): Promise<boolean> {
  const clean = domain.trim().toLowerCase();
  if (!clean || !clean.includes(".")) return false;
  try {
    const mx = await dns.resolveMx(clean);
    return Boolean(mx && mx.length > 0);
  } catch {
    return false;
  }
}

function extractDomainFromUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();

    // ATS portals that embed company slug in pathname
    if (host.includes("greenhouse.io") || host.includes("lever.co") || host.includes("ashbyhq.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] && parts[0].length > 1 && !["view", "jobs", "apply", "embed"].includes(parts[0])) {
        return `${parts[0].replace(/[^a-z0-9]/g, "")}.com`;
      }
    }
    // Direct company sites
    if (
      !host.includes("arbeitnow.com") &&
      !host.includes("himalayas.app") &&
      !host.includes("indeed.com") &&
      !host.includes("linkedin.com") &&
      !host.includes("google.com")
    ) {
      return host.replace(/^www\./, "").replace(/^careers\./, "").replace(/^jobs\./, "");
    }
  } catch {
    // Ignore invalid url
  }
  return null;
}

function guessDomain(company: string): string {
  const clean = company.toLowerCase()
    .replace(/\b(inc|corp|ltd|pvt|llc|gmbh|technologies|solutions|co|group|software)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
  return clean ? `${clean}.com` : "company.com";
}

export type DiscoveredContact = {
  email: string;
  name: string;
  title: string;
  department?: string;
  confidence: number | null;
  verification: "verified" | "hunter_indexed" | "inferred_pattern";
  matchType: "opportunity" | "recruiter" | "company";
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError || !data?.claims?.sub) {
    return NextResponse.json({ error: "Sign in to find recruiter emails." }, { status: 401 });
  }

  const address = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(address)) {
    return NextResponse.json({ error: "Too many lookups. Wait a minute and try again." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const company = typeof record.company === "string" ? record.company.trim() : "";
  const jobTitle = typeof record.jobTitle === "string" ? record.jobTitle.replace(/[\r\n\0]/g, " ").trim().slice(0, 200) : "";
  const jobDescription = typeof record.description === "string"
    ? record.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 20_000)
    : "";
  const applicationLink = typeof record.applicationLink === "string" ? record.applicationLink.trim() : "";

  if (company.length < 1 || company.length > 120) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }

  const contacts: DiscoveredContact[] = [];

  // 1. Direct Job Posting Contact Extraction (100% highest accuracy)
  const listingEmails = [...new Set(jobDescription.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [])]
    .map((e) => e.toLowerCase())
    .filter((e) => !e.includes("support@") && !e.includes("sales@") && !e.includes("privacy@") && !e.includes("abuse@"))
    .slice(0, 2);

  for (const email of listingEmails) {
    const domain = email.split("@")[1];
    const mxOk = await hasActiveMx(domain);
    if (mxOk) {
      contacts.push({
        email,
        name: `${company} Hiring Lead`,
        title: jobTitle ? `${jobTitle} · Direct Post Contact` : "Job Posting Contact",
        department: "Talent Acquisition",
        confidence: 98,
        verification: "verified",
        matchType: "opportunity",
      });
    }
  }

  // 2. Resolve true company domain
  let resolvedDomain = extractDomainFromUrl(applicationLink);

  // 3. Hunter API domain search for real human talent partners & recruiters
  const apiKey = process.env.HUNTER_API_KEY;
  if (apiKey && apiKey.length > 5) {
    try {
      const url = new URL("https://api.hunter.io/v2/domain-search");
      if (resolvedDomain) {
        url.searchParams.set("domain", resolvedDomain);
      } else {
        url.searchParams.set("company", company);
      }
      url.searchParams.set("limit", "10");
      url.searchParams.set("api_key", apiKey);

      const hunterRes = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(6_000),
      });

      if (hunterRes.ok) {
        const result = await hunterRes.json();
        const data = result && typeof result === "object" && "data" in result ? (result.data as Record<string, unknown>) : undefined;
        if (typeof data?.domain === "string" && data.domain) {
          resolvedDomain = data.domain.toLowerCase();
        }

        const emails = Array.isArray(data?.emails) ? (data.emails as Array<Record<string, unknown>>) : [];
        for (const item of emails) {
          const emailVal = typeof item?.value === "string" ? item.value.toLowerCase().trim() : "";
          if (!emailVal || contacts.some((c) => c.email.toLowerCase() === emailVal)) continue;

          const firstName = typeof item.first_name === "string" ? item.first_name : "";
          const lastName = typeof item.last_name === "string" ? item.last_name : "";
          const name = [firstName, lastName].filter(Boolean).join(" ").trim() || `${company} Talent Team`;
          const title = typeof item.position === "string" ? item.position : "Talent Partner";
          const department = typeof item.department === "string" ? item.department : "Human Resources";
          const confidence = typeof item.confidence === "number" ? item.confidence : 80;
          const status = (item.verification as Record<string, unknown>)?.status;
          const isVerified = status === "valid" || confidence >= 85;

          // Score priority: HR / Talent / Recruiting / Leadership > other
          const isTalent = /recruit|talent|people|hiring|hr|staffing/i.test(`${title} ${department}`);
          const isLead = /lead|director|head|vp|manager|founder|chief/i.test(title);

          contacts.push({
            email: emailVal,
            name,
            title,
            department,
            confidence: isTalent ? 95 : isLead ? 90 : isVerified ? 85 : confidence,
            verification: isVerified ? "verified" : "hunter_indexed",
            matchType: "recruiter",
          });
        }
      }
    } catch (err) {
      console.warn("Hunter lookup skipped or timed out:", err);
    }
  }

  // 4. Fallback domain determination if Hunter did not return a domain
  if (!resolvedDomain) {
    resolvedDomain = guessDomain(company);
  }

  // 5. MX check on the resolved domain
  const domainHasMx = await hasActiveMx(resolvedDomain);

  // 6. Only provide an inferred pattern if:
  // - MX records genuinely exist for this domain
  // - We have fewer than 2 contacts from Hunter / direct listing
  // And explicitly mark it as "inferred_pattern" (NEVER fake "verified")
  if (contacts.length < 2 && domainHasMx) {
    const safeCompanyPrefix = "careers";
    const patternEmail = `${safeCompanyPrefix}@${resolvedDomain}`.toLowerCase();
    if (!contacts.some((c) => c.email.toLowerCase() === patternEmail)) {
      contacts.push({
        email: patternEmail,
        name: `${company} Careers & Talent`,
        title: "Company Inbound Careers Inbox",
        department: "Talent Acquisition",
        confidence: 45,
        verification: "inferred_pattern",
        matchType: "company",
      });
    }
  }

  // Sort by confidence: Highest deliverable confidence first
  contacts.sort((a, b) => (b.confidence ?? 50) - (a.confidence ?? 50));

  return NextResponse.json({
    contacts: contacts.slice(0, 6),
    domain: resolvedDomain,
    domainDeliverable: domainHasMx,
    hasVerifiedContact: contacts.some((c) => c.verification === "verified"),
    applicationLink: applicationLink || null,
  }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
