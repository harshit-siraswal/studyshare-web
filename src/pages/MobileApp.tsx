import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as FramerMotion, useReducedMotion } from "framer-motion";
import { animate, stagger } from "animejs";
import { motion as Motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  Download,
  FileText,
  House,
  Layers3,
  Megaphone,
  MessagesSquare,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
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
  fabMode: "add" | "search";
  note: string;
  badges: string[];
  metric: string;
};

const showcaseScenes: ShowcaseScene[] = [
  {
    id: "ai-chat",
    eyebrow: "AI studio",
    title: "A live plan that collapses when the answer is ready.",
    description:
      "The mobile AI surface keeps the working trace visible while the model is thinking, then folds it away so the final response stays calm and easy to read.",
    image: "/images/superdesign/mobile/studyshare-ai-chat-mobile-reproduction.png",
    navTab: 0,
    fabMode: "add",
    note: "Reasoning stays visible during generation, then closes cleanly.",
    badges: ["Live plan", "Collapsed trace", "Clean final answer"],
    metric: "AI flow",
  },
  {
    id: "study-surface",
    eyebrow: "Study surface",
    title: "Notes, PDFs, and semester utilities with more breathing room.",
    description:
      "The app becomes a study companion rather than a chat shell: resources, reading surfaces, and quick actions stay close without feeling cluttered.",
    image: "/images/superdesign/mobile/studyshare-mobile-study-screen.png",
    navTab: 0,
    fabMode: "add",
    note: "One-handed browsing stays fast while the app still feels premium.",
    badges: ["Resources", "PDFs", "Study flow"],
    metric: "Campus work",
  },
  {
    id: "rooms",
    eyebrow: "Campus rooms",
    title: "Rooms switch the footer into a search posture instead of pretending otherwise.",
    description:
      "This screen mirrors the Flutter shell correctly: Home, Rooms, Notices, and Profile stay anchored while the center action becomes search for discovery.",
    image: "/images/superdesign/mobile/studyshare-rooms-mobile.png",
    navTab: 1,
    fabMode: "search",
    note: "The center button changes with context, not just with styling.",
    badges: ["Rooms", "Search-first", "Correct footer"],
    metric: "Discovery",
  },
  {
    id: "notices",
    eyebrow: "Notices",
    title: "Announcement-heavy screens that still feel editorial and readable.",
    description:
      "Deadlines, notices, and updates need hierarchy. The gallery keeps the content legible and lets the footers and overlays stay out of the way.",
    image: "/images/superdesign/mobile/studyshare-notices-feed.png",
    navTab: 2,
    fabMode: "add",
    note: "Important updates stay scannable, even on a small screen.",
    badges: ["Notices", "Deadlines", "Readable hierarchy"],
    metric: "Updates",
  },
  {
    id: "profile",
    eyebrow: "Profile",
    title: "A steadier profile and inbox surface for alerts, follows, and identity.",
    description:
      "The app still feels like a single system when the user moves from AI to rooms to alerts. The footer stays stable and the app identity stays consistent.",
    image: "/images/superdesign/mobile/studyshare-notifications.png",
    navTab: 3,
    fabMode: "add",
    note: "Profile and notifications keep the same visual language.",
    badges: ["Notifications", "Identity", "Consistent shell"],
    metric: "Signals",
  },
];

const featureCards = [
  {
    icon: Sparkles,
    title: "Motion-led presentation",
    copy:
      "The page now moves like a product film. Screens crossfade, the copy breathes, and the gallery shifts automatically so the mobile app feels alive.",
  },
  {
    icon: Layers3,
    title: "Correct mobile footer",
    copy:
      "The bottom navigation matches the real Flutter app: Home, Rooms, Notices, and Profile, with a center action that changes between add and search.",
  },
  {
    icon: Download,
    title: "Smaller APK download",
    copy:
      "The website now links the published arm64 split build instead of the 100+ MB universal APK, so the install is lighter and faster to share.",
  },
  {
    icon: ShieldCheck,
    title: "Campus-first identity",
    copy:
      "The app keeps college resources, AI help, notices, and rooms in one place so it feels like a real study product instead of a thin demo.",
  },
] as const;

