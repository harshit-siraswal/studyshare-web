import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ANDROID_APK_PATH = "/downloads/studyshare-android.apk";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const titles = useMemo(() => ["smarter", "faster", "focused", "together", "exam-ready"], []);
  const navigate = useNavigate();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((current) => (current === titles.length - 1 ? 0 : current + 1));
    }, 2400);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles.length]);

  return (
    <div className="w-full flex justify-start">
      <div className="flex flex-col gap-8 py-20 lg:py-28 items-start justify-center max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.15 : 0.45 }}
        >
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-300/20 rounded-full cursor-default"
          >
            <Sparkles className="w-4 h-4" /> AI-powered campus workspace
          </Button>
        </motion.div>

        <motion.div
          className="flex gap-4 flex-col text-left"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.55, delay: 0.08 }}
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground flex flex-col gap-2 md:gap-3">
            <span>Study</span>
            <span className="relative flex overflow-hidden min-w-[230px] h-[1.15em]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={titleNumber}
                  className="absolute text-primary drop-shadow-[0_0_18px_rgba(22,163,74,0.28)]"
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 54 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -40 }}
                  transition={{
                    type: shouldReduceMotion ? "tween" : "spring",
                    duration: shouldReduceMotion ? 0.2 : undefined,
                    stiffness: 320,
                    damping: 28,
                  }}
                >
                  {titles[titleNumber]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-xl font-light">
            Notes, PYQs, notices, and AI revision in one place. StudyShare helps you move from scattered prep to
            structured progress.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-row flex-wrap gap-4"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.5, delay: 0.18 }}
        >
          <Button
            size="lg"
            className="gap-3 bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-[0_0_30px_rgba(22,163,74,0.35)] rounded-full px-8 text-base h-12 transition-all"
            onClick={() => navigate("/select-college")}
          >
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
          <a href={ANDROID_APK_PATH} download>
            <Button
              size="lg"
              variant="outline"
              className="gap-3 rounded-full px-8 text-base h-12 bg-background/70 border-border text-foreground shadow-sm"
            >
              Download Android APK
            </Button>
          </a>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.45, delay: 0.24 }}
        >
          <div className="rounded-xl border border-border/70 bg-card/55 backdrop-blur-sm px-4 py-3">
            <p className="text-xs uppercase tracking-[0.13em] text-emerald-300/80">AI Quiz</p>
            <p className="text-sm font-medium mt-1">Revision questions from your PDFs</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/55 backdrop-blur-sm px-4 py-3">
            <p className="text-xs uppercase tracking-[0.13em] text-emerald-300/80">Campus Feed</p>
            <p className="text-sm font-medium mt-1">Department notices with deadline focus</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/55 backdrop-blur-sm px-4 py-3">
            <p className="text-xs uppercase tracking-[0.13em] text-emerald-300/80">Study Rooms</p>
            <p className="text-sm font-medium mt-1 flex items-center gap-2">
              Peer doubt-solving <Zap className="w-3.5 h-3.5 text-amber-300" />
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export { Hero };
