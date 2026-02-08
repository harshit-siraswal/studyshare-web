// src/components/FollowButton.tsx
// MIGRATED: Now uses backend API instead of direct Supabase calls
// States: not-following → pending → following

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2, Clock, UserCheck } from 'lucide-react';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/lib/api';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { getRecaptchaToken } from '@/lib/recaptcha';

interface FollowButtonProps {
  targetUserEmail: string;
  targetUserName?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

type FollowStatus = 'not-following' | 'pending' | 'following';

// Store pending request IDs for cancel functionality
const pendingRequestIds = new Map<string, string>();

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

  const { canFollow, isReadOnly } = usePermissions();
  const { user: authUser } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();

  useEffect(() => {
    if (authUser?.email) {
      setCurrentUserEmail(authUser.email);
      checkFollowStatus(authUser.email);
    }
  }, [targetUserEmail, authUser]);

  // Check current follow status via Backend API
  const checkFollowStatus = async (userEmail: string) => {
    try {
      if (!userEmail) return;

      // Don't show follow button for yourself
      if (userEmail === targetUserEmail) {
        return;
      }

      // Use backend API which bypasses RLS and checks both tables
      const response = await api.checkFollowStatus(targetUserEmail);

      setFollowStatus(response.status);

      if (response.status === 'pending' && response.requestId) {
        pendingRequestIds.set(targetUserEmail, response.requestId);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
      // Fallback or leave as not-following
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
        // Unfollow via backend API
        await api.unfollowUser(targetUserEmail);
        setFollowStatus('not-following');
        toast.success(`Unfollowed ${targetUserName || 'user'}`);

      } else if (followStatus === 'pending') {
        // Cancel pending request via backend API
        const requestId = pendingRequestIds.get(targetUserEmail);
        if (requestId) {
          await api.cancelFollowRequest(requestId);
          pendingRequestIds.delete(targetUserEmail);
        }
        setFollowStatus('not-following');
        toast.success('Follow request cancelled');

      } else {
        // Send follow request via backend API
        // Note: reCAPTCHA token needed - for now we'll skip if not available
        // In production, integrate reCAPTCHA v3 here
        const recaptchaToken = await getRecaptchaToken(executeRecaptcha, 'follow_request');

        const response = await api.sendFollowRequest(targetUserEmail, recaptchaToken);
        pendingRequestIds.set(targetUserEmail, response.request.id);
        setFollowStatus('pending');
        toast.success(`Follow request sent to ${targetUserName || 'user'}!`);
      }
    } catch (error: any) {
      console.error('Follow error:', error);
      toast.error(error.message || 'Failed to update follow status');
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
