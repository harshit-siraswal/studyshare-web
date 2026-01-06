// src/components/NotificationButton.tsx
// Notification bell button with dropdown
// FIX: Uses Firebase Auth, includes follow request accept/reject

import { useState, useEffect } from 'react';
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
import { supabase } from '../supabase';
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
}

interface FollowRequest {
  id: string;
  requester_email: string;
  status: string;
  created_at: string;
}

const NotificationButton = () => {
  const { selectedCollege } = useCollege();
  const { user } = useAuth(); // FIX: Use Firebase Auth

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetchNotifications();
      fetchFollowRequests();
    }
  }, [user, selectedCollege]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.email) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follow_requests',
        },
        () => {
          fetchFollowRequests();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
      updateUnreadCount(data || [], followRequests);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowRequests = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('target_email', user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFollowRequests(data || []);
      updateUnreadCount(notifications, data || []);
    } catch (error) {
      console.error('Error fetching follow requests:', error);
    }
  };

  const updateUnreadCount = (notifs: Notification[], requests: FollowRequest[]) => {
    const unreadNotifs = notifs.filter(n => !n.read).length;
    setUnreadCount(unreadNotifs + requests.length);
  };

  const handleAcceptRequest = async (request: FollowRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.email) return;
    setActionLoading(request.id);

    try {
      // 1. Update request status
      await supabase
        .from('follow_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      // 2. Add to follows table
      await supabase
        .from('follows')
        .insert([{
          follower_email: request.requester_email,
          following_email: user.email,
        }]);

      // 3. Create notification for requester
      await supabase.from('notifications').insert([{
        user_email: request.requester_email,
        type: 'follow',
        title: 'Follow Request Accepted',
        message: `${user.email?.split('@')[0]} accepted your follow request`,
        read: false,
        college_id: selectedCollege?.domain || 'kiet.edu',
      }]);

      // 4. Update local state
      setFollowRequests(prev => prev.filter(r => r.id !== request.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Follow request accepted!');
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (request: FollowRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(request.id);

    try {
      await supabase
        .from('follow_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);

      setFollowRequests(prev => prev.filter(r => r.id !== request.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Follow request declined');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to decline request');
    } finally {
      setActionLoading(null);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
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
        .eq('user_email', user.email)
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(followRequests.length);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
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
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Follow Requests Section */}
        {followRequests.length > 0 && (
          <>
            <div className="px-3 py-2 bg-orange-500/10 border-b">
              <p className="text-xs font-medium text-orange-600">Follow Requests ({followRequests.length})</p>
            </div>
            {followRequests.map((request) => (
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
                        onClick={(e) => handleAcceptRequest(request, e)}
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
                        onClick={(e) => handleRejectRequest(request, e)}
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
              onClick={() => markAsRead(notification.id)}
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
        {(notifications.length > 0 || followRequests.length > 0) && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationButton;