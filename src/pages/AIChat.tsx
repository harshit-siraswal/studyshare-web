import { useEffect, useState } from "react";
import { ArrowLeft, Menu, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import StudySidebar from "@/components/StudySidebar";
import MobileSidebar from "@/components/mobile/MobileSidebar";
import AIRagChat from "@/components/ai/AIRagChat";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";

const AIChat = () => {
  const { user, loading } = useAuth();
  const { selectedCollege } = useCollege();
  const collegeLabel = selectedCollege?.name || "Your College";
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="relative h-screen flex overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,rgba(16,185,129,0.12),transparent_55%),radial-gradient(100%_100%_at_100%_0%,rgba(251,191,36,0.1),transparent_60%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] dark:bg-[radial-gradient(120%_120%_at_0%_0%,rgba(45,212,191,0.12),transparent_55%),radial-gradient(100%_100%_at_100%_0%,rgba(251,191,36,0.1),transparent_60%),linear-gradient(135deg,rgba(8,16,28,0.95),rgba(6,12,22,0.98))]">
      <SEO title="AI Chat" description="Ask AI questions about your PDFs and study material." />

      {/* Desktop Sidebar */}
      <div className={`hidden lg:block transition-all duration-300 ${sidebarOpen ? "w-72" : "w-14"} h-screen overflow-hidden shrink-0`}>
        <StudySidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Minimal Header */}
        <div className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-background/90">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent dark:via-emerald-400/25" />
          <div className="px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3 h-16">
              <div className="flex items-center gap-2">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden border border-emerald-500/20 bg-emerald-500/10 text-emerald-800/90 hover:bg-emerald-500/15 dark:border-white/10 dark:bg-white/5 dark:text-foreground"
                    >
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                </Sheet>
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden border border-emerald-500/20 bg-emerald-500/10 text-emerald-800/90 hover:bg-emerald-500/15 dark:border-white/10 dark:bg-white/5 dark:text-foreground"
                  onClick={() => navigate("/study")}
                  title="Back to Resources"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-800/90 hover:bg-emerald-500/15 dark:border-white/10 dark:bg-white/5 dark:text-foreground"
                  onClick={() => navigate("/study")}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Resources
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 dark:bg-emerald-400/15 dark:ring-emerald-400/30">
                  <Sparkles className="h-4 w-4 text-emerald-700 dark:text-emerald-200" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gradient font-editorial">AI Chat</p>
                    <span className="hidden sm:inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-100">
                      AI Lab
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {collegeLabel}
                  </p>
                </div>
              </div>
              <div className="ml-auto hidden sm:block text-xs text-emerald-700/70 dark:text-emerald-100/60">
                Focused answers from your PDFs
              </div>
            </div>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-hidden px-4 md:px-6 lg:px-8 py-6">
          <div className="h-full max-w-5xl mx-auto">
            <div className="h-full rounded-3xl border border-emerald-900/10 bg-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-black/30 dark:shadow-[0_28px_60px_rgba(3,7,18,0.45)]">
              <AIRagChat variant="minimal" className="h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
