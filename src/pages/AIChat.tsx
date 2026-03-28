import { useEffect, useState } from "react";
import { ArrowLeft, Menu } from "lucide-react";
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
    <div className="relative flex h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[14%] top-[-12%] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-18%] right-[-10%] h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <SEO
        title="AI Chat"
        description="Ask AI questions about your PDFs and study materials for faster revision and exam prep."
        noIndex
      />

      <div
        className={`relative z-10 hidden h-screen overflow-hidden shrink-0 transition-all duration-300 lg:block ${sidebarOpen ? "w-72" : "w-14"}`}
      >
        <StudySidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <MobileSidebar
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
          <div className="px-3 sm:px-4 md:px-6">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3">
              <div className="flex shrink-0 items-center gap-2">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                </Sheet>
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden"
                  onClick={() => navigate("/study")}
                  title="Back to Resources"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden items-center gap-2 sm:flex"
                  onClick={() => navigate("/study")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Resources
                </Button>
              </div>

              <div className="min-w-0 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/80">
                  AI Workspace
                </p>
                <p className="text-sm font-semibold text-foreground">
                  StudyShare AI
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {collegeLabel}
                </p>
              </div>

              <div className="flex w-8 items-center justify-end sm:w-[148px]">
                <div className="hidden items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary sm:inline-flex">
                  Live Trace
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-2 py-2 sm:px-3 sm:py-3 md:px-6 md:pb-6">
          <div className="mx-auto h-full max-w-6xl">
            <div className="h-full overflow-hidden rounded-[28px] border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.08),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.74),rgba(2,6,23,0.96))] shadow-card">
              <AIRagChat variant="minimal" className="h-full rounded-[28px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
