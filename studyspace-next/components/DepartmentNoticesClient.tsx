'use client';

import { useMemo, useState } from "react";
import type { ElementType } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Building2, Cpu, Database, Globe, Loader2, Search, PlugZap, Zap, Cog } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { NoticeFeedCard } from "@/components/NoticeFeedCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useNotices } from "@/hooks/useNotices";

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

function normalizeHandle(value: string | string[] | undefined) {
  return String(Array.isArray(value) ? value[0] : value || '').trim().replace(/^@/, '').toLowerCase();
}

function getDepartmentInfo(handle: string) {
  return DEPARTMENTS.find((department) => department.value === handle) || {
    value: handle,
    label: handle ? handle.toUpperCase() : 'Department',
    icon: Building2,
  };
}

export function DepartmentNoticesClient() {
  const router = useRouter();
  const params = useParams();
  const accountHandle = normalizeHandle(params.accountHandle);
  const department = getDepartmentInfo(accountHandle);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const { notices, pagination, isLoading, refetch } = useNotices({ department: accountHandle, page, limit: 20 });
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const filteredNotices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notices;
    return notices.filter((notice) =>
      [notice.title, notice.content].filter(Boolean).some((value) => value.toLowerCase().includes(query)),
    );
  }, [notices, searchQuery]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <div className="space-y-4">
            <Button variant="ghost" className="-ml-3 w-fit px-3" asChild>
              <Link href="/notices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to notices
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-border/60 bg-background p-3">
                <department.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight">{department.label}</h1>
                  <Badge variant="outline">@{department.value}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Direct department notice feed for this account handle.
                </p>
              </div>
            </div>
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search this department feed"
            />
          </div>
        </section>

        {isLoading ? (
          <Card className="border-border/60">
            <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading department notices...</p>
            </CardContent>
          </Card>
        ) : filteredNotices.length === 0 ? (
          <Card className="border-dashed border-border/70">
            <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
              <Search className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">No notices found</h2>
                <p className="text-sm text-muted-foreground">
                  Try another search or jump to the full department profile.
                </p>
              </div>
              <Button asChild>
                <Link href={`/department/${department.value}`}>Open department profile</Link>
              </Button>
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
                onOpenDepartment={() => {
                  router.push(`/department/${department.value}`);
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

