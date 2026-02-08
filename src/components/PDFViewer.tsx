import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, X } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import DocumentViewer from "./DocumentViewer";
import AIStudyTools from "./ai/AIStudyTools";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
  videoUrl?: string;
  resourceId?: string;
}

const PDFViewer = ({ isOpen, onClose, title, pdfUrl, videoUrl, resourceId }: PDFViewerProps) => {
  const [displayUrl, setDisplayUrl] = useState(pdfUrl);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAiStudio, setShowAiStudio] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isStacked = useMediaQuery("(max-width: 1024px)");

  // Update display URL when pdfUrl changes
  useEffect(() => {
    setDisplayUrl(pdfUrl);
  }, [pdfUrl]);

  // Listen for fullscreen changes on this dialog
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

  useEffect(() => {
    if (!isOpen && document.fullscreenElement === dialogRef.current) {
      document.exitFullscreen().catch(() => {
        // Ignore if document is not active
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setShowAiStudio(true);
    }
  }, [isOpen, resourceId]);

  const youtubeEmbedUrl = useMemo(() => {
    if (!videoUrl) return null;
    return getYouTubeEmbedUrl(videoUrl, { autoplay: true, muted: true });
  }, [videoUrl]);
  const isLikelyYouTube = useMemo(() => {
    if (!videoUrl) return false;
    return /(?:youtu\.be|youtube\.com|youtube-nocookie\.com)/i.test(videoUrl);
  }, [videoUrl]);

  const mainContent = videoUrl ? (
    <ResizablePanelGroup direction={isStacked ? "vertical" : "horizontal"} className="h-full">
      <ResizablePanel
        defaultSize={isStacked ? 60 : 65}
        minSize={isStacked ? 35 : 35}
        className={cn(isStacked ? "min-h-[280px]" : "min-w-[320px]")}
      >
        <DocumentViewer
          url={displayUrl}
          title={title}
          fullscreenTargetRef={dialogRef}
        />
      </ResizablePanel>
      <ResizableHandle withHandle className={cn(isStacked ? "h-2" : "")} />
      <ResizablePanel
        defaultSize={isStacked ? 40 : 35}
        minSize={isStacked ? 25 : 25}
        className={cn(isStacked ? "min-h-[220px]" : "min-w-[260px]")}
      >
        <div className="flex h-full flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Video</span>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={title}>
              {title}
            </span>
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
      </ResizablePanel>
    </ResizablePanelGroup>
  ) : (
    <DocumentViewer
      url={displayUrl}
      title={title}
      fullscreenTargetRef={dialogRef}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={dialogRef}
        className={`${isFullscreen ? 'max-w-full h-screen w-screen rounded-none' : 'max-w-7xl h-[90vh] w-[94vw] sm:rounded-2xl'} p-0 flex flex-col [&>button]:hidden transition-all`}
      >
        <DialogHeader className="p-4 border-b flex-shrink-0 bg-background">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg font-semibold truncate">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              {resourceId && (
                <button
                  onClick={() => setShowAiStudio((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                  title={showAiStudio ? "Hide AI Studio" : "Show AI Studio"}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {showAiStudio ? "Hide AI" : "Show AI"}
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Document Viewer (PDF / DOCX / ODF / PPTX) + AI Panel */}
        <div className="flex-1 overflow-hidden relative">
          {resourceId && showAiStudio ? (
            <ResizablePanelGroup direction={isStacked ? "vertical" : "horizontal"} className="h-full">
              <ResizablePanel
                defaultSize={isStacked ? 62 : 68}
                minSize={isStacked ? 35 : 40}
                className={cn(isStacked ? "min-h-[320px]" : "min-w-[320px]")}
              >
                {mainContent}
              </ResizablePanel>
              <ResizableHandle withHandle className={cn(isStacked ? "h-2" : "")} />
              <ResizablePanel
                defaultSize={isStacked ? 38 : 32}
                minSize={isStacked ? 25 : 25}
                className={cn("bg-background", isStacked ? "min-h-[260px]" : "min-w-[320px]")}
              >
                <div
                  className={cn(
                    "flex h-full flex-col bg-gradient-to-b from-background via-background/95 to-emerald-500/8 dark:to-emerald-500/5",
                    isStacked ? "border-t border-border/60" : "border-l border-border/60"
                  )}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-gradient-to-r from-emerald-500/12 via-white/80 to-white dark:from-emerald-400/10 dark:via-background/80 dark:to-background">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 dark:bg-emerald-400/15 dark:ring-emerald-400/30">
                        <Sparkles className="h-4 w-4 text-emerald-700 dark:text-emerald-200" />
                      </span>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700/80 dark:text-emerald-100/80">
                          AI Studio
                        </div>
                        <div className="text-[11px] text-emerald-700/60 dark:text-emerald-100/60">
                          Summaries, quizzes, flashcards.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAiStudio(false)}
                      className="rounded-full p-1 text-emerald-700/70 transition hover:text-emerald-900 dark:text-emerald-100/70 dark:hover:text-emerald-100"
                      title="Hide AI Studio"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4">
                      <AIStudyTools
                        resourceId={resourceId}
                        resourceTitle={title}
                        resourceType={videoUrl ? "video" : "notes"}
                        videoUrl={videoUrl}
                      />
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="h-full">{mainContent}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;