const bottomNavItems = [
  { label: "Home", icon: House, index: 0 },
  { label: "Rooms", icon: MessagesSquare, index: 1 },
  { label: "Notices", icon: Megaphone, index: 2 },
  { label: "Profile", icon: UserRound, index: 3 },
] as const;

const marqueeChips = [
  "Live plan",
  "Collapsed trace",
  "Correct footer",
  "Rooms",
  "Notices",
  "Profile",
  "Notes",
  "Smaller APK",
  "Study flow",
];

function MarqueeRow({
  reverse = false,
  reduceMotion,
  items,
}: {
  reverse?: boolean;
  reduceMotion: boolean;
  items: string[];
}) {
  const loopItems = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden rounded-full border border-black/8 bg-white/85 px-3 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur">
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
            className="rounded-full border border-black/8 bg-[#f7f3ea] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700"
          >
            {item}
          </span>
        ))}
      </Motion.div>
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
  const isActive = activeTab === item.index;
  const Icon = item.icon;
  return (
    <div className="flex flex-col items-center justify-end gap-1.5 py-1 text-center">
      <FramerMotion.div animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }} transition={{ duration: 0.18 }}>
        <Icon className={cn("h-5 w-5", isActive ? "text-[#0f766e]" : "text-white/60")} />
      </FramerMotion.div>
      <span className={cn("text-[10px]", isActive ? "text-[#0f766e]" : "text-white/64")}>{item.label}</span>
    </div>
  );
}

function BottomNavPreview({
  activeTab,
  fabMode,
  reduceMotion,
}: {
  activeTab: NavTab;
  fabMode: "add" | "search";
  reduceMotion: boolean;
}) {
  return (
    <div className="absolute inset-x-4 bottom-4 z-20">
      <div className="relative rounded-[28px] border border-white/12 bg-slate-950/92 px-4 pb-3 pt-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <FramerMotion.div
          className="absolute left-1/2 top-0 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-gradient-to-br from-[#d6f7f0] via-[#7ce7d4] to-[#ffe4b5] text-slate-950 shadow-[0_18px_38px_rgba(20,184,166,0.28)]"
          animate={reduceMotion ? undefined : { y: [0, -2, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {fabMode === "search" ? <Search className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </FramerMotion.div>
        <div className="grid grid-cols-[1fr_1fr_72px_1fr_1fr] items-end gap-1 text-[10px] font-medium tracking-[0.2em] text-white/72">
          <NavItem item={bottomNavItems[0]} activeTab={activeTab} />
          <NavItem item={bottomNavItems[1]} activeTab={activeTab} />
          <div aria-hidden="true" />
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
  compact = false,
}: {
  scene: ShowcaseScene;
  reduceMotion: boolean;
  compact?: boolean;
}) {
  return (
    <FramerMotion.div
      animate={reduceMotion ? undefined : { y: compact ? [0, -6, 0] : [0, -12, 0] }}
      transition={{ duration: compact ? 7.5 : 6.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className={cn("relative mx-auto rounded-[38px] border border-black/8 bg-black p-2.5 shadow-[0_34px_70px_rgba(15,23,42,0.26)]", compact ? "w-[252px] opacity-85 saturate-75" : "w-full max-w-[352px]")}>
        <div className="absolute left-1/2 top-3 z-10 h-1.5 w-24 -translate-x-1/2 rounded-full bg-white/14" />
        <div className="relative overflow-hidden rounded-[30px] bg-[#050505]">
          <AnimatePresence mode="wait">
            <FramerMotion.img
              key={scene.id}
              src={scene.image}
              alt={scene.title}
              className={cn("w-full object-cover object-top", compact ? "h-[458px]" : "h-[600px]")}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 16, scale: 1.02 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -12, scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.42 }}
              loading="lazy"
            />
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_38%),linear-gradient(180deg,rgba(0,0,0,0.08),transparent_20%,rgba(0,0,0,0.55))]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/76 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/92 to-transparent" />
          <div className="pointer-events-none absolute left-4 top-4 right-4 z-10 flex items-center justify-between gap-3">
            <div className="rounded-full border border-white/12 bg-black/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur-md">
              StudyShare mobile
            </div>
            <div className="rounded-full border border-white/12 bg-black/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/74 backdrop-blur-md">
              v{ANDROID_APP_VERSION}
            </div>
          </div>
          <BottomNavPreview activeTab={scene.navTab} fabMode={scene.fabMode} reduceMotion={reduceMotion} />
        </div>
      </div>
      {!compact ? (
        <div className="mt-4 max-w-[352px] px-2">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#0f766e]">{scene.eyebrow}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">{scene.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{scene.description}</p>
        </div>
      ) : null}
    </FramerMotion.div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  copy,
  delay = 0,
  reduceMotion,
}: {
  icon: LucideIcon;
  title: string;
  copy: string;
  delay?: number;
  reduceMotion: boolean;
}) {
  return (
    <FramerMotion.div
      className="group rounded-[28px] border border-black/8 bg-white/85 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-colors hover:border-[#0f766e]/25 hover:bg-white"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.12 : 0.32, delay }}
      whileHover={reduceMotion ? undefined : { y: -4, rotate: -0.25 }}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0f766e]/12 text-[#0f766e]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">StudyShare mobile</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{copy}</p>
    </FramerMotion.div>
  );
}

const MobileApp = () => {
  const navigate = useNavigate();
  const reduceMotion = Boolean(useReducedMotion());
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const title = `StudyShare Android App v${ANDROID_APP_VERSION}`;

  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => {
      setActiveSceneIndex((current) => (current + 1) % showcaseScenes.length);
    }, 4200);
    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !stageRef.current) return;
    const orbitTargets = stageRef.current.querySelectorAll<HTMLElement>("[data-orbit]");
    const chips = stageRef.current.querySelectorAll<HTMLElement>("[data-chip]");
    const orbitAnimation = animate(orbitTargets, {
      y: [0, -12, 0],
      rotate: [-2, 2, -1],
      scale: [1, 1.05, 1],
      delay: stagger(85, { from: "center" }),
      duration: 4200,
      ease: "inOutSine",
      loop: true,
      alternate: true,
    });
    const chipAnimation = animate(chips, {
      y: [10, 0],
      opacity: [0, 1],
      delay: stagger(60, { from: "center" }),
      duration: 520,
      ease: "out(3)",
    });
    return () => {
      orbitAnimation.revert();
      chipAnimation.revert();
    };
  }, [activeSceneIndex, reduceMotion]);

  const activeScene = showcaseScenes[activeSceneIndex];
  const previousScene = showcaseScenes[(activeSceneIndex + showcaseScenes.length - 1) % showcaseScenes.length];
  const nextScene = showcaseScenes[(activeSceneIndex + 1) % showcaseScenes.length];

  const handleDownload = async () => {
    const opened = await openAndroidApkDownload();
    if (!opened) toast.error("APK download is temporarily unavailable. Please contact support.");
  };

  const sceneLabels = useMemo(
    () => showcaseScenes.map((scene, index) => ({ id: scene.id, label: scene.eyebrow, index })),
    []
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[#f5efe4] text-slate-950">
      <SEO
        title="StudyShare Android App"
        description="Explore the StudyShare Android app in a motion-led mobile gallery and download the smaller split APK."
        noIndex
      />

      <div className="pointer-events-none fixed inset-0">
        <Motion.div
          className="absolute left-[4%] top-[6%] h-[22rem] w-[22rem] rounded-full bg-[#0f766e]/10 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 18, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <Motion.div
          className="absolute right-[2%] top-[14%] h-[18rem] w-[18rem] rounded-full bg-[#f59e0b]/10 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, -14, 0], y: [0, 16, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <Motion.div
          className="absolute bottom-[-6rem] left-[18%] h-[24rem] w-[24rem] rounded-full bg-[#d97706]/8 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 12, 0], y: [0, -10, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8),_transparent_24%),radial-gradient(circle_at_80%_20%,rgba(15,118,110,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.5),rgba(245,239,228,0.75))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.18]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-black/10 bg-white/70 text-slate-900 shadow-sm hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/select-college")}
              className="border-black/10 bg-white/70 text-slate-900 shadow-sm hover:bg-white"
            >
              <ArrowRight className="h-4 w-4" />
              College page
            </Button>
            <Button onClick={() => void handleDownload()} className="bg-slate-950 text-white hover:bg-slate-800">
              <Download className="h-4 w-4" />
              Download smaller APK
            </Button>
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-[38px] border border-black/8 bg-white/72 shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
          <div className="grid gap-8 p-5 md:p-7 xl:grid-cols-[0.96fr_1.04fr] xl:gap-10 xl:p-8">
            <FramerMotion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.45 }}
              className="flex flex-col justify-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0f766e] shadow-sm">
                <Phone className="h-3.5 w-3.5" />
                Android app gallery
              </div>

              <h1 className="mt-4 max-w-2xl font-editorial text-5xl leading-[0.96] tracking-tight text-slate-950 md:text-6xl xl:text-7xl">
                StudyShare, staged like a moving magazine spread.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                This page is intentionally different from the rest of the site:
                softer paper tones, sharper typography, moving phone frames, and
                a gallery that walks through the Android app instead of showing
                a fixed screenshot wall. The download button points to the
                smaller split APK.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => void handleDownload()} className="bg-slate-950 text-white hover:bg-slate-800">
                  <Download className="h-4 w-4" />
                  Download smaller APK
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/select-college")}
                  className="border-black/10 bg-white/75 text-slate-900 shadow-sm hover:bg-white"
                >
                  Choose college
                </Button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-black/8 bg-[#f8f4ec] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
                    Smaller split build
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The website now reflects {title} and links the published arm64
                    release asset instead of the larger universal APK.
                  </p>
                </div>
                <div className="rounded-3xl border border-black/8 bg-[#f8f4ec] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
                    Correct footer
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Home, Rooms, Notices, and Profile are pinned to the bottom
                    bar, and the center action changes with the active screen.
                  </p>
                </div>
              </div>
            </FramerMotion.div>

            <div ref={stageRef} className="relative">
              <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-[radial-gradient(circle_at_center,_rgba(15,118,110,0.12),_transparent_42%),radial-gradient(circle_at_top,_rgba(245,158,11,0.09),_transparent_38%)]" />

              <div className="relative min-h-[760px] overflow-hidden rounded-[34px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0.2))] p-4 md:p-6">
                <Motion.div
                  className="absolute left-1/2 top-7 h-[88%] w-[88%] -translate-x-1/2 rounded-full bg-[#0f766e]/10 blur-3xl"
                  animate={reduceMotion ? undefined : { scale: [1, 1.09, 1] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="absolute left-6 top-7 hidden max-w-[190px] gap-3 xl:flex xl:flex-col">
                  <Motion.div
                    data-orbit
                    className="rounded-[26px] border border-black/8 bg-white/88 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.07)] backdrop-blur"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Version</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{ANDROID_APP_VERSION}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">smaller split APK</p>
                  </Motion.div>
                  <Motion.div
                    data-orbit
                    className="rounded-[26px] border border-black/8 bg-[#0f766e]/10 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.07)] backdrop-blur"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#0f766e]">Live plan</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      The AI answer flow keeps the working trace visible, then
                      folds it away after the response lands.
                    </p>
                  </Motion.div>
                </div>

                <div className="absolute right-6 top-10 hidden max-w-[190px] gap-3 xl:flex xl:flex-col">
                  <Motion.div
                    data-orbit
                    className="rounded-[26px] border border-black/8 bg-white/88 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.07)] backdrop-blur"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Footer</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{activeScene.navTab === 1 ? "Search" : "Add"}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">center action changes by screen</p>
                  </Motion.div>
                  <Motion.div
                    data-orbit
                    className="rounded-[26px] border border-black/8 bg-[#f59e0b]/12 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.07)] backdrop-blur"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b45309]">APK</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      The website download resolves to the smaller arm64 release.
                    </p>
                  </Motion.div>
                </div>

                <div className="relative z-20 mx-auto flex max-w-[382px] flex-col items-center">
                  <FramerMotion.div className="hidden xl:block xl:absolute xl:left-[-18px] xl:top-24">
                    <PhoneFrame scene={previousScene} reduceMotion={reduceMotion} compact />
                  </FramerMotion.div>
                  <FramerMotion.div className="hidden xl:block xl:absolute xl:right-[-18px] xl:top-[4.5rem]">
                    <PhoneFrame scene={nextScene} reduceMotion={reduceMotion} compact />
                  </FramerMotion.div>

                  <FramerMotion.div
                    className="relative z-20 mx-auto max-w-[382px]"
                    animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <PhoneFrame scene={activeScene} reduceMotion={reduceMotion} />
                  </FramerMotion.div>

                  <div className="mt-5 w-full max-w-[382px] rounded-[30px] border border-black/8 bg-white/92 p-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#0f766e]/15 bg-[#0f766e]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
                        {activeScene.eyebrow}
                      </span>
                      <span className="text-xs text-slate-400">{activeScene.note}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-950">{activeScene.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{activeScene.description}</p>
                  </div>

                  <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
                    {sceneLabels.map((scene) => {
                      const isActive = scene.index === activeSceneIndex;
                      return (
                        <button
                          key={scene.id}
                          type="button"
                          onClick={() => setActiveSceneIndex(scene.index)}
                          data-chip
                          className={cn(
                            "rounded-full border px-3 py-2 text-xs font-medium transition-all",
                            isActive
                              ? "border-[#0f766e]/20 bg-[#0f766e]/10 text-[#0f766e]"
                              : "border-black/8 bg-white/80 text-slate-600 hover:border-black/16 hover:bg-white hover:text-slate-900"
                          )}
                        >
                          {scene.index + 1}. {scene.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <MarqueeRow reduceMotion={reduceMotion} items={marqueeChips} />
          <MarqueeRow reduceMotion={reduceMotion} items={[...marqueeChips].reverse()} reverse />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card, index) => (
            <FeatureCard
              key={card.title}
              icon={card.icon}
              title={card.title}
              copy={card.copy}
              delay={index * 0.06}
              reduceMotion={reduceMotion}
            />
          ))}
        </section>

        <section className="mt-8 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <Card className="border-black/8 bg-white/85 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0f766e]">Why this version moves</p>
            <h2 className="mt-3 max-w-3xl text-2xl font-bold text-slate-950 md:text-3xl">
              The gallery now behaves like a launch story instead of a screenshot dump.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              We kept the real Android captures from the app project, but turned
              them into an editorial flow with staggered motion, animated phone
              frames, and a footer overlay that fixes the bottom-nav mismatch.
              The result feels closer to a product campaign page than a raw
              asset board.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-black/8 bg-[#f8f4ec] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <BadgeCheck className="h-4 w-4 text-[#0f766e]" />
                  Live plan experience
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The AI chat preview keeps the live plan visible while the
                  model is working, then collapses it once the response is ready.
                </p>
              </div>
              <div className="rounded-2xl border border-black/8 bg-[#f8f4ec] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Layers3 className="h-4 w-4 text-[#0f766e]" />
                  Footer fidelity
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The bottom bar now mirrors the real Flutter layout and stops
                  the screenshots from showing the wrong navigation state.
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,244,236,0.95))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0f766e]">What the APK includes</p>
            <div className="mt-4 space-y-3">
              {[
                { icon: BookOpen, title: "Study material", copy: "Notes, PDFs, and reading surfaces for semester work." },
                { icon: Bell, title: "Notices and alerts", copy: "Updates stay readable and easy to scan on mobile." },
                { icon: MessagesSquare, title: "Rooms and discovery", copy: "Community spaces keep the app useful between classes." },
                { icon: FileText, title: "Attendance and utilities", copy: "The app supports the study workflow beyond chat alone." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-black/8 bg-white/80 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Icon className="h-4 w-4 text-[#0f766e]" />
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="border-[#0f766e]/18 bg-[#0f766e]/10 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0f766e]">Ready to install</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950 md:text-3xl">
                  Download the smaller split APK that the page now showcases.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  The website now points to the published arm64 release asset,
                  so the download is lighter than the old universal APK and
                  matches the version shown above.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/select-college")}
                  className="border-black/10 bg-white/80 text-slate-900 hover:bg-white"
                >
                  <ArrowRight className="h-4 w-4" />
                  College page
                </Button>
                <Button onClick={() => void handleDownload()} className="bg-slate-950 text-white hover:bg-slate-800">
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
