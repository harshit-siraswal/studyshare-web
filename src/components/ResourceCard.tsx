import { ThumbsUp, ThumbsDown, Bookmark, Play, FileText, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import PDFViewer from "./PDFViewer";
import { toast } from "sonner";

export type ResourceType = "video" | "notes" | "pyq";

interface ResourceCardProps {
  id: number;
  title: string;
  type: ResourceType;
  author: string;
  authorType: "teacher" | "student";
  votes: number;
  subject: string;
  chapter: string;
  thumbnail?: string;
  onBookmark?: (id: number, isBookmarked: boolean) => void;
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
  votes: initialVotes,
  subject,
  chapter,
  onBookmark,
}: ResourceCardProps) => {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(() => {
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    return bookmarks.some((b: any) => b.id === id);
  });
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  const Icon = typeIcons[type];

  const handleVote = (voteType: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    if (userVote === voteType) {
      setVotes(voteType === "up" ? votes - 1 : votes + 1);
      setUserVote(null);
    } else {
      let change = 0;
      if (userVote === "up") change = -2;
      else if (userVote === "down") change = 2;
      else change = voteType === "up" ? 1 : -1;
      
      setVotes(votes + change);
      setUserVote(voteType);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    
    if (isBookmarked) {
      const updated = bookmarks.filter((b: any) => b.id !== id);
      localStorage.setItem("bookmarks", JSON.stringify(updated));
      setIsBookmarked(false);
      toast.success("Removed from bookmarks");
    } else {
      const newBookmark = { id, title, type, author, subject, chapter };
      localStorage.setItem("bookmarks", JSON.stringify([...bookmarks, newBookmark]));
      setIsBookmarked(true);
      toast.success("Added to bookmarks");
    }
    
    onBookmark?.(id, !isBookmarked);
  };

  // Sample PDFs for different resources
  const samplePDFs: Record<number, string> = {
    2: "https://www.cs.usfca.edu/~galles/cs245/lecture/lecture0.pdf",
    3: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf",
    5: "https://intronetworks.cs.luc.edu/current2/ComputerNetworks.pdf",
    6: "https://jeffe.cs.illinois.edu/teaching/algorithms/book/01-recursion.pdf",
  };

  const handleCardClick = () => {
    if (type === "notes" || type === "pyq") {
      setShowPdfViewer(true);
    } else {
      window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank");
    }
  };

  const getPdfUrl = () => samplePDFs[id] || "https://www.africau.edu/images/default/sample.pdf";

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
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                  by {author} 
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "ml-2 text-xs",
                      authorType === "teacher" ? "border-primary/50 text-primary" : "border-accent/50 text-accent"
                    )}
                  >
                    {authorType}
                  </Badge>
                </p>
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

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", userVote === "up" && "text-green-500 bg-green-500/10")}
                  onClick={(e) => handleVote("up", e)}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </Button>
                <span className={cn(
                  "text-sm font-medium min-w-[2rem] text-center",
                  votes > 0 && "text-green-500",
                  votes < 0 && "text-red-500"
                )}>
                  {votes}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", userVote === "down" && "text-red-500 bg-red-500/10")}
                  onClick={(e) => handleVote("down", e)}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", isBookmarked && "text-amber-500")}
                onClick={handleBookmark}
              >
                <Bookmark className={cn("w-3.5 h-3.5", isBookmarked && "fill-current")} />
              </Button>

              <span className="ml-auto text-xs text-muted-foreground hidden md:inline">
                Click to open
              </span>
            </div>
          </div>
        </div>
      </Card>

      <PDFViewer
        isOpen={showPdfViewer}
        onClose={() => setShowPdfViewer(false)}
        title={title}
        pdfUrl={getPdfUrl()}
      />
    </>
  );
};

export default ResourceCard;
