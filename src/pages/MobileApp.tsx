import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as FramerMotion, useReducedMotion } from "framer-motion";
import { animate, stagger } from "animejs";
import { motion as Motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Download,
  FileText,
  House,
  Megaphone,
  MessagesSquare,
  Moon,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/useTheme";
import { ANDROID_APP_VERSION, openAndroidApkDownload } from "@/lib/apk";
import { cn } from "@/lib/utils";

type NavTab = 0 | 1 | 2 | 3;

type ShowcaseScene = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  navTab: NavTab;
  note: string;
  badges: string[];
  metric: string;
};

const showcaseScenes: ShowcaseScene[] = [
  {
    id: "ai-chat",
    eyebrow: "AI assistant",
    title: "Ask from notes, attachments, and the web in one mobile flow.",
    description:
      "StudyShare AI can work from class notes, uploaded PDFs or images, and web fallback when local material is not enough. The mobile assistant keeps live activity visible while the answer is being prepared.",
    image: "/images/superdesign/mobile/studyshare-ai-chat-mobile-reproduction.png",
    navTab: 0,
    note: "Notes-first answers with live activity and sources.",
    badges: ["Notes mode", "Web mode", "Attachments"],
    metric: "AI help",
  },
  {
    id: "study-feed",
    eyebrow: "Study feed",
    title: "Semester-wise notes, PYQs, videos, and downloads stay in one feed.",
    description:
      "The main study surface is built around semester, branch, subject, and type filters, with sort options like recent, most upvoted, and teacher-led material.",
    image: "/images/superdesign/mobile/studyshare-mobile-study-screen.png",
    navTab: 0,
    note: "Built for daily study, not just one-off browsing.",
    badges: ["Notes", "PYQs", "Videos", "Downloads"],
    metric: "Resources",
  },
  {
    id: "rooms",
    eyebrow: "Campus rooms",
    title: "Discover public rooms and move into college communities quickly.",
    description:
      "Students can browse open rooms, search communities, and join private spaces by code when needed, all without leaving the same app shell.",
    image: "/images/superdesign/mobile/studyshare-rooms-mobile.png",
    navTab: 1,
    note: "Rooms use a real search-first footer state.",
    badges: ["Discover rooms", "Join by code", "Community posts"],
    metric: "Community",
  },
  {
    id: "notices",
    eyebrow: "Department notices",
    title: "Official updates are organized like a usable campus news feed.",
    description:
      "Notice feeds are grouped under department handles, and students can search updates or narrow them with date filters when deadlines pile up.",
    image: "/images/superdesign/mobile/studyshare-notices-feed.png",
    navTab: 2,
    note: "Search and date filters make notice feeds practical.",
    badges: ["Departments", "Date filters", "Official handles"],
    metric: "Notices",
  },
  {
    id: "attendance",
    eyebrow: "Attendance",
    title: "KIET students can sync attendance and spot risk earlier.",
    description:
      "StudyShare stores attendance snapshots, supports day-wise drilldown, and highlights low-attendance risk for colleges where the ERP connection is available.",
    image: "/images/superdesign/mobile/studyshare-premium-attendance-ui.png",
    navTab: 0,
    note: "Attendance is integrated where the college workflow supports it.",
    badges: ["KIET sync", "Low attendance alerts", "Day-wise view"],
    metric: "Attendance",
  },
];

const productHighlights = [
  {
    icon: Sparkles,
    title: "AI grounded in study material",
    copy:
      "The assistant can answer from notes, attachments, and web fallback while keeping a visible live activity trail on mobile.",
  },
  {
    icon: BookOpen,
    title: "Semester-wise resource discovery",
    copy:
      "Students can browse notes, PYQs, videos, and downloads with filters for semester, branch, subject, and sort preference.",
  },
  {
    icon: Megaphone,
    title: "Department-first updates",
    copy:
      "Official notices are easier to trust and revisit because they are tied to department accounts, search, and date filtering.",
  },
  {
    icon: MessagesSquare,
    title: "College rooms and community threads",
    copy:
      "Public rooms, join-by-code spaces, and discussion posts keep the app useful beyond files and announcements.",
  },
] as const;

const marqueeChips = [
  "Notes",
  "PYQs",
  "Syllabus",
  "PDF viewer",
  "AI chat",
  "Attachments",
  "Rooms",
  "Department notices",
  "Attendance",
  "Bookmarks",
  "Smaller APK",
];

