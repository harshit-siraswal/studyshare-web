import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Heart, Share, Send, Search, Image as ImageIcon, Bell, FileText, Video as VideoIcon, Calendar, Building, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ImageViewer from "@/components/ImageViewer";
import VideoPlayer from "@/components/VideoPlayer";
import FollowButton from "@/components/FollowButton";
import { supabase } from "../supabase";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";

interface Comment {
  id: number;
  author: string;
  authorEmail?: string;
  content: string;
  time: string;
  date: string;
  likes: number;
  replies?: Comment[];
}

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
  author?: string;
  authorEmail?: string;
  handle?: string;
  time?: string;
  date?: string;
  likes: number;
  comments: Comment[];
  important?: boolean;
  image?: string;
  video?: string;
}

const DEPARTMENTS = [
  { value: 'all', label: 'All' },
  { value: 'cse', label: 'CSE' },
  { value: 'ece', label: 'ECE' },
  { value: 'me', label: 'ME' },
  { value: 'ce', label: 'CE' },
  { value: 'eee', label: 'EEE' },
  { value: 'aiml', label: 'AI/ML' },
  { value: 'ds', label: 'DS' },
  { value: 'it', label: 'IT' },
];

const Notices = () => {
  const navigate = useNavigate();
  const { accountHandle } = useParams();
  const { user } = useAuth();
  const { selectedCollege } = useCollege();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedNotices, setLikedNotices] = useState<string[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false, url: "", title: ""
  });
  const [videoPlayer, setVideoPlayer] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false, url: "", title: ""
  });

  // Fetch notices from database
  useEffect(() => {
    fetchNotices();

    const subscription = supabase
      .channel('notices_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notices' },
        () => fetchNotices()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const userDepartment = user?.branch || 'cse';
      const collegeId = selectedCollege?.domain || 'kiet.edu';

      let query = supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .eq('college_id', collegeId)
        .or(`department.eq.all,department.eq.${userDepartment}`)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const activeNotices = (data || [])
        .filter(notice => !notice.expires_at || new Date(notice.expires_at) > new Date())
        .map(notice => ({
          ...notice,
          author: notice.created_by,
          authorEmail: `${notice.created_by.toLowerCase().replace(/\s+/g, '')}@admin.edu`,
          handle: `@${notice.created_by.toLowerCase().replace(/\s+/g, '')}`,
          time: formatTimeAgo(notice.created_at),
          date: notice.created_at,
          likes: 0,
          comments: [],
          important: notice.priority === 'urgent' || notice.priority === 'high',
          image: notice.file_type === 'image' ? notice.file_url : undefined,
          video: notice.file_type === 'video' ? notice.file_url : undefined,
        }));

      setNotices(activeNotices);
    } catch (error) {
      console.error('Error fetching notices:', error);
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
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

  const getDepartmentLabel = (dept: string) => {
    return DEPARTMENTS.find(d => d.value === dept)?.label || dept.toUpperCase();
  };

  // Filter notices
  const filteredNotices = (() => {
    let filtered = accountHandle
      ? notices.filter(n => n.handle === accountHandle.replace('@', ''))
      : notices;

    if (selectedDepartment && selectedDepartment !== 'all') {
      filtered = filtered.filter(n =>
        n.department === selectedDepartment || n.department === 'all'
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.author?.toLowerCase().includes(query)
      );
    }

    return filtered;
  })();

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedNotices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleShare = async (notice: Notice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const shareText = `${notice.title}\n\n${notice.content}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: notice.title,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    toast.success("Comment posted!");
    setNewComment("");
  };

  // Notice Card Skeleton
  const NoticeCardSkeleton = () => (
    <div className="p-4 border-b border-border">
      <div className="flex gap-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-6 mt-3">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/study')} className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Notices</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)} className="h-9 w-9">
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Bar (collapsible) */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Department Filter Pills */}
        <div className="px-4 pb-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.value}
                onClick={() => setSelectedDepartment(dept.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedDepartment === dept.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {dept.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Notices Feed */}
      <main>
        {loading ? (
          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <NoticeCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <Bell className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No notices found</p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              {searchQuery ? "Try a different search" : "Check back later for updates"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotices.map((notice) => (
              <article
                key={notice.id}
                className="p-4 hover:bg-muted/30 transition-colors active:bg-muted/50"
                onClick={() => setSelectedNotice(notice)}
              >
                <div className="flex gap-3">
                  {/* Author Avatar */}
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {notice.author?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    {/* Author Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold truncate">{notice.author}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{notice.time}</span>
                      {notice.important && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Urgent
                        </Badge>
                      )}
                    </div>

                    {/* Department Badge */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Building className="w-3 h-3" />
                      <span>{getDepartmentLabel(notice.department)}</span>
                    </div>

                    {/* Title */}
                    {notice.title && (
                      <h3 className="font-semibold text-base mt-2">{notice.title}</h3>
                    )}

                    {/* Content */}
                    <p className="text-sm text-foreground mt-1 line-clamp-3 whitespace-pre-wrap">
                      {notice.content}
                    </p>

                    {/* Image Preview */}
                    {notice.image && (
                      <div
                        className="mt-3 rounded-xl overflow-hidden"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageViewer({ isOpen: true, url: notice.image!, title: notice.title || 'Image' });
                        }}
                      >
                        <img
                          src={notice.image}
                          alt="Notice"
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}

                    {/* Attachment Badges */}
                    {notice.file_url && notice.file_type === 'pdf' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(notice.file_url!, '_blank');
                        }}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        View PDF
                      </Button>
                    )}

                    {notice.file_url && notice.file_type === 'video' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoPlayer({ isOpen: true, url: notice.file_url!, title: notice.title || 'Video' });
                        }}
                      >
                        <VideoIcon className="w-3.5 h-3.5 mr-1.5" />
                        Watch Video
                      </Button>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-8 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotice(notice);
                        }}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs">{notice.comments.length}</span>
                      </button>
                      <button
                        onClick={(e) => toggleLike(notice.id, e)}
                        className={cn(
                          "flex items-center gap-1.5 transition-colors",
                          likedNotices.includes(notice.id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                        )}
                      >
                        <Heart className={cn("w-4 h-4", likedNotices.includes(notice.id) && "fill-current")} />
                        <span className="text-xs">{notice.likes + (likedNotices.includes(notice.id) ? 1 : 0)}</span>
                      </button>
                      <button
                        onClick={(e) => handleShare(notice, e)}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Share className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Comments Dialog (Bottom Sheet on Mobile) */}
      <Sheet open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader className="text-left pb-4 border-b">
            <SheetTitle>Comments</SheetTitle>
          </SheetHeader>

          {selectedNotice && (
            <div className="flex flex-col h-full">
              {/* Original Notice Preview */}
              <div className="p-4 bg-muted/30 rounded-lg my-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {selectedNotice.author?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{selectedNotice.author}</span>
                  <span className="text-xs text-muted-foreground">{selectedNotice.time}</span>
                </div>
                {selectedNotice.title && (
                  <p className="font-semibold text-sm">{selectedNotice.title}</p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{selectedNotice.content}</p>
              </div>

              {/* Comments Area */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                {selectedNotice.comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No comments yet</p>
                    <p className="text-sm text-muted-foreground">Be the first to comment!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Comments would render here */}
                  </div>
                )}
              </ScrollArea>

              {/* Comment Input */}
              <div className="flex gap-2 pt-4 border-t mt-auto">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
                <Button size="icon" onClick={handleAddComment}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Image Viewer */}
      <ImageViewer
        isOpen={imageViewer.isOpen}
        onClose={() => setImageViewer({ isOpen: false, url: "", title: "" })}
        imageUrl={imageViewer.url}
        title={imageViewer.title}
      />

      {/* Video Player */}
      <VideoPlayer
        isOpen={videoPlayer.isOpen}
        onClose={() => setVideoPlayer({ isOpen: false, url: "", title: "" })}
        videoUrl={videoPlayer.url}
        title={videoPlayer.title}
      />
    </div>
  );
};

export default Notices;
