'use client';

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Hash, Loader2, Lock, MessageCircle, Send, Share2 } from "lucide-react";
import { addChatComment, deleteChatComment, getChatComments, getChatRoomInfo, getSavedChatPosts, getUserChatVotes, toggleSaveChatPost, voteChatMessage, type ChatComment } from "@/lib/api";
import { ChatCommentThread } from "@/components/ChatCommentThread";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase";
import { toast } from "sonner";

interface RoomMessage {
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

function splitPostContent(content: string) {
  const raw = content || "";
  const parts = raw.split("\n");
  if (parts.length <= 1) return { title: "", body: raw };
  const title = parts[0].trim();
  const body = parts.slice(1).join("\n").trim();
  if (!title) return { title: "", body: raw.trim() };
  return { title, body };
}

function formatTimeAgo(dateString?: string | null) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diffInMs = Date.now() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return "Just now";
  if (diffInMins < 60) return `${diffInMins}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  return `${diffInDays}d`;
}

export function ChatPostDetailClient() {
  const params = useParams();
  const router = useRouter();
  const roomId = String(params.roomId || "").trim();
  const postId = String(params.postId || "").trim();

  const { user } = useAuth();
  const { isReadOnly } = usePermissions();

  const [post, setPost] = useState<RoomMessage | null>(null);
  const [roomName, setRoomName] = useState("");
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [comments, setComments] = useState<ChatComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [postingComment, setPostingComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [votedPosts, setVotedPosts] = useState<Record<string, "up" | "down">>({});
  const [isSaved, setIsSaved] = useState(false);
  const [imageViewer, setImageViewer] = useState({ isOpen: false, url: "" });

  useEffect(() => {
    let ignore = false;

    async function loadPostPage() {
      if (!roomId || !postId) {
        router.replace("/chatroom");
        return;
      }

      try {
        setLoading(true);
        setLoadingComments(true);

        const [roomInfo, postResult] = await Promise.all([
          getChatRoomInfo(roomId),
          supabase.from("room_messages").select("*").eq("id", postId).eq("room_id", roomId).maybeSingle(),
        ]);

        if (postResult.error || !postResult.data) {
          throw postResult.error || new Error("Post not found");
        }

        const [commentResult, voteResult, savedResult] = await Promise.all([
          getChatComments(postId),
          getUserChatVotes(roomId),
          user?.email ? getSavedChatPosts({ page: 1, limit: 100 }) : Promise.resolve({ savedPosts: [], pagination: { page: 1, limit: 100, total: 0, hasMore: false } }),
        ]);

        if (ignore) return;

        setRoomName(roomInfo.room.name);
        setIsPrivateRoom(roomInfo.room.is_private);
        setPost(postResult.data as RoomMessage);
        setComments(commentResult.comments || []);
        setVotedPosts(voteResult.votes || {});
        setIsSaved((savedResult.savedPosts || []).some((savedPost) => savedPost.messageId === postId));
      } catch (error) {
        console.error("Failed to load chat post detail", error);
        toast.error("Failed to load post.");
        router.replace(`/chatroom/${roomId}`);
      } finally {
        if (!ignore) {
          setLoading(false);
          setLoadingComments(false);
        }
      }
    }

    void loadPostPage();
    return () => {
      ignore = true;
    };
  }, [postId, roomId, router, user?.email]);

  const contentParts = useMemo(() => splitPostContent(post?.content || ""), [post?.content]);

  async function handleVote(direction: "up" | "down") {
    if (!post) return;

    const currentVote = votedPosts[post.id];
    setVotedPosts((prev) => {
      if (prev[post.id] === direction) {
        const { [post.id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [post.id]: direction };
    });

    try {
      const result = await voteChatMessage(post.id, direction);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              upvotes: result.newUpvotes,
              downvotes: result.newDownvotes,
            }
          : prev,
      );
    } catch (error) {
      console.error("Failed to vote on post", error);
      setVotedPosts((prev) => {
        if (currentVote) return { ...prev, [post.id]: currentVote };
        const { [post.id]: _removed, ...rest } = prev;
        return rest;
      });
      toast.error("Failed to vote.");
    }
  }

  async function handleSave() {
    if (!post || !roomId || !user?.email) {
      toast.error("Please login to save posts.");
      return;
    }

    try {
      const result = await toggleSaveChatPost(post.id, roomId);
      setIsSaved(result.saved);
      toast.success(result.saved ? "Post saved." : "Post removed from saved.");
    } catch (error) {
      console.error("Failed to save post", error);
      toast.error("Failed to save post.");
    }
  }

  async function handleReply(content: string, parentId?: string) {
    if (!post || !user?.email || !content.trim()) return;
    if (isReadOnly) {
      toast.error("You do not have permission to comment here.");
      return;
    }

    try {
      setPostingComment(true);
      const authorName = user.displayName || user.email.split("@")[0] || "User";
      const result = await addChatComment(post.id, content.trim(), authorName, parentId);

      setComments((prev) => [
        ...prev,
        {
          id: result.id,
          message_id: post.id,
          author_name: authorName,
          author_email: user.email || "",
          content: content.trim(),
          created_at: new Date().toISOString(),
          parent_id: parentId,
        },
      ]);

      if (!parentId) {
        setCommentText("");
      }
    } catch (error) {
      console.error("Failed to add comment", error);
      toast.error("Failed to add comment.");
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!post) return;
    try {
      await deleteChatComment(post.id, commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast.success("Comment deleted.");
    } catch (error) {
      console.error("Failed to delete comment", error);
      toast.error("Failed to delete comment.");
    }
  }

  async function handleShare() {
    if (!post || !roomId) return;
    const shareUrl = `${window.location.origin}/chatroom/${roomId}/post/${post.id}`;
    const shareText = `${post.author_name}: ${post.content}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${roomName || "Room"} post`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        console.error("Native share cancelled/failed", error);
      }
    }

    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    toast.success("Post link copied.");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!post || !roomId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-lg border-border/60">
          <CardContent className="space-y-3 p-8 text-center">
            <h1 className="text-2xl font-semibold">Post not found</h1>
            <Button asChild>
              <Link href="/chatroom">Back to chatrooms</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const score = (post.upvotes || 0) - (post.downvotes || 0);
  const profileSlug =
    post.author_email?.split("@")[0] ||
    post.author_name.toLowerCase().replace(/[^a-z0-9_]+/g, "_");

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center gap-3 rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/chatroom/${roomId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isPrivateRoom ? (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  Private room
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Hash className="h-3.5 w-3.5" />
                  Public room
                </Badge>
              )}
            </div>
            <h1 className="truncate text-lg font-semibold">{roomName || "Room post"}</h1>
          </div>
        </header>

        <Card className="overflow-hidden border-border/60">
          <CardContent className="flex gap-0 p-0">
            <div className="flex min-w-[72px] flex-col items-center gap-1 bg-muted/30 p-3">
              <Button
                variant="ghost"
                size="icon"
                className={cn(votedPosts[post.id] === "up" && "text-primary")}
                onClick={() => void handleVote("up")}
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
              <span
                className={cn(
                  "text-sm font-semibold",
                  votedPosts[post.id] === "up" && "text-primary",
                  votedPosts[post.id] === "down" && "text-red-500",
                )}
              >
                {score}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className={cn(votedPosts[post.id] === "down" && "text-red-500")}
                onClick={() => void handleVote("down")}
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </div>

            <div className="min-w-0 flex-1 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Link href={`/profile/${encodeURIComponent(profileSlug)}`}>
                  <Avatar className="h-7 w-7 border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {post.author_name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Link href={`/profile/${encodeURIComponent(profileSlug)}`} className="font-medium text-foreground hover:text-primary">
                  {post.author_name}
                </Link>
                <span>•</span>
                <span>{formatTimeAgo(post.created_at)}</span>
              </div>

              {contentParts.title ? (
                <>
                  <h2 className="text-2xl font-semibold">{contentParts.title}</h2>
                  {contentParts.body ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{contentParts.body}</p>
                  ) : null}
                </>
              ) : (
                <p className="whitespace-pre-wrap text-sm text-foreground">{post.content}</p>
              )}

              {post.image_url ? (
                <div
                  className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-muted/20"
                  onClick={() => setImageViewer({ isOpen: true, url: post.image_url || "" })}
                >
                  <Image
                    src={post.image_url}
                    alt="Post attachment"
                    width={1600}
                    height={1200}
                    sizes="100vw"
                    className="max-h-[70vh] h-auto w-full object-contain"
                  />
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => void handleShare()}>
                  <Share2 className="mr-1 h-4 w-4" />
                  Share
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(isSaved && "text-primary")}
                  onClick={() => void handleSave()}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="mr-1 h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="mr-1 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
                <div className="inline-flex items-center text-sm text-muted-foreground">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  {comments.length} comments
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Comments</h3>
              <p className="text-sm text-muted-foreground">Reply inline or keep the thread tidy with nested responses.</p>
            </div>

            {!isReadOnly ? (
              <div className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Add a comment..."
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && commentText.trim()) {
                      event.preventDefault();
                      void handleReply(commentText);
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => void handleReply(commentText)}
                  disabled={!commentText.trim() || postingComment}
                >
                  {postingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            ) : null}

            {loadingComments ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <ChatCommentThread
                comments={comments}
                currentUserEmail={user?.email}
                onReply={handleReply}
                onDelete={handleDeleteComment}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={imageViewer.isOpen} onOpenChange={(open) => !open && setImageViewer({ isOpen: false, url: "" })}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <Image
              src={imageViewer.url}
              alt="Full size attachment"
              width={1600}
              height={1200}
              sizes="100vw"
              className="max-h-[90vh] h-auto w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
