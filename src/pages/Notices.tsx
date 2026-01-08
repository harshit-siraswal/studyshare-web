import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, MessageCircle, Heart, Share, Search,
  Bell, FileText, Play, Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ImageViewer from "@/components/ImageViewer";
import VideoPlayer from "@/components/VideoPlayer";
import { supabase } from "../supabase";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import * as api from "@/lib/api";
import { useBookmarks } from "@/hooks/useBookmarks";

// --- Types ---
interface Notice {
  id: string;
  title: string;
  content: string;
  department: string;
  priority: string;
  file_url: string | null;
  file_type: 'pdf' | 'video' | 'image' | null;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  likes: number;
  comments: number;
}

// --- Constants ---
const DEPARTMENTS = [
  { value: 'all', label: 'All Departments', icon: '🏛️' },
  { value: 'cse', label: 'Computer Science', icon: '💻' },
  { value: 'ece', label: 'Electronics', icon: '⚡' },
  { value: 'me', label: 'Mechanical', icon: '⚙️' },
  { value: 'ce', label: 'Civil', icon: '🏗️' },
  { value: 'eee', label: 'Electrical', icon: '🔌' },
  { value: 'aiml', label: 'AI & ML', icon: '🤖' },
  { value: 'ds', label: 'Data Science', icon: '📊' },
  { value: 'it', label: 'Information Technology', icon: '🌐' },
];

const Notices = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedDeptIds, setFollowedDeptIds] = useState<string[]>([]);
  const [likedNotices, setLikedNotices] = useState<string[]>([]);
  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false, url: "", title: ""
  });
  const [videoPlayer, setVideoPlayer] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false, url: "", title: ""
  });

  // Bookmarks hook
  const { isBookmarked, toggleBookmark } = useBookmarks();

  // Fetch logic
  useEffect(() => {
    fetchNotices();
    if (user?.email) {
      fetchFollowedDepartments();
    }
  }, [user]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validNotices = (data || []).map(n => ({
        ...n,
        likes: n.likes || 0, // Fallback if column missing/null
        comments: n.comments || 0
      }));

      setNotices(validNotices);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowedDepartments = async () => {
    if (!user?.email) return;
    try {
      const response = await api.getFollowedDepartments();
      setFollowedDeptIds(response.departments);
    } catch (error) {
      console.error('Error fetching followed departments:', error);
    }
  };

  const handleFollowDept = async (deptId: string) => {
    if (!user?.email) {
      toast.error("Login to follow departments");
      return;
    }

    try {
      if (followedDeptIds.includes(deptId)) {
        await api.unfollowDepartment(deptId);
        setFollowedDeptIds(prev => prev.filter(id => id !== deptId));
        toast.success(`Unfollowed`);
      } else {
        await api.followDepartment(deptId);
        setFollowedDeptIds(prev => [...prev, deptId]);
        toast.success(`Following`);
      }
    } catch (error) {
      toast.error("Failed to update follow status");
    }
  };

  const toggleLike = (noticeId: string) => {
    setLikedNotices(prev =>
      prev.includes(noticeId) ? prev.filter(id => id !== noticeId) : [...prev, noticeId]
    );
  };

  const getDeptInfo = (deptCode: string) => {
    return DEPARTMENTS.find(d => d.value === deptCode) || { label: 'Unknown', icon: '❓', value: deptCode };
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMins = Math.floor(diffInMs / (1000 * 60));
      return diffInMins <= 1 ? 'Just now' : `${diffInMins}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  // Filter notices
  const displayedNotices = activeTab === 'following'
    ? notices.filter(n => followedDeptIds.includes(n.department))
    : notices;

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <div className="w-full max-w-[1000px] flex">

        {/* --- LEFT SIDEBAR (Who to follow) --- */}
        <div className="hidden lg:block w-[350px] p-4 sticky top-0 h-screen overflow-y-auto border-r border-border/50">
          {/* Search */}
          <div className="sticky top-0 bg-background pb-3 z-10">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input placeholder="Search notices..." className="pl-11 rounded-full bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background" />
            </div>
          </div>

          {/* Who to follow card */}
          <Card className="bg-secondary/20 border-border/50 rounded-2xl p-4 space-y-4">
            <h2 className="font-bold text-xl px-2">Who to follow</h2>
            <div className="space-y-4">
              {DEPARTMENTS.filter(d => d.value !== 'all').slice(0, 5).map(dept => {
                const isFollowing = followedDeptIds.includes(dept.value);
                return (
                  <div key={dept.value} className="flex items-center justify-between px-2 cursor-pointer hover:bg-secondary/30 p-2 rounded-lg transition-colors" onClick={() => navigate(`/department/${dept.value}`)}>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-border/50">
                        <AvatarFallback className="bg-background text-lg">{dept.icon}</AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <div className="font-bold hover:underline">{dept.label}</div>
                        <div className="text-muted-foreground text-sm">@{dept.value}</div>
                      </div>
                    </div>
                    <Button
                      className={cn(
                        "rounded-full font-bold h-8 transition-all duration-200",
                        isFollowing
                          ? "bg-transparent border border-border text-foreground hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 w-24"
                          : "bg-foreground text-background hover:bg-foreground/90 w-20"
                      )}
                      onClick={(e) => { e.stopPropagation(); handleFollowDept(dept.value); }}
                      onMouseEnter={(e) => {
                        if (isFollowing) e.currentTarget.textContent = "Unfollow";
                      }}
                      onMouseLeave={(e) => {
                        if (isFollowing) e.currentTarget.textContent = "Following";
                      }}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="px-2 text-primary text-sm cursor-pointer hover:underline">Show more</div>
          </Card>

          <div className="mt-6 px-4 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span className="hover:underline cursor-pointer">Terms of Service</span>
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="hover:underline cursor-pointer">Cookie Policy</span>
            <span className="hover:underline cursor-pointer">Accessibility</span>
            <span className="hover:underline cursor-pointer">Ads info</span>
            <span>© 2026 Studyspace</span>
          </div>
        </div>

        {/* --- MIDDLE COLUMN (Feed) --- */}
        <main className="flex-1 min-w-[350px] max-w-[600px]">
          {/* Header / Tabs with Back Button */}
          <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
            {/* Back button row (always visible) */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-secondary/50"
                onClick={() => {
                  // If there's browser history, go back; otherwise go to /study
                  if (window.history.length > 1 && location.key !== 'default') {
                    navigate(-1);
                  } else {
                    navigate('/study');
                  }
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-bold text-xl">Notices</h1>
            </div>

            {/* Tabs */}
            <div className="flex w-full">
              <div
                className={cn(
                  "flex-1 text-center py-4 cursor-pointer hover:bg-secondary/30 transition-colors relative font-medium",
                  activeTab === 'foryou' ? "font-bold" : "text-muted-foreground"
                )}
                onClick={() => setActiveTab('foryou')}
              >
                For You
                {activeTab === 'foryou' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full"></div>}
              </div>
              <div
                className={cn(
                  "flex-1 text-center py-4 cursor-pointer hover:bg-secondary/30 transition-colors relative font-medium",
                  activeTab === 'following' ? "font-bold" : "text-muted-foreground"
                )}
                onClick={() => setActiveTab('following')}
              >
                Following
                {activeTab === 'following' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full"></div>}
              </div>
            </div>
          </div>

          {/* Feed Content */}
          <div className="pb-20 md:pb-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading notices...</div>
            ) : displayedNotices.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <h3 className="text-lg font-bold mb-2">No notices yet</h3>
                <p>Check back later or follow more departments!</p>
              </div>
            ) : (
              displayedNotices.map((notice) => {
                const dept = getDeptInfo(notice.department);
                return (
                  <div key={notice.id} className="p-4 border-b border-border/50 hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => navigate(`/department/${notice.department}`)}>
                    <div className="flex gap-3">
                      <div className="shrink-0" onClick={(e) => { e.stopPropagation(); navigate(`/department/${notice.department}`); }}>
                        <Avatar className="w-10 h-10 border border-border">
                          <AvatarFallback className="bg-secondary text-lg">{dept.icon}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/department/${notice.department}`); }}>
                            {dept.label}
                          </span>
                          <span className="text-muted-foreground text-sm">@{dept.value}</span>
                          <span className="text-muted-foreground text-sm">·</span>
                          <span className="text-muted-foreground text-sm hover:underline">{formatTimeAgo(notice.created_at)}</span>
                          {notice.priority === 'urgent' && <Badge variant="destructive" className="ml-auto h-5 text-[10px]">Urgent</Badge>}
                        </div>

                        {notice.title && <h3 className="font-bold mt-1 text-base">{notice.title}</h3>}
                        <div className="text-foreground/90 whitespace-pre-wrap mt-1 text-[15px] leading-normal">{notice.content}</div>

                        {/* Media */}
                        {notice.file_url && (
                          <div className="mt-3 rounded-2xl overflow-hidden border border-border/50 max-h-[400px]">
                            {notice.file_type === 'image' && (
                              <img
                                src={notice.file_url}
                                alt="Notice attachment"
                                className="w-full h-full object-cover cursor-pointer hover:opacity-95"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImageViewer({ isOpen: true, url: notice.file_url!, title: notice.title || "Image" });
                                }}
                              />
                            )}
                            {notice.file_type === 'pdf' && (
                              <div className="p-4 bg-secondary/20 flex items-center gap-3">
                                <FileText className="w-8 h-8 text-primary" />
                                <span className="text-sm font-medium flex-1 truncate">View PDF Attachment</span>
                                <Button variant="outline" size="sm" onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(notice.file_url!, '_blank');
                                }}>Open</Button>
                              </div>
                            )}
                            {notice.file_type === 'video' && (
                              <div className="relative group cursor-pointer bg-black h-64 flex items-center justify-center" onClick={(e) => {
                                e.stopPropagation();
                                setVideoPlayer({ isOpen: true, url: notice.file_url!, title: notice.title || "Video" });
                              }}>
                                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-all scale-100 group-hover:scale-110">
                                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Bar */}
                        <div className="flex items-center justify-between mt-3 max-w-[425px] text-muted-foreground">
                          <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-blue-400 hover:bg-blue-400/10 rounded-full group">
                            <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "w-8 h-8 hover:text-pink-500 hover:bg-pink-500/10 rounded-full group",
                              likedNotices.includes(notice.id) && "text-pink-500"
                            )}
                            onClick={(e) => { e.stopPropagation(); toggleLike(notice.id); }}
                          >
                            <Heart className={cn("w-4 h-4 group-hover:scale-110 transition-transform", likedNotices.includes(notice.id) && "fill-current")} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "w-8 h-8 hover:text-primary hover:bg-primary/10 rounded-full group",
                              isBookmarked(notice.id) && "text-primary"
                            )}
                            onClick={(e) => { e.stopPropagation(); toggleBookmark(notice.id, 'notice'); }}
                          >
                            <Bookmark className={cn("w-4 h-4 group-hover:scale-110 transition-transform", isBookmarked(notice.id) && "fill-current")} />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-green-500 hover:bg-green-500/10 rounded-full group">
                            <Share className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

      </div>

      {/* Media Viewers */}
      <ImageViewer
        isOpen={imageViewer.isOpen}
        onClose={() => setImageViewer({ isOpen: false, url: "", title: "" })}
        imageUrl={imageViewer.url}
        title={imageViewer.title}
      />

      <VideoPlayer
        isOpen={videoPlayer.isOpen}
        onClose={() => setVideoPlayer({ isOpen: false, url: "", title: "" })}
        videoUrl={videoPlayer.url}
        title={videoPlayer.title}
      />
    </div>
  );
};

// Helper components
const NavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <div className={cn("inline-flex items-center gap-4 px-4 py-3 rounded-full hover:bg-secondary/50 cursor-pointer transition-colors text-xl w-auto pr-8", active && "font-bold")} onClick={onClick}>
    <Icon className={cn("w-7 h-7", active ? "stroke-[2.5px]" : "stroke-2")} />
    <span className="hidden xl:inline">{label}</span>
    <span className="xl:hidden md:inline">{label}</span>
  </div>
);

export default Notices;
