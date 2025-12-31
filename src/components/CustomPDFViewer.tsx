import { useState, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Set up PDF.js worker
// Using the version that react-pdf expects (5.4.296) for compatibility
if (typeof window !== 'undefined') {
  // Try using the exact version from react-pdf's dependency first
  const reactPdfVersion = '5.4.296'; // Version that react-pdf@10.2.0 uses
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${reactPdfVersion}/build/pdf.worker.min.js`;
}

interface CustomPDFViewerProps {
  pdfUrl: string;
  title: string;
  onDownload: () => void;
}

const CustomPDFViewer = ({ pdfUrl, title, onDownload }: CustomPDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

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

  // Navigate to next page with flip animation
  const goToNextPage = useCallback(() => {
    if (pageNumber < numPages && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setPageNumber((prev) => prev + 1);
        setTimeout(() => setIsFlipping(false), 100);
      }, 400);
    }
  }, [pageNumber, numPages, isFlipping]);

  // Navigate to previous page with flip animation
  const goToPrevPage = useCallback(() => {
    if (pageNumber > 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setPageNumber((prev) => prev - 1);
        setTimeout(() => setIsFlipping(false), 100);
      }, 400);
    }
  }, [pageNumber, isFlipping]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevPage();
      } else if (e.key === "ArrowRight") {
        goToNextPage();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [goToPrevPage, goToNextPage]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

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
    <div className="flex flex-col h-full">
      {/* Controls Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1 || isFlipping}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium min-w-[100px] text-center">
            Page {pageNumber} of {numPages || "..."}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages || isFlipping}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="px-2 text-sm min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleZoomIn}
              disabled={scale >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Download Button */}
          <Button variant="default" size="sm" onClick={onDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900 p-8">
        <div className="flex justify-center items-start min-h-full">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          )}

          <div
            className="relative"
            style={{
              perspective: "1200px",
              perspectiveOrigin: "center center",
            }}
          >
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Loading PDF...</p>
                </div>
              }
            >
              {/* Book-like page container with flip animation */}
              <div
                className={cn(
                  "relative transition-all duration-500 ease-in-out",
                  isFlipping && "page-flip-animation"
                )}
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="bg-white shadow-2xl overflow-hidden"
                  style={{
                    boxShadow: "0 25px 70px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)",
                    borderRadius: "2px",
                    transform: isFlipping ? "rotateY(-15deg) scale(0.98)" : "rotateY(0deg) scale(1)",
                    transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="border-0"
                    loading={
                      <div className="flex items-center justify-center h-full min-h-[600px]">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    }
                  />
                </div>
              </div>
            </Document>
          </div>
        </div>
      </div>

      {/* Page Navigation Hints */}
      <div className="p-2 border-t bg-background/95 backdrop-blur text-center">
        <p className="text-xs text-muted-foreground">
          Use arrow keys or buttons to navigate • Click outside to close
        </p>
      </div>
    </div>
  );
};

export default CustomPDFViewer;

