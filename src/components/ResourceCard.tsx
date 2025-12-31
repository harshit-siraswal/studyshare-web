import { ThumbsUp, ThumbsDown, Bookmark, Play, FileText, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import PDFViewer from "./PDFViewer";
import VideoPlayer from "./VideoPlayer";
import FollowButton from './FollowButton';
import { toast } from "sonner";
import { supabase } from "../supabase";
import { useAuth } from "@/context/AuthContext";

export type ResourceType = "video" | "notes" | "pyq";

interface ResourceCardProps {
  id: number | string;
  title: string;
  type: ResourceType;
  author: string;
  authorType: "teacher" | "student";
  votes?: number;
  upvotes?: number;
  downvotes?: number;
  subject: string;
  chapter: string;
  thumbnail?: string;
  pdfUrl?: string;
  videoUrl?: string;
  semester?: string;
  branch?: string;
  uploaded_by_email?: string;
  created_at?: string;
  onBookmark?: (id: number | string, isBookmarked: boolean) => void;
}

const typeIcons = {
  video: Play,
  notes: FileText,
  pyq: HelpCircle,
};

const typeLabels = {
  video: "Video",
  notes: "Notes",
  pyq: "PYQ",
};

const ResourceCard = ({
  id,
  title,
  type,
  author,
  authorType,
  votes: initialVotes = 0,
  upvotes: initialUpvotes = 0,
  downvotes: initialDownvotes = 0,
  subject,
  chapter,
  pdfUrl,
  videoUrl,
  uploaded_by_email,
  created_at,
  onBookmark,
}: ResourceCardProps) => {
  const { user } = useAuth();
  const [localUpvotes, setLocalUpvotes] = useState(initialUpvotes);
  const [localDownvotes, setLocalDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [loading, setLoading] = useState(false);

  const Icon = typeIcons[type];

  // Fetch user's bookmark and vote status on mount
  useEffect(() => {
    if (user?.uid) {
      fetchUserInteractions();
    }
  }, [user, id]);

  const fetchUserInteractions = async () => {
    if (!user?.uid) return;

    try {
      // Check if bookmarked
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.uid)
        .eq('resource_id', id.toString())
        .maybeSingle();

      if (!bookmarkError) {
        setIsBookmarked(!!bookmarkData);
      }

      // Check vote status
      const { data: voteData, error: voteError } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('user_id', user.uid)
        .eq('resource_id', id.toString())
        .maybeSingle();

      if (!voteError && voteData) {
        setUserVote(voteData.vote_type as 'upvote' | 'downvote');
      }
    } catch (error) {
      // Silently handle errors
    }
  };

  const handleVote = async (voteType: "upvote" | "downvote", e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user?.uid) {
      toast.error('Please login to vote');
      return;
    }

    setLoading(true);
    try {
      if (userVote === voteType) {
        // Remove vote
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.uid)
          .eq('resource_id', id.toString());

        if (error) throw error;

        if (voteType === 'upvote') {
          setLocalUpvotes(prev => prev - 1);
        } else {
          setLocalDownvotes(prev => prev - 1);
        }
        setUserVote(null);
        toast.success('Vote removed');
      } else if (userVote) {
        // Change vote
        const { error } = await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('user_id', user.uid)
          .eq('resource_id', id.toString());

        if (error) throw error;

        if (voteType === 'upvote') {
          setLocalUpvotes(prev => prev + 1);
          setLocalDownvotes(prev => prev - 1);
        } else {
          setLocalUpvotes(prev => prev - 1);
          setLocalDownvotes(prev => prev + 1);
        }
        setUserVote(voteType);
      } else {
        // New vote
        const { error } = await supabase
          .from('votes')
          .insert([{
            user_id: user.uid,
            resource_id: id.toString(),
            vote_type: voteType,
          }]);

        if (error) throw error;

        if (voteType === 'upvote') {
          setLocalUpvotes(prev => prev + 1);
        } else {
          setLocalDownvotes(prev => prev + 1);
        }
        setUserVote(voteType);
      }
    } catch (error: any) {
      console.error('Vote error:', error);
      toast.error('Failed to update vote');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user?.uid) {
      toast.error('Please login to bookmark');
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.uid)
          .eq('resource_id', id.toString());

        if (error) throw error;

        setIsBookmarked(false);
        toast.success('Removed from bookmarks');

        // Update localStorage
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const updated = bookmarks.filter((b: any) => b.id !== id);
        localStorage.setItem('bookmarks', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert([{
            user_id: user.uid,
            resource_id: id.toString(),
          }]);

        if (error) throw error;

        setIsBookmarked(true);
        toast.success('Bookmarked!');

        // Update localStorage
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        bookmarks.push({ id, title, type, subject, chapter });
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        window.dispatchEvent(new Event('storage'));
      }
      
      onBookmark?.(id, !isBookmarked);
    } catch (error: any) {
      console.error('Bookmark error:', error);
      toast.error('Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = () => {
    if (type === "video" && videoUrl) {
      setShowVideoPlayer(true);
    } else if ((type === "notes" || type === "pyq") && pdfUrl) {
      setShowPdfViewer(true);
    } else {
      toast.error("No file or video URL available");
    }
  };

  const netVotes = localUpvotes - localDownvotes;

  return (
    <>
      <Card 
        variant="interactive" 
        className="p-4 group cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex gap-4">
          {/* Thumbnail / Icon */}
          <div className={cn(
            "w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
            type === "video" && "bg-red-500/10",
            type === "notes" && "bg-blue-500/10",
            type === "pyq" && "bg-amber-500/10",
          )}>
            <Icon className={cn(
              "w-6 h-6 md:w-8 md:h-8",
              type === "video" && "text-red-500",
              type === "notes" && "text-blue-500",
              type === "pyq" && "text-amber-500",
            )} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors text-sm md:text-base">
                  {title}
                </h3>
                <div className="text-xs md:text-sm text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>by {author}</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      authorType === "teacher" ? "border-primary/50 text-primary" : "border-accent/50 text-accent"
                    )}
                  >
                    {authorType}
                  </Badge>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {typeLabels[type]}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{subject}</span>
              <span>•</span>
              <span>{chapter}</span>
            </div>

            {/* Actions - SIMPLIFIED WITH ONLY NET VOTES */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", userVote === "upvote" && "text-green-500 bg-green-500/10")}
                  onClick={(e) => handleVote("upvote", e)}
                  disabled={loading}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </Button>
                
                {/* ONLY NET VOTES - SINGLE NUMBER */}
                <span className={cn(
                  "text-sm font-medium min-w-[2rem] text-center",
                  netVotes > 0 && "text-green-500",
                  netVotes < 0 && "text-red-500",
                  netVotes === 0 && "text-muted-foreground"
                )}>
                  {netVotes > 0 ? `+${netVotes}` : netVotes}
                </span>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", userVote === "downvote" && "text-red-500 bg-red-500/10")}
                  onClick={(e) => handleVote("downvote", e)}
                  disabled={loading}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", isBookmarked && "text-amber-500")}
                onClick={handleBookmark}
                disabled={loading}
              >
                <Bookmark className={cn("w-3.5 h-3.5", isBookmarked && "fill-current")} />
              </Button>

              <span className="ml-auto text-xs text-muted-foreground hidden md:inline">
                Click to {type === "video" ? "watch" : "view"}
              </span>
            </div>

            {/* Uploader Info with Follow Button */}
            {uploaded_by_email && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      {author?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{author || 'Anonymous'}</p>
                    {created_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <FollowButton 
                  targetUserEmail={uploaded_by_email}
                  targetUserName={author}
                  size="sm"
                  variant="outline"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* PDF Viewer */}
      {pdfUrl && (
        <PDFViewer
          isOpen={showPdfViewer}
          onClose={() => setShowPdfViewer(false)}
          title={title}
          pdfUrl={pdfUrl}
        />
      )}

      {/* Video Player */}
      {videoUrl && (
        <VideoPlayer
          isOpen={showVideoPlayer}
          onClose={() => setShowVideoPlayer(false)}
          videoUrl={videoUrl}
          title={title}
        />
      )}
    </>
  );
};

export default ResourceCard;