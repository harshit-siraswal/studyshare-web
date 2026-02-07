import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, X } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import DocumentViewer from "./DocumentViewer";
import AIStudyTools from "./ai/AIStudyTools";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

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
  const [aiOpen, setAiOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Update display URL when pdfUrl changes
  useEffect(() => {
    setDisplayUrl(pdfUrl);
  }, [pdfUrl]);

  useEffect(() => {
    if (!isOpen) {
      setAiOpen(false);
    }
  }, [isOpen]);

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
      void document.exitFullscreen();
    }
  }, [isOpen]);

  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
    }
    return null;
  };

  const youtubeEmbedUrl = useMemo(() => {
    if (!videoUrl) return null;
    return getYouTubeEmbedUrl(videoUrl);
  }, [videoUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={dialogRef}
        className={`${isFullscreen ? 'max-w-full h-screen w-screen rounded-none' : 'max-w-7xl h-[95vh]'} p-0 flex flex-col [&>button]:hidden transition-all`}
      >
        <DialogHeader className="p-4 border-b flex-shrink-0 bg-background">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate">{title}</DialogTitle>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>

        {/* Document Viewer (PDF / DOCX / ODF / PPTX) + AI Panel */}
        <div className="flex-1 overflow-hidden relative">
          <div className="h-full">
            {videoUrl ? (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={65} minSize={35} className="min-w-[320px]">
                  <DocumentViewer
                    url={displayUrl}
                    title={title}
                    fullscreenTargetRef={dialogRef}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={35} minSize={25} className="min-w-[260px]">
                  <div className="flex h-full flex-col bg-black">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background">
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
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <DocumentViewer
                url={displayUrl}
                title={title}
                fullscreenTargetRef={dialogRef}
              />
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

export default PDFViewer;
