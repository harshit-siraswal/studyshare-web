import { useState, useEffect } from "react";
import {
  Bookmark, MessageSquare, Bell, ChevronDown, ChevronRight, Hash, Users, LogOut,
  Plus, Lock, PanelLeftClose, PanelLeft, KeyRound, ExternalLink, Trash2, User, Search, Sparkles, Moon, Sun, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import CreateChatRoomDialog from "./CreateChatRoomDialog";
import JoinChatRoomDialog from "./JoinChatRoomDialog";
import NotificationCenter from "./NotificationCenter";
import { toast } from "sonner";
import { supabase } from "../supabase";
import { useTheme } from "@/hooks/useTheme";

const SIDEBAR_USER_SELECT =
  "id, email, display_name, profile_photo_url, username, college";

const chatRooms = [
  { id: "placement", name: "placement", members: 312, isPrivate: false },
  { id: "general", name: "general", members: 567, isPrivate: false },
  { id: "cse-2024", name: "cse-2024", members: 145, isPrivate: false },
  { id: "aiml-B", name: "aiml-B", members: 89, isPrivate: false },
  { id: "team-sigma", name: "team sigma", members: 5, isPrivate: true },
];

interface StudySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const StudySidebar = ({ isOpen, onToggle }: StudySidebarProps) => {
  const [expandedSections, setExpandedSections] = useState({
    bookmarks: true,
    chat: true,
  });
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const localUser = JSON.parse(localStorage.getItem("user") || "{}");
  // Use authUser from context, fallback to localStorage
  const user = authUser || localUser;
  const selectedCollege = JSON.parse(localStorage.getItem("selectedCollege") || "{}");

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Fetch user profile from Supabase
  useEffect(() => {
    const fetchUserProfile = async () => {
      const userId = authUser?.uid || localUser?.uid;
      if (!userId) return;

      try {
        const { data } = await supabase
          .from('users_safe')
          .select(SIDEBAR_USER_SELECT)
          .eq('id', userId)
          .maybeSingle();

        if (data) {
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [authUser?.uid, localUser?.uid]);

  useEffect(() => {
    const storedBookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    setBookmarks(storedBookmarks);

    const handleStorageChange = () => {
      const updated = JSON.parse(localStorage.getItem("bookmarks") || "[]");
      setBookmarks(updated);
    };

    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(() => {
      const current = JSON.parse(localStorage.getItem("bookmarks") || "[]");
      if (JSON.stringify(current) !== JSON.stringify(bookmarks)) {
        setBookmarks(current);
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLogout = async () => {
    try {
      // Logout from Firebase
      await logout();

      // Clear local storage
      localStorage.removeItem("user");
      localStorage.removeItem("selectedCollege");

      // Navigate to college selection
      navigate("/", { replace: true });
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  const removeBookmark = (id: number) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    localStorage.setItem("bookmarks", JSON.stringify(updated));
    setBookmarks(updated);
    toast.success("Bookmark removed");
  };

  // Collapsed mini sidebar
  if (!isOpen) {
    return (
      <>
        <TooltipProvider delayDuration={0}>
          <div className="h-full w-14 bg-sidebar border-r border-sidebar-border flex flex-col py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="mx-auto mb-2"
                >
                  <PanelLeft className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand Sidebar</TooltipContent>
            </Tooltip>

            <div className="flex-1 flex flex-col items-center gap-1 py-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/profile")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Avatar className="h-8 w-8">
                      {userProfile?.profile_photo_url ? (
                        <AvatarImage
                          src={userProfile.profile_photo_url}
                          alt={userProfile.display_name || user.displayName}
                        />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(userProfile?.display_name || user.displayName || user.name || user.email || 'User')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{userProfile?.display_name || user.displayName || user.name || "Profile"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/bookmarks")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Bookmark className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Bookmarks</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/explore")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Explore Students</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/notices")}
                    className="text-muted-foreground hover:text-foreground relative"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">College Notices</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/chatroom")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Chat Rooms</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/ai-chat")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Sparkles className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">AI Chat</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/mobile-app")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Smartphone className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Android App</TooltipContent>
              </Tooltip>
            </div>

            <div className="mt-auto flex flex-col items-center gap-1 px-2 pt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {theme === "dark" ? (
                      <Sun className="w-5 h-5" />
                    ) : (
                      <Moon className="w-5 h-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLogoutDialog(true)}
                    className="mx-auto text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent className="mx-4 max-w-sm sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be redirected to the college selection page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col w-72 transition-all duration-300 overflow-hidden">
      {/* Header with toggle */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-10 h-10 shrink-0">
              {userProfile?.profile_photo_url ? (
                <AvatarImage
                  src={userProfile.profile_photo_url}
                  alt={userProfile.display_name || user.name}
                />
              ) : (
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                  {getInitials(userProfile?.display_name || user.name || user.displayName || user.email || 'User')}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-medium text-sidebar-foreground truncate">
                {userProfile?.display_name || user.displayName || user.name || user.email?.split('@')[0] || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {selectedCollege?.name || userProfile?.college || "Your College"}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={onToggle}>
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4 pb-24">
          {/* Bookmarks - Navigate to full page like mobile */}
          <div>
            <Button
              variant="ghost"
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground justify-start"
              onClick={() => navigate("/bookmarks")}
            >
              <Bookmark className="w-4 h-4" />
              <span>Bookmarks</span>
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </div>

          {/* Explore Students */}
          <div>
            <Button
              variant="ghost"
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground justify-start"
              onClick={() => navigate("/explore")}
            >
              <Search className="w-4 h-4" />
              <span>Explore Students</span>
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </div>

          {/* College Notices */}
          <div>
            <Button
              variant="ghost"
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground justify-start"
              onClick={() => navigate("/notices")}
            >
              <Bell className="w-4 h-4" />
              <span>College Notices</span>
              <span className="ml-auto w-2 h-2 bg-destructive rounded-full" />
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {/* Chat Rooms */}
          <div>
            <Button
              variant="ghost"
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground justify-start"
              onClick={() => navigate("/chatroom")}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat Rooms</span>
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </div>

          {/* AI Chat */}
          <div>
            <Button
              variant="ghost"
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground justify-start"
              onClick={() => navigate("/ai-chat")}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Chat</span>
            </Button>
          </div>

          <div>
            <Button
              variant="ghost"
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground justify-start"
              onClick={() => navigate("/mobile-app")}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android App</span>
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3">
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </Button>

          <Button
            variant="ghost"
            className="flex w-full items-center justify-start gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-destructive"
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="mx-4 max-w-sm sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the college selection page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudySidebar;
