import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from "react-pdf";
import { cn } from "@/lib/utils";

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configure worker for Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
}

const PDFViewer = ({ isOpen, onClose, title, pdfUrl }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0); // Start smaller to fit
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  // Reset state when opening new PDF
  useEffect(() => {
    if (isOpen) {
      setPageNumber(1);
      setScale(1.0);
      setLoading(true);
      setError(null);
    }
  }, [isOpen, pdfUrl]);

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

  const goToNextPage = useCallback(() => {
    if (pageNumber < numPages && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setPageNumber((prev) => prev + 1);
        setTimeout(() => setIsFlipping(false), 100);
      }, 300);
    }
  }, [pageNumber, numPages, isFlipping]);

  const goToPrevPage = useCallback(() => {
    if (pageNumber > 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setPageNumber((prev) => prev - 1);
        setTimeout(() => setIsFlipping(false), 100);
      }, 300);
    }
  }, [pageNumber, isFlipping]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        goToPrevPage();
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        goToNextPage();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, onClose, goToPrevPage, goToNextPage]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b flex-shrink-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <DialogTitle className="text-lg font-semibold truncate flex-1 min-w-0" title={title}>
              {title}
            </DialogTitle>

            {/* Controls in Header */}
            <div className="flex items-center gap-2 hidden md:flex">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1 || loading}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm min-w-[3rem] text-center">
                {loading ? '...' : `${pageNumber} / ${numPages}`}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextPage}
                disabled={pageNumber >= numPages || loading}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-2" />

              <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={scale <= 0.5} className="h-8 w-8">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={scale >= 3} className="h-8 w-8">
                <ZoomIn className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-2" />

              <Button variant="ghost" size="icon" onClick={handleDownload} title="Download" className="h-8 w-8">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-sm opacity-70 hover:opacity-100 ring-offset-background ml-4"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-zinc-900 p-4 relative flex justify-center pdf-viewer-wrapper">
          {/* Isolation Wrapper for PDF */}
          <div className="pdf-viewer-isolation-layer bg-white text-black min-h-full shadow-lg">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-gray-500">Loading Document...</p>
                </div>
              }
              className="flex flex-col items-center"
            >
              <div
                className={cn(
                  "transition-all duration-300 ease-in-out origin-top",
                  isFlipping ? "opacity-50 scale-95" : "opacity-100 scale-100"
                )}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  loading={
                    <div className="h-[600px] w-[400px] bg-white flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  }
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </div>
            </Document>
          </div>

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Controls Footer */}
        <div className="p-4 border-t bg-background md:hidden flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {pageNumber} / {numPages || '-'}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextPage} disabled={pageNumber >= numPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={scale >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;