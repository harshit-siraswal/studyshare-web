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
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="px-3 sm:px-4 md:px-6">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                    >
                      <Menu className="w-5 h-5" />
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
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex items-center gap-2"
                  onClick={() => navigate("/study")}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Resources
                </Button>
              </div>
              <div className="min-w-0 text-center">
                <p className="text-sm font-semibold text-foreground">StudyShare AI</p>
                <p className="truncate text-xs text-muted-foreground">{collegeLabel}</p>
              </div>
              <div className="w-8 sm:w-[132px]" />
            </div>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-hidden px-2 py-2 sm:px-3 sm:py-3 md:px-6">
          <div className="h-full max-w-5xl mx-auto">
            <div className="h-full rounded-2xl border border-border/60 bg-card/40">
              <AIRagChat variant="minimal" className="h-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
