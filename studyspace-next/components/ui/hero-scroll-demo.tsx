import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import BrandMark from "@/components/BrandMark";
import { BookOpen, Sparkles, Users } from "lucide-react";

export const HeroScrollDemo: React.FC = () => {
  const titleComponent = (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <BrandMark
          size={52}
          className="h-10 w-10 md:h-12 md:w-12 drop-shadow-[0_10px_22px_rgba(0,0,0,0.2)]"
          alt="StudyShare logo"
        />
        <span className="text-xs md:text-sm uppercase tracking-[0.25em] text-muted-foreground">
          studyshare.in
        </span>
      </div>
      <h1 className="font-editorial text-4xl md:text-6xl lg:text-7xl leading-tight text-center">
        <span className="lowercase block">the ambient computer</span>
        <span className="lowercase block text-muted-foreground">
          for your campus
        </span>
      </h1>
      <p className="mt-4 max-w-xl mx-auto text-sm md:text-base text-muted-foreground">
        AI-powered study studio, college-scoped social graph, and an admin
        dashboard designed for real campuses. One calm space for everything
        you need to learn.
      </p>
    </div>
  );

  return (
    <section className="relative flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-float" />
      </div>

      <ContainerScroll titleComponent={titleComponent}>
        <div className="relative h-full w-full">
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80"
              alt="Soft mountain landscape under a calm sky"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>

          {/* Orb / logo animation hook */}
          <div className="absolute right-6 top-8 md:right-10 md:top-10 h-20 w-20 md:h-28 md:w-28 rounded-full overflow-hidden border border-white/25 bg-white/10 dark:bg-black/40 backdrop-blur-2xl shadow-glow animate-float">
            <video
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster="/hero/orb-poster.jpg"
            >
              <source src="/hero/orb-loop.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Glass panel hinting at the product */}
          <div className="absolute inset-4 md:inset-8 flex flex-col justify-end">
            <div className="max-w-xl rounded-3xl glass bg-white/10 dark:bg-zinc-900/70 border border-white/20 shadow-glow p-4 md:p-6">
              <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground mb-3">
                built for real campuses
              </p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                <BadgePill
                  icon={BookOpen}
                  label="AI Study Studio"
                  description="Summaries, flashcards, quizzes & RAG chat from your PDFs."
                />
                <BadgePill
                  icon={Users}
                  label="College graph"
                  description="Chatrooms, notices & resources scoped to your institution."
                />
                <BadgePill
                  icon={Sparkles}
                  label="Admin control"
                  description="Moderation dashboard with role-based access and insights."
                />
              </div>
            </div>
          </div>
        </div>
      </ContainerScroll>
    </section>
  );
};

interface BadgePillProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  description: string;
}

const BadgePill: React.FC<BadgePillProps> = ({ icon: Icon, label, description }) => {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-black/20 md:bg-black/30 px-3 py-3 md:px-4 md:py-3 border border-white/15">
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="space-y-0.5">
        <p className="text-xs md:text-sm font-medium text-foreground">
          {label}
        </p>
        <p className="text-[10px] md:text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
};

