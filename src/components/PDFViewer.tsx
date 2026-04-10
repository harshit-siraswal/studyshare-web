import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, X, SlidersHorizontal, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef, useMemo, type CSSProperties } from "react";
import DocumentViewer from "./DocumentViewer";
import AIStudyTools from "./ai/AIStudyTools";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
  videoUrl?: string;
  resourceId?: string;
}

const PDF_VIEWER_SIZE_STORAGE_KEY = "studyspace.pdfViewer.scale.v1";
const DEFAULT_VIEWER_SCALE = 1;
const MIN_VIEWER_SCALE = 0.75;
const MAX_VIEWER_SCALE = 1.4;

const clampViewerScale = (value: number) => Math.max(MIN_VIEWER_SCALE, Math.min(MAX_VIEWER_SCALE, value));

const PDFViewer = ({ isOpen, onClose, title, pdfUrl, videoUrl, resourceId }: PDFViewerProps) => {
  const [displayUrl, setDisplayUrl] = useState(pdfUrl);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAiStudio, setShowAiStudio] = useState(false);
  const [viewerScale, setViewerScale] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_VIEWER_SCALE;
    }
    try {
      const savedScale = Number(window.localStorage.getItem(PDF_VIEWER_SIZE_STORAGE_KEY));
      if (!Number.isFinite(savedScale)) {
        return DEFAULT_VIEWER_SCALE;
      }
      return clampViewerScale(savedScale);
    } catch {
      return DEFAULT_VIEWER_SCALE;
    }
  });
  const dialogRef = useRef<HTMLDivElement>(null);
  const isStacked = useMediaQuery("(max-width: 1024px)");

  // Update display URL when pdfUrl changes
  useEffect(() => {
    setDisplayUrl(pdfUrl);
  }, [pdfUrl]);

  // Listen for fullscreen changes on this dialog
  useEffect(() => {
    const handleFullscreenChange = () => {
      const target = dialogRef.current;
      setIsFullscreen(!!target && document.fullscreenElement === target);
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
    if (!isOpen) {
      setIsFullscreen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setShowAiStudio(false);
    }
  }, [isOpen, resourceId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(PDF_VIEWER_SIZE_STORAGE_KEY, String(viewerScale));
    } catch {
      // Ignore when storage is unavailable.
    }
  }, [viewerScale]);

  const youtubeEmbedUrl = useMemo(() => {
    if (!videoUrl) return null;
    return getYouTubeEmbedUrl(videoUrl, { autoplay: true, muted: true });
  }, [videoUrl]);
  const isLikelyYouTube = useMemo(() => {
    if (!videoUrl) return false;
    return /(?:youtu\.be|youtube\.com|youtube-nocookie\.com)/i.test(videoUrl);
  }, [videoUrl]);
  const viewerScalePercent = Math.round(viewerScale * 100);
  const viewerBaseDimensions = useMemo(
    () => (showAiStudio ? { width: 1240, height: 820 } : { width: 920, height: 620 }),
    [showAiStudio]
  );
  const scaledViewerDimensions = useMemo(
    () => ({
      width: Math.round(viewerBaseDimensions.width * viewerScale),
      height: Math.round(viewerBaseDimensions.height * viewerScale),
    }),
    [viewerBaseDimensions, viewerScale]
  );
  const dialogStyle = useMemo<CSSProperties | undefined>(() => {
    if (isFullscreen) {
      return undefined;
    }
    return {
      width: `min(${scaledViewerDimensions.width}px, ${isStacked ? "96vw" : "92vw"})`,
      height: `min(${scaledViewerDimensions.height}px, ${isStacked ? "92vh" : "88vh"})`,
    };
  }, [isFullscreen, scaledViewerDimensions, isStacked]);

  const handleViewerScaleChange = (value: number[]) => {
    const nextScale = value[0];
    if (typeof nextScale !== "number") {
      return;
    }
    setViewerScale(clampViewerScale(nextScale / 100));
  };

  const resetViewerScale = () => {
    setViewerScale(DEFAULT_VIEWER_SCALE);
  };

  const aiToggleButton = resourceId ? (
    <button
      onClick={() => setShowAiStudio((prev) => !prev)}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
      title={showAiStudio ? "Hide AI Studio" : "Show AI Studio"}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {showAiStudio ? "Hide AI" : "AI Studio"}
    </button>
  ) : null;

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
          toolbarActions={aiToggleButton}
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
      toolbarActions={aiToggleButton}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={dialogRef}
        style={dialogStyle}
        className={cn(
          isFullscreen
            ? '!left-0 !top-0 !translate-x-0 !translate-y-0 !max-w-none !h-screen !w-screen !rounded-none border-0'
            : 'max-w-none rounded-2xl',
          'pdf-viewer-dialog p-0 flex flex-col [&>button]:hidden overflow-hidden transition-[width,height,border-radius] duration-300 ease-out will-change-[opacity,filter,transform,width,height,border-radius] data-[state=open]:!animate-none data-[state=closed]:!animate-none'
        )}
      >
        <DialogHeader className="p-4 border-b flex-shrink-0 bg-background">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg font-semibold truncate">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              {!isFullscreen && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 px-2.5 text-xs"
                      title="Customize viewer size"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{viewerScalePercent}%</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Viewer size</p>
                      <p className="text-xs text-muted-foreground">
                        Resize the PDF/resource viewer to your preferred size.
                      </p>
                    </div>
                    <Slider
                      min={Math.round(MIN_VIEWER_SCALE * 100)}
                      max={Math.round(MAX_VIEWER_SCALE * 100)}
                      step={1}
                      value={[viewerScalePercent]}
                      onValueChange={handleViewerScaleChange}
                      aria-label="PDF viewer size"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{viewerScalePercent}%</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={resetViewerScale}
                        disabled={viewerScalePercent === Math.round(DEFAULT_VIEWER_SCALE * 100)}
                      >
                        <RotateCcw className="mr-1 h-3.5 w-3.5" />
                        Reset
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
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
        <div className="pdf-viewer-body flex-1 overflow-hidden relative">
          {resourceId && showAiStudio ? (
            <ResizablePanelGroup direction={isStacked ? "vertical" : "horizontal"} className="h-full">
              <ResizablePanel
                defaultSize={isStacked ? 58 : 60}
                minSize={isStacked ? 35 : 40}
                className={cn(isStacked ? "min-h-[320px]" : "min-w-[320px]")}
              >
                {mainContent}
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
                    <button
                      onClick={() => setShowAiStudio(false)}
                      className="rounded-full p-1 text-muted-foreground transition hover:text-foreground"
                      title="Hide AI Studio"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 h-full">
                      <AIStudyTools
                        resourceId={resourceId}
                        resourceTitle={title}
                        resourceType={videoUrl ? "video" : "notes"}
                        videoUrl={videoUrl}
                        className="h-full"
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
