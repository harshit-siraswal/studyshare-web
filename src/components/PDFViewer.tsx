import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import CustomPDFViewer from "./CustomPDFViewer";

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
}

const PDFViewer = ({ isOpen, onClose, title, pdfUrl }: PDFViewerProps) => {
  const [displayUrl, setDisplayUrl] = useState(pdfUrl);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Update display URL when pdfUrl changes
  useEffect(() => {
    setDisplayUrl(pdfUrl);
  }, [pdfUrl]);

  // Listen for fullscreen changes from CustomPDFViewer
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={dialogRef}
        className={`${isFullscreen ? 'max-w-full h-screen' : 'max-w-7xl h-[95vh]'} p-0 flex flex-col [&>button]:hidden transition-all`}
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

        {/* Custom PDF Viewer with Zoom, Nav, Search, Fullscreen */}
        <div className="flex-1 overflow-hidden">
          <CustomPDFViewer
            pdfUrl={displayUrl}
            title={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;