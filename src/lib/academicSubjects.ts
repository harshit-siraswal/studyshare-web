export type BranchOption = {
  value: string;
  label: string;
  shortLabel: string;
};

type CollegeAcademicCatalog = {
  key: string;
  branchCodes: string[];
  subjectsByBranchSemester: Record<string, Record<string, string[]>>;
};

export const SEMESTER_OPTIONS = [
  { value: "1", label: "Semester 1" },
  { value: "2", label: "Semester 2" },
  { value: "3", label: "Semester 3" },
  { value: "4", label: "Semester 4" },
  { value: "5", label: "Semester 5" },
  { value: "6", label: "Semester 6" },
  { value: "7", label: "Semester 7" },
  { value: "8", label: "Semester 8" },
] as const;

export const BRANCH_OPTIONS: BranchOption[] = [
  { value: "cse", label: "Computer Science & Engineering (CSE/CS)", shortLabel: "CSE/CS" },
  { value: "it", label: "Information Technology (IT/CSIT)", shortLabel: "IT/CSIT" },
  { value: "cse_ai", label: "Computer Science (AI)", shortLabel: "CSE-AI" },
  { value: "aiml", label: "Computer Science (AI & ML)", shortLabel: "CSE-AIML" },
  { value: "ds", label: "Computer Science (Data Science)", shortLabel: "CSE-DS" },
  { value: "cse_cs", label: "Computer Science (Cyber Security)", shortLabel: "CSE-CS" },
  { value: "computer", label: "Computer Engineering", shortLabel: "COE" },
  { value: "csbs", label: "Computer Science and Business Systems", shortLabel: "CSBS" },
  { value: "mnc", label: "Mathematics and Computing", shortLabel: "MnC" },
  { value: "ai_ml", label: "Artificial Intelligence and Machine Learning", shortLabel: "AI-ML" },
  { value: "ai_ds", label: "Artificial Intelligence and Data Science", shortLabel: "AI-DS" },
  { value: "me", label: "Mechanical Engineering (ME)", shortLabel: "ME" },
  { value: "mechatronics", label: "Mechatronics Engineering", shortLabel: "MTRX" },
  { value: "amia", label: "Advanced Mechatronics & Industrial Automation", shortLabel: "AM&IA" },
  { value: "automation_robotics", label: "Automation and Robotics", shortLabel: "A&R" },
  { value: "robotics_ai", label: "Robotics and Artificial Intelligence", shortLabel: "RAI" },
  { value: "ee", label: "Electrical Engineering", shortLabel: "EE" },
  { value: "elce", label: "Electrical & Computer Engineering (ELCE)", shortLabel: "ELCE" },
  { value: "eee", label: "Electrical & Electronics Engineering (EEE)", shortLabel: "EEE" },
  { value: "eec", label: "Electrical and Computer Engineering", shortLabel: "EEC" },
  { value: "eic", label: "Electronics and Instrumentation Engineering", shortLabel: "EIC" },
  { value: "ece", label: "Electronics & Communication Engineering (ECE)", shortLabel: "ECE" },
  { value: "ece_iot", label: "Electronics and Communication Engineering (IoT)", shortLabel: "ECE-IoT" },
  { value: "ecm", label: "Electronics and Computer Engineering", shortLabel: "ECM" },
  { value: "ece_vlsi", label: "ECE (VLSI Design & Technology)", shortLabel: "ECE-VLSI" },
  { value: "entc", label: "Electronics and Telecommunication Engineering", shortLabel: "E&TC" },
  { value: "iiot", label: "Industrial Internet of Things", shortLabel: "IIOT" },
  { value: "instrumentation", label: "Instrumentation and Control Engineering", shortLabel: "I&C" },
  { value: "biomedical", label: "Biomedical Engineering", shortLabel: "BME" },
  { value: "biotech", label: "Biotechnology", shortLabel: "BT" },
  { value: "chemical", label: "Chemical Engineering", shortLabel: "CHE" },
  { value: "ce", label: "Civil Engineering", shortLabel: "CE" },
  { value: "manufacturing", label: "Manufacturing Science and Engineering", shortLabel: "MFG" },
  { value: "metallurgy", label: "Metallurgy and Materials Engineering", shortLabel: "META" },
];