const bottomNavItems = [
  { label: "Home", icon: House, index: 0 },
  { label: "Rooms", icon: MessagesSquare, index: 1 },
  { label: "Notices", icon: Megaphone, index: 2 },
  { label: "Profile", icon: UserRound, index: 3 },
] as const;

function MarqueeRow({
  items,
  isDark,
  reverse = false,
  reduceMotion,
}: {
  items: string[];
  isDark: boolean;
  reverse?: boolean;
  reduceMotion: boolean;
}) {
  const loopItems = [...items, ...items, ...items];
  return (
    <div
      className={cn(
        "overflow-hidden rounded-full border px-3 py-3 backdrop-blur",
        isDark
          ? "border-white/10 bg-white/5 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
          : "border-black/8 bg-white/85 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
      )}
    >
      <Motion.div
        className="flex w-max items-center gap-2"
        animate={
          reduceMotion
            ? undefined
            : { x: reverse ? ["-33.333%", "0%"] : ["0%", "-33.333%"] }
        }
        transition={{ duration: reverse ? 30 : 24, repeat: Infinity, ease: "linear" }}
      >
        {loopItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className={cn(
              "rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em]",
              isDark
                ? "border-white/10 bg-[#0f172a]/80 text-slate-200"
                : "border-black/8 bg-[#f7f3ea] text-slate-700"
            )}
          >
            {item}
          </span>
        ))}
      </Motion.div>
    </div>
  );
}

function StageCard({
  label,
  title,
  copy,
  isDark,
}: {
  label: string;
  title: string;
  copy: string;
  isDark: boolean;
}) {
  return (
    <div
      data-stage-card
      className={cn(
        "rounded-[26px] border p-4 backdrop-blur",
        isDark
          ? "border-white/10 bg-white/6 shadow-[0_16px_34px_rgba(0,0,0,0.22)]"
          : "border-black/8 bg-white/85 shadow-[0_16px_34px_rgba(15,23,42,0.06)]"
      )}
    >
      <p className={cn("text-[10px] font-semibold uppercase tracking-[0.26em]", isDark ? "text-[#7ce7d4]" : "text-[#0f766e]")}>
        {label}
      </p>
      <h3 className={cn("mt-2 text-base font-semibold", isDark ? "text-white" : "text-slate-950")}>{title}</h3>
      <p className={cn("mt-2 text-sm leading-6", isDark ? "text-slate-300/78" : "text-slate-600")}>{copy}</p>
    </div>
  );
}

function NavItem({
  item,
  activeTab,
}: {
  item: (typeof bottomNavItems)[number];
  activeTab: NavTab;
}) {
  const isActive = item.index === activeTab;
  const Icon = item.icon;
  return (
    <div className="flex flex-col items-center justify-end gap-0.5 py-0.5 text-center">
      <FramerMotion.div animate={{ scale: isActive ? 1.08 : 1, y: isActive ? -1 : 0 }} transition={{ duration: 0.18 }}>
        <Icon className={cn("h-[15px] w-[15px]", isActive ? "text-[#3b82f6]" : "text-white/56")} />
      </FramerMotion.div>
      <span className={cn("text-[8px] font-medium", isActive ? "text-[#3b82f6]" : "text-white/52")}>{item.label}</span>
    </div>
  );
}

