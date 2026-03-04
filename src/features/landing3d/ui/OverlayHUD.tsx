import { ArrowRight, BookOpen, Download, Users, Sparkles, Wallet, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import type { LandingChapterId, SceneNavState } from "../types";
import { CHAPTER_LABELS, CHAPTER_ORDER } from "../config";
import { LANDING_FEATURES } from "../content";

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
        <div className="rounded-full border border-primary/35 bg-background/75 px-4 py-2 text-xs uppercase tracking-[0.14em] text-primary backdrop-blur-md">
          Spatial Studyverse
        </div>
        <nav className="flex items-center gap-2 rounded-full border border-border/60 bg-card/65 p-1 backdrop-blur-md">
          {CHAPTER_ORDER.map((chapter) => {
            const isActive = activeChapter === chapter;
            return (
              <button
                key={chapter}
                type="button"
                onClick={() => onJumpChapter(chapter)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] transition ${
                  isActive ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:text-foreground"
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

      <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-5 md:px-8">
        <div className="pointer-events-auto max-w-xl rounded-3xl border border-border/55 bg-background/58 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.13em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered campus workspace
          </div>

          <h1 className="text-3xl font-black leading-tight md:text-5xl">
            Study <span className="text-primary">{chapterLabel.toLowerCase()}</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">{chapterCopy.body}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_hsl(var(--primary)/0.35)] transition hover:brightness-105"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-card/75"
            >
              Download Android APK <Download className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {LANDING_FEATURES.slice(0, 4).map((feature, index) => {
              const Icon = index === 0 ? GraduationCap : index === 1 ? BookOpen : index === 2 ? Users : Wallet;
              return (
                <article key={feature.title} className="rounded-xl border border-border/65 bg-card/65 p-3.5">
                  <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    <Icon className="h-3.5 w-3.5" />
                    {feature.badge}
                  </p>
                  <h2 className="mt-2 text-sm font-semibold">{feature.title}</h2>
                </article>
              );
            })}
          </div>

          <p className="mt-4 text-xs uppercase tracking-[0.13em] text-muted-foreground">
            {sceneReady ? `Scene ready • ${navState.replace("_", " ")}` : "Initializing spatial scene..."}
          </p>
        </div>
      </div>

      <div className="pointer-events-none mx-auto mb-6 w-full max-w-7xl px-5 text-right text-xs uppercase tracking-[0.13em] text-muted-foreground md:px-8">
        Scroll to move camera • drag to orbit • click nodes to jump
      </div>
    </div>
  );
}
