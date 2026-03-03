import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { ReactNode } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Maximize2, Minimize2, Search, Moon, Sun, X, ChevronDown, ChevronUp, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import mammoth from "mammoth";
import DOMPurify from "dompurify";

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Fix PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

const WEBODF_SCRIPT_URL = "/vendor/webodf.js";
let webOdfScriptPromise: Promise<void> | null = null;
const API_BASE = (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "http://localhost:3001" : "https://api.studyshare.in")
).replace(/\/+$/, "");

const ensureWebOdf = () => {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error("WebODF can only run in the browser"));
    }
    if ((window as any).odf) {
        return Promise.resolve();
    }
    if (webOdfScriptPromise) {
        return webOdfScriptPromise;
    }

    webOdfScriptPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-webodf="true"]') as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error("Failed to load WebODF script")));
            return;
        }

        const script = document.createElement('script');
        script.src = WEBODF_SCRIPT_URL;
        script.async = true;
        script.setAttribute('data-webodf', 'true');
        script.onload = () => resolve();
        script.onerror = () => {
            webOdfScriptPromise = null;
            reject(new Error("Failed to load WebODF script"));
        };
        document.head.appendChild(script);
    });

    return webOdfScriptPromise;
};

interface DocumentViewerProps {
    url: string;
    title?: string;
    type?: 'pdf' | 'docx' | 'pptx' | 'odf'; // Explicit type or auto-detect
    fullscreenTargetRef?: React.RefObject<HTMLElement>;
    toolbarActions?: ReactNode;
}

interface SearchMatch {
    pageIndex: number;
    itemIndex: number;
    matchIndex: number;
}

type DetectedFileType = 'pdf' | 'docx' | 'pptx' | 'odf' | 'unsupported-ppt' | 'unsupported-doc';
type ViewerFileType = DetectedFileType | 'unknown';

const EXTENSION_TO_FILE_TYPE: Record<string, DetectedFileType> = {
    pdf: 'pdf',
    docx: 'docx',
    pptx: 'pptx',
    odt: 'odf',
    odp: 'odf',
    ods: 'odf',
    odf: 'odf',
    ppt: 'unsupported-ppt',
    doc: 'unsupported-doc',
};

const FILE_EXTENSION_PATTERN = /\.(pdf|docx|pptx|odt|odp|ods|odf|ppt|doc)(?=$|[?#&"'])/i;

function inferFileTypeFromValue(value?: string | null): DetectedFileType | null {
    if (!value) return null;

    const candidates = [value];
    try {
        candidates.push(decodeURIComponent(value));
    } catch {
        // Ignore malformed encoded values.
    }

    for (const candidate of candidates) {
        const match = candidate.match(FILE_EXTENSION_PATTERN);
        if (!match) continue;
        const extension = match[1].toLowerCase();
        return EXTENSION_TO_FILE_TYPE[extension] ?? null;
    }

    return null;
}

function inferFileTypeFromMime(contentType?: string | null): DetectedFileType | null {
    if (!contentType) return null;
    const mime = contentType.toLowerCase();

    if (mime.includes('application/pdf')) return 'pdf';
    if (mime.includes('wordprocessingml.document')) return 'docx';
    if (mime.includes('application/msword')) return 'unsupported-doc';
    if (mime.includes('presentationml.presentation')) return 'pptx';
    if (mime.includes('application/vnd.ms-powerpoint')) return 'unsupported-ppt';
    if (mime.includes('oasis.opendocument')) return 'odf';

    return null;
}

const DocumentViewer = ({ url, title, type, fullscreenTargetRef, toolbarActions }: DocumentViewerProps) => {
    const normalizedUrl = useMemo(() => {
        if (!url) return url;
        const trimmed = url.trim();
        if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;
        try {
            const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
            const parsed = new URL(trimmed, base);
            if (typeof window !== 'undefined' && window.location.protocol === 'https:' && parsed.protocol === 'http:') {
                parsed.protocol = 'https:';
            }
            return parsed.toString();
        } catch {
            return trimmed;
        }
    }, [url]);

    const urlPathForType = useMemo(() => {
        if (!normalizedUrl) return '';
        try {
            const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
            return new URL(normalizedUrl, base).pathname.toLowerCase();
        } catch {
            return normalizedUrl.toLowerCase();
        }
    }, [normalizedUrl]);

    const proxiedDocumentUrl = useMemo(() => {
        if (!normalizedUrl) return normalizedUrl;
        if (normalizedUrl.startsWith('blob:') || normalizedUrl.startsWith('data:')) return normalizedUrl;
        try {
            const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
            const parsed = new URL(normalizedUrl, base);
            const host = parsed.hostname.toLowerCase();
            const shouldProxy =
                host === 'file.studyshare.in' ||
                host.endsWith('.r2.dev');
            if (!shouldProxy) return parsed.toString();
            return `${API_BASE}/api/public/file?url=${encodeURIComponent(parsed.toString())}`;
        } catch {
            return normalizedUrl;
        }
    }, [normalizedUrl]);

    // Determine file type from explicit prop / URL hint / response headers fallback.
    const hintedFileType = useMemo<DetectedFileType | null>(() => {
        if (type) return type;
        return (
            inferFileTypeFromValue(urlPathForType) ||
            inferFileTypeFromValue(normalizedUrl) ||
            inferFileTypeFromValue(title)
        );
    }, [type, urlPathForType, normalizedUrl, title]);

    // Common State
    const [fileType, setFileType] = useState<ViewerFileType>(hintedFileType ?? 'unknown');
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setFileType(hintedFileType ?? 'unknown');
    }, [hintedFileType, normalizedUrl]);

    useEffect(() => {
        if (type || hintedFileType) return;
        if (!proxiedDocumentUrl || proxiedDocumentUrl.startsWith('blob:') || proxiedDocumentUrl.startsWith('data:')) {
            setFileType('pdf');
            return;
        }

        const controller = new AbortController();
        let cancelled = false;

        const detectFileType = async () => {
            try {
                let response = await fetch(proxiedDocumentUrl, {
                    method: 'HEAD',
                    signal: controller.signal,
                });

                if (!response.ok || !response.headers.get('content-type')) {
                    response = await fetch(proxiedDocumentUrl, {
                        method: 'GET',
                        headers: { Range: 'bytes=0-0' },
                        signal: controller.signal,
                    });
                }

                if (cancelled) return;

                const detectedType =
                    inferFileTypeFromMime(response.headers.get('content-type')) ||
                    inferFileTypeFromValue(response.headers.get('content-disposition'));

                setFileType(detectedType ?? 'pdf');
            } catch (err: unknown) {
                if (cancelled || (err as Error).name === 'AbortError') return;
                console.warn("Document type sniff failed; defaulting to PDF", err);
                setFileType('pdf');
            }
        };

        detectFileType();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [type, hintedFileType, proxiedDocumentUrl]);

    // --- PDF State ---
    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState(1.0);
    const [richDocScale, setRichDocScale] = useState(1.0);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
    const [isSearching, setIsSearching] = useState(false);
    const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);
    const [pageDimensions, setPageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());
    const [pdfRetryKey, setPdfRetryKey] = useState(0);
    const [pdfLoadMode, setPdfLoadMode] = useState<'default' | 'no-range' | 'data'>('default');
    const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);

    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // --- DOCX State ---
    const [docxHtml, setDocxHtml] = useState<string | null>(null);
    const [loadingDocx, setLoadingDocx] = useState(false);
    const [pptxSlides, setPptxSlides] = useState<string[] | null>(null);
    const [loadingPptx, setLoadingPptx] = useState(false);
    const [loadingOdf, setLoadingOdf] = useState(false);

    const odfContainerRef = useRef<HTMLDivElement>(null);
    const odfCanvasRef = useRef<any>(null);

    // --- DOCX Loading Logic ---
    const loadDocx = useCallback(async (signal?: AbortSignal) => {
        if (fileType !== 'docx') return;

        setLoadingDocx(true);
        setError(null);
        try {
            const response = await fetch(proxiedDocumentUrl, { signal });
            if (!response.ok) throw new Error(`Failed to fetch document: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();

            if (signal?.aborted) return;

            const result = await mammoth.convertToHtml({ arrayBuffer });

            // Sanitize HTML
            const cleanHtml = DOMPurify.sanitize(result.value);

            if (!signal?.aborted) {
                setDocxHtml(cleanHtml);

                if (result.messages.length > 0) {
                    console.warn("Mammoth messages:", result.messages);
                }
            }
        } catch (err: unknown) {
            if (signal?.aborted || (err as Error).name === 'AbortError') return;
            console.error("DOCX load error:", err);
            setError(err instanceof Error ? err.message : "Failed to load DOCX file");
        } finally {
            if (!signal?.aborted) {
                setLoadingDocx(false);
            }
        }
    }, [proxiedDocumentUrl, fileType]);

    useEffect(() => {
        if (fileType === 'docx') {
            const controller = new AbortController();
            loadDocx(controller.signal);
            return () => controller.abort();
        }
    }, [loadDocx, fileType]);

    // --- PPTX Loading Logic ---
    const loadPptx = useCallback(async (signal?: AbortSignal) => {
        if (fileType !== 'pptx') return;

        setLoadingPptx(true);
        setError(null);
        try {
            const response = await fetch(proxiedDocumentUrl, { signal });
            if (!response.ok) throw new Error(`Failed to fetch presentation: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();

            if (signal?.aborted) return;

            const { pptxToHtml } = await import("@jvmr/pptx-to-html");
            const slides = await pptxToHtml(arrayBuffer, {
                width: 960,
                height: 540,
                scaleToFit: true,
                letterbox: true,
            });

            if (!signal?.aborted) {
                setPptxSlides(slides);
            }
        } catch (err: unknown) {
            if (signal?.aborted || (err as Error).name === 'AbortError') return;
            console.error("PPTX load error:", err);
            setError(err instanceof Error ? err.message : "Failed to load PPTX file");
        } finally {
            if (!signal?.aborted) {
                setLoadingPptx(false);
            }
        }
    }, [proxiedDocumentUrl, fileType]);

    useEffect(() => {
        if (fileType === 'pptx') {
            const controller = new AbortController();
            loadPptx(controller.signal);
            return () => controller.abort();
        }
    }, [loadPptx, fileType]);

    // --- ODF Loading Logic ---
    const loadOdf = useCallback(async () => {
        if (fileType !== 'odf') return;

        setLoadingOdf(true);
        setError(null);
        try {
            await ensureWebOdf();
            if (!odfContainerRef.current) return;

            if (odfCanvasRef.current?.destroy) {
                try {
                    odfCanvasRef.current.destroy(() => null);
                } catch {
                    // ignore
                }
            }

            odfContainerRef.current.innerHTML = '';
            const odfCanvas = new (window as any).odf.OdfCanvas(odfContainerRef.current);
            odfCanvasRef.current = odfCanvas;
            odfCanvas.load(proxiedDocumentUrl);
        } catch (err: unknown) {
            console.error("ODF load error:", err);
            const message = err instanceof Error ? err.message : "Failed to load ODF file";
            if (message.toLowerCase().includes("webodf")) {
                setError("Failed to load ODF renderer. Ensure /vendor/webodf.js is available.");
            } else {
                setError(message);
            }
        } finally {
            setLoadingOdf(false);
        }
    }, [proxiedDocumentUrl, fileType]);

    useEffect(() => {
        if (fileType === 'odf') {
            loadOdf();
        }
    }, [loadOdf, fileType]);

    useEffect(() => {
        return () => {
            if (odfCanvasRef.current?.destroy) {
                try {
                    odfCanvasRef.current.destroy(() => null);
                } catch {
                    // ignore
                }
            }
            odfCanvasRef.current = null;
        };
    }, []);

    useEffect(() => {
        setPdfLoadMode('default');
        setPdfData(null);
        setPdfRetryKey(0);
        setError(null);
        setDocxHtml(null);
        setPptxSlides(null);
        setRichDocScale(1.0);
    }, [normalizedUrl, proxiedDocumentUrl, fileType]);


    // --- PDF Logic ---
    const onDocumentLoadSuccess = (pdf: pdfjs.PDFDocumentProxy) => {
        setNumPages(pdf.numPages);
        setPdfDocument(pdf);
        setError(null);
        setPageDimensions(new Map());
    };

    const handlePdfLoadError = (err: Error) => {
        console.error("PDF load error:", err);
        if (fileType === 'pdf') {
            if (pdfLoadMode === 'default') {
                setPdfLoadMode('no-range');
                setPdfRetryKey(prev => prev + 1);
                return;
            }
            if (pdfLoadMode === 'no-range') {
                setPdfLoadMode('data');
                setPdfRetryKey(prev => prev + 1);
                return;
            }
        }
        setError(err?.message || "Failed to load PDF. Please try again.");
    };

    const handleRetry = () => {
        setError(null);
        if (fileType === 'docx') {
            loadDocx();
        } else if (fileType === 'pptx') {
            loadPptx();
        } else if (fileType === 'odf') {
            loadOdf();
        } else {
            setPdfLoadMode('default');
            setPdfData(null);
            setPdfRetryKey(prev => prev + 1);
        }
    };

    useEffect(() => {
        if (fileType !== 'pdf' || pdfLoadMode !== 'data') return;

        const controller = new AbortController();
        setPdfData(null);
        setError(null);

        const loadPdfData = async () => {
            try {
                const response = await fetch(proxiedDocumentUrl, { signal: controller.signal });
                if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
                const buffer = await response.arrayBuffer();
                if (!controller.signal.aborted) {
                    setPdfData(buffer);
                }
            } catch (err: unknown) {
                if ((err as Error).name === 'AbortError') return;
                console.error("PDF data load error:", err);
                setError(err instanceof Error ? err.message : "Failed to load PDF. Please try again.");
            }
        };

        loadPdfData();

        return () => controller.abort();
    }, [fileType, pdfLoadMode, proxiedDocumentUrl]);

    const scrollToPage = useCallback((pageIndex: number) => {
        virtuosoRef.current?.scrollToIndex({
            index: pageIndex,
            align: 'start',
            behavior: 'smooth'
        });
    }, []);

    // Optimized Search
    const performSearch = useCallback(async (query: string) => {
        // Abort previous search
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

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
                if (abortController.signal.aborted) return;

                const page = await pdfDocument.getPage(i);
                const textContent = await page.getTextContent();

                // Yield to event loop
                await new Promise(resolve => setTimeout(resolve, 0));

                if (abortController.signal.aborted) return;

                textContent.items.forEach((item, itemIdx) => {
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

            if (!abortController.signal.aborted) {
                setSearchResults(results);
                if (results.length > 0) {
                    setCurrentMatchIndex(0);
                    scrollToPage(results[0].pageIndex);
                } else {
                    setCurrentMatchIndex(-1);
                }
            }
        } catch (err) {
            if (!abortController.signal.aborted) {
                console.error("Search failed:", err);
            }
        } finally {
            if (!abortController.signal.aborted) {
                setIsSearching(false);
            }
        }
    }, [pdfDocument, scrollToPage]);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            if (fileType === 'pdf') {
                if (searchQuery) performSearch(searchQuery);
                else {
                    setSearchResults([]);
                    setCurrentMatchIndex(-1);
                }
            }
        }, 500);
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, [searchQuery, performSearch, fileType]);

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

    // Handle Enter key
    const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = null;
            }
            if (searchQuery.trim()) {
                if (searchResults.length > 0) nextMatch();
                else performSearch(searchQuery);
            }
        }
    }, [searchQuery, searchResults.length, nextMatch, performSearch]);


    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (fileType !== 'pdf') return;

            // Ctrl/Cmd + F
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setIsSearchVisible(true);
                // Ideally focus input here, but React state update is async
            }

            // Esc
            if (e.key === 'Escape') {
                if (isSearchVisible) {
                    e.preventDefault();
                    setIsSearchVisible(false);
                }
            }

            // + / - for Zoom
            if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
                e.preventDefault();
                if (fileType === 'pdf') {
                    setScale(prev => Math.min(prev + 0.2, 3.0));
                } else if (fileType === 'docx' || fileType === 'pptx') {
                    setRichDocScale(prev => Math.min(prev + 0.1, 2.0));
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                if (fileType === 'pdf') {
                    setScale(prev => Math.max(prev - 0.2, 0.5));
                } else if (fileType === 'docx' || fileType === 'pptx') {
                    setRichDocScale(prev => Math.max(prev - 0.1, 0.6));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fileType, isSearchVisible]);


    const toggleFullscreen = useCallback(async () => {
        const target = fullscreenTargetRef?.current ?? containerRef.current;
        if (!target) return;
        try {
            if (document.fullscreenElement === target) {
                await document.exitFullscreen();
                setIsFullscreen(false);
                return;
            }
            if (document.fullscreenElement && document.fullscreenElement !== target) {
                await document.exitFullscreen();
            }
            await target.requestFullscreen();
            setIsFullscreen(true);
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    }, [fullscreenTargetRef]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const target = fullscreenTargetRef?.current ?? containerRef.current;
            setIsFullscreen(!!target && document.fullscreenElement === target);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        handleFullscreenChange();
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [fullscreenTargetRef]);

    const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
    const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
    const handleRichDocZoomIn = () => setRichDocScale((prev) => Math.min(prev + 0.1, 2.0));
    const handleRichDocZoomOut = () => setRichDocScale((prev) => Math.max(prev - 0.1, 0.6));
    const toggleDarkMode = () => setIsDarkMode(prev => !prev);

    // Text renderer for highlighting
    const makeTextRenderer = useCallback((searchText: string) => (textItem: { str: string }) => {
        if (!searchText) return textItem.str;
        const str = textItem.str;
        const lowerStr = str.toLowerCase();
        const lowerSearch = searchText.toLowerCase();
        if (!lowerStr.includes(lowerSearch)) return str;

        const fragments: React.ReactNode[] = [];
        let lastIndex = 0;
        let matchIndex = lowerStr.indexOf(lowerSearch);

        while (matchIndex !== -1) {
            if (matchIndex > lastIndex) fragments.push(str.slice(lastIndex, matchIndex));
            const matchText = str.slice(matchIndex, matchIndex + lowerSearch.length);
            fragments.push(<span key={matchIndex} className="bg-yellow-300 text-black">{matchText}</span>);
            lastIndex = matchIndex + lowerSearch.length;
            matchIndex = lowerStr.indexOf(lowerSearch, lastIndex);
        }
        if (lastIndex < str.length) fragments.push(str.slice(lastIndex));
        return <>{fragments}</>;
    }, []);

    const textRenderer = useMemo(() => makeTextRenderer(searchQuery), [makeTextRenderer, searchQuery]);

    // Cache page dimensions
    const handlePageRenderSuccess = useCallback((page: { pageNumber: number; width: number; height: number }) => {
        setPageDimensions(prev => {
            if (prev.has(page.pageNumber)) return prev;
            const next = new Map(prev);
            next.set(page.pageNumber, { width: page.width, height: page.height });
            return next;
        });
    }, []);

    if (fileType === 'unknown') {
        return (
            <div className="flex items-center justify-center h-full bg-background">
                <div className="text-center p-6">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Detecting document format...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-background">
                <div className="text-center p-6">
                    <div className="bg-destructive/10 p-4 rounded-full inline-block mb-4">
                        <FileText className="w-8 h-8 text-destructive" />
                    </div>
                    <p className="text-destructive font-medium mb-2">Failed to load document</p>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">{error}</p>
                    <Button onClick={handleRetry}>Retry</Button>
                </div>
            </div>
        );
    }

    // Unsupported File Types
    if (fileType === 'unsupported-doc') {
        return (
            <div className="flex items-center justify-center h-full bg-background">
                <div className="text-center p-6">
                    <div className="bg-yellow-500/10 p-4 rounded-full inline-block mb-4">
                        <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Unsupported File Format</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        The obsolete <code>.doc</code> format is not supported. Please convert this file to <code>.docx</code> or <code>.pdf</code> to view it here.
                    </p>
                </div>
            </div>
        );
    }
    if (fileType === 'unsupported-ppt') {
        return (
            <div className="flex items-center justify-center h-full bg-background">
                <div className="text-center p-6">
                    <div className="bg-yellow-500/10 p-4 rounded-full inline-block mb-4">
                        <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Unsupported File Format</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        The legacy <code>.ppt</code> format is not supported. Please convert this file to <code>.pptx</code> or <code>.pdf</code> to view it here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="flex flex-col h-full bg-background relative overflow-hidden rounded-[inherit] transition-colors duration-200"
        >
            {/* Controls Bar */}
            <div className="flex items-center justify-between p-2 md:p-3 border-b bg-background/95 backdrop-blur z-10 shrink-0 gap-2 overflow-x-auto">
                <div className="flex items-center gap-1 md:gap-2">

                    {title && (
                        <span className="text-sm font-semibold truncate max-w-[150px] md:max-w-[250px] mr-2" title={title}>
                            {title}
                        </span>
                    )}

                    {/* DOCX / ODF / PPTX Indicators */}
                    {fileType === 'docx' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                            <FileText className="w-4 h-4" />
                            DOCX View
                        </div>
                    )}
                    {fileType === 'odf' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium">
                            <FileText className="w-4 h-4" />
                            ODF View
                        </div>
                    )}
                    {fileType === 'pptx' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-md text-sm font-medium">
                            <FileText className="w-4 h-4" />
                            PPTX View
                        </div>
                    )}

                    {/* Search Toggle (PDF Only) */}
                    {fileType === 'pdf' && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSearchVisible(!isSearchVisible)}
                                className={cn("h-8 w-8", isSearchVisible && "bg-muted")}
                                title="Search (Ctrl+F)"
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
                                            autoFocus
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
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    {toolbarActions}

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
                    {fileType === 'pdf' && (
                        <div className="flex items-center gap-1 border rounded-md px-1 bg-muted/20">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} disabled={scale <= 0.5} title="Zoom Out (Ctrl+-)">
                                <ZoomOut className="w-3.5 h-3.5" />
                            </Button>
                            <span className="text-xs min-w-[3rem] text-center font-mono">
                                {Math.round(scale * 100)}%
                            </span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} disabled={scale >= 3} title="Zoom In (Ctrl++)">
                                <ZoomIn className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}
                    {(fileType === 'docx' || fileType === 'pptx') && (
                        <div className="flex items-center gap-1 border rounded-md px-1 bg-muted/20">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={handleRichDocZoomOut}
                                disabled={richDocScale <= 0.6}
                                title="Decrease content size (Ctrl+-)"
                            >
                                <ZoomOut className="w-3.5 h-3.5" />
                            </Button>
                            <span className="text-xs min-w-[3rem] text-center font-mono">
                                {Math.round(richDocScale * 100)}%
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={handleRichDocZoomIn}
                                disabled={richDocScale >= 2}
                                title="Increase content size (Ctrl++)"
                            >
                                <ZoomIn className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="h-8 w-8"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Document Content Area */}
            <div className={cn(
                "flex-1 overflow-hidden relative",
                isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
            )}>
                {fileType === 'pdf' ? (
                    pdfLoadMode === 'data' && !pdfData ? (
                        <div className="flex flex-col items-center justify-center p-12 h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                            <p className="text-sm text-muted-foreground">Loading PDF...</p>
                        </div>
                    ) : (
                        <Document
                            key={`${proxiedDocumentUrl}-${pdfRetryKey}-${pdfLoadMode}`}
                            file={pdfLoadMode === 'data' ? { data: pdfData as ArrayBuffer } : proxiedDocumentUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={handlePdfLoadError}
                            onSourceError={handlePdfLoadError}
                            options={pdfLoadMode === 'no-range' ? { disableRange: true, disableStream: true } : undefined}
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
                                        const cached = context.pageDimensions.get(index + 1);
                                        const placeholderWidth = cached ? cached.width * context.scale : undefined;
                                        const placeholderHeight = cached ? cached.height * context.scale : undefined;

                                        return (
                                            <div key={index} className="flex justify-center py-4">
                                                <div className={cn(
                                                    "relative shadow-md rounded-lg border border-black/5 overflow-hidden transition-all duration-200",
                                                    context.isDarkMode ? "invert-[1] hue-rotate-180" : ""
                                                )}>
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
                    )
                ) : fileType === 'pptx' ? (
                    // PPTX Viewer
                    <div className="h-full overflow-auto p-6 custom-scrollbar">
                        {loadingPptx ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                                <p className="text-sm text-muted-foreground">Rendering PPTX...</p>
                            </div>
                        ) : (
                            <div className="space-y-6 origin-top transition-[zoom] duration-200" style={{ zoom: richDocScale }}>
                                {pptxSlides && pptxSlides.length > 0 ? (
                                    pptxSlides.map((slide, index) => (
                                        <div key={index} className="mx-auto w-[960px] max-w-full bg-white shadow-md overflow-hidden rounded-xl border border-black/5">
                                            <div dangerouslySetInnerHTML={{ __html: slide }} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        No slides to display
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : fileType === 'odf' ? (
                    // ODF Viewer
                    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                        <div className="relative min-h-full">
                            {loadingOdf && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 z-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                                    <p className="text-sm text-muted-foreground">Loading ODF...</p>
                                </div>
                            )}
                            <div
                                ref={odfContainerRef}
                                className={cn(
                                    "bg-white shadow-sm p-4 min-h-full rounded-xl border border-black/5",
                                    isDarkMode ? "invert-[1] hue-rotate-180" : ""
                                )}
                            />
                        </div>
                    </div>
                ) : (
                    // DOCX Viewer
                    <div className="h-full overflow-auto p-8 custom-scrollbar">
                        {loadingDocx ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                                <p className="text-sm text-muted-foreground">Converting DOCX...</p>
                            </div>
                        ) : (
                            <div className={cn(
                                "max-w-4xl mx-auto shadow-sm p-8 min-h-full rounded-xl border border-black/5 origin-top transition-[zoom] duration-200",
                                isDarkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
                            )} style={{ zoom: richDocScale }}>
                                {docxHtml ? (
                                    <div
                                        className={cn(
                                            "prose max-w-none",
                                            isDarkMode ? "prose-invert" : ""
                                        )}
                                        dangerouslySetInnerHTML={{ __html: docxHtml }}
                                    />
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        No content to display
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentViewer;
