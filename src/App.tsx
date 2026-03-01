import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { MobileBottomNav } from "@/components/mobile";
import { Analytics } from "@vercel/analytics/react";
import BrandLoader from "@/components/BrandLoader";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy load all pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Study = lazy(() => import("./pages/Study"));
const Notices = lazy(() => import("./pages/Notices"));
const Chatroom = lazy(() => import("./pages/Chatroom"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Explore = lazy(() => import("./pages/Explore"));
const DepartmentProfile = lazy(() => import("./pages/DepartmentProfile"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const AIChat = lazy(() => import("./pages/AIChat"));
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {/* Main content with bottom padding for mobile nav */}
        <div className="pb-16 md:pb-0">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/select-college" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/study" element={<ProtectedRoute><Study /></ProtectedRoute>} />
              <Route path="/notices" element={<ProtectedRoute><Notices /></ProtectedRoute>} />
              <Route path="/notices/:accountHandle" element={<ProtectedRoute><Notices /></ProtectedRoute>} />
              <Route path="/department/:deptId" element={<ProtectedRoute><DepartmentProfile /></ProtectedRoute>} />
              <Route path="/chatroom" element={<ProtectedRoute><Chatroom /></ProtectedRoute>} />
              <Route path="/chatroom/:roomId" element={<ProtectedRoute><Chatroom /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
              <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
              <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/messages/:username" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
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