function BottomNavPreview({
  activeTab,
  reduceMotion,
}: {
  activeTab: NavTab;
  reduceMotion: boolean;
}) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-20">
      <div className="relative rounded-[22px] border border-white/12 bg-[rgba(9,11,17,0.94)] px-2 pb-2 pt-2 shadow-[0_22px_46px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        <FramerMotion.div
          className="absolute left-1/2 top-0 grid h-[38px] w-[38px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#7fb6ff]/18 bg-[#2f6dff] text-white shadow-[0_8px_24px_rgba(47,109,255,0.65)]"
          animate={reduceMotion ? undefined : { y: [0, -2, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </FramerMotion.div>
        <div className="grid grid-cols-[1fr_1fr_52px_1fr_1fr] items-end gap-x-1 text-[9px] font-medium text-white/72">
          <NavItem item={bottomNavItems[0]} activeTab={activeTab} />
          <NavItem item={bottomNavItems[1]} activeTab={activeTab} />
          <div aria-hidden="true" className="h-6" />
          <NavItem item={bottomNavItems[2]} activeTab={activeTab} />
          <NavItem item={bottomNavItems[3]} activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}

function PhoneFrame({
  scene,
  reduceMotion,
  isDark,
}: {
  scene: ShowcaseScene;
  reduceMotion: boolean;
  isDark: boolean;
}) {
  return (
    <FramerMotion.div
      animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
      transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      className="mx-auto w-full max-w-[312px] sm:max-w-[324px] xl:max-w-[332px]"
    >
      <div className="relative rounded-[38px] border border-black/10 bg-black p-2.5 shadow-[0_34px_70px_rgba(15,23,42,0.28)]">
        <div className="absolute left-1/2 top-3.5 z-20 h-1.5 w-24 -translate-x-1/2 rounded-full bg-white/14" />
        <div className="relative aspect-[468/1015] overflow-hidden rounded-[30px] bg-[#050505]">
          <AnimatePresence mode="wait">
            <FramerMotion.img
              key={scene.id}
              src={scene.image}
              alt={scene.title}
              className="h-full w-full object-cover object-top"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 18, scale: 1.02 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -12, scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.4 }}
              loading="lazy"
            />
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_38%),linear-gradient(180deg,rgba(0,0,0,0.02),transparent_32%,rgba(0,0,0,0.2))]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/22 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-black via-black/94 to-transparent" />
          <BottomNavPreview activeTab={scene.navTab} reduceMotion={reduceMotion} />
        </div>
      </div>

      <div
        className={cn(
          "mt-4 rounded-[28px] border p-4 backdrop-blur",
          isDark
            ? "border-white/10 bg-white/6 shadow-[0_16px_34px_rgba(0,0,0,0.24)]"
            : "border-black/8 bg-white/92 shadow-[0_16px_34px_rgba(15,23,42,0.07)]"
        )}
      >
        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.24em]", isDark ? "text-[#7ce7d4]" : "text-[#0f766e]")}>
          {scene.eyebrow}
        </p>
        <h3 className={cn("mt-2 text-xl font-semibold", isDark ? "text-white" : "text-slate-950")}>{scene.title}</h3>
        <p className={cn("mt-3 text-sm leading-6", isDark ? "text-slate-300/78" : "text-slate-600")}>{scene.description}</p>
      </div>
    </FramerMotion.div>
  );
}

function HighlightCard({
  icon: Icon,
  title,
  copy,
  isDark,
  delay,
  reduceMotion,
}: {
  icon: LucideIcon;
  title: string;
  copy: string;
  isDark: boolean;
  delay: number;
  reduceMotion: boolean;
}) {
  return (
    <FramerMotion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.12 : 0.3, delay }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      className={cn(
        "rounded-[28px] border p-5 backdrop-blur-xl",
        isDark
          ? "border-white/10 bg-white/6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
          : "border-black/8 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", isDark ? "bg-[#7ce7d4]/12 text-[#7ce7d4]" : "bg-[#0f766e]/12 text-[#0f766e]")}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className={cn("text-base font-semibold", isDark ? "text-white" : "text-slate-950")}>{title}</h3>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">StudyShare mobile</p>
        </div>
      </div>
      <p className={cn("mt-4 text-sm leading-6", isDark ? "text-slate-300/76" : "text-slate-600")}>{copy}</p>
    </FramerMotion.div>
  );
}

