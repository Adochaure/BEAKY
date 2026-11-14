export type CandidateProfile = {
  summary: string;
  skills: string[];
  target_roles: string[];
  years_experience: number | null;
  seniority: string;
};

function cleanList(value: unknown, limit: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.replace(/\s+/g, " ").trim().slice(0, maxLength))
    .filter(Boolean))].slice(0, limit);
}

export function normalizeCandidateProfile(value: unknown): CandidateProfile | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const summary = typeof record.summary === "string" ? record.summary.replace(/\s+/g, " ").trim().slice(0, 700) : "";
  const skills = cleanList(record.skills, 30, 80);
  const targetRoles = cleanList(record.target_roles, 10, 100);
  const years = typeof record.years_experience === "number" && Number.isFinite(record.years_experience)
    ? Math.max(0, Math.min(60, record.years_experience))
    : null;
  const seniority = typeof record.seniority === "string" ? record.seniority.trim().slice(0, 80) : "";
  if (!summary && !skills.length && !targetRoles.length) return null;
  return { summary, skills, target_roles: targetRoles, years_experience: years, seniority };
}
