import type { ElementType } from "react";
import {
  LayoutGrid,
  BrainCircuit,
  Building2,
  Cable,
  Cpu,
  Database,
  Factory,
  Globe,
  Megaphone,
  PlugZap,
  RadioTower,
  Shield,
  SquareTerminal,
} from "lucide-react";
import { BRANCH_OPTIONS } from "./academicSubjects";

export type DepartmentMeta = {
  value: string;
  label: string;
  icon: ElementType;
  avatarClassName: string;
  iconClassName: string;
  badgeClassName: string;
  description?: string;
};

type DepartmentOverride = Omit<DepartmentMeta, "value" | "label">;

const DEFAULT_META: DepartmentOverride = {
  icon: Building2,
  avatarClassName:
    "bg-gradient-to-br from-slate-500/25 via-slate-400/10 to-slate-600/10 text-slate-100",
  iconClassName: "text-slate-100",
  badgeClassName:
    "border-slate-400/20 bg-slate-400/10 text-slate-100",
  description: "Official department notices and updates.",
};

const DEPARTMENT_OVERRIDES: Record<string, Partial<DepartmentMeta>> = {
  general: {
    label: "General Notices",
    icon: Megaphone,
    avatarClassName:
      "bg-gradient-to-br from-sky-500/30 via-cyan-400/15 to-blue-500/10 text-sky-100",
    iconClassName: "text-sky-100",
    badgeClassName: "border-sky-400/20 bg-sky-400/10 text-sky-100",
    description: "Campus-wide notices, exam updates, and administrative announcements.",
  },
  cse: {
    icon: SquareTerminal,
    avatarClassName:
      "bg-gradient-to-br from-blue-500/30 via-indigo-400/15 to-cyan-400/10 text-blue-100",
    iconClassName: "text-blue-100",
    badgeClassName: "border-blue-400/20 bg-blue-400/10 text-blue-100",
  },
  it: {
    icon: Globe,
    avatarClassName:
      "bg-gradient-to-br from-cyan-500/30 via-sky-400/15 to-emerald-400/10 text-cyan-100",
    iconClassName: "text-cyan-100",
    badgeClassName: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
  },
  cse_ai: {
    icon: BrainCircuit,
    avatarClassName:
      "bg-gradient-to-br from-fuchsia-500/25 via-purple-400/15 to-indigo-500/10 text-fuchsia-100",
    iconClassName: "text-fuchsia-100",
    badgeClassName:
      "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100",
  },
  aiml: {
    icon: BrainCircuit,
    avatarClassName:
      "bg-gradient-to-br from-violet-500/25 via-purple-400/15 to-pink-500/10 text-violet-100",
    iconClassName: "text-violet-100",
    badgeClassName:
      "border-violet-400/20 bg-violet-400/10 text-violet-100",
  },
  ds: {
    icon: Database,
    avatarClassName:
      "bg-gradient-to-br from-emerald-500/25 via-green-400/15 to-teal-500/10 text-emerald-100",
    iconClassName: "text-emerald-100",
    badgeClassName:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  },
  cse_cs: {
    icon: Shield,
    avatarClassName:
      "bg-gradient-to-br from-amber-500/25 via-orange-400/15 to-red-500/10 text-amber-100",
    iconClassName: "text-amber-100",
    badgeClassName: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  },
  ece: {
    icon: RadioTower,
    avatarClassName:
      "bg-gradient-to-br from-rose-500/25 via-pink-400/15 to-orange-500/10 text-rose-100",
    iconClassName: "text-rose-100",
    badgeClassName: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  },
  ece_vlsi: {
    icon: Cpu,
    avatarClassName:
      "bg-gradient-to-br from-red-500/25 via-rose-400/15 to-orange-500/10 text-red-100",
    iconClassName: "text-red-100",
    badgeClassName: "border-red-400/20 bg-red-400/10 text-red-100",
  },
  elce: {
    icon: Cable,
    avatarClassName:
      "bg-gradient-to-br from-yellow-500/25 via-amber-400/15 to-lime-500/10 text-yellow-100",
    iconClassName: "text-yellow-100",
    badgeClassName:
      "border-yellow-400/20 bg-yellow-400/10 text-yellow-100",
  },
  eee: {
    icon: PlugZap,
    avatarClassName:
      "bg-gradient-to-br from-lime-500/25 via-yellow-400/15 to-amber-500/10 text-lime-100",
    iconClassName: "text-lime-100",
    badgeClassName: "border-lime-400/20 bg-lime-400/10 text-lime-100",
  },
  me: {
    icon: Factory,
    avatarClassName:
      "bg-gradient-to-br from-orange-500/25 via-amber-400/15 to-stone-500/10 text-orange-100",
    iconClassName: "text-orange-100",
    badgeClassName:
      "border-orange-400/20 bg-orange-400/10 text-orange-100",
  },
  amia: {
    icon: Cpu,
    avatarClassName:
      "bg-gradient-to-br from-stone-500/25 via-zinc-400/15 to-slate-500/10 text-stone-100",
    iconClassName: "text-stone-100",
    badgeClassName: "border-stone-400/20 bg-stone-400/10 text-stone-100",
  },
  ce: {
    icon: Building2,
    avatarClassName:
      "bg-gradient-to-br from-teal-500/25 via-emerald-400/15 to-cyan-500/10 text-teal-100",
    iconClassName: "text-teal-100",
    badgeClassName: "border-teal-400/20 bg-teal-400/10 text-teal-100",
  },
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
  general: "General Notices",
};

const DEPARTMENT_ORDER = [
  "general",
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
] as const;

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

function resolveOverrides(value: string): DepartmentOverride {
  const overrides = DEPARTMENT_OVERRIDES[value] || {};
  return {
    ...DEFAULT_META,
    ...overrides,
  };
}

export function getDepartmentMeta(value?: string | null): DepartmentMeta {
  const normalized = normalize(value);
  if (!normalized) {
    return {
      value: "",
      label: "Department",
      ...DEFAULT_META,
    };
  }
  if (normalized === "all") {
    return {
      value: "all",
      label: "All Departments",
      icon: LayoutGrid,
      avatarClassName:
        "bg-gradient-to-br from-slate-500/25 via-slate-400/15 to-slate-600/10 text-slate-100",
      iconClassName: "text-slate-100",
      badgeClassName:
        "border-slate-400/20 bg-slate-400/10 text-slate-100",
      description: "Browse notices across every department.",
    };
  }

  return {
    value: normalized,
    label: resolveLabel(normalized),
    ...resolveOverrides(normalized),
  };
}

export function findDepartmentMeta(value?: string | null): DepartmentMeta | undefined {
  const normalized = normalize(value);
  if (!normalized) return undefined;
  if (normalized === "all") return getDepartmentMeta("all");

  const knownDepartments = getDepartmentList(false);
  return knownDepartments.find((item) => item.value === normalized);
}

export function getDepartmentList(includeAll = false): DepartmentMeta[] {
  const seen = new Set<string>();
  const list: DepartmentMeta[] = [];

  const branchValues = BRANCH_OPTIONS.map((branch) => normalize(branch.value));
  const orderedValues = [...DEPARTMENT_ORDER, ...branchValues];

  for (const value of orderedValues) {
    const normalized = normalize(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    list.push(getDepartmentMeta(normalized));
  }

  if (includeAll) {
    return [getDepartmentMeta("all"), ...list];
  }

  return list;
}
