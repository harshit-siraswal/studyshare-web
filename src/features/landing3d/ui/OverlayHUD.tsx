import { ArrowRight, BookOpen, Download, GraduationCap, Sparkles, Users, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { CHAPTER_LABELS, CHAPTER_ORDER } from "../config";
import { LANDING_FEATURES } from "../content";
import type { LandingChapterId, SceneNavState } from "../types";

const CHAPTER_COPY: Record<LandingChapterId, { title: string; body: string }> = {
  home: {
    title: "From scattered prep to exam confidence",
    body: "StudyShare connects notes, PYQs, notices, and AI revision in one spatial workspace built for students.",
  },
  features: {
    title: "Tools that cut revision time",
    body: "Search faster, summarize instantly, and stay focused on high-value preparation.",
  },
  community: {
    title: "Verified campus collaboration",
    body: "Discuss doubts in college-specific spaces without spam or irrelevant noise.",
  },
  pricing: {
    title: "Student-first pricing, no surprises",
    body: "Keep the same plans you already use in the app with clear value tiers.",
  },
  download: {
    title: "Carry your study flow anywhere",
    body: "Switch seamlessly between web and Android without losing context.",
  },
};

interface OverlayHUDProps {
  activeChapter: LandingChapterId;
  navState: SceneNavState;
  sceneReady: boolean;
  onJumpChapter: (id: LandingChapterId) => void;
  onContinue: () => void;
  onDownload: () => void;
}

export function OverlayHUD({
  activeChapter,
  navState,
  sceneReady,
  onJumpChapter,
  onContinue,
  onDownload,
}: OverlayHUDProps) {
  const chapterCopy = CHAPTER_COPY[activeChapter];
  const chapterLabel = CHAPTER_LABELS[activeChapter];

  return (
    <div className="pointer-events-none fixed inset-0 z-[45] flex flex-col">
      <div className="pointer-events-auto mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 pt-5 md:px-8">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-border/60 bg-background/65 px-3 py-2 shadow-[0_10px_25px_rgba(0,0,0,0.3)] backdrop-blur-md">
          <div className="relative h-10 w-10 shrink-0">
            <div className="absolute inset-0 rounded-full bg-primary/25 blur-md" />
            <div className="absolute -inset-1 rounded-full border border-primary/45 animate-[spin_8s_linear_infinite]" />
            <img
              src="/brand/logo-mark.png"
              alt="StudyShare logo"
              className="relative h-10 w-10 rounded-full border border-primary/40 bg-background/90 object-contain p-1"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">StudyShare</p>
            <p className="text-xs text-muted-foreground">Spatial Campus Workspace</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 rounded-full border border-border/55 bg-card/65 p-1 backdrop-blur-md">
          {CHAPTER_ORDER.map((chapter) => {
            const isActive = activeChapter === chapter;
            return (
              <button
                key={chapter}
                type="button"
                onClick={() => onJumpChapter(chapter)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] transition ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[0_8px_18px_hsl(var(--primary)/0.35)]"
                    : "text-foreground/80 hover:text-foreground"
                }`}
              >
                {chapter}
              </button>
            );
          })}
          <Link
            to="/blog"
            className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-foreground/80 transition hover:text-foreground"
          >
            Blog
          </Link>
        </nav>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 items-center gap-6 px-5 md:px-8">
        <div className="pointer-events-auto relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border/55 bg-background/60 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-8">
          <div className="absolute -left-12 -top-14 h-36 w-36 rounded-full bg-primary/20 blur-2xl" />
          <div className="absolute -bottom-16 right-0 h-36 w-36 rounded-full bg-accent/20 blur-2xl" />

          <div className="relative mb-3 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.13em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered campus workspace
          </div>

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary/90">{chapterLabel}</p>
            <h1 className="mt-1 text-3xl font-black leading-tight md:text-5xl">{chapterCopy.title}</h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">{chapterCopy.body}</p>
          </div>

          <div className="relative mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_hsl(var(--primary)/0.35)] transition hover:brightness-105"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-card/75"
            >
              Download Android APK <Download className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {LANDING_FEATURES.slice(0, 4).map((feature, index) => {
              const Icon = index === 0 ? GraduationCap : index === 1 ? BookOpen : index === 2 ? Users : Wallet;
              return (
                <article
                  key={feature.title}
                  className="rounded-xl border border-border/65 bg-card/70 p-3.5 transition duration-300 hover:-translate-y-0.5 hover:bg-card"
                >
                  <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    <Icon className="h-3.5 w-3.5" />
                    {feature.badge}
                  </p>
                  <h2 className="mt-2 text-sm font-semibold">{feature.title}</h2>
                </article>
              );
            })}
          </div>

          <p className="relative mt-4 text-xs uppercase tracking-[0.13em] text-muted-foreground">
            {sceneReady ? `Scene ready | ${navState.replace("_", " ")}` : "Initializing spatial scene..."}
          </p>
        </div>

        <aside className="pointer-events-auto hidden w-[320px] shrink-0 flex-col gap-3 xl:flex">
          {CHAPTER_ORDER.map((chapter, index) => {
            const isActive = chapter === activeChapter;
            return (
              <button
                key={chapter}
                type="button"
                onClick={() => onJumpChapter(chapter)}
                className={`group relative overflow-hidden rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-primary/50 bg-primary/15 shadow-[0_16px_35px_rgba(0,0,0,0.35)]"
                    : "border-border/70 bg-background/55 hover:border-primary/35 hover:bg-background/75"
                }`}
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-accent opacity-80" />
                <p className="pl-2 text-[11px] font-bold uppercase tracking-[0.13em] text-primary">
                  0{index + 1} {chapter}
                </p>
                <p className="pl-2 text-sm text-foreground/85">{CHAPTER_LABELS[chapter]}</p>
              </button>
            );
          })}
        </aside>
      </div>

      <div className="pointer-events-none mx-auto mb-6 w-full max-w-7xl px-5 text-right text-xs uppercase tracking-[0.13em] text-muted-foreground md:px-8">
        Scroll to move chapters | drag to orbit | click nodes to jump
      </div>
    </div>
  );
}
