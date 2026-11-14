import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const searches = new Map<string, number[]>();

function limited(address: string) {
  const now = Date.now();
  const recent = (searches.get(address) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 10) {
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

function hunterEmails(value: unknown) {
  if (!value || typeof value !== "object" || !("data" in value)) return [];
  const data = (value as { data?: Record<string, unknown> }).data;
  return Array.isArray(data?.emails) ? data.emails : [];
}

function hunterDomain(value: unknown) {
  if (!value || typeof value !== "object" || !("data" in value)) return "";
  const data = (value as { data?: unknown }).data;
  if (!Array.isArray(data)) return "";
  const candidate = data.find((item) => item && typeof item === "object" && typeof (item as Record<string, unknown>).domain === "string");
  return candidate ? String((candidate as Record<string, unknown>).domain) : "";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError || !data?.claims?.sub) return NextResponse.json({ error: "Sign in to find recruiter emails." }, { status: 401 });

  const address = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(address)) return NextResponse.json({ error: "Too many lookups. Wait a minute and try again." }, { status: 429 });
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Recruiter search is not configured. Add HUNTER_API_KEY on the server, or enter an email manually." }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const company = typeof record.company === "string" ? record.company.trim() : "";
  const jobTitle = typeof record.jobTitle === "string" ? record.jobTitle.replace(/[\r\n\0]/g, " ").trim().slice(0, 200) : "";
  const jobDescription = typeof record.description === "string"
    ? record.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 20_000)
    : "";
  if (company.length < 3 || company.length > 100) return NextResponse.json({ error: "Company name must be between 3 and 100 characters." }, { status: 400 });

  const url = new URL("https://api.hunter.io/v2/domain-search");
  url.searchParams.set("company", company);
  url.searchParams.set("department", "hr");
  url.searchParams.set("type", "personal");
  url.searchParams.set("job_titles", "Recruiter,Talent Acquisition,Technical Recruiter,HR Business Partner");
  url.searchParams.set("limit", "10");
  url.searchParams.set("api_key", apiKey);

  try {
    const fetchHunter = (target: URL) => fetch(target, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    let response = await fetchHunter(url);
    let result: unknown = await response.json();
    let usedDomain = "";

    // Company-name search can return no rows when Hunter cannot resolve the name.
    // Resolve its domain and make one broad fallback search so non-HR-classified
    // talent contacts and generic recruiting addresses can still be suggested.
    if (response.ok && hunterEmails(result).length === 0) {
      const finderUrl = new URL("https://api.hunter.io/v2/domain-finder");
      finderUrl.searchParams.set("company", company);
      finderUrl.searchParams.set("limit", "5");
      finderUrl.searchParams.set("api_key", apiKey);
      const finderResponse = await fetchHunter(finderUrl);
      if (finderResponse.ok) {
        const finderResult: unknown = await finderResponse.json();
        usedDomain = hunterDomain(finderResult);
      }
      if (usedDomain) {
        const fallbackUrl = new URL("https://api.hunter.io/v2/domain-search");
        fallbackUrl.searchParams.set("domain", usedDomain);
        fallbackUrl.searchParams.set("limit", "10");
        fallbackUrl.searchParams.set("api_key", apiKey);
        response = await fetchHunter(fallbackUrl);
        result = await response.json();
      }
    }

    if (!response.ok) {
      const providerError = result && typeof result === "object" && "errors" in result && Array.isArray(result.errors)
        ? result.errors[0] as { id?: unknown; details?: unknown }
        : undefined;
      const providerMessage = typeof providerError?.details === "string" ? providerError.details.slice(0, 160) : "";
      const providerId = typeof providerError?.id === "string" ? providerError.id : "";
      console.error("Hunter recruiter lookup failed:", response.status, providerId, providerMessage);
      if (response.status === 401) return NextResponse.json({ error: "Hunter rejected the API key. Check HUNTER_API_KEY in .env.local and restart the app." }, { status: 502 });
      if (response.status === 403 || response.status === 429) return NextResponse.json({ error: "Hunter denied the lookup because of account access, rate limits, or exhausted search credits. Check the Hunter dashboard and try again later." }, { status: 429 });
      return NextResponse.json({ error: providerMessage ? `Hunter could not run this search: ${providerMessage}` : "Hunter recruiter lookup failed. Try again later." }, { status: 502 });
    }

    const dataBlock = result && typeof result === "object" && "data" in result ? (result as { data?: Record<string, unknown> }).data : undefined;
    const emails = hunterEmails(result);
    const contacts = emails.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const email = (item as Record<string, unknown>).value;
      if (typeof email !== "string" || email.length > 254) return [];
      const raw = item as Record<string, unknown>;
      const name = [raw.first_name, raw.last_name].filter((part): part is string => typeof part === "string").join(" ").trim();
      const title = typeof raw.position === "string" ? raw.position : "";
      const department = typeof raw.department === "string" ? raw.department : "";
      return [{
        email,
        name,
        title,
        department,
        matchType: usedDomain ? (/recruit|talent|human resources|\bhr\b|people|staffing|acquisition/i.test(`${title} ${department}`) ? "recruiter" : "company") : "recruiter",
        confidence: typeof raw.confidence === "number" ? raw.confidence : null,
        verification: raw.verification && typeof raw.verification === "object" && "status" in raw.verification
          ? String((raw.verification as { status: unknown }).status)
          : "unknown",
      }];
    }).sort((left, right) => {
      const relevance = (contact: { title: string; department: string }) => /recruit|talent|human resources|\bhr\b|people|staffing|acquisition/i.test(`${contact.title} ${contact.department}`) ? 1 : 0;
      return relevance(right) - relevance(left);
    }).slice(0, 10);

    const resolvedDomain = typeof dataBlock?.domain === "string" ? dataBlock.domain.toLowerCase() : usedDomain.toLowerCase();
    const listingEmails = [...new Set(jobDescription.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [])]
      .map((email) => email.toLowerCase())
      .filter((email) => Boolean(resolvedDomain) && email.split("@")[1] === resolvedDomain)
      .filter((email) => !contacts.some((contact) => contact.email.toLowerCase() === email))
      .slice(0, 5)
      .map((email) => ({
        email,
        name: "",
        title: jobTitle ? `${jobTitle} · address listed in job post` : "Address listed in job post",
        department: "",
        confidence: null,
        verification: "unverified",
        matchType: "opportunity" as const,
      }));
    contacts.unshift(...listingEmails);

    return NextResponse.json({ contacts, domain: typeof dataBlock?.domain === "string" ? dataBlock.domain : null }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Hunter recruiter lookup request failed:", error);
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Hunter took too long to respond. Try again in a moment." }, { status: 504 });
    }
    return NextResponse.json({ error: "Could not reach the recruiter-search provider." }, { status: 502 });
  }
}
