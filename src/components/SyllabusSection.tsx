import { useState, useEffect } from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import PDFViewer from "./PDFViewer";
import { cn } from "@/lib/utils";

const syllabusPDFs: Record<string, string> = {
  "Data Structures": "https://www.cs.usfca.edu/~galles/cs245/lecture/lecture0.pdf",
  "Algorithms": "https://jeffe.cs.illinois.edu/teaching/algorithms/book/01-recursion.pdf",
  "Operating Systems": "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf",
  "DBMS": "https://www.db-book.com/slides-dir/PDF-dir/ch1.pdf",
  "Computer Networks": "https://intronetworks.cs.luc.edu/current2/ComputerNetworks.pdf",
  "Machine Learning": "https://see.stanford.edu/materials/aimlcs229/cs229-notes1.pdf",
  "Digital Electronics": "https://www.iare.ac.in/sites/default/files/lecture_notes/IARE_DE_LECTURE_NOTES.pdf",
  "Analog Circuits": "https://www.africau.edu/images/default/sample.pdf",
  "Signal Processing": "https://www.africau.edu/images/default/sample.pdf",
  "VLSI": "https://www.africau.edu/images/default/sample.pdf",
  "Embedded Systems": "https://www.africau.edu/images/default/sample.pdf",
  "Thermodynamics": "https://www.africau.edu/images/default/sample.pdf",
  "Fluid Mechanics": "https://www.africau.edu/images/default/sample.pdf",
  "Machine Design": "https://www.africau.edu/images/default/sample.pdf",
  "Manufacturing": "https://www.africau.edu/images/default/sample.pdf",
  "Heat Transfer": "https://www.africau.edu/images/default/sample.pdf",
  "Structural Analysis": "https://www.africau.edu/images/default/sample.pdf",
  "Concrete Technology": "https://www.africau.edu/images/default/sample.pdf",
  "Geotechnical": "https://www.africau.edu/images/default/sample.pdf",
  "Surveying": "https://www.africau.edu/images/default/sample.pdf",
  "Hydrology": "https://www.africau.edu/images/default/sample.pdf",
  "Power Systems": "https://www.africau.edu/images/default/sample.pdf",
  "Control Systems": "https://www.africau.edu/images/default/sample.pdf",
  "Electrical Machines": "https://www.africau.edu/images/default/sample.pdf",
  "Power Electronics": "https://www.africau.edu/images/default/sample.pdf",
  "Mass Transfer": "https://www.africau.edu/images/default/sample.pdf",
  "Reaction Engineering": "https://www.africau.edu/images/default/sample.pdf",
  "Process Control": "https://www.africau.edu/images/default/sample.pdf",
};

interface SyllabusSectionProps {
  availableSubjects: string[];
  selectedBranch: string;
  selectedSubject?: string;
}

const SyllabusSection = ({ availableSubjects, selectedBranch, selectedSubject }: SyllabusSectionProps) => {
  const [openedSubject, setOpenedSubject] = useState<string | null>(null);
  const [visibleSubjects, setVisibleSubjects] = useState<string[]>([]);

  // Filter to show only selected subject if one is selected
  useEffect(() => {
    if (selectedSubject) {
      setVisibleSubjects([selectedSubject]);
    } else {
      setVisibleSubjects(availableSubjects);
    }
  }, [selectedSubject, availableSubjects]);

  const handleOpenPDF = (subject: string) => {
    setOpenedSubject(subject);
  };

  return (
    <>
      <div className="space-y-3">
        {visibleSubjects.length > 0 ? (
          visibleSubjects.map((subject, index) => (
            <div 
              key={subject}
              onClick={() => handleOpenPDF(subject)}
              className={cn(
                "p-4 border border-border rounded-lg hover:border-primary/50 transition-all duration-300 cursor-pointer bg-card group",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">{subject}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click to view syllabus PDF
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {selectedBranch 
                ? "Select a subject to view its syllabus"
                : "Select a branch to view available subjects"
              }
            </p>
          </div>
        )}
      </div>

      {openedSubject && (
        <PDFViewer
          isOpen={!!openedSubject}
          onClose={() => setOpenedSubject(null)}
          title={`${openedSubject} - Syllabus`}
          pdfUrl={syllabusPDFs[openedSubject] || "https://www.africau.edu/images/default/sample.pdf"}
        />
      )}
    </>
  );
};

export default SyllabusSection;
