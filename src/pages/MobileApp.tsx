import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
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
  type LucideIcon,
  UserRound,
  Bell,
  BookOpen,
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
};

const showcaseScenes: ShowcaseScene[] = [
  {
    id: "ai-chat",
    eyebrow: "AI workspace",
    title: "AI chat with a live plan that collapses after the answer lands",
    description:
      "The study assistant keeps the reasoning trace visible while the answer streams, then folds it away so the final response stays clean.",
    image: "/images/superdesign/mobile/studyshare-ai-chat-mobile-reproduction.png",
    navTab: 0,
    fabMode: "add",
    note: "Live plan visible during generation, collapsed on completion.",
  },
  {
    id: "ai-studio",
    eyebrow: "AI studio",
    title: "A deeper AI surface for longer study sessions",
    description:
      "The larger AI canvas turns the mobile app into a real study companion instead of a thin chat shell.",
    image: "/images/superdesign/mobile/studyshare-ai-studio-mobile-surface.png",
    navTab: 0,
    fabMode: "add",
    note: "The app stays roomy even when the prompt gets complex.",
  },
  {
    id: "study-feed",
    eyebrow: "Study feed",
    title: "Notes and study resources arranged for one-handed browsing",
    description:
      "Semester material, PDFs, and quick actions stay close together so the app feels fast rather than crowded.",
    image: "/images/superdesign/mobile/studyshare-mobile-study-screen.png",
    navTab: 0,
    fabMode: "add",
    note: "Built for quick browsing between classes and lab breaks.",
  },
  {
    id: "rooms",
    eyebrow: "Campus rooms",
    title: "Rooms with a real search-first footer state",
    description:
      "The footer switches into a search posture when you are inside rooms, matching the Flutter shell instead of inventing a fake bar.",
    image: "/images/superdesign/mobile/studyshare-rooms-mobile.png",
    navTab: 1,
    fabMode: "search",
    note: "Rooms use the centered action button as search, not add.",
  },
  {
    id: "notices",
    eyebrow: "Notices",
    title: "Campus updates with a cleaner hierarchy",
    description:
      "Deadlines and notices are easier to scan when the page gives them room to breathe and keeps the footer out of the way.",
    image: "/images/superdesign/mobile/studyshare-notices-feed.png",
    navTab: 2,
    fabMode: "add",
    note: "Important announcements stay legible at a glance.",
  },
  {
    id: "alerts",
    eyebrow: "Notifications",
    title: "A focused inbox for alerts, follows, and reminders",
    description:
      "This keeps updates close without turning the app into a noisy dashboard full of competing cards.",
    image: "/images/superdesign/mobile/studyshare-notifications.png",
    navTab: 3,
    fabMode: "add",
    note: "Alerts live in the same system as the profile tab.",
  },
];

const capabilityCards = [
  {
    icon: Sparkles,
    title: "Live AI that feels present",
    copy:
      "The AI chat keeps its plan visible while the model is thinking, then collapses it once the answer is done so the final response stays tidy.",
  },
  {
    icon: House,
    title: "Correct footer structure",
    copy:
      "The preview now mirrors the real Flutter shell: Home, Rooms, Notices, Profile, plus a centered floating action button that changes by context.",
  },
  {
    icon: Download,
    title: "Real smaller APK download",
    copy:
      "The download button opens the published smaller arm64 release asset directly, which removes the temporary-unavailable toast from the website.",
  },
  {
    icon: ShieldCheck,
    title: "Campus-first app logic",
    copy:
      "Study material, notices, rooms, attendance, and profile all stay wrapped around the same college identity and versioned mobile build.",
  },
] as const;

