import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Bell, BellOff, RefreshCw, Trash2, UserX, UserCheck, Copy, Loader2, Shield, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
    toggleRoomMute,
    regenerateRoomCode,
    banRoomMember,
    unbanRoomMember,
    deleteRoom,
    leaveChatRoom,
    getRoomMembers,
    RoomMember,
} from "@/lib/api";

interface RoomSettingsModalProps {
    roomId: string;
    roomName: string;
    roomCode?: string;
    isAdmin: boolean;
    isMuted?: boolean;
    onRoomDeleted?: () => void;
    onCodeRegenerated?: (newCode: string) => void;
    trigger?: React.ReactNode;
}

const RoomSettingsModal = ({
    roomId,
    roomName,
    roomCode,
    isAdmin,
    isMuted = false,
    onRoomDeleted,
    onCodeRegenerated,
    trigger,
}: RoomSettingsModalProps) => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [muted, setMuted] = useState(isMuted);
    const [currentCode, setCurrentCode] = useState(roomCode);
    const [members, setMembers] = useState<RoomMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [banningUser, setBanningUser] = useState<string | null>(null);

    useEffect(() => {
        if (open && isAdmin) {
            fetchMembers();
        }
    }, [open, isAdmin]);

    const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
            const { members } = await getRoomMembers(roomId);
            setMembers(members);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleMuteToggle = async (newMuted: boolean) => {
        try {
            await toggleRoomMute(roomId, newMuted);
            setMuted(newMuted);
            toast.success(newMuted ? "Notifications muted" : "Notifications enabled");
        } catch (error: any) {
            toast.error(error.message || "Failed to update settings");
        }
    };

    const handleRegenerateCode = async () => {
        setRegenerating(true);
        try {
            const { newCode } = await regenerateRoomCode(roomId);
            setCurrentCode(newCode);
            onCodeRegenerated?.(newCode);
            toast.success("Room code regenerated");
        } catch (error: any) {
            toast.error(error.message || "Failed to regenerate code");
        } finally {
            setRegenerating(false);
        }
    };

    const handleDeleteRoom = async () => {
        setDeleting(true);
        try {
            await deleteRoom(roomId);
            toast.success("Room deleted");
            setOpen(false);
            onRoomDeleted?.();
            navigate("/chatroom");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete room");
        } finally {
            setDeleting(false);
        }
    };

    const handleLeaveRoom = async () => {
        setLeaving(true);
        try {
            await leaveChatRoom(roomId);
            toast.success("Left room successfully");
            setOpen(false);
            onRoomDeleted?.(); // Trigger refresh/navigate
            navigate("/chatroom");
        } catch (error: any) {
            toast.error(error.message || "Failed to leave room");
        } finally {
            setLeaving(false);
        }
    };

    const handleBanUser = async (targetEmail: string) => {
        setBanningUser(targetEmail);
        try {
            await banRoomMember(roomId, targetEmail);
            toast.success("Member banned");
            fetchMembers();
        } catch (error: any) {
            toast.error(error.message || "Failed to ban member");
        } finally {
            setBanningUser(null);
        }
    };

    const handleUnbanUser = async (targetEmail: string) => {
        setBanningUser(targetEmail);
        try {
            await unbanRoomMember(roomId, targetEmail);
            toast.success("Member unbanned");
            fetchMembers();
        } catch (error: any) {
            toast.error(error.message || "Failed to unban member");
        } finally {
            setBanningUser(null);
        }
    };

    const copyCode = () => {
        if (currentCode) {
            navigator.clipboard.writeText(currentCode);
            toast.success("Code copied!");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Room Settings
                    </DialogTitle>
                    <DialogDescription>
                        Manage settings for {roomName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* User Settings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Your Settings</h3>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                                {muted ? <BellOff className="w-4 h-4 text-muted-foreground" /> : <Bell className="w-4 h-4 text-primary" />}
                                <div>
                                    <p className="text-sm font-medium">Mute Notifications</p>
                                    <p className="text-xs text-muted-foreground">
                                        {muted ? "You won't receive notifications from this room" : "Get notified when someone posts"}
                                    </p>
                                </div>
                            </div>
                            <Switch checked={muted} onCheckedChange={handleMuteToggle} />
                        </div>
                    </div>

                    {/* Leave Room Option */}
                    <div className="pt-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full" disabled={isAdmin}>
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Leave Room
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Leave Room?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to leave "{roomName}"? You won't receive messages from this room anymore.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleLeaveRoom}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        disabled={leaving}
                                    >
                                        {leaving ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                            <LogOut className="w-4 h-4 mr-2" />
                                        )}
                                        Leave
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        {isAdmin && (
                            <p className="text-xs text-muted-foreground text-center mt-2">
                                Admins cannot leave rooms they created. Delete the room instead.
                            </p>
                        )}
                    </div>

                    {/* Admin Settings */}
                    {isAdmin && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-primary" />
                                    Admin Settings
                                </h3>

                                {/* Room Code */}
                                {currentCode && (
                                    <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                                        <Label className="text-xs text-muted-foreground">Room Code</Label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 text-lg font-mono bg-background px-3 py-2 rounded text-center">
                                                {currentCode}
                                            </code>
                                            <Button variant="ghost" size="icon" onClick={copyCode}>
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRegenerateCode}
                                                disabled={regenerating}
                                            >
                                                {regenerating ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Share this code to invite members. Regenerating will invalidate the old code.
                                        </p>
                                    </div>
                                )}

                                {/* Members Management */}
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Users className="w-3 h-3" />
                                        Members ({members.length})
                                    </Label>
                                    {loadingMembers ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[200px] rounded border">
                                            <div className="p-2 space-y-1">
                                                {members.map((member) => (
                                                    <div
                                                        key={member.user_email}
                                                        className="flex items-center justify-between p-2 rounded hover:bg-muted"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="text-sm truncate">{member.user_name}</span>
                                                            {member.is_banned && (
                                                                <Badge variant="destructive" className="text-xs">Banned</Badge>
                                                            )}
                                                        </div>
                                                        {member.is_banned ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleUnbanUser(member.user_email)}
                                                                disabled={banningUser === member.user_email}
                                                            >
                                                                {banningUser === member.user_email ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <UserCheck className="w-4 h-4 mr-1" />
                                                                        Unban
                                                                    </>
                                                                )}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => handleBanUser(member.user_email)}
                                                                disabled={banningUser === member.user_email}
                                                            >
                                                                {banningUser === member.user_email ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <UserX className="w-4 h-4 mr-1" />
                                                                        Ban
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </div>

                                {/* Delete Room */}
                                <div className="pt-4">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="w-full">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete Room
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Room?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete "{roomName}" and all its messages.
                                                    This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleDeleteRoom}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    disabled={deleting}
                                                >
                                                    {deleting ? (
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                    )}
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </>
                    )
                    }
                </div >
            </DialogContent >
        </Dialog >
    );
};

export default RoomSettingsModal;
