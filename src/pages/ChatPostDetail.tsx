import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Hash,
  Loader2,
  Lock,
  MessageCircle,
  Send,
  Share,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { CommentThread } from "@/components/CommentThread";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "../supabase";
import {
  addChatComment,
  ChatComment,
  deleteChatComment,
  getChatComments,
  getChatRoomInfo,
  getSavedChatPosts,
  getUserChatVotes,
  toggleSaveChatPost,
  voteChatMessage,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface Message {
  id: string;
  room_id: string;
  author_name: string;
  author_email: string;
  content: string;
  upvotes: number;
  downvotes: number;
  image_url: string | null;
  created_at: string;
}

const splitPostContent = (content: string) => {
  const raw = content || "";
  const parts = raw.split("\n");
  if (parts.length <= 1) return { title: "", body: raw };
  const title = parts[0].trim();
  const body = parts.slice(1).join("\n").trim();
  if (!title) return { title: "", body: raw.trim() };
  return { title, body };
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return "Just now";
  if (diffInMins < 60) return `${diffInMins}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  return `${diffInDays}d`;
};

const ChatPostDetail = () => {
  const navigate = useNavigate();
  const { roomId, postId } = useParams();
  const { user } = useAuth();
  const { isReadOnly } = usePermissions();

  const [post, setPost] = useState<Message | null>(null);
  const [roomName, setRoomName] = useState("");
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [comments, setComments] = useState<ChatComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [postingComment, setPostingComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [votedPosts, setVotedPosts] = useState<Record<string, "up" | "down">>(
    {}
  );
  const [isSaved, setIsSaved] = useState(false);
  const [imageViewer, setImageViewer] = useState({ isOpen: false, url: "" });

  useEffect(() => {
    const fetchPageData = async () => {
      if (!roomId || !postId) {
        navigate("/chatroom");
        return;
      }

      setLoading(true);
      setLoadingComments(true);

      try {
        const roomInfo = await getChatRoomInfo(roomId);
        setRoomName(roomInfo.room.name);
        setIsPrivateRoom(roomInfo.room.is_private);
      } catch (error) {
        console.error("Failed to fetch room info:", error);
      }

      try {
        const { data, error } = await supabase
          .from("room_messages")
          .select("*")
          .eq("id", postId)
          .eq("room_id", roomId)
          .maybeSingle();

        if (error || !data) {
          toast.error("Post not found");
          navigate(`/chatroom/${roomId}`);
          return;
        }

        setPost(data as Message);
      } catch (error) {
        console.error("Failed to fetch post:", error);
        toast.error("Failed to load post");
        navigate(`/chatroom/${roomId}`);
        return;
      } finally {
        setLoading(false);
      }

      try {
        const [{ comments: fetchedComments }, { votes }] = await Promise.all([
          getChatComments(postId),
          getUserChatVotes(roomId),
        ]);
        setComments(fetchedComments || []);
        setVotedPosts(votes || {});
      } catch (error) {
        console.error("Failed to fetch comments/votes:", error);
      } finally {
        setLoadingComments(false);
      }

      if (user?.email) {
        try {
          const { savedPosts } = await getSavedChatPosts();
          setIsSaved(
            (savedPosts || []).some((savedPost) => savedPost.messageId === postId)
          );
        } catch (error) {
          console.error("Failed to fetch saved status:", error);
        }
      }
    };

    fetchPageData();
  }, [roomId, postId, user?.email, navigate]);

  const contentParts = useMemo(
    () => splitPostContent(post?.content || ""),
    [post?.content]
  );

  const handleVote = async (direction: "up" | "down") => {
    if (!post) return;

    const messageId = post.id;
    const key = messageId;
    const currentVote = votedPosts[key];

    setVotedPosts((prev) => {
      if (prev[key] === direction) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: direction };
    });

    try {
      const result = await voteChatMessage(messageId, direction);
      if (result.newUpvotes !== undefined && result.newDownvotes !== undefined) {
        setPost((prev) =>
          prev
            ? {
                ...prev,
                upvotes: result.newUpvotes,
                downvotes: result.newDownvotes,
              }
            : prev
        );
      }
    } catch (error) {
      console.error("Error voting:", error);
      setVotedPosts((prev) => {
        if (currentVote) return { ...prev, [key]: currentVote };
        const { [key]: _, ...rest } = prev;
        return rest;
      });
      toast.error("Failed to vote");
    }
  };

  const handleSave = async () => {
    if (!post || !roomId) return;
    if (!user?.email) {
      toast.error("Please login to save posts");
      return;
    }

    try {
      const result = await toggleSaveChatPost(post.id, roomId);
      setIsSaved(result.saved);
      toast.success(result.saved ? "Post saved!" : "Post unsaved");
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    }
  };

  const handleReply = async (content: string, parentId?: string) => {
    if (!post || !user?.email || !content.trim()) return;
    if (isReadOnly) {
      toast.error("You don't have permission to comment here");
      return;
    }

    setPostingComment(true);
    try {
      const authorName = user.displayName || user.email.split("@")[0] || "User";
      const result = await addChatComment(post.id, content.trim(), authorName, parentId);

      const newComment: ChatComment = {
        id: result.id,
        message_id: post.id,
        author_name: authorName,
        author_email: user.email,
        content: content.trim(),
        created_at: new Date().toISOString(),
        parent_id: parentId,
      };

      setComments((prev) => [...prev, newComment]);
      if (!parentId) setCommentText("");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    try {
      await deleteChatComment(post.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const handleShare = async () => {
    if (!post || !roomId) return;
    const shareText = `${post.author_name}: ${post.content}`;
    const shareUrl = `${window.location.origin}/chatroom/${roomId}/post/${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author_name}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Share failed", error);
      }
      return;
    }

    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen-safe bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post || !roomId) {
    return (
      <div className="min-h-screen-safe bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Post not found.</p>
      </div>
    );
  }

  const score = post.upvotes - post.downvotes;

  return (
    <div className="min-h-screen-safe bg-background">
      <SEO
        title={`${roomName || "Room"} Post`}
        description={contentParts.body || contentParts.title || "Chat post detail and comments."}
        noIndex
      />

      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/chatroom/${roomId}`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            {isPrivateRoom ? (
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Hash className="w-4 h-4 text-primary shrink-0" />
            )}
            <p className="truncate text-sm text-muted-foreground">{roomName || "room"}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 sm:p-4 space-y-4">
        <Card className="overflow-hidden">
          <div className="flex">
            <div className="flex flex-col items-center gap-1 p-3 bg-muted/30">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", votedPosts[post.id] === "up" && "text-primary")}
                onClick={() => handleVote("up")}
              >
                <ChevronUp className="w-5 h-5" />
              </Button>
              <span
                className={cn(
                  "text-sm font-semibold",
                  votedPosts[post.id] === "up" && "text-primary",
                  votedPosts[post.id] === "down" && "text-red-500"
                )}
              >
                {score}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", votedPosts[post.id] === "down" && "text-red-500")}
                onClick={() => handleVote("down")}
              >
                <ChevronDown className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Avatar
                  className="w-6 h-6 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() =>
                    navigate(
                      `/profile/${encodeURIComponent(post.author_email?.split("@")[0] || post.author_name.toLowerCase().replace(/\s+/g, ""))}`
                    )
                  }
                >
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {post.author_name[0]}
                  </AvatarFallback>
                </Avatar>
                <button
                  className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
                  onClick={() =>
                    navigate(
                      `/profile/${encodeURIComponent(post.author_email?.split("@")[0] || post.author_name.toLowerCase().replace(/\s+/g, ""))}`
                    )
                  }
                >
                  {post.author_name}
                </button>
                <span>•</span>
                <span>{formatTimeAgo(post.created_at)}</span>
              </div>

              {contentParts.title ? (
                <>
                  <h2 className="text-lg font-semibold text-foreground mb-1">{contentParts.title}</h2>
                  {contentParts.body && (
                    <p className="text-foreground mb-3 whitespace-pre-wrap">{contentParts.body}</p>
                  )}
                </>
              ) : (
                <p className="text-foreground mb-3 whitespace-pre-wrap">{post.content}</p>
              )}

              {post.image_url && (
                <div
                  className="mt-3 overflow-hidden rounded-lg border border-border/60 bg-muted/20 cursor-pointer"
                  onClick={() => setImageViewer({ isOpen: true, url: post.image_url! })}
                >
                  <img
                    src={post.image_url}
                    alt="Post image"
                    className="max-h-[70vh] w-full object-contain"
                  />
                </div>
              )}

              <div className="mt-3 flex items-center gap-3">
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleShare}>
                  <Share className="w-4 h-4 mr-1" />
                  Share
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("text-muted-foreground", isSaved && "text-primary")}
                  onClick={handleSave}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 mr-1" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
                <div className="text-sm text-muted-foreground inline-flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {comments.length}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Comments</h3>

          {!isReadOnly && (
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && commentText.trim()) {
                    e.preventDefault();
                    handleReply(commentText);
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => handleReply(commentText)}
                disabled={!commentText.trim() || postingComment}
              >
                {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}

          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CommentThread
              comments={comments}
              currentUserEmail={user?.email}
              onReply={handleReply}
              onDelete={handleDeleteComment}
            />
          )}
        </Card>
      </main>

      <Dialog open={imageViewer.isOpen} onOpenChange={(open) => !open && setImageViewer({ isOpen: false, url: "" })}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <img
              src={imageViewer.url}
              alt="Full size"
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatPostDetail;
