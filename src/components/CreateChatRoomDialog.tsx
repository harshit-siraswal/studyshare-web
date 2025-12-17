import { useState } from "react";
import { Copy, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface CreateChatRoomDialogProps {
  trigger: React.ReactNode;
}

const CreateChatRoomDialog = ({ trigger }: CreateChatRoomDialogProps) => {
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [isCreated, setIsCreated] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = () => {
    if (!roomName.trim()) {
      toast({
        title: "Room name required",
        description: "Please enter a name for your chat room.",
        variant: "destructive",
      });
      return;
    }

    const code = generateRoomCode();
    setRoomCode(code);
    setIsCreated(true);
    toast({
      title: "Chat room created!",
      description: isPrivate ? "Share the code with friends to invite them." : "Your public room is now live.",
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: "Code copied!",
      description: "Room code copied to clipboard.",
    });
  };

  const handleReset = () => {
    setRoomName("");
    setIsPrivate(false);
    setRoomCode("");
    setIsCreated(false);
  };

  return (
    <Dialog onOpenChange={(open) => !open && handleReset()}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Chat Room</DialogTitle>
          <DialogDescription>
            Create a new chat room to study with friends.
          </DialogDescription>
        </DialogHeader>

        {!isCreated ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                placeholder="e.g., DSA Study Group"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {isPrivate ? <Lock className="w-4 h-4 text-primary" /> : <Globe className="w-4 h-4 text-primary" />}
                <div>
                  <p className="text-sm font-medium">{isPrivate ? "Private Room" : "Public Room"}</p>
                  <p className="text-xs text-muted-foreground">
                    {isPrivate ? "Only people with code can join" : "Anyone from college can join"}
                  </p>
                </div>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>

            <Button onClick={handleCreate} className="w-full">
              Create Room
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
              <p className="text-sm text-muted-foreground mb-2">Your room is ready!</p>
              <p className="text-2xl font-mono font-bold text-primary tracking-wider">{roomCode}</p>
            </div>

            {isPrivate && (
              <Button variant="outline" onClick={copyCode} className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                Copy Room Code
              </Button>
            )}

            <p className="text-xs text-center text-muted-foreground">
              {isPrivate 
                ? "Share this code with friends so they can join your private room."
                : "Your public room is now visible to everyone in your college."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateChatRoomDialog;
