export type WorkplaceType = "Remote" | "Hybrid" | "Onsite";

export type NormalizedJob = {
  guid: string;
  title: string;
  companyName: string;
  excerpt: string;
  description: string;
  employmentType: string;
  seniority: string;
  workplaceType: WorkplaceType;
  locationRestrictions: string[];
  categories: string[];
  minSalary: number | null;
  maxSalary: number | null;
  salaryPeriod: "annual" | "monthly" | "hourly";
  currency: string;
  salaryLabel: string;
  isHighPay: boolean;
  pubDate: number;
  applicationLink: string;
  source: string;
};

// Curated high-pay, hybrid, onsite, internship, and fellowship roles for reliable hackathon demo
const CURATED_ROLES: NormalizedJob[] = [
  {
    guid: "curated-001",
    title: "Senior AI / Machine Learning Engineer",
    companyName: "Anthropic",
    excerpt: "Build next-generation AI alignment infrastructure, large-scale training clusters, and RLHF evaluation systems.",
    description: "Anthropic is looking for a Senior AI / ML Engineer to join our safety and capability evaluation team. You will design distributed training pipelines, evaluate frontier models with real-world workloads, and implement high-throughput inference endpoints. Requirements: Strong Python/PyTorch, distributed systems (Ray/Deepspeed), CUDA optimization, and experience with transformer architectures.",
    employmentType: "Full Time",
    seniority: "Senior",
    workplaceType: "Hybrid",
    locationRestrictions: ["San Francisco, CA", "Hybrid (3 days in office)"],
    categories: ["Artificial Intelligence", "Machine Learning", "Python", "PyTorch", "Distributed Systems"],
    minSalary: 280000,
    maxSalary: 385000,
    salaryPeriod: "annual",
    currency: "USD",
    salaryLabel: "USD 280,000–385,000 / yr",
    isHighPay: true,
    pubDate: Math.floor(Date.now() / 1000) - 3600 * 4,
    applicationLink: "https://www.anthropic.com/careers",
    source: "Anthropic Careers",
  },
  {
    guid: "curated-002",
    title: "Staff Backend Infrastructure Engineer",
    companyName: "Stripe",
    excerpt: "Architect high-availability ledger databases and global money routing systems with nine-nines reliability.",
    description: "At Stripe, our infrastructure processes hundreds of billions of dollars per year. As a Staff Backend Engineer, you will own distributed storage partitions, event sourcing engines, and high-performance Go/Java services across multi-region AWS footprints. Requirements: 6+ years in distributed systems, SQL internals, Kafka/gRPC, and high-concurrency payment services.",
    employmentType: "Full Time",
    seniority: "Staff",
    workplaceType: "Remote",
    locationRestrictions: ["United States", "Canada", "Remote Worldwide"],
    categories: ["Backend Development", "Go", "Distributed Systems", "PostgreSQL", "Kafka"],
    minSalary: 240000,
    maxSalary: 340000,
    salaryPeriod: "annual",
    currency: "USD",
    salaryLabel: "USD 240,000–340,000 / yr",
    isHighPay: true,
    pubDate: Math.floor(Date.now() / 1000) - 3600 * 8,
    applicationLink: "https://stripe.com/jobs",
    source: "Stripe Careers",
  },
  {
    guid: "curated-003",
    title: "Lead Full Stack Platform Engineer",
    companyName: "Razorpay",
    excerpt: "Lead the developer platform and checkout experience powering 10M+ businesses across India and SE Asia.",
    description: "Join Razorpay's Core Checkout Platform in Bengaluru. You will lead a high-output engineering pod building next-generation payment gateways, real-time fraud scoring webhooks, and modern React/Next.js checkout surfaces. Tech stack: Go, TypeScript, React, Kafka, Redis, Kubernetes. Compensation is top of market with generous ESOPs.",
    employmentType: "Full Time",
    seniority: "Senior",
    workplaceType: "Hybrid",
    locationRestrictions: ["Bengaluru, India", "Hybrid (2 days remote)"],
    categories: ["Full Stack Development", "TypeScript", "React", "Go", "Fintech"],
    minSalary: 4500000,
    maxSalary: 7500000,
    salaryPeriod: "annual",
    currency: "INR",
    salaryLabel: "INR 45,00,000–75,00,000 / yr",
    isHighPay: true,
    pubDate: Math.floor(Date.now() / 1000) - 3600 * 12,
    applicationLink: "https://razorpay.com/jobs",
    source: "Razorpay Careers",
  },
  {
    guid: "curated-004",
    title: "Software Engineering Intern (Summer 2027)",
    companyName: "Google",
    excerpt: "Work alongside Google engineers on Search, Cloud, DeepMind, or Android. 12-week high-impact internship.",
    description: "Google Software Engineering Interns are directly embedded into production teams working on core products. You will design, build, and test features deployed to billions of users worldwide. Requirements: Currently pursuing a BS/MS/PhD in Computer Science or related STEM field. Proficiency in C++, Java, Python, or Go, and strong algorithms fundamentals.",
    employmentType: "Intern",
    seniority: "Entry-level",
    workplaceType: "Onsite",
    locationRestrictions: ["Bengaluru / Hyderabad, India", "Mountain View, CA", "Onsite"],
    categories: ["Software Engineering", "Algorithms", "C++", "Python", "Google Cloud"],
    minSalary: 125000,
    maxSalary: 160000,
    salaryPeriod: "monthly",
    currency: "INR",
    salaryLabel: "INR 1,25,000–1,60,000 / mo + Housing",
    isHighPay: true,
    pubDate: Math.floor(Date.now() / 1000) - 3600 * 18,
    applicationLink: "https://careers.google.com/students",
    source: "Google Careers",
  },
  {
    guid: "curated-005",
    title: "AI Research & Alignment Fellow",
    companyName: "OpenAI Research",
    excerpt: "Intensive 6-month research fellowship focusing on neural interpretability, RLHF, and agent safety.",
    description: "OpenAI Research Fellowship is designed for exceptional researchers, graduate students, and independent builders. Fellows work with primary researchers on model evaluations, steering vectors, synthetic data generation, and autonomous code execution benchmarks. Includes full compute budget, competitive stipend, and direct path to Member of Technical Staff.",
    employmentType: "Fellowship",
    seniority: "Entry-level",
    workplaceType: "Onsite",
    locationRestrictions: ["San Francisco, CA", "Onsite"],
    categories: ["Artificial Intelligence", "Machine Learning", "Research", "PyTorch", "LLMs"],
    minSalary: 15000,
    maxSalary: 20000,
    salaryPeriod: "monthly",
    currency: "USD",
    salaryLabel: "USD 15,000–20,000 / mo + Compute Grant",
    isHighPay: true,
    pubDate: Math.floor(Date.now() / 1000) - 3600 * 24,
    applicationLink: "https://openai.com/careers",
    source: "OpenAI Careers",
  },
  {
    guid: "curated-006",
    title: "Senior Frontend Architect (Next.js / React)",
    companyName: "Vercel",
    excerpt: "Help build the next generation of web development tooling, Next.js runtime, and Vercel dashboard.",
    description: "Vercel is looking for a Senior Frontend Architect to shape the frontend developer experience. You will collaborate with framework authors, optimize web vitals for millions of sites, and build high-performance collaborative UI components. Strong expertise in TypeScript, React Server Components, Turbopack, and CSS architecture required.",
    employmentType: "Full Time",
    seniority: "Senior",
    workplaceType: "Remote",
    locationRestrictions: ["Worldwide Remote", "Global"],
    categories: ["Frontend Development", "Next.js", "React", "TypeScript", "Tailwind CSS"],
    minSalary: 195000,
    maxSalary: 285000,
    salaryPeriod: "annual",
    currency: "USD",
    salaryLabel: "USD 195,000–285,000 / yr",
    isHighPay: true,
    pubDate: Math.floor(Date.now() / 1000) - 3600 * 30,
    applicationLink: "https://vercel.com/careers",
    source: "Vercel Careers",
  },
  {
    guid: "curated-007",
    title: "Product Engineering Intern",
    companyName: "Zepto",
    excerpt: "Build 10-minute grocery delivery dispatch algorithms, rider telematics, and high-concurrency microservices.",
    description: "Zepto is India's fastest-growing quick-commerce tech company. As an Engineering Intern in our Mumbai or Bengaluru campus, you will ship code into production from week one. Work on routing graphs, real-time inventory locking, and high-speed Node.js/Go services. High conversion rate to full-time SDE-1.",
    employmentType: "Intern",
    seniority: "Entry-level",
    workplaceType: "Onsite",
    locationRestrictions: ["Mumbai / Bengaluru, India", "Onsite"],
    categories: ["Software Engineering", "Node.js", "Go", "PostgreSQL", "Quick Commerce"],
    minSalary: 60000,
    maxSalary: 90000,
    salaryPeriod: "monthly",
    currency: "INR",
    salaryLabel: "INR 60,000–90,000 / mo",
    isHighPay: true,
    pubDate: Math.floor(Date.now() / 1000) - 3600 * 36,
    applicationLink: "https://zepto.com/careers",
    source: "Zepto Careers",
  },
  {
    guid: "curated-008",
    title: "Senior DevOps & Cloud Security Engineer",
    companyName: "Datadog",
    excerpt: "Scale multi-cloud Kubernetes clusters processing tens of petabytes of telemetry daily.",
    description: "Datadog is hiring a Senior Cloud Engineer to manage massive multi-region AWS and GCP deployments. You will automate infrastructure using Terraform, implement zero-trust Kubernetes network policies, and build automated chaos engineering drills. Experience with eBPF, Cilium, Vault, and large-scale Kafka clusters is highly valued.",
    employmentType: "Full Time",
    seniority: "Senior",
    workplaceType: "Hybrid",
    locationRestrictions: ["New York, NY", "Hybrid (2 days office)"],
    categories: ["DevOps", "Cloud Computing", "Kubernetes", "AWS", "Terraform", "Security"],
    minSalary: 210000,
    maxSalary: 295000,
    salaryPeriod: "annual",
    currency: "USD",
    salaryLabel: "USD 210,000–295,000 / yr",
    isHighPay: true,
    pubDate: Math.floor(Date.now() / 1000) - 3600 * 40,
    applicationLink: "https://careers.datadoghq.com",
    source: "Datadog Careers",
  },
  {
    guid: "curated-009",
    title: "Founding Engineer (Autonomous Agents)",
    companyName: "Cognition AI",
    excerpt: "Build next-generation autonomous software engineering agents and interactive developer tooling.",
    description: "Work on the frontier of AI reasoning, program synthesis, and autonomous coding agents. You will design agent execution sandboxes, language model fine-tuning recipes, and real-time AST manipulation engines. Requires world-class coding ability, competitive programming or open-source credentials, and passion for AI systems.",
    employmentType: "Full Time",
    seniority: "Lead",
    workplaceType: "Onsite",
    locationRestrictions: ["San Francisco, CA", "Onsite"],
    categories: ["Artificial Intelligence", "Autonomous Agents", "Python", "TypeScript", "Systems"],
    minSalary: 250000,
    maxSalary: 420000,
    salaryPeriod: "annual",
    currency: "USD",
    salaryLabel: "USD 250,000–420,000 / yr + 1% Equity",
    isHighPay: true,
    pubDate: Math.floor(Date.now() / 1000) - 3600 * 48,
    applicationLink: "https://cognition.ai/careers",
    source: "Cognition AI",
  },
  {
    guid: "curated-010",
    title: "Data Science & Growth Fellowship",
    companyName: "Emergent Ventures",
    excerpt: "Non-dilutive fellowship grant ($10k-$50k) for ambitious builders, ML researchers, and founders.",
    description: "The Emergent Ventures Fellowship by Tyler Cowen supports high-agency builders working on moonshot ideas across AI, synthetic biology, open-source software, and public infrastructure. Fellows receive direct grant funding, unconstrained compute, and mentorship from top technologists and venture partners worldwide.",
    employmentType: "Fellowship",
    seniority: "Entry-level",
    workplaceType: "Remote",
    locationRestrictions: ["Global", "India / US / Europe / Worldwide"],
    categories: ["Fellowship", "Artificial Intelligence", "Data Science", "Research"],
    minSalary: 10000,
    maxSalary: 50000,
    salaryPeriod: "annual",
    currency: "USD",
    salaryLabel: "USD 10,000–50,000 Unrestricted Grant",
    isHighPay: true,
    pubDate: Math.floor(Date.now() / 1000) - 3600 * 52,
    applicationLink: "https://www.mercatus.org/emergent-ventures",
    source: "Emergent Ventures",
  },
  {
    guid: "curated-011",
    title: "Backend Engineer - Platform & Payments",
    companyName: "Swiggy",
    excerpt: "Build resilient order dispatch and real-time delivery tracking systems handling millions of orders a day.",
    description: "Swiggy's Consumer Tech team is hiring Backend Engineers in Bengaluru and Gurgaon. You will build high-throughput microservices in Go and Java, architect event-driven architectures with Apache Kafka, and scale high-performance Redis caching clusters. Hybrid 3 days office in Bengaluru campus.",
    employmentType: "Full Time",
    seniority: "Mid-level",
    workplaceType: "Hybrid",
    locationRestrictions: ["Bengaluru / Gurgaon, India", "Hybrid"],
    categories: ["Backend Development", "Go", "Java", "Kafka", "Microservices"],
    minSalary: 2800000,
    maxSalary: 4200000,
    salaryPeriod: "annual",
    currency: "INR",
    salaryLabel: "INR 28,00,000–42,00,000 / yr",
    isHighPay: true,
    pubDate: Math.floor(Date.now() / 1000) - 3600 * 60,
    applicationLink: "https://careers.swiggy.com",
    source: "Swiggy Careers",
  },
  {
    guid: "curated-012",
    title: "Junior Full Stack Developer",
    companyName: "Postman",
    excerpt: "Create developer-loved API testing tools, workspace collaboration, and visual documentation generators.",
    description: "Postman is hiring Full Stack Engineers in Bengaluru. Work on the core web platform and desktop clients used by 30M+ developers worldwide. Tech stack: TypeScript, React, Node.js, WebSockets, Electron, and AWS.",
    employmentType: "Full Time",
    seniority: "Entry-level",
    workplaceType: "Hybrid",
    locationRestrictions: ["Bengaluru, India", "Hybrid"],
    categories: ["Full Stack Development", "TypeScript", "React", "Node.js", "APIs"],
    minSalary: 1800000,
    maxSalary: 2800000,
    salaryPeriod: "annual",
    currency: "INR",
    salaryLabel: "INR 18,00,000–28,00,000 / yr",
    isHighPay: false,
    pubDate: Math.floor(Date.now() / 1000) - 3600 * 72,
    applicationLink: "https://www.postman.com/company/careers",
    source: "Postman Careers",
  },
];

export async function fetchArbeitnowJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !Array.isArray(data.data)) return [];

    return data.data.slice(0, 35).map((item: Record<string, unknown>, index: number) => {
      const isRemote = item.remote === true;
      const location = typeof item.location === "string" && item.location.trim() ? item.location.trim() : (isRemote ? "Remote Worldwide" : "Onsite");
      const title = String(item.title || "Software Engineer").slice(0, 200);
      const company = String(item.company_name || "Tech Company").slice(0, 200);
      const tags = Array.isArray(item.tags) ? item.tags.map(String) : [];
      const description = typeof item.description === "string" ? item.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
      
      const workplaceType: WorkplaceType = isRemote
        ? "Remote"
        : location.toLowerCase().includes("hybrid")
          ? "Hybrid"
          : "Onsite";

      return {
        guid: `arbeitnow-${String(item.slug || index)}`,
        title,
        companyName: company,
        excerpt: description.slice(0, 280) || `Open role at ${company} in ${location}.`,
        description: description.slice(0, 8000),
        employmentType: Array.isArray(item.job_types) && item.job_types[0] ? String(item.job_types[0]) : "Full Time",
        seniority: /senior|lead|principal|staff/i.test(title) ? "Senior" : /junior|intern|graduate/i.test(title) ? "Entry-level" : "Mid-level",
        workplaceType,
        locationRestrictions: [location],
        categories: tags.length ? tags.slice(0, 5) : ["Technology", "Engineering"],
        minSalary: null,
        maxSalary: null,
        salaryPeriod: "annual",
        currency: "EUR",
        salaryLabel: "Competitive / Market Standard",
        isHighPay: /lead|staff|principal|senior/i.test(title),
        pubDate: typeof item.created_at === "number" ? item.created_at : Math.floor(Date.now() / 1000) - index * 7200,
        applicationLink: typeof item.url === "string" ? item.url : "https://www.arbeitnow.com",
        source: "Arbeitnow Job Board",
      };
    });
  } catch (err) {
    console.warn("Could not fetch Arbeitnow jobs:", err);
    return [];
  }
}

