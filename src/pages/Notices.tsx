import { useState, useEffect } from "react";
import type { ElementType } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, MessageCircle, Share, Search,
  Bell, FileText, Play, Bookmark, Send, Loader2, Trash2, X,
  LayoutGrid, Cpu, Zap, Cog, Building2, PlugZap, Bot, Database, Globe, HelpCircle
} from "lucide-react";
import { CommentThread, CommentData } from "@/components/CommentThread";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ImageViewer from "@/components/ImageViewer";
import VideoPlayer from "@/components/VideoPlayer";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import * as api from "@/lib/api";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useNotices, Notice } from "@/hooks/useNotices";
import { useCollege } from "@/context/CollegeContext";
import BrandLoader from "@/components/BrandLoader";
import BrandMark from "@/components/BrandMark";

// --- Constants ---
type DepartmentMeta = { value: string; label: string; icon: ElementType };

const DEPARTMENTS: DepartmentMeta[] = [
  { value: 'all', label: 'All Departments', icon: LayoutGrid },
  { value: 'cse', label: 'Computer Science', icon: Cpu },
  { value: 'ece', label: 'Electronics', icon: Zap },
  { value: 'me', label: 'Mechanical', icon: Cog },
  { value: 'ce', label: 'Civil', icon: Building2 },
  { value: 'eee', label: 'Electrical', icon: PlugZap },
  { value: 'aiml', label: 'AI & ML', icon: Bot },
  { value: 'ds', label: 'Data Science', icon: Database },
  { value: 'it', label: 'Information Technology', icon: Globe },
];


