// src/components/FollowingFeed.tsx
// Feed showing resources from users you follow
// Policy: Filter resources by college_id for data isolation

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import ResourceCard, { ResourceType } from './ResourceCard';
import { Card } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollege } from '@/context/CollegeContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/lib/api';

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

interface FollowingFeedProps {
  searchQuery?: string;
}

const FollowingFeed = ({ searchQuery = '' }: FollowingFeedProps) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);

  // FIX: Use Firebase Auth instead of Supabase Auth
  const { user: authUser } = useAuth();
  const { selectedCollegeId } = useCollege();
  const { isReadOnly } = usePermissions();

  const collegeId = useMemo(() => selectedCollegeId || '', [selectedCollegeId]);

  const fetchFollowingResources = useCallback(async () => {
    if (!authUser?.email || !collegeId) {
      setResources([]);
      setFollowingCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get list of people user is following via Backend API
      const { following } = await api.getFollowing();

      const followingEmails = following.map(p => p.email);
      setFollowingCount(followingEmails.length);

      if (followingEmails.length === 0) {
        setResources([]);
        setLoading(false);
        return;
      }

      // Fetch resources from followed users
      // Policy: Only fetch resources from the current college
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .in('uploaded_by_email', followingEmails)
        .eq('college_id', collegeId) // Policy: College data isolation
        .eq('status', 'approved') // Only approved resources
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
  }, [authUser?.email, collegeId]);

  useEffect(() => {
    fetchFollowingResources();
  }, [fetchFollowingResources]);

  const normalizeResourceType = (type: string): ResourceType => {
    if (type === 'video' || type === 'notes' || type === 'pyq') {
      return type;
    }
    return 'notes';
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

  // Filter resources by search query
  const filteredResources = searchQuery
    ? resources.filter(r =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.chapter || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.uploaded_by_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    : resources;

  if (filteredResources.length === 0 && searchQuery) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-slate-400" />
        <h3 className="text-xl font-semibold mb-2">No matches found</h3>
        <p className="text-slate-600">
          Try a different search term
        </p>
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
          From People You Follow ({filteredResources.length})
        </h2>
        <p className="text-sm text-slate-600">
          Following {followingCount} {followingCount === 1 ? 'person' : 'people'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredResources.map((resource) => (
          <ResourceCard
            key={resource.id}
            id={resource.id}
            title={resource.title}
            type={normalizeResourceType(resource.type)}
            author={resource.uploaded_by_name || 'Anonymous'}
            authorType="student"
            upvotes={resource.upvotes}
            downvotes={resource.downvotes}
            subject={resource.subject}
            chapter={resource.chapter || 'General'}
            pdfUrl={resource.file_url}
            videoUrl={resource.video_url}
            semester={resource.semester}
            branch={resource.branch}
            uploaded_by_email={resource.uploaded_by_email}
            created_at={resource.created_at}
          />
        ))}
      </div>
    </div>
  );
};

export default FollowingFeed;
                                                                                                                                                                                                                                                      