const bottomNavItems = [
  { label: "Home", icon: House, index: 0 },
  { label: "Rooms", icon: MessagesSquare, index: 1 },
  { label: "Notices", icon: Megaphone, index: 2 },
  { label: "Profile", icon: UserRound, index: 3 },
] as const;

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
    <div className="absolute inset-x-4 bottom-4 z-30">
      <div className="relative rounded-[28px] border border-white/12 bg-slate-950/92 px-4 pb-3 pt-4 shadow-[0_24px_60px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
        <motion.div
          className="absolute left-1/2 top-0 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-gradient-to-br from-cyan-300 via-teal-300 to-emerald-400 text-slate-950 shadow-[0_20px_45px_rgba(20,184,166,0.34)]"
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [0, -2, 0],
                  scale: [1, 1.03, 1],
                }
          }
          transition={{
            duration: 3.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {fabMode === "search" ? (
            <Search className="h-5 w-5" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </motion.div>

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
      <motion.div
        animate={{ scale: isActive ? 1.08 : 1, y: isActive ? -1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Icon
          className={cn(
            "h-5 w-5 transition-colors",
            isActive ? "text-cyan-300" : "text-white/52"
          )}
        />
      </motion.div>
      <span
        className={cn(
          "text-[10px] transition-colors",
          isActive ? "text-cyan-300" : "text-white/62"
        )}
      >
        {item.label}
      </span>
    </div>
  );
}

function PhoneCard({
  scene,
  reduceMotion,
  compact = false,
  className = "",
}: {
  scene: ShowcaseScene;
  reduceMotion: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      animate={
        reduceMotion
          ? undefined
          : {
              y: compact ? [0, -6, 0] : [0, -10, 0],
            }
      }
      transition={{
        duration: compact ? 7.5 : 6.2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div
        className={cn(
          "relative mx-auto rounded-[38px] border border-white/12 bg-black p-2.5 shadow-[0_30px_80px_rgba(0,0,0,0.58)]",
          compact ? "w-[250px] opacity-75 saturate-75" : "w-full max-w-[334px]"
        )}
      >
        <div className="absolute left-1/2 top-3 z-20 h-1.5 w-24 -translate-x-1/2 rounded-full bg-white/12" />
        <div className="relative overflow-hidden rounded-[30px] bg-[#050505]">
          <AnimatePresence mode="wait">
            <motion.img
              key={scene.id}
              src={scene.image}
              alt={scene.title}
              className={cn(
                "w-full object-cover object-top",
                compact ? "h-[456px]" : "h-[586px]"
              )}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 14, scale: 1.02 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -12, scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.45 }}
              loading="lazy"
            />
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/82 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black via-black/96 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_40%)]" />
          <BottomNavPreview
            activeTab={scene.navTab}
            fabMode={scene.fabMode}
            reduceMotion={reduceMotion}
          />
        </div>
      </div>

      {!compact ? (
        <motion.div
          className="mt-4 max-w-[334px] px-2"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.3, delay: 0.08 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
            {scene.eyebrow}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">{scene.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/68">{scene.description}</p>
        </motion.div>
      ) : null}
    </motion.div>
  );
}

function CapabilityCard({
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
    <motion.div
      className="group rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-colors hover:border-cyan-300/30 hover:bg-white/10"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.12 : 0.32, delay }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/12 text-cyan-300">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-xs uppercase tracking-[0.2em] text-white/38">StudyShare mobile</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/68">{copy}</p>
    </motion.div>
  );
}

const MobileApp = () => {
  const navigate = useNavigate();
  const reduceMotion = Boolean(useReducedMotion());
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const title = `StudyShare Android App v${ANDROID_APP_VERSION}`;

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveSceneIndex((current) => (current + 1) % showcaseScenes.length);
    }, 3600);

    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  const activeScene = showcaseScenes[activeSceneIndex];
  const previousScene =
    showcaseScenes[(activeSceneIndex + showcaseScenes.length - 1) % showcaseScenes.length];
  const nextScene = showcaseScenes[(activeSceneIndex + 1) % showcaseScenes.length];

  const handleDownload = async () => {
    const opened = await openAndroidApkDownload();
    if (!opened) {
      toast.error("APK download is temporarily unavailable. Please contact support.");
    }
  };

  const sceneLabels = useMemo(
    () =>
      showcaseScenes.map((scene, index) => ({
        id: scene.id,
        label: scene.title,
        index,
      })),
    []
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <SEO
        title="StudyShare Android App"
        description="Download the latest StudyShare Android app and explore the mobile experience."
        noIndex
      />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="absolute right-[-8rem] top-[8rem] h-[22rem] w-[22rem] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.08]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-white/12 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/select-college")}
              className="border-white/12 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <ArrowRight className="h-4 w-4" />
              College page
            </Button>
              <Button
                  onClick={() => void handleDownload()}
                  className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                >
                  <Download className="h-4 w-4" />
                  Download smaller APK
                </Button>
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-[36px] border border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
          <div className="grid gap-8 p-5 md:p-7 xl:grid-cols-[1.02fr_0.98fr] xl:gap-10 xl:p-8">
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.45 }}
              className="flex flex-col justify-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                <Phone className="h-3.5 w-3.5" />
                Android app
              </div>

              <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-white md:text-5xl xl:text-6xl">
                A campus app that feels alive, not assembled.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                StudyShare Android brings AI chat, notes, notices, rooms, profile,
                and study utilities into one fast mobile surface. The page below
                now plays those screens like a living demo, with the footer
                corrected to match the Flutter app instead of a placeholder mock.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => void handleDownload()}
                  className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                >
                  <Download className="h-4 w-4" />
                  Download smaller APK
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/select-college")}
                  className="border-white/12 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  Choose college
                </Button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                    Smaller split build
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    The website reflects {title} and now points to the smaller
                    split release, which is about 50 MB instead of the universal
                    APK.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                    Footer corrected
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    The bottom bar now shows Home, Rooms, Notices, and Profile,
                    with a centered floating action button.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  "Live AI plan",
                  "Rooms and notices",
                  "Attendance tools",
                  "APK download",
                ].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/68"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </motion.div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.10),_transparent_48%),radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_35%)]" />

              <div className="relative min-h-[740px] overflow-hidden rounded-[32px] border border-white/10 bg-black/35 p-4 md:p-6">
                <motion.div
                  className="absolute left-1/2 top-6 h-[86%] w-[86%] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl"
                  animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                />

                <PhoneCard
                  scene={previousScene}
                  reduceMotion={reduceMotion}
                  compact
                  className="absolute left-[-14px] top-24 hidden xl:block xl:w-[250px]"
                />

                <PhoneCard
                  scene={nextScene}
                  reduceMotion={reduceMotion}
                  compact
                  className="absolute right-[-16px] top-[4.5rem] hidden xl:block xl:w-[250px]"
                />

                <motion.div
                  className="relative z-20 mx-auto max-w-[334px]"
                  animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                  transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <PhoneCard scene={activeScene} reduceMotion={reduceMotion} />
                </motion.div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeScene.id}
                    className="mx-auto mt-6 max-w-[334px] rounded-[28px] border border-white/10 bg-slate-950/72 p-4 shadow-[0_20px_55px_rgba(0,0,0,0.3)] backdrop-blur-xl"
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
                    transition={{ duration: reduceMotion ? 0.12 : 0.28 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                        {activeScene.eyebrow}
                      </span>
                      <span className="text-xs text-white/40">{activeScene.note}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-white">
                      {activeScene.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/68">
                      {activeScene.description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {sceneLabels.map((scene) => {
                    const isActive = scene.index === activeSceneIndex;
                    return (
                      <button
                        key={scene.id}
                        type="button"
                        onClick={() => setActiveSceneIndex(scene.index)}
                        className={cn(
                          "rounded-full border px-3 py-2 text-xs font-medium transition-all",
                          isActive
                            ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-100"
                            : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white"
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
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {capabilityCards.map((card, index) => (
            <CapabilityCard
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
          <Card className="border-white/10 bg-white/5 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Why this page moves
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">
              The mobile gallery now behaves like a product demo instead of a screenshot wall.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/68 md:text-base">
              We kept the original mobile captures from the Android project, but
              now they are layered, animated, and rotated automatically so the
              page feels like a live walkthrough. The wrong bottom bar from the
              earlier cards is covered and replaced with the real four-tab
              footer plus a centered floating action button.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <BadgeCheck className="h-4 w-4 text-cyan-300" />
                  Live plan experience
                </p>
                <p className="mt-2 text-sm leading-6 text-white/66">
                  The AI chat preview keeps the live plan visible during the
                  response and collapses it afterward, matching the behavior the
                  user described.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Layers3 className="h-4 w-4 text-cyan-300" />
                  Correct footer structure
                </p>
                <p className="mt-2 text-sm leading-6 text-white/66">
                  Home, Rooms, Notices, and Profile stay in place while the
                  center action button flips between add and search depending on
                  the active screen.
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-cyan-300/10 via-white/5 to-emerald-300/10 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
              What the APK includes
            </p>
            <div className="mt-4 space-y-3">
              {[
                {
                  icon: BookOpen,
                  title: "Study material",
                  copy: "Notes, PDFs, and reading surfaces for semester work.",
                },
                {
                  icon: Bell,
                  title: "Notices and alerts",
                  copy: "Updates stay readable and easy to skim on mobile.",
                },
                {
                  icon: MessagesSquare,
                  title: "Rooms and discovery",
                  copy: "Community spaces keep the app useful between classes.",
                },
                {
                  icon: FileText,
                  title: "Attendance and utilities",
                  copy: "The app supports the study workflow beyond chat alone.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Icon className="h-4 w-4 text-cyan-300" />
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/66">
                      {item.copy}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="border-cyan-300/20 bg-cyan-300/10 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/90">
                  Ready to install
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
                  Download the smaller split APK build the website is showcasing.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                  The site now points to the published arm64 release asset
                  instead of the 100+ MB universal APK, so the download is
                  lighter and still matches the app version in the UI.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/select-college")}
                  className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                >
                  <ArrowRight className="h-4 w-4" />
                  College page
                </Button>
                <Button onClick={() => void handleDownload()} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">
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
