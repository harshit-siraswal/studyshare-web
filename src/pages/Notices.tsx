import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MessageCircle, Heart, Share, X, Send, Play, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ImageViewer from "@/components/ImageViewer";
import VideoPlayer from "@/components/VideoPlayer";

const departments = [
  "All Departments",
  "AIML", "AI", "CSE", "CS", "CSIT", "IT", "BCA", "MCA", "B.Pharma"
];

const neutralDepartments = ["Sports", "Placement Cell", "Cultural Committee", "Library", "Admin Office"];

interface Comment {
  id: number;
  author: string;
  content: string;
  time: string;
  date: string;
  likes: number;
  replies?: Comment[];
}

interface Notice {
  id: number;
  author: string;
  handle: string;
  department: string;
  content: string;
  time: string;
  date: string;
  likes: number;
  comments: Comment[];
  important: boolean;
  image?: string;
  video?: string;
}

const mockNotices: Notice[] = [
  { 
    id: 1, 
    author: "Admin Office", 
    handle: "@admin", 
    department: "Admin Office",
    content: "Mid-semester examinations will begin from 15th March 2024. All students are requested to check the detailed schedule on the college portal. Admit cards are now available for download.", 
    time: "2h", 
    date: "2024-03-10", 
    likes: 245, 
    comments: [
      { id: 1, author: "Rahul K.", content: "Is this for all branches?", time: "1h", date: "2024-03-10 14:30", likes: 12, replies: [
        { id: 2, author: "Admin Office", content: "Yes, this applies to all branches.", time: "45m", date: "2024-03-10 14:45", likes: 8 }
      ]},
    ],
    important: true,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=300&fit=crop"
  },
  { 
    id: 2, 
    author: "Training & Placement", 
    handle: "@tnp", 
    department: "Placement Cell",
    content: "🚀 Exciting Workshop Alert! AI/ML Workshop this Saturday at 10 AM in Seminar Hall. Guest speaker from Google will be sharing insights on latest AI trends. Limited seats - Register now!", 
    time: "5h", 
    date: "2024-03-10", 
    likes: 189, 
    comments: [],
    important: false,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=300&fit=crop"
  },
  { 
    id: 3, 
    author: "CSE Department", 
    handle: "@cse", 
    department: "CSE",
    content: "📢 Guest lecture on Cloud Computing by AWS certified architect. Attendance mandatory for 3rd and 4th year students. Venue: Auditorium Block B, Time: 2:00 PM", 
    time: "1d", 
    date: "2024-03-09", 
    likes: 134, 
    comments: [],
    important: true,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=300&fit=crop"
  },
  { 
    id: 4, 
    author: "Sports Committee", 
    handle: "@sports", 
    department: "Sports",
    content: "🏆 Annual Sports Meet 2024! Registration now open for Cricket, Football, Badminton, Table Tennis, Athletics, and Chess. Form your teams and register at the Sports Office by March 20th.", 
    time: "2d", 
    date: "2024-03-08", 
    likes: 98, 
    comments: [],
    important: false,
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=300&fit=crop",
    video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  { 
    id: 5, 
    author: "AIML Department", 
    handle: "@aiml", 
    department: "AIML",
    content: "⚠️ Machine Learning lab sessions rescheduled to Wednesday 2 PM. Please update your schedules accordingly. Lab Manual submission deadline extended to Friday.", 
    time: "3d", 
    date: "2024-03-07", 
    likes: 67, 
    comments: [],
    important: false,
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=300&fit=crop"
  },
  { 
    id: 6, 
    author: "Cultural Committee", 
    handle: "@cultural", 
    department: "Cultural Committee",
    content: "🎭 Annual Fest 'Utsav 2024' Auditions! Calling all talented performers for Dance, Music, Drama, and Stand-up Comedy. Show us your talent! Auditions start next week.", 
    time: "4d", 
    date: "2024-03-06", 
    likes: 156, 
    comments: [],
    important: false,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=300&fit=crop"
  },
  { 
    id: 7, 
    author: "IT Department", 
    handle: "@it", 
    department: "IT",
    content: "💻 Free Web Development Bootcamp starting next Monday! Learn HTML, CSS, JavaScript, and React. Certificate provided upon completion. Register at IT Department office.", 
    time: "5d", 
    date: "2024-03-05", 
    likes: 89, 
    comments: [],
    important: false,
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=300&fit=crop"
  },
  { 
    id: 8, 
    author: "BCA Department", 
    handle: "@bca", 
    department: "BCA",
    content: "📝 Important: Project submission deadline extended to 20th March. Submit your projects to the department coordinator. Late submissions will not be accepted.", 
    time: "1w", 
    date: "2024-03-03", 
    likes: 45, 
    comments: [],
    important: true 
  },
  { 
    id: 9, 
    author: "Library", 
    handle: "@library", 
    department: "Library",
    content: "📚 New arrivals in the library! Latest programming books on Python, Data Science, and Machine Learning. Also added: Competitive Programming guides. Visit today!", 
    time: "1w", 
    date: "2024-03-02", 
    likes: 78, 
    comments: [],
    important: false,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=300&fit=crop"
  },
  { 
    id: 10, 
    author: "MCA Department", 
    handle: "@mca", 
    department: "MCA",
    content: "🏢 Industry Visit to Tech Park scheduled for next Friday. Bus leaves at 8:30 AM sharp from Main Gate. Register with your class representative by Wednesday.", 
    time: "1w", 
    date: "2024-03-01", 
    likes: 56, 
    comments: [],
    important: false,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=300&fit=crop"
  },
  { 
    id: 11, 
    author: "Placement Cell", 
    handle: "@placements", 
    department: "Placement Cell",
    content: "🎉 Congratulations to all students who got placed in TCS, Infosys, and Wipro! Final placement drive by Microsoft scheduled next month. Prepare well!", 
    time: "1w", 
    date: "2024-02-28", 
    likes: 234, 
    comments: [],
    important: true,
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=300&fit=crop"
  },
  { 
    id: 12, 
    author: "Admin Office", 
    handle: "@admin", 
    department: "Admin Office",
    content: "🏖️ Holiday Notice: College will remain closed on account of Holi on March 25th and 26th. Wishing everyone a colorful and joyful Holi!", 
    time: "2w", 
    date: "2024-02-25", 
    likes: 312, 
    comments: [],
    important: false,
    image: "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?w=600&h=300&fit=crop"
  },
];

const Notices = () => {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [likedNotices, setLikedNotices] = useState<number[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [likedComments, setLikedComments] = useState<number[]>([]);
  const [imageViewer, setImageViewer] = useState<{isOpen: boolean; url: string; title: string}>({
    isOpen: false, url: "", title: ""
  });
  const [videoPlayer, setVideoPlayer] = useState<{isOpen: boolean; url: string; title: string}>({
    isOpen: false, url: "", title: ""
  });

  const filteredNotices = mockNotices.filter((notice) => {
    if (fromDate && toDate) {
      const noticeDate = new Date(notice.date);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (noticeDate < from || noticeDate > to) return false;
    }
    
    if (selectedDepartment !== "All Departments") {
      const isNeutral = neutralDepartments.includes(notice.department);
      if (!isNeutral && notice.department !== selectedDepartment) return false;
    }
    
    return true;
  });

  const toggleLike = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedNotices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleCommentLike = (id: number) => {
    setLikedComments((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleShare = async (notice: Notice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const shareText = `${notice.author}: ${notice.content}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Notice from ${notice.author}`,
          text: shareText,
          url: window.location.href,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    toast.success("Comment posted!");
    setNewComment("");
  };

  const handleAddReply = (commentId: number) => {
    if (!replyContent.trim()) return;
    toast.success("Reply posted!");
    setReplyContent("");
    setReplyingTo(null);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleImageClick = (e: React.MouseEvent, notice: Notice) => {
    e.stopPropagation();
    if (notice.image) {
      setImageViewer({ isOpen: true, url: notice.image, title: notice.author });
    }
  };

  const handleVideoClick = (e: React.MouseEvent, notice: Notice) => {
    e.stopPropagation();
    if (notice.video) {
      setVideoPlayer({ isOpen: true, url: notice.video, title: notice.author });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/study")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">College Notices</h1>
              <p className="text-sm text-muted-foreground">Stay updated with announcements</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Filters */}
        <div className="p-4 border-b border-border space-y-3">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">From:</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-auto h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">To:</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-auto h-9"
              />
            </div>
            {(fromDate || toDate || selectedDepartment !== "All Departments") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setSelectedDepartment("All Departments");
                }}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Notices Feed */}
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="divide-y divide-border">
            {filteredNotices.map((notice) => (
              <article
                key={notice.id}
                className={cn(
                  "p-4 hover:bg-muted/30 transition-all duration-200 cursor-pointer group",
                  notice.important && "border-l-4 border-primary bg-primary/5"
                )}
                onClick={() => setSelectedNotice(notice)}
              >
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {notice.author[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-semibold text-foreground">{notice.author}</span>
                      <span className="text-muted-foreground text-sm">{notice.handle}</span>
                      <span className="text-muted-foreground text-sm">·</span>
                      <span className="text-muted-foreground text-sm">{notice.time}</span>
                      {notice.important && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
                          Important
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-foreground leading-relaxed">{notice.content}</p>
                    
                    {/* Notice Image */}
                    {notice.image && (
                      <div 
                        className="mt-3 rounded-xl overflow-hidden border border-border relative group/image"
                        onClick={(e) => handleImageClick(e, notice)}
                      >
                        <img 
                          src={notice.image} 
                          alt="Notice attachment" 
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover/image:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&h=300&fit=crop";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover/image:opacity-100 transition-opacity flex gap-2">
                            <Button size="sm" variant="secondary" className="backdrop-blur-sm">
                              <ImageIcon className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {notice.video && (
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                className="backdrop-blur-sm"
                                onClick={(e) => handleVideoClick(e, notice)}
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Play
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center gap-6 mt-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotice(notice);
                        }}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group/btn"
                      >
                        <div className="p-1.5 rounded-full group-hover/btn:bg-primary/10 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <span className="text-sm">{notice.comments.length}</span>
                      </button>
                      <button
                        onClick={(e) => toggleLike(notice.id, e)}
                        className={cn(
                          "flex items-center gap-1.5 transition-colors group/btn",
                          likedNotices.includes(notice.id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                        )}
                      >
                        <div className="p-1.5 rounded-full group-hover/btn:bg-red-500/10 transition-colors">
                          <Heart className={cn("w-4 h-4", likedNotices.includes(notice.id) && "fill-current")} />
                        </div>
                        <span className="text-sm">{notice.likes + (likedNotices.includes(notice.id) ? 1 : 0)}</span>
                      </button>
                      <button 
                        onClick={(e) => handleShare(notice, e)}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group/btn"
                      >
                        <div className="p-1.5 rounded-full group-hover/btn:bg-primary/10 transition-colors">
                          <Share className="w-4 h-4" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {filteredNotices.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No notices found for the selected filters.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Comments Dialog */}
      <Dialog open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          
          {selectedNotice && (
            <>
              <div className="p-3 bg-muted/30 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {selectedNotice.author[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{selectedNotice.author}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(selectedNotice.date)}</span>
                </div>
                <p className="text-sm text-foreground">{selectedNotice.content}</p>
              </div>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {selectedNotice.comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="bg-secondary text-xs">
                            {comment.author[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.author}</span>
                              <span className="text-xs text-muted-foreground">{comment.date}</span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                          <div className="flex items-center gap-4 mt-1 ml-2">
                            <button
                              onClick={() => toggleCommentLike(comment.id)}
                              className={cn(
                                "text-xs flex items-center gap-1 transition-colors",
                                likedComments.includes(comment.id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                              )}
                            >
                              <Heart className={cn("w-3 h-3", likedComments.includes(comment.id) && "fill-current")} />
                              {comment.likes + (likedComments.includes(comment.id) ? 1 : 0)}
                            </button>
                            <button
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Reply
                            </button>
                          </div>

                          {replyingTo === comment.id && (
                            <div className="flex gap-2 mt-2 ml-2">
                              <Input
                                placeholder="Write a reply..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="h-8 text-sm"
                              />
                              <Button size="sm" className="h-8" onClick={() => handleAddReply(comment.id)}>
                                <Send className="w-3 h-3" />
                              </Button>
                            </div>
                          )}

                          {comment.replies?.map((reply) => (
                            <div key={reply.id} className="flex gap-2 mt-2 ml-4">
                              <Avatar className="w-6 h-6 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {reply.author[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-muted/30 rounded-lg p-2">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-medium text-xs">{reply.author}</span>
                                    <span className="text-xs text-muted-foreground">{reply.date}</span>
                                  </div>
                                  <p className="text-xs">{reply.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {selectedNotice.comments.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">No comments yet. Be the first to comment!</p>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Input
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                />
                <Button onClick={handleAddComment}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
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

export default Notices;
