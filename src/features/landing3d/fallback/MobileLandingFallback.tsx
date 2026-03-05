import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Download, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { LANDING_FAQ, LANDING_FEATURES, STUDENT_SEARCH_INTENTS } from "../content";
import type { SpatialLandingProps } from "../types";
import { PLANS } from "@/lib/subscription";

export function MobileLandingFallback({ onContinue, onDownload }: SpatialLandingProps) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const barScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_10%_5%,hsl(219,55%,18%),transparent_38%),radial-gradient(circle_at_90%_90%,hsl(25,72%,20%),transparent_34%),hsl(224,52%,8%)] text-foreground">
      <motion.div
        className="fixed left-0 right-0 top-0 z-40 h-[2px] origin-left bg-gradient-to-r from-primary via-accent to-primary"
        style={{ scaleX: barScale }}
      />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 pb-14 pt-24 md:px-10">
        <div className="pointer-events-none absolute -left-16 top-20 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-24 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.13em] text-primary"
        >
          <img
            src="/brand/logo-mark.png"
            alt="StudyShare logo"
            className="h-5 w-5 rounded-full border border-primary/30 bg-background/80 p-0.5"
            loading="lazy"
            decoding="async"
          />
          AI-powered campus workspace
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl"
        >
          Study <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">exam-ready</span> with one unified student workspace.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="mt-4 max-w-2xl text-lg text-muted-foreground"
        >
          Notes, PYQs, notices, and AI revision in one place. StudyShare keeps your prep structured.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="mt-6 flex flex-wrap gap-3"
        >
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 font-semibold text-primary-foreground shadow-[0_14px_30px_hsl(var(--primary)/0.35)]"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-6 py-3 font-semibold"
          >
            Download APK <Download className="h-4 w-4" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {LANDING_FEATURES.slice(0, 3).map((feature, index) => (
            <article
              key={feature.title}
              className={`rounded-2xl border border-border/70 p-4 backdrop-blur-md ${
                index === 1 ? "bg-primary/10" : "bg-card/70"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-primary">{feature.badge}</p>
              <h2 className="mt-2 text-base font-semibold">{feature.title}</h2>
            </article>
          ))}
        </motion.div>
      </section>

      <section className="border-y border-border/60 bg-secondary/20 px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.13em] text-primary">
            <Search className="h-4 w-4" />
            Popular student search intent
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {STUDENT_SEARCH_INTENTS.map((topic, index) => (
              <motion.article
                key={topic.title}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="rounded-2xl border border-border bg-card/80 p-5"
              >
                <h3 className="text-lg font-semibold">{topic.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{topic.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10">
        <h2 className="text-3xl font-bold">Pricing</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-2xl border p-5 ${
                plan.duration === "quarterly"
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-card/75"
              }`}
            >
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="mt-1 text-muted-foreground">{plan.duration === "monthly" ? "30-day access" : "90-day access"}</p>
              <p className="mt-4 text-3xl font-black">INR {plan.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-secondary/20 px-6 py-16 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold">Frequently asked questions</h2>
          <div className="mt-6 grid grid-cols-1 gap-3">
            {LANDING_FAQ.map((faq) => (
              <article key={faq.question} className="rounded-2xl border border-border bg-card/80 p-5">
                <h3 className="text-lg font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 px-6 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} StudyShare</p>
        <p className="mt-2">
          <Link to="/blog" className="text-primary hover:text-primary/80">
            Read blog
          </Link>
          <span className="mx-2">|</span>
          <button
            type="button"
            onClick={onDownload}
            className="text-primary hover:text-primary/80"
          >
            Android download
          </button>
        </p>
      </footer>
    </div>
  );
}
