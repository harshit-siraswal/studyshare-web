import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Download, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { LANDING_FAQ, LANDING_FEATURES, STUDENT_SEARCH_INTENTS } from "../content";
import type { SpatialLandingProps } from "../types";
import { PLANS } from "@/lib/subscription";

const ANDROID_APK_PATH = "/downloads/studyshare-android.apk";

export function MobileLandingFallback({ onContinue, onDownload }: SpatialLandingProps) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const barScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <motion.div
        className="fixed left-0 right-0 top-0 z-40 h-[2px] origin-left bg-gradient-to-r from-primary via-accent to-primary"
        style={{ scaleX: barScale }}
      />

      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 pb-14 pt-24 md:px-10">
        <motion.h1
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-4xl font-black leading-tight md:text-6xl"
        >
          Study <span className="text-primary">exam-ready</span>
        </motion.h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Notes, PYQs, notices, and AI revision in one place. StudyShare keeps your prep structured.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-semibold"
          >
            Download APK <Download className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="border-y border-border/60 bg-secondary/25 px-6 py-16 md:px-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2">
          {LANDING_FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.42, delay: index * 0.05 }}
              className="rounded-2xl border border-border/70 bg-card/70 p-5"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">{feature.badge}</p>
              <h2 className="mt-2 text-xl font-semibold">{feature.title}</h2>
              <p className="mt-2 text-muted-foreground">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.13em] text-primary">
          <Search className="h-4 w-4" />
          Popular student search intent
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {STUDENT_SEARCH_INTENTS.map((topic) => (
            <article key={topic.title} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold">{topic.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{topic.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-secondary/20 px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold">Pricing</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {PLANS.map((plan) => (
              <article key={plan.id} className={`rounded-2xl border p-5 ${plan.duration === "quarterly" ? "border-primary/60 bg-primary/10" : "border-border bg-card"}`}>
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
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-16 md:px-10">
        <h2 className="text-3xl font-bold">Frequently asked questions</h2>
        <div className="mt-6 grid grid-cols-1 gap-3">
          {LANDING_FAQ.map((faq) => (
            <article key={faq.question} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold">{faq.question}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 px-6 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} StudyShare</p>
        <p className="mt-2">
          <Link to="/blog" className="text-primary hover:text-primary/80">
            Read blog
          </Link>
          <span className="mx-2">•</span>
          <a href={ANDROID_APK_PATH} download className="text-primary hover:text-primary/80">
            Android download
          </a>
        </p>
      </footer>
    </div>
  );
}
