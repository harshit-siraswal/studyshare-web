import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface JoinChatRoomDialogProps {
  trigger: React.ReactNode;
}

const JoinChatRoomDialog = ({ trigger }: JoinChatRoomDialogProps) => {
  const [roomCode, setRoomCode] = useState("");

  const handleJoin = () => {
    if (roomCode.trim().length !== 6) {
      toast({
        title: "Invalid code",
        description: "Room codes are 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    // Mock joining - in reality would validate against database
    toast({
      title: "Joining room...",
      description: "Looking for room with code: " + roomCode.toUpperCase(),
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Private Room</DialogTitle>
          <DialogDescription>
            Enter the room code shared by your friend.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="join-code">Room Code</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="join-code"
                placeholder="Enter 6-character code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="pl-10 font-mono text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
          </div>

          <Button onClick={handleJoin} className="w-full" disabled={roomCode.length !== 6}>
            Join Room
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinChatRoomDialog;
