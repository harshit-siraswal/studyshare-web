'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, BookmarkCheck, Hash, Loader2, Lock, Plus, RefreshCw, Search, Users } from "lucide-react";
import { ChatPagination, type ChatRoomListItem, createChatRoom, getChatRooms, getSavedChatPosts, joinChatRoom, type SavedChatPost } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCollege } from "@/context/CollegeContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

const EMPTY_PAGINATION: ChatPagination = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: false,
};

function formatTime(value?: string | null) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString();
}

export function ChatroomListClient() {
  const { selectedCollege, selectedCollegeId, isReadOnly } = useCollege();
  const permissions = usePermissions();

  const [activeTab, setActiveTab] = useState<"rooms" | "saved">("rooms");
  const [searchQuery, setSearchQuery] = useState("");

  const [rooms, setRooms] = useState<ChatRoomListItem[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsPagination, setRoomsPagination] = useState<ChatPagination>(EMPTY_PAGINATION);
  const [roomPage, setRoomPage] = useState(1);
  const [roomsRefreshKey, setRoomsRefreshKey] = useState(0);

  const [savedPosts, setSavedPosts] = useState<SavedChatPost[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedPagination, setSavedPagination] = useState<ChatPagination>(EMPTY_PAGINATION);
  const [savedPage, setSavedPage] = useState(1);
  const [savedRefreshKey, setSavedRefreshKey] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadRooms() {
      if (isReadOnly) {
        setRooms([]);
        setRoomsPagination(EMPTY_PAGINATION);
        setRoomsLoading(false);
        return;
      }

      try {
        setRoomsLoading(true);
        const result = await getChatRooms({
          page: roomPage,
          limit: 20,
          collegeId: selectedCollegeId,
        });
        if (ignore) return;
        setRooms(result.rooms || []);
        setRoomsPagination(result.pagination || EMPTY_PAGINATION);
      } catch (error: any) {
        console.error("Failed to load rooms", error);
        if (!ignore) {
          toast.error(error?.message || "Failed to load chat rooms.");
        }
      } finally {
        if (!ignore) {
          setRoomsLoading(false);
        }
      }
    }

    void loadRooms();
    return () => {
      ignore = true;
    };
  }, [isReadOnly, roomPage, roomsRefreshKey, selectedCollegeId]);

  useEffect(() => {
    if (activeTab !== "saved" || isReadOnly) return;
    let ignore = false;

    async function loadSavedPosts() {
      try {
        setSavedLoading(true);
        const result = await getSavedChatPosts({ page: savedPage, limit: 20 });
        if (ignore) return;
        setSavedPosts(result.savedPosts || []);
        setSavedPagination(result.pagination || EMPTY_PAGINATION);
      } catch (error: any) {
        console.error("Failed to load saved chat posts", error);
        if (!ignore) {
          toast.error(error?.message || "Failed to load saved posts.");
        }
      } finally {
        if (!ignore) {
          setSavedLoading(false);
        }
      }
    }

    void loadSavedPosts();
    return () => {
      ignore = true;
    };
  }, [activeTab, isReadOnly, savedPage, savedRefreshKey]);

  const filteredRooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rooms;

    return rooms.filter((room) =>
      [room.name, room.description, room.created_by]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [rooms, searchQuery]);

  const filteredSavedPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return savedPosts;

    return savedPosts.filter((post) =>
      [post.roomName, post.content, post.authorName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [savedPosts, searchQuery]);

  async function handleCreateRoom() {
    const name = createForm.name.trim();
    const description = createForm.description.trim();

    if (!name) {
      toast.error("Room name is required.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await createChatRoom(
        name,
        description || null,
        createForm.isPrivate,
        selectedCollegeId || undefined,
      );
      toast.success(result.joinCode ? `Room created. Join code: ${result.joinCode}` : "Room created.");
      setCreateForm({ name: "", description: "", isPrivate: false });
      setCreateOpen(false);
      setRoomPage(1);
      const refreshed = await getChatRooms({
        page: 1,
        limit: 20,
        collegeId: selectedCollegeId,
      });
      setRooms(refreshed.rooms || []);
      setRoomsPagination(refreshed.pagination || EMPTY_PAGINATION);
    } catch (error: any) {
      console.error("Failed to create room", error);
      toast.error(error?.message || "Failed to create room.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoinRoom() {
    const code = joinCode.trim();
    if (!code) {
      toast.error("Join code is required.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await joinChatRoom(code, selectedCollegeId || undefined);
      toast.success(`Joined ${result.roomName}`);
      setJoinCode("");
      setJoinOpen(false);
      setRoomPage(1);
      const refreshed = await getChatRooms({
        page: 1,
        limit: 20,
        collegeId: selectedCollegeId,
      });
      setRooms(refreshed.rooms || []);
      setRoomsPagination(refreshed.pagination || EMPTY_PAGINATION);
    } catch (error: any) {
      console.error("Failed to join room", error);
      toast.error(error?.message || "Failed to join room.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isReadOnly) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-lg border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-600" />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Chatrooms are locked in read-only mode</h1>
              <p className="text-sm text-muted-foreground">
                Sign in with your verified college email to join room discussions and save chat posts.
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Button variant="ghost" className="-ml-3 w-fit px-3" asChild>
              <Link href="/study">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to study
              </Link>
            </Button>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Chatrooms</Badge>
                {selectedCollege?.name ? <Badge variant="outline">{selectedCollege.name}</Badge> : null}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Rooms and saved posts</h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Join rooms, keep tabs on conversations in your college, and jump back into saved posts without the old SPA router baggage.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button disabled={!permissions.canCreateRoom}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create room
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create a room</DialogTitle>
                  <DialogDescription>
                    Keep this first pass simple: name the room, add context, and choose whether it should be private.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium">Name</span>
                    <Input
                      value={createForm.name}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="DBMS help desk"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium">Description</span>
                    <Textarea
                      value={createForm.description}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                      placeholder="What should people use this room for?"
                      rows={4}
                    />
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={createForm.isPrivate}
                      onChange={(event) => setCreateForm((prev) => ({ ...prev, isPrivate: event.target.checked }))}
                    />
                    <span>Private room (share with a join code)</span>
                  </label>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button onClick={() => void handleCreateRoom()} disabled={submitting}>
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Join room
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Join with a code</DialogTitle>
                  <DialogDescription>
                    Paste the room code shared by an admin or teammate.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    placeholder="ROOM123"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setJoinOpen(false)}>Cancel</Button>
                    <Button onClick={() => void handleJoinRoom()} disabled={submitting}>
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Join
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={() => {
                if (activeTab === "rooms") {
                  setRoomPage(1);
                  setRoomsRefreshKey((value) => value + 1);
                } else {
                  setSavedPage(1);
                  setSavedRefreshKey((value) => value + 1);
                }
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </section>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={activeTab === "rooms" ? "Search rooms" : "Search saved posts"}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "rooms" | "saved")} className="space-y-4">
          <TabsList>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="saved">Saved posts</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-4">
            {roomsLoading ? (
              <Card className="border-border/60">
                <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading chatrooms...</p>
                </CardContent>
              </Card>
            ) : filteredRooms.length === 0 ? (
              <Card className="border-dashed border-border/70">
                <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                  <Users className="h-10 w-10 text-muted-foreground" />
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">No rooms found</h2>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "Try a broader search query." : "Create a room or join one with a code to start chatting."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredRooms.map((room) => (
                <Card key={room.id} className="border-border/60 transition-colors hover:bg-accent/20">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={room.is_private ? "outline" : "secondary"} className="gap-1">
                          {room.is_private ? <Lock className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
                          {room.is_private ? "Private" : "Public"}
                        </Badge>
                        <Badge variant="outline">{room.member_count || 0} members</Badge>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{room.name}</h3>
                        {room.description ? (
                          <p className="text-sm text-muted-foreground">{room.description}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Created by {room.created_by?.split("@")[0] || "unknown"}</span>
                        <span>{formatTime(room.created_at)}</span>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={`/chatroom/${room.id}`}>Open room</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {roomsPagination.page} • {roomsPagination.total} total rooms
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setRoomPage((page) => Math.max(1, page - 1))}
                  disabled={roomsPagination.page <= 1 || roomsLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRoomPage((page) => page + 1)}
                  disabled={!roomsPagination.hasMore || roomsLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {savedLoading ? (
              <Card className="border-border/60">
                <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading saved posts...</p>
                </CardContent>
              </Card>
            ) : filteredSavedPosts.length === 0 ? (
              <Card className="border-dashed border-border/70">
                <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                  <BookmarkCheck className="h-10 w-10 text-muted-foreground" />
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">No saved posts yet</h2>
                    <p className="text-sm text-muted-foreground">
                      Save a chatroom post and it will show up here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredSavedPosts.map((post) => (
                <Card key={post.id} className="border-border/60">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{post.roomName || "Saved post"}</CardTitle>
                        <CardDescription>
                          {post.authorName ? `By ${post.authorName}` : "Saved from chat"}
                        </CardDescription>
                      </div>
                      {post.roomId && post.messageId ? (
                        <Button asChild variant="outline">
                          <Link href={`/chatroom/${post.roomId}/post/${post.messageId}`}>Open post</Link>
                        </Button>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {post.content ? <p className="text-sm text-muted-foreground">{post.content}</p> : null}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {post.savedAt ? <span>Saved {formatTime(post.savedAt)}</span> : null}
                      {post.postedAt ? <span>Posted {formatTime(post.postedAt)}</span> : null}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {savedPagination.page} • {savedPagination.total} total saved posts
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSavedPage((page) => Math.max(1, page - 1))}
                  disabled={savedPagination.page <= 1 || savedLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSavedPage((page) => page + 1)}
                  disabled={!savedPagination.hasMore || savedLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
