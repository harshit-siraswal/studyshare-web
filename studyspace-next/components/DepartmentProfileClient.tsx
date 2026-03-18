'use client';

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Bot, Building2, Cpu, Database, Globe, Loader2, PlugZap, Search, Users, Zap, Cog } from "lucide-react";
import { useParams } from "next/navigation";
import { NoticeFeedCard } from "@/components/NoticeFeedCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useNotices } from "@/hooks/useNotices";
import { usePermissions } from "@/hooks/usePermissions";
import { followDepartment, getFollowedDepartments, unfollowDepartment } from "@/lib/api";
import { supabase } from "@/supabase";
import { toast } from "sonner";

type DepartmentMeta = { value: string; label: string; icon: ElementType };

const DEPARTMENTS: DepartmentMeta[] = [
  { value: 'cse', label: 'Computer Science', icon: Cpu },
  { value: 'ece', label: 'Electronics', icon: Zap },
  { value: 'me', label: 'Mechanical', icon: Cog },
  { value: 'ce', label: 'Civil', icon: Building2 },
  { value: 'eee', label: 'Electrical', icon: PlugZap },
  { value: 'aiml', label: 'AI & ML', icon: Bot },
  { value: 'ds', label: 'Data Science', icon: Database },
  { value: 'it', label: 'Information Technology', icon: Globe },
];

function normalizeDepartment(value: string | string[] | undefined) {
  return String(Array.isArray(value) ? value[0] : value || '').trim().toLowerCase();
}

function getDepartmentInfo(deptId: string) {
  return DEPARTMENTS.find((department) => department.value === deptId) || {
    value: deptId,
    label: deptId ? deptId.toUpperCase() : 'Department',
    icon: Building2,
  };
}

export function DepartmentProfileClient() {
  const params = useParams();
  const deptId = normalizeDepartment(params.deptId);
  const department = getDepartmentInfo(deptId);
  const { user } = useAuth();
  const { selectedCollegeId, selectedCollege } = useCollege();
  const permissions = usePermissions();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [pendingFollow, setPendingFollow] = useState(false);
  const { notices, pagination, isLoading, refetch } = useNotices({ department: deptId, page, limit: 20 });
  const { isBookmarked, toggleBookmark } = useBookmarks();

  useEffect(() => {
    let ignore = false;

    async function loadDepartmentState() {
      if (!deptId || !selectedCollegeId) {
        setIsFollowing(false);
        setFollowerCount(0);
        return;
      }

      try {
        const [followedResponse, followerResponse] = await Promise.all([
          user?.email ? getFollowedDepartments(selectedCollegeId) : Promise.resolve({ departments: [] }),
          supabase
            .from('department_followers')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', deptId)
            .eq('college_id', selectedCollegeId),
        ]);

        if (ignore) return;
        setIsFollowing(Boolean(followedResponse.departments?.includes(deptId)));
        setFollowerCount(followerResponse.count || 0);
      } catch (error) {
        console.error('Failed to load department profile state', error);
      }
    }

    void loadDepartmentState();
    return () => {
      ignore = true;
    };
  }, [deptId, selectedCollegeId, user?.email]);

  const filteredNotices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notices;
    return notices.filter((notice) =>
      [notice.title, notice.content].filter(Boolean).some((value) => value.toLowerCase().includes(query)),
    );
  }, [notices, searchQuery]);

  async function handleFollowToggle() {
    if (!selectedCollegeId) {
      toast.error('College context is still loading.');
      return;
    }
    if (!permissions.canFollow) {
      toast.error('Follow actions require a verified college email.');
      return;
    }

    try {
      setPendingFollow(true);
      if (isFollowing) {
        await unfollowDepartment(deptId, selectedCollegeId);
        setIsFollowing(false);
        setFollowerCount((count) => Math.max(0, count - 1));
        toast.success('Department unfollowed');
      } else {
        await followDepartment(deptId, selectedCollegeId);
        setIsFollowing(true);
        setFollowerCount((count) => count + 1);
        toast.success('Department followed');
      }
    } catch (error: any) {
      console.error('Failed to toggle department follow', error);
      toast.error(error?.message || 'Unable to update follow state.');
    } finally {
      setPendingFollow(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <Button variant="ghost" className="-ml-3 w-fit px-3" asChild>
                <Link href="/notices">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to notices
                </Link>
              </Button>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border border-border/60">
                  <AvatarFallback className="bg-background">
                    <department.icon className="h-6 w-6 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight">{department.label}</h1>
                    <Badge variant="outline">@{department.value}</Badge>
                  </div>
                  <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    Official department notice profile for {selectedCollege?.name || 'your selected college'}.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{pagination.total} notices</Badge>
                    <Badge variant="outline">{followerCount} followers</Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button type="button" variant={isFollowing ? 'outline' : 'default'} disabled={pendingFollow || !permissions.canFollow} onClick={() => void handleFollowToggle()}>
                {pendingFollow ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isFollowing ? 'Following' : 'Follow department'}
              </Button>
              <Button asChild variant="outline">
                <Link href={`/notices/${department.value}`}>Direct feed</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-4 w-4" />
                Search department notices
              </CardTitle>
              <CardDescription>Filter this department's feed by title or content.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={`Search ${department.label}`}
              />
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="grid grid-cols-2 gap-3 p-4 md:grid-cols-1">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{pagination.total}</div>
                  <div className="text-xs text-muted-foreground">Notices</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{followerCount}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {isLoading ? (
          <Card className="border-border/60">
            <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading department profile...</p>
            </CardContent>
          </Card>
        ) : filteredNotices.length === 0 ? (
          <Card className="border-dashed border-border/70">
            <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
              <Search className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">No department notices found</h2>
                <p className="text-sm text-muted-foreground">
                  Try a different search or reload the current page.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-4">
            {filteredNotices.map((notice) => (
              <NoticeFeedCard
                key={notice.id}
                notice={notice}
                departmentLabel={department.label}
                DepartmentIcon={department.icon}
                bookmarked={isBookmarked(notice.id)}
                onToggleBookmark={(noticeId) => {
                  void toggleBookmark(noticeId, 'notice');
                }}
              />
            ))}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 p-4">
              <div className="text-sm text-muted-foreground">Page {pagination.page} • {pagination.total} total notices</div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                  Previous
                </Button>
                <Button type="button" variant="outline" disabled={!pagination.hasMore} onClick={() => setPage((value) => value + 1)}>
                  Next
                </Button>
                <Button type="button" onClick={() => void refetch()}>
                  Reload
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

