'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, FileText, Loader2, LogOut, Save, Search, Sparkles, Trash2, Users } from "lucide-react";
import type { Resource, SavedChatPost, UserProfile as ApiUserProfile } from "@/lib/api";
import { getFollowers, getFollowing, getMyProfile, getMyResources, getSavedChatPosts, updateProfile, deleteResource } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ResourceFeedCard } from "@/components/ResourceFeedCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { AI_RECHARGE_PACKS, buildAiTokenBudgetSnapshot, formatVisibleAiTokens, toSafeInt } from "@/lib/aiTokens";
import { BRANCH_OPTIONS, SEMESTER_OPTIONS, getBranchLabel, getSubjectsForBranchAndSemester, normalizeBranchCode } from "@/lib/academicSubjects";
import { supabase } from "@/supabase";
import { toast } from "sonner";

interface EditFormState {
  display_name: string;
  username: string;
  bio: string;
  semester: string;
  branch: string;
  subject: string;
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

function normalizeProfilePhotoUrl(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  if (["null", "undefined", "n/a", "-"].includes(trimmed.toLowerCase())) return null;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return trimmed;
}

function profileFallbackName(profile: Partial<ApiUserProfile> | null | undefined, email?: string | null) {
  return profile?.display_name || email?.split('@')[0] || 'Student';
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

export function ProfileClient() {
  const { user, logout } = useAuth();
  const { selectedCollege } = useCollege();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedChatPost[]>([]);
  const [followers, setFollowers] = useState<ApiUserProfile[]>([]);
  const [following, setFollowing] = useState<ApiUserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    display_name: '',
    username: '',
    bio: '',
    semester: '',
    branch: '',
    subject: '',
  });

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const [profileResult, followersResult, followingResult, savedPostsResult, resourcesResult] = await Promise.all([
          getMyProfile(),
          getFollowers(),
          getFollowing(),
          getSavedChatPosts(),
          getMyResources(),
        ]);

        if (ignore) return;

        const resolvedProfile: ApiUserProfile = {
          ...profileResult.profile,
          email: profileResult.profile.email || user.email,
          display_name: profileFallbackName(profileResult.profile, user.email),
          username:
            profileResult.profile.username ||
            user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') ||
            'student',
          college: extractCollegeName(profileResult.profile.college || selectedCollege?.name || ''),
          profile_photo_url: normalizeProfilePhotoUrl(profileResult.profile.profile_photo_url) || user.photoURL || undefined,
          bio: profileResult.profile.bio || '',
          branch: normalizeBranchCode(profileResult.profile.branch) || profileResult.profile.branch || '',
          semester: profileResult.profile.semester || '',
          subject: profileResult.profile.subject || '',
        };

