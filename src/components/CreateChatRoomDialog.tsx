import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "../supabase";
import { createChatRoom } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";

interface CreateChatRoomDialogProps {
  trigger: React.ReactNode;
}

const CreateChatRoomDialog = ({ trigger }: CreateChatRoomDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCollege } = useCollege();
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCreate = async () => {
    if (!user) {
      toast.error("Please login to create a room");
      return;
    }

    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    setCreating(true);
    try {
      // Check if room name already exists (read is still allowed)
      const { data: existing } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('name', roomName.trim())
        .maybeSingle();

      if (existing) {
        toast.error("Room name already taken. Please choose another name.");
        setCreating(false);
        return;
      }

      // Use backend API for secure room creation
      const result = await createChatRoom(
        roomName.trim(),
        description.trim() || null,
        isPrivate,
        selectedCollege?.domain || 'kiet.edu'
      );

      toast.success("Room created successfully!");

      // Show join code for private rooms
      if (result.joinCode && isPrivate) {
        toast.info(`Share this code to invite others: ${result.joinCode}`, { duration: 15000 });
      }

      if (result.expiresAt) {
        toast.info(`Room expires on ${new Date(result.expiresAt).toLocaleDateString()}`);
      }

      setOpen(false);
      handleReset();

      // Navigate to the new room
      navigate(`/chatroom/${result.id}`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast.error(error.message || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const handleReset = () => {
    setRoomName("");
    setDescription("");
    setIsPrivate(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) handleReset();
    }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Chat Room</DialogTitle>
          <DialogDescription>
            Create a new room to discuss and share with others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name *</Label>
            <Input
              id="room-name"
              placeholder="e.g., DSA Study Group"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What's this room about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {isPrivate ? <Lock className="w-4 h-4 text-amber-500" /> : <Globe className="w-4 h-4 text-primary" />}
              <div>
                <p className="text-sm font-medium">{isPrivate ? "Private Room" : "Public Room"}</p>
                <p className="text-xs text-muted-foreground">
                  {isPrivate ? "Requires code to join" : "Anyone can join directly"}
                </p>
              </div>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          {isPrivate && (
            <p className="text-sm text-muted-foreground bg-amber-500/10 p-3 rounded-lg">
              💡 A unique join code will be auto-generated. Share it with people you want to invite.
            </p>
          )}

          <Button onClick={handleCreate} className="w-full" disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Room"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChatRoomDialog;
