import { ExternalLink, Maximize2, Minimize2, Sparkles, Video } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import AIStudyTools from "./ai/AIStudyTools";
import { useCallback, useEffect, useRef, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { getResourceVideoTopics, type VideoTopic } from "@/lib/api";
import {
  getYouTubeBrowserUrl,
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
  openYouTubeInApp
} from "@/lib/youtube";
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
  const [showAiStudio, setShowAiStudio] = useState(false);
  const [topics, setTopics] = useState<VideoTopic[]>([]);
  const [topicsStatus, setTopicsStatus] = useState<"idle" | "loading" | "ready" | "empty" | "error">("idle");
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [startSeconds, setStartSeconds] = useState<number | null>(null);
  const [embedKey, setEmbedKey] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isStacked = useMediaQuery("(max-width: 1024px)");

  useEffect(() => {
    if (!isOpen && document.fullscreenElement === dialogRef.current) {
      document.exitFullscreen().catch(() => {
        // Ignore if document is not active
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setShowAiStudio(false);
      setStartSeconds(null);
      setEmbedKey(0);
    }
  }, [isOpen, resourceId]);

  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl, {
    autoplay: true,
    muted: true,
    startSeconds: typeof startSeconds === "number" ? startSeconds : undefined
  });
  const isLikelyYouTube = /(?:youtu\.be|youtube\.com|youtube-nocookie\.com)/i.test(videoUrl);

  useEffect(() => {
    if (!isOpen || !resourceId || !isLikelyYouTube) {
      setTopics([]);
      setTopicsStatus(isOpen ? "empty" : "idle");
      setTopicsError(null);
      return;
    }

    let cancelled = false;
    setTopicsStatus("loading");
    setTopicsError(null);

    getResourceVideoTopics(resourceId)
      .then((result) => {
        if (cancelled) return;
        const nextTopics = result.topics || [];
        setTopics(nextTopics);
        setTopicsStatus(nextTopics.length > 0 ? "ready" : "empty");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setTopics([]);
        setTopicsStatus("error");
        const message = error instanceof Error ? error.message : "Unable to load topics";
        setTopicsError(message);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, resourceId, isLikelyYouTube]);

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

  const handleOpenYoutubeApp = useCallback(() => {
    if (!isLikelyYouTube) return;
    openYouTubeInApp(videoUrl, {
      startSeconds: typeof startSeconds === "number" ? startSeconds : undefined,
      fallbackToWatch: true
    });
  }, [isLikelyYouTube, videoUrl, startSeconds]);

  const handleOpenYoutubeBrowser = useCallback(() => {
    if (!isLikelyYouTube) return;
    const url =
      getYouTubeWatchUrl(videoUrl, { startSeconds: typeof startSeconds === "number" ? startSeconds : undefined }) ||
      getYouTubeBrowserUrl(videoUrl, { startSeconds: typeof startSeconds === "number" ? startSeconds : undefined }) ||
      videoUrl;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [isLikelyYouTube, videoUrl, startSeconds]);

  const handleTopicJump = useCallback((topic: VideoTopic) => {
    setStartSeconds(topic.startSeconds);
    setEmbedKey((prev) => prev + 1);
  }, []);

  const topicsBody = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Video className="h-3.5 w-3.5" />
          Topics covered
        </div>
        {resourceId && (
          <button
            type="button"
            onClick={() => setShowAiStudio((prev) => !prev)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition",
              showAiStudio
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {showAiStudio ? "Hide AI Studio" : "Open AI Studio"}
          </button>
        )}
      </div>

      {topicsStatus === "loading" && (
        <div className="text-xs text-muted-foreground">Loading video topics...</div>
      )}
      {topicsStatus === "error" && (
        <div className="text-xs text-destructive">
          {topicsError || "Unable to load video topics right now."}
        </div>
      )}
      {topicsStatus === "empty" && (
        <div className="text-xs text-muted-foreground">
          Topics will appear after the video is indexed by AI.
        </div>
      )}

      {topicsStatus === "ready" && (
        <ScrollArea className="max-h-44 pr-2">
          <div className="space-y-2">
            {topics.map((topic) => (
              <button
                key={`${topic.startSeconds}-${topic.label}`}
                type="button"
                onClick={() => handleTopicJump(topic)}
                className="w-full rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-background"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-muted-foreground">{topic.timestamp}</span>
                  <span className="text-xs font-semibold text-foreground">Jump</span>
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">{topic.label}</div>
                {topic.preview && (
                  <div className="mt-1 text-xs text-muted-foreground">{topic.preview}</div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  const videoContent = (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-foreground truncate">
            {title || "Video Player"}
          </h3>
          {isLikelyYouTube && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={handleOpenYoutubeApp}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground/80 transition hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Open in YouTube app
              </button>
              <button
                type="button"
                onClick={handleOpenYoutubeBrowser}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground/80 transition hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Open in browser
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
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
      </div>
      
      <div className="flex-1 bg-black">
        {youtubeEmbedUrl ? (
          <iframe
            key={`${embedKey}-${youtubeEmbedUrl}`}
            src={youtubeEmbedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
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
      <div className="border-t border-border bg-card/40 px-4 py-3">
        {isLikelyYouTube ? topicsBody : (
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Topics are available for YouTube videos.
            </div>
            {resourceId && (
              <button
                type="button"
                onClick={() => setShowAiStudio((prev) => !prev)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition",
                  showAiStudio
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {showAiStudio ? "Hide AI Studio" : "Open AI Studio"}
              </button>
            )}
          </div>
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
        <DialogTitle className="sr-only">{title || "Video player"}</DialogTitle>
        {resourceId && showAiStudio ? (
          <ResizablePanelGroup direction={isStacked ? "vertical" : "horizontal"} className="h-full">
            <ResizablePanel
              defaultSize={isStacked ? 58 : 60}
              minSize={isStacked ? 35 : 40}
              className={cn(isStacked ? "min-h-[320px]" : "min-w-[320px]")}
            >
              {videoContent}
            </ResizablePanel>
            <ResizableHandle withHandle className={cn(isStacked ? "h-2" : "")} />
            <ResizablePanel
              defaultSize={isStacked ? 42 : 40}
              minSize={isStacked ? 25 : 25}
              className={cn("bg-background", isStacked ? "min-h-[260px]" : "min-w-[360px]")}
            >
              <div
                className={cn(
                  "flex h-full flex-col bg-background",
                  isStacked ? "border-t border-border/60" : "border-l border-border/60"
                )}
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-card/70">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <div className="text-sm font-semibold text-foreground">AI Studio</div>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 h-full">
                    <AIStudyTools
                      resourceId={resourceId}
                      resourceTitle={title}
                      resourceType="video"
                      videoUrl={videoUrl}
                      className="h-full"
                    />
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
