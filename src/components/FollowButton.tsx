// src/components/FollowButton.tsx
// Follow/Unfollow button component
// Policy: Only visible to FULL access users, notifications include college_id

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { useCollege } from '@/context/CollegeContext';
import { usePermissions } from '@/hooks/usePermissions';

interface FollowButtonProps {
  targetUserEmail: string;
  targetUserName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

const FollowButton = ({
  targetUserEmail,
  targetUserName,
  size = 'md',
  variant = 'default'
}: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const { selectedCollege } = useCollege();
  const { canFollow, isReadOnly } = usePermissions();

  useEffect(() => {
    checkFollowStatus();
  }, [targetUserEmail]);

  const checkFollowStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      setCurrentUserEmail(user.email);

      // Don't show follow button for yourself
      if (user.email === targetUserEmail) {
        return;
      }

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_email', user.email)
        .eq('following_email', targetUserEmail)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return;
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
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
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_email', currentUserEmail)
          .eq('following_email', targetUserEmail);

        if (error) throw error;

        setIsFollowing(false);
        toast.success(`Unfollowed ${targetUserName || 'user'}`);
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert([{
            follower_email: currentUserEmail,
            following_email: targetUserEmail,
          }]);

        if (error) throw error;

        setIsFollowing(true);
        toast.success(`Following ${targetUserName || 'user'}!`);

        // Create notification for the user being followed
        // Policy: Include college_id for data isolation
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser?.email) {
          await supabase.from('notifications').insert([{
            user_email: targetUserEmail,
            type: 'follow',
            title: 'New Follower',
            message: `${currentUser.email.split('@')[0]} started following you`,
            read: false,
            college_id: selectedCollege?.id || 'kiet', // Policy: College data isolation
          }]);
        }
      }
    } catch (error: any) {
      console.error('Follow error:', error);
      if (error.code === '23505') {
        toast.error('Already following this user');
      } else {
        toast.error('Failed to update follow status');
      }
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
      <Button
        variant={variant}
        size={size}
        disabled
      >
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleFollow}
      disabled={actionLoading}
      className={isFollowing ? 'border-slate-600 text-slate-300' : ''}
    >
      {actionLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4 mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
};

export default FollowButton;