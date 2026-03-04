import type { FaqItem, FeatureVisual, StudentSearchIntentTopic } from "./types";

export const LANDING_FEATURES: FeatureVisual[] = [
  {
    title: "AI Note Summaries",
    description: "Turn long notes into crisp revision points with context-aware summaries.",
    badge: "Revision",
  },
  {
    title: "Smart Resource Search",
    description: "Find PYQs, notes, and topic threads in seconds across your college content.",
    badge: "Search",
  },
  {
    title: "Collaborative Doubt Rooms",
    description: "Ask, discuss, and solve doubts with classmates and seniors in department channels.",
    badge: "Community",
  },
  {
    title: "Exam Prep Planner",
    description: "Get structured prep flow by topic weight, deadlines, and your weak areas.",
    badge: "Planning",
  },
];

export const STUDENT_SEARCH_INTENTS: StudentSearchIntentTopic[] = [
  {
    title: "Best notes and PYQs for exam prep",
    description: "Browse semester-ready notes, previous year questions, and revision material in one place.",
  },
  {
    title: "College notice updates without missing deadlines",
    description: "Track official department notices, exam updates, and campus announcements in a focused feed.",
  },
  {
    title: "AI helper for PDF-based revision",
    description: "Ask questions from your PDFs and get concise explanations before tests and viva rounds.",
  },
];

export const LANDING_FAQ: FaqItem[] = [
  {
    question: "Can I use StudyShare for both web and Android?",
    answer: "Yes. You can access StudyShare in your browser and also download the Android APK for mobile use.",
  },
  {
    question: "Is StudyShare only for one college?",
    answer: "No. StudyShare is campus-based and supports multiple colleges with separate student communities and resources.",
  },
  {
    question: "What can I do with the AI chat feature?",
    answer:
      "You can upload or reference study material, ask topic-specific questions, get summaries, and speed up revision before exams.",
  },
  {
    question: "How are chatrooms useful for exam preparation?",
    answer:
      "Chatrooms help students discuss doubts, share tips, and collaborate with seniors and classmates in focused discussion threads.",
  },
];

export const SECONDARY_BLOG_LINK = {
  title: "Visit Blog",
  href: "/blog",
};
