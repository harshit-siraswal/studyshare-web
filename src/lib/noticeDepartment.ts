import type { Notice } from "@/lib/api";

const ACADEMIC_CODES = new Set([
  "cse",
  "it",
  "cse_ai",
  "aiml",
  "ds",
  "cse_cs",
  "ece",
  "ece_vlsi",
  "elce",
  "eee",
  "me",
  "amia",
  "ce",
]);

const RULES: Array<{ code: string; pattern: RegExp }> = [
  { code: "hackathons", pattern: /\bhackathon\b|\bcompetition\b|\bcontest\b/i },
  { code: "ir", pattern: /international\s+relations|\bir\s*cell\b/i },
  { code: "pr", pattern: /public\s+relations|\bpr\s*cell\b/i },
  { code: "clubs", pattern: /\bclub\b|\bclubs\b|\bsociet(?:y|ies)\b/i },
  { code: "placements", pattern: /\bplacement\b|\bplacements\b/i },
  { code: "internships", pattern: /\binternship\b|\binternships\b/i },
  { code: "events", pattern: /\bevent\b|\bseminar\b|\bwebinar\b|\bworkshop\b|\bupsc\b|career\s+counsel+ing|career\s+counselling|\bcrpc\b|drishti\s+ias/i },
  { code: "examinations", pattern: /\bexam\b|\bexamination\b|\bassessment\b/i },
  { code: "scholarships", pattern: /\bscholarship\b|financial\s+aid|fee\s+waiver/i },
  { code: "admissions", pattern: /\badmission\b|\benrol+ment\b|\benrollment\b/i },
  { code: "training", pattern: /\btraining\b|\bcertification\b/i },
];

export function inferNoticeDepartmentFromContent(notice: Pick<Notice, "title" | "content">): string | null {
  const text = `${notice.title || ""} ${notice.content || ""}`.trim();
  if (!text) return null;

  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      return rule.code;
    }
  }

  return null;
}

export function getEffectiveNoticeDepartment(notice: Pick<Notice, "department" | "title" | "content">): string {
  const current = String(notice.department || "general").trim().toLowerCase();
  const inferred = inferNoticeDepartmentFromContent(notice);

  if (!current) {
    return inferred || "general";
  }

  if (inferred && ACADEMIC_CODES.has(current) && inferred !== current) {
    return inferred;
  }

  return current;
}
