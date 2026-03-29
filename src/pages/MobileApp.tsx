import { useMemo } from "react";
import { ArrowLeft, Download, Smartphone, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { ANDROID_APP_VERSION, openAndroidApkDownload } from "@/lib/apk";
import { cn } from "@/lib/utils";

type ShowcaseItem = {
  id: string;
  title: string;
  description: string;
  image: string;
};

const showcaseItems: ShowcaseItem[] = [
  {
    id: "live-preview",
    title: "Live Preview Capture",
    description: "Snapshot captured from the shared Superdesign live link.",
    image: "/images/app-showcase-superdesign.png",
  },
  {
    id: "feed",
    title: "Resource Feed",
    description: "Browse notes, PYQs, and videos in a fast mobile-first feed.",
    image: "/images/mobile-showcase/feed.png",
  },
  {
    id: "syllabus",
    title: "Syllabus Hub",
    description: "Jump directly to department-wise syllabus tracks and updates.",
    image: "/images/mobile-showcase/syllabus.png",
  },
  {
    id: "profile",
    title: "Student Profile",
    description: "Track contributions, followers, and monthly AI credits.",
    image: "/images/mobile-showcase/profile.png",
  },
];

const MockBottomNav = () => (
  <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/15 bg-black/90 px-4 py-2 backdrop-blur">
    <div className="grid grid-cols-5 items-center gap-2 text-[10px] text-white/75">
      <span className="text-center">Home</span>
      <span className="text-center">Chats</span>
      <span className="text-center rounded-full bg-primary/90 py-1 text-white">+</span>
      <span className="text-center">Notices</span>
      <span className="text-center">Profile</span>
    </div>
  </div>
);

const PhoneFrame = ({ item }: { item: ShowcaseItem }) => {
  return (
    <Card className="group overflow-hidden rounded-[30px] border-border/60 bg-card/60 p-4 shadow-card">
      <div className="relative mx-auto w-full max-w-[270px] rounded-[32px] border border-white/15 bg-black p-2 shadow-[0_24px_50px_rgba(0,0,0,0.5)]">
        <div className="relative overflow-hidden rounded-[26px] bg-black">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-8 bg-gradient-to-b from-black/50 to-transparent" />
          <img
            src={item.image}
            alt={item.title}
            className="h-[560px] w-full object-cover object-top"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <MockBottomNav />
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-base font-semibold text-foreground">{item.title}</p>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>
    </Card>
  );
};

const MobileApp = () => {
  const navigate = useNavigate();
  const title = useMemo(() => `StudyShare Android App · v${ANDROID_APP_VERSION}`, []);

  const handleDownload = async () => {
    const opened = await openAndroidApkDownload();
    if (!opened) {
      toast.error("APK download is temporarily unavailable. Please contact support.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="StudyShare Android App"
        description="Download the latest StudyShare Android app and explore the mobile experience."
        noIndex
      />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={() => void handleDownload()}
            className="inline-flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download APK
          </Button>
        </div>

        <div className="mt-6 rounded-3xl border border-border/60 bg-gradient-to-br from-card/85 to-background/90 p-6 shadow-card md:p-8">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-primary">
            <Smartphone className="h-4 w-4" />
            Mobile App
          </div>
          <h1 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground md:text-base">
            StudyShare on Android brings your notes, syllabus, notices, and AI
            tools into one focused mobile flow. Screens below are framed and
            normalized for consistent bottom navigation previews.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Latest synced version: {ANDROID_APP_VERSION}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {showcaseItems.map((item) => (
            <PhoneFrame key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileApp;
