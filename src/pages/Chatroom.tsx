import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search, MessageSquare, ChevronUp, ChevronDown, MessageCircle, Share, Bookmark, BookmarkCheck, Hash, Lock, Users, Plus, Pin, PinOff, Image, Video, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Comment {
  id: number;
  author: string;
  authorUsername: string;
  content: string;
  time: string;
  date: string;
  votes: number;
}

interface Post {
  id: number;
  author: string;
  authorUsername: string;
  content: string;
  votes: number;
  comments: Comment[];
  time: string;
  date: string;
  image?: string;
  video?: string;
}

interface ChatRoom {
  id: string;
  name: string;
  members: number;
  isPrivate: boolean;
  description: string;
}

const chatRooms: ChatRoom[] = [
  { id: "placement", name: "placement", members: 312, isPrivate: false, description: "Placement updates and interview prep" },
  { id: "general", name: "general", members: 567, isPrivate: false, description: "General discussions" },
  { id: "cse-2024", name: "cse-2024", members: 145, isPrivate: false, description: "CSE batch 2024 discussions" },
  { id: "aiml-B", name: "aiml-B", members: 89, isPrivate: false, description: "AI/ML Section B" },
  { id: "team-sigma", name: "team sigma", members: 5, isPrivate: true, description: "Private study group" },
];

const mockPosts: Record<string, Post[]> = {
  placement: [
    { id: 1, author: "Rahul K.", authorUsername: "rahul_k_2024", content: "Anyone know about the upcoming TCS interview pattern?", votes: 45, time: "2h ago", date: "2024-03-10 14:30", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop", comments: [
      { id: 1, author: "Priya M.", authorUsername: "priya_m_tech", content: "Yes! It's mostly aptitude + technical. Focus on DSA basics.", votes: 23, time: "1h ago", date: "2024-03-10 15:30" },
      { id: 2, author: "Amit S.", authorUsername: "amit_bits", content: "They also ask about projects. Prepare well!", votes: 15, time: "45m ago", date: "2024-03-10 15:45" },
    ]},
    { id: 2, author: "Sneha P.", authorUsername: "sneha_iitb", content: "Infosys results are out! Check your emails.", votes: 89, time: "4h ago", date: "2024-03-10 12:00", comments: [] },
    { id: 3, author: "Vikram R.", authorUsername: "vikram_r_24", content: "Mock interview session tomorrow at 3 PM. Who's joining?", votes: 34, time: "6h ago", date: "2024-03-10 10:00", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=250&fit=crop", comments: [] },
  ],
  general: [
    { id: 1, author: "Admin", authorUsername: "admin_official", content: "Welcome to the general discussion room. Keep it respectful!", votes: 156, time: "1d ago", date: "2024-03-09 10:00", comments: [] },
    { id: 2, author: "Vikram", authorUsername: "vikram_general", content: "Best places to eat near campus?", votes: 34, time: "3h ago", date: "2024-03-10 13:00", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop", comments: [
      { id: 1, author: "Neha", authorUsername: "neha_foodie", content: "Try the new cafe near gate 2. Amazing coffee!", votes: 12, time: "2h ago", date: "2024-03-10 14:00" },
    ]},
  ],
  "cse-2024": [
    { id: 1, author: "Class Rep", authorUsername: "cse_rep_24", content: "DBMS assignment deadline extended to Friday!", votes: 67, time: "5h ago", date: "2024-03-10 11:00", comments: [] },
    { id: 2, author: "Study Group", authorUsername: "study_grp_cse", content: "Anyone want to form a study group for OS? DM me.", votes: 23, time: "8h ago", date: "2024-03-10 08:00", comments: [] },
  ],
  "aiml-B": [
    { id: 1, author: "Prof. Kumar", authorUsername: "prof_kumar_ml", content: "ML lab viva will be conducted next week. Prepare notebooks.", votes: 45, time: "1d ago", date: "2024-03-09 14:00", image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop", comments: [] },
  ],
  "team-sigma": [
    { id: 1, author: "Team Lead", authorUsername: "sigma_lead", content: "Let's meet tomorrow at 4 PM in library.", votes: 5, time: "30m ago", date: "2024-03-10 16:00", comments: [] },
  ],
};

