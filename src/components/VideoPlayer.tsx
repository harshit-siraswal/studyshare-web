import { MessageCircle, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AIStudyTools from "./ai/AIStudyTools";
import { useEffect, useState } from "react";

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
  resourceId?: string;
}

const VideoPlayer = ({ isOpen, onClose, videoUrl, title, resourceId }: VideoPlayerProps) => {
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAiOpen(false);
    }
  }, [isOpen]);

  // Extract YouTube video ID if it's a YouTube URL
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
    }
    return null;
  };

  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-background overflow-hidden">
        <div className="flex flex-col relative">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-foreground truncate">
              {title || "Video Player"}
            </h3>
          </div>
          
          <div className="aspect-video bg-black">
            {youtubeEmbedUrl ? (
              <iframe
                src={youtubeEmbedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title || "Video"}
              />
            ) : (
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full"
              >
                Your browser does not support video playback.
              </video>
            )}
          </div>

          {resourceId && (
            <>
              <button
                type="button"
                onClick={() => setAiOpen((prev) => !prev)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-primary text-primary-foreground rounded-l-full px-2 py-3 shadow-md flex items-center gap-1 hover:opacity-90 transition"
                aria-label={aiOpen ? "Close AI chat" : "Open AI chat"}
                aria-pressed={aiOpen}
                title={aiOpen ? "Close AI chat" : "Open AI chat"}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-semibold tracking-wide [writing-mode:vertical-rl] rotate-180">
                  AI Chat
                </span>
              </button>

              <div
                className={`absolute top-0 right-0 h-full w-full sm:w-[360px] bg-background border-l border-border/60 shadow-xl z-30 transition-transform duration-200 ${aiOpen ? "translate-x-0" : "translate-x-full"}`}
              >
                <div className="h-full overflow-y-auto p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Chat</div>
                    <button
                      type="button"
                      onClick={() => setAiOpen(false)}
                      className="rounded-sm opacity-70 hover:opacity-100 transition"
                      aria-label="Close AI chat"
                      title="Close AI chat"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <AIStudyTools resourceId={resourceId} />
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayer;
