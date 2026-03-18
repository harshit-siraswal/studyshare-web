'use client';

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Bot, Building2, Compass, Cpu, Database, Globe, LayoutGrid, Loader2, PlugZap, RefreshCw, Search, Settings2, Zap, Cog } from "lucide-react";
import { NoticeFeedCard } from "@/components/NoticeFeedCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useNotices } from "@/hooks/useNotices";
import { useCollege } from "@/context/CollegeContext";
import { usePermissions } from "@/hooks/usePermissions";
import { followDepartment, getFollowedDepartments, unfollowDepartment } from "@/lib/api";
import { toast } from "sonner";

type DepartmentMeta = { value: string; label: string; icon: ElementType };

const DEPARTMENTS: DepartmentMeta[] = [
  { value: 'all', label: 'All Departments', icon: LayoutGrid },
  { value: 'cse', label: 'Computer Science', icon: Cpu },
  { value: 'ece', label: 'Electronics', icon: Zap },
  { value: 'me', label: 'Mechanical', icon: Cog },
  { value: 'ce', label: 'Civil', icon: Building2 },
  { value: 'eee', label: 'Electrical', icon: PlugZap },
  { value: 'aiml', label: 'AI & ML', icon: Bot },
  { value: 'ds', label: 'Data Science', icon: Database },
  { value: 'it', label: 'Information Technology', icon: Globe },
];

function getDepartmentInfo(deptCode: string) {
  return DEPARTMENTS.find((department) => department.value === deptCode) || {
    value: deptCode,
    label: deptCode?.toUpperCase?.() || 'Unknown',
    icon: Building2,
  };
}

export function NoticesClient() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedCollege, selectedCollegeId } = useCollege();
  const permissions = usePermissions();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [followedDeptIds, setFollowedDeptIds] = useState<string[]>([]);
  const [pendingDept, setPendingDept] = useState<string | null>(null);

  const { notices, pagination, isLoading, refresh, refetch } = useNotices({ page, limit: 20 });
  const { isBookmarked, toggleBookmark } = useBookmarks();

  useEffect(() => {
    let ignore = false;

    async function loadFollowedDepartments() {
      if (!user?.email || !selectedCollegeId) {
        setFollowedDeptIds([]);
        return;
      }

      try {
        const response = await getFollowedDepartments(selectedCollegeId);
        if (!ignore) {
          setFollowedDeptIds(response.departments || []);
        }
      } catch (error) {
        console.error('Failed to load followed departments', error);
      }
    }

    void loadFollowedDepartments();
    return () => {
      ignore = true;
    };
  }, [selectedCollegeId, user?.email]);

  const displayedNotices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return notices
      .filter((notice) => (activeTab === 'following' ? followedDeptIds.includes(notice.department) : true))
      .filter((notice) => {
        if (!query) return true;
        const dept = getDepartmentInfo(notice.department);
        return [notice.title, notice.content, notice.department, dept.label]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      });
  }, [activeTab, followedDeptIds, notices, searchQuery]);

  async function handleFollowDepartment(departmentId: string) {
    if (!selectedCollegeId) {
      toast.error('College context is still loading.');
      return;
    }
    if (!permissions.canFollow) {
      toast.error('Follow actions require a verified college email.');
      return;
    }

    try {
      setPendingDept(departmentId);
      if (followedDeptIds.includes(departmentId)) {
        await unfollowDepartment(departmentId, selectedCollegeId);
        setFollowedDeptIds((prev) => prev.filter((value) => value !== departmentId));
        toast.success('Department unfollowed');
      } else {
        await followDepartment(departmentId, selectedCollegeId);
        setFollowedDeptIds((prev) => [...prev, departmentId]);
        toast.success('Department followed');
      }
    } catch (error: any) {
      console.error('Failed to update department follow state', error);
      toast.error(error?.message || 'Unable to update follow state.');
    } finally {
      setPendingDept(null);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
          <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Button variant="ghost" className="-ml-3 w-fit px-3" asChild>
                <Link href="/study">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to study
                </Link>
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Notices</Badge>
                {selectedCollege?.name ? <Badge variant="outline">{selectedCollege.name}</Badge> : null}
                <Badge variant="outline">Page {pagination.page}</Badge>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Department notice feed</h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Live updates from your selected college. We&apos;re using the new paginated notices API here, so this feed is now aligned with the backend contract we&apos;ll keep building on.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button type="button" variant={activeTab === 'foryou' ? 'default' : 'outline'} onClick={() => setActiveTab('foryou')}>
                For you
              </Button>
              <Button type="button" variant={activeTab === 'following' ? 'default' : 'outline'} onClick={() => setActiveTab('following')}>
                Following
              </Button>
              <Button type="button" variant="outline" onClick={() => void refresh()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-4 w-4" />
                  Search notices
                </CardTitle>
                <CardDescription>Search by title, content, or department.</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search the notice feed"
                />
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Compass className="h-4 w-4" />
                  Departments
                </CardTitle>
                <CardDescription>
                  Follow the departments you care about most.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {DEPARTMENTS.filter((department) => department.value !== 'all').map((department) => {
                  const DepartmentIcon = department.icon;
                  const isFollowing = followedDeptIds.includes(department.value);
                  return (
                    <div key={department.value} className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 p-3">
                      <Link href={`/department/${department.value}`} className="flex min-w-0 items-center gap-3">
                        <div className="rounded-full border border-border/60 bg-background p-2">
                          <DepartmentIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{department.label}</div>
                          <div className="text-xs text-muted-foreground">@{department.value}</div>
                        </div>
                      </Link>
                      <Button
                        type="button"
                        size="sm"
                        variant={isFollowing ? 'outline' : 'default'}
                        disabled={pendingDept === department.value || !permissions.canFollow}
                        onClick={() => void handleFollowDepartment(department.value)}
                      >
                        {pendingDept === department.value ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    </div>
                  );
                })}
                {!permissions.canFollow ? (
                  <p className="text-xs text-muted-foreground">
                    Verified college email is required for follow actions.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <div>
                {displayedNotices.length} notices on this page{activeTab === 'following' ? ' from followed departments' : ''}
              </div>
              <div className="inline-flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {pagination.total} total notices
              </div>
            </div>

            {isLoading ? (
              <Card className="border-border/60">
                <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading notices...</p>
                </CardContent>
              </Card>
            ) : displayedNotices.length === 0 ? (
              <Card className="border-dashed border-border/70">
                <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                  <Settings2 className="h-10 w-10 text-muted-foreground" />
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">No notices match right now</h2>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === 'following'
                        ? 'Try following a department or switch back to the main feed.'
                        : 'Try a broader search query or refresh the feed.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              displayedNotices.map((notice) => {
                const dept = getDepartmentInfo(notice.department);
                return (
                  <NoticeFeedCard
                    key={notice.id}
                    notice={notice}
                    departmentLabel={dept.label}
                    DepartmentIcon={dept.icon}
                    bookmarked={isBookmarked(notice.id)}
                    onToggleBookmark={(noticeId) => {
                      void toggleBookmark(noticeId, 'notice');
                    }}
                    onOpenDepartment={(departmentId) => {
                      router.push(`/department/${departmentId}`);
                    }}
                  />
                );
              })
            )}

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 p-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} • {pagination.limit} per page
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!pagination.hasMore}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
                <Button type="button" onClick={() => void refetch()}>
                  Reload page
                </Button>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

