import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
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
  const dialogRef = useRef<HTMLDivElement>(null);

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

  const mainContent = videoUrl ? (
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
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={dialogRef}
        className={`${isFullscreen ? 'max-w-full h-screen w-screen rounded-none' : 'max-w-6xl h-[88vh] w-[92vw] sm:rounded-2xl'} p-0 flex flex-col [&>button]:hidden transition-all`}
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
          {resourceId ? (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={68} minSize={40} className="min-w-[320px]">
                {mainContent}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={32} minSize={25} className="min-w-[320px] bg-background">
                <div className="h-full overflow-y-auto p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Studio</div>
                  </div>
                  <AIStudyTools
                    resourceId={resourceId}
                    resourceTitle={title}
                    resourceType={videoUrl ? "video" : "notes"}
                  />
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
