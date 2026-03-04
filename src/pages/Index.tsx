import { NavBar } from "@/components/ui/tubelight-navbar.tsx";
import { Hero } from "@/components/ui/animated-hero";
import { NeuralShaderField } from "@/components/landing/NeuralShaderField";
import { BrandMotionSvg } from "@/components/landing/BrandMotionSvg";
import { FeaturePulseSvg } from "@/components/landing/FeaturePulseSvg";
import { SectionScrollWheel } from "@/components/landing/SectionScrollWheel";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import {
  Home,
  Compass,
  Library,
  MessageCircle,
  Search,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  FileText,
  BrainCircuit,
  Users,
  CalendarCheck2,
} from "lucide-react";
import { blogPosts } from "@/content/blogPosts";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { PLANS } from "@/lib/subscription";

const ANDROID_APK_PATH = "/downloads/studyshare-android.apk";
const SITE_URL = "https://studyshare.in";
const LOGO_URL = `${SITE_URL}/brand/logo-mark.png`;
const ANDROID_APK_URL = `${SITE_URL}${ANDROID_APK_PATH}`;

const navItems = [
  { name: "Home", url: "#home", icon: Home },
  { name: "Features", url: "#features", icon: Library },
  { name: "Community", url: "#community", icon: MessageCircle },
  { name: "Blog", url: "#blog", icon: BookOpen },
  { name: "Download", url: "#download", icon: Compass },
];

const featureVisuals = [
  {
    title: "AI Note Summaries",
    description: "Turn long notes into crisp revision points with context-aware summaries.",
    icon: FileText,
    badge: "Revision",
  },
  {
    title: "Smart Resource Search",
    description: "Find PYQs, notes, and topic threads in seconds across your college content.",
    icon: BrainCircuit,
    badge: "Search",
  },
  {
    title: "Collaborative Doubt Rooms",
    description: "Ask, discuss, and solve doubts with classmates and seniors in department channels.",
    icon: Users,
    badge: "Community",
  },
  {
    title: "Exam Prep Planner",
    description: "Get structured prep flow by topic weight, deadlines, and your weak areas.",
    icon: CalendarCheck2,
    badge: "Planning",
  },
];

const Index = () => {
  const featuredBlogPosts = blogPosts.slice(0, 3);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scrollProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const PrimaryFeatureIcon = featureVisuals[0].icon;
  const SecondaryFeatureIcon = featureVisuals[1].icon;
  const TertiaryFeatureIcon = featureVisuals[2].icon;

  const studentSearchIntentTopics = [
    {
      title: "Best notes and PYQs for exam prep",
      description:
        "Browse semester-ready notes, previous year questions, and revision material in one place.",
    },
    {
      title: "College notice updates without missing deadlines",
      description:
        "Track official department notices, exam updates, and campus announcements in a focused feed.",
    },
    {
      title: "AI helper for PDF-based revision",
      description:
        "Ask questions from your PDFs and get concise explanations before tests and viva rounds.",
    },
  ];

  const faqItems = [
    {
      question: "Can I use StudyShare for both web and Android?",
      answer:
        "Yes. You can access StudyShare in your browser and also download the Android APK for mobile use.",
    },
    {
      question: "Is StudyShare only for one college?",
      answer:
        "No. StudyShare is campus-based and supports multiple colleges with separate student communities and resources.",
    },
    {
      question: "What can I do with the AI chat feature?",
      answer:
        "You can upload or reference study material, ask topic-specific questions, get summaries, and speed up revision before exams.",
    },
    {
      question: "How are chatrooms useful for exam preparation?",
      answer:
        "Chatrooms help students discuss doubts, share tips, and collaborate with seniors and classmates in focused discussion threads.",
    },
  ];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "StudyShare",
      url: SITE_URL,
      logo: LOGO_URL,
      description: "College learning community with shared study resources, chatrooms, notices, and AI tools.",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "StudyShare",
      url: SITE_URL,
      description: "StudyShare is a campus-first learning network for notes, notices, chatrooms, and AI study help.",
      inLanguage: "en-IN",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "StudyShare",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web, Android",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
      featureList: [
        "College-specific study resources",
        "Department notices and updates",
        "Student chatrooms and discussions",
        "AI-powered study assistance",
      ],
      description:
        "StudyShare helps students access curated notes, previous year questions, department notices, peer discussions, and AI study assistance.",
      url: SITE_URL,
      downloadUrl: ANDROID_APK_URL,
    },
    {
      "@context": "https://schema.org",
      "@type": "MobileApplication",
      name: "StudyShare",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Android",
      downloadUrl: ANDROID_APK_URL,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
      url: SITE_URL,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground font-ai overflow-x-hidden selection:bg-primary/20 selection:text-primary flex flex-col scroll-smooth">
      <SEO
        title="AI-Powered College Study Network"
        description="StudyShare is a college community platform for study resources, department notices, chatrooms, and AI-powered learning support."
        canonical="/"
        image="/brand/logo-mark.png"
        keywords={[
          "college study resources",
          "student chatrooms",
          "department notices",
          "AI study assistant",
          "previous year questions",
          "study notes platform",
        ]}
        structuredData={structuredData}
      />

      <NavBar items={navItems} />
      <SectionScrollWheel />
      <motion.div
        className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-primary via-accent to-primary"
        style={{ scaleX: scrollProgress }}
      />

      <section
        id="home"
        className="relative z-10 flex items-center justify-center min-h-screen h-[100svh] pt-20 md:pt-24 pb-6 md:pb-8 px-6 md:px-12 w-full max-w-7xl mx-auto scroll-mt-24"
      >
        <NeuralShaderField className="absolute inset-0 z-0 opacity-90" />
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 10%, hsl(var(--primary) / 0.18), transparent 40%), radial-gradient(circle at 85% 85%, hsl(var(--accent) / 0.16), transparent 38%)",
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 w-full items-center">
          <div className="flex justify-center lg:justify-start">
            <Hero />
          </div>

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 0.6, delay: 0.14 }}
            className="relative w-full min-h-[380px] sm:min-h-[460px] [perspective:1200px]"
          >
            <BrandMotionSvg className="absolute -right-10 -top-14 h-[470px] w-[470px] opacity-55" />
            <div className="absolute right-6 md:right-16 bottom-4 h-16 w-[70%] bg-black/40 blur-2xl rounded-full" />
            <motion.div
              className="absolute right-4 md:right-10 top-0 w-[73%] rounded-2xl overflow-hidden border border-border/60 bg-card/70 backdrop-blur-sm shadow-[0_30px_90px_rgba(0,0,0,0.38)]"
              animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={shouldReduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
              whileHover={shouldReduceMotion ? undefined : { rotateX: 6, rotateY: -8, y: -10 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="h-[260px] md:h-[320px] p-5 md:p-6 flex flex-col justify-between"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at top right, hsl(var(--primary) / 0.24), transparent 42%), radial-gradient(circle at bottom left, hsl(var(--accent) / 0.22), transparent 55%), linear-gradient(140deg, hsl(var(--background) / 0.9), hsl(var(--secondary) / 0.92))",
                }}
              >
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/30 bg-background/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                  <PrimaryFeatureIcon className="h-3.5 w-3.5" />
                  {featureVisuals[0].badge}
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-primary/80">Feature Preview</p>
                  <h3 className="text-2xl font-semibold">{featureVisuals[0].title}</h3>
                  <p className="text-sm text-muted-foreground">{featureVisuals[0].description}</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mt-1">{featureVisuals[0].title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{featureVisuals[0].description}</p>
              </div>
            </motion.div>

            <motion.div
              className="absolute left-0 top-12 w-[45%] rounded-xl overflow-hidden border border-border/60 bg-card/70 backdrop-blur-sm shadow-xl"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 0.5, delay: 0.32 }}
              whileHover={shouldReduceMotion ? undefined : { rotateX: 10, rotateY: 10, z: 12, y: -6 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="h-36 p-4 flex flex-col justify-between"
                style={{
                  backgroundImage:
                    "linear-gradient(150deg, hsl(var(--secondary) / 0.9), hsl(var(--primary) / 0.26))",
                }}
              >
                <SecondaryFeatureIcon className="h-6 w-6 text-primary" />
                <p className="text-xs font-medium">{featureVisuals[1].title}</p>
              </div>
            </motion.div>

            <motion.div
              className="absolute left-8 bottom-3 w-[48%] rounded-xl overflow-hidden border border-border/60 bg-card/70 backdrop-blur-sm shadow-xl"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 0.5, delay: 0.4 }}
              whileHover={shouldReduceMotion ? undefined : { rotateX: -8, rotateY: 9, z: 12, y: -6 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="h-36 p-4 flex flex-col justify-between"
                style={{
                  backgroundImage:
                    "linear-gradient(150deg, hsl(var(--primary) / 0.24), hsl(var(--secondary) / 0.92))",
                }}
              >
                <TertiaryFeatureIcon className="h-6 w-6 text-primary" />
                <p className="text-xs font-medium">{featureVisuals[2].title}</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <motion.section
        id="features"
        className="relative z-10 py-24 px-6 md:px-12 bg-secondary/25 backdrop-blur-sm border-y border-border/50 scroll-mt-24"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.55 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              Your prep stack, <span className="text-primary">reimagined.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Core StudyShare workflows designed for revision speed, peer collaboration, and exam planning.
            </p>
            <div className="mx-auto mt-7 h-24 max-w-md opacity-70">
              <BrandMotionSvg className="h-full w-full" />
            </div>
            <div className="mx-auto mt-5 h-16 max-w-xl opacity-65">
              <FeaturePulseSvg className="h-full w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featureVisuals.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={shouldReduceMotion ? undefined : { rotateX: 7, rotateY: -6, y: -8 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: shouldReduceMotion ? 0.2 : 0.48, delay: index * 0.08 }}
                className="rounded-2xl border border-border/70 bg-card/75 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.24)]"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="h-44 p-6"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at top right, hsl(var(--primary) / 0.18), transparent 40%), radial-gradient(circle at bottom left, hsl(var(--accent) / 0.2), transparent 48%), linear-gradient(135deg, hsl(var(--background) / 0.86), hsl(var(--secondary) / 0.9))",
                  }}
                >
                  <div className="h-11 w-11 rounded-xl border border-primary/40 bg-background/30 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mt-4 inline-flex rounded-full border border-primary/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                    {feature.badge}
                  </p>
                </div>
                <div className="p-6 pt-5">
                  <h3 className="text-2xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground mt-3">{feature.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="relative z-10 py-20 px-6 md:px-12 max-w-7xl mx-auto w-full"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-2 text-primary text-sm font-semibold uppercase tracking-[0.14em]">
          <Search className="w-4 h-4" />
          Popular student searches
        </div>
        <h2 className="text-center text-3xl md:text-4xl font-bold tracking-tight mt-3">
          Built for what students actually search before exams
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {studentSearchIntentTopics.map((topic, index) => (
            <motion.div
              key={topic.title}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 0.42, delay: index * 0.08 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold leading-tight">{topic.title}</h3>
              <p className="text-muted-foreground mt-3">{topic.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        id="community"
        className="relative z-10 py-24 px-6 md:px-12 max-w-7xl mx-auto min-h-[45vh] flex flex-col items-center justify-center text-center scroll-mt-24"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">Join thousands of students.</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mb-10">
          We strictly verify student emails to ensure zero spam and 100% relevant academic collaboration.
        </p>
      </motion.section>

      <motion.section
        className="relative z-10 py-24 px-6 md:px-12 bg-secondary/20 border-y border-border/50"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.16 }}
        transition={{ duration: 0.55 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Keep the same plans from your app</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map((plan) => (
              <motion.article
                key={plan.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: shouldReduceMotion ? 0.2 : 0.45 }}
                className={`rounded-2xl border p-6 shadow-sm ${
                  plan.duration === "quarterly" ? "border-primary/60 bg-primary/10" : "border-border bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="text-muted-foreground mt-1">
                      {plan.duration === "monthly" ? "30-day access" : "90-day access with best value"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">INR {plan.price}</p>
                    <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                      {plan.duration === "monthly" ? "per month" : "per 3 months"}
                    </p>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        id="blog"
        className="relative z-10 py-24 px-6 md:px-12 bg-secondary/30 border-y border-border/50 scroll-mt-24"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 22 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.16 }}
        transition={{ duration: 0.55 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">StudyShare Blog</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">
                Fresh guides for exam prep and student productivity
              </h2>
            </div>
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80">
              View all articles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {featuredBlogPosts.map((post) => (
              <article key={post.slug} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">{post.category}</p>
                <h3 className="text-xl font-semibold mt-3 leading-tight">{post.title}</h3>
                <p className="text-muted-foreground mt-3">{post.description}</p>
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-primary hover:text-primary/80"
                >
                  Read article <ArrowRight className="w-4 h-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="relative z-10 py-20 px-6 md:px-12 max-w-5xl mx-auto w-full"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight">Frequently asked questions</h2>
        <div className="grid grid-cols-1 gap-4 mt-10">
          {faqItems.map((item) => (
            <div key={item.question} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="text-muted-foreground mt-2">{item.answer}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        id="download"
        className="relative z-10 py-24 px-6 md:px-12 bg-primary text-primary-foreground border-y border-border/50 scroll-mt-24"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 22 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-primary-foreground drop-shadow-md">
            Study seamlessly on the go.
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            Download our Android app to keep your notes, AI buddy, and community chat right in your pocket. Syncs
            perfectly with your web dashboard.
          </p>
          <a
            href={ANDROID_APK_PATH}
            download
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-background text-foreground hover:bg-secondary rounded-full font-semibold text-lg transition-transform hover:scale-105 shadow-xl"
          >
            Download Android APK
          </a>
        </div>
      </motion.section>

      <footer className="relative z-10 py-8 text-center text-sm text-muted-foreground bg-background">
        <p>&copy; {new Date().getFullYear()} StudyShare. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
