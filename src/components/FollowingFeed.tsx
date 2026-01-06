// src/components/FollowingFeed.tsx
// Feed showing resources from users you follow
// Policy: Filter resources by college_id for data isolation

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import ResourceCard from './ResourceCard';
import { Card } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollege } from '@/context/CollegeContext';
import { usePermissions } from '@/hooks/usePermissions';

interface Resource {
  id: string;
  title: string;
  type: string;
  semester: string;
  branch: string;
  subject: string;
  chapter?: string;
  file_url?: string;
  video_url?: string;
  uploaded_by_name: string;
  uploaded_by_email: string;
  status: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
}

const FollowingFeed = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);

  const { selectedCollege } = useCollege();
  const { canViewFollowing, isReadOnly } = usePermissions();

  useEffect(() => {
    fetchFollowingResources();
  }, [selectedCollege]);

  const fetchFollowingResources = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // Policy: Filter by college_id for data isolation
      const collegeId = selectedCollege?.id || 'kiet';

      // Get list of people user is following
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_email')
        .eq('follower_email', user.email);

      if (followingError) throw followingError;

      const followingEmails = followingData?.map(f => f.following_email) || [];
      setFollowingCount(followingEmails.length);

      if (followingEmails.length === 0) {
        setResources([]);
        return;
      }

      // Fetch resources from followed users
      // Policy: Only fetch resources from the current college
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .in('uploaded_by_email', followingEmails)
        .eq('college_id', collegeId) // Policy: College data isolation
        .order('created_at', { ascending: false })
        .limit(20);

      if (resourcesError) throw resourcesError;

      // Transform data with vote counts
      const transformed = resourcesData?.map(resource => ({
        ...resource,
        upvotes: resource.upvotes || 0,
        downvotes: resource.downvotes || 0,
      })) || [];

      setResources(transformed);
    } catch (error) {
      console.error('Error fetching following feed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Policy: Only FULL access users can view following feed
  if (isReadOnly) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-slate-400" />
        <h3 className="text-xl font-semibold mb-2">Following Feed</h3>
        <p className="text-slate-600">
          Sign in with your college email to access this feature
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (followingCount === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-slate-400" />
        <h3 className="text-xl font-semibold mb-2">No one to follow yet</h3>
        <p className="text-slate-600 mb-4">
          Follow other users to see their contributions here
        </p>
        <Button onClick={() => window.location.href = '/explore'}>
          Discover Users
        </Button>
      </Card>
    );
  }

  if (resources.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-slate-400" />
        <h3 className="text-xl font-semibold mb-2">Nothing to show yet</h3>
        <p className="text-slate-600">
          Users you follow haven't shared any resources yet
        </p>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">
          From People You Follow ({resources.length})
        </h2>
        <p className="text-sm text-slate-600">
          Following {followingCount} {followingCount === 1 ? 'person' : 'people'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            {...resource}
            semester={resource.semester}
            branch={resource.branch}
            onUpdate={fetchFollowingResources}
          />
        ))}
      </div>
    </div>
  );
};

export default FollowingFeed;