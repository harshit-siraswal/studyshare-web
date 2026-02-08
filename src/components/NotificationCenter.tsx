// src/components/NotificationCenter.tsx
// Notification center with follow request accept/reject buttons
// Fetches real notifications and follow_requests from database

import { useState, useEffect, useMemo } from "react";
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
import {
  approveFollowRequest,
  rejectFollowRequest,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  getPendingFollowRequests,
  type FollowRequest
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "message" | "resource" | "follow" | "notice" | "follow_request";
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  is_read?: boolean;
}

const normalizeNotification = (notification: any): Notification => ({
  ...notification,
  read: Boolean(notification?.read ?? notification?.is_read),
});

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
  const [actionLoading, setActionLoading] = useState<{ id: string; action: 'accept' | 'reject' } | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState<"markAll" | "clearAll" | null>(null);
  const [open, setOpen] = useState(false);

  const { user } = useAuth();
  const { selectedCollege } = useCollege();

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
      setNotifications((data || []).map(normalizeNotification));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchFollowRequests = async () => {
    if (!user?.email) return;

    try {
      // Get pending follow requests via backend API
      const result = await getPendingFollowRequests();
      setFollowRequests(result.requests || []);
    } catch (error) {
      console.error('Error fetching follow requests:', error);
    }
  };

  const refreshData = async (showLoading = true) => {
    if (!user?.email) {
      setNotifications([]);
      setFollowRequests([]);
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    try {
      await Promise.all([fetchNotifications(), fetchFollowRequests()]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    refreshData(true);
  }, [user?.email, selectedCollege]);

  useEffect(() => {
    if (open) {
      refreshData(false);
    }
  }, [open]);

  const handleAcceptRequest = async (request: FollowRequest) => {
    if (!user?.email) return;
    setActionLoading({ id: request.id, action: 'accept' });

    try {
      // Use backend API for secure follow request approval
      await approveFollowRequest(request.id);

      // Get requester name for success message
      const requesterName = getRequesterLabel(request);

      // Update local state
      setFollowRequests(prev =>
        prev.map(r => (r.id === request.id ? { ...r, status: 'approved' } : r))
      );
      toast.success(`Accepted follow request from ${requesterName}`);
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast.error(error.message || 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (request: FollowRequest) => {
    setActionLoading({ id: request.id, action: 'reject' });

    try {
      // Use backend API for secure rejection
      await rejectFollowRequest(request.id);

      // Get requester name for success message
      const requesterName = getRequesterLabel(request);

      setFollowRequests(prev =>
        prev.map(r => (r.id === request.id ? { ...r, status: 'rejected' } : r))
      );
      toast.success(`Declined follow request from ${requesterName}`);
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to decline request');
    } finally {
      setActionLoading(null);
    }
  };

  const markAsRead = async (id: string) => {
    const current = notifications.find(n => n.id === id);
    if (current?.read) return;

    try {
      // Use backend API for secure update
      await markNotificationRead(id);

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsReadHandler = async () => {
    if (!user?.email) return;
    if (notifications.every(n => n.read)) return;

    try {
      setBulkActionLoading("markAll");
      // Use backend API for secure bulk update
      await markAllNotificationsRead();

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setBulkActionLoading(null);
    }
  };

  const removeNotificationHandler = async (id: string) => {
    try {
      // Use backend API for secure deletion
      await deleteNotification(id);

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const clearAllNotificationsHandler = async () => {
    if (!user?.email) return;

    try {
      setBulkActionLoading("clearAll");
      // Use backend API for secure bulk deletion
      await deleteAllNotifications();

      setNotifications([]);
      setFollowRequests(prev => prev.filter(r => r.status === 'pending'));
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    } finally {
      setBulkActionLoading(null);
    }
  };

  const dismissFollowRequest = (requestId: string) => {
    setFollowRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const pendingRequests = useMemo(
    () => followRequests.filter(r => r.status === 'pending'),
    [followRequests]
  );
  const resolvedRequests = useMemo(
    () => followRequests.filter(r => r.status !== 'pending'),
    [followRequests]
  );

  const unreadCount = notifications.filter(n => !n.read).length + pendingRequests.length;
  const totalItems = notifications.length + followRequests.length;

  const getRequesterLabel = (request: FollowRequest) => {
    const name = request.requesterName?.trim();
    if (name) return name;
    const email = request.requesterEmail;
    if (email) return email.split('@')[0];
    return 'Someone';
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Recently';
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
              {[...pendingRequests, ...resolvedRequests].map((request) => {
                const isAccepting = actionLoading?.id === request.id && actionLoading.action === 'accept';
                const isRejecting = actionLoading?.id === request.id && actionLoading.action === 'reject';
                const isBusy = actionLoading?.id === request.id;

                return (
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
                          {getRequesterLabel(request)} wants to follow you
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTime(request.createdAt)}
                        </p>

                        {/* Accept/Reject Buttons */}
                        {request.status === 'pending' ? (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              onClick={() => handleAcceptRequest(request)}
                              disabled={isBusy}
                            >
                              {isAccepting ? (
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
                              disabled={isBusy}
                            >
                              {isRejecting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <X className="w-3 h-3 mr-1" />
                                  Decline
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${request.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                }`}
                            >
                              {request.status === 'approved' ? 'Accepted' : 'Declined'}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissFollowRequest(request.id);
                              }}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

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
                        removeNotificationHandler(notification.id);
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

        {/* Footer Actions */}
        {(notifications.length > 0 || resolvedRequests.length > 0) && (
          <div className="p-2 border-t border-border grid grid-cols-2 gap-2 bg-background">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={markAllAsReadHandler}
              disabled={loading || bulkActionLoading !== null || notifications.every(n => n.read)}
            >
              {bulkActionLoading === "markAll" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Mark all read"
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs h-8"
              onClick={clearAllNotificationsHandler}
              disabled={loading || bulkActionLoading !== null}
            >
              {bulkActionLoading === "clearAll" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Clear all"
              )}
            </Button>
          </div>
        )}
      </PopoverContent >
    </Popover >
  );
};

export default NotificationCenter;
