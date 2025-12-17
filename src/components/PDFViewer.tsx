import { X, Download, ZoomIn, ZoomOut, RotateCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl?: string;
}

// Sample PDFs from open sources
const samplePDFs = [
  "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf",
  "https://www.africau.edu/images/default/sample.pdf",
  "https://unec.edu.az/application/uploads/2014/12/pdf-sample.pdf",
];

const PDFViewer = ({ isOpen, onClose, title, pdfUrl }: PDFViewerProps) => {
  // Use provided URL or a random sample PDF
  const displayUrl = pdfUrl || samplePDFs[Math.floor(Math.random() * samplePDFs.length)];
  
  // Google Docs viewer for better PDF rendering
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(displayUrl)}&embedded=true`;

  const handleDownload = () => {
    window.open(displayUrl, '_blank');
  };

  const handleOpenExternal = () => {
    window.open(displayUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpenExternal}>
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden bg-muted/30">
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            title={title}
            loading="lazy"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;

