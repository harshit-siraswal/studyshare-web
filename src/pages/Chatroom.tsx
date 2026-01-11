import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search, MessageSquare, ChevronUp, ChevronDown, MessageCircle, Share, Hash, Lock, Users, Plus, Send, X, Image as ImageIcon, Loader2, Bookmark, BookmarkCheck, Pin, Trash2, Copy, Settings } from "lucide-react";
import { SEO } from "@/components/SEO";
import { CommentThread, CommentData } from "@/components/CommentThread";
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
import { postChatMessage, voteChatMessage, toggleSaveChatPost, addChatComment, deleteChatComment, getChatComments, ChatComment, getUserChatVotes, getChatRoomInfo, joinChatRoomById } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { usePermissions } from "@/hooks/usePermissions";
import { uploadChatImage } from "@/lib/uploadChatImage";
import CreateChatRoomDialog from "@/components/CreateChatRoomDialog";
import JoinChatRoomDialog from "@/components/JoinChatRoomDialog";
import RoomSettingsModal from "@/components/RoomSettingsModal";
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
  const [postComments, setPostComments] = useState<Record<string, ChatComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);

  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [isMember, setIsMember] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  // Pagination state for messages
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const MESSAGES_PER_PAGE = 50;

  // Pinned rooms from localStorage
  const [pinnedRooms, setPinnedRooms] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('pinnedRooms');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const togglePinRoom = (roomId: string) => {
    setPinnedRooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      localStorage.setItem('pinnedRooms', JSON.stringify([...newSet]));
      return newSet;
    });
  };

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
      // Fetch user's previous votes
      if (user?.email) {
        fetchUserVotes();
      }
    }
  }, [roomId, user]);

  // Fetch user's previous votes from DB
  const fetchUserVotes = async () => {
    if (!roomId) return;
    try {
      const { votes } = await getUserChatVotes(roomId);
      setVotedPosts(votes);
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

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
      // Use new API to get room info with membership check
      const { room, isMember: memberStatus, isAdmin: adminStatus } = await getChatRoomInfo(roomId);

      setCurrentRoom({
        id: room.id,
        name: room.name,
        description: room.description,
        is_private: room.is_private,
        member_count: room.member_count,
        created_by: room.created_by,
        created_at: room.created_at,
      });
      setIsMember(memberStatus);
      setIsAdmin(adminStatus);
      setRoomCode(room.room_code || null);
    } catch (error) {
      console.error('Error fetching room:', error);
      toast.error("Room not found");
      navigate('/chatroom');
    }
  };

  const fetchMessages = async (loadMore = false) => {
    if (!roomId) return;

    if (!loadMore) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const offset = loadMore ? messages.length : 0;

      const { data, error } = await supabase
        .from('room_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .range(offset, offset + MESSAGES_PER_PAGE - 1);

      if (error) throw error;

      const newMessages = data || [];
      setHasMoreMessages(newMessages.length === MESSAGES_PER_PAGE);

      if (loadMore) {
        setMessages(prev => [...prev, ...newMessages]);
      } else {
        setMessages(newMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more messages when scrolling
  const loadMoreMessages = () => {
    if (!loadingMore && hasMoreMessages) {
      fetchMessages(true);
    }
  };

  const subscribeToMessages = () => {
    if (!roomId || !user?.email) return;

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: user.email },
      },
    });

    // Track presence for active users
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setActiveUsers(Object.keys(state).length);
    });

    // Subscribe to new messages
    channel.on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'room_messages',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        setMessages(prev => [payload.new as Message, ...prev]);
      }
    );

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_email: user.email, online_at: new Date().toISOString() });
      }
    });

    return () => {
      channel.unsubscribe();
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
    } catch (error) {
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

    // Optimistic update for vote state
    setVotedPosts(prev => {
      if (prev[key] === direction) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: direction };
    });

    try {
      // Use backend API - it now handles toggle logic and returns new counts
      const result = await voteChatMessage(messageId, direction);

      // Update message counts with values from backend
      if (result.newUpvotes !== undefined && result.newDownvotes !== undefined) {
        setMessages(prev => prev.map(m =>
          m.id === messageId
            ? { ...m, upvotes: result.newUpvotes, downvotes: result.newDownvotes }
            : m
        ));
      }
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
      toast.error('Failed to vote');
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

  // Fetch comments for a post
  const fetchCommentsForPost = async (messageId: string) => {
    if (postComments[messageId]) return; // Already fetched

    setLoadingComments(messageId);
    try {
      const { comments } = await getChatComments(messageId);
      setPostComments(prev => ({ ...prev, [messageId]: comments }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(null);
    }
  };

  // Toggle comments visibility and fetch if needed
  const togglePostComments = (messageId: string) => {
    if (showComments === messageId) {
      setShowComments(null);
    } else {
      setShowComments(messageId);
      fetchCommentsForPost(messageId);
    }
  };

  const handleChatReply = async (messageId: string, content: string, parentId?: string) => {
    if (!user?.email || !content.trim()) return;

    try {
      const authorName = user.displayName || user.email?.split('@')[0] || 'User';

      // Use backend API for secure comment posting
      const result = await addChatComment(
        messageId,
        content.trim(),
        authorName,
        parentId
      );

      // Add to local state
      const newComment: ChatComment = {
        id: result.id,
        message_id: messageId,
        author_name: authorName,
        author_email: user.email!,
        content: content.trim(),
        created_at: new Date().toISOString(),
        parent_id: parentId
      };

      setPostComments(prev => ({
        ...prev,
        [messageId]: [...(prev[messageId] || []), newComment]
      }));

      if (!parentId) setCommentText('');
      toast.success('Reply posted!');
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentText(''); // Clear main input if reply logic fails or succeeds
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (messageId: string, commentId: string) => {
    try {
      await deleteChatComment(messageId, commentId);

      setPostComments(prev => ({
        ...prev,
        [messageId]: prev[messageId]?.filter(c => c.id !== commentId) || []
      }));

      toast.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleShare = async (message: Message) => {
    const shareText = `${message.author_name}: ${message.content}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Post by ${message.author_name}`, text: shareText, url: window.location.href });
      } catch (error) {
        console.error('Share failed', error);
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
      <div className="min-h-screen-safe bg-background flex items-center justify-center">
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
      <div className="min-h-screen-safe bg-background">
        <SEO
          title="Chat Rooms"
          description="Join chat rooms and connect with your college community. Discuss topics, share ideas, and collaborate with fellow students."
        />
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
            {showSavedOnly ? (
              // SAVED POSTS VIEW
              savedMessages.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">No saved posts yet</p>
                  <p className="text-sm text-muted-foreground">Save posts from any room to see them here</p>
                </div>
              ) : (
                savedMessages.map((msg) => (
                  <Card key={msg.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {msg.author_name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{msg.author_name || 'Anonymous'}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap">{msg.content}</p>
                        {msg.image_url && (
                          <img
                            src={msg.image_url}
                            alt="Post"
                            className="mt-2 rounded-lg max-h-64 object-cover cursor-pointer"
                            onClick={() => setImageViewer({ isOpen: true, url: msg.image_url! })}
                          />
                        )}
                        <div className="flex items-center gap-4 mt-3 text-muted-foreground text-sm">
                          <span className="flex items-center gap-1">
                            <ChevronUp className="w-4 h-4" />
                            {msg.upvotes - msg.downvotes}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary h-7"
                            onClick={() => handleSavePost(msg.id)}
                          >
                            <BookmarkCheck className="w-4 h-4 mr-1" />
                            Unsave
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )
            ) : (
              // ROOMS LIST VIEW
              rooms
                .filter(room =>
                  room.name.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
                  room.description?.toLowerCase().includes(roomSearchQuery.toLowerCase())
                )
                .sort((a, b) => {
                  // Sort pinned rooms to top
                  const aPinned = pinnedRooms.has(a.id);
                  const bPinned = pinnedRooms.has(b.id);
                  if (aPinned && !bPinned) return -1;
                  if (!aPinned && bPinned) return 1;
                  return 0;
                })
                .map((room) => (
                  <Card
                    key={room.id}
                    className={cn(
                      "p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors",
                      pinnedRooms.has(room.id) && "border-primary/50 bg-primary/5"
                    )}
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
                          {pinnedRooms.has(room.id) && (
                            <Pin className="w-3 h-3 text-primary fill-primary" />
                          )}
                          {room.is_private && (
                            <Badge variant="outline" className="text-xs">Private</Badge>
                          )}
                        </div>
                        {room.description && (
                          <p className="text-sm text-muted-foreground">{room.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 shrink-0",
                          pinnedRooms.has(room.id) && "text-primary"
                        )}
                        onClick={(e) => { e.stopPropagation(); togglePinRoom(room.id); }}
                      >
                        <Pin className={cn("w-4 h-4", pinnedRooms.has(room.id) && "fill-current")} />
                      </Button>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{room.member_count}</span>
                      </div>
                    </div>
                  </Card>
                ))
            )}

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

        {/* Floating Saved Posts Button - Mobile Only */}
        <Button
          className="fixed bottom-20 right-4 z-40 shadow-lg rounded-full h-12 px-4 md:hidden"
          variant={showSavedOnly ? "default" : "secondary"}
          onClick={() => {
            const newState = !showSavedOnly;
            setShowSavedOnly(newState);
            if (newState) {
              fetchSavedMessages();
            }
          }}
        >
          <BookmarkCheck className="w-5 h-5 mr-2" />
          {showSavedOnly ? "All Rooms" : "Saved Posts"}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-background flex">
      <SEO
        title={currentRoom?.name || "Chat Room"}
        description={currentRoom?.description || "Join the conversation in this chat room."}
      />
      {/* Sidebar - Room list */}
      <div className="w-64 border-r border-border hidden md:block sticky top-0 h-screen overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Your Rooms</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="p-2 space-y-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => navigate(`/chatroom/${room.id}`)}
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
            {/* New post - only for members */}
            {isMember ? (
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
            ) : (
              <Card className="p-4 bg-muted/30 border-dashed">
                <div className="text-center py-4">
                  <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground mb-3">Join this community to post</p>
                  <Button onClick={async () => {
                    try {
                      await joinChatRoomById(roomId!, user?.displayName || user?.email?.split('@')[0], selectedCollege?.domain);
                      toast.success("Joined room!");
                      setIsMember(true);
                      fetchRoomDetails();
                    } catch (error: any) {
                      toast.error(error.message || "Failed to join room");
                    }
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Join Community
                  </Button>
                </div>
              </Card>
            )}

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
                          <Avatar
                            className="w-6 h-6 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                            onClick={() => navigate(`/profile/${message.author_email?.split('@')[0] || message.author_name.toLowerCase().replace(/\s+/g, '')}`)}
                          >
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {message.author_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <button
                            className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
                            onClick={() => navigate(`/profile/${message.author_email?.split('@')[0] || message.author_name.toLowerCase().replace(/\s+/g, '')}`)}
                          >
                            {message.author_name}
                          </button>
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
                            className={cn(
                              "text-muted-foreground",
                              showComments === message.id && "text-primary"
                            )}
                            onClick={() => togglePostComments(message.id)}
                          >
                            <MessageCircle className={cn("w-4 h-4 mr-1", showComments === message.id && "fill-current")} />
                            {(postComments[message.id]?.length || 0) > 0 ? `${postComments[message.id]?.length}` : 'Comment'}
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
                                onKeyPress={(e) => e.key === 'Enter' && commentText.trim() && handleChatReply(message.id, commentText)}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleChatReply(message.id, commentText)}
                                disabled={!commentText.trim()}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Comments List */}
                            <div className="space-y-3">
                              {loadingComments === message.id ? (
                                <div className="flex justify-center py-3">
                                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : (
                                <CommentThread
                                  comments={postComments[message.id] || []}
                                  currentUserEmail={user?.email}
                                  onReply={(content, parentId) => handleChatReply(message.id, content, parentId)}
                                  onDelete={(commentId) => handleDeleteComment(message.id, commentId)}
                                />
                              )}
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

                {/* Load More Messages Button */}
                {hasMoreMessages && filteredMessages.length > 0 && !showSavedOnly && (
                  <div className="text-center py-4">
                    <Button
                      variant="outline"
                      onClick={loadMoreMessages}
                      disabled={loadingMore}
                      className="min-w-[150px]"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load Older Messages'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Sidebar - Room Info (Reddit-style) */}
      <div className="w-72 border-l border-border hidden lg:block sticky top-0 h-screen overflow-hidden">
        <div className="p-4 border-b border-border bg-primary/5">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            {currentRoom?.is_private ? <Lock className="w-4 h-4 text-amber-500" /> : <Hash className="w-4 h-4 text-primary" />}
            r/{currentRoom?.name}
          </h2>
          {currentRoom?.description && (
            <p className="text-sm text-muted-foreground mt-1">{currentRoom.description}</p>
          )}
        </div>
        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xl font-bold">{currentRoom?.member_count || 0}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-500">{activeUsers}</p>
              <p className="text-xs text-muted-foreground">Online Now</p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Users className="w-4 h-4" />
              <span>Created by</span>
            </div>
            <button
              className="font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => navigate(`/profile/${currentRoom?.created_by?.split('@')[0]}`)}
            >
              {currentRoom?.created_by?.split('@')[0] || 'Unknown'}
            </button>
          </div>

          <div className="border-t border-border pt-4">
            <div className="text-sm text-muted-foreground">
              Created {currentRoom?.created_at ? new Date(currentRoom.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown'}
            </div>
          </div>

          {/* Join/Leave button for non-members */}
          {!isMember && (
            <Button className="w-full" onClick={async () => {
              try {
                await joinChatRoomById(roomId!, user?.displayName || user?.email?.split('@')[0], selectedCollege?.domain);
                toast.success("Joined room!");
                setIsMember(true);
                // Refresh room details to get updated member count
                fetchRoomDetails();
              } catch (error: any) {
                toast.error(error.message || "Failed to join room");
              }
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Join Community
            </Button>
          )}

          {/* Member badge with settings */}
          {isMember && (
            <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-500">
                <Users className="w-4 h-4" />
                <span>You're a member</span>
              </div>
              <RoomSettingsModal
                roomId={roomId!}
                roomName={currentRoom?.name || 'Room'}
                roomCode={roomCode}
                isAdmin={isAdmin}
                onCodeRegenerated={(newCode) => setRoomCode(newCode)}
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="w-4 h-4" />
                  </Button>
                }
              />
            </div>
          )}
        </div>
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
