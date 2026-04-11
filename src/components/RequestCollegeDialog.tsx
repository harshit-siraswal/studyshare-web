import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/support";

interface RequestCollegeDialogProps {
  trigger: React.ReactNode;
}

const RequestCollegeDialog = ({ trigger }: RequestCollegeDialogProps) => {
  const [collegeName, setCollegeName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!collegeName.trim()) {
      toast.error("Please enter the college name");
      return;
    }

    setIsSubmitting(true);

    try {
      const mailSubject = encodeURIComponent("StudyShare College Add Request");
      const mailBody = encodeURIComponent(
        [
          "Hi StudyShare Support Team,",
          "",
          `Please add this college: ${collegeName.trim()}`,
          message.trim() ? `Additional details: ${message.trim()}` : null,
          "",
          "Thanks.",
        ]
          .filter(Boolean)
          .join("\n"),
      );

      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${mailSubject}&body=${mailBody}`;

      toast.success("Email draft opened", {
        description: `Send the draft to ${SUPPORT_EMAIL} so we can add your college quickly.`,
      });

      setCollegeName("");
      setMessage("");
      setOpen(false);
    } catch (error) {
      toast.error(`Could not open your email app. Please write to ${SUPPORT_EMAIL}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request to Add College</DialogTitle>
          <DialogDescription>
            Can't find your college? We will open an email draft to {SUPPORT_EMAIL}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="college-name">College/University Name *</Label>
            <Input
              id="college-name"
              placeholder="e.g., Stanford University"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Any additional details about the college..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestCollegeDialog;
