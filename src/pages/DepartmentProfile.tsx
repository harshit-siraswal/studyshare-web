import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bell, Building, Users, MessageCircle, Share, FileText, Loader2, Bookmark, Send, Trash2 } from "lucide-react";
import { CommentThread } from "@/components/CommentThread";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "../supabase";
import { useAuth } from "@/context/AuthContext";
import DepartmentAvatar from "@/components/DepartmentAvatar";
import ImageViewer from "@/components/ImageViewer";
import VideoPlayer from "@/components/VideoPlayer";
import * as api from "@/lib/api";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useCollege } from "@/context/CollegeContext";
import { collectCollegeIdScopes } from "@/lib/collegeIds";
import { findDepartmentMeta } from "@/lib/departmentMeta";

type Notice = api.Notice;

const DepartmentProfile = () => {
    const navigate = useNavigate();
    const { deptId } = useParams<{ deptId: string }>();
    const { user } = useAuth();
    const { selectedCollegeId, selectedCollege } = useCollege();
    const collegeId = selectedCollegeId;
    const collegeScopes = collectCollegeIdScopes(
        selectedCollegeId,
        selectedCollege?.collegeId || null
    );
    const department = findDepartmentMeta(deptId);
    const departmentValue = department?.value || "";

    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; url: string; title: string }>({
        isOpen: false, url: "", title: ""
    });
    const [videoPlayer, setVideoPlayer] = useState<{ isOpen: boolean; url: string; title: string }>({
        isOpen: false, url: "", title: ""
    });

    // Expandable comments state
    const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, api.NoticeComment[]>>({});
    const [loadingComments, setLoadingComments] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    // Bookmarks hook
    const { isBookmarked, toggleBookmark } = useBookmarks();
    const collegeScopesKey = collegeScopes.join('|');

    useEffect(() => {
        if (!departmentValue || collegeScopes.length === 0) return;

        let isCancelled = false;

        const loadDepartmentData = async () => {
            try {
                setLoading(true);

                const [noticeResponse, followedResponse, followerResponse] = await Promise.all([
                    api.getNotices({
                        collegeId: collegeScopes,
                        department: departmentValue,
                    }),
                    user?.email && collegeId
                        ? api.getFollowedDepartments(collegeId)
                        : Promise.resolve({ departments: [] as string[] }),
                    collegeId
                        ? supabase
                            .from('department_followers')
                            .select('*', { count: 'exact', head: true })
                            .eq('department_id', departmentValue)
                            .eq('college_id', collegeId)
                        : Promise.resolve({ count: 0, error: null }),
                ]);

                if (isCancelled) return;

                const activeNotices = (noticeResponse.notices || [])
                    .filter(notice => !notice.expires_at || new Date(notice.expires_at) > new Date())
                    .map(notice => ({
                        ...notice,
                        likes: notice.likes || 0,
                        comments: notice.comments ?? notice.comments_count ?? 0,
                        comments_count: notice.comments_count ?? notice.comments ?? 0,
                    }));

                setNotices(activeNotices);
                setIsFollowing((followedResponse.departments || []).includes(departmentValue));

                if (followerResponse.error) {
                    throw followerResponse.error;
                }
                setFollowerCount(followerResponse.count || 0);
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error loading department profile:', error);
                    toast.error('Failed to load department notices');
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        void loadDepartmentData();

        return () => {
            isCancelled = true;
        };
    }, [departmentValue, user?.email, collegeId, collegeScopes, collegeScopesKey]);

    const handleFollow = async () => {
        if (!user?.email || !departmentValue || !collegeId) {
            toast.error('Please login to follow departments');
            return;
        }

        try {
            if (isFollowing) {
                await api.unfollowDepartment(departmentValue, collegeId);
                setIsFollowing(false);
                setFollowerCount(prev => Math.max(0, prev - 1));
                toast.success('Unfollowed department');
            } else {
                await api.followDepartment(departmentValue, collegeId);
                setIsFollowing(true);
                setFollowerCount(prev => prev + 1);
                toast.success('Following department!');
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            toast.error('Failed to update follow status');
        }
    };



    // Expand/collapse comments
    const toggleComments = async (noticeId: string) => {
        if (expandedNotice === noticeId) {
            setExpandedNotice(null);
            return;
        }

        setExpandedNotice(noticeId);

        if (!comments[noticeId]) {
            setLoadingComments(noticeId);
            try {
                const { comments: fetchedComments } = await api.getNoticeComments(noticeId);
                setComments(prev => ({ ...prev, [noticeId]: fetchedComments }));
            } catch (error) {
                toast.error('Failed to load comments');
            } finally {
                setLoadingComments(null);
            }
        }
    };

    // Submit comment
    // Submit a new comment or reply
    const handleReply = async (noticeId: string, content: string, parentId?: string) => {
        if (!content.trim() || !user) return;

        setPostingComment(true);
        try {
            const { comment } = await api.postNoticeComment(noticeId, content.trim(), undefined, parentId);
            setComments(prev => ({
                ...prev,
                [noticeId]: [...(prev[noticeId] || []), comment]
            }));
            if (!parentId) setNewComment('');
            toast.success('Comment added!');
        } catch (error) {
            toast.error(error.message || 'Failed to post comment');
        } finally {
            setPostingComment(false);
        }
    };

    // Delete comment
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

    const handleShare = async (notice: Notice) => {
        const shareText = `${notice.title}\n\n${notice.content}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: notice.title,
                    text: shareText,
                    url: window.location.href,
                });
            } catch {
                // Sharing was dismissed or unavailable in the current context.
            }
        } else {
            await navigator.clipboard.writeText(shareText);
            toast.success("Copied to clipboard!");
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

    const filteredNotices = notices.filter(notice =>
        notice.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!department) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-semibold mb-2">Department Not Found</h2>
                    <Button onClick={() => navigate('/notices')}>Back to Notices</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/notices')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex flex-1 items-center gap-3">
                            <DepartmentAvatar meta={department} size="lg" className="h-11 w-11" />
                            <div>
                                <h1 className="text-xl font-bold">{department.label}</h1>
                                <p className="text-sm text-muted-foreground">{notices.length} notices</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Department Header Card */}
                <Card className="p-6 mb-6">
                    <div className="flex items-start gap-6">
                        <DepartmentAvatar meta={department} size="hero" />
                        <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2 flex-wrap">
                                <h2 className="text-2xl font-bold">{department.label}</h2>
                                <Badge variant="outline" className={cn("uppercase tracking-wide", department.badgeClassName)}>
                                    @{department.value}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground mb-4">
                                {department.description || `Official department account for ${department.label}`}
                            </p>
                            <div className="flex items-center gap-6 mb-4">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-semibold">{notices.length}</span>
                                    <span className="text-sm text-muted-foreground">Notices</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-semibold">{followerCount}</span>
                                    <span className="text-sm text-muted-foreground">Followers</span>
                                </div>
                            </div>
                            <Button
                                onClick={handleFollow}
                                variant={isFollowing ? "outline" : "default"}
                                className="w-full sm:w-auto"
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Search */}
                <div className="mb-4">
                    <Input
                        placeholder="Search notices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                </div>

                {/* Notices Feed */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <ScrollArea className="h-[calc(100vh-28rem)]">
                        <div className="space-y-4 pr-4">
                            {filteredNotices.map((notice) => (
                                <Card
                                    key={notice.id}
                                    className="p-6 hover:shadow-lg transition-all cursor-pointer"
                                    onClick={() => setSelectedNotice(notice)}
                                >
                                    <div className="flex items-start gap-4">
                                        <DepartmentAvatar meta={department} size="lg" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-semibold">{department.label}</span>
                                                <Badge variant="outline" className={cn("uppercase tracking-wide", department.badgeClassName)}>
                                                    @{department.value}
                                                </Badge>
                                                <span className="text-muted-foreground text-sm">{formatTimeAgo(notice.created_at)}</span>
                                                {notice.priority === 'urgent' && (
                                                    <Badge variant="destructive" className="ml-2">Urgent</Badge>
                                                )}
                                            </div>

                                            {notice.title && (
                                                <h3 className="text-lg font-semibold mb-2">{notice.title}</h3>
                                            )}

                                            <p className="text-foreground mb-3 whitespace-pre-wrap">{notice.content}</p>

                                            {notice.file_url && notice.file_type === 'image' && (
                                                <div
                                                    className="relative rounded-lg overflow-hidden cursor-pointer group mb-3"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setImageViewer({ isOpen: true, url: notice.file_url!, title: notice.title || 'Notice Image' });
                                                    }}
                                                >
                                                    <img
                                                        src={notice.file_url}
                                                        alt="Notice"
                                                        className="w-full h-64 object-cover transition-transform group-hover:scale-105"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-6 mt-4">

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleComments(notice.id);
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-2 transition-colors",
                                                        expandedNotice === notice.id ? "text-primary" : "text-muted-foreground hover:text-primary"
                                                    )}
                                                >
                                                    <MessageCircle className={cn("w-5 h-5", expandedNotice === notice.id && "fill-current")} />
                                                    <span className="text-sm">{(comments[notice.id]?.length ?? notice.comments ?? 0)}</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleBookmark(notice.id, 'notice');
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-2 transition-colors",
                                                        isBookmarked(notice.id) ? "text-primary" : "text-muted-foreground hover:text-primary"
                                                    )}
                                                >
                                                    <Bookmark className={cn("w-5 h-5", isBookmarked(notice.id) && "fill-current")} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleShare(notice);
                                                    }}
                                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <Share className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Expandable Comments Section */}
                                            {expandedNotice === notice.id && (
                                                <div className="mt-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
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
                                                                value={newComment}
                                                                onChange={(e) => setNewComment(e.target.value)}
                                                                className="flex-1 h-9 text-sm"
                                                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply(notice.id, newComment)}
                                                            />
                                                            <Button
                                                                size="icon"
                                                                className="h-9 w-9 shrink-0"
                                                                onClick={() => handleReply(notice.id, newComment)}
                                                                disabled={!newComment.trim() || postingComment}
                                                            >
                                                                {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
                            ))}

                            {filteredNotices.length === 0 && (
                                <div className="text-center py-12">
                                    <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground text-lg">No notices found</p>
                                    <p className="text-muted-foreground text-sm mt-2">
                                        {searchQuery ? 'Try adjusting your search' : 'Check back later for updates'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* Notice Modal */}
            <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
                    {selectedNotice && (
                        <div className="flex flex-col h-full max-h-[90vh]">
                            <div className="p-4 border-b border-border flex items-center gap-3">
                                <DepartmentAvatar meta={department} size="md" />
                                <div>
                                    <h3 className="font-semibold">{department?.label}</h3>
                                    <p className="text-xs text-muted-foreground">{formatTimeAgo(selectedNotice.created_at)}</p>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {selectedNotice.title && (
                                        <h2 className="text-xl font-bold">{selectedNotice.title}</h2>
                                    )}
                                    <p className="text-foreground whitespace-pre-wrap">{selectedNotice.content}</p>

                                    {selectedNotice.file_url && (
                                        <div className="rounded-lg overflow-hidden border border-border/50">
                                            {selectedNotice.file_type === 'image' && (
                                                <img src={selectedNotice.file_url} alt="Attachment" className="w-full" />
                                            )}
                                            {selectedNotice.file_type === 'video' && (
                                                <video src={selectedNotice.file_url} controls className="w-full" />
                                            )}
                                            {selectedNotice.file_type === 'pdf' && (
                                                <div className="p-4 flex items-center justify-between bg-secondary/20">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-8 h-8 text-primary" />
                                                        <span className="font-medium">PDF Attachment</span>
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={() => window.open(selectedNotice.file_url!, '_blank', 'noopener,noreferrer')}>
                                                        View PDF
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-border">
                                        <h4 className="font-semibold mb-3">Comments</h4>
                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Write a comment..."
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleReply(selectedNotice.id, newComment);
                                                        }
                                                    }}
                                                />
                                                <Button size="icon" onClick={() => handleReply(selectedNotice.id, newComment)} disabled={!newComment.trim() || postingComment}>
                                                    <Send className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="space-y-4">
                                                <CommentThread
                                                    comments={comments[selectedNotice.id] || []}
                                                    currentUserEmail={user?.email}
                                                    onReply={(content, parentId) => handleReply(selectedNotice.id, content, parentId)}
                                                    onDelete={(commentId) => deleteComment(selectedNotice.id, commentId)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
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

export default DepartmentProfile;
