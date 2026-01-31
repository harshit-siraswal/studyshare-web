import { useState, useEffect, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Maximize2, Minimize2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface CustomPDFViewerProps {
  pdfUrl: string;
  title?: string;
}

const CustomPDFViewer = ({ pdfUrl, title }: CustomPDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF document
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    setError("Failed to load PDF. Please try again.");
    setLoading(false);
  };

  // Navigate to next page
  const goToNextPage = useCallback(() => {
    if (pageNumber < numPages) {
      setPageNumber((prev) => prev + 1);
    }
  }, [pageNumber, numPages]);

  // Navigate to previous page
  const goToPrevPage = useCallback(() => {
    if (pageNumber > 1) {
      setPageNumber((prev) => prev - 1);
    }
  }, [pageNumber]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Create a more precise check to avoid capturing inputs if user is typing
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowLeft") {
        goToPrevPage();
      } else if (e.key === "ArrowRight") {
        goToNextPage();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [goToPrevPage, goToNextPage]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  // Custom text renderer to highlight search terms
  // Note: standard browser Ctrl+F works better with the TextLayer enabled, which is default.
  // We can also add a helper hint.

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-background relative">
      {/* Controls Bar */}
      <div className="flex items-center justify-between p-2 md:p-3 border-b bg-background/95 backdrop-blur z-10 shrink-0 gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium whitespace-nowrap min-w-[80px] text-center">
            {pageNumber} / {numPages || "--"}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border rounded-md px-1 bg-muted/20">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs min-w-[3rem] text-center font-mono">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomIn}
              disabled={scale >= 3}
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          {/* Search Hint */}
          <div className="hidden md:flex items-center text-xs text-muted-foreground ml-2 bg-muted/30 px-2 py-1 rounded">
            <Search className="h-3 w-3 mr-1" />
            <span>Ctrl+F to find</span>
          </div>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900/50 p-4 md:p-8 flex justify-center">
        <div className="relative shadow-xl">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading PDF...</p>
              </div>
            }
            className="flex flex-col items-center"
          >
            <div className="bg-white dark:bg-white text-black transition-transform duration-200 ease-out origin-top border border-border/10">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-sm"
                loading={
                  <div className="flex items-center justify-center w-[600px] h-[800px] bg-white">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                }
                error={
                  <div className="flex items-center justify-center w-full h-[400px] bg-white text-red-500 p-4 text-center">
                    Failed to render page.
                  </div>
                }
              />
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
};

export default CustomPDFViewer;

