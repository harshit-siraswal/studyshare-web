import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search, MessageSquare, ChevronUp, ChevronDown, MessageCircle, Share, Hash, Lock, Users, Plus, Send, X, Image as ImageIcon, Loader2, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "../supabase";
import { postChatMessage, voteChatMessage, toggleSaveChatPost, addChatComment } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { usePermissions } from "@/hooks/usePermissions";
import { uploadChatImage } from "@/lib/uploadChatImage";
import CreateChatRoomDialog from "@/components/CreateChatRoomDialog";
import JoinChatRoomDialog from "@/components/JoinChatRoomDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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

interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  member_count: number;
  created_by: string;
  created_at: string;
}

const Chatroom = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user } = useAuth();
  const { selectedCollege } = useCollege();
  const { canChat, isReadOnly } = usePermissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const [newPost, setNewPost] = useState("");
  const [votedPosts, setVotedPosts] = useState<Record<string, "up" | "down">>({});
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [postImage, setPostImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageViewer, setImageViewer] = useState({ isOpen: false, url: "" });
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [savedMessages, setSavedMessages] = useState<Message[]>([]);

  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Fetch user's joined rooms
  useEffect(() => {
    if (user) {
      fetchUserRooms();
    }
  }, [user]);

  // Fetch current room and messages
  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
      fetchMessages();
      subscribeToMessages();
    }
  }, [roomId]);

  const fetchUserRooms = async () => {
    if (!user?.email) return;

    try {
      // Get rooms user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_email', user.email);

      if (memberError) throw memberError;

      const roomIds = memberData?.map(m => m.room_id) || [];

      if (roomIds.length > 0) {
        // Policy: Filter rooms by college_id for data isolation
        const collegeId = selectedCollege?.domain || 'kiet.edu';

        const { data: roomsData, error: roomsError } = await supabase
          .from('chat_rooms')
          .select('*')
          .in('id', roomIds)
          .eq('college_id', collegeId) // Policy: College data isolation
          .order('created_at', { ascending: false });

        if (roomsError) throw roomsError;
        setRooms(roomsData || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchRoomDetails = async () => {
    if (!roomId) return;

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      setCurrentRoom(data);
    } catch (error) {
      console.error('Error fetching room:', error);
      toast.error("Room not found");
      navigate('/chatroom');
    }
  };

  const fetchMessages = async () => {
    if (!roomId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('room_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!roomId) return;

    const subscription = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setMessages(prev => [payload.new as Message, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const imageUrl = await uploadChatImage(file, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });
      setPostImage(imageUrl);
      toast.success("Image uploaded!");
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePost = async () => {
    if (!user || !roomId) {
      toast.error("Please login to post");
      return;
    }

    if (!newPost.trim() && !postImage) {
      toast.error("Please enter a message or upload an image");
      return;
    }

    setPosting(true);
    try {
      // Use backend API for secure posting
      await postChatMessage(
        roomId,
        newPost.trim(),
        postImage || undefined,
        user.displayName || user.email?.split('@')[0] || 'User'
      );

      setNewPost("");
      setPostImage(null);
      toast.success("Posted!");
    } catch (error: any) {
      console.error('Error posting:', error);
      toast.error(error.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (messageId: string, direction: "up" | "down") => {
    const key = messageId;
    const currentVote = votedPosts[key];

    // Optimistic update
    setVotedPosts(prev => {
      if (prev[key] === direction) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: direction };
    });

    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      let delta = 1;
      if (currentVote === direction) {
        // Remove vote
        delta = -1;
      } else if (currentVote) {
        // Change vote - need to handle both directions
        delta = 1;
      }

      // Use backend API for secure voting
      await voteChatMessage(messageId, direction, delta);

      // Update local state based on action
      let newUpvotes = message.upvotes;
      let newDownvotes = message.downvotes;

      if (currentVote === direction) {
        // Remove vote
        if (direction === "up") newUpvotes--;
        else newDownvotes--;
      } else if (currentVote) {
        // Change vote
        if (direction === "up") {
          newUpvotes++;
          newDownvotes--;
        } else {
          newDownvotes++;
          newUpvotes--;
        }
      } else {
        // New vote
        if (direction === "up") newUpvotes++;
        else newDownvotes++;
      }

      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, upvotes: newUpvotes, downvotes: newDownvotes }
          : m
      ));
    } catch (error) {
      console.error('Error voting:', error);
      // Revert optimistic update
      setVotedPosts(prev => {
        if (currentVote) {
          return { ...prev, [key]: currentVote };
        } else {
          const { [key]: _, ...rest } = prev;
          return rest;
        }
      });
    }
  };

  // Fetch saved posts on mount
  useEffect(() => {
    if (user?.email) {
      fetchSavedPosts();
    }
  }, [user]);

  const fetchSavedPosts = async () => {
    if (!user?.email) return;
    try {
      const { data, error } = await supabase
        .from('saved_posts')
        .select('message_id')
        .eq('user_email', user.email);
      if (error) throw error;
      setSavedPosts(new Set(data?.map(s => s.message_id) || []));
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    }
  };

  const fetchSavedMessages = async () => {
    if (!user?.email) return;

    try {
      const { data: savedData, error: savedError } = await supabase
        .from('saved_posts')
        .select('message_id, room_id')
        .eq('user_email', user.email);

      if (savedError) throw savedError;

      if (savedData && savedData.length > 0) {
        const messageIds = savedData.map(s => s.message_id);
        const { data: messages, error: msgError } = await supabase
          .from('room_messages')
          .select('*')
          .in('id', messageIds)
          .order('created_at', { ascending: false });

        if (msgError) throw msgError;
        setSavedMessages(messages || []);
      } else {
        setSavedMessages([]);
      }
    } catch (error) {
      console.error('Error fetching saved messages:', error);
    }
  };

  const handleSavePost = async (messageId: string) => {
    if (!user?.email) {
      toast.error('Please login to save posts');
      return;
    }
    if (!roomId) return;

    try {
      // Use backend API for secure save toggle
      const result = await toggleSaveChatPost(messageId, roomId);

      if (result.saved) {
        setSavedPosts(prev => new Set([...prev, messageId]));
        toast.success('Post saved!');
      } else {
        setSavedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
        toast.success('Post unsaved');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post');
    }
  };

  const handleAddComment = async (messageId: string) => {
    if (!user?.email || !commentText.trim()) return;

    try {
      // Use backend API for secure comment posting
      await addChatComment(
        messageId,
        commentText.trim(),
        user.displayName || user.email?.split('@')[0] || 'User'
      );

      setCommentText('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleShare = async (message: Message) => {
    const shareText = `${message.author_name}: ${message.content}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Post by ${message.author_name}`, text: shareText, url: window.location.href });
      } catch { }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${diffInDays}d`;
  };

  const filteredMessages = messages.filter(msg =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Policy: Hide chat for readonly users
  if (isReadOnly) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Chat Rooms</h2>
          <p className="text-muted-foreground mb-4">
            Sign in with your college email to access chat rooms
          </p>
          <Button onClick={() => navigate('/study')}>
            Back to Study
          </Button>
        </div>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/study")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">Chat Rooms</h1>
                <p className="text-sm text-muted-foreground">Join a community</p>
              </div>
              <div className="flex gap-2">
                <CreateChatRoomDialog trigger={
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                } />
                <JoinChatRoomDialog trigger={
                  <Button size="sm" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Join
                  </Button>
                } />
                <Button
                  size="sm"
                  variant={showSavedOnly ? "default" : "outline"}
                  className={showSavedOnly ? "" : "text-primary"}
                  onClick={() => {
                    const newState = !showSavedOnly;
                    setShowSavedOnly(newState);
                    if (newState) {
                      fetchSavedMessages();
                    }
                  }}
                >
                  <BookmarkCheck className="w-4 h-4 mr-2" />
                  {showSavedOnly ? "All Rooms" : "Saved"}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-3 sm:p-4 pb-20">
          {/* Search rooms */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search your rooms..."
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-3">
            {rooms
              .filter(room =>
                room.name.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
                room.description?.toLowerCase().includes(roomSearchQuery.toLowerCase())
              )
              .map((room) => (
                <Card
                  key={room.id}
                  className="p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate(`/chatroom/${room.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      room.is_private ? "bg-amber-500/10" : "bg-primary/10"
                    )}>
                      {room.is_private ? (
                        <Lock className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Hash className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{room.name}</h3>
                        {room.is_private && (
                          <Badge variant="outline" className="text-xs">Private</Badge>
                        )}
                      </div>
                      {room.description && (
                        <p className="text-sm text-muted-foreground">{room.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{room.member_count}</span>
                    </div>
                  </div>
                </Card>
              ))}

            {rooms.filter(room =>
              room.name.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
              room.description?.toLowerCase().includes(roomSearchQuery.toLowerCase())
            ).length === 0 && roomSearchQuery && (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No rooms found matching "{roomSearchQuery}"</p>
                </div>
              )}

            {rooms.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">You haven't joined any rooms yet</p>
                <div className="flex gap-2 justify-center">
                  <CreateChatRoomDialog trigger={
                    <Button>Create a Room</Button>
                  } />
                  <JoinChatRoomDialog trigger={
                    <Button variant="outline">Join a Room</Button>
                  } />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Room list */}
      <div className="w-64 border-r border-border hidden md:block">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Your Rooms</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="p-2 space-y-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => navigate(`/ chatroom / ${room.id}`)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  room.id === roomId
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {room.is_private ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Hash className="w-4 h-4" />
                )}
                <span className="flex-1 text-left truncate">{room.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chatroom")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              {currentRoom?.is_private ? (
                <Lock className="w-5 h-5 text-amber-500" />
              ) : (
                <Hash className="w-5 h-5 text-primary" />
              )}
              <div>
                <h1 className="text-lg font-semibold text-foreground">{currentRoom?.name}</h1>
                {currentRoom?.description && (
                  <p className="text-xs text-muted-foreground">{currentRoom.description}</p>
                )}
              </div>
            </div>
            <div className="flex-1 max-w-md ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto p-3 sm:p-4 space-y-4 pb-20">
            {/* New post */}
            <Card className="p-4">
              <Textarea
                placeholder="Share something with the room..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="mb-3 min-h-[80px]"
              />
              {postImage && (
                <div className="relative mb-3 inline-block">
                  <img src={postImage} alt="Preview" className="h-32 rounded-lg object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setPostImage(null)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4 mr-1" />
                    )}
                    Image
                  </Button>
                </div>
                <Button onClick={handlePost} disabled={posting || (!newPost.trim() && !postImage)}>
                  {posting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Post
                </Button>
              </div>
            </Card>

            {/* Posts */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {filteredMessages.map((message) => (
                  <Card key={message.id} className="overflow-hidden">
                    <div className="flex">
                      {/* Vote sidebar */}
                      <div className="flex flex-col items-center gap-1 p-3 bg-muted/30">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-8 w-8", votedPosts[message.id] === "up" && "text-primary")}
                          onClick={() => handleVote(message.id, "up")}
                        >
                          <ChevronUp className="w-5 h-5" />
                        </Button>
                        <span className={cn(
                          "text-sm font-semibold",
                          votedPosts[message.id] === "up" && "text-primary",
                          votedPosts[message.id] === "down" && "text-red-500"
                        )}>
                          {message.upvotes - message.downvotes}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-8 w-8", votedPosts[message.id] === "down" && "text-red-500")}
                          onClick={() => handleVote(message.id, "down")}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {message.author_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{message.author_name}</span>
                          <span>·</span>
                          <span>{formatTimeAgo(message.created_at)}</span>
                        </div>
                        <p className="text-foreground mb-3 whitespace-pre-wrap">{message.content}</p>

                        {message.image_url && (
                          <img
                            src={message.image_url}
                            alt="Post image"
                            className="mt-3 rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setImageViewer({ isOpen: true, url: message.image_url! })}
                          />
                        )}

                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => handleShare(message)}
                          >
                            <Share className="w-4 h-4 mr-1" />
                            Share
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "text-muted-foreground",
                              savedPosts.has(message.id) && "text-primary"
                            )}
                            onClick={() => handleSavePost(message.id)}
                          >
                            {savedPosts.has(message.id) ? (
                              <><BookmarkCheck className="w-4 h-4 mr-1" /> Saved</>
                            ) : (
                              <><Bookmark className="w-4 h-4 mr-1" /> Save</>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => setShowComments(showComments === message.id ? null : message.id)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Comment
                          </Button>
                        </div>

                        {/* Comments Section */}
                        {showComments === message.id && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <h4 className="text-sm font-semibold mb-3">Comments</h4>

                            {/* Comment Input */}
                            <div className="flex gap-2 mb-4">
                              <Input
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && commentText.trim() && handleAddComment(message.id)}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAddComment(message.id)}
                                disabled={!commentText.trim()}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Comments List - Placeholder */}
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground text-center py-2">No comments yet</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

                {filteredMessages.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Image Viewer Modal */}
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

export default Chatroom;
