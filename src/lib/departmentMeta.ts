import type { ElementType } from "react";
import {
  Building2,
  CalendarDays,
  CircuitBoard,
  Cpu,
  Database,
  Factory,
  Globe,
  GraduationCap,
  LayoutGrid,
  Megaphone,
  Network,
  PlugZap,
  RadioTower,
  Shield,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { BRANCH_OPTIONS } from "./academicSubjects";

export type DepartmentMeta = {
  value: string;
  label: string;
  handle: string;
  avatarLetter: string;
  avatarColor: string;
  icon: ElementType;
  badgeClassName: string;
  description?: string;
};

type DepartmentOverride = Omit<DepartmentMeta, "value">;

const DEFAULT_META: DepartmentOverride = {
  label: "Department",
  handle: "@department",
  avatarLetter: "DP",
  avatarColor: "#64748B",
  icon: Building2,
  badgeClassName: "border-border/60 bg-muted/40 text-foreground/80",
  description: "Official department notices and updates.",
};

const DEPARTMENT_OVERRIDES: Record<string, Partial<DepartmentOverride>> = {
  general: {
    label: "General Notices",
    handle: "@general",
    avatarLetter: "G",
    avatarColor: "#3B82F6",
    icon: Megaphone,
    description: "Campus-wide notices, exam updates, and administrative announcements.",
  },
  hackathons: {
    label: "Hackathons and Competitions",
    handle: "@hackathons",
    avatarLetter: "HC",
    avatarColor: "#8B5CF6",
    icon: Trophy,
  },
  ir: {
    label: "International Relations",
    handle: "@ir_cell",
    avatarLetter: "IR",
    avatarColor: "#0EA5E9",
    icon: Globe,
  },
  pr: {
    label: "Public Relations",
    handle: "@pr_cell",
    avatarLetter: "PR",
    avatarColor: "#EC4899",
    icon: Users,
  },
  placements: {
    label: "Placements and Career",
    handle: "@placements",
    avatarLetter: "PC",
    avatarColor: "#F59E0B",
    icon: GraduationCap,
  },
  internships: {
    label: "Internships",
    handle: "@internships",
    avatarLetter: "IN",
    avatarColor: "#14B8A6",
    icon: Sparkles,
  },
  workshops: {
    label: "Workshops and Seminars",
    handle: "@workshops",
    avatarLetter: "WS",
    avatarColor: "#6366F1",
    icon: CalendarDays,
  },
  events: {
    label: "Events and Activities",
    handle: "@events",
    avatarLetter: "EV",
    avatarColor: "#EF4444",
    icon: CalendarDays,
  },
  scholarships: {
    label: "Scholarships and Financial Aid",
    handle: "@scholarships",
    avatarLetter: "SF",
    avatarColor: "#22C55E",
    icon: Wallet,
  },
  admissions: {
    label: "Admissions and Enrollment",
    handle: "@admissions",
    avatarLetter: "AD",
    avatarColor: "#06B6D4",
    icon: Network,
  },
  examinations: {
    label: "Examinations and Assessment",
    handle: "@examinations",
    avatarLetter: "EX",
    avatarColor: "#F97316",
    icon: CircuitBoard,
  },
  academics: {
    label: "Academic Notices",
    handle: "@academics",
    avatarLetter: "AC",
    avatarColor: "#475569",
    icon: Building2,
  },
  training: {
    label: "Training and Certifications",
    handle: "@training",
    avatarLetter: "TR",
    avatarColor: "#10B981",
    icon: GraduationCap,
  },
  clubs: {
    label: "Clubs and Societies",
    handle: "@clubs",
    avatarLetter: "CL",
    avatarColor: "#7C3AED",
    icon: Users,
  },
  nss_ncc: {
    label: "NSS / NCC",
    handle: "@nss_ncc",
    avatarLetter: "NN",
    avatarColor: "#84CC16",
    icon: Users,
  },
  cse: {
    label: "Computer Science",
    handle: "@cse_dept",
    avatarLetter: "CS",
    avatarColor: "#8B5CF6",
    icon: CircuitBoard,
  },
  aiml: {
    label: "CSE (AI & ML)",
    handle: "@aiml_dept",
    avatarLetter: "AI",
    avatarColor: "#7C3AED",
    icon: Cpu,
  },
  cse_ai: {
    label: "CSE (AI)",
    handle: "@cse_ai_dept",
    avatarLetter: "CA",
    avatarColor: "#6366F1",
    icon: Cpu,
  },
  it: {
    label: "Information Technology",
    handle: "@it_dept",
    avatarLetter: "IT",
    avatarColor: "#14B8A6",
    icon: Globe,
  },
  ds: {
    label: "CSE (Data Science)",
    handle: "@ds_dept",
    avatarLetter: "DS",
    avatarColor: "#0EA5E9",
    icon: Database,
  },
  cse_cs: {
    label: "CSE (Cyber Security)",
    handle: "@cse_cs_dept",
    avatarLetter: "CY",
    avatarColor: "#2563EB",
    icon: Shield,
  },
  ece: {
    label: "Electronics",
    handle: "@ece_dept",
    avatarLetter: "EC",
    avatarColor: "#10B981",
    icon: RadioTower,
  },
  ece_vlsi: {
    label: "ECE (VLSI)",
    handle: "@ece_vlsi_dept",
    avatarLetter: "EV",
    avatarColor: "#0F766E",
    icon: Cpu,
  },
  elce: {
    label: "ELCE",
    handle: "@elce_dept",
    avatarLetter: "EL",
    avatarColor: "#0284C7",
    icon: PlugZap,
  },
  eee: {
    label: "Electrical",
    handle: "@eee_dept",
    avatarLetter: "EE",
    avatarColor: "#F59E0B",
    icon: PlugZap,
  },
  ce: {
    label: "Civil",
    handle: "@ce_dept",
    avatarLetter: "CE",
    avatarColor: "#6366F1",
    icon: Building2,
  },
  me: {
    label: "Mechanical",
    handle: "@me_dept",
    avatarLetter: "ME",
    avatarColor: "#EF4444",
    icon: Factory,
  },
  amia: {
    label: "AM & IA",
    handle: "@amia_dept",
    avatarLetter: "AM",
    avatarColor: "#DC2626",
    icon: Factory,
  },
};

const DEPARTMENT_ORDER = [
  "general",
  "hackathons",
  "ir",
  "pr",
  "placements",
  "internships",
  "workshops",
  "events",
  "scholarships",
  "admissions",
  "examinations",
  "academics",
  "training",
  "clubs",
  "nss_ncc",
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

function titleCase(value: string): string {
  return value
    .split(/[_\s]+/g)
    .filter(Boolean)
    .map((part) =>
      part.length <= 3
        ? part.toUpperCase()
        : `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}`
    )
    .join(" ");
}

function resolveFromBranches(value: string): string | null {
  const branch = BRANCH_OPTIONS.find((item) => normalize(item.value) === value);
  if (!branch?.label) return null;
  return branch.label;
}

function resolveFallbackMeta(value: string): DepartmentOverride {
  const label = resolveFromBranches(value) || titleCase(value) || DEFAULT_META.label;
  const avatarLetter = label
    .split(/\s+/g)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() || "")
    .join("") || "DP";

  return {
    ...DEFAULT_META,
    label,
    handle: `@${value.replace(/_/g, "")}`,
    avatarLetter,
  };
}

export function getDepartmentMeta(value?: string | null): DepartmentMeta {
  const normalized = normalize(value);

  if (!normalized) {
    return {
      value: "",
      ...DEFAULT_META,
    };
  }

  if (normalized === "all") {
    return {
      value: "all",
      label: "All Departments",
      handle: "@all",
      avatarLetter: "ALL",
      avatarColor: "#64748B",
      icon: LayoutGrid,
      badgeClassName: "border-border/60 bg-muted/40 text-foreground/80",
      description: "Browse notices across every department.",
    };
  }

  const override = DEPARTMENT_OVERRIDES[normalized];
  const resolved = override
    ? { ...DEFAULT_META, ...override }
    : resolveFallbackMeta(normalized);

  return {
    value: normalized,
    ...resolved,
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
