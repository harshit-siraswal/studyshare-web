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
    <div className="flex h-screen overflow-hidden bg-background">

      <SEO
        title="AI Chat"
        description="Ask AI questions about your PDFs and study materials for faster revision and exam prep."
        noIndex
      />

      <div
        className={`hidden h-screen shrink-0 overflow-hidden transition-all duration-300 lg:block ${sidebarOpen ? "w-72" : "w-14"}`}
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

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="sticky top-0 z-40 border-b border-border bg-background">
          <div className="px-3 sm:px-4 md:px-6">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3">
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
                <p className="text-sm font-semibold text-foreground">
                  StudyShare AI
                </p>
                <p className="truncate text-xs text-muted-foreground md:block">
                  {collegeLabel}
                </p>
              </div>

              <div className="flex w-8 items-center justify-end sm:w-[148px]">
                <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                  Minimal Chat
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-2 py-2 sm:px-4 sm:py-4 md:px-6 md:pb-6">
          <div className="mx-auto h-full max-w-6xl">
            <AIRagChat
              variant="minimal"
              className="h-full rounded-3xl border border-border bg-card/30 shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
