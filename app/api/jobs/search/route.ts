import { NextRequest, NextResponse } from "next/server";
import { aggregateJobs } from "@/lib/server/job-sources";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError || !data?.claims?.sub) {
    return NextResponse.json({ error: "Sign in to search jobs." }, { status: 401 });
  }

  const incoming = request.nextUrl.searchParams;
  const query = (incoming.get("q") ?? "").trim().slice(0, 120);
  const country = (incoming.get("country") ?? "").trim().slice(0, 60);
  const workplace = (incoming.get("workplace") ?? "all").trim().toLowerCase();
  const highPayOnly = incoming.get("high_pay") === "true";
  const seniority = (incoming.get("seniority") ?? "").trim();
  const employmentType = (incoming.get("employment_type") ?? "").trim();
  const category = (incoming.get("category") ?? "").trim();
  const sort = incoming.get("sort") ?? "recent";
  const page = Math.max(1, Math.min(50, Number.parseInt(incoming.get("page") ?? "1", 10) || 1));
  const pageSize = 20;

  try {
    const jobs = await aggregateJobs({
      query,
      workplace,
      highPayOnly,
      country,
      employmentType,
      seniority,
      category,
    });

    // Sorting
    if (sort === "salary_desc") {
      jobs.sort((a, b) => {
        const valA = (a.maxSalary ?? a.minSalary ?? (a.isHighPay ? 100000 : 0));
        const valB = (b.maxSalary ?? b.minSalary ?? (b.isHighPay ? 100000 : 0));
        return valB - valA;
      });
    } else {
      // Default: Most recent
      jobs.sort((a, b) => b.pubDate - a.pubDate);
    }

    const totalCount = jobs.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = jobs.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      jobs: paginated,
      totalCount,
      page,
      hasMore: startIndex + pageSize < totalCount,
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Job search aggregation error:", error);
    return NextResponse.json({
      error: "Could not aggregate jobs right now. Please try again.",
    }, { status: 502 });
  }
}
