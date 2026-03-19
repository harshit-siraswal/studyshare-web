'use client';

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Hash, Image as ImageIcon, Loader2, Lock, MessageCircle, Plus, Search, Share2, Users } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { usePermissions } from "@/hooks/usePermissions";
import { getChatRoomInfo, getChatRooms, getSavedChatPosts, getUserChatVotes, joinChatRoomById, postChatMessage, toggleSaveChatPost, type ChatRoomInfo, type ChatRoomListItem, voteChatMessage } from "@/lib/api";
import { uploadChatImage } from "@/lib/uploadChatImage";
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

const MESSAGES_PER_PAGE = 50;

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

export function ChatroomClient() {
  const params = useParams();
  const router = useRouter();
  const roomId = String(params.roomId || "").trim();

  const { user } = useAuth();
  const { selectedCollegeId, isReadOnly } = useCollege();
  const { canChat } = usePermissions();

  const [rooms, setRooms] = useState<ChatRoomListItem[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoomInfo["room"] | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPost, setNewPost] = useState("");
  const [postImage, setPostImage] = useState<string | null>(null);
  const [imageViewer, setImageViewer] = useState({ isOpen: false, url: "" });
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [votedPosts, setVotedPosts] = useState<Record<string, "up" | "down">>({});
  const [activeUsers, setActiveUsers] = useState(0);
  const [isMember, setIsMember] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "top">("recent");

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const lastVoteTimeRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!roomId) {
      router.replace("/chatroom");
    }
  }, [roomId, router]);

  useEffect(() => {
    let ignore = false;

    async function loadSidebarRooms() {
      if (!selectedCollegeId) return;
      try {
        const result = await getChatRooms({ page: 1, limit: 50, collegeId: selectedCollegeId });
        if (!ignore) {
          setRooms(result.rooms || []);
        }
      } catch (error) {
        console.error("Failed to load sidebar rooms", error);
      }
    }

    void loadSidebarRooms();
    return () => {
      ignore = true;
    };
  }, [selectedCollegeId]);

  useEffect(() => {
    let ignore = false;

    async function loadRoom() {
      if (!roomId) return;

      try {
        setLoading(true);
        const [roomInfo, votesResult, savedResult] = await Promise.all([
          getChatRoomInfo(roomId),
          user?.email ? getUserChatVotes(roomId) : Promise.resolve({ votes: {} }),
          user?.email
            ? getSavedChatPosts({ page: 1, limit: 100 })
            : Promise.resolve({
                savedPosts: [],
                pagination: { page: 1, limit: 100, total: 0, hasMore: false },
              }),
        ]);

        if (ignore) return;

        setCurrentRoom(roomInfo.room);
        setIsMember(roomInfo.isMember);
        setIsAdmin(roomInfo.isAdmin);
        setRoomCode(roomInfo.room.room_code || null);
        setVotedPosts(votesResult.votes || {});
        setSavedPosts(
          new Set(
            (savedResult.savedPosts || [])
              .map((post) => post.messageId)
              .filter((messageId): messageId is string => Boolean(messageId)),
          ),
        );
      } catch (error: any) {
        console.error("Failed to load room info", error);
        toast.error(error?.message || "Failed to load room.");
        router.replace("/chatroom");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadRoom();
    return () => {
      ignore = true;
    };
  }, [roomId, router, user?.email]);

  useEffect(() => {
    let ignore = false;

    async function loadMessages() {
      if (!roomId) return;

      try {
        setLoading(true);
        let query = supabase
          .from("room_messages")
          .select("*")
          .eq("room_id", roomId);

        if (sortBy === "top") {
          query = query
            .order("upvotes", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });
        } else {
          query = query.order("created_at", { ascending: false });
        }

        const { data, error } = await query.range(0, MESSAGES_PER_PAGE - 1);
        if (error) throw error;
        if (ignore) return;

        const nextMessages = (data || []) as RoomMessage[];
        setHasMoreMessages(nextMessages.length === MESSAGES_PER_PAGE);
        setMessages(nextMessages);
      } catch (error) {
        console.error("Failed to load room messages", error);
        if (!ignore) {
          toast.error("Failed to load room posts.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    void loadMessages();
    return () => {
      ignore = true;
    };
  }, [roomId, sortBy]);

  useEffect(() => {
    if (!roomId || !user?.email) return;

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: user.email },
      },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      setActiveUsers(Object.keys(state).length);
    });

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "room_messages",
        filter: `room_id=eq.${roomId}`,
      },
      (payload: { new: RoomMessage }) => {
        setMessages((prev) => {
          const nextMessage = payload.new;
          if (prev.some((message) => message.id === nextMessage.id)) {
            return prev;
          }
          return [nextMessage, ...prev];
        });
      },
    );

    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ user_email: user.email, online_at: new Date().toISOString() });
      }
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [roomId, user?.email]);

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return messages;

    return messages.filter((message) =>
      [message.content, message.author_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [messages, searchQuery]);

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await uploadChatImage(file);
      setPostImage(imageUrl);
      toast.success("Image uploaded.");
    } catch (error: any) {
      console.error("Image upload failed", error);
      toast.error(error?.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  }

  async function handlePost() {
    if (!roomId || !user) {
      toast.error("Please login to post.");
      return;
    }
    if (!newPost.trim() && !postImage) {
      toast.error("Write something or upload an image first.");
      return;
    }

    try {
      setPosting(true);
      const trimmedTitle = newPostTitle.trim();
      const trimmedContent = newPost.trim();
      const fullContent = trimmedTitle
        ? trimmedContent
          ? `${trimmedTitle}\n${trimmedContent}`
          : trimmedTitle
        : trimmedContent;

      await postChatMessage(
        roomId,
        fullContent,
        postImage || undefined,
        user.displayName || user.email?.split("@")[0] || "User",
      );

      setNewPostTitle("");
      setNewPost("");
      setPostImage(null);
      toast.success("Post published.");
    } catch (error: any) {
      console.error("Failed to post in room", error);
      toast.error(error?.message || "Failed to post.");
    } finally {
      setPosting(false);
    }
  }

  async function handleVote(messageId: string, direction: "up" | "down") {
    const now = Date.now();
    if (lastVoteTimeRef.current[messageId] && now - lastVoteTimeRef.current[messageId] < 1000) {
      return;
    }
    lastVoteTimeRef.current[messageId] = now;

    const currentVote = votedPosts[messageId];
    setVotedPosts((prev) => {
      if (prev[messageId] === direction) {
        const { [messageId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [messageId]: direction };
    });

    try {
      const result = await voteChatMessage(messageId, direction);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? { ...message, upvotes: result.newUpvotes, downvotes: result.newDownvotes }
            : message,
        ),
      );
    } catch (error) {
      console.error("Failed to vote on message", error);
      setVotedPosts((prev) => {
        if (currentVote) return { ...prev, [messageId]: currentVote };
        const { [messageId]: _removed, ...rest } = prev;
        return rest;
      });
      toast.error("Failed to vote.");
    }
  }

  async function handleSavePost(messageId: string) {
    if (!roomId || !user?.email) {
      toast.error("Please login to save posts.");
      return;
    }

    try {
      const result = await toggleSaveChatPost(messageId, roomId);
      setSavedPosts((prev) => {
        const next = new Set(prev);
        if (result.saved) {
          next.add(messageId);
        } else {
          next.delete(messageId);
        }
        return next;
      });
      toast.success(result.saved ? "Post saved." : "Post removed from saved.");
    } catch (error) {
      console.error("Failed to save post", error);
      toast.error("Failed to save post.");
    }
  }

  async function handleJoinRoom() {
    if (!roomId || !canChat) {
      toast.error("Chat access requires a verified college email.");
      return;
    }

    try {
      const result = await joinChatRoomById(
        roomId,
        user?.displayName || user?.email?.split("@")[0],
        selectedCollegeId || undefined,
      );
      setIsMember(true);
      setCurrentRoom((prev) =>
        prev
          ? {
              ...prev,
              member_count: (prev.member_count || 0) + 1,
            }
          : prev,
      );
      toast.success(`Joined ${result.roomName}`);
    } catch (error: any) {
      console.error("Failed to join room", error);
      toast.error(error?.message || "Failed to join room.");
    }
  }

  async function handleShare(message: RoomMessage) {
    const shareUrl = `${window.location.origin}/chatroom/${roomId}/post/${message.id}`;
    const shareText = `${message.author_name}: ${message.content}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentRoom?.name || "Studyspace chatroom post",
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

  async function loadOlderMessages() {
    if (loadingMore || !hasMoreMessages || !roomId) return;

    try {
      setLoadingMore(true);
      const offset = messages.length;
      let query = supabase
        .from("room_messages")
        .select("*")
        .eq("room_id", roomId);

      if (sortBy === "top") {
        query = query
          .order("upvotes", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.range(offset, offset + MESSAGES_PER_PAGE - 1);
      if (error) throw error;
      const nextMessages = (data || []) as RoomMessage[];
      setHasMoreMessages(nextMessages.length === MESSAGES_PER_PAGE);
      setMessages((prev) => [...prev, ...nextMessages]);
    } catch (error) {
      console.error("Failed to load older messages", error);
      toast.error("Failed to load older posts.");
    } finally {
      setLoadingMore(false);
    }
  }

  if (isReadOnly) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-lg border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <Users className="h-12 w-12 text-amber-600" />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Chatrooms need verified access</h1>
              <p className="text-sm text-muted-foreground">
                Join the room experience with your college email, then come back here to read and post.
              </p>
            </div>
            <Button asChild>
              <Link href="/study">Back to study</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-0 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
        <aside className="hidden border-r border-border/60 bg-card/40 lg:block">
          <div className="border-b border-border/60 p-4">
            <h2 className="font-semibold">Your rooms</h2>
            <p className="text-xs text-muted-foreground">Quick jumps while you browse this conversation.</p>
          </div>
          <ScrollArea className="h-[calc(100vh-73px)]">
            <div className="space-y-2 p-3">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/chatroom/${room.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                    room.id === roomId
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/30 hover:text-foreground",
                  )}
                >
                  {room.is_private ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                  <span className="truncate">{room.name}</span>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </aside>

        <section className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/chatroom">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {currentRoom?.is_private ? (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="h-3.5 w-3.5" />
                      Private
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      Public
                    </Badge>
                  )}
                  {isMember ? <Badge variant="outline">Member</Badge> : <Badge variant="outline">Visitor</Badge>}
                  {isAdmin ? <Badge variant="outline">Admin</Badge> : null}
                </div>
                <h1 className="truncate text-lg font-semibold">
                  {currentRoom?.name || (loading ? "Loading room..." : "Room")}
                </h1>
                {currentRoom?.description ? (
                  <p className="truncate text-sm text-muted-foreground">{currentRoom.description}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative hidden md:block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search posts"
                    className="w-64 pl-9"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as "recent" | "top")}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="recent">Recent</option>
                  <option value="top">Top</option>
                </select>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-4 px-4 py-4 sm:px-6">
            {isMember ? (
              <Card className="border-border/60">
                <CardContent className="space-y-3 p-4">
                  <Input
                    value={newPostTitle}
                    onChange={(event) => setNewPostTitle(event.target.value)}
                    placeholder="Topic (optional)"
                  />
                  <Textarea
                    value={newPost}
                    onChange={(event) => setNewPost(event.target.value)}
                    placeholder="Share a question, summary, or update..."
                    rows={4}
                  />

                  {postImage ? (
                    <div className="relative inline-flex overflow-hidden rounded-2xl border border-border/60">
                      <Image
                        src={postImage}
                        alt="Upload preview"
                        width={640}
                        height={360}
                        sizes="(max-width: 768px) 100vw, 320px"
                        className="h-36 w-auto object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute right-2 top-2"
                        onClick={() => setPostImage(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Button
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                        Add image
                      </Button>
                    </div>

                    <Button onClick={() => void handlePost()} disabled={posting || (!newPost.trim() && !postImage)}>
                      {posting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-border/70">
                <CardContent className="flex flex-col gap-3 p-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">Join this room to participate</h2>
                    <p className="text-sm text-muted-foreground">
                      You can read the room summary, but posting unlocks once you join.
                    </p>
                  </div>
                  <Button onClick={() => void handleJoinRoom()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Join room
                  </Button>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <Card className="border-border/60">
                <CardContent className="flex min-h-56 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : filteredMessages.length === 0 ? (
              <Card className="border-dashed border-border/70">
                <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                  <MessageCircle className="h-10 w-10 text-muted-foreground" />
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">No posts yet</h2>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "No posts matched your search." : "Start the conversation with the first post in this room."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((message) => {
                const { title, body } = splitPostContent(message.content);
                const score = (message.upvotes || 0) - (message.downvotes || 0);
                const profileSlug =
                  message.author_email?.split("@")[0] ||
                  message.author_name.toLowerCase().replace(/[^a-z0-9_]+/g, "_");

                return (
                  <Card
                    key={message.id}
                    className="overflow-hidden border-border/60 transition-colors hover:bg-accent/10"
                  >
                    <CardContent className="flex gap-0 p-0">
                      <div className="flex min-w-[72px] flex-col items-center gap-1 bg-muted/30 p-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(votedPosts[message.id] === "up" && "text-primary")}
                          onClick={() => void handleVote(message.id, "up")}
                        >
                          <ChevronUp className="h-5 w-5" />
                        </Button>
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            votedPosts[message.id] === "up" && "text-primary",
                            votedPosts[message.id] === "down" && "text-red-500",
                          )}
                        >
                          {score}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(votedPosts[message.id] === "down" && "text-red-500")}
                          onClick={() => void handleVote(message.id, "down")}
                        >
                          <ChevronDown className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="min-w-0 flex-1 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Link href={`/profile/${encodeURIComponent(profileSlug)}`}>
                            <Avatar className="h-7 w-7 border transition hover:ring-2 hover:ring-primary/40">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {message.author_name.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <Link href={`/profile/${encodeURIComponent(profileSlug)}`} className="font-medium text-foreground hover:text-primary">
                            {message.author_name}
                          </Link>
                          <span>•</span>
                          <span>{formatTimeAgo(message.created_at)}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => router.push(`/chatroom/${roomId}/post/${message.id}`)}
                          className="w-full text-left"
                        >
                          {title ? (
                            <>
                              <h3 className="text-lg font-semibold">{title}</h3>
                              {body ? <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{body}</p> : null}
                            </>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm text-foreground">{message.content}</p>
                          )}

                          {message.image_url ? (
                            <div
                              className="mt-3 overflow-hidden rounded-2xl border border-border/60 bg-muted/20"
                              onClick={(event) => {
                                event.stopPropagation();
                                setImageViewer({ isOpen: true, url: message.image_url || "" });
                              }}
                            >
                              <img
                                src={message.image_url}
                                alt="Post attachment"
                                className="max-h-[420px] w-full object-contain"
                              />
                            </div>
                          ) : null}
                        </button>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => void handleShare(message)}>
                            <Share2 className="mr-1 h-4 w-4" />
                            Share
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(savedPosts.has(message.id) && "text-primary")}
                            onClick={() => void handleSavePost(message.id)}
                          >
                            {savedPosts.has(message.id) ? (
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
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/chatroom/${roomId}/post/${message.id}`}>
                              <MessageCircle className="mr-1 h-4 w-4" />
                              Comments
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {hasMoreMessages && filteredMessages.length > 0 ? (
              <div className="flex justify-center pb-4">
                <Button variant="outline" onClick={() => void loadOlderMessages()} disabled={loadingMore}>
                  {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Load older posts
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="hidden border-l border-border/60 bg-card/40 lg:block">
          <div className="space-y-4 p-4">
            <Card className="border-border/60">
              <CardContent className="space-y-4 p-4">
                <div>
                  <p className="text-sm font-medium">Room stats</p>
                  <p className="text-xs text-muted-foreground">A quick snapshot of the conversation.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-2xl border border-border/60 p-3">
                    <div className="text-2xl font-semibold">{currentRoom?.member_count || 0}</div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                  <div className="rounded-2xl border border-border/60 p-3">
                    <div className="text-2xl font-semibold text-emerald-600">{activeUsers}</div>
                    <div className="text-xs text-muted-foreground">Online</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    Created by{" "}
                    <Link
                      href={`/profile/${encodeURIComponent(currentRoom?.created_by?.split("@")[0] || "unknown")}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {currentRoom?.created_by?.split("@")[0] || "unknown"}
                    </Link>
                  </div>
                  <div>Created {currentRoom?.created_at ? new Date(currentRoom.created_at).toLocaleDateString() : "recently"}</div>
                  {roomCode ? <div>Join code: <span className="font-medium text-foreground">{roomCode}</span></div> : null}
                </div>
                {!isMember ? (
                  <Button className="w-full" onClick={() => void handleJoinRoom()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Join room
                  </Button>
                ) : (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                    You&apos;re a member of this room.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </aside>

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
      </div>
    </main>
  );
}
