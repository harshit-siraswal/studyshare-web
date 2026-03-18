export type BranchOption = {
  value: string;
  label: string;
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
  { value: "cse", label: "Computer Science & Engineering (CSE/CS)" },
  { value: "it", label: "Information Technology (IT/CSIT)" },
  { value: "cse_ai", label: "Computer Science (AI)" },
  { value: "aiml", label: "Computer Science (AI & ML)" },
  { value: "ds", label: "Computer Science (Data Science)" },
  { value: "cse_cs", label: "Computer Science (Cyber Security)" },
  { value: "me", label: "Mechanical Engineering (ME)" },
  { value: "amia", label: "Advanced Mechatronics & Industrial Automation" },
  { value: "elce", label: "Electrical & Computer Engineering (ELCE)" },
  { value: "eee", label: "Electrical & Electronics Engineering (EEE)" },
  { value: "ece", label: "Electronics & Communication Engineering (ECE)" },
  { value: "ece_vlsi", label: "ECE (VLSI Design & Technology)" },
  { value: "ce", label: "Civil Engineering" },
];

const BRANCH_ALIASES: Record<string, string> = {
  cs: "cse",
  cse_cs: "cse_cs",
  "cse-cs": "cse_cs",
  "cyber security": "cse_cs",
  cybersecurity: "cse_cs",
  csit: "it",
  "cse(ai)": "cse_ai",
  "cse-ai": "cse_ai",
  "cse ai": "cse_ai",
  cse_ai: "cse_ai",
  "cse-aiml": "aiml",
  "cse_aiml": "aiml",
  "cse aiml": "aiml",
  "cse(ai&ml)": "aiml",
  "cse(ai ml)": "aiml",
  ai: "cse_ai",
  "ai&ml": "aiml",
  "cse(ds)": "ds",
  "cse-ds": "ds",
  "data science": "ds",
  "am&ia": "amia",
  "am ia": "amia",
  "ece(vlsi)": "ece_vlsi",
  "ece-vlsi": "ece_vlsi",
  vlsi: "ece_vlsi",
};

