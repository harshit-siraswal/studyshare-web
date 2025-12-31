import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../supabase";

interface Resource {
  id: string;
  title: string;
  semester: string;
  branch: string;
  subject: string;
  chapter?: string;
  topic?: string;
  description?: string;
  type: string;
}

interface EditResourceDialogProps {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

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

const EditResourceDialog = ({ resource, open, onOpenChange, onSuccess }: EditResourceDialogProps) => {
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    title: resource?.title || "",
    semester: resource?.semester || "",
    branch: resource?.branch || "",
    subject: resource?.subject || "",
    chapter: resource?.chapter || "",
    topic: resource?.topic || "",
    description: resource?.description || "",
  });

  // Update form data when resource changes
  useState(() => {
    if (resource) {
      setFormData({
        title: resource.title,
        semester: resource.semester,
        branch: resource.branch,
        subject: resource.subject,
        chapter: resource.chapter || "",
        topic: resource.topic || "",
        description: resource.description || "",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resource?.id) return;

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setUpdating(true);

    try {
      const { error } = await supabase
        .from('resources')
        .update({
          title: formData.title,
          semester: formData.semester,
          branch: formData.branch,
          subject: formData.subject,
          chapter: formData.chapter || null,
          topic: formData.topic || null,
          description: formData.description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resource.id);

      if (error) throw error;

      toast.success("Resource updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating resource:", error);
      toast.error(error.message || "Failed to update resource");
    } finally {
      setUpdating(false);
    }
  };

  const availableSubjects = formData.branch 
    ? SUBJECTS[formData.branch as keyof typeof SUBJECTS] || []
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Update the details of your resource
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              placeholder="e.g., Binary Search Tree Notes"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              disabled={updating}
            />
          </div>

          {/* Semester, Branch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-semester">Semester</Label>
              <Select
                value={formData.semester}
                onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}
                disabled={updating}
              >
                <SelectTrigger id="edit-semester">
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

            <div className="space-y-2">
              <Label htmlFor="edit-branch">Branch</Label>
              <Select
                value={formData.branch}
                onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value, subject: "" }))}
                disabled={updating}
              >
                <SelectTrigger id="edit-branch">
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
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject</Label>
              <Select
                value={formData.subject}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                disabled={updating || !formData.branch}
              >
                <SelectTrigger id="edit-subject">
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

            <div className="space-y-2">
              <Label htmlFor="edit-chapter">Chapter</Label>
              <Input
                id="edit-chapter"
                placeholder="e.g., Chapter 3"
                value={formData.chapter}
                onChange={(e) => setFormData(prev => ({ ...prev, chapter: e.target.value }))}
                disabled={updating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-topic">Topic</Label>
              <Input
                id="edit-topic"
                placeholder="e.g., Trees"
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                disabled={updating}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Brief Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Brief description of the content..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[80px]"
              disabled={updating}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditResourceDialog;