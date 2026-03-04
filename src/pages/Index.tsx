import { NavBar } from "@/components/ui/tubelight-navbar.tsx";
import { Hero } from "@/components/ui/animated-hero";
import { NeuralShaderField } from "@/components/landing/NeuralShaderField";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { Home, Compass, Library, MessageCircle, Search, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { blogPosts } from "@/content/blogPosts";
import { motion, useReducedMotion } from "framer-motion";
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
    image: "/ai-features/ai-note-summaries.png",
  },
  {
    title: "Smart Resource Search",
    description: "Find PYQs, notes, and topic threads in seconds across your college content.",
    image: "/ai-features/ai-smart-search.png",
  },
  {
    title: "Collaborative Doubt Rooms",
    description: "Ask, discuss, and solve doubts with classmates and seniors in department channels.",
    image: "/ai-features/ai-collab-chat.png",
  },
  {
    title: "Exam Prep Planner",
    description: "Get structured prep flow by topic weight, deadlines, and your weak areas.",
    image: "/ai-features/ai-exam-planner.png",
  },
];

const Index = () => {
  const featuredBlogPosts = blogPosts.slice(0, 3);
  const shouldReduceMotion = useReducedMotion();

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

      <section
        id="home"
        className="relative z-10 flex-1 flex items-center justify-center min-h-screen pt-24 pb-14 px-6 md:px-12 w-full max-w-7xl mx-auto scroll-mt-24"
      >
        <NeuralShaderField className="absolute inset-0 z-0 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,0.16),transparent_38%),radial-gradient(circle_at_85%_85%,rgba(14,165,233,0.14),transparent_36%)] z-0" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 w-full items-center">
          <div className="flex justify-center lg:justify-start">
            <Hero />
          </div>

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 0.6, delay: 0.14 }}
            className="relative w-full min-h-[380px] sm:min-h-[460px]"
          >
            <motion.div
              className="absolute right-4 md:right-10 top-0 w-[73%] rounded-2xl overflow-hidden border border-border/60 bg-card/70 backdrop-blur-sm shadow-[0_26px_80px_rgba(0,0,0,0.35)]"
              animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={shouldReduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src={featureVisuals[0].image} alt={featureVisuals[0].title} className="w-full h-[260px] md:h-[320px] object-cover" />
              <div className="p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-primary/80">Feature Preview</p>
                <h3 className="text-xl font-semibold mt-1">{featureVisuals[0].title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{featureVisuals[0].description}</p>
              </div>
            </motion.div>

            <motion.div
              className="absolute left-0 top-12 w-[45%] rounded-xl overflow-hidden border border-border/60 bg-card/70 backdrop-blur-sm shadow-xl"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 0.5, delay: 0.32 }}
            >
              <img src={featureVisuals[1].image} alt={featureVisuals[1].title} className="w-full h-36 object-cover" />
              <p className="px-3 py-2 text-xs font-medium">{featureVisuals[1].title}</p>
            </motion.div>

            <motion.div
              className="absolute left-8 bottom-3 w-[48%] rounded-xl overflow-hidden border border-border/60 bg-card/70 backdrop-blur-sm shadow-xl"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 0.5, delay: 0.4 }}
            >
              <img src={featureVisuals[2].image} alt={featureVisuals[2].title} className="w-full h-36 object-cover" />
              <p className="px-3 py-2 text-xs font-medium">{featureVisuals[2].title}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="relative z-10 py-24 px-6 md:px-12 bg-secondary/25 backdrop-blur-sm border-y border-border/50 scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              Your prep stack, <span className="text-primary">reimagined.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI-generated visuals below represent core StudyShare workflows while we finalize live feature screenshots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featureVisuals.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: shouldReduceMotion ? 0.2 : 0.48, delay: index * 0.08 }}
                className="rounded-2xl border border-border/70 bg-card/75 overflow-hidden shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
              >
                <img src={feature.image} alt={feature.title} className="w-full h-56 object-cover" loading="lazy" />
                <div className="p-6">
                  <h3 className="text-2xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground mt-3">{feature.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 px-6 md:px-12 max-w-7xl mx-auto w-full">
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
      </section>

      <section id="community" className="relative z-10 py-24 px-6 md:px-12 max-w-7xl mx-auto min-h-[45vh] flex flex-col items-center justify-center text-center scroll-mt-24">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">Join thousands of students.</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mb-10">
          We strictly verify student emails to ensure zero spam and 100% relevant academic collaboration.
        </p>
      </section>

      <section className="relative z-10 py-24 px-6 md:px-12 bg-secondary/20 border-y border-border/50">
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
      </section>

      <section id="blog" className="relative z-10 py-24 px-6 md:px-12 bg-secondary/30 border-y border-border/50 scroll-mt-24">
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
      </section>

      <section className="relative z-10 py-20 px-6 md:px-12 max-w-5xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight">Frequently asked questions</h2>
        <div className="grid grid-cols-1 gap-4 mt-10">
          {faqItems.map((item) => (
            <div key={item.question} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="text-muted-foreground mt-2">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="download" className="relative z-10 py-24 px-6 md:px-12 bg-primary text-primary-foreground border-y border-border/50 scroll-mt-24">
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
      </section>

      <footer className="relative z-10 py-8 text-center text-sm text-muted-foreground bg-background">
        <p>&copy; {new Date().getFullYear()} StudyShare. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
