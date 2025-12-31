import { useState, useEffect } from "react";
import { FileText, Download, ExternalLink, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PDFViewer from "./PDFViewer";
import { supabase } from "../supabase";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface SyllabusItem {
  id: string;
  title: string;
  semester: string;
  branch: string;
  subject: string;
  pdf_url: string;
  description: string | null;
  file_size: number | null;
  created_at: string;
}

interface SyllabusSectionProps {
  selectedSemester?: string;
  selectedBranch?: string;
  selectedSubject?: string;
}

const SyllabusSection = ({
  selectedSemester = "all",
  selectedBranch = "all",
  selectedSubject = "all",
}: SyllabusSectionProps) => {
  const [syllabusItems, setSyllabusItems] = useState<SyllabusItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string } | null>(null);

  // Fetch syllabus when filters change
  useEffect(() => {
    if (selectedSemester !== "all" && selectedBranch !== "all" && selectedSubject !== "all") {
      fetchSyllabus();
    } else {
      setSyllabusItems([]);
    }
  }, [selectedSemester, selectedBranch, selectedSubject]);

  const fetchSyllabus = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('syllabus')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (selectedSemester !== "all") {
        query = query.eq('semester', selectedSemester);
      }
      if (selectedBranch !== "all") {
        query = query.eq('branch', selectedBranch);
      }
      if (selectedSubject !== "all") {
        query = query.eq('subject', selectedSubject);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSyllabusItems(data || []);
    } catch (error) {
      console.error('Error fetching syllabus:', error);
      toast.error('Failed to load syllabus');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, title: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // Show message when filters are not selected
  if (selectedSemester === "all" || selectedBranch === "all" || selectedSubject === "all") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <Filter className="h-4 w-4" />
          <AlertDescription className="ml-2">
            Please select <strong>Semester</strong>, <strong>Branch</strong>, and <strong>Subject</strong> to view syllabus
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="w-16 h-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // No syllabus found
  if (syllabusItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <FileText className="h-4 w-4" />
          <AlertDescription className="ml-2">
            No syllabus available for <strong>{selectedSubject}</strong> in Semester <strong>{selectedSemester}</strong>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Syllabus</h2>
            <p className="text-sm text-muted-foreground">
              {syllabusItems.length} syllabus document{syllabusItems.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {syllabusItems.map((item) => (
            <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-16 h-16 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                  
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {item.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">Semester {item.semester}</Badge>
                    <Badge variant="outline">{item.branch.toUpperCase()}</Badge>
                    <Badge variant="outline">{item.subject}</Badge>
                    {item.file_size && (
                      <Badge variant="secondary">{formatFileSize(item.file_size)}</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedPdf({ url: item.pdf_url, title: item.title })}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(item.pdf_url, item.title)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <a href={item.pdf_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in New Tab
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* PDF Viewer */}
      {selectedPdf && (
        <PDFViewer
          isOpen={true}
          onClose={() => setSelectedPdf(null)}
          title={selectedPdf.title}
          pdfUrl={selectedPdf.url}
        />
      )}
    </>
  );
};

export default SyllabusSection;
