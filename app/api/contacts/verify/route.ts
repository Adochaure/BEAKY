import { resolve4, resolve6, resolveMx } from "node:dns/promises";
import { isIP } from "node:net";
import { createClient } from "@/lib/supabase/server";

type DomainStatus = "mx_found" | "no_mx" | "invalid_domain" | "check_failed";

const attemptsByAddress = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_CHECKS_PER_WINDOW = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isValidDomain(domain: string) {
  if (domain.length > 253 || isIP(domain)) return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  return labels.every((label) =>
    label.length > 0 &&
    label.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
  );
}

async function hasAddressFallback(domain: string) {
  const checks = await Promise.allSettled([resolve4(domain), resolve6(domain)]);
  return checks.some((check) => check.status === "fulfilled" && check.value.length > 0);
}

async function inspectDomain(domain: string): Promise<{ status: DomainStatus; message: string }> {
  if (!isValidDomain(domain)) {
    return { status: "invalid_domain", message: "The email domain is not a valid public domain." };
  }

  try {
    const mxRecords = await resolveMx(domain);
    if (mxRecords.length && !mxRecords.every((record) => record.exchange === ".")) {
      return {
        status: "mx_found",
        message: `${mxRecords.length} mail exchanger${mxRecords.length === 1 ? "" : "s"} found for this domain. This does not confirm the inbox exists.`,
      };
    }
    return { status: "no_mx", message: "The domain publishes a null MX record and does not accept email." };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "NXDOMAIN") {
      return { status: "invalid_domain", message: "This domain could not be found in DNS." };
    }
    if (code === "ENODATA" || code === "NODATA") {
      try {
        if (await hasAddressFallback(domain)) {
          return {
            status: "no_mx",
            message: "No MX record found. The domain has an address record, but mail delivery is not confirmed.",
          };
        }
        return { status: "no_mx", message: "No mail exchanger or address record was found." };
      } catch {
        return { status: "check_failed", message: "DNS lookup could not be completed. Try again later." };
      }
    }
    return { status: "check_failed", message: "DNS lookup could not be completed. Try again later." };
  }
}

function isRateLimited(address: string) {
  const now = Date.now();
  const recent = (attemptsByAddress.get(address) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_CHECKS_PER_WINDOW) {
    attemptsByAddress.set(address, recent);
    return true;
  }
  recent.push(now);
  attemptsByAddress.set(address, recent);
  for (const [key, times] of attemptsByAddress) {
    if (!times.some((time) => now - time < WINDOW_MS)) attemptsByAddress.delete(key);
  }
  return false;
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return json({ error: "Contact checks are not configured yet." }, 503);
  }
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims?.sub) {
    return json({ error: "Sign in to check a recruiter email." }, 401);
  }

  const address =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  if (isRateLimited(address)) {
    return json({ error: "Too many checks. Wait a minute and try again." }, 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send a valid JSON request." }, 400);
  }
  if (!body || typeof body !== "object" || !("email" in body)) {
    return json({ error: "An email address is required." }, 400);
  }

  const email = String((body as { email: unknown }).email).trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }

  const domain = email.slice(email.lastIndexOf("@") + 1);
  const result = await inspectDomain(domain);
  return json({ email, domain, ...result });
}
