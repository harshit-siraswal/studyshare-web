'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Compass, Filter, Lock, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ResourceFeedCard } from "@/components/ResourceFeedCard";
import { useCollege } from "@/context/CollegeContext";
import { BRANCH_OPTIONS, SEMESTER_OPTIONS, getBranchLabel, getSubjectsForBranchAndSemester, normalizeBranchCode } from "@/lib/academicSubjects";
import { useBookmarks } from "@/hooks/useBookmarks";
import { usePermissions } from "@/hooks/usePermissions";
import { useResources } from "@/hooks/useResources";

const RESOURCE_TYPES = [
  { value: "all", label: "All types" },
  { value: "notes", label: "Notes" },
  { value: "video", label: "Videos" },
  { value: "pyq", label: "PYQs" },
] as const;

export function StudyClient() {
  const { selectedCollege } = useCollege();
  const permissions = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [semester, setSemester] = useState("");
  const [branch, setBranch] = useState("");
  const [subject, setSubject] = useState("");
  const [resourceType, setResourceType] = useState<(typeof RESOURCE_TYPES)[number]["value"]>("all");

  const { resources, isLoading, refetch } = useResources({
    semester: semester || undefined,
    branch: branch || undefined,
    subject: subject || undefined,
  });
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const subjectOptions = useMemo(() => {
    const catalogSubjects = getSubjectsForBranchAndSemester(branch, semester);
    if (catalogSubjects.length > 0) return catalogSubjects;

    const uniqueSubjects = new Set<string>();
    resources.forEach((resource) => {
      const matchesBranch = !branch || normalizeBranchCode(resource.branch) === normalizeBranchCode(branch);
      const matchesSemester = !semester || resource.semester === semester;
      if (matchesBranch && matchesSemester && resource.subject) {
        uniqueSubjects.add(resource.subject);
      }
    });

    return Array.from(uniqueSubjects).sort((a, b) => a.localeCompare(b));
  }, [branch, semester, resources]);

  useEffect(() => {
    if (subject && !subjectOptions.includes(subject)) {
      setSubject("");
    }
  }, [subject, subjectOptions]);

  const filteredResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return resources.filter((resource) => {
      if (resourceType !== "all" && resource.type !== resourceType) return false;
      if (!query) return true;

      return [
        resource.title,
        resource.description,
        resource.subject,
        resource.chapter,
        resource.uploaded_by_name,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [resourceType, resources, searchQuery]);

  const totalVotes = useMemo(
    () => filteredResources.reduce((sum, resource) => sum + (resource.votes || 0), 0),
    [filteredResources],
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
          <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Study workspace</Badge>
                {selectedCollege?.name ? <Badge variant="outline">{selectedCollege.name}</Badge> : null}
                {permissions.isReadOnly ? (
                  <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300">
                    <Lock className="h-3.5 w-3.5" />
                    Read-only mode
                  </Badge>
                ) : null}
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Study resources</h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Browse notes, videos, and previous-year questions for {selectedCollege?.name || "your selected college"}. We&apos;re keeping this first Next.js batch lean so the core study flow is back quickly.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>{filteredResources.length} matching resources</span>
                <span>{totalVotes} total votes</span>
                {branch ? <span>{getBranchLabel(branch)}</span> : null}
                {semester ? <span>Semester {semester}</span> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button variant="outline" asChild>
                <Link href="/explore">
                  <Compass className="mr-2 h-4 w-4" />
                  Explore students
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/bookmarks">
                  <Bookmark className="mr-2 h-4 w-4" />
                  View bookmarks
                </Link>
              </Button>
              <Button type="button" onClick={() => void refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="h-fit border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-4 w-4" />
                Filter resources
              </CardTitle>
              <CardDescription>
                Narrow the feed by semester, branch, subject, or type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="resource-search">Search</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="resource-search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search title, subject, chapter..."
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <label className="space-y-2 text-sm font-medium">
                  <span>Semester</span>
                  <select
                    value={semester}
                    onChange={(event) => setSemester(event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">All semesters</option>
                    {SEMESTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>Branch</span>
                  <select
                    value={branch}
                    onChange={(event) => setBranch(event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">All branches</option>
                    {BRANCH_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>Subject</span>
                  <select
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">All subjects</option>
                    {subjectOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>Type</span>
                  <select
                    value={resourceType}
                    onChange={(event) => setResourceType(event.target.value as (typeof RESOURCE_TYPES)[number]["value"])}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {RESOURCE_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setSearchQuery("");
                  setSemester("");
                  setBranch("");
                  setSubject("");
                  setResourceType("all");
                }}
              >
                Reset filters
              </Button>
            </CardContent>
          </Card>

          <section className="space-y-4">
            {permissions.isReadOnly ? (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="flex flex-col gap-2 p-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    You can browse and bookmark resources in read-only mode. Uploading, following, and social actions will unlock once you use a verified college email.
                  </div>
                  <Badge variant="outline">Browsing enabled</Badge>
                </CardContent>
              </Card>
            ) : null}

            {isLoading ? (
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="border-border/60">
                    <CardContent className="space-y-3 p-6">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredResources.length === 0 ? (
              <Card className="border-dashed border-border/70">
                <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <Search className="h-10 w-10 text-muted-foreground" />
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">No resources match these filters</h2>
                    <p className="text-sm text-muted-foreground">
                      Try widening the search or resetting one of the filters. Once we migrate uploads, this page will grow into the full study hub again.
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
                  type={resource.type}
                  subject={resource.subject}
                  chapter={resource.chapter}
                  semester={resource.semester}
                  branch={resource.branch}
                  votes={resource.votes}
                  author={resource.uploaded_by_name}
                  createdAt={resource.created_at}
                  fileUrl={resource.file_url}
                  videoUrl={resource.video_url}
                  bookmarked={isBookmarked(resource.id)}
                  onToggleBookmark={(resourceId) => {
                    if (!permissions.canBookmark) return;
                    void toggleBookmark(resourceId, "resource");
                  }}
                />
              ))
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
