import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getSyllabusUploadUrl, createSyllabus } from "@/lib/api";
import { useCollege } from "@/context/CollegeContext";
import {
  BRANCH_OPTIONS,
  SEMESTER_OPTIONS,
  getSubjectsForBranchAndSemester,
} from "@/lib/academicSubjects";

interface UploadSyllabusDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

const UploadSyllabusDialog = ({
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: UploadSyllabusDialogProps) => {
  const { selectedCollegeId } = useCollege();
  const [internalOpen, setInternalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const [formData, setFormData] = useState({
    title: "",
    semester: "",
    branch: "",
    subject: "",
    description: "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const availableSubjects = formData.branch && formData.semester
    ? getSubjectsForBranchAndSemester(formData.branch, formData.semester)
    : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please select a PDF file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pdfFile) {
      toast.error("Please select a PDF file");
      return;
    }

    if (!formData.title || !formData.semester || !formData.branch || !formData.subject) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      // 1. Get signed upload URL from backend
      const fileName = `${formData.semester}-${formData.branch}-${formData.subject}-${Date.now()}.pdf`;
      const { uploadUrl, publicUrl } = await getSyllabusUploadUrl(fileName);

      // 2. Upload PDF directly to storage using signed URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: pdfFile,
        headers: {
          'Content-Type': 'application/pdf',
          'Cache-Control': 'max-age=31536000',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // 3. Get public URL (construct from known bucket path)
      const pdfUrl = publicUrl;

      // 4. Create syllabus entry via backend API
      await createSyllabus({
        title: formData.title,
        semester: formData.semester,
        branch: formData.branch,
        subject: formData.subject,
        description: formData.description || undefined,
        pdfUrl,
        fileSize: pdfFile.size,
        collegeId: selectedCollegeId || undefined,
      });

      toast.success("Syllabus uploaded successfully!");
      setIsOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload syllabus");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      semester: "",
      branch: "",
      subject: "",
      description: "",
    });
    setPdfFile(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Data Structures Syllabus"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="semester">Semester *</Label>
          <Select
            value={formData.semester}
            onValueChange={(value) => setFormData({ ...formData, semester: value, subject: "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sem" />
            </SelectTrigger>
            <SelectContent>
              {SEMESTER_OPTIONS.map((sem) => (
                <SelectItem key={sem.value} value={sem.value}>
                  {sem.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="branch">Branch *</Label>
          <Select
            value={formData.branch}
            onValueChange={(value) => setFormData({ ...formData, branch: value, subject: "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              {BRANCH_OPTIONS.map((branch) => (
                <SelectItem key={branch.value} value={branch.value}>
                  {branch.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subject">Subject *</Label>
          {availableSubjects.length > 0 ? (
            <Select
              value={formData.subject}
              onValueChange={(value) => setFormData({ ...formData, subject: value })}
            >
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Subject"
              required
            />
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the syllabus"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="pdf">PDF File *</Label>
        <Input
          id="pdf"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          required
        />
        {pdfFile && (
          <p className="mt-1 text-xs text-muted-foreground">
            Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOpenChange(false)}
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        {trigger && (
          <DrawerTrigger asChild>
            {trigger}
          </DrawerTrigger>
        )}
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Upload Syllabus</DrawerTitle>
            <DrawerDescription>
              Upload a syllabus PDF for students to view
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Syllabus</DialogTitle>
          <DialogDescription>
            Upload a syllabus PDF for students to view
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default UploadSyllabusDialog;