export async function fetchHimalayasJobs(query = ""): Promise<NormalizedJob[]> {
  try {
    const params = new URLSearchParams({ sort: "recent" });
    if (query) params.set("q", query);
    const res = await fetch(`https://himalayas.app/jobs/api/search?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        ...(process.env.HIMALAYAS_API_KEY ? { Authorization: `Bearer ${process.env.HIMALAYAS_API_KEY}` } : {}),
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !Array.isArray(data.jobs)) return [];

    return data.jobs.slice(0, 25).map((item: Record<string, unknown>) => {
      const minSal = typeof item.minSalary === "number" ? item.minSalary : null;
      const maxSal = typeof item.maxSalary === "number" ? item.maxSalary : null;
      const period = typeof item.salaryPeriod === "string" ? item.salaryPeriod as "annual" | "monthly" | "hourly" : "annual";
      const currency = typeof item.currency === "string" ? item.currency : "USD";
      const isHigh = Boolean(maxSal && maxSal >= 120000 && currency === "USD");
      
      let salaryLabel = "Salary not listed";
      if (minSal || maxSal) {
        const parts = [minSal, maxSal].filter(Boolean).map(v => new Intl.NumberFormat("en").format(v as number));
        salaryLabel = `${currency} ${parts.join("–")} / ${period}`;
      }

      const locations = Array.isArray(item.locationRestrictions) ? item.locationRestrictions.map(String) : ["Remote Worldwide"];

      return {
        guid: String(item.guid || Math.random()),
        title: String(item.title || "Software Engineer"),
        companyName: String(item.companyName || "Remote Company"),
        excerpt: typeof item.excerpt === "string" ? item.excerpt.replace(/<[^>]*>/g, "").slice(0, 280) : "",
        description: typeof item.description === "string" ? item.description.replace(/<[^>]*>/g, " ").slice(0, 8000) : "",
        employmentType: String(item.employmentType || "Full Time"),
        seniority: String(item.seniority || "Mid-level"),
        workplaceType: "Remote" as WorkplaceType,
        locationRestrictions: locations,
        categories: Array.isArray(item.categories) ? item.categories.map(String).slice(0, 4) : ["Technology"],
        minSalary: minSal,
        maxSalary: maxSal,
        salaryPeriod: period,
        currency,
        salaryLabel,
        isHighPay: isHigh,
        pubDate: typeof item.pubDate === "number" ? item.pubDate : Math.floor(Date.now() / 1000),
        applicationLink: String(item.applicationLink || "https://himalayas.app"),
        source: "Himalayas Remote",
      };
    });
  } catch (err) {
    console.warn("Could not fetch Himalayas jobs:", err);
    return [];
  }
}

export async function aggregateJobs({
  query = "",
  workplace = "all",
  highPayOnly = false,
  country = "",
  employmentType = "",
  seniority = "",
  category = "",
}: {
  query?: string;
  workplace?: string;
  highPayOnly?: boolean;
  country?: string;
  employmentType?: string;
  seniority?: string;
  category?: string;
}): Promise<NormalizedJob[]> {
  const [liveHimalayas, liveArbeitnow] = await Promise.all([
    fetchHimalayasJobs(query),
    fetchArbeitnowJobs(),
  ]);

  // Combine curated high-pay & internship roles with live remote and onsite API feeds
  const all = [...CURATED_ROLES, ...liveHimalayas, ...liveArbeitnow];

  // Deduplicate by company + title
  const seen = new Set<string>();
  const deduplicated: NormalizedJob[] = [];
  for (const job of all) {
    const key = `${job.companyName.toLowerCase().trim()}|${job.title.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(job);
    }
  }

  // Filter pipeline
  const qClean = query.toLowerCase().trim();
  const countryClean = country.toLowerCase().trim();
  const workplaceClean = workplace.toLowerCase().trim();
  const typesList = employmentType ? employmentType.split(",").map(t => t.trim().toLowerCase()) : [];
  const seniorityList = seniority ? seniority.split(",").map(s => s.trim().toLowerCase()) : [];
  const categoriesList = category ? category.split(",").map(c => c.trim().toLowerCase()).filter(Boolean) : [];

  return deduplicated.filter(job => {
    // Search query filter
    if (qClean) {
      const hay = [
        job.title,
        job.companyName,
        job.excerpt,
        job.description,
        ...job.categories,
        ...job.locationRestrictions,
      ].join(" ").toLowerCase();
      const matchKeywords = qClean.split(/\s+/).every(word => hay.includes(word));
      if (!matchKeywords) return false;
    }

    // Workplace mode filter: Remote, Hybrid, Onsite
    if (workplaceClean && workplaceClean !== "all") {
      if (job.workplaceType.toLowerCase() !== workplaceClean) {
        return false;
      }
    }

    // High Pay filter
    if (highPayOnly && !job.isHighPay) {
      return false;
    }

    // Location / Country filter
    if (countryClean && countryClean !== "worldwide" && countryClean !== "remote") {
      const locString = job.locationRestrictions.join(" ").toLowerCase();
      if (!locString.includes(countryClean)) {
        return false;
      }
    }

    // Employment type filter
    if (typesList.length > 0) {
      const matchType = typesList.some(t => job.employmentType.toLowerCase().includes(t));
      if (!matchType) return false;
    }

    // Seniority filter
    if (seniorityList.length > 0) {
      const matchSen = seniorityList.some(s => job.seniority.toLowerCase().includes(s));
      if (!matchSen) return false;
    }

    // Category / Industry filter
    if (categoriesList.length > 0) {
      const jobCats = job.categories.map(c => c.toLowerCase());
      const jobText = (job.title + " " + job.excerpt).toLowerCase();
      const matchCat = categoriesList.some(c => jobCats.some(tag => tag.includes(c)) || jobText.includes(c));
      if (!matchCat) return false;
    }

    return true;
  });
}
