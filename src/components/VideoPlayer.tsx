import { Maximize2, Minimize2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AIStudyTools from "./ai/AIStudyTools";
import { useCallback, useEffect, useRef, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

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
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={dialogRef}
        className={`${isFullscreen ? 'max-w-full h-screen w-screen rounded-none' : 'max-w-4xl h-[80vh] w-[90vw] sm:rounded-2xl'} p-0 bg-background overflow-hidden transition-all`}
      >
        {resourceId ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={68} minSize={40} className="min-w-[320px]">
              {videoContent}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={32} minSize={25} className="min-w-[320px] bg-background">
              <div className="h-full overflow-y-auto p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Studio</div>
                </div>
                <AIStudyTools resourceId={resourceId} resourceTitle={title} resourceType="video" />
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
