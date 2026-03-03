import { NavBar } from "@/components/ui/tubelight-navbar";
import { GenerativeMountainScene } from "@/components/ui/mountain-scene";
import { Hero } from "@/components/ui/animated-hero";
import { InteractiveRobotSpline } from "@/components/blocks/interactive-3d-robot";
import { SEO } from "@/components/SEO";
import { Home, Compass, Library, MessageCircle } from "lucide-react";

const ANDROID_APK_PATH = "/downloads/studyshare-android.apk";

const navItems = [
  { name: 'Home', url: '#home', icon: Home },
  { name: 'Features', url: '#features', icon: Library },
  { name: 'Community', url: '#community', icon: MessageCircle },
  { name: 'Download', url: '#download', icon: Compass }
];

const Index = () => {
  const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

  return (
    <div className="relative min-h-screen bg-background text-foreground font-ai overflow-x-hidden selection:bg-primary/20 selection:text-primary flex flex-col scroll-smooth">
      <SEO
        title="StudyShare | AI Powered Study Network"
        description="Join your college community on StudyShare. Access curated study materials, notes, videos, and connect with peers."
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

      <section id="community" className="relative z-10 py-24 px-6 md:px-12 max-w-7xl mx-auto min-h-[50vh] flex flex-col items-center justify-center text-center scroll-mt-24">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">Join thousands of students.</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mb-10">We strictly verify student emails to ensure zero spam and 100% relevant academic collaboration.</p>
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