const Notices = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // React Query: Fetch notices with caching
  const { notices, isLoading: loading } = useNotices();
  const { selectedCollege } = useCollege();
  const collegeId = selectedCollege?.domain || 'kiet.edu';

  // State
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [followedDeptIds, setFollowedDeptIds] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAllDepts, setShowAllDepts] = useState(false);
  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false, url: "", title: ""
  });
  const [videoPlayer, setVideoPlayer] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false, url: "", title: ""
  });

  // Expandable Comments State
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, api.NoticeComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [postingByNotice, setPostingByNotice] = useState<Record<string, boolean>>({});

  // Bookmarks hook
  const { isBookmarked, toggleBookmark } = useBookmarks();

  // Selected notice for modal view
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // Fetch followed departments on mount
  useEffect(() => {
    if (!user?.email) {
      setFollowedDeptIds([]);
      return;
    }
    fetchFollowedDepartments();
  }, [user?.email, collegeId]);

  // Auto-fetch comments when notice modal opens
  useEffect(() => {
    if (selectedNotice && !comments[selectedNotice.id]) {
      toggleComments(selectedNotice.id);
    }
  }, [selectedNotice]);

  const fetchFollowedDepartments = async () => {
    if (!user?.email) return;
    try {
      const response = await api.getFollowedDepartments(collegeId);
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
        await api.unfollowDepartment(deptId, collegeId);
        setFollowedDeptIds(prev => prev.filter(id => id !== deptId));
        toast.success(`Unfollowed`);
      } else {
        await api.followDepartment(deptId, collegeId);
        setFollowedDeptIds(prev => [...prev, deptId]);
        toast.success(`Following`);
      }
    } catch (error) {
      toast.error("Failed to update follow status");
    }
  };



  // Expand/collapse comments for a notice
  const toggleComments = async (noticeId: string) => {
    if (expandedNotice === noticeId) {
      // Collapse
      setExpandedNotice(null);
      return;
    }

    // Expand and fetch comments
    setExpandedNotice(noticeId);

    // Only fetch if not already loaded
    if (!comments[noticeId]) {
      setLoadingComments(noticeId);
      try {
        const { comments: fetchedComments } = await api.getNoticeComments(noticeId);
        setComments(prev => ({ ...prev, [noticeId]: fetchedComments }));
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setLoadingComments(null);
      }
    }
  };

  // Submit a new comment
  // Submit a new comment or reply
  const handleReply = async (noticeId: string, content: string, parentId?: string) => {
    if (!content.trim() || !user) {
      if (!user) toast.error('Please login to comment');
      return;
    }

    setPostingByNotice(prev => ({ ...prev, [noticeId]: true }));
    try {
      const { comment } = await api.postNoticeComment(noticeId, content.trim(), undefined, parentId);
      setComments(prev => ({
        ...prev,
        [noticeId]: [...(prev[noticeId] || []), comment]
      }));
      if (!parentId) {
        setCommentDrafts(prev => ({ ...prev, [noticeId]: '' }));
      }
      toast.success('Reply posted!');
    } catch (error) {
      toast.error(error.message || 'Failed to post reply');
    } finally {
      setPostingByNotice(prev => ({ ...prev, [noticeId]: false }));
    }
  };

  // Delete own comment
  const deleteComment = async (noticeId: string, commentId: string) => {
    try {
      await api.deleteNoticeComment(noticeId, commentId);
      setComments(prev => ({
        ...prev,
        [noticeId]: (prev[noticeId] || []).filter(c => c.id !== commentId)
      }));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const getDeptInfo = (deptCode: string) => {
    return DEPARTMENTS.find(d => d.value === deptCode) || { label: 'Unknown', icon: HelpCircle, value: deptCode };
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

  // Filter notices by tab and search
  const displayedNotices = notices
    .filter(n => activeTab === 'following' ? followedDeptIds.includes(n.department) : true)
    .filter(n => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const dept = getDeptInfo(n.department);
      const content = n.content || '';
      const department = n.department || '';
      return (
        n.title?.toLowerCase().includes(query) ||
        content.toLowerCase().includes(query) ||
        dept.label.toLowerCase().includes(query) ||
        department.toLowerCase().includes(query)
      );
    });

  const modalDraft = selectedNotice ? (commentDrafts[selectedNotice.id] || '') : '';
  const modalPosting = selectedNotice ? !!postingByNotice[selectedNotice.id] : false;

  return (
    <div className="min-h-screen-safe bg-background text-foreground flex justify-center">
      <SEO
        title="Notices"
        description="Stay updated with the latest announcements and notices from your college departments."
      />
      <div className="w-full max-w-[1200px] flex px-2 sm:px-0">

        {/* --- LEFT SIDEBAR (Who to follow) --- */}
        <div className="hidden lg:block w-[350px] p-4 sticky top-0 h-screen overflow-y-auto border-r border-border/50">
          {/* Search */}
          <div className="sticky top-0 bg-background pb-3 z-10">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 rounded-full bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background"
              />
            </div>
          </div>

          {/* Who to follow card */}
          <Card className="bg-secondary/20 border-border/50 rounded-2xl p-4 space-y-4">
            <h2 className="font-bold text-xl px-2">Who to follow</h2>
            <div className="space-y-3">
              {DEPARTMENTS.filter(d => d.value !== 'all').slice(0, showAllDepts ? undefined : 5).map(dept => {
                const DeptIcon = dept.icon;
                return (
                  <div key={dept.value} className="flex items-center justify-between px-2 cursor-pointer hover:bg-secondary/30 p-2 rounded-lg transition-colors" onClick={() => navigate(`/department/${dept.value}`)}>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-border/50">
                        <AvatarFallback className="bg-background">
                          <DeptIcon className="h-4 w-4 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <div className="font-bold hover:underline">{dept.label}</div>
                        <div className="text-muted-foreground text-sm">@{dept.value}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-full font-bold h-8 w-20"
                      onClick={(e) => { e.stopPropagation(); navigate(`/department/${dept.value}`); }}
                    >
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
            <div
              className="px-2 text-primary text-sm cursor-pointer hover:underline"
              onClick={() => setShowAllDepts(!showAllDepts)}
            >
              {showAllDepts ? 'Show less' : 'Show more'}
            </div>
          </Card>
        </div>

        {/* --- MIDDLE COLUMN (Feed) --- */}
        <main className="flex-1 min-w-0 w-full max-w-[750px]">
          {/* Header / Tabs with Back Button */}
          <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
            {/* Back button row (always visible) */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-secondary/50"
                onClick={() => navigate('/study')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <BrandMark size={28} className="shrink-0" alt="Studyshare" />
                <div>
                  <h1 className="font-bold text-xl leading-tight">Notices</h1>
                  <p className="text-[11px] text-muted-foreground">Live updates from your departments</p>
                </div>
              </div>
              <div className="ml-auto hidden md:block w-[260px]">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search notices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-full bg-secondary/40 border-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background"
                  />
                </div>
              </div>
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

            {/* Mobile search */}
            <div className="px-4 pb-3 pt-2 md:hidden">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search notices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-full bg-secondary/40 border-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background"
                />
              </div>
            </div>
          </div>

          {/* Feed Content */}
          <div className="pb-20 md:pb-0">
            {loading ? (
              <div className="space-y-4 p-4">
                <div className="flex justify-center py-4">
                  <BrandLoader label="Fetching notices..." />
                </div>
                {[1, 2, 3].map((i) => (
                  <NoticeSkeleton key={`notice-skeleton-${i}`} />
                ))}
              </div>
            ) : displayedNotices.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                  <BrandMark size={56} className="opacity-70" alt="Studyshare" />
                  <div>
                    <h3 className="text-lg font-bold mb-2">No notices yet</h3>
                    <p>Check back later or follow more departments!</p>
                  </div>
                </div>
              </div>
            ) : (
              displayedNotices.map((notice) => {
                const dept = getDeptInfo(notice.department);
                const DeptIcon = dept.icon;
                const draft = commentDrafts[notice.id] || '';
                const isPosting = !!postingByNotice[notice.id];
                const commentCount = (comments[notice.id]?.length ?? notice.comments ?? 0);
                return (
                  <Card
                    key={notice.id}
                    className="group relative mb-3 overflow-hidden border border-border/60 bg-card/70 p-3 sm:p-4 shadow-sm transition hover:border-primary/30 hover:bg-card/90 hover:shadow-card cursor-pointer"
                    onClick={() => setSelectedNotice(notice)}
                  >
                    <div className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-400/70 via-primary/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                    <div className="flex gap-2 sm:gap-3">
                      <div className="shrink-0" onClick={(e) => { e.stopPropagation(); navigate(`/department/${notice.department}`); }}>
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border border-border">
                          <AvatarFallback className="bg-secondary">
                            <DeptIcon className="h-4 w-4 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-semibold hover:underline cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); navigate(`/department/${notice.department}`); }}
                          >
                            {dept.label}
                          </span>
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                            @{dept.value}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(notice.created_at)}</span>
                          {notice.priority === 'urgent' && (
                            <Badge variant="destructive" className="ml-auto h-5 text-[10px]">
                              Urgent
                            </Badge>
                          )}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "gap-2 rounded-full px-2 hover:text-blue-400 hover:bg-blue-400/10",
                              expandedNotice === notice.id && "text-blue-400"
                            )}
                            onClick={(e) => { e.stopPropagation(); toggleComments(notice.id); }}
                          >
                            <MessageCircle className={cn("w-4 h-4", expandedNotice === notice.id && "fill-current")} />
                            <span className="text-xs font-medium">{commentCount}</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "gap-2 rounded-full px-2 hover:text-primary hover:bg-primary/10",
                              isBookmarked(notice.id) && "text-primary"
                            )}
                            onClick={(e) => { e.stopPropagation(); toggleBookmark(notice.id, 'notice'); }}
                          >
                            <Bookmark className={cn("w-4 h-4", isBookmarked(notice.id) && "fill-current")} />
                            <span className="text-xs font-medium">{isBookmarked(notice.id) ? "Saved" : "Save"}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-2 rounded-full px-2 hover:text-green-500 hover:bg-green-500/10">
                            <Share className="w-4 h-4" />
                            <span className="text-xs font-medium">Share</span>
                          </Button>
                        </div>

                        {/* Expandable Comments Section */}
                        {expandedNotice === notice.id && (
                          <div className="mt-4 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                            {/* Comment Input */}
                            <div className="flex gap-2 mb-4">
                              <Avatar className="w-8 h-8 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {user?.email?.charAt(0).toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  placeholder="Add a comment..."
                                  value={draft}
                                  onChange={(e) => setCommentDrafts(prev => ({ ...prev, [notice.id]: e.target.value }))}
                                  className="flex-1 h-9 text-sm"
                                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply(notice.id, draft)}
                                />
                                <Button
                                  size="icon"
                                  className="h-9 w-9 shrink-0"
                                  onClick={() => handleReply(notice.id, draft)}
                                  disabled={!draft.trim() || isPosting}
                                >
                                  {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                              </div>
                            </div>

                            {/* Comments List */}
                            {loadingComments === notice.id ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                              </div>
                            ) : (comments[notice.id] || []).length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-3">No comments yet. Be the first!</p>
                            ) : (
                              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {(comments[notice.id] || []).map((comment) => (
                                  <div key={comment.id} className="flex gap-2 group">
                                    <Avatar className="w-7 h-7 shrink-0">
                                      <AvatarFallback className="bg-secondary text-xs">
                                        {comment.user_name?.charAt(0).toUpperCase() || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{comment.user_name}</span>
                                        <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
                                        {comment.user_email === user?.email && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-6 h-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => deleteComment(notice.id, comment.id)}
                                          >
                                            <Trash2 className="w-3 h-3 text-destructive" />
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-sm text-foreground/90">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </main>

      </div>

      {/* Twitter-style Notice Modal */}
      <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          {selectedNotice && (() => {
            const dept = getDeptInfo(selectedNotice.department);
            const DeptIcon = dept.icon;
            return (
              <div className="flex flex-col h-full">
                {/* Modal Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 sticky top-0 bg-background z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={() => setSelectedNotice(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  <span className="font-bold text-lg">Notice</span>
                </div>

                <ScrollArea className="flex-1 max-h-[calc(90vh-60px)]">
                  <div className="p-4">
                    {/* Notice Header */}
                    <div className="flex gap-3 mb-4">
                      <Avatar className="w-12 h-12 border border-border cursor-pointer" onClick={() => { setSelectedNotice(null); navigate(`/department/${selectedNotice.department}`); }}>
                        <AvatarFallback className="bg-secondary">
                          <DeptIcon className="h-5 w-5 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold hover:underline cursor-pointer" onClick={() => { setSelectedNotice(null); navigate(`/department/${selectedNotice.department}`); }}>
                            {dept.label}
                          </span>
                          <span className="text-muted-foreground">@{dept.value}</span>
                          {selectedNotice.priority === 'urgent' && <Badge variant="destructive" className="ml-2">Urgent</Badge>}
                        </div>
                        <span className="text-muted-foreground text-sm">{formatTimeAgo(selectedNotice.created_at)}</span>
                      </div>
                    </div>

                    {/* Notice Content */}
                    {selectedNotice.title && <h2 className="text-xl font-bold mb-3">{selectedNotice.title}</h2>}
                    <p className="text-lg leading-relaxed whitespace-pre-wrap mb-4">{selectedNotice.content}</p>

                    {/* Media */}
                    {selectedNotice.file_url && (
                      <div className="rounded-2xl overflow-hidden border border-border/50 mb-4">
                        {selectedNotice.file_type === 'image' && (
                          <img
                            src={selectedNotice.file_url}
                            alt="Notice attachment"
                            className="w-full max-h-[500px] object-contain cursor-pointer hover:opacity-95"
                            onClick={() => setImageViewer({ isOpen: true, url: selectedNotice.file_url!, title: selectedNotice.title || "Image" })}
                          />
                        )}
                        {selectedNotice.file_type === 'pdf' && (
                          <div className="p-4 bg-secondary/20 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-primary" />
                            <span className="text-sm font-medium flex-1 truncate">PDF Attachment</span>
                            <Button variant="outline" size="sm" onClick={() => window.open(selectedNotice.file_url!, '_blank')}>Open</Button>
                          </div>
                        )}
                        {selectedNotice.file_type === 'video' && (
                          <div className="relative group cursor-pointer bg-black h-64 flex items-center justify-center" onClick={() => setVideoPlayer({ isOpen: true, url: selectedNotice.file_url!, title: selectedNotice.title || "Video" })}>
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-all scale-100 group-hover:scale-110">
                              <Play className="w-8 h-8 text-white fill-white ml-1" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex gap-6 py-3 border-y border-border/50 text-muted-foreground text-sm mb-4">
                      <span><strong className="text-foreground">{(comments[selectedNotice.id]?.length || selectedNotice.comments)}</strong> Comments</span>

                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-around py-2 border-b border-border/50 mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("flex-1 gap-2", expandedNotice === selectedNotice.id && "text-blue-400")}
                        onClick={() => toggleComments(selectedNotice.id)}
                      >
                        <MessageCircle className={cn("w-5 h-5", expandedNotice === selectedNotice.id && "fill-current")} />
                        Comment
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("flex-1 gap-2", isBookmarked(selectedNotice.id) && "text-primary")}
                        onClick={() => toggleBookmark(selectedNotice.id, 'notice')}
                      >
                        <Bookmark className={cn("w-5 h-5", isBookmarked(selectedNotice.id) && "fill-current")} />
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 gap-2">
                        <Share className="w-5 h-5" />
                        Share
                      </Button>
                    </div>

                    {/* Comment Input */}
                    <div className="flex gap-3 mb-4">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user?.email?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Input
                          placeholder="Post your reply..."
                          value={modalDraft}
                          onChange={(e) => setCommentDrafts(prev => ({ ...prev, [selectedNotice.id]: e.target.value }))}
                          className="flex-1"
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply(selectedNotice.id, modalDraft)}
                        />
                        <Button
                          onClick={() => handleReply(selectedNotice.id, modalDraft)}
                          disabled={!modalDraft.trim() || modalPosting}
                        >
                          {modalPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reply'}
                        </Button>
                      </div>
                    </div>

                    {/* Comments List */}
                    {/* Comments List */}
                    {loadingComments === selectedNotice.id ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <CommentThread
                        comments={comments[selectedNotice.id] || []}
                        currentUserEmail={user?.email}
                        onReply={(content, parentId) => handleReply(selectedNotice.id, content, parentId)}
                        onDelete={(commentId) => deleteComment(selectedNotice.id, commentId)}
                      />
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

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
interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps) => (
  <div className={cn("inline-flex items-center gap-4 px-4 py-3 rounded-full hover:bg-secondary/50 cursor-pointer transition-colors text-xl w-auto pr-8", active && "font-bold")} onClick={onClick}>
    <Icon className={cn("w-7 h-7", active ? "stroke-[2.5px]" : "stroke-2")} />
    <span className="hidden xl:inline">{label}</span>
    <span className="xl:hidden md:inline">{label}</span>
  </div>
);

const NoticeSkeleton = () => (
  <Card className="relative overflow-hidden border border-border/60 bg-card/60 p-4">
    <div className="flex gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  </Card>
);

export default Notices;
