// src/components/FollowButton.tsx
// Follow Request button component
// FIX: Changed from instant follow to request-based approval flow
// States: not-following → pending → following

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2, Clock, UserCheck } from 'lucide-react';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { useCollege } from '@/context/CollegeContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';

interface FollowButtonProps {
  targetUserEmail: string;
  targetUserName?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

type FollowStatus = 'not-following' | 'pending' | 'following';

const FollowButton = ({
  targetUserEmail,
  targetUserName,
  size = 'default',
  variant = 'default'
}: FollowButtonProps) => {
  const [followStatus, setFollowStatus] = useState<FollowStatus>('not-following');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const { selectedCollege } = useCollege();
  const { canFollow, isReadOnly } = usePermissions();
  const { user: authUser } = useAuth(); // FIX: Use Firebase Auth

  useEffect(() => {
    if (authUser?.email) {
      setCurrentUserEmail(authUser.email);
      checkFollowStatus(authUser.email);
    }
  }, [targetUserEmail, authUser]);

  const checkFollowStatus = async (userEmail: string) => {
    try {
      if (!userEmail) return;

      // Don't show follow button for yourself
      if (userEmail === targetUserEmail) {
        return;
      }

      // First: Check if already following (in follows table)
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_email', userEmail)
        .eq('following_email', targetUserEmail)
        .single();

      if (followData) {
        setFollowStatus('following');
        setLoading(false);
        return;
      }

      // Second: Check for pending request (in follow_requests table)
      const { data: requestData } = await supabase
        .from('follow_requests')
        .select('id, status')
        .eq('requester_email', userEmail)
        .eq('target_email', targetUserEmail)
        .eq('status', 'pending')
        .single();

      if (requestData) {
        setFollowStatus('pending');
        setLoading(false);
        return;
      }

      setFollowStatus('not-following');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowAction = async () => {
    if (!currentUserEmail) {
      toast.error('Please login to follow users');
      return;
    }

    // Policy: Only FULL access users can follow
    if (!canFollow) {
      toast.error('Following requires a verified college email account.');
      return;
    }

    setActionLoading(true);
    try {
      if (followStatus === 'following') {
        // Unfollow - remove from follows table
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_email', currentUserEmail)
          .eq('following_email', targetUserEmail);

        if (error) throw error;

        setFollowStatus('not-following');
        toast.success(`Unfollowed ${targetUserName || 'user'}`);
      } else if (followStatus === 'pending') {
        // Cancel pending request
        const { error } = await supabase
          .from('follow_requests')
          .delete()
          .eq('requester_email', currentUserEmail)
          .eq('target_email', targetUserEmail)
          .eq('status', 'pending');

        if (error) throw error;

        setFollowStatus('not-following');
        toast.success('Follow request cancelled');
      } else {
        // Send follow request (not instant follow!)
        const { error } = await supabase
          .from('follow_requests')
          .insert([{
            requester_email: currentUserEmail,
            target_email: targetUserEmail,
            status: 'pending',
            college_id: selectedCollege?.domain || 'kiet.edu',
          }]);

        if (error) {
          if (error.code === '23505') {
            toast.error('Request already sent');
            return;
          }
          throw error;
        }

        setFollowStatus('pending');
        toast.success(`Follow request sent to ${targetUserName || 'user'}!`);

        // Create notification for the target user
        await supabase.from('notifications').insert([{
          user_email: targetUserEmail,
          type: 'follow_request',
          title: 'Follow Request',
          message: `${currentUserEmail.split('@')[0]} wants to follow you`,
          read: false,
          college_id: selectedCollege?.domain || 'kiet.edu',
        }]);
      }
    } catch (error: any) {
      console.error('Follow error:', error);
      toast.error('Failed to update follow status');
    } finally {
      setActionLoading(false);
    }
  };

  // Policy: Don't show for readonly users
  if (isReadOnly) {
    return null;
  }

  // Don't show button for own profile
  if (currentUserEmail === targetUserEmail) {
    return null;
  }

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  const getButtonContent = () => {
    if (actionLoading) {
      return <Loader2 className="w-4 h-4 mr-2 animate-spin" />;
    }

    switch (followStatus) {
      case 'following':
        return (
          <>
            <UserCheck className="w-4 h-4 mr-2" />
            Following
          </>
        );
      case 'pending':
        return (
          <>
            <Clock className="w-4 h-4 mr-2" />
            Requested
          </>
        );
      default:
        return (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Follow
          </>
        );
    }
  };

  const getButtonVariant = () => {
    if (followStatus === 'following' || followStatus === 'pending') {
      return 'outline';
    }
    return variant;
  };

  return (
    <Button
      variant={getButtonVariant()}
      size={size}
      onClick={handleFollowAction}
      disabled={actionLoading}
      className={followStatus !== 'not-following' ? 'border-slate-600 text-slate-300' : ''}
    >
      {getButtonContent()}
    </Button>
  );
};

export default FollowButton;