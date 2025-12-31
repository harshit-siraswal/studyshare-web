import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Heart, Share, Send, Search, Image as ImageIcon, Bell, FileText, Video as VideoIcon, Calendar, Building, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ImageViewer from "@/components/ImageViewer";
import VideoPlayer from "@/components/VideoPlayer";
import FollowButton from "@/components/FollowButton";
import { supabase } from "../supabase";
import { useAuth } from "@/context/AuthContext";

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
  { value: 'all', label: 'All Departments' },
  { value: 'cse', label: 'Computer Science' },
  { value: 'ece', label: 'Electronics' },
  { value: 'me', label: 'Mechanical' },
  { value: 'ce', label: 'Civil' },
  { value: 'eee', label: 'Electrical' },
  { value: 'aiml', label: 'AI & ML' },
  { value: 'ds', label: 'Data Science' },
  { value: 'it', label: 'Information Technology' },
];

const Notices = () => {
  const navigate = useNavigate();
  const { accountHandle } = useParams();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedNotices, setLikedNotices] = useState<string[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [likedComments, setLikedComments] = useState<number[]>([]);
  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false, url: "", title: ""
  });
  const [videoPlayer, setVideoPlayer] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false, url: "", title: ""
  });

  // Fetch notices from database
  useEffect(() => {
    fetchNotices();

    // Subscribe to real-time updates
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

      // Get user's department
      const userDepartment = user?.branch || 'cse';

      let query = supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .or(`department.eq.all,department.eq.${userDepartment}`)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Filter out expired notices and transform data
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDepartmentName = (dept: string) => {
    return DEPARTMENTS.find(d => d.value === dept)?.label || dept.toUpperCase();
  };

  // Get unique accounts from notices
  const accounts = Array.from(new Set(notices.map(n => n.handle || ''))).map(handle => {
    const notice = notices.find(n => n.handle === handle);
    return {
      handle,
      name: notice?.author || handle,
      email: notice?.authorEmail,
      notices: notices.filter(n => n.handle === handle),
    };
  });

  // Get current account if viewing account page
  const currentAccount = accountHandle
    ? accounts.find(a => a.handle === accountHandle.replace('@', ''))
    : null;

  // Filter departments based on search
  const filteredDepartments = DEPARTMENTS.filter(dept =>
    dept.label.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  // Filter notices based on search, account, and selected department
  const filteredNotices = (() => {
    let filtered = accountHandle
      ? notices.filter(n => n.handle === accountHandle.replace('@', ''))
      : notices;

    // Filter by selected department
    if (selectedDepartment) {
      filtered = filtered.filter(n =>
        n.department === selectedDepartment || n.department === 'all'
      );
    }

    // Filter by search query
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

  const selectDepartment = (dept: string) => {
    setSelectedDepartment(dept);
    setDepartmentSearch("");
  };

  const clearDepartmentFilter = () => {
    setSelectedDepartment(null);
    setSearchQuery("");
  };

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedNotices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleCommentLike = (id: number) => {
    setLikedComments((prev) =>
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

  const handleAddReply = (commentId: number) => {
    if (!replyContent.trim()) return;
    toast.success("Reply posted!");
    setReplyContent("");
    setReplyingTo(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/study')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {currentAccount ? currentAccount.name : "Notices"}
              </h1>
              {currentAccount && (
                <p className="text-sm text-muted-foreground">
                  {currentAccount.notices.length} notices
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar & Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          {!accountHandle && (
            <aside className="lg:w-72 space-y-4">
              {/* Department Search */}
              <Card className="p-4">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Search Department
                </h2>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search departments..."
                    value={departmentSearch}
                    onChange={(e) => setDepartmentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Show filtered departments when searching */}
                {departmentSearch && (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {filteredDepartments.map((dept) => (
                      <button
                        key={dept.value}
                        onClick={() => {
                          if (dept.value !== 'all') {
                            navigate(`/department/${dept.value}`);
                          } else {
                            selectDepartment(dept.value);
                          }
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-accent transition-colors text-sm"
                      >
                        {dept.label}
                      </button>
                    ))}
                    {filteredDepartments.length === 0 && (
                      <p className="text-sm text-muted-foreground p-2">No departments found</p>
                    )}
                  </div>
                )}

                {/* Selected Department Filter */}
                {selectedDepartment && (
                  <div className="mt-3">
                    <h3 className="text-xs font-medium text-muted-foreground mb-2">Active Filter:</h3>
                    <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                      <Badge variant="outline" className="flex-1">
                        {getDepartmentName(selectedDepartment)}
                      </Badge>
                      <button
                        onClick={clearDepartmentFilter}
                        className="p-1 hover:bg-background rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Accounts */}
              <Card className="p-4">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Accounts
                </h2>
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <button
                      key={account.handle}
                      onClick={() => navigate(`/notices/${account.handle}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {account.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.handle}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {account.notices.length}
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Department Accounts */}
              <Card className="p-4">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Department Accounts
                </h2>
                <div className="space-y-2">
                  {DEPARTMENTS.filter(d => d.value !== 'all').map((dept) => (
                    <button
                      key={dept.value}
                      onClick={() => navigate(`/department/${dept.value}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {dept.label.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {dept.label}
                        </p>
                        <p className="text-xs text-muted-foreground">@{dept.value}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </aside>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder={selectedDepartment ? `Search in ${getDepartmentName(selectedDepartment)}...` : "Search notices..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Account Header */}
            {currentAccount && (
              <Card className="p-6 mb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {currentAccount.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{currentAccount.name}</h2>
                    <p className="text-muted-foreground">{currentAccount.handle}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {currentAccount.notices.length} notices posted
                    </p>
                  </div>
                  {currentAccount.email && user?.email !== currentAccount.email && (
                    <FollowButton
                      targetUserEmail={currentAccount.email}
                      targetUserName={currentAccount.name}
                    />
                  )}
                </div>
              </Card>
            )}

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </Card>
                ))}
              </div>
            )}

            {/* Notices List */}
            {!loading && (
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="space-y-4 pr-4">
                  {filteredNotices.map((notice) => (
                    <article
                      key={notice.id}
                      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedNotice(notice)}
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-12 h-12 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {notice.author?.[0] || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold">{notice.author}</span>
                                  <span className="text-muted-foreground text-sm">{notice.handle}</span>
                                  <span className="text-muted-foreground text-sm">·</span>
                                  <span className="text-muted-foreground text-sm">{notice.time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Building className="w-3 h-3" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (notice.department !== 'all') {
                                        navigate(`/department/${notice.department}`);
                                      }
                                    }}
                                    className="hover:text-primary hover:underline transition-colors"
                                  >
                                    {getDepartmentName(notice.department)}
                                  </button>
                                  <Calendar className="w-3 h-3 ml-2" />
                                  <span>{formatDateTime(notice.created_at)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Notice Title */}
                            {notice.title && (
                              <h3 className="text-lg font-semibold mb-2">{notice.title}</h3>
                            )}

                            {/* Notice Content */}
                            <p className="text-foreground mb-3 whitespace-pre-wrap">{notice.content}</p>

                            {/* File Attachments */}
                            {notice.file_url && notice.file_type === 'pdf' && (
                              <Button
                                variant="outline"
                                className="mb-3"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(notice.file_url!, '_blank');
                                }}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View PDF Document
                              </Button>
                            )}

                            {notice.file_url && notice.file_type === 'video' && (
                              <Button
                                variant="outline"
                                className="mb-3"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setVideoPlayer({ isOpen: true, url: notice.file_url!, title: notice.title || 'Video' });
                                }}
                              >
                                <VideoIcon className="w-4 h-4 mr-2" />
                                Watch Video
                              </Button>
                            )}

                            {/* Image */}
                            {notice.image && (
                              <div
                                className="relative rounded-lg overflow-hidden cursor-pointer group/image mb-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImageViewer({ isOpen: true, url: notice.image!, title: notice.title || 'Notice Image' });
                                }}
                              >
                                <img
                                  src={notice.image}
                                  alt="Notice"
                                  className="w-full h-64 object-cover transition-transform group-hover/image:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button size="sm" variant="secondary" className="backdrop-blur-sm">
                                    <ImageIcon className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-8 mt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNotice(notice);
                                }}
                                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-sm">{notice.comments.length}</span>
                              </button>
                              <button
                                onClick={(e) => toggleLike(notice.id, e)}
                                className={cn(
                                  "flex items-center gap-2 transition-colors",
                                  likedNotices.includes(notice.id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                                )}
                              >
                                <Heart className={cn("w-5 h-5", likedNotices.includes(notice.id) && "fill-current")} />
                                <span className="text-sm">{notice.likes + (likedNotices.includes(notice.id) ? 1 : 0)}</span>
                              </button>
                              <button
                                onClick={(e) => handleShare(notice, e)}
                                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Share className="w-5 h-5" />
                              </button>
                              {notice.authorEmail && user?.email !== notice.authorEmail && (
                                <FollowButton
                                  targetUserEmail={notice.authorEmail}
                                  targetUserName={notice.author || ''}
                                  size="sm"
                                  variant="ghost"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                  {filteredNotices.length === 0 && !loading && (
                    <div className="p-12 text-center">
                      <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground text-lg">No notices found.</p>
                      <p className="text-muted-foreground text-sm mt-2">
                        {selectedDepartment
                          ? `No notices for ${getDepartmentName(selectedDepartment)}`
                          : searchQuery
                            ? 'Try adjusting your search'
                            : 'Check back later for updates'}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      {/* Comments Dialog */}
      <Dialog open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>

          {selectedNotice && (
            <>
              <div className="p-3 bg-muted/30 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {selectedNotice.author?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{selectedNotice.author}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(selectedNotice.created_at)}</span>
                </div>
                {selectedNotice.title && (
                  <h4 className="font-semibold text-sm mb-1">{selectedNotice.title}</h4>
                )}
                <p className="text-sm text-foreground">{selectedNotice.content}</p>
              </div>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {selectedNotice.comments.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">No comments yet. Be the first to comment!</p>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Input
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
                <Button onClick={handleAddComment}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
