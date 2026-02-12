// src/components/NotificationButton.tsx
// Notification bell button with dropdown
// FIX: Uses Firebase Auth, includes follow request accept/reject

import { useState, useEffect, useMemo } from 'react';
import { Bell, Check, X, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  approveFollowRequest,
  rejectFollowRequest,
  markNotificationRead,
  markAllNotificationsRead,
  getPendingFollowRequests,
  deleteAllNotifications,
  getNotifications,
  type FollowRequest
} from '@/lib/api';
import { useCollege } from '@/context/CollegeContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  resource_id?: string;
  resource_title?: string;
  read: boolean;
  created_at: string;
  is_read?: boolean;
}

const normalizeNotification = (notification: any): Notification => ({
  ...notification,
  read: Boolean(notification?.read ?? notification?.is_read),
});

const NotificationButton = () => {
  const { selectedCollege } = useCollege();
  const { user } = useAuth(); // FIX: Use Firebase Auth

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{ id: string; action: 'accept' | 'reject' } | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState<"markAll" | "clearAll" | null>(null);
  const [open, setOpen] = useState(false);

  const pendingRequests = useMemo(
    () => followRequests.filter(r => r.status === 'pending'),
    [followRequests]
  );
  const resolvedRequests = useMemo(
    () => followRequests.filter(r => r.status !== 'pending'),
    [followRequests]
  );

  const unreadCount = useMemo(() => {
    const unreadNotifs = notifications.filter(n => !n.read).length;
    return unreadNotifs + pendingRequests.length;
  }, [notifications, pendingRequests]);

  useEffect(() => {
    refreshData(true);
  }, [user, selectedCollege]);

  useEffect(() => {
    if (open) {
      refreshData(false);
    }
  }, [open]);

  const fetchNotifications = async () => {
    if (!user?.email) return;

    try {
      const data = await getNotifications({ limit: 10 });
      const rows = Array.isArray(data?.notifications) ? data.notifications : [];
      setNotifications(rows.map(normalizeNotification));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchFollowRequests = async () => {
    if (!user?.email) return;

    try {
      // Get pending follow requests via backend API
      const result = await getPendingFollowRequests();
      const requests = result.requests || [];

      setFollowRequests(requests);
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

  const handleAcceptRequest = async (request: FollowRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.email) return;
    setActionLoading({ id: request.id, action: 'accept' });

    try {
      // Use backend API for secure approval
      await approveFollowRequest(request.id);

      // Update local state
      setFollowRequests(prev =>
        prev.map(r => (r.id === request.id ? { ...r, status: 'accepted' } : r))
      );
      toast.success('Follow request accepted!');
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast.error(error.message || 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (request: FollowRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading({ id: request.id, action: 'reject' });

    try {
      // Use backend API for secure rejection
      await rejectFollowRequest(request.id);

      setFollowRequests(prev =>
        prev.map(r => (r.id === request.id ? { ...r, status: 'rejected' } : r))
      );
      toast.success('Follow request declined');
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to decline request');
    } finally {
      setActionLoading(null);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const current = notifications.find(n => n.id === notificationId);
    if (current?.read) return;

    try {
      // Use backend API for secure update
      await markNotificationRead(notificationId);

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.email) return;
    if (notifications.every(n => n.read)) return;

    try {
      setBulkActionLoading("markAll");
      // Use backend API for secure bulk update
      await markAllNotificationsRead();

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setBulkActionLoading(null);
    }
  };

  const clearAllNotifications = async () => {
    if (!user?.email) return;

    try {
      setBulkActionLoading("clearAll");
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'resource_approved':
        return '✅';
      case 'resource_rejected':
        return '❌';
      case 'resource_pending':
        return '⏰';
      case 'follow':
        return '👤';
      case 'follow_request':
        return '🤝';
      default:
        return '📢';
    }
  };

  const getRequesterLabel = (request: FollowRequest) => {
    const name = request.requesterName?.trim();
    if (name) return name;
    const email = request.requesterEmail;
    if (email) return email.split('@')[0];
    return 'Someone';
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
        </div>

        {/* Follow Requests Section */}
        {followRequests.length > 0 && (
          <>
            <div className="px-3 py-2 bg-orange-500/10 border-b">
              <p className="text-xs font-medium text-orange-600">
                Follow Requests ({pendingRequests.length} pending{resolvedRequests.length > 0 ? `, ${resolvedRequests.length} handled` : ''})
              </p>
            </div>
            {[...pendingRequests, ...resolvedRequests].map((request) => {
              const isAccepting = actionLoading?.id === request.id && actionLoading.action === 'accept';
              const isRejecting = actionLoading?.id === request.id && actionLoading.action === 'reject';
              const isBusy = actionLoading?.id === request.id;

              return (
                <div
                  key={`req-${request.id}`}
                  className="p-3 border-b bg-orange-50 dark:bg-orange-950/20"
                >
                  <div className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">
                      <UserPlus className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Follow Request</p>
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
                            onClick={(e) => handleAcceptRequest(request, e)}
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
                            onClick={(e) => handleRejectRequest(request, e)}
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
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${request.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                              }`}
                          >
                            {request.status === 'accepted' ? 'Accepted' : 'Declined'}
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
            <DropdownMenuSeparator />
          </>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 && followRequests.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`p-3 cursor-pointer border-b last:border-b-0 ${!notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
              onSelect={() => markAsRead(notification.id)}
            >
              <div className="flex gap-3 w-full">
                <div className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{notification.title}</p>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(notification.created_at)}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}

        {/* Footer */}
        {/* Footer Actions */}
        {(notifications.length > 0 || resolvedRequests.length > 0) && (
          <div className="p-2 border-t grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={markAllAsRead}
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
              onClick={clearAllNotifications}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationButton;
