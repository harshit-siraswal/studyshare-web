import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Maximize2, Minimize2, Search, Moon, Sun, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
// Use local bundled worker (copied by vite-plugin-static-copy)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

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

  // Cached page dimensions for stable loading placeholders
  const [pageDimensions, setPageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());

  const containerRef = useRef<HTMLDivElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load PDF document - rely on Document component's internal loading behavior
  const onDocumentLoadSuccess = (pdf: pdfjs.PDFDocumentProxy) => {
    setNumPages(pdf.numPages);
    setPdfDocument(pdf);
    setError(null);
    // Reset cached dimensions when loading new document
    setPageDimensions(new Map());
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    setError("Failed to load PDF. Please try again.");
  };

  // Scroll to a specific page
  const scrollToPage = useCallback((pageIndex: number) => {
    virtuosoRef.current?.scrollToIndex({
      index: pageIndex,
      align: 'start',
      behavior: 'smooth'
    });
  }, []);

  // Search functionality - stable function that takes query as parameter
  const performSearch = useCallback(async (query: string) => {
    if (!pdfDocument || !query.trim()) {
      setSearchResults([]);
      setCurrentMatchIndex(-1);
      return;
    }

    setIsSearching(true);
    const results: SearchMatch[] = [];
    const normalizedQuery = query.toLowerCase();

    try {
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();

        // Use proper TextItem type from pdfjs-dist
        textContent.items.forEach((item, itemIdx) => {
          // Type guard to check if item is a TextItem with 'str' property
          if ('str' in item) {
            const textItem = item as TextItem;
            const text = textItem.str.toLowerCase();
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
  }, [pdfDocument, scrollToPage]);

  // Debounced search effect - only depends on searchQuery, calls stable performSearch
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setCurrentMatchIndex(-1);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Navigation functions
  const nextMatch = useCallback(() => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchResults.length;
    setCurrentMatchIndex(nextIndex);
    scrollToPage(searchResults[nextIndex].pageIndex);
  }, [searchResults, currentMatchIndex, scrollToPage]);

  const prevMatch = useCallback(() => {
    if (searchResults.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentMatchIndex(prevIndex);
    scrollToPage(searchResults[prevIndex].pageIndex);
  }, [searchResults, currentMatchIndex, scrollToPage]);

  // Handle Enter key - flush debounce and trigger immediate search
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Flush the debounce by clearing timeout and executing immediately
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      if (searchQuery.trim()) {
        // If we already have results for this query, navigate to next match
        if (searchResults.length > 0) {
          nextMatch();
        } else {
          // Trigger immediate search (scrolls to first match on completion)
          performSearch(searchQuery);
        }
      }
    }
  }
  }, [searchQuery, searchResults.length, nextMatch, performSearch]);

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
  setIsDarkMode(prev => !prev);
};

// Text renderer that highlights ALL occurrences of the search term
const makeTextRenderer = useCallback(
  (searchText: string) => (textItem: { str: string; itemTransform?: number[] }) => {
    if (!searchText) return textItem.str;

    const str = textItem.str;
    const lowerStr = str.toLowerCase();
    const lowerSearch = searchText.toLowerCase();

    // Check if there are any matches
    if (!lowerStr.includes(lowerSearch)) {
      return str;
    }

    // Build fragments for all occurrences
    const fragments: React.ReactNode[] = [];
    let lastIndex = 0;
    let matchIndex = lowerStr.indexOf(lowerSearch);

    while (matchIndex !== -1) {
      // Add text before match (if any)
      if (matchIndex > lastIndex) {
        fragments.push(str.slice(lastIndex, matchIndex));
      }

      // Add highlighted match (preserving original case)
      const matchText = str.slice(matchIndex, matchIndex + lowerSearch.length);
      fragments.push(
        <span key={matchIndex} className="bg-yellow-300 text-black">
          {matchText}
        </span>
      );

      lastIndex = matchIndex + lowerSearch.length;
      matchIndex = lowerStr.indexOf(lowerSearch, lastIndex);
    }

    // Add remaining text after last match
    if (lastIndex < str.length) {
      fragments.push(str.slice(lastIndex));
    }

    return <>{fragments}</>;
  },
  []
);

const textRenderer = useMemo(() => makeTextRenderer(searchQuery), [makeTextRenderer, searchQuery]);

// Callback to cache page dimensions when a page renders
const handlePageRenderSuccess = useCallback((page: { pageNumber: number; width: number; height: number }) => {
  setPageDimensions(prev => {
    // Only update if not already cached
    if (prev.has(page.pageNumber)) return prev;
    const next = new Map(prev);
    next.set(page.pageNumber, { width: page.width, height: page.height });
    return next;
  });
}, []);

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
                onKeyDown={handleSearchKeyDown}
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
      "flex-1 overflow-hidden relative",
      isDarkMode ? "bg-gray-900" : "bg-gray-100"
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
            context={{ textRenderer, isDarkMode, scale, pageDimensions }}
            className="h-full w-full custom-scrollbar"
            itemContent={(index, _, context) => {
              // Get cached dimensions or use fallback
              const cached = context.pageDimensions.get(index + 1);
              const placeholderWidth = cached ? cached.width * context.scale : undefined;
              const placeholderHeight = cached ? cached.height * context.scale : undefined;

              return (
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
                      onRenderSuccess={handlePageRenderSuccess}
                      className="bg-white"
                      loading={
                        <div
                          className="flex items-center justify-center bg-white"
                          style={{
                            width: placeholderWidth ? `${placeholderWidth}px` : '100%',
                            height: placeholderHeight ? `${placeholderHeight}px` : 'auto',
                            aspectRatio: placeholderHeight ? undefined : '3 / 4',
                            minHeight: placeholderHeight ? undefined : '400px'
                          }}
                        >
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                      }
                    />
                  </div>
                </div>
              );
            }}
          />
        )}
      </Document>
    </div>
  </div>
);
};

export default CustomPDFViewer;
