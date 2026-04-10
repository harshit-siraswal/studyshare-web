import { X, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

const ImageViewer = ({ isOpen, onClose, imageUrl, title }: ImageViewerProps) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  
  const handleDownload = () => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClose = () => {
    setScale(1);
    setRotation(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 bg-background/95 backdrop-blur-xl">
        <DialogTitle className="sr-only">{title || "Image preview"}</DialogTitle>
        <div className="flex flex-col h-full">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-medium text-foreground truncate max-w-md">
              {title || "Image Preview"}
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-2" />
              <Button variant="ghost" size="icon" onClick={handleRotate}>
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-muted/20">
            <img
              src={imageUrl}
              alt={title || "Image"}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&h=400&fit=crop";
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;
