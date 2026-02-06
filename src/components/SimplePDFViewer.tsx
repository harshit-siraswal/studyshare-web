import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ExternalLink, Maximize2, Minimize2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface SimplePDFViewerProps {
  pdfUrl: string;
  title: string;
  onDownload: () => void;
  onOpenInNewTab?: () => void;
}

const SimplePDFViewer = ({ pdfUrl, title, onDownload, onOpenInNewTab }: SimplePDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Toggle fullscreen
  const toggleFullscreen = async () => {
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
  };

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

  // Load PDF.js library
  useEffect(() => {
    const loadPDFJS = async () => {
      if (window.pdfjsLib) {
        initializePDF();
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          initializePDF();
        };
        script.onerror = () => {
          setError('Failed to load PDF.js library');
          setLoading(false);
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error('Error loading PDF.js:', err);
        setError('Failed to load PDF viewer');
        setLoading(false);
      }
    };

    loadPDFJS();
  }, [pdfUrl]);

  const initializePDF = async () => {
    if (!window.pdfjsLib) return;

    try {
      setLoading(true);
      setError(null);

      const loadingTask = window.pdfjsLib.getDocument({
        url: pdfUrl,
        withCredentials: false,
      });

      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;
      setNumPages(pdf.numPages);
      setLoading(false);

      // Render first page immediately
      renderPage(1);
    } catch (err: any) {
      console.error('PDF load error:', err);
      setError(err.message || 'Failed to load PDF. Please try again.');
      setLoading(false);
    }
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDocRef.current || renderedPages.has(pageNum)) return;

    try {
      const pdf = pdfDocRef.current;
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRefs.current.get(pageNum);

      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      // Calculate scale based on container width
      const containerWidth = scrollContainerRef.current?.clientWidth || 800;
      const viewport = page.getViewport({ scale: 1.5 });
      const scale = (containerWidth - 48) / viewport.width;
      const scaledViewport = page.getViewport({ scale: scale * 1.5 });

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };

      await page.render(renderContext).promise;
      setRenderedPages(prev => new Set([...prev, pageNum]));
    } catch (err) {
      console.error(`Page ${pageNum} render error:`, err);
    }
  };

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (!pdfDocRef.current || loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page') || '0');
            if (pageNum > 0) {
              renderPage(pageNum);
            }
          }
        });
      },
      { rootMargin: '500px' }
    );

    // Observe all page containers
    const pageContainers = scrollContainerRef.current?.querySelectorAll('[data-page]');
    pageContainers?.forEach(container => {
      observerRef.current?.observe(container);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading, numPages]);

  // Track current page based on scroll position
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollPosition = container.scrollTop + container.clientHeight / 2;
      const pageContainers = container.querySelectorAll('[data-page]');

      let newCurrentPage = 1;
      pageContainers.forEach((el) => {
        const pageNum = parseInt(el.getAttribute('data-page') || '0');
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        if (rect.top <= containerRect.top + containerRect.height / 2) {
          newCurrentPage = pageNum;
        }
      });

      setCurrentPage(newCurrentPage);
    };

    const container = scrollContainerRef.current;
    container.addEventListener('scroll', handleScroll);

    return () => container.removeEventListener('scroll', handleScroll);
  }, [numPages]);

  const scrollToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= numPages) {
      const pageElement = scrollContainerRef.current?.querySelector(`[data-page="${pageNum}"]`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToPage(currentPage + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToPage(currentPage - 1);
      } else if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages]);

  // Check component type based on URL
  const isOfficeDoc = (url: string) => {
    const lower = url.toLowerCase();
    return lower.includes('.doc') ||
      lower.includes('.docx') ||
      lower.includes('.ppt') ||
      lower.includes('.pptx') ||
      lower.includes('.xls') ||
      lower.includes('.xlsx');
  };

  const isPDF = !isOfficeDoc(pdfUrl);

  if (error && isPDF) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={initializePDF}>Retry</Button>
        </div>
      </div>
    );
  }

  // Render Google Docs Viewer for Office files
  if (isOfficeDoc(pdfUrl)) {
    const encodedUrl = encodeURIComponent(pdfUrl);
    const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodedUrl}`;

    return (
      <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
        {/* Controls Bar */}
        <div className="flex items-center justify-between p-3 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Document Preview
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInNewTab && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenInNewTab}
                className="hidden sm:flex"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
            )}
            <Button variant="default" size="sm" onClick={onDownload}>
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 w-full h-full relative">
          <iframe
            src={googleDocsUrl}
            className="w-full h-full border-none"
            title="Document Viewer"
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Controls Bar */}
      <div className="flex items-center justify-between p-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {loading ? 'Loading...' : `Page ${currentPage} of ${numPages}`}
          </span>
          {!loading && (
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => scrollToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronUp className="w-4 h-4 mr-1" />
                Prev
              </Button>
              <input
                type="number"
                min={1}
                max={numPages}
                value={currentPage}
                onChange={(e) => scrollToPage(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 text-sm border rounded text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={currentPage >= numPages}
              >
                Next
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen (Ctrl+F)"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          {onOpenInNewTab && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenInNewTab}
              className="hidden sm:flex"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </Button>
          )}
          <Button variant="default" size="sm" onClick={onDownload}>
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      {/* PDF Viewer Area - Scrollable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading PDF...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                data-page={pageNum}
                className="bg-white shadow-lg"
                style={{ minHeight: '400px' }}
              >
                <canvas
                  ref={(el) => {
                    if (el) canvasRefs.current.set(pageNum, el);
                  }}
                  className="max-w-full h-auto"
                />
                {!renderedPages.has(pageNum) && (
                  <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scroll hint */}
      {!loading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-xs pointer-events-none sm:hidden">
          Scroll to navigate
        </div>
      )}
    </div>
  );
};

export default SimplePDFViewer;