import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Video, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { createResource, getResourceUploadUrl } from "@/lib/api";

interface UploadResourceDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Configuration data
const SEMESTERS = [
  { value: "1", label: "Semester 1" },
  { value: "2", label: "Semester 2" },
  { value: "3", label: "Semester 3" },
  { value: "4", label: "Semester 4" },
  { value: "5", label: "Semester 5" },
  { value: "6", label: "Semester 6" },
  { value: "7", label: "Semester 7" },
  { value: "8", label: "Semester 8" },
];

const BRANCHES = [
  { value: "cse", label: "Computer Science & Engineering" },
  { value: "ece", label: "Electronics & Communication" },
  { value: "eee", label: "Electrical & Electronics" },
  { value: "me", label: "Mechanical Engineering" },
  { value: "ce", label: "Civil Engineering" },
  { value: "aiml", label: "AI & Machine Learning" },
  { value: "ds", label: "Data Science" },
  { value: "it", label: "Information Technology" },
];

const SUBJECTS = {
  cse: ["Data Structures", "Algorithms", "DBMS", "Operating Systems", "Computer Networks", "Software Engineering"],
  ece: ["Digital Electronics", "Signals & Systems", "Communication Systems", "VLSI", "Microprocessors"],
  eee: ["Power Systems", "Control Systems", "Electrical Machines", "Power Electronics"],
  me: ["Thermodynamics", "Fluid Mechanics", "Machine Design", "Manufacturing"],
  ce: ["Structural Analysis", "Surveying", "Construction Management", "Geotechnical Engineering"],
  aiml: ["Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Data Mining"],
  ds: ["Statistics", "Data Mining", "Big Data Analytics", "Machine Learning", "Data Visualization"],
  it: ["Web Development", "Database Systems", "Networking", "Cloud Computing", "Cybersecurity"],
};

const RESOURCE_TYPES = [
  { value: "notes", label: "Notes" },
  { value: "pyq", label: "PYQ (Previous Year Questions)" },
];

