import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { Analytics } from "@vercel/analytics/react";
import BrandLoader from "@/components/BrandLoader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { AuthProvider } from "@/context/AuthContext";
import { CollegeProvider } from "@/context/CollegeContext";
import { TimerProvider } from "@/context/TimerContext";
import { cn } from "@/lib/utils";

const createLazyPage = <T extends Record<string, unknown>>(
  loader: () => Promise<T>,
  key: string
) =>
  lazy(async () => {
    try {
      const module = await loader();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(`route-retry:${key}`);
      }
      return module;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isChunkLoadFailure =
        /Failed to fetch dynamically imported module|ChunkLoadError|Importing a module script failed/i.test(
          message
        );

      if (isChunkLoadFailure && typeof window !== "undefined") {
        const retryKey = `route-retry:${key}`;
        const alreadyRetried = window.sessionStorage.getItem(retryKey) === "1";
        if (!alreadyRetried) {
          window.sessionStorage.setItem(retryKey, "1");
          window.location.reload();
          return new Promise<never>(() => {});
        }
      }

      throw error;
    }
  });

const loadSelectCollege = () => import("./pages/SelectCollege");
const loadAuth = () => import("./pages/Auth");
const loadStudy = () => import("./pages/Study");
const loadNotices = () => import("./pages/Notices");
const loadNoticePost = () => import("./pages/NoticePost");
const loadChatroom = () => import("./pages/Chatroom");
const loadChatPostDetail = () => import("./pages/ChatPostDetail");
const loadProfile = () => import("./pages/Profile");
const loadMessages = () => import("./pages/Messages");
const loadExplore = () => import("./pages/Explore");
const loadDepartmentProfile = () => import("./pages/DepartmentProfile");
const loadBookmarks = () => import("./pages/Bookmarks");
const loadAIChat = () => import("./pages/AIChat");
const loadBlog = () => import("./pages/Blog");
const loadBlogPost = () => import("./pages/BlogPost");
const loadMobileApp = () => import("./pages/MobileApp");
const loadNotFound = () => import("./pages/NotFound");
const loadMobileBottomNav = () => import("@/components/mobile/MobileBottomNav");

// Lazy load all pages for code splitting
const SelectCollege = createLazyPage(loadSelectCollege, "select-college");
const Auth = createLazyPage(loadAuth, "auth");
const Study = createLazyPage(loadStudy, "study");
const Notices = createLazyPage(loadNotices, "notices");
const NoticePost = createLazyPage(loadNoticePost, "notice-post");
const Chatroom = createLazyPage(loadChatroom, "chatroom");
const ChatPostDetail = createLazyPage(loadChatPostDetail, "chat-post-detail");
const Profile = createLazyPage(loadProfile, "profile");
const Messages = createLazyPage(loadMessages, "messages");
const Explore = createLazyPage(loadExplore, "explore");
const DepartmentProfile = createLazyPage(loadDepartmentProfile, "department-profile");
const Bookmarks = createLazyPage(loadBookmarks, "bookmarks");
const AIChat = createLazyPage(loadAIChat, "ai-chat");
const Blog = createLazyPage(loadBlog, "blog");
const BlogPost = createLazyPage(loadBlogPost, "blog-post");
const MobileApp = createLazyPage(loadMobileApp, "mobile-app");
const NotFound = createLazyPage(loadNotFound, "not-found");
const MobileBottomNav = lazy(loadMobileBottomNav);

const recaptchaSiteKey = (import.meta.env.VITE_RECAPTCHA_SITE_KEY || "").trim();

const isLightweightPublicPath = (pathname: string) =>
  pathname === "/" ||
  pathname === "/select-college" ||
  pathname === "/blog" ||
  pathname.startsWith("/blog/") ||
  pathname === "/mobile-app";

const preloadRouteModules = () => {
  [
    loadAuth,
    loadStudy,
    loadNotices,
    loadNoticePost,
    loadChatroom,
    loadProfile,
    loadMessages,
    loadExplore,
    loadBookmarks,
    loadAIChat,
    loadBlog,
  ].forEach((loadPage) => {
    loadPage().catch(() => {
      // Ignore preload failures; route access will handle retry/reload logic if needed.
    });
  });
};

// Loading fallback component
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-hero">
    <div className="rounded-3xl border border-border/50 bg-card/80 px-8 py-6 shadow-card backdrop-blur-xl">
      <BrandLoader label="Loading your space..." />
    </div>
  </div>
);

const AppRoutes = () => {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route path="/" element={<SelectCollege />} />
      <Route path="/select-college" element={<SelectCollege />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/mobile-app" element={<MobileApp />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/study" element={<ProtectedRoute><Study /></ProtectedRoute>} />
      <Route path="/notices" element={<ProtectedRoute><Notices /></ProtectedRoute>} />
      <Route path="/notices/:accountHandle" element={<ProtectedRoute><Notices /></ProtectedRoute>} />
      <Route path="/notices/post/:noticeId" element={<ProtectedRoute><NoticePost /></ProtectedRoute>} />
      <Route path="/department/:deptId" element={<ProtectedRoute><DepartmentProfile /></ProtectedRoute>} />
      <Route path="/chatroom" element={<ProtectedRoute><Chatroom /></ProtectedRoute>} />
      <Route path="/chatroom/:roomId" element={<ProtectedRoute><Chatroom /></ProtectedRoute>} />
      <Route path="/chatroom/:roomId/post/:postId" element={<ProtectedRoute><ChatPostDetail /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
      <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
      <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/messages/:username" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const AppProviders = ({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) => {
  if (!enabled) {
    return <>{children}</>;
  }

  const appTree = (
    <AuthProvider>
      <CollegeProvider>
        <TimerProvider>{children}</TimerProvider>
      </CollegeProvider>
    </AuthProvider>
  );

  if (!recaptchaSiteKey) {
    return appTree;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={recaptchaSiteKey}
      scriptProps={{
        async: true,
        defer: true,
      }}
    >
      {appTree}
    </GoogleReCaptchaProvider>
  );
};

const App = () => {
  const location = useLocation();
  const lightweightPublicRoute = isLightweightPublicPath(location.pathname);
  const shouldRenderMobileNav = !lightweightPublicRoute && location.pathname !== "/auth";

  return (
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppProviders enabled={!lightweightPublicRoute}>
          <div className={cn(shouldRenderMobileNav && "pb-16 md:pb-0")}>
            <Suspense fallback={<PageLoader />}>
              <AppRoutes />
            </Suspense>
          </div>
          {shouldRenderMobileNav ? (
            <Suspense fallback={null}>
              <MobileBottomNav />
            </Suspense>
          ) : null}
        </AppProviders>
        <Analytics />
      </TooltipProvider>
    </ThemeProvider>
  );
};

const AppWithPreload = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined" || isLightweightPublicPath(location.pathname)) {
      return;
    }

    const usesIdleCallback = "requestIdleCallback" in window;
    const schedule = usesIdleCallback
      ? window.requestIdleCallback(() => preloadRouteModules(), { timeout: 1500 })
      : window.setTimeout(() => preloadRouteModules(), 800);

    return () => {
      if (usesIdleCallback && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(schedule);
      } else {
        window.clearTimeout(schedule);
      }
    };
  }, [location.pathname]);

  return <App />;
};

export default AppWithPreload;
