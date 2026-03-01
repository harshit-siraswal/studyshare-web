import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import BrandMark from "@/components/BrandMark";
import {
  BookOpen,
  MessageCircle,
  Sparkles,
  Users,
  Clock,
  ShieldCheck,
} from "lucide-react";

const APK_PLACEHOLDER_URL = "https://example.com/studyshare.apk";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen-safe bg-gradient-hero animate-hero-gradient text-foreground">
      <SEO
        title="Studyshare – the ambient computer for your campus"
        description="Studyshare unifies AI-powered study tools, campus resources, social graph, and admin control into one calm interface for your college."
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Atmospheric blooms */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        </div>

        <div className="relative z-10 container mx-auto max-w-5xl px-4 pt-10 pb-20 md:pt-16 md:pb-28 flex flex-col md:flex-row items-center gap-10 md:gap-16">
          {/* Copy column */}
          <div className="flex-1 max-w-xl space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full bg-black/30 border border-white/10 px-3 py-1.5 backdrop-blur-xl text-xs md:text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Already thinking in the background
              </span>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="inline-flex items-center gap-3">
                <BrandMark size={40} alt="Studyshare logo" />
                <span className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                  Studyshare
                </span>
              </div>
              <h1 className="font-editorial text-4xl md:text-6xl lg:text-7xl leading-tight lowercase">
                <span className="block">the ambient computer</span>
                <span className="block text-muted-foreground">for your campus</span>
              </h1>
            </div>

            <p className="text-base md:text-lg text-muted-foreground max-w-lg">
              AI study studio, resources, chatrooms, notices and admin control – all
              scoped to a single campus so students and staff share one calm space.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <Button
                size="lg"
                className="px-6 md:px-8 rounded-full shadow-glow"
                onClick={() => navigate("/select-college")}
              >
                Enter your campus
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-6 md:px-8 rounded-full border-white/30 bg-black/20 backdrop-blur-xl"
                asChild
              >
                <a
                  href={APK_PLACEHOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Android app
                </a>
              </Button>
            </div>

            <p className="text-xs md:text-sm text-muted-foreground/80">
              College-scoped by design. Admins keep control, students keep momentum.
            </p>
          </div>

          {/* Logo orb animation */}
          <div className="flex-1 min-w-[260px] max-w-md w-full">
            <LogoOrb />
          </div>
        </div>
      </section>

      {/* Features overview band */}
      <section className="relative border-t border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="container mx-auto max-w-5xl px-4 py-14 md:py-18">
          <div className="max-w-3xl mx-auto text-center mb-10 md:mb-14">
            <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-muted-foreground mb-3">
              What lives inside Studyshare
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold">
              A whole campus compressed into a calm interface
            </h2>
          </div>

          <div className="grid gap-5 md:gap-6 md:grid-cols-3">
            <FeatureCard
              icon={Sparkles}
              title="AI Study Studio"
              body="Summaries, quizzes, flashcards and RAG chat grounded in your PDFs and videos."
            />
            <FeatureCard
              icon={BookOpen}
              title="Resources hub"
              body="Notes, PYQs, videos and syllabus in one place, filtered by semester and branch."
            />
            <FeatureCard
              icon={Users}
              title="Campus graph"
              body="Chatrooms, following feed, notices and DMs – all scoped to your institution."
            />
            <FeatureCard
              icon={MessageCircle}
              title="Deep chatrooms"
              body="Threaded discussions and saved posts so every tough concept has a home."
            />
            <FeatureCard
              icon={Clock}
              title="Study mode"
              body="Timers and focus states that keep you in flow instead of dragging you back to a feed."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Admin dashboard"
              body="Role-based access, moderation, notices and bans so colleges stay in control."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const LogoOrb = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const tiltX = useTransform(scrollYProgress, [0, 0.5], [0, 4]);
  const lift = useTransform(scrollYProgress, [0, 0.5], [0, -12]);
  const fade = useTransform(scrollYProgress, [0, 0.4], [1, 0.85]);

  return (
    <motion.div
      ref={ref}
      style={{ y: lift, opacity: fade, rotateX: tiltX }}
      className="relative mx-auto h-64 w-64 md:h-72 md:w-72"
    >
      <div className="absolute inset-10 rounded-full bg-primary/40 blur-3xl" />
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 h-full w-full rounded-full bg-white/5 dark:bg-black/40 border border-white/15 backdrop-blur-2xl shadow-glow flex items-center justify-center"
      >
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="relative h-24 w-24 md:h-28 md:w-28 rounded-full bg-black/60 flex items-center justify-center overflow-hidden"
        >
          <BrandMark size={56} alt="Studyshare logo" />
        </motion.div>

        <motion.div
          className="absolute inset-3 rounded-full border border-white/25"
          animate={{ rotate: [0, 6, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-7 rounded-full border border-white/15"
          animate={{ rotate: [0, -4, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
};

interface FeatureCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
}

const FeatureCard = ({ icon: Icon, title, body }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="rounded-2xl bg-white/5 dark:bg-black/40 border border-white/10 p-4 md:p-5 space-y-2"
    >
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h3 className="text-sm md:text-base font-medium">{title}</h3>
      <p className="text-xs md:text-sm text-muted-foreground">{body}</p>
    </motion.div>
  );
};

export default Landing;