const Chatroom = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const [newPost, setNewPost] = useState("");
  const [votedPosts, setVotedPosts] = useState<Record<string, "up" | "down">>({});
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const [savedPosts, setSavedPosts] = useState<{postId: number; roomId: string; roomName: string}[]>([]);
  const [pinnedRooms, setPinnedRooms] = useState<string[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postVideo, setPostVideo] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("savedPosts");
    if (stored) setSavedPosts(JSON.parse(stored));
    const storedPinned = localStorage.getItem("pinnedRooms");
    if (storedPinned) setPinnedRooms(JSON.parse(storedPinned));
  }, []);

  const currentRoom = chatRooms.find((r) => r.id === roomId);
  const posts = roomId ? mockPosts[roomId] || [] : [];

  const filteredPosts = posts.filter((post) =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRooms = chatRooms.filter((room) =>
    room.name.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
    room.description.toLowerCase().includes(roomSearchQuery.toLowerCase())
  );

  // Sort rooms with pinned first
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const aPinned = pinnedRooms.includes(a.id);
    const bPinned = pinnedRooms.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  const handleVote = (postId: number, direction: "up" | "down") => {
    const key = `${roomId}-${postId}`;
    setVotedPosts((prev) => {
      if (prev[key] === direction) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: direction };
    });
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    toast.success("Post submitted!");
    setNewPost("");
    setPostImage(null);
    setPostVideo(null);
  };

  const handleComment = () => {
    if (!newComment.trim()) return;
    toast.success("Comment posted!");
    setNewComment("");
  };

  const toggleSave = (postId: number) => {
    const exists = savedPosts.find(p => p.postId === postId && p.roomId === roomId);
    let updated;
    if (exists) {
      updated = savedPosts.filter(p => !(p.postId === postId && p.roomId === roomId));
      toast.success("Removed from saved");
    } else {
      const room = chatRooms.find(r => r.id === roomId);
      updated = [...savedPosts, { postId, roomId: roomId!, roomName: room?.name || "" }];
      toast.success("Saved!");
    }
    setSavedPosts(updated);
    localStorage.setItem("savedPosts", JSON.stringify(updated));
  };

  const togglePin = (roomIdToPin: string) => {
    let updated;
    if (pinnedRooms.includes(roomIdToPin)) {
      updated = pinnedRooms.filter(id => id !== roomIdToPin);
      toast.success("Room unpinned");
    } else {
      updated = [...pinnedRooms, roomIdToPin];
      toast.success("Room pinned!");
    }
    setPinnedRooms(updated);
    localStorage.setItem("pinnedRooms", JSON.stringify(updated));
  };

  const handleShare = async (post: Post) => {
    const shareText = `${post.author}: ${post.content}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Post by ${post.author}`, text: shareText, url: window.location.href });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const isSaved = (postId: number) => savedPosts.some(p => p.postId === postId && p.roomId === roomId);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImage(reader.result as string);
        setPostVideo(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostVideo(reader.result as string);
        setPostImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const navigateToProfile = (username: string) => {
    // Store the username to view in localStorage for the profile page
    localStorage.setItem("viewingProfile", username);
    navigate("/profile/" + username);
  };

  if (!roomId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/study")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">Chat Rooms</h1>
                <p className="text-sm text-muted-foreground">Join a community</p>
              </div>
              <Button 
                variant={showSaved ? "default" : "outline"} 
                size="sm"
                onClick={() => setShowSaved(!showSaved)}
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Saved ({savedPosts.length})
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-4">
          {/* Search Rooms */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms..."
              value={roomSearchQuery}
              onChange={(e) => setRoomSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {showSaved ? (
            <div className="space-y-3">
              <h2 className="font-semibold text-foreground mb-4">Saved Posts</h2>
              {savedPosts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No saved posts yet</p>
              ) : (
                savedPosts.map((saved) => {
                  const roomPosts = mockPosts[saved.roomId] || [];
                  const post = roomPosts.find(p => p.id === saved.postId);
                  if (!post) return null;
                  return (
                    <Card key={`${saved.roomId}-${saved.postId}`} className="p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Hash className="w-3 h-3" />
                        <span>{saved.roomName}</span>
                      </div>
                      <p className="text-sm text-foreground">{post.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">by {post.author}</p>
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {sortedRooms.map((room) => (
                <Card
                  key={room.id}
                  variant="interactive"
                  className="p-4 cursor-pointer"
                  onClick={() => navigate(`/chatroom/${room.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      room.isPrivate ? "bg-amber-500/10" : "bg-primary/10"
                    )}>
                      {room.isPrivate ? (
                        <Lock className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Hash className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{room.name}</h3>
                        {room.isPrivate && (
                          <Badge variant="outline" className="text-xs">Private</Badge>
                        )}
                        {pinnedRooms.includes(room.id) && (
                          <Pin className="w-3 h-3 text-primary fill-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{room.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); togglePin(room.id); }}
                      className="shrink-0"
                    >
                      {pinnedRooms.includes(room.id) ? (
                        <PinOff className="w-4 h-4" />
                      ) : (
                        <Pin className="w-4 h-4" />
                      )}
                    </Button>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{room.members}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Room list */}
      <div className="w-64 border-r border-border hidden md:block">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Rooms</h2>
        </div>
        <div className="p-2">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={roomSearchQuery}
              onChange={(e) => setRoomSearchQuery(e.target.value)}
              className="pl-7 h-8 text-sm"
            />
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-130px)]">
          <div className="p-2 space-y-1">
            {sortedRooms.map((room) => (
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
                {room.isPrivate ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Hash className="w-4 h-4" />
                )}
                <span className="flex-1 text-left">{room.name}</span>
                {pinnedRooms.includes(room.id) && (
                  <Pin className="w-3 h-3 text-primary fill-primary" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chatroom")} className="md:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hidden md:flex">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              {currentRoom?.isPrivate ? (
                <Lock className="w-5 h-5 text-amber-500" />
              ) : (
                <Hash className="w-5 h-5 text-primary" />
              )}
              <h1 className="text-lg font-semibold text-foreground">{currentRoom?.name}</h1>
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
          <div className="max-w-3xl mx-auto p-4 space-y-4">
            {/* New post */}
            <Card className="p-4">
              <Textarea
                placeholder="Ask a question or share something..."
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
              {postVideo && (
                <div className="relative mb-3 inline-block">
                  <video src={postVideo} className="h-32 rounded-lg object-cover" controls />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setPostVideo(null)}
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
                  >
                    <Image className="w-4 h-4 mr-1" />
                    Image
                  </Button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoUpload}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Video className="w-4 h-4 mr-1" />
                    Video
                  </Button>
                </div>
                <Button onClick={handlePost} disabled={!newPost.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Post
                </Button>
              </div>
            </Card>

            {/* Posts */}
            {filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <div className="flex">
                  {/* Vote sidebar */}
                  <div className="flex flex-col items-center gap-1 p-3 bg-muted/30">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8", votedPosts[`${roomId}-${post.id}`] === "up" && "text-primary")}
                      onClick={() => handleVote(post.id, "up")}
                    >
                      <ChevronUp className="w-5 h-5" />
                    </Button>
                    <span className={cn(
                      "text-sm font-semibold",
                      votedPosts[`${roomId}-${post.id}`] === "up" && "text-primary",
                      votedPosts[`${roomId}-${post.id}`] === "down" && "text-red-500"
                    )}>
                      {post.votes + (votedPosts[`${roomId}-${post.id}`] === "up" ? 1 : votedPosts[`${roomId}-${post.id}`] === "down" ? -1 : 0)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8", votedPosts[`${roomId}-${post.id}`] === "down" && "text-red-500")}
                      onClick={() => handleVote(post.id, "down")}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <button 
                        onClick={() => navigateToProfile(post.authorUsername)}
                        className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
                      >
                        {post.author}
                      </button>
                      <span>·</span>
                      <span>{post.time}</span>
                      <span className="text-xs">({formatDateTime(post.date)})</span>
                    </div>
                    <p className="text-foreground mb-3">{post.content}</p>
                    
                    {post.image && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-border">
                        <img src={post.image} alt="Post attachment" className="w-full h-48 object-cover" />
                      </div>
                    )}
                    
                    {post.video && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-border">
                        <video src={post.video} className="w-full h-48 object-cover" controls />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => setSelectedPost(post)}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {post.comments.length} Comments
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground"
                        onClick={() => handleShare(post)}
                      >
                        <Share className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn("text-muted-foreground", isSaved(post.id) && "text-primary")}
                        onClick={() => toggleSave(post.id)}
                      >
                        {isSaved(post.id) ? (
                          <BookmarkCheck className="w-4 h-4 mr-1" />
                        ) : (
                          <Bookmark className="w-4 h-4 mr-1" />
                        )}
                        {isSaved(post.id) ? "Saved" : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Thread View Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Post Thread</DialogTitle>
          </DialogHeader>
          
          {selectedPost && (
            <>
              {/* Full Post */}
              <div className="p-4 bg-muted/30 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {selectedPost.author[0]}
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    onClick={() => navigateToProfile(selectedPost.authorUsername)}
                    className="font-medium hover:text-primary hover:underline transition-colors"
                  >
                    {selectedPost.author}
                  </button>
                  <span className="text-xs text-muted-foreground">{formatDateTime(selectedPost.date)}</span>
                </div>
                <p className="text-foreground">{selectedPost.content}</p>
                {selectedPost.image && (
                  <img src={selectedPost.image} alt="Post" className="mt-3 rounded-lg w-full h-48 object-cover" />
                )}
                {selectedPost.video && (
                  <video src={selectedPost.video} className="mt-3 rounded-lg w-full h-48 object-cover" controls />
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span>{selectedPost.votes} votes</span>
                  <span>{selectedPost.comments.length} comments</span>
                </div>
              </div>

              {/* Comments */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {selectedPost.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 border-l-2 border-border pl-4">
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarFallback className="bg-secondary text-xs">
                          {comment.author[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <button 
                            onClick={() => navigateToProfile(comment.authorUsername)}
                            className="font-medium text-sm hover:text-primary hover:underline transition-colors"
                          >
                            {comment.author}
                          </button>
                          <span className="text-xs text-muted-foreground">{formatDateTime(comment.date)}</span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <button className="text-xs text-muted-foreground hover:text-foreground">
                            {comment.votes} votes
                          </button>
                          <button className="text-xs text-muted-foreground hover:text-foreground">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedPost.comments.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
              </ScrollArea>

              {/* Add Comment */}
              <div className="flex gap-2 pt-4 border-t border-border mt-4">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleComment} disabled={!newComment.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chatroom;


