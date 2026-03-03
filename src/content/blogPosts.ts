export interface BlogSection {
  heading: string;
  body: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  readTime: string;
  keywords: string[];
  sections: BlogSection[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-study-faster-with-ai-pdf-chat",
    title: "How To Study Faster With AI PDF Chat for College Exams",
    description:
      "Use AI chat with your lecture PDFs to revise concepts, generate quiz questions, and prepare faster before exams.",
    category: "AI Study",
    publishedAt: "2026-03-01",
    readTime: "5 min read",
    keywords: [
      "ai pdf chat for students",
      "exam preparation with ai",
      "study from pdf faster",
      "college exam revision strategy",
    ],
    sections: [
      {
        heading: "Turn Static PDFs Into Interactive Revision Sessions",
        body:
          "Most students open large notes files and lose focus quickly. With StudyShare AI chat, you can ask direct questions from your PDFs and get targeted explanations instead of reading every page line by line.",
      },
      {
        heading: "Ask Better Prompts for Better Answers",
        body:
          "Use prompts like: summarize chapter 4 in 8 bullet points, give me likely viva questions from this file, and explain this topic as if I am revising one day before exam. Better prompts save revision time and improve clarity.",
      },
      {
        heading: "Create a 3-Step Revision Loop",
        body:
          "Step 1: Ask for a concise chapter summary. Step 2: Ask for likely questions and solve them. Step 3: Request a final quick recap. This loop helps you revise large units in shorter study windows.",
      },
    ],
  },
  {
    slug: "college-chatrooms-for-exam-doubt-solving",
    title: "Why College Chatrooms Help Students Solve Doubts Faster",
    description:
      "Department chatrooms make exam prep collaborative by connecting juniors, seniors, and classmates in one focused space.",
    category: "Community",
    publishedAt: "2026-02-24",
    readTime: "4 min read",
    keywords: [
      "college chatroom app",
      "student doubt solving platform",
      "peer learning community",
      "exam discussion groups",
    ],
    sections: [
      {
        heading: "One Topic, One Thread, Better Context",
        body:
          "Instead of scattered WhatsApp messages, topic-based threads keep each discussion organized. Students can read earlier answers and avoid repeating the same question before exams.",
      },
      {
        heading: "Seniors Add Practical Exam Strategy",
        body:
          "Seniors often share what actually gets asked in internals, practicals, and viva rounds. This practical guidance helps junior students prioritize the right resources.",
      },
      {
        heading: "Build a Campus Knowledge Base Over Time",
        body:
          "As more questions are answered in the same community, your college gets a reusable knowledge base. New students can quickly find guidance for common problems.",
      },
    ],
  },
  {
    slug: "organize-notes-pyqs-and-notices-semester-wise",
    title: "How To Organize Notes, PYQs, and Notices Semester-Wise",
    description:
      "A simple structure for managing study notes, previous year questions, and official notices without losing track.",
    category: "Productivity",
    publishedAt: "2026-02-17",
    readTime: "6 min read",
    keywords: [
      "organize study notes semester wise",
      "previous year questions management",
      "department notice tracking",
      "college resource organization",
    ],
    sections: [
      {
        heading: "Create Subject Buckets First",
        body:
          "Start with one folder or collection per subject. Inside each subject, keep only three buckets: notes, PYQs, and revision sheets. This keeps navigation predictable and fast.",
      },
      {
        heading: "Separate Official Notices From Peer Content",
        body:
          "Students often miss deadlines because updates are mixed with general chats. Keep notices in a dedicated stream so exam forms, practical schedules, and departmental announcements are never buried.",
      },
      {
        heading: "Review Weekly, Not Daily",
        body:
          "Do one weekly cleanup: archive outdated files, pin critical resources, and bookmark must-read notes. Weekly maintenance is enough to keep your semester stack clean.",
      },
    ],
  },
  {
    slug: "best-daily-routine-for-college-students-using-study-timers",
    title: "Best Daily Routine for College Students Using Study Timers",
    description:
      "Use short focus cycles, micro-breaks, and weekly tracking to improve consistency without burnout.",
    category: "Study Routine",
    publishedAt: "2026-02-10",
    readTime: "5 min read",
    keywords: [
      "study timer for college students",
      "pomodoro for exam prep",
      "daily study routine",
      "focus session planning",
    ],
    sections: [
      {
        heading: "Use 45-10 Focus Blocks",
        body:
          "A practical pattern for most students is 45 minutes of focused study and 10 minutes break. Repeat this 3 to 4 times, then take a longer reset break.",
      },
      {
        heading: "Assign Each Block a Single Objective",
        body:
          "Do not mix multiple goals in one focus cycle. Example: one block for revising formulas, one for PYQ solving, one for discussion or doubt clarification.",
      },
      {
        heading: "Track Wins Weekly",
        body:
          "Measure progress by completed chapters and solved question sets, not by hours alone. Weekly outcomes are more reliable than daily fluctuations.",
      },
    ],
  },
];

export const getBlogPostBySlug = (slug: string) =>
  blogPosts.find((post) => post.slug === slug);
