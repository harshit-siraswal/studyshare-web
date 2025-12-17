import { useState, useEffect } from "react";
import { 
  Bookmark, MessageSquare, Bell, ChevronDown, ChevronRight, Hash, Users, LogOut, 
  Plus, Lock, PanelLeftClose, PanelLeft, KeyRound, ExternalLink, Trash2, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import CreateChatRoomDialog from "./CreateChatRoomDialog";
import JoinChatRoomDialog from "./JoinChatRoomDialog";
import NotificationCenter from "./NotificationCenter";
import { toast } from "sonner";

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
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

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

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("selectedCollege");
    navigate("/");
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
                  <User className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Profile</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleSection("bookmarks")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Bookmark className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Bookmarks ({bookmarks.length})</TooltipContent>
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
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="mx-auto text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col w-72 transition-all duration-300">
      {/* Header with toggle */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <button 
          onClick={() => navigate("/profile")}
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold shrink-0">
            {user.name?.[0] || "S"}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-sidebar-foreground truncate">{user.name || "Student"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.college || "College"}</p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive shrink-0">
            <LogOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggle} className="shrink-0">
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Bookmarks */}
          <div>
            <button
              onClick={() => toggleSection("bookmarks")}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {expandedSections.bookmarks ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Bookmark className="w-4 h-4" />
              <span>Bookmarks</span>
              <span className="ml-auto text-xs bg-secondary px-1.5 py-0.5 rounded">{bookmarks.length}</span>
            </button>
            {expandedSections.bookmarks && (
              <div className="mt-1 space-y-0.5 pl-4">
                {bookmarks.length > 0 ? (
                  bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors group"
                    >
                      <span className="flex-1 truncate">{bookmark.title}</span>
                      <button
                        onClick={() => removeBookmark(bookmark.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">No bookmarks yet</p>
                )}
              </div>
            )}
          </div>

          {/* College Notices - Now a button */}
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
            <button
              onClick={() => toggleSection("chat")}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {expandedSections.chat ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <MessageSquare className="w-4 h-4" />
              <span>Chat Rooms</span>
            </button>
            {expandedSections.chat && (
              <div className="mt-1 space-y-0.5 pl-4">
                {chatRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => navigate(`/chatroom/${room.id}`)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors"
                  >
                    {room.isPrivate ? (
                      <Lock className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Hash className="w-4 h-4 text-primary" />
                    )}
                    <span>{room.name}</span>
                    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {room.members}
                    </span>
                  </button>
                ))}
                
                <div className="flex gap-1 mt-2">
                  <CreateChatRoomDialog
                    trigger={
                      <Button variant="ghost" size="sm" className="flex-1 text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Create
                      </Button>
                    }
                  />
                  <JoinChatRoomDialog
                    trigger={
                      <Button variant="ghost" size="sm" className="flex-1 text-xs">
                        <KeyRound className="w-3 h-3 mr-1" />
                        Join
                      </Button>
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default StudySidebar;
