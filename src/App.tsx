import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { MobileBottomNav } from "@/components/mobile";

// Lazy load all pages for code splitting
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
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
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
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/study" element={<Study />} />
              <Route path="/notices" element={<Notices />} />
              <Route path="/notices/:accountHandle" element={<Notices />} />
              <Route path="/department/:deptId" element={<DepartmentProfile />} />
              <Route path="/chatroom" element={<Chatroom />} />
              <Route path="/chatroom/:roomId" element={<Chatroom />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:username" element={<Messages />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>

        {/* Mobile bottom navigation - visible only on mobile (md:hidden in component) */}
        <MobileBottomNav />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