const MobileApp = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const reduceMotion = Boolean(useReducedMotion());
  const isDark = theme === "dark";
  const [activeSceneIndex, setActiveSceneIndex] = useState(1);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => {
      setActiveSceneIndex((current) => (current + 1) % showcaseScenes.length);
    }, 4300);
    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !stageRef.current) return;
    const stageCards = stageRef.current.querySelectorAll<HTMLElement>("[data-stage-card]");
    const sceneChips = stageRef.current.querySelectorAll<HTMLElement>("[data-scene-chip]");
    const stageAnimation = stageCards.length
      ? animate(stageCards, {
          y: [10, 0],
          opacity: [0, 1],
          delay: stagger(70),
          duration: 520,
          ease: "out(3)",
        })
      : null;
    const chipAnimation = sceneChips.length
      ? animate(sceneChips, {
          y: [12, 0],
          opacity: [0, 1],
          delay: stagger(45, { from: "center" }),
          duration: 420,
          ease: "out(3)",
        })
      : null;
    return () => {
      stageAnimation?.revert();
      chipAnimation?.revert();
    };
  }, [activeSceneIndex, reduceMotion]);

  const activeScene = showcaseScenes[activeSceneIndex];
  const sceneLabels = useMemo(
    () => showcaseScenes.map((scene, index) => ({ id: scene.id, label: scene.eyebrow, index })),
    []
  );

  const handleDownload = async () => {
    const opened = await openAndroidApkDownload();
    if (!opened) {
      toast.error("APK download is temporarily unavailable. Please contact support.");
    }
  };

  return (
    <div className={cn("min-h-screen overflow-hidden transition-colors", isDark ? "bg-[#071019] text-[#f5f7fb]" : "bg-[#f5efe4] text-slate-950")}>
      <SEO
        title="StudyShare Android App"
        description="See what the StudyShare Android app offers, switch between light and dark mode, and download the smaller split APK."
        noIndex
      />

      <div className="pointer-events-none fixed inset-0">
        <Motion.div
          className={cn("absolute left-[4%] top-[6%] h-[22rem] w-[22rem] rounded-full blur-3xl", isDark ? "bg-[#0f766e]/20" : "bg-[#0f766e]/10")}
          animate={reduceMotion ? undefined : { x: [0, 18, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <Motion.div
          className={cn("absolute right-[2%] top-[14%] h-[18rem] w-[18rem] rounded-full blur-3xl", isDark ? "bg-[#2563eb]/16" : "bg-[#f59e0b]/10")}
          animate={reduceMotion ? undefined : { x: [0, -14, 0], y: [0, 16, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <Motion.div
          className={cn("absolute bottom-[-6rem] left-[18%] h-[24rem] w-[24rem] rounded-full blur-3xl", isDark ? "bg-[#7c3aed]/14" : "bg-[#d97706]/8")}
          animate={reduceMotion ? undefined : { x: [0, 12, 0], y: [0, -10, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className={cn(
            "absolute inset-0",
            isDark
              ? "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_22%),radial-gradient(circle_at_80%_20%,rgba(15,118,110,0.12),transparent_30%),linear-gradient(180deg,rgba(8,15,25,0.9),rgba(7,16,25,0.98))]"
              : "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.82),_transparent_24%),radial-gradient(circle_at_80%_20%,rgba(15,118,110,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.5),rgba(245,239,228,0.75))]"
          )}
        />
        <div
          className={cn(
            "absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:72px_72px]",
            isDark ? "opacity-[0.12]" : "opacity-[0.18]"
          )}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className={cn(
                isDark
                  ? "border-white/12 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-white/70 text-slate-900 hover:bg-white"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={toggleTheme}
              className={cn(
                isDark
                  ? "border-white/12 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-white/70 text-slate-900 hover:bg-white"
              )}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? "Light mode" : "Dark mode"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/select-college")}
              className={cn(
                isDark
                  ? "border-white/12 bg-white/5 text-white hover:bg-white/10"
                  : "border-black/10 bg-white/70 text-slate-900 hover:bg-white"
              )}
            >
              <ArrowRight className="h-4 w-4" />
              College page
            </Button>
            <Button
              onClick={() => void handleDownload()}
              className={cn(isDark ? "bg-[#7ce7d4] text-slate-950 hover:bg-[#9af3e3]" : "bg-slate-950 text-white hover:bg-slate-800")}
            >
              <Download className="h-4 w-4" />
              Download APK
            </Button>
          </div>
        </div>

        <section
          className={cn(
            "mt-6 overflow-hidden rounded-[38px] border backdrop-blur-2xl",
            isDark
              ? "border-white/10 bg-white/5 shadow-[0_28px_90px_rgba(0,0,0,0.3)]"
              : "border-black/8 bg-white/72 shadow-[0_28px_90px_rgba(15,23,42,0.12)]"
          )}
        >
          <div className="gap-8 p-5 md:p-7 xl:p-8">
            <FramerMotion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.45 }}
              className="flex flex-col justify-start pt-3 md:pt-5 xl:pt-6"
            >
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] shadow-sm",
                  isDark ? "border-white/12 bg-white/6 text-[#7ce7d4]" : "border-black/8 bg-white/75 text-[#0f766e]"
                )}
              >
                <Phone className="h-3.5 w-3.5" />
                Android app
              </div>

              <h1 className={cn("mt-4 max-w-3xl font-editorial text-5xl leading-[0.96] tracking-tight md:text-6xl xl:text-7xl", isDark ? "text-white" : "text-slate-950")}>
                One app for notes, PYQs, notices, rooms, attendance, and AI help.
              </h1>

              <p className={cn("mt-4 max-w-2xl text-base leading-7 md:text-lg", isDark ? "text-slate-300/82" : "text-slate-600")}>
                StudyShare is the student workspace for your college. Browse semester-wise resources, open PDFs, follow department notices, discover rooms, track attendance where supported, and ask the AI assistant using your notes, files, or the web.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => void handleDownload()}
                  className={cn(isDark ? "bg-[#7ce7d4] text-slate-950 hover:bg-[#9af3e3]" : "bg-slate-950 text-white hover:bg-slate-800")}
                >
                  <Download className="h-4 w-4" />
                  Download APK
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/select-college")}
                  className={cn(
                    isDark
                      ? "border-white/12 bg-white/5 text-white hover:bg-white/10"
                      : "border-black/10 bg-white/75 text-slate-900 hover:bg-white"
                  )}
                >
                  Choose college
                </Button>
              </div>
            </FramerMotion.div>

            <div ref={stageRef} className="relative mt-4">
              {/* Scene indicator */}
              <div className="mb-4 flex items-center justify-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]",
                    isDark
                      ? "border-[#7ce7d4]/20 bg-[#7ce7d4]/10 text-[#7ce7d4]"
                      : "border-[#0f766e]/18 bg-[#0f766e]/8 text-[#0f766e]"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isDark ? "bg-[#7ce7d4]" : "bg-[#0f766e]"
                    )}
                  />
                  {activeScene.eyebrow} — {activeScene.title}
                </span>
              </div>

              {/* Phone frame centred */}
              <div className="flex justify-center">
                <div className="w-full max-w-[320px] sm:max-w-[340px]">
                  <PhoneFrame scene={activeScene} reduceMotion={reduceMotion} isDark={isDark} />
                </div>
              </div>

              {/* Scene selector chips */}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {sceneLabels.map((scene) => {
                  const isActive = scene.index === activeSceneIndex;
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      data-scene-chip
                      onClick={() => setActiveSceneIndex(scene.index)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                        isActive
                          ? isDark
                            ? "border-[#7ce7d4]/25 bg-[#7ce7d4]/10 text-[#7ce7d4]"
                            : "border-[#0f766e]/20 bg-[#0f766e]/10 text-[#0f766e]"
                          : isDark
                            ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/8"
                            : "border-black/8 bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900"
                      )}
                    >
                      {scene.index + 1}. {scene.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <MarqueeRow items={marqueeChips} isDark={isDark} reduceMotion={reduceMotion} />
          <MarqueeRow items={[...marqueeChips].reverse()} isDark={isDark} reverse reduceMotion={reduceMotion} />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {productHighlights.map((card, index) => (
            <HighlightCard
              key={card.title}
              icon={card.icon}
              title={card.title}
              copy={card.copy}
              isDark={isDark}
              delay={index * 0.06}
              reduceMotion={reduceMotion}
            />
          ))}
        </section>

        <section className="mt-8 grid gap-5 xl:grid-cols-[1.04fr_0.96fr]">
          <Card className={cn("border p-6 backdrop-blur-xl md:p-7", isDark ? "border-white/10 bg-white/6" : "border-black/8 bg-white/85")}>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.28em]", isDark ? "text-[#7ce7d4]" : "text-[#0f766e]")}>
              What students use it for
            </p>
            <h2 className={cn("mt-3 text-2xl font-bold md:text-3xl", isDark ? "text-white" : "text-slate-950")}>
              StudyShare is built around actual college workflows, not a single flashy feature.
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                {
                  icon: Sparkles,
                  title: "AI for study tasks",
                  copy: "Ask from notes, generate follow-up answers, and keep source-aware responses on mobile.",
                },
                {
                  icon: FileText,
                  title: "Daily academic material",
                  copy: "Open PDFs, browse notes and PYQs, and move through semester-wise resources without leaving the app.",
                },
                {
                  icon: Bell,
                  title: "Department updates",
                  copy: "Track official notices, search older updates, and filter by date when deadlines are close.",
                },
                {
                  icon: ShieldCheck,
                  title: "Campus-specific utilities",
                  copy: "Attendance support for KIET and college-aware access flows keep the app rooted in how students actually use it on campus.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={cn("rounded-2xl border p-4", isDark ? "border-white/10 bg-[#0f172a]/70" : "border-black/8 bg-[#f8f4ec]")}
                  >
                    <p className={cn("flex items-center gap-2 text-sm font-semibold", isDark ? "text-white" : "text-slate-900")}>
                      <Icon className={cn("h-4 w-4", isDark ? "text-[#7ce7d4]" : "text-[#0f766e]")} />
                      {item.title}
                    </p>
                    <p className={cn("mt-2 text-sm leading-6", isDark ? "text-slate-300/76" : "text-slate-600")}>{item.copy}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className={cn("border p-6 backdrop-blur-xl md:p-7", isDark ? "border-white/10 bg-white/6" : "border-black/8 bg-white/85")}>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.28em]", isDark ? "text-[#7ce7d4]" : "text-[#0f766e]")}>
              Inside the app
            </p>
            <div className="mt-4 space-y-3">
              {[
                {
                  icon: BookOpen,
                  title: "Resource tabs that match study habits",
                  copy: "For You, Following, and Syllabus flows keep teacher uploads and relevant material easier to reach.",
                },
                {
                  icon: MessagesSquare,
                  title: "Rooms that feel like student spaces",
                  copy: "Discover public rooms, search communities, and join private groups by code when you need a focused discussion space.",
                },
                {
                  icon: Megaphone,
                  title: "Notice feeds with real structure",
                  copy: "Department accounts, search, and date windows make the notice screen useful after the first glance too.",
                },
                {
                  icon: ShieldCheck,
                  title: "A lighter Android install",
                  copy: "Most modern devices can use the smaller arm64 build, which keeps the download leaner without changing the StudyShare experience inside the app.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={cn("rounded-2xl border p-4", isDark ? "border-white/10 bg-[#0f172a]/70" : "border-black/8 bg-[#f8f4ec]")}
                  >
                    <p className={cn("flex items-center gap-2 text-sm font-semibold", isDark ? "text-white" : "text-slate-900")}>
                      <Icon className={cn("h-4 w-4", isDark ? "text-[#7ce7d4]" : "text-[#0f766e]")} />
                      {item.title}
                    </p>
                    <p className={cn("mt-2 text-sm leading-6", isDark ? "text-slate-300/76" : "text-slate-600")}>{item.copy}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        <section className="mt-8">
          <Card className={cn("border p-6 backdrop-blur-xl md:p-7", isDark ? "border-[#7ce7d4]/18 bg-[#7ce7d4]/10" : "border-[#0f766e]/18 bg-[#0f766e]/10")}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={cn("text-xs font-semibold uppercase tracking-[0.28em]", isDark ? "text-[#7ce7d4]" : "text-[#0f766e]")}>
                  Ready to install
                </p>
                <h2 className={cn("mt-2 text-2xl font-bold md:text-3xl", isDark ? "text-white" : "text-slate-950")}>
                  Install the lighter Android build for modern phones.
                </h2>
                <p className={cn("mt-3 max-w-2xl text-sm leading-7 md:text-base", isDark ? "text-slate-300/78" : "text-slate-600")}>
                  Open semester-wise resources, department notices, rooms, attendance, and AI help in one student app, then keep the lighter build on your phone for day-to-day use.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/select-college")}
                  className={cn(
                    isDark
                      ? "border-white/12 bg-white/5 text-white hover:bg-white/10"
                      : "border-black/10 bg-white/80 text-slate-900 hover:bg-white"
                  )}
                >
                  <ArrowRight className="h-4 w-4" />
                  College page
                </Button>
                <Button
                  onClick={() => void handleDownload()}
                  className={cn(isDark ? "bg-[#7ce7d4] text-slate-950 hover:bg-[#9af3e3]" : "bg-slate-950 text-white hover:bg-slate-800")}
                >
                  <Download className="h-4 w-4" />
                  Download smaller APK
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default MobileApp;