const UploadResourceDialog = ({ trigger, open: controlledOpen, onOpenChange }: UploadResourceDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const [type, setType] = useState<"notes" | "video">("notes");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { selectedCollege } = useCollege();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [formData, setFormData] = useState({
    title: "",
    semester: "",
    branch: "",
    subject: "",
    chapter: "",
    topic: "",
    description: "",
    resourceType: "notes",
    videoUrl: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.oasis.opendocument.text",
        "application/vnd.oasis.opendocument.presentation",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];
      const validExtensions = [".pdf", ".doc", ".docx", ".odt", ".odp", ".ppt", ".pptx"];
      const lowerName = file.name.toLowerCase();
      const isValidType = validTypes.includes(file.type) || validExtensions.some(ext => lowerName.endsWith(ext));
      if (!isValidType) {
        toast.error("Please upload a PDF, DOC/DOCX, ODT/ODP, or PPTX file");
        return;
      }
      if (lowerName.endsWith(".ppt")) {
        toast.error("Legacy .ppt is not supported. Please convert to .pptx.");
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
    }
  };

  const getFileContentType = (file: File): string => {
    if (file.type) return file.type;
    const name = file.name.toLowerCase();
    if (name.endsWith(".pdf")) return "application/pdf";
    if (name.endsWith(".doc")) return "application/msword";
    if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (name.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
    if (name.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (name.endsWith(".odt")) return "application/vnd.oasis.opendocument.text";
    if (name.endsWith(".odp")) return "application/vnd.oasis.opendocument.presentation";
    return "application/octet-stream";
  };

  const uploadFileToR2 = async (file: File): Promise<string> => {
    try {
      console.log('📤 Uploading to R2:', file.name);

      const { uploadUrl, publicUrl } = await getResourceUploadUrl(file.name);

      const fileUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const contentType = getFileContentType(file);

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            const uploadProgress = 30 + (progress * 0.3); // 30% to 60%
            setUploadProgress(Math.round(uploadProgress));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(publicUrl);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.addEventListener('abort', () => reject(new Error('Upload was aborted')));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.setRequestHeader('Cache-Control', 'max-age=31536000');
        xhr.send(file);
      });

      console.log('✅ Upload successful:', fileUrl);
      return fileUrl;

    } catch (error: unknown) {
      console.error('❌ Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file to R2';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!formData.semester) {
      toast.error("Please select a semester");
      return;
    }
    if (!formData.branch) {
      toast.error("Please select a branch");
      return;
    }
    if (!formData.subject) {
      toast.error("Please select a subject");
      return;
    }

    if (type === "notes" && !selectedFile) {
      toast.error("Please upload a file");
      return;
    }

    if (type === "video" && !formData.videoUrl.trim()) {
      toast.error("Please enter a video URL");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      let fileUrl = "";

      // Upload file to R2 if it's a notes/document
      if (type === "notes" && selectedFile) {
        setUploadProgress(10);
        fileUrl = await uploadFileToR2(selectedFile);
        setUploadProgress(60);
      }

      setUploadProgress(80);

      // Get reCAPTCHA token
      let recaptchaToken = '';
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha('upload_resource');
        } catch (recaptchaError) {
          console.warn('reCAPTCHA failed, proceeding without token:', recaptchaError);
        }
      }

      // Create resource via backend API (secure)
      await createResource({
        title: formData.title,
        type: type === "notes" ? formData.resourceType : "video",
        description: formData.description || undefined,
        url: type === "video" ? formData.videoUrl : undefined,
        filePath: type === "notes" ? fileUrl : undefined,
        branch: formData.branch,
        semester: formData.semester,
        subject: formData.subject,
        recaptchaToken,
      });

      setUploadProgress(100);

      toast.success("✅ Resource shared! Waiting for admin approval.");

      // Reset form
      setFormData({
        title: "",
        semester: "",
        branch: "",
        subject: "",
        chapter: "",
        topic: "",
        description: "",
        resourceType: "notes",
        videoUrl: "",
      });
      setSelectedFile(null);
      setIsOpen(false);
      setUploadProgress(0);

      // Refresh the page to show new resource
      window.location.reload();

    } catch (error: unknown) {
      console.error("Error uploading resource:", error);
      // Show more detailed error message
      let errorMessage = "Failed to upload resource. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("Detailed error:", errorMessage);
      toast.error(errorMessage);
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
      chapter: "",
      topic: "",
      description: "",
      resourceType: "notes",
      videoUrl: "",
    });
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const availableSubjects = formData.branch
    ? SUBJECTS[formData.branch as keyof typeof SUBJECTS] || []
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={(val) => {
      setIsOpen(val);
      if (!val) resetForm();
    }}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share a Resource</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Upload notes or suggest a video to help your peers.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <Tabs value={type} onValueChange={(v) => setType(v as "notes" | "video")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Binary Search Tree Notes"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              disabled={uploading}
            />
          </div>

          {/* Semester, Branch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Semester */}
            <div className="space-y-2">
              <Label htmlFor="semester">
                Semester <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.semester}
                onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}
                disabled={uploading}
              >
                <SelectTrigger id="semester">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map(sem => (
                    <SelectItem key={sem.value} value={sem.value}>
                      {sem.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <Label htmlFor="branch">
                Branch <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.branch}
                onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value, subject: "" }))}
                disabled={uploading}
              >
                <SelectTrigger id="branch">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map(branch => (
                    <SelectItem key={branch.value} value={branch.value}>
                      {branch.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject, Chapter, Topic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.subject}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                disabled={uploading || !formData.branch}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chapter */}
            <div className="space-y-2">
              <Label htmlFor="chapter">Chapter</Label>
              <Input
                id="chapter"
                placeholder="e.g., Chapter 3"
                value={formData.chapter}
                onChange={(e) => setFormData(prev => ({ ...prev, chapter: e.target.value }))}
                disabled={uploading}
              />
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Trees"
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                disabled={uploading}
              />
            </div>
          </div>

          {/* Resource Type (for notes) */}
          {type === "notes" && (
            <div className="space-y-2">
              <Label htmlFor="resourceType">Resource Type</Label>
              <Select
                value={formData.resourceType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, resourceType: value }))}
                disabled={uploading}
              >
                <SelectTrigger id="resourceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map(rt => (
                    <SelectItem key={rt.value} value={rt.value}>
                      {rt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Brief Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the content..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[80px]"
              disabled={uploading}
            />
          </div>

          {/* File Upload or Video URL */}
          {type === "notes" ? (
            <div className="space-y-2">
              <Label>
                Upload File <span className="text-destructive">*</span>
              </Label>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-foreground mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC/DOCX, ODT/ODP, PPTX up to 10MB
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.odt,.odp,.pptx"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="videoUrl">
                Video URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={formData.videoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Paste a YouTube, Vimeo, or other video URL
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {type === "notes" ? "Upload Notes" : "Share Video"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadResourceDialog;
