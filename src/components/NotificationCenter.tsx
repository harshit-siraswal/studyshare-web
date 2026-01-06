// src/components/NotificationCenter.tsx
// Notification center with follow request accept/reject buttons
// Fetches real notifications and follow_requests from database

import { useState, useEffect } from "react";
import { Bell, Check, X, MessageSquare, FileText, Users, Megaphone, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "../supabase";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { toast } from "sonner";

interface FollowRequest {
  id: string;
  requester_email: string;
  requester_name?: string;
  status: string;
  created_at: string;
}

interface Notification {
  id: string;
  type: "message" | "resource" | "follow" | "notice" | "follow_request";
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

const typeIcons = {
  message: MessageSquare,
  resource: FileText,
  follow: Users,
  follow_request: UserPlus,
  notice: Megaphone,
};

const typeColors = {
  message: "text-blue-500 bg-blue-500/10",
  resource: "text-green-500 bg-green-500/10",
  follow: "text-purple-500 bg-purple-500/10",
  follow_request: "text-orange-500 bg-orange-500/10",
  notice: "text-amber-500 bg-amber-500/10",
};

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const { user } = useAuth();
  const { selectedCollege } = useCollege();

  useEffect(() => {
    if (user?.email && open) {
      fetchNotifications();
      fetchFollowRequests();
    }
  }, [user, open, selectedCollege]);

  const fetchNotifications = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchFollowRequests = async () => {
    if (!user?.email) return;

    try {
      // Get pending follow requests where current user is the target
      const { data, error } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('target_email', user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFollowRequests(data || []);
    } catch (error) {
      console.error('Error fetching follow requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (request: FollowRequest) => {
    if (!user?.email) return;
    setActionLoading(request.id);

    try {
      // 1. Update request status to accepted
      const { error: updateError } = await supabase
        .from('follow_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // 2. Add to follows table
      const { error: followError } = await supabase
        .from('follows')
        .insert([{
          follower_email: request.requester_email,
          following_email: user.email,
        }]);

      if (followError && followError.code !== '23505') throw followError;

      // 3. Create notification for requester
      await supabase.from('notifications').insert([{
        user_email: request.requester_email,
        type: 'follow',
        title: 'Follow Request Accepted',
        message: `${user.email.split('@')[0]} accepted your follow request`,
        read: false,
        college_id: selectedCollege?.domain || 'kiet.edu',
      }]);

      // 4. Remove from local state
      setFollowRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success('Follow request accepted!');
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (request: FollowRequest) => {
    setActionLoading(request.id);

    try {
      const { error } = await supabase
        .from('follow_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);

      if (error) throw error;

      setFollowRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success('Follow request declined');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to decline request');
    } finally {
      setActionLoading(null);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.email) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_email', user.email);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const removeNotification = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length + followRequests.length;
  const totalItems = notifications.length + followRequests.length;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : totalItems === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Follow Requests Section */}
              {followRequests.map((request) => (
                <div
                  key={`request-${request.id}`}
                  className="p-3 bg-orange-500/5"
                >
                  <div className="flex gap-3">
                    <div className={cn("p-2 rounded-lg shrink-0", typeColors.follow_request)}>
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Follow Request</p>
                      <p className="text-xs text-muted-foreground">
                        {request.requester_email.split('@')[0]} wants to follow you
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(request.created_at)}
                      </p>

                      {/* Accept/Reject Buttons */}
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs"
                          onClick={() => handleAcceptRequest(request)}
                          disabled={actionLoading === request.id}
                        >
                          {actionLoading === request.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleRejectRequest(request)}
                          disabled={actionLoading === request.id}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Regular Notifications */}
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                return (
                  <div
                    key={`notif-${notification.id}`}
                    className={cn(
                      "p-3 flex gap-3 hover:bg-muted/50 transition-colors cursor-pointer group",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className={cn("p-2 rounded-lg shrink-0", typeColors[notification.type] || typeColors.notice)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{notification.title}</p>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
