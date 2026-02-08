import { useEffect, useState } from "react";
import { Menu, Sparkles } from "lucide-react";
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
    <div className="h-screen bg-background flex overflow-hidden">
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
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border">
          <div className="px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3 h-16">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Chat</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCollege?.name || "Your College"}
                  </p>
                </div>
              </div>
              <div className="ml-auto text-xs text-muted-foreground hidden sm:block">
                Focused answers from your PDFs
              </div>
            </div>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-hidden px-4 md:px-6 lg:px-8 py-6">
          <div className="h-full max-w-5xl mx-auto">
            <AIRagChat variant="minimal" className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