const BRANCH_ALIASES: Record<string, string> = {
  cs: "cse",
  "cse/cs": "cse",
  "cse-cs": "cse_cs",
  cse_cs: "cse_cs",
  "cyber security": "cse_cs",
  cybersecurity: "cse_cs",
  csit: "it",
  "it/csit": "it",
  "cse(ai)": "cse_ai",
  "cse-ai": "cse_ai",
  "cse ai": "cse_ai",
  cse_ai: "cse_ai",
  ai: "cse_ai",
  "cse-aiml": "aiml",
  cse_aiml: "aiml",
  "cse aiml": "aiml",
  "cse(ai&ml)": "aiml",
  "cse(ai & ml)": "aiml",
  "cse(ai ml)": "aiml",
  "ai&ml": "aiml",
  "ai/ml": "aiml",
  "cse(ds)": "ds",
  "cse-ds": "ds",
  "data science": "ds",
  "computer engineering": "computer",
  coe: "computer",
  "computer science and business systems": "csbs",
  "mathematics and computing": "mnc",
  mtrx: "mechatronics",
  rai: "robotics_ai",
  "artificial intelligence machine learning": "ai_ml",
  "artificial intelligence and machine learning": "ai_ml",
  "artificial intelligence data science": "ai_ds",
  "artificial intelligence and data science": "ai_ds",
  "advanced mechatronics and industrial automation": "amia",
  "am&ia": "amia",
  "am ia": "amia",
  "electrical engineering": "ee",
  "electrical and computer engineering": "eec",
  "electrical & computer engineering": "eec",
  "electronics and instrumentation engineering": "eic",
  "electronics & instrumentation engineering": "eic",
  "electronics and communication engineering": "ece",
  "electronics & communication engineering": "ece",
  "ece(iot)": "ece_iot",
  "ece-iot": "ece_iot",
  "ece iot": "ece_iot",
  "electronics and communication engineering iot": "ece_iot",
  "electronics and computer engineering": "ecm",
  "ece(vlsi)": "ece_vlsi",
  "ece-vlsi": "ece_vlsi",
  "ece vlsi": "ece_vlsi",
  vlsi: "ece_vlsi",
  "electronics and telecommunication engineering": "entc",
  "e&tc": "entc",
  "industrial internet of things": "iiot",
  "internet of things": "iiot",
  "instrumentation and control engineering": "instrumentation",
  "i&c": "instrumentation",
  "biomedical engineering": "biomedical",
  bme: "biomedical",
  biotechnology: "biotech",
  bt: "biotech",
  "chemical engineering": "chemical",
  che: "chemical",
  "civil engineering": "ce",
  "mechatronics and automation": "mechatronics",
  "mechatronics engineering": "mechatronics",
  "automation and robotics": "automation_robotics",
  "automation robotics": "automation_robotics",
  "a&r": "automation_robotics",
  "robotics and ai": "robotics_ai",
  "robotics and artificial intelligence": "robotics_ai",
  "robotics ai": "robotics_ai",
  "metallurgy and materials engineering": "metallurgy",
  meta: "metallurgy",
  "manufacturing science and engineering": "manufacturing",
  mfg: "manufacturing",
};

const COLLEGE_ALIASES: Record<string, string[]> = {
  kiet: ["kiet", "kiet.edu", "kiet group of institutions", "krishna institute of engineering and technology"],
  iiitbh: ["iiitbh", "iiitbhagalpur", "iiit bhagalpur", "iiitbh.ac.in"],
  thapar: ["thapar", "thapar.edu", "thapar.edu.in", "thapar institute of engineering and technology", "thapar institute", "tiet"],
  coep: ["coep", "coep pune", "coep technological university", "coeptech.ac.in", "college of engineering pune"],
  iiitn: ["iiitn", "iiit nagpur", "iiitn.ac.in", "indian institute of information technology nagpur"],
  usar: ["usar", "usar ggsipu", "ggsipu usar", "ipu.ac.in", "ggsipu", "guru gobind singh indraprastha university", "university school of automation and robotics"],
};

const KIET_BRANCH_CODES = [
  "cse",
  "it",
  "cse_ai",
  "aiml",
  "ds",
  "cse_cs",
  "me",
  "amia",
  "elce",
  "eee",
  "ece",
  "ece_vlsi",
  "ce",
];

const IIITBH_BRANCH_CODES = ["cse", "ece", "mechatronics", "mnc"];
const THAPAR_BRANCH_CODES = ["computer", "cse", "csbs", "ee", "eec", "eic", "biomedical", "ece", "ecm", "chemical", "ce", "me", "mechatronics", "robotics_ai", "biotech"];
const COEP_BRANCH_CODES = ["ce", "computer", "ee", "entc", "instrumentation", "me", "metallurgy", "manufacturing", "robotics_ai"];
const IIITN_BRANCH_CODES = ["cse", "ece_iot"];
const USAR_BRANCH_CODES = ["ai_ml", "ai_ds", "iiot", "automation_robotics"];

const IIITBH_FIRST_YEAR_SUBJECTS: Record<string, string[]> = {
  "1": ["Physics", "Chemistry", "Mathematics-I", "English", "Basic Electrical and Electronics Engineering", "Engineering Graphics"],
  "2": ["Computer Programming", "Engineering Mechanics", "Mathematics-II", "Environmental Studies", "Basic Electronics Engineering"],
};

const THAPAR_FIRST_YEAR_SUBJECTS: Record<string, string[]> = {
  "1": ["Physics", "Engineering Drawing", "Professional Communication", "Manufacturing Process", "Mathematics-I"],
  "2": ["Chemistry", "Programming for Problem Solving", "Electrical and Electronics Engineering", "Energy and Environment", "Mathematics-II"],
};

const COEP_FIRST_YEAR_SUBJECTS: Record<string, string[]> = {
  "1": [
    "Calculus and Differential Equations",
    "Engineering Chemistry",
    "Engineering Mechanics",
    "Fundamental of Electrical and Electronics Engineering",
    "Semiconductor Physics and Devices",
    "Engineering Graphics and Design Lab",
    "Engineering Chemistry Lab",
    "Semiconductor Physics and Devices Lab",
  ],
  "2": [
    "Linear Algebra and Complex Variables",
    "Environmental Science and Technology",
    "Programming for Problem Solving",
    "Basic Workshop Technology",
    "Basic Civil and Mechanical Engineering",
    "Programming for Problem Solving Lab",
    "Basic Workshop Technology Lab",
    "Basic Civil and Mechanical Engineering Lab",
  ],
};

const IIITN_FIRST_YEAR_SUBJECTS: Record<string, string[]> = {
  "1": [
    "Engineering Physics",
    "Engineering Chemistry",
    "Engineering Mathematics-I",
    "Basic Electrical Engineering",
    "Engineering Graphics and Design",
  ],
  "2": [
    "Engineering Physics Lab",
    "Engineering Chemistry Lab",
    "Electrical Workshop",
    "Workshop Practice",
    "Engineering Mathematics-II",
    "Data Structures",
    "Basic Electronics Engineering",
    "Communicative English",
  ],
};

const USAR_FIRST_YEAR_SUBJECTS: Record<string, string[]> = {
  "1": [
    "Mathematics-I",
    "Applied Physics-I",
    "Basic Electrical Engineering",
    "Workshop Technology",
    "Engineering Drawing and Visualization",
    "Communication Skills",
    "Applied Physics-I Lab",
    "Electrical Science Lab",
    "Engineering Graphics Lab",
    "Workshop Practice",
  ],
  "2": [
    "Mathematics-II",
    "Applied Physics-II",
    "Applied Chemistry",
    "Programming in C",
    "Mechanics",
    "Environmental Studies",
    "Applied Physics-II Lab",
    "Applied Chemistry Lab",
    "Engineering Mechanics Lab",
    "C Programming Lab",
  ],
};

const KIET_SUBJECTS_BY_BRANCH_SEMESTER: Record<string, Record<string, string[]>> = {
  cse: {
    "1": ["Calculus for Engineers", "Semiconductor Physics and Devices", "Programming For Problem Solving", "Discrete Structures & Theory of Logic", "Design Thinking", "Introduction to IoT", "Semiconductor Physics and Devices Lab", "Programming For Problem Solving Lab", "Web Designing", "Communication Skills", "Indian Knowledge System"],
    "2": ["Linear Algebra for Engineers", "Environmental Chemistry", "Computer Organization & Logic Design", "Data Structure", "Design and Realization", "Computer Organization & Logic Design Lab", "Python for Engineers", "Foreign Language", "Innovation and Entrepreneurship"],
  },
  it: {
    "1": ["Calculus for Engineers", "Semiconductor Physics and Devices", "Programming For Problem Solving", "Discrete Structures & Theory of Logic", "Design Thinking", "Introduction to IoT", "Semiconductor Physics and Devices Lab", "Programming For Problem Solving Lab", "Web Designing", "Communication Skills"],
    "2": ["Linear Algebra for Engineers", "Environmental Chemistry", "Computer Organization & Logic Design", "Data Structure", "Design and Realization", "Computer Organization & Logic Design Lab", "Python for Engineers", "Foreign Language", "Innovation and Entrepreneurship", "Indian Knowledge System"],
  },
  cse_ai: {
    "1": ["Calculus for Engineers", "Semiconductor Physics and Devices", "Programming For Problem Solving", "Discrete Structures & Theory of Logic", "Design Thinking", "Introduction to IoT", "Semiconductor Physics and Devices Lab", "Programming For Problem Solving Lab", "Web Designing", "Communication Skills"],
    "2": ["Linear Algebra for Engineers", "Environmental Chemistry", "Computer Organization & Logic Design", "Data Structure", "Introduction to AI", "Computer Organization & Logic Design Lab", "Python for Engineers", "Foreign Language", "Innovation and Entrepreneurship", "Indian Knowledge System"],
  },
  aiml: {
    "1": ["Calculus for Engineers", "Semiconductor Physics and Devices", "Programming For Problem Solving", "Discrete Structures & Theory of Logic", "Design Thinking", "Introduction to IoT", "Semiconductor Physics and Devices Lab", "Programming For Problem Solving Lab", "Web Designing", "Communication Skills"],
    "2": ["Linear Algebra for Engineers", "Environmental Chemistry", "Computer Organization & Logic Design", "Data Structure", "Introduction to AI", "Computer Organization & Logic Design Lab", "Python for Engineers", "Foreign Language", "Innovation and Entrepreneurship", "Indian Knowledge System"],
  },
  ds: {
    "1": ["Calculus for Engineers", "Semiconductor Physics and Devices", "Programming For Problem Solving", "Discrete Structures & Theory of Logic", "Design Thinking", "Introduction to IoT", "Semiconductor Physics and Devices Lab", "Programming For Problem Solving Lab", "Web Designing", "Communication Skills", "Indian Knowledge System"],
    "2": ["Linear Algebra for Engineers", "Computer Organization & Logic Design", "Data Structure", "Design and Realization", "Introduction to Data Science", "Computer Organization & Logic Design Lab", "Python for Engineers", "Foreign Language", "Innovation and Entrepreneurship"],
  },
  cse_cs: {
    "1": ["Calculus for Engineers", "Semiconductor Physics and Devices", "Programming For Problem Solving", "Discrete Structures & Theory of Logic", "Design Thinking", "Introduction to IoT", "Semiconductor Physics and Devices Lab", "Programming For Problem Solving Lab", "Web Designing", "Communication Skills"],
    "2": ["Linear Algebra for Engineers", "Environmental Chemistry", "Computer Organization & Logic Design", "Data Structure", "Introduction to Cyber Security", "Computer Organization & Logic Design Lab", "Python for Engineers", "Foreign Language", "Innovation and Entrepreneurship", "Indian Knowledge System"],
  },
  me: {
    "1": ["Calculus for Engineers", "Semiconductor Physics and Devices", "Programming For Problem Solving", "Explorations in Electrical Engineering", "Design Thinking", "Introduction to IoT", "Semiconductor Physics and Devices Lab", "Programming For Problem Solving Lab", "Explorations in Electrical Engineering Lab", "Communication Skills", "Indian Knowledge System"],
    "2": ["Differential Equations & Complex Integration", "Environmental Chemistry", "Engineering Mechanics", "Data Structure", "Design and Realization", "Emerging Technologies for Engineers", "Python for Engineers", "Foreign Language", "Innovation and Entrepreneurship"],
  },
  amia: {
    "1": ["Calculus for Engineers", "Environmental Chemistry", "Fundamentals of Mechatronics and Industrial Automation", "Programming For Problem Solving", "Explorations in Electrical Engineering", "Design Thinking", "Introduction to IoT", "Programming For Problem Solving Lab", "Explorations in Electrical Engineering Lab", "Communication Skills", "Indian Knowledge System"],
    "2": ["Differential Equations & Complex Integration", "Semiconductor Physics and Devices", "Data Structure", "Design and Realization", "Emerging Technologies for Engineers", "Semiconductor Physics and Devices Lab", "Python for Engineers", "Foreign Language", "Innovation and Entrepreneurship"],
  },
  elce: {
    "1": ["Calculus for Engineers", "Semiconductor Physics and Devices", "Programming For Problem Solving", "Explorations in Electrical Engineering", "Design Thinking", "Introduction to IoT", "Semiconductor Physics and Devices Lab", "Programming For Problem Solving Lab", "Explorations in Electrical Engineering Lab", "Communication Skills"],
    "2": ["Linear Algebra for Engineers", "Environmental Chemistry", "Computer Organization & Logic Design", "Data Structure", "Design and Realization", "Computer Organization & Logic Design Lab", "Python for Engineers", "Computer Aided Electrical Design", "Foreign Language", "Innovation and Entrepreneurship", "Indian Knowledge System"],
  },
  eee: {
    "1": ["Calculus for Engineers", "Semiconductor Physics and Devices", "Programming For Problem Solving", "Explorations in Electrical Engineering", "Design Thinking", "Introduction to IoT", "Semiconductor Physics and Devices Lab", "Programming For Problem Solving Lab", "Explorations in Electrical Engineering Lab", "Communication Skills", "Indian Knowledge System"],
    "2": ["Linear Algebra for Engineers", "Environmental Chemistry", "Digital Logic Design", "Data Structure", "Design and Realization", "Emerging Technologies for Engineers", "Python for Engineers", "Foreign Language", "Innovation and Entrepreneurship"],
  },
  ece: {
    "1": ["Calculus for Engineers", "Environmental Chemistry", "Programming For Problem Solving", "Computer Organization & Logic Design", "Intelligent Health Care Systems", "Design Thinking", "Introduction to IoT", "Computer Organization & Logic Design Lab", "Programming For Problem Solving Lab", "Intelligent Health Care Systems Lab", "Communication Skills", "Indian Knowledge System"],
    "2": ["Linear Algebra for Engineers", "Semiconductor Physics and Devices", "Explorations in Electrical Engineering", "Data Structure", "Design and Realization", "Semiconductor Physics and Devices Lab", "Python for Engineers", "Foreign Language", "Innovation and Entrepreneurship"],
  },
  ece_vlsi: {
    "1": ["Calculus for Engineers", "Environmental Chemistry", "Explorations in Electrical Engineering", "Programming For Problem Solving", "Computer Organization & Logic Design", "Design Thinking", "Design and Realization", "Computer Organization & Logic Design Lab", "Programming For Problem Solving Lab", "Communication Skills", "Indian Knowledge System"],
    "2": ["Linear Algebra for Engineers", "Semiconductor Physics and Devices", "Digital Logic Design using HDL", "Data Structure", "Basic Electronics Engineering", "Semiconductor Physics and Devices Lab", "Digital Logic Design using HDL Lab", "Python for Engineers", "Foreign Language", "Innovation and Entrepreneurship"],
  },
  ce: {
    "1": ["Engineering Mathematics", "Engineering Physics", "Engineering Chemistry"],
    "2": ["Engineering Mechanics", "Data Structure", "Communication Skills"],
  },
};

function cloneSemestersForBranches(
  branchCodes: string[],
  semesterSubjects: Record<string, string[]>,
): Record<string, Record<string, string[]>> {
  return Object.fromEntries(
    branchCodes.map((branchCode) => [
      branchCode,
      Object.fromEntries(
        Object.entries(semesterSubjects).map(([semester, subjects]) => [
          semester,
          [...subjects],
        ]),
      ),
    ]),
  );
}

const COLLEGE_CATALOGS: Record<string, CollegeAcademicCatalog> = {
  kiet: { key: "kiet", branchCodes: [...KIET_BRANCH_CODES], subjectsByBranchSemester: KIET_SUBJECTS_BY_BRANCH_SEMESTER },
  iiitbh: { key: "iiitbh", branchCodes: [...IIITBH_BRANCH_CODES], subjectsByBranchSemester: cloneSemestersForBranches(IIITBH_BRANCH_CODES, IIITBH_FIRST_YEAR_SUBJECTS) },
  thapar: { key: "thapar", branchCodes: [...THAPAR_BRANCH_CODES], subjectsByBranchSemester: cloneSemestersForBranches(THAPAR_BRANCH_CODES, THAPAR_FIRST_YEAR_SUBJECTS) },
  coep: { key: "coep", branchCodes: [...COEP_BRANCH_CODES], subjectsByBranchSemester: cloneSemestersForBranches(COEP_BRANCH_CODES, COEP_FIRST_YEAR_SUBJECTS) },
  iiitn: { key: "iiitn", branchCodes: [...IIITN_BRANCH_CODES], subjectsByBranchSemester: cloneSemestersForBranches(IIITN_BRANCH_CODES, IIITN_FIRST_YEAR_SUBJECTS) },
  usar: { key: "usar", branchCodes: [...USAR_BRANCH_CODES], subjectsByBranchSemester: cloneSemestersForBranches(USAR_BRANCH_CODES, USAR_FIRST_YEAR_SUBJECTS) },
};

function normalizeCollegeProbe(value?: string | null): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/@/g, "")
    .replace(/[^a-z0-9. ]+/g, " ")
    .replace(/\s+/g, " ");
}

export function resolveCollegeCatalogKey(input?: {
  collegeId?: string | null;
  collegeDomain?: string | null;
  collegeName?: string | null;
}): string | null {
  const probes = [
    normalizeCollegeProbe(input?.collegeId),
    normalizeCollegeProbe(input?.collegeDomain),
    normalizeCollegeProbe(input?.collegeName),
  ].filter(Boolean);

  for (const [key, aliases] of Object.entries(COLLEGE_ALIASES)) {
    const normalizedAliases = aliases.map(normalizeCollegeProbe);
    for (const probe of probes) {
      if (normalizedAliases.includes(probe)) return key;
      if (normalizedAliases.some((alias) => alias && probe.includes(alias))) return key;
      if (normalizedAliases.some((alias) => alias && alias.includes(probe))) return key;
    }
  }

  return null;
}

export function normalizeBranchCode(branch?: string | null): string {
  const normalized = (branch ?? "").toLowerCase().trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  return BRANCH_ALIASES[normalized] ?? normalized.replace(/[^\w]/g, "_");
}

export function getBranchLabel(branch?: string | null): string {
  const normalized = normalizeBranchCode(branch);
  const option = BRANCH_OPTIONS.find((entry) => entry.value === normalized);
  return option?.label ?? (branch ?? "");
}

export function getBranchOptionsForCollege(input?: {
  collegeId?: string | null;
  collegeDomain?: string | null;
  collegeName?: string | null;
}): BranchOption[] {
  const catalogKey = resolveCollegeCatalogKey(input);
  const catalog = catalogKey ? COLLEGE_CATALOGS[catalogKey] : COLLEGE_CATALOGS.kiet;
  return catalog.branchCodes
    .map((code) => BRANCH_OPTIONS.find((option) => option.value === code))
    .filter((option): option is BranchOption => Boolean(option));
}

function mergeUniqueSubjects(subjectGroups: string[][]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const subjects of subjectGroups) {
    for (const subject of subjects) {
      const normalized = subject.trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      merged.push(normalized);
    }
  }
  return merged;
}

export function getSubjectsForBranchAndSemester(
  branch?: string | null,
  semester?: string | null,
  input?: {
    collegeId?: string | null;
    collegeDomain?: string | null;
    collegeName?: string | null;
  },
): string[] {
  const normalizedBranch = normalizeBranchCode(branch);
  const normalizedSemester = (semester ?? "").trim();
  const catalogKey = resolveCollegeCatalogKey(input) ?? "kiet";
  const catalog = COLLEGE_CATALOGS[catalogKey];
  if (!normalizedBranch) return [];

  const branchCatalog = catalog.subjectsByBranchSemester[normalizedBranch];
  if (!branchCatalog) return [];

  if (normalizedSemester && branchCatalog[normalizedSemester]?.length) {
    return [...branchCatalog[normalizedSemester]];
  }

  return mergeUniqueSubjects(Object.values(branchCatalog));
}
