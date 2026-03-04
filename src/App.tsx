import { lazy, Suspense } from "react";
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

// Lazy load all pages for code splitting
const SelectCollege = lazy(() => import("./pages/SelectCollege"));
const Auth = lazy(() => import("./pages/Auth"));
const Study = lazy(() => import("./pages/Study"));
const Notices = lazy(() => import("./pages/Notices"));
const Chatroom = lazy(() => import("./pages/Chatroom"));
const ChatPostDetail = lazy(() => import("./pages/ChatPostDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Explore = lazy(() => import("./pages/Explore"));
const DepartmentProfile = lazy(() => import("./pages/DepartmentProfile"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const AIChat = lazy(() => import("./pages/AIChat"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
  <div className="flex items-center justify-center h-screen bg-background">
    <BrandLoader label="Loading your space..." />
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

export default App;
