import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { MobileBottomNav } from "@/components/mobile";
import { Analytics } from "@vercel/analytics/react";
import BrandLoader from "@/components/BrandLoader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AnimatePresence, motion } from "framer-motion";

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
const loadNotFound = () => import("./pages/NotFound");

// Lazy load all pages for code splitting
const SelectCollege = createLazyPage(loadSelectCollege, "select-college");
const Auth = createLazyPage(loadAuth, "auth");
const Study = createLazyPage(loadStudy, "study");
const Notices = createLazyPage(loadNotices, "notices");
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
const NotFound = createLazyPage(loadNotFound, "not-found");

const preloadRouteModules = () => {
  [
    loadAuth,
    loadStudy,
    loadNotices,
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

// Optimized QueryClient configuration for better caching and reduced network requests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - cache retention (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch when user switches tabs
      retry: 1, // Only retry once on failure
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-hero">
    <div className="rounded-3xl border border-border/50 bg-card/80 px-8 py-6 shadow-card backdrop-blur-xl">
      <BrandLoader label="Loading your space..." />
    </div>
  </div>
);

const AnimatedAppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.995 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<SelectCollege />} />
          <Route path="/select-college" element={<SelectCollege />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/study" element={<ProtectedRoute><Study /></ProtectedRoute>} />
          <Route path="/notices" element={<ProtectedRoute><Notices /></ProtectedRoute>} />
          <Route path="/notices/:accountHandle" element={<ProtectedRoute><Notices /></ProtectedRoute>} />
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
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {/* Main content with bottom padding for mobile nav */}
        <div className="pb-16 md:pb-0">
          <Suspense fallback={<PageLoader />}>
            <AnimatedAppRoutes />
          </Suspense>
        </div>

        {/* Mobile bottom navigation - visible only on mobile (md:hidden in component) */}
        <MobileBottomNav />
        <Analytics />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

const AppWithPreload = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const schedule = "requestIdleCallback" in window
      ? window.requestIdleCallback(() => preloadRouteModules(), { timeout: 1500 })
      : window.setTimeout(() => preloadRouteModules(), 800);

    return () => {
      if (typeof schedule === "number") {
        window.clearTimeout(schedule);
      } else if ("cancelIdleCallback" in window) {
        window.cancelIdleCallback(schedule);
      }
    };
  }, []);

  return <App />;
};

export default AppWithPreload;
