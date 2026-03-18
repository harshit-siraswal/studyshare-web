import type { ElementType } from "react";
import {
  LayoutGrid,
  Cpu,
  Zap,
  Cog,
  Building2,
  PlugZap,
  Bot,
  Database,
  Globe,
} from "lucide-react";
import { BRANCH_OPTIONS } from "./academicSubjects";

export type DepartmentMeta = { value: string; label: string; icon: ElementType };

const ICON_MAP: Record<string, ElementType> = {
  cse: Cpu,
  it: Globe,
  cse_ai: Bot,
  aiml: Bot,
  ds: Database,
  cse_cs: Cpu,
  ece: Zap,
  ece_vlsi: Zap,
  elce: PlugZap,
  eee: PlugZap,
  me: Cog,
  amia: Cog,
  ce: Building2,
};

const SHORT_LABELS: Record<string, string> = {
  cse: "Computer Science",
  it: "Information Technology",
  cse_ai: "CSE (AI)",
  aiml: "CSE (AI & ML)",
  ds: "CSE (Data Science)",
  cse_cs: "CSE (Cyber Security)",
  ece: "Electronics",
  ece_vlsi: "ECE (VLSI)",
  elce: "ELCE",
  eee: "Electrical",
  me: "Mechanical",
  amia: "AM & IA",
  ce: "Civil",
  general: "General",
  notice: "Notice",
};

function normalize(value?: string | null): string {
  return String(value || "").trim().toLowerCase();
}

function resolveLabel(value: string): string {
  if (!value) return "Department";
  if (SHORT_LABELS[value]) return SHORT_LABELS[value];
  const branch = BRANCH_OPTIONS.find((item) => item.value === value);
  if (branch?.label) return branch.label;
  return value.toUpperCase();
}

export function getDepartmentMeta(value?: string | null): DepartmentMeta {
  const normalized = normalize(value);
  if (!normalized) {
    return { value: "", label: "Department", icon: Building2 };
  }
  if (normalized === "all") {
    return { value: "all", label: "All Departments", icon: LayoutGrid };
  }

  return {
    value: normalized,
    label: resolveLabel(normalized),
    icon: ICON_MAP[normalized] || Building2,
  };
}

export function getDepartmentList(includeAll = false): DepartmentMeta[] {
  const seen = new Set<string>();
  const list: DepartmentMeta[] = [];

  for (const branch of BRANCH_OPTIONS) {
    const normalized = normalize(branch.value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    list.push(getDepartmentMeta(normalized));
  }

  if (includeAll) {
    return [getDepartmentMeta("all"), ...list];
  }

  return list;
}
