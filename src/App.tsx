import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { MobileBottomNav } from "@/components/mobile";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Study from "./pages/Study";
import Notices from "./pages/Notices";
import Chatroom from "./pages/Chatroom";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Explore from "./pages/Explore";
import DepartmentProfile from "./pages/DepartmentProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {/* Main content with bottom padding for mobile nav */}
        <div className="pb-16 md:pb-0">
          {/* ✅ ROUTES ONLY — NO BrowserRouter HERE */}
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
            <Route path="/explore" element={<Explore />} /> {/* Explore Page */}
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:username" element={<Messages />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        {/* Mobile bottom navigation - visible only on mobile (md:hidden in component) */}
        <MobileBottomNav />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

