import { Maximize2, MessageCircle, Minimize2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AIStudyTools from "./ai/AIStudyTools";
import { useCallback, useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
  resourceId?: string;
}

const VideoPlayer = ({ isOpen, onClose, videoUrl, title, resourceId }: VideoPlayerProps) => {
  const [aiOpen, setAiOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setAiOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && document.fullscreenElement === dialogRef.current) {
      document.exitFullscreen().catch(() => {
        // Ignore if document is not active
      });
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

  const toggleFullscreen = useCallback(async () => {
    const target = dialogRef.current;
    if (!target) return;
    try {
      if (document.fullscreenElement === target) {
        await document.exitFullscreen();
        setIsFullscreen(false);
        return;
      }
      if (document.fullscreenElement && document.fullscreenElement !== target) {
        await document.exitFullscreen();
      }
      await target.requestFullscreen();
      setIsFullscreen(true);
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === dialogRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={dialogRef}
        className={`${isFullscreen ? 'max-w-full h-screen w-screen rounded-none' : 'max-w-4xl h-[80vh] w-[90vw] sm:rounded-2xl'} p-0 bg-background overflow-hidden transition-all`}
      >
        <div className="flex flex-col relative">
          <div className="p-4 border-b border-border flex items-center justify-between gap-3">
            <h3 className="font-medium text-foreground truncate">
              {title || "Video Player"}
            </h3>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="aspect-video bg-black">
            {youtubeEmbedUrl ? (
              <iframe
                src={youtubeEmbedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
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
                aria-label={aiOpen ? "Close AI studio" : "Open AI studio"}
                aria-pressed={aiOpen}
                title={aiOpen ? "Close AI studio" : "Open AI studio"}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-semibold tracking-wide [writing-mode:vertical-rl] rotate-180">
                  AI Studio
                </span>
              </button>

              <div
                className={`absolute top-0 right-0 h-full w-full sm:w-[360px] bg-background border-l border-border/60 shadow-xl z-30 transition-transform duration-200 ${aiOpen ? "translate-x-0" : "translate-x-full"}`}
              >
                <div className="h-full overflow-y-auto p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Studio</div>
                    <button
                      type="button"
                      onClick={() => setAiOpen(false)}
                      className="rounded-sm opacity-70 hover:opacity-100 transition"
                      aria-label="Close AI studio"
                      title="Close AI studio"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <AIStudyTools resourceId={resourceId} resourceTitle={title} resourceType="video" />
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
