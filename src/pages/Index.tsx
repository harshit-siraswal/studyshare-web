import { NavBar } from "@/components/ui/tubelight-navbar.tsx";
import { GenerativeMountainScene } from "@/components/ui/mountain-scene";
import { Hero } from "@/components/ui/animated-hero";
import { InteractiveRobotSpline } from "@/components/blocks/interactive-3d-robot";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { Home, Compass, Library, MessageCircle, Search, BookOpen, ArrowRight } from "lucide-react";
import { blogPosts } from "@/content/blogPosts";

const ANDROID_APK_PATH = "/downloads/studyshare-android.apk";
const SITE_URL = "https://studyshare.in";
const LOGO_URL = `${SITE_URL}/brand/logo-mark.png`;
const ANDROID_APK_URL = `${SITE_URL}${ANDROID_APK_PATH}`;

const navItems = [
  { name: 'Home', url: '#home', icon: Home },
  { name: 'Features', url: '#features', icon: Library },
  { name: 'Community', url: '#community', icon: MessageCircle },
  { name: 'Blog', url: '#blog', icon: BookOpen },
  { name: 'Download', url: '#download', icon: Compass }
];

const Index = () => {
  const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";
  const featuredBlogPosts = blogPosts.slice(0, 3);
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

      <GenerativeMountainScene />

      {/* Hero Section */}
      <section id="home" className="relative z-10 flex-1 flex items-center justify-center min-h-screen pt-24 pb-12 px-6 md:px-12 w-full max-w-7xl mx-auto scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full flex-grow items-center">

          {/* Left Column: Hero Text */}
          <div className="flex justify-center lg:justify-start pt-8 lg:pt-0 shrink-0">
            <Hero />
          </div>

          {/* Right Column: Whobee spline */}
          <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] pointer-events-auto">
            <InteractiveRobotSpline
              scene={ROBOT_SCENE_URL}
              className="absolute inset-0 w-full h-full drop-shadow-[0_0_50px_rgba(22,163,74,0.15)]"
            />
          </div>

        </div>
      </section>

      {/* Extended Information Sections */}
      <section id="features" className="relative z-10 py-24 px-6 md:px-12 bg-secondary/30 backdrop-blur-sm border-y border-border/50 scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">Master your subjects, <span className="text-primary">together.</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">StudyShare is your all-in-one academic companion. Find the best notes, solve past papers, and study efficiently.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <Library className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-semibold mb-3">Curated Resources</h3>
              <p className="text-muted-foreground">Access categorized notes and high-yield video lectures verified by top students from your own college.</p>
            </div>
            <div className="p-8 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <MessageCircle className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-semibold mb-3">Active Community</h3>
              <p className="text-muted-foreground">Join department-specific chatrooms. Ask questions, share insights, and get answers from seniors and peers instantly.</p>
            </div>
            <div className="p-8 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <Compass className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-semibold mb-3">AI Study Buddy</h3>
              <p className="text-muted-foreground">Meet Whobee, your personal AI tutor. Let it break down complex topics, extract info from PDFs, and test your knowledge.</p>
            </div>
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
          {studentSearchIntentTopics.map((topic) => (
            <div key={topic.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-semibold leading-tight">{topic.title}</h3>
              <p className="text-muted-foreground mt-3">{topic.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="community" className="relative z-10 py-24 px-6 md:px-12 max-w-7xl mx-auto min-h-[50vh] flex flex-col items-center justify-center text-center scroll-mt-24">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">Join thousands of students.</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mb-10">We strictly verify student emails to ensure zero spam and 100% relevant academic collaboration.</p>
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
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
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
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-primary-foreground drop-shadow-md">Study seamlessly on the go.</h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">Download our Android app to keep your notes, AI buddy, and community chat right in your pocket. Syncs perfectly with your web dashboard.</p>
          <a href={ANDROID_APK_PATH} download className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-background text-foreground hover:bg-secondary rounded-full font-semibold text-lg transition-transform hover:scale-105 shadow-xl">
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
