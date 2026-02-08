import { Maximize2, Minimize2, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import AIStudyTools from "./ai/AIStudyTools";
import { useCallback, useEffect, useRef, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
  resourceId?: string;
}

const VideoPlayer = ({ isOpen, onClose, videoUrl, title, resourceId }: VideoPlayerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isStacked = useMediaQuery("(max-width: 1024px)");

  useEffect(() => {
    if (!isOpen && document.fullscreenElement === dialogRef.current) {
      document.exitFullscreen().catch(() => {
        // Ignore if document is not active
      });
    }
  }, [isOpen]);

  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl, { autoplay: true, muted: true });
  const isLikelyYouTube = /(?:youtu\.be|youtube\.com|youtube-nocookie\.com)/i.test(videoUrl);

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

  const videoContent = (
    <div className="flex h-full flex-col">
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
      
      <div className="flex-1 bg-black">
        {youtubeEmbedUrl ? (
          <iframe
            src={youtubeEmbedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title={title || "Video"}
            loading="lazy"
          />
        ) : isLikelyYouTube ? (
          <div className="flex h-full w-full items-center justify-center p-6 text-center">
            <div className="max-w-sm space-y-2">
              <p className="text-sm font-medium text-white/90">This YouTube link can’t be embedded.</p>
              <p className="text-xs text-white/60">Open it in a new tab (or replace the link with a direct video URL).</p>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/15"
              >
                Open on YouTube
              </a>
            </div>
          </div>
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
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={dialogRef}
        className={`${isFullscreen ? 'max-w-full h-screen w-screen rounded-none' : 'max-w-6xl h-[85vh] w-[94vw] sm:rounded-2xl'} p-0 bg-background overflow-hidden transition-all`}
      >
        {resourceId ? (
          <ResizablePanelGroup direction={isStacked ? "vertical" : "horizontal"} className="h-full">
            <ResizablePanel
              defaultSize={isStacked ? 62 : 68}
              minSize={isStacked ? 35 : 40}
              className={cn(isStacked ? "min-h-[320px]" : "min-w-[320px]")}
            >
              {videoContent}
            </ResizablePanel>
            <ResizableHandle withHandle className={cn(isStacked ? "h-2" : "")} />
            <ResizablePanel
              defaultSize={isStacked ? 38 : 32}
              minSize={isStacked ? 25 : 25}
              className={cn("bg-background", isStacked ? "min-h-[260px]" : "min-w-[320px]")}
            >
              <div
                className={cn(
                  "flex h-full flex-col bg-gradient-to-b from-background via-background/95 to-card/20",
                  isStacked ? "border-t border-border/60" : "border-l border-border/60"
                )}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </span>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        AI Studio
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Summaries, quizzes, flashcards.
                      </div>
                    </div>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <AIStudyTools resourceId={resourceId} resourceTitle={title} resourceType="video" />
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          videoContent
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayer;
