import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Maximize2, Minimize2, Search, Moon, Sun, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface CustomPDFViewerProps {
  pdfUrl: string;
  title?: string;
}

// Helper for text matches
interface SearchMatch {
  pageIndex: number; // 0-based
  itemIndex: number; // Index in the text items array
  matchIndex: number; // Index of the search term in the string
}

const CustomPDFViewer = ({ pdfUrl, title }: CustomPDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState(false);

  // PDF Document Proxy
  const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Load PDF document
  const onDocumentLoadSuccess = (pdf: pdfjs.PDFDocumentProxy) => {
    setNumPages(pdf.numPages);
    setPdfDocument(pdf);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    setError("Failed to load PDF. Please try again.");
    setLoading(false);
  };

  // Search Functionality
  const performSearch = useCallback(async () => {
    if (!pdfDocument || !searchQuery.trim()) {
      setSearchResults([]);
      setCurrentMatchIndex(-1);
      return;
    }

    setIsSearching(true);
    const results: SearchMatch[] = [];
    const normalizedQuery = searchQuery.toLowerCase();

    try {
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();

        // This is a simplified search that finds matches in text items.
        // Complex multi-line search across items is harder.
        textContent.items.forEach((item: any, itemIdx) => {
          if ('str' in item) {
            const text = item.str.toLowerCase();
            let index = text.indexOf(normalizedQuery);
            while (index !== -1) {
              results.push({
                pageIndex: i - 1,
                itemIndex: itemIdx,
                matchIndex: index
              });
              index = text.indexOf(normalizedQuery, index + 1);
            }
          }
        });
      }

      setSearchResults(results);
      if (results.length > 0) {
        setCurrentMatchIndex(0);
        scrollToPage(results[0].pageIndex);
      } else {
        setCurrentMatchIndex(-1);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  }, [pdfDocument, searchQuery]);

  // Debounce search execution
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch();
      } else {
        setSearchResults([]);
        setCurrentMatchIndex(-1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const scrollToPage = (pageIndex: number) => {
    virtuosoRef.current?.scrollToIndex({
      index: pageIndex,
      align: 'start',
      behavior: 'smooth'
    });
  };

  const nextMatch = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchResults.length;
    setCurrentMatchIndex(nextIndex);
    scrollToPage(searchResults[nextIndex].pageIndex);
  };

  const prevMatch = () => {
    if (searchResults.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentMatchIndex(prevIndex);
    scrollToPage(searchResults[prevIndex].pageIndex);
  };

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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Custom text renderer for highlighting
  const makeTextRenderer = useCallback(
    (searchText: string) => (textItem: any) => {
      if (!searchText) return textItem.str;

      const str = textItem.str;
      const lowerStr = str.toLowerCase();
      const lowerSearch = searchText.toLowerCase();
      const index = lowerStr.indexOf(lowerSearch);

      if (index === -1) return str;

      // Simple highlight for the first occurrence in the string
      // A more robust implementation would handle multiple occurrences in one string
      const before = str.slice(0, index);
      const match = str.slice(index, index + lowerSearch.length);
      const after = str.slice(index + lowerSearch.length);

      return (
        <>
          {before}
          <span className="bg-yellow-300 text-black">{match}</span>
          {after}
        </>
      );
    },
    []
  );

  const textRenderer = useMemo(() => makeTextRenderer(searchQuery), [makeTextRenderer, searchQuery]);


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
          {/* Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchVisible(!isSearchVisible)}
            className={cn("h-8 w-8", isSearchVisible && "bg-muted")}
            title="Search"
          >
            <Search className="h-4 w-4" />
          </Button>

          {isSearchVisible && (
            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-5">
              <div className="relative">
                <Input
                  placeholder="Find..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-32 md:w-48 pr-12"
                  onKeyDown={(e) => e.key === 'Enter' && nextMatch()}
                />
                {isSearching && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMatch} disabled={searchResults.length === 0}>
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMatch} disabled={searchResults.length === 0}>
                <ChevronDown className="h-4 w-4" />
              </Button>
              {searchResults.length > 0 && (
                <span className="text-xs text-muted-foreground ml-1 hidden sm:inline-block">
                  {currentMatchIndex + 1}/{searchResults.length}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-8 w-8"
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

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
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div className={cn(
        "flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900/50 relative",
        isDarkMode ? "bg-gray-900" : ""
      )}>
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex flex-col items-center justify-center p-12 h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          }
          className="h-full"
        >
          {numPages > 0 && (
            <Virtuoso
              ref={virtuosoRef}
              totalCount={numPages}
              context={{ textRenderer, isDarkMode, scale }}
              className="h-full w-full custom-scrollbar"
              itemContent={(index, _, context) => (
                <div key={index} className="flex justify-center py-4">
                  <div
                    className={cn(
                      "relative shadow-md transition-all duration-200",
                      context.isDarkMode ? "invert-[1] hue-rotate-180" : ""
                    )}
                  >
                    <Page
                      pageNumber={index + 1}
                      scale={context.scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      customTextRenderer={context.textRenderer}
                      className="bg-white"
                      loading={
                        <div className="flex items-center justify-center w-[600px] h-[800px] bg-white">
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                      }
                    />
                  </div>
                </div>
              )}
            />
          )}
        </Document>
      </div>
    </div>
  );
};

export default CustomPDFViewer;

