import { ArrowLeft, ArrowRight, Download, Smartphone, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { ANDROID_APP_VERSION, openAndroidApkDownload } from "@/lib/apk";

type ShowcaseItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  badge?: string;
};

const showcaseItems: ShowcaseItem[] = [
  {
    id: "ai-chat",
    title: "AI Chat",
    description: "Live plan view, source chips, and a compact composer for study questions.",
    image: "/images/superdesign/mobile/studyshare-ai-chat-mobile-reproduction.png",
    badge: "Featured",
  },
  {
    id: "study-feed",
    title: "Study Feed",
    description: "Fast browsing for notes, PYQs, and campus resources.",
    image: "/images/superdesign/mobile/studyshare-mobile-study-screen.png",
  },
  {
    id: "rooms",
    title: "Rooms",
    description: "Community rooms with search, member stats, and focused cards.",
    image: "/images/superdesign/mobile/studyshare-rooms-mobile.png",
  },
  {
    id: "notices",
    title: "Notices",
    description: "A scrollable notice feed with clarity-first hierarchy.",
    image: "/images/superdesign/mobile/studyshare-notices-feed.png",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "A focused inbox for follow requests, updates, and alerts.",
    image: "/images/superdesign/mobile/studyshare-notifications.png",
  },
  {
    id: "pdf-viewer",
    title: "PDF Viewer",
    description: "The premium reading surface for notes, OCR, and AI actions.",
    image: "/images/superdesign/mobile/studyshare-premium-pdf-viewer.png",
  },
  {
    id: "attendance",
    title: "Attendance",
    description: "A compact attendance workflow with timetable context.",
    image: "/images/superdesign/mobile/studyshare-premium-attendance-ui.png",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "A desktop companion snapshot of the broader StudyShare experience.",
    image: "/images/superdesign/mobile/studyshare-premium-dashboard.png",
  },
];

const MockBottomNav = () => (
  <div className="absolute inset-x-3 bottom-3 rounded-[22px] border border-white/15 bg-black/92 px-4 py-2.5 backdrop-blur">
    <div className="grid grid-cols-5 items-center gap-2 text-[10px] text-white/70">
      <span className="text-center">Home</span>
      <span className="text-center">Rooms</span>
      <span className="text-center rounded-full bg-primary/90 py-1 text-white">+</span>
      <span className="text-center">Notices</span>
      <span className="text-center">Profile</span>
    </div>
  </div>
);

const PhoneFrame = ({ item, featured = false }: { item: ShowcaseItem; featured?: boolean }) => {
  return (
    <Card
      className={`group overflow-hidden rounded-[30px] border-border/60 bg-card/60 p-4 shadow-card ${
        featured ? "md:col-span-2 xl:col-span-2" : ""
      }`}
    >
      <div className="relative mx-auto w-full max-w-[290px] rounded-[36px] border border-white/15 bg-black p-2 shadow-[0_24px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute left-1/2 top-3 z-30 h-1.5 w-24 -translate-x-1/2 rounded-full bg-white/12" />
        <div className="relative overflow-hidden rounded-[30px] bg-black">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-black/60 to-transparent" />
          <img
            src={item.image}
            alt={item.title}
            className="h-[560px] w-full object-cover object-top"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <MockBottomNav />
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold text-foreground">{item.title}</p>
          {item.badge ? (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {item.badge}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>
    </Card>
  );
};

const MobileApp = () => {
  const navigate = useNavigate();
  const title = `StudyShare Android App v${ANDROID_APP_VERSION}`;

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
          <Button variant="outline" onClick={() => navigate(-1)} className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Go to college page
            </Button>
            <Button onClick={() => void handleDownload()} className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download APK
            </Button>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-background/90 to-card/70 p-6 shadow-card md:p-8">
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

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <PhoneFrame item={showcaseItems[0]} featured />
          <Card className="rounded-[30px] border-border/60 bg-card/60 p-5 shadow-card lg:col-span-1">
            <div className="flex h-full flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  What the app includes
                </p>
                <h2 className="mt-3 text-2xl font-bold text-foreground">A cleaner mobile flow for study work</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  These screens were saved directly from the SuperDesign project and now act as the
                  visual source of truth for the Android app section on the website.
                </p>
              </div>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-sm font-semibold text-foreground">1. Download-ready APK</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The APK button opens the latest hosted release asset.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-sm font-semibold text-foreground">2. Mobile screenshots</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    AI chat, study feed, notices, rooms, and utility screens are included.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-sm font-semibold text-foreground">3. Reusable showcase</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The same gallery can be reused in the dashboard or a marketing page.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {showcaseItems.slice(1).map((item) => (
            <PhoneFrame key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileApp;
