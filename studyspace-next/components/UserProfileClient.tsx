'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Search, UserPlus, Users } from "lucide-react";
import type { Resource, UserProfile as ApiUserProfile } from "@/lib/api";
import { cancelFollowRequest, checkFollowStatus, getFollowers, getFollowing, sendFollowRequest, unfollowUser } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ResourceFeedCard } from "@/components/ResourceFeedCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import { getBranchLabel, normalizeBranchCode } from "@/lib/academicSubjects";
import { useParams } from "next/navigation";
import { supabase } from "@/supabase";
import { toast } from "sonner";

function normalizeProfilePhotoUrl(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  if (["null", "undefined", "n/a", "-"].includes(trimmed.toLowerCase())) return null;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return trimmed;
}

function extractCollegeName(value?: string | null) {
  if (!value) return "College";
  const trimmed = value.trim();
  if (!trimmed) return "College";
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed?.name === 'string' && parsed.name.trim()) {
        return parsed.name.trim();
      }
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function PeopleList({ title, users }: { title: string; users: ApiUserProfile[] }) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users here yet.</p>
        ) : (
          users.map((person) => (
            <Link
              key={`${title}-${person.email}`}
              href={`/profile/${encodeURIComponent(person.username || person.email?.split('@')[0] || 'user')}`}
              className="flex items-center gap-3 rounded-2xl border border-border/50 p-3 transition hover:bg-accent/30"
            >
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={normalizeProfilePhotoUrl(person.profile_photo_url) || undefined} />
                <AvatarFallback>
                  {(person.display_name || person.email || 'U').slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{person.display_name || person.email?.split('@')[0]}</p>
                <p className="truncate text-sm text-muted-foreground">@{person.username || person.email?.split('@')[0]}</p>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function UserProfileClient() {
  const params = useParams();
  const username = String(params.username || '').trim();
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [followers, setFollowers] = useState<ApiUserProfile[]>([]);
  const [following, setFollowing] = useState<ApiUserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [followStatus, setFollowStatus] = useState<{ status: 'following' | 'pending' | 'not-following'; requestId?: string }>({ status: 'not-following' });
  const [pendingAction, setPendingAction] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadViewedProfile() {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        const { data: viewedProfile, error } = await supabase
          .from('users')
          .select('id, email, display_name, bio, profile_photo_url, college, branch, semester, subject, username, role, created_at, subscription_tier, subscription_end_date')
          .eq('username', username)
          .maybeSingle();

        if (error) throw error;
        if (!viewedProfile) {
          if (!ignore) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        const targetEmail = viewedProfile.email as string;
        const [followersResult, followingResult, contributionsResult, followResult] = await Promise.all([
          getFollowers(targetEmail),
          getFollowing(targetEmail),
          supabase.from('resources').select('*').eq('uploaded_by_email', targetEmail).order('created_at', { ascending: false }),
          user?.email && user.email !== targetEmail
            ? checkFollowStatus(targetEmail)
            : Promise.resolve({ status: 'not-following' as const }),
        ]);

        if (ignore) return;

        setProfile({
          ...viewedProfile,
          college: extractCollegeName(viewedProfile.college),
          profile_photo_url: normalizeProfilePhotoUrl(viewedProfile.profile_photo_url) || undefined,
          branch: normalizeBranchCode(viewedProfile.branch) || viewedProfile.branch || undefined,
        });
        setFollowers(followersResult.followers || []);
        setFollowing(followingResult.following || []);
        setResources((contributionsResult.data || []) as Resource[]);
        setFollowStatus(followResult);
      } catch (error) {
        console.error('Failed to load viewed profile', error);
        toast.error('Failed to load this profile.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadViewedProfile();
    return () => {
      ignore = true;
    };
  }, [user?.email, username]);

  const filteredResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return resources;
    return resources.filter((resource) =>
      [resource.title, resource.description, resource.subject, resource.chapter]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [resources, searchQuery]);

  async function handleFollowAction() {
    if (!profile?.email || !user?.email || user.email === profile.email) return;

    try {
      setPendingAction(true);
      if (followStatus.status === 'following') {
        await unfollowUser(profile.email);
        setFollowStatus({ status: 'not-following' });
        toast.success(`Unfollowed ${profile.display_name || profile.email}`);
        return;
      }
      if (followStatus.status === 'pending' && followStatus.requestId) {
        await cancelFollowRequest(followStatus.requestId);
        setFollowStatus({ status: 'not-following' });
        toast.success('Follow request cancelled');
        return;
      }
      const result = await sendFollowRequest(profile.email);
      setFollowStatus({
        status: result.request.status === 'accepted' ? 'following' : 'pending',
        requestId: result.request.id,
      });
      toast.success(`Request sent to ${profile.display_name || profile.email}`);
    } catch (error: any) {
      console.error('Failed to update follow status', error);
      toast.error(error?.message || 'Unable to update follow state.');
    } finally {
      setPendingAction(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading profile...
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-lg border-border/60">
          <CardContent className="space-y-3 p-8 text-center">
            <h1 className="text-2xl font-semibold">Profile not found</h1>
            <p className="text-sm text-muted-foreground">We couldn't find that username.</p>
            <Button asChild>
              <Link href="/explore">Back to explore</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const isOwnProfile = Boolean(user?.email && profile.email === user.email);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border border-border/60">
                <AvatarImage src={normalizeProfilePhotoUrl(profile.profile_photo_url) || undefined} />
                <AvatarFallback>
                  {(profile.display_name || profile.email || 'U').slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <Button variant="ghost" className="-ml-3 w-fit px-3" asChild>
                  <Link href="/explore">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to explore
                  </Link>
                </Button>
                <div className="space-y-1">
                  <h1 className="text-3xl font-semibold tracking-tight">{profile.display_name || profile.email?.split('@')[0]}</h1>
                  <p className="text-sm text-muted-foreground">@{profile.username || profile.email?.split('@')[0]}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{extractCollegeName(profile.college)}</Badge>
                  {profile.branch ? <Badge variant="outline">{getBranchLabel(profile.branch)}</Badge> : null}
                  {profile.semester ? <Badge variant="outline">Semester {profile.semester}</Badge> : null}
                  {profile.subject ? <Badge variant="outline">{profile.subject}</Badge> : null}
                </div>
                {profile.bio ? <p className="max-w-2xl text-sm text-muted-foreground">{profile.bio}</p> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              {isOwnProfile ? (
                <Button asChild>
                  <Link href="/profile">Open my profile</Link>
                </Button>
              ) : (
                <Button onClick={() => void handleFollowAction()} disabled={pendingAction}>
                  {pendingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {followStatus.status === 'following' ? 'Following' : followStatus.status === 'pending' ? 'Pending' : 'Follow'}
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <Card className="border-border/60"><CardContent className="p-5"><div className="text-2xl font-semibold">{resources.length}</div><div className="text-sm text-muted-foreground">Contributions</div></CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-5"><div className="text-2xl font-semibold">{followers.length}</div><div className="text-sm text-muted-foreground">Followers</div></CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-5"><div className="text-2xl font-semibold">{following.length}</div><div className="text-sm text-muted-foreground">Following</div></CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-5"><div className="text-2xl font-semibold">{profile.role || 'student'}</div><div className="text-sm text-muted-foreground">Role</div></CardContent></Card>
        </section>

        <Tabs defaultValue="contributions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>

          <TabsContent value="contributions" className="space-y-4">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search contributions"
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>
            {filteredResources.length === 0 ? (
              <Card className="border-dashed border-border/70">
                <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                  <Search className="h-10 w-10 text-muted-foreground" />
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">No contributions found</h2>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? 'Try another search query.' : 'This profile has no visible contributions yet.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredResources.map((resource) => (
                <ResourceFeedCard
                  key={resource.id}
                  id={resource.id}
                  title={resource.title}
                  description={resource.description}
                  type={resource.type as 'notes' | 'video' | 'pyq'}
                  subject={resource.primaryScope?.subject || resource.subject || 'General'}
                  chapter={resource.chapter || resource.topic || undefined}
                  semester={resource.primaryScope?.semester || resource.semester || undefined}
                  branch={resource.primaryScope?.branch || resource.branch || undefined}
                  votes={(resource.upvotes || 0) - (resource.downvotes || 0)}
                  author={resource.uploadedByName || resource.uploaded_by_name || profile.display_name}
                  createdAt={resource.createdAt || resource.created_at || undefined}
                  fileUrl={resource.file_url || resource.filePath || undefined}
                  videoUrl={resource.video_url || resource.url || undefined}
                  bookmarked={isBookmarked(resource.id)}
                  onToggleBookmark={(resourceId) => {
                    void toggleBookmark(resourceId, 'resource');
                  }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="network">
            <div className="grid gap-4 lg:grid-cols-2">
              <PeopleList title="Followers" users={followers} />
              <PeopleList title="Following" users={following} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