        setProfile(resolvedProfile);
        setEditForm({
          display_name: resolvedProfile.display_name || '',
          username: resolvedProfile.username || '',
          bio: resolvedProfile.bio || '',
          semester: resolvedProfile.semester || '',
          branch: normalizeBranchCode(resolvedProfile.branch) || resolvedProfile.branch || '',
          subject: resolvedProfile.subject || '',
        });
        setFollowers(followersResult.followers || []);
        setFollowing(followingResult.following || []);
        setSavedPosts(savedPostsResult.savedPosts || []);
        setResources(resourcesResult.resources || []);
      } catch (error) {
        console.error('Failed to load profile page', error);
        toast.error('Failed to load your profile.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      ignore = true;
    };
  }, [selectedCollege?.name, user?.email, user?.photoURL]);

  const availableSubjects = useMemo(
    () => getSubjectsForBranchAndSemester(editForm.branch, editForm.semester),
    [editForm.branch, editForm.semester],
  );

  const filteredResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return resources;
    return resources.filter((resource) =>
      [resource.title, resource.description, resource.subject, resource.chapter]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [resources, searchQuery]);

  const aiSnapshot = useMemo(() => {
    if (!profile) return null;
    return buildAiTokenBudgetSnapshot(profile as unknown as Record<string, unknown>);
  }, [profile]);

  async function handleSaveProfile() {
    if (!profile || !user?.email) return;

    const displayName = editForm.display_name.trim();
    const username = editForm.username.trim().toLowerCase();
    const bio = editForm.bio.trim();
    const semester = editForm.semester.trim();
    const branch = normalizeBranchCode(editForm.branch);
    const subject = editForm.subject.trim();

    if (!displayName) {
      toast.error('Display name is required.');
      return;
    }
    if (username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
      toast.error('Username must be at least 3 characters and contain only letters, numbers, and underscores.');
      return;
    }

    try {
      setSaving(true);

      if (username !== profile.username) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, email')
          .eq('username', username)
          .maybeSingle();

        if (existingUser && existingUser.email !== user.email) {
          toast.error('That username is already taken.');
          return;
        }
      }

      const result = await updateProfile({
        display_name: displayName,
        username,
        bio: bio || undefined,
        semester: semester || undefined,
        branch: branch || undefined,
        subject: subject || undefined,
      });

      const nextProfile: ApiUserProfile = {
        ...profile,
        ...result.profile,
        display_name: result.profile.display_name || displayName,
        username: result.profile.username || username,
        bio: result.profile.bio || bio,
        semester: result.profile.semester || semester,
        branch: normalizeBranchCode(result.profile.branch) || branch,
        subject: result.profile.subject || subject,
      };

      setProfile(nextProfile);
      setEditForm((prev) => ({ ...prev, username: nextProfile.username || prev.username }));
      setEditOpen(false);
      toast.success('Profile updated.');
    } catch (error: any) {
      console.error('Failed to update profile', error);
      toast.error(error?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteResource(resourceId: string) {
    if (!window.confirm('Delete this contribution?')) return;
    try {
      await deleteResource(resourceId);
      setResources((prev) => prev.filter((resource) => resource.id !== resourceId));
      toast.success('Contribution deleted.');
    } catch (error: any) {
      console.error('Failed to delete resource', error);
      toast.error(error?.message || 'Failed to delete contribution.');
    }
  }

  async function handleLogout() {
    if (!window.confirm('Logout from StudyShare?')) return;
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed', error);
      toast.error('Failed to logout.');
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading your profile...
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-lg border-border/60">
          <CardContent className="space-y-3 p-8 text-center">
            <h1 className="text-2xl font-semibold">Profile unavailable</h1>
            <p className="text-sm text-muted-foreground">We couldn't load your profile right now.</p>
            <Button asChild>
              <Link href="/study">Back to study</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const aiBudget = aiSnapshot ? toSafeInt(profile.ai_token_budget ?? aiSnapshot.currentBudget) : 0;
  const aiUsed = toSafeInt(profile.ai_token_used);
  const aiRemaining = toSafeInt(profile.ai_token_remaining ?? Math.max(0, aiBudget - aiUsed));
  const premiumLabel = aiSnapshot?.isPremiumActive
    ? String(profile.subscription_tier || 'premium').replace(/^./, (value) => value.toUpperCase())
    : 'Free';

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border border-border/60">
                <AvatarImage src={normalizeProfilePhotoUrl(profile.profile_photo_url) || undefined} />
                <AvatarFallback>
                  {profileFallbackName(profile, user?.email).slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" className="-ml-3 w-fit px-3" asChild>
                    <Link href="/study">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to study
                    </Link>
                  </Button>
                </div>
                <div className="space-y-1">
                  <h1 className="text-3xl font-semibold tracking-tight">{profile.display_name}</h1>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{extractCollegeName(profile.college || selectedCollege?.name || '')}</Badge>
                  {profile.branch ? <Badge variant="outline">{getBranchLabel(profile.branch)}</Badge> : null}
                  {profile.semester ? <Badge variant="outline">Semester {profile.semester}</Badge> : null}
                  {profile.subject ? <Badge variant="outline">{profile.subject}</Badge> : null}
                  {profile.role ? <Badge variant="outline">{profile.role}</Badge> : null}
                </div>
                {profile.bio ? <p className="max-w-2xl text-sm text-muted-foreground">{profile.bio}</p> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button>Edit profile</Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Display name</span>
                      <Input value={editForm.display_name} onChange={(event) => setEditForm((prev) => ({ ...prev, display_name: event.target.value }))} />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Username</span>
                      <Input value={editForm.username} onChange={(event) => setEditForm((prev) => ({ ...prev, username: event.target.value }))} />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Bio</span>
                      <Textarea value={editForm.bio} onChange={(event) => setEditForm((prev) => ({ ...prev, bio: event.target.value }))} rows={4} />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 text-sm">
                        <span className="font-medium">Semester</span>
                        <select
                          value={editForm.semester}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, semester: event.target.value }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select semester</option>
                          {SEMESTER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2 text-sm">
                        <span className="font-medium">Branch</span>
                        <select
                          value={editForm.branch}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, branch: event.target.value, subject: '' }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select branch</option>
                          {BRANCH_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Subject</span>
                      <select
                        value={editForm.subject}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, subject: event.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select subject</option>
                        {availableSubjects.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                      <Button onClick={() => void handleSaveProfile()} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save changes
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={() => void handleLogout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="text-2xl font-semibold">{resources.length}</div>
              <div className="text-sm text-muted-foreground">Contributions</div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="text-2xl font-semibold">{followers.length}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="text-2xl font-semibold">{following.length}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="text-2xl font-semibold">{savedPosts.length}</div>
              <div className="text-sm text-muted-foreground">Saved posts</div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Tabs defaultValue="contributions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="contributions">Contributions</TabsTrigger>
              <TabsTrigger value="saved">Saved posts</TabsTrigger>
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
                      placeholder="Search your contributions"
                      className="pl-9"
                    />
                  </div>
                </CardContent>
              </Card>
              {filteredResources.length === 0 ? (
                <Card className="border-dashed border-border/70">
                  <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold">No contributions found</h2>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? 'Try a broader search query.' : 'Your uploaded resources will show up here.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredResources.map((resource) => (
                  <div key={resource.id} className="space-y-2">
                    <ResourceFeedCard
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
                    />
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => void handleDeleteResource(resource.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="saved" className="space-y-4">
              {savedPosts.length === 0 ? (
                <Card className="border-dashed border-border/70">
                  <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                    <Bookmark className="h-10 w-10 text-muted-foreground" />
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold">No saved posts yet</h2>
                      <p className="text-sm text-muted-foreground">Posts saved from chatrooms will appear here.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                savedPosts.map((post) => (
                  <Card key={post.id} className="border-border/60">
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">{post.roomName || 'Saved chat post'}</CardTitle>
                          <CardDescription>
                            {post.authorName ? `By ${post.authorName}` : 'Saved from chat'}
                          </CardDescription>
                        </div>
                        {post.roomId && post.messageId ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/chatroom/${post.roomId}/post/${post.messageId}`}>Open post</Link>
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {post.content ? <p className="text-sm text-muted-foreground">{post.content}</p> : null}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {post.savedAt ? <span>Saved {new Date(post.savedAt).toLocaleString()}</span> : null}
                        {post.postedAt ? <span>Posted {new Date(post.postedAt).toLocaleString()}</span> : null}
                      </div>
                    </CardContent>
                  </Card>
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

          <div className="space-y-4">
            <Card className="border-border/60 bg-gradient-to-br from-card/90 via-background/80 to-card/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI tokens
                </CardTitle>
                <CardDescription>
                  Profile-level entitlements stay sourced from your full profile payload.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-semibold">{formatVisibleAiTokens(aiRemaining)} left</div>
                  <div className="text-sm text-muted-foreground">
                    {formatVisibleAiTokens(aiUsed)} used out of {formatVisibleAiTokens(aiBudget)} this cycle
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>Plan: <span className="font-medium text-foreground">{premiumLabel}</span></div>
                  <div>Budget multiplier: <span className="font-medium text-foreground">{aiSnapshot?.budgetMultiplier || 1}x</span></div>
                  <div>Premium multiplier: <span className="font-medium text-foreground">{aiSnapshot?.premiumMultiplier || 1}x</span></div>
                  <div>Cycle ends: <span className="font-medium text-foreground">{profile.ai_token_cycle_ends_at ? new Date(profile.ai_token_cycle_ends_at).toLocaleString() : 'Not available'}</span></div>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/70 p-3 text-xs text-muted-foreground">
                  Recharge packs ready on backend: ?{AI_RECHARGE_PACKS.join(', ?')}. The purchase UI can plug into this card in the polish phase without changing the profile data path.
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Quick links</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button asChild variant="outline"><Link href="/ai-chat">Open AI Chat</Link></Button>
                <Button asChild variant="outline"><Link href="/bookmarks">View bookmarks</Link></Button>
                <Button asChild variant="outline"><Link href="/explore">Discover students</Link></Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