const KIET_BRANCH_SEM_SUBJECTS: Record<string, Record<string, string[]>> = {
  cse: {
    "1": [
      "Calculus for Engineers",
      "Semiconductor Physics and Devices",
      "Programming for Problem Solving",
      "Discrete Structures and Theory of Logic",
      "Design Thinking",
      "Introduction to IoT",
      "Semiconductor Physics and Devices Lab",
      "Programming for Problem Solving Lab",
      "Web Designing",
      "Communication Skills",
      "Indian Knowledge System",
    ],
    "2": [
      "Linear Algebra for Engineers",
      "Environmental Chemistry",
      "Computer Organization and Logic Design",
      "Data Structure",
      "Design and Realization",
      "Computer Organization and Logic Design Lab",
      "Python for Engineers",
      "Innovation and Entrepreneurship",
      "Foreign Language",
    ],
  },
  it: {
    "1": [
      "Calculus for Engineers",
      "Semiconductor Physics and Devices",
      "Programming for Problem Solving",
      "Discrete Structures and Theory of Logic",
      "Design Thinking",
      "Introduction to IoT",
      "Semiconductor Physics and Devices Lab",
      "Programming for Problem Solving Lab",
      "Web Designing",
      "Communication Skills",
    ],
    "2": [
      "Linear Algebra for Engineers",
      "Environmental Chemistry",
      "Computer Organization and Logic Design",
      "Data Structure",
      "Design and Realization",
      "Computer Organization and Logic Design Lab",
      "Python for Engineers",
      "Innovation and Entrepreneurship",
      "Foreign Language",
      "Indian Knowledge System",
    ],
  },
  aiml: {
    "1": [
      "Calculus for Engineers",
      "Semiconductor Physics and Devices",
      "Programming for Problem Solving",
      "Discrete Structures and Theory of Logic",
      "Design Thinking",
      "Introduction to IoT",
      "Semiconductor Physics and Devices Lab",
      "Programming for Problem Solving Lab",
      "Web Designing",
      "Communication Skills",
    ],
    "2": [
      "Linear Algebra for Engineers",
      "Environmental Chemistry",
      "Computer Organization and Logic Design",
      "Data Structure",
      "Introduction to AI",
      "Computer Organization and Logic Design Lab",
      "Python for Engineers",
      "Innovation and Entrepreneurship",
      "Foreign Language",
      "Indian Knowledge System",
    ],
  },
  cse_ai: {
    "1": [
      "Calculus for Engineers",
      "Semiconductor Physics and Devices",
      "Programming for Problem Solving",
      "Discrete Structures and Theory of Logic",
      "Design Thinking",
      "Introduction to IoT",
      "Semiconductor Physics and Devices Lab",
      "Programming for Problem Solving Lab",
      "Web Designing",
      "Communication Skills",
    ],
    "2": [
      "Linear Algebra for Engineers",
      "Environmental Chemistry",
      "Computer Organization and Logic Design",
      "Data Structure",
      "Introduction to AI",
      "Computer Organization and Logic Design Lab",
      "Python for Engineers",
      "Innovation and Entrepreneurship",
      "Foreign Language",
      "Indian Knowledge System",
    ],
  },
  ds: {
    "1": [
      "Calculus for Engineers",
      "Semiconductor Physics and Devices",
      "Programming for Problem Solving",
      "Discrete Structures and Theory of Logic",
      "Design Thinking",
      "Introduction to IoT",
      "Semiconductor Physics and Devices Lab",
      "Programming for Problem Solving Lab",
      "Web Designing",
      "Communication Skills",
      "Indian Knowledge System",
    ],
    "2": [
      "Linear Algebra for Engineers",
      "Computer Organization and Logic Design",
      "Data Structure",
      "Design and Realization",
      "Introduction to Data Science",
      "Computer Organization and Logic Design Lab",
      "Python for Engineers",
      "Innovation and Entrepreneurship",
      "Foreign Language",
    ],
  },
  cse_cs: {
    "1": [
      "Calculus for Engineers",
      "Semiconductor Physics and Devices",
      "Programming for Problem Solving",
      "Discrete Structures and Theory of Logic",
      "Design Thinking",
      "Introduction to IoT",
      "Semiconductor Physics and Devices Lab",
      "Programming for Problem Solving Lab",
      "Web Designing",
      "Communication Skills",
    ],
    "2": [
      "Linear Algebra for Engineers",
      "Environmental Chemistry",
      "Computer Organization and Logic Design",
      "Data Structure",
      "Introduction to Cyber Security",
      "Computer Organization and Logic Design Lab",
      "Python for Engineers",
      "Innovation and Entrepreneurship",
      "Foreign Language",
      "Indian Knowledge System",
    ],
  },
  me: {
    "1": [
      "Calculus for Engineers",
      "Semiconductor Physics and Devices",
      "Programming for Problem Solving",
      "Explorations in Electrical Engineering",
      "Design Thinking",
      "Introduction to IoT",
      "Semiconductor Physics and Devices Lab",
      "Programming for Problem Solving Lab",
      "Explorations in Electrical Engineering Lab",
      "Communication Skills",
      "Indian Knowledge System",
    ],
    "2": [
      "Differential Equations & Complex Integration",
      "Environmental Chemistry",
      "Engineering Mechanics",
      "Data Structure",
      "Design and Realization",
      "Emerging Technologies for Engineers",
      "Python for Engineers",
      "Innovation and Entrepreneurship",
      "Foreign Language",
    ],
  },
  amia: {
    "1": [
      "Calculus for Engineers",
      "Environmental Chemistry",
      "Fundamentals of Mechatronics and Industrial Automation",
      "Programming for Problem Solving",
      "Explorations in Electrical Engineering",
      "Design Thinking",
      "Introduction to IoT",
      "Programming for Problem Solving Lab",
      "Explorations in Electrical Engineering Lab",
      "Communication Skills",
      "Indian Knowledge System",
    ],
    "2": [
      "Differential Equations & Complex Integration",
      "Semiconductor Physics and Devices",
      "Data Structure",
      "Design and Realization",
      "Emerging Technologies for Engineers",
      "Semiconductor Physics and Devices Lab",
      "Python for Engineers",
      "Innovation and Entrepreneurship",
      "Foreign Language",
    ],
  },
  elce: {
    "1": [
      "Calculus for Engineers",
      "Semiconductor Physics and Devices",
      "Programming for Problem Solving",
      "Explorations in Electrical Engineering",
      "Design Thinking",
      "Introduction to IoT",
      "Semiconductor Physics and Devices Lab",
      "Programming for Problem Solving Lab",
      "Explorations in Electrical Engineering Lab",
      "Communication Skills",
    ],
    "2": [
      "Linear Algebra for Engineers",
      "Environmental Chemistry",
      "Computer Organization and Logic Design",
      "Data Structure",
      "Design and Realization",
      "Computer Organization and Logic Design Lab",
      "Python for Engineers",
      "Computer Aided Electrical Design",
      "Innovation and Entrepreneurship",
      "Foreign Language",
      "Indian Knowledge System",
    ],
  },
  eee: {
    "1": [
      "Calculus for Engineers",
      "Semiconductor Physics and Devices",
      "Programming for Problem Solving",
      "Explorations in Electrical Engineering",
      "Design Thinking",
      "Introduction to IoT",
      "Semiconductor Physics and Devices Lab",
      "Programming for Problem Solving Lab",
      "Explorations in Electrical Engineering Lab",
      "Communication Skills",
      "Indian Knowledge System",
    ],
    "2": [
      "Linear Algebra for Engineers",
      "Environmental Chemistry",
      "Digital Logic Design",
      "Data Structure",
      "Design and Realization",
      "Emerging Technologies for Engineers",
      "Python for Engineers",
      "Innovation and Entrepreneurship",
      "Foreign Language",
    ],
  },
  ece: {
    "1": [
      "Calculus for Engineers",
      "Environmental Chemistry",
      "Programming for Problem Solving",
      "Computer Organization and Logic Design",
      "Design Thinking",
      "Intelligent Health Care Systems",
      "Introduction to IoT",
      "Computer Organization and Logic Design Lab",
      "Programming for Problem Solving Lab",
      "Intelligent Health Care Systems Lab",
      "Communication Skills",
      "Indian Knowledge System",
    ],
    "2": [
      "Linear Algebra for Engineers",
      "Semiconductor Physics and Devices",
      "Explorations in Electrical Engineering",
      "Data Structure",
      "Design and Realization",
      "Semiconductor Physics and Devices Lab",
      "Python for Engineers",
      "Innovation and Entrepreneurship",
      "Foreign Language",
    ],
  },
  ece_vlsi: {
    "1": [
      "Calculus for Engineers",
      "Environmental Chemistry",
      "Explorations in Electrical Engineering",
      "Programming for Problem Solving",
      "Computer Organization and Logic Design",
      "Design Thinking",
      "Design and Realization",
      "Computer Organization and Logic Design Lab",
      "Programming for Problem Solving Lab",
      "Communication Skills",
      "Indian Knowledge System",
    ],
    "2": [
      "Linear Algebra for Engineers",
      "Semiconductor Physics and Devices",
      "Digital Logic Design using HDL",
      "Data Structure",
      "Basic Electronics Engineering",
      "Semiconductor Physics and Devices Lab",
      "Digital Logic Design using HDL Lab",
      "Python for Engineers",
      "Innovation and Entrepreneurship",
      "Foreign Language",
    ],
  },
  ce: {
    "1": ["Engineering Mathematics", "Engineering Physics", "Engineering Chemistry"],
    "2": ["Engineering Mechanics", "Data Structure", "Communication Skills"],
  },
};

export const AIML_SEM2_SUBJECTS = KIET_BRANCH_SEM_SUBJECTS.aiml["2"];

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

export function getSubjectsForBranchAndSemester(branch?: string | null, semester?: string | null): string[] {
  const normalizedBranch = normalizeBranchCode(branch);
  const normalizedSemester = (semester ?? "").trim();

  if (!normalizedBranch) return [];
  const branchCatalog = KIET_BRANCH_SEM_SUBJECTS[normalizedBranch];
  if (!branchCatalog) return [];

  if (normalizedSemester && branchCatalog[normalizedSemester]?.length) {
    return branchCatalog[normalizedSemester];
  }

  const merged = Object.values(branchCatalog).flatMap((subjects) => subjects);
  return [...new Set(merged)];
}
