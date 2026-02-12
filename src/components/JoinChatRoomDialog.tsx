import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Lock, Globe, Users, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { joinChatRoomById, joinChatRoom } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";

interface JoinChatRoomDialogProps {
  trigger: React.ReactNode;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  member_count: number;
  created_by: string;
}

const JoinChatRoomDialog = ({ trigger }: JoinChatRoomDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCollegeId } = useCollege();
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (open) {
      fetchRooms();
    }
  }, [open, selectedCollegeId]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      // Policy: Filter by college_id for data isolation
      const collegeId = selectedCollegeId;
      if (!collegeId) {
        setRooms([]);
        return;
      }

      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('college_id', collegeId) // Policy: College data isolation
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (room: ChatRoom) => {
    if (!user) {
      toast.error("Please login to join rooms");
      return;
    }

    // If private room, show code input
    if (room.is_private && !selectedRoom) {
      setSelectedRoom(room);
      return;
    }

    setJoining(room.id);
    try {
      // Check if already a member (read is allowed)
      const { data: existing } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_email', user.email)
        .maybeSingle();

      if (existing) {
        toast.success("You're already a member!");
        setOpen(false);
        navigate(`/chatroom/${room.id}`);
        return;
      }

      // For private rooms, use join by code
      if (room.is_private) {
        await joinChatRoom(joinCode, selectedCollegeId || undefined);
        toast.success("Joined room successfully!");
      } else {
        // For public rooms, join directly by ID
        await joinChatRoomById(
          room.id,
          user.displayName || user.email?.split('@')[0] || 'User',
          selectedCollegeId || undefined
        );
        toast.success("Joined room successfully!");
      }

      setOpen(false);
      setSelectedRoom(null);
      setJoinCode("");
      navigate(`/chatroom/${room.id}`);
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast.error(error.message || "Failed to join room");
    } finally {
      setJoining(null);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        setSelectedRoom(null);
        setJoinCode("");
        setSearchQuery("");
      }
    }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Join a Room</DialogTitle>
          <DialogDescription>
            Browse and join existing chat rooms.
          </DialogDescription>
        </DialogHeader>

        {selectedRoom ? (
          // Code input for private room
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold">{selectedRoom.name}</h3>
                <Badge variant="outline">Private</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{selectedRoom.description}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="joinCode">Room Code</Label>
              <Input
                id="joinCode"
                placeholder="Enter 6-digit room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="font-mono text-center text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Ask the room admin for the invite code
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRoom(null);
                  setJoinCode("");
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => handleJoin(selectedRoom)}
                disabled={joinCode.length < 6 || !!joining}
                className="flex-1"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Room"
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Room list
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {filteredRooms.map((room) => (
                    <Card
                      key={room.id}
                      className="p-4 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleJoin(room)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {room.is_private ? (
                              <Lock className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Globe className="w-4 h-4 text-primary" />
                            )}
                            <h3 className="font-semibold truncate">{room.name}</h3>
                            {room.is_private && (
                              <Badge variant="outline" className="text-xs">Private</Badge>
                            )}
                          </div>
                          {room.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {room.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{room.member_count} members</span>
                            </div>
                            <span>by {room.created_by?.split('@')[0] || 'Unknown'}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          disabled={joining === room.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoin(room);
                          }}
                        >
                          {joining === room.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Join"
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}

                  {filteredRooms.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchQuery ? "No rooms found" : "No rooms available"}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default JoinChatRoomDialog;
