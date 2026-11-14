import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const API_BASE = "https://himalayas.app/jobs/api/search";
const searchesByAddress = new Map<string, number[]>();

function isRateLimited(address: string) {
  const now = Date.now();
  const recent = (searchesByAddress.get(address) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 20) {
    searchesByAddress.set(address, recent);
    return true;
  }
  recent.push(now);
  searchesByAddress.set(address, recent);
  for (const [key, times] of searchesByAddress) {
    if (!times.some((time) => now - time < 60_000)) searchesByAddress.delete(key);
  }
  return false;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError || !data?.claims?.sub) {
    return NextResponse.json({ error: "Sign in to search jobs." }, { status: 401 });
  }

  const address = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isRateLimited(address)) {
    return NextResponse.json({ error: "Too many job searches. Wait a minute and try again." }, { status: 429 });
  }

  const incoming = request.nextUrl.searchParams;
  const query = (incoming.get("q") ?? "").trim().slice(0, 120);
  const country = (incoming.get("country") ?? "").trim().slice(0, 60);
  const worldwide = incoming.get("worldwide") === "true";
  const seniority = [...new Set((incoming.get("seniority") ?? "").split(",").map((value) => value.trim()).filter((value) => ["Entry-level", "Mid-level", "Senior", "Manager", "Director", "Executive"].includes(value)))];
  const employmentType = [...new Set((incoming.get("employment_type") ?? "").split(",").map((value) => value.trim()).filter((value) => ["Full Time", "Part Time", "Contractor", "Temporary", "Intern", "Volunteer", "Other"].includes(value)))];
  const page = Math.max(1, Math.min(50, Number.parseInt(incoming.get("page") ?? "1", 10) || 1));
  const params = new URLSearchParams({ sort: "recent", page: String(page) });
  if (query) params.set("q", query);
  if (country && country.toLowerCase() !== "worldwide" && country.toLowerCase() !== "remote") params.set("country", country);
  if (country.toLowerCase() === "worldwide" || worldwide) params.set("worldwide", "true");
  if (seniority.length) params.set("seniority", seniority.join(","));
  if (employmentType.length) params.set("employment_type", employmentType.join(","));

  try {
    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        ...(process.env.HIMALAYAS_API_KEY ? { Authorization: `Bearer ${process.env.HIMALAYAS_API_KEY}` } : {}),
      },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) {
      const retryAfter = response.headers.get("retry-after");
      if (response.status === 429) {
        return NextResponse.json(
          { error: `The job source is busy. Try again${retryAfter ? ` in ${retryAfter} seconds` : " in a minute"}.` },
          { status: 429, headers: { "Cache-Control": "no-store" } },
        );
      }
      console.error("Himalayas job search failed:", response.status);
      return NextResponse.json({ error: "The job source could not be reached. Try again shortly." }, { status: 502 });
    }

    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("jobs" in result) || !Array.isArray(result.jobs)) {
      return NextResponse.json({ error: "The job source returned an unexpected response." }, { status: 502 });
    }
    const jobs = result.jobs.filter((job) => {
      if (!job || typeof job !== "object") return false;
      const item = job as Record<string, unknown>;
      return typeof item.guid === "string" && typeof item.title === "string" &&
        typeof item.companyName === "string" && typeof item.applicationLink === "string" &&
        typeof item.pubDate === "number" && (!item.expiryDate || typeof item.expiryDate !== "number" || item.expiryDate * 1000 > Date.now());
    });

    return NextResponse.json({ jobs, totalCount: "totalCount" in result ? result.totalCount : jobs.length }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Himalayas job search request failed:", error);
    return NextResponse.json({ error: "Could not search jobs right now. Check your connection and try again." }, { status: 502 });
  }
}
