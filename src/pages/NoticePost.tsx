import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Loader2,
  MessageCircle,
  Play,
  Share,
  FileText,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CommentThread } from "@/components/CommentThread";
import { SEO } from "@/components/SEO";
import DepartmentAvatar from "@/components/DepartmentAvatar";
import ImageViewer from "@/components/ImageViewer";
import VideoPlayer from "@/components/VideoPlayer";
import PDFViewer from "@/components/PDFViewer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getDepartmentList, getDepartmentMeta } from "@/lib/departmentMeta";
import * as api from "@/lib/api";
import { useNotices } from "@/hooks/useNotices";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import NoticeContent from "@/components/notices/NoticeContent";
import { getEffectiveNoticeDepartment } from "@/lib/noticeDepartment";
import { useCollege } from "@/context/CollegeContext";

const WHO_TO_FOLLOW_DEPARTMENTS = getDepartmentList(false);

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    return diffInMins <= 1 ? "Just now" : `${diffInMins}m`;
  }
  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h`;
  }
  return `${Math.floor(diffInHours / 24)}d`;
};

const NoticePost = () => {
  const navigate = useNavigate();
  const { noticeId } = useParams<{ noticeId: string }>();
  const { user } = useAuth();
  const { isReadOnly } = useCollege();
  const { notices, isLoading, isError, error } = useNotices();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const canCommentOnNotices = !isReadOnly;

  const notice = useMemo(
    () => notices.find((entry) => entry.id === noticeId),
    [notices, noticeId],
  );

  const [comments, setComments] = useState<api.NoticeComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: "",
    title: "",
  });
  const [videoPlayer, setVideoPlayer] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: "",
    title: "",
  });
  const [pdfViewer, setPdfViewer] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: "",
    title: "",
  });

  useEffect(() => {
    if (!notice?.id) return;

    let cancelled = false;
    setLoadingComments(true);

    const loadComments = async () => {
      try {
        const response = await api.getNoticeComments(notice.id);
        if (!cancelled) {
          setComments(response.comments || []);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error("Failed to load notice comments", loadError);
          toast.error("Failed to load comments");
        }
      } finally {
        if (!cancelled) {
          setLoadingComments(false);
        }
      }
    };

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [notice?.id]);

  const handleReply = async (content: string, parentId?: string) => {
    if (!notice?.id || !content.trim() || !user) {
      if (!user) toast.error("Please login to comment");
      return;
    }
    if (!canCommentOnNotices) {
      toast.error(
        "Notice comments require a verified college or teacher account.",
      );
      return;
    }

    setPosting(true);
    try {
      const response = await api.postNoticeComment(
        notice.id,
        content.trim(),
        undefined,
        parentId,
      );
      setComments((prev) => [...prev, response.comment]);
      if (!parentId) setDraft("");
      toast.success("Comment posted");
    } catch (postError) {
      console.error("Failed to post comment", postError);
      toast.error("Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!notice?.id) return;

    try {
      await api.deleteNoticeComment(notice.id, commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast.success("Comment deleted");
    } catch (deleteError) {
      console.error("Failed to delete comment", deleteError);
      toast.error("Failed to delete comment");
    }
  };

  const handleShare = async () => {
    if (!notice) return;

    const shareText = `${notice.title}\n\n${notice.content}`;
    const shareUrl = `${window.location.origin}/notices/post/${notice.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: notice.title || "Notice",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled native share.
      }
    }

    await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    toast.success("Notice link copied");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-lg rounded-2xl border-destructive/30 bg-destructive/5 p-5 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Could not load notice
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Please try again."}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate("/notices")}
          >
            Back to Notices
          </Button>
        </Card>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-lg rounded-2xl p-5 text-center">
          <h2 className="text-lg font-semibold">Notice not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The notice may have been removed.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate("/notices")}
          >
            Back to Notices
          </Button>
        </Card>
      </div>
    );
  }

  const department = getDepartmentMeta(getEffectiveNoticeDepartment(notice));

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground flex justify-center">
      <SEO
        title={notice.title || "Notice"}
        description="Detailed notice post with comments and attachments."
        noIndex
      />

      <div className="h-full w-full max-w-[1200px] flex px-2 sm:px-0">
        <aside className="hidden lg:block w-[350px] p-4 sticky top-0 h-screen overflow-y-auto border-r border-border/50">
          <Card className="bg-secondary/20 border-border/50 rounded-2xl p-4 space-y-4">
            <h2 className="font-bold text-xl px-2">Who to follow</h2>
            <div className="space-y-3">
              {WHO_TO_FOLLOW_DEPARTMENTS.map((dept) => (
                <div
                  key={dept.value}
                  className="flex items-center justify-between px-2 cursor-pointer hover:bg-secondary/30 p-2 rounded-lg transition-colors"
                  onClick={() => navigate(`/department/${dept.value}`)}
                >
                  <div className="flex items-center gap-3">
                    <DepartmentAvatar
                      meta={dept}
                      size="md"
                      className="border-border/50"
                    />
                    <div className="leading-tight">
                      <div className="font-bold hover:underline">
                        {dept.label}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {dept.handle}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-full font-bold h-8 w-20"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/department/${dept.value}`);
                    }}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        <main className="flex-1 min-w-0 h-screen overflow-y-auto">
          <div className="mx-auto min-h-full w-full max-w-[780px] border-x border-border/50">
            <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => navigate("/notices")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Post</h1>
                <p className="text-xs text-muted-foreground">Notice details</p>
              </div>
            </header>

            <article className="border-b border-border/50 px-4 py-4">
              <div className="flex gap-3">
                <DepartmentAvatar
                  meta={department}
                  size="lg"
                  className="h-10 w-10"
                  iconClassName="h-4 w-4"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {department.label}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase tracking-wide",
                        department.badgeClassName,
                      )}
                    >
                      {department.handle}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(notice.created_at)}
                    </span>
                    {notice.priority === "urgent" ? (
                      <Badge variant="destructive" className="h-5 text-[10px]">
                        Urgent
                      </Badge>
                    ) : null}
                  </div>

                  {notice.title ? (
                    <h2 className="mt-2 text-xl font-semibold leading-snug">
                      {notice.title}
                    </h2>
                  ) : null}

                  <NoticeContent
                    content={notice.content}
                    className="mt-3 text-[15px] leading-7"
                  />

                  {notice.file_url ? (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
                      {notice.file_type === "image" ? (
                        <img
                          src={notice.file_url}
                          alt="Notice attachment"
                          className="max-h-[560px] w-full cursor-pointer object-contain bg-black/80"
                          onClick={() =>
                            setImageViewer({
                              isOpen: true,
                              url: notice.file_url || "",
                              title: notice.title || "Notice image",
                            })
                          }
                        />
                      ) : null}

                      {notice.file_type === "video" ? (
                        <div
                          className="relative flex h-72 cursor-pointer items-center justify-center bg-black"
                          onClick={() =>
                            setVideoPlayer({
                              isOpen: true,
                              url: notice.file_url || "",
                              title: notice.title || "Notice video",
                            })
                          }
                        >
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                            <Play className="ml-0.5 h-7 w-7 fill-white text-white" />
                          </div>
                        </div>
                      ) : null}

                      {notice.file_type === "pdf" ? (
                        <div className="flex items-center gap-3 bg-secondary/20 p-4">
                          <FileText className="h-8 w-8 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              PDF Attachment
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Open it inside StudyShare
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setPdfViewer({
                                isOpen: true,
                                url: notice.file_url || "",
                                title: notice.title || "Notice PDF",
                              })
                            }
                          >
                            Open PDF
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 rounded-full px-2 text-muted-foreground"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {comments.length || notice.comments || 0}
                      </span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-2 rounded-full px-2 hover:text-primary",
                        isBookmarked(notice.id) && "text-primary",
                      )}
                      onClick={() => toggleBookmark(notice.id, "notice")}
                    >
                      <Bookmark
                        className={cn(
                          "h-4 w-4",
                          isBookmarked(notice.id) && "fill-current",
                        )}
                      />
                      <span className="text-xs font-medium">Save</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 rounded-full px-2 hover:text-green-600"
                      onClick={() => void handleShare()}
                    >
                      <Share className="h-4 w-4" />
                      <span className="text-xs font-medium">Share</span>
                    </Button>
                  </div>
                </div>
              </div>
            </article>

            <section className="px-4 py-4">
              {canCommentOnNotices ? (
                <div className="mb-4 flex gap-2">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user?.email?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 gap-2">
                    <Input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Post your reply"
                      className="h-9"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void handleReply(draft);
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => void handleReply(draft)}
                      disabled={!draft.trim() || posting}
                    >
                      {posting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mb-4 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                  Notice comments are available only to verified college and
                  teacher accounts.
                </p>
              )}

              {loadingComments ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <CommentThread
                  comments={comments}
                  currentUserEmail={user?.email}
                  onReply={(content, parentId) =>
                    handleReply(content, parentId)
                  }
                  onDelete={handleDeleteComment}
                  canReply={canCommentOnNotices}
                />
              )}
            </section>
          </div>
        </main>
      </div>

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

      <PDFViewer
        isOpen={pdfViewer.isOpen}
        onClose={() => setPdfViewer({ isOpen: false, url: "", title: "" })}
        title={pdfViewer.title}
        pdfUrl={pdfViewer.url}
      />
    </div>
  );
};

export default NoticePost;
