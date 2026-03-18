'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Loader2, RefreshCw, Search, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ResourceFeedCard } from "@/components/ResourceFeedCard";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import { toast } from "sonner";

type BookmarkFilter = "all" | "resources" | "notices";

export function BookmarksClient() {
  const { user } = useAuth();
  const { bookmarks, loading, refresh, toggleBookmark, clearAll, isBookmarked } = useBookmarks();
  const [filter, setFilter] = useState<BookmarkFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  const filteredBookmarks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return bookmarks.filter((bookmark) => {
      if (filter !== "all") {
        const expectedType = filter === "resources" ? "resource" : "notice";
        if (bookmark.type !== expectedType) return false;
      }

      if (!query) return true;

      const content = bookmark.content || {};
      const searchFields = [
        content.title,
        content.description,
        content.subject,
        content.content,
      ]
        .filter(Boolean)
        .map((value: string) => value.toLowerCase());

      return searchFields.some((value) => value.includes(query));
    });
  }, [bookmarks, filter, searchQuery]);

  const resourceCount = bookmarks.filter((bookmark) => bookmark.type === "resource").length;
  const noticeCount = bookmarks.filter((bookmark) => bookmark.type === "notice").length;
  const username = user?.email?.split("@")[0] || "student";

  async function handleClearAll() {
    try {
      setIsClearing(true);
      const success = await clearAll();
      if (success) {
        toast.success("All bookmarks cleared.");
      } else {
        toast.error("We couldn't clear your bookmarks right now.");
      }
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Button variant="ghost" className="-ml-3 w-fit px-3" asChild>
              <Link href="/study">Back to study</Link>
            </Button>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Bookmarks</Badge>
                <Badge variant="outline">@{username}</Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Saved for later</h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Your bookmarked resources and notices live here. This first Next.js pass keeps the experience focused while we migrate the rest of the study workspace.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button type="button" variant="outline" onClick={() => void refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" disabled={bookmarks.length === 0 || isClearing}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all bookmarks?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes saved resources and notices from your account. You can always bookmark them again later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleClearAll()} disabled={isClearing}>
                    {isClearing ? "Clearing..." : "Clear bookmarks"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search saved resources and notices"
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="grid grid-cols-3 gap-3 p-4 text-center md:grid-cols-1 md:text-left">
              <div>
                <div className="text-2xl font-semibold">{bookmarks.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{resourceCount}</div>
                <div className="text-xs text-muted-foreground">Resources</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{noticeCount}</div>
                <div className="text-xs text-muted-foreground">Notices</div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="flex flex-wrap gap-2">
          {([
            ["all", "All"],
            ["resources", "Resources"],
            ["notices", "Notices"],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        <section className="space-y-4">
          {loading ? (
            <Card className="border-border/60">
              <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading your bookmarks...</p>
              </CardContent>
            </Card>
          ) : filteredBookmarks.length === 0 ? (
            <Card className="border-dashed border-border/70">
              <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                <Bookmark className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">Nothing saved yet</h2>
                  <p className="text-sm text-muted-foreground">
                    Bookmark a resource or notice from the study feed and it will show up here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredBookmarks.map((bookmark) => {
              if (bookmark.type === "resource" && bookmark.content) {
                const resource = bookmark.content;
                return (
                  <ResourceFeedCard
                    key={bookmark.id}
                    id={resource.id}
                    title={resource.title}
                    description={resource.description}
                    type={resource.type}
                    subject={resource.subject || "General"}
                    chapter={resource.chapter}
                    semester={resource.semester}
                    branch={resource.branch}
                    votes={typeof resource.upvotes === "number" && typeof resource.downvotes === "number"
                      ? resource.upvotes - resource.downvotes
                      : resource.votes}
                    author={resource.uploaded_by_name || resource.uploadedByName}
                    createdAt={resource.created_at || resource.createdAt}
                    fileUrl={resource.file_url || resource.filePath}
                    videoUrl={resource.video_url || resource.url}
                    bookmarked={isBookmarked(resource.id)}
                    onToggleBookmark={(resourceId) => {
                      void toggleBookmark(resourceId, "resource");
                    }}
                  />
                );
              }

              if (bookmark.type === "notice" && bookmark.content) {
                const notice = bookmark.content;
                return (
                  <Card key={bookmark.id} className="border-border/60">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-xl">{notice.title || "Untitled notice"}</CardTitle>
                          <CardDescription>
                            {notice.department || notice.scopeLabel || "Notice"}
                          </CardDescription>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const itemId = notice.id || bookmark.noticeId;
                            if (itemId) {
                              void toggleBookmark(itemId, "notice");
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {notice.content ? <p className="text-sm text-muted-foreground">{notice.content}</p> : null}
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {notice.created_at || notice.createdAt ? <span>{new Date(notice.created_at || notice.createdAt).toLocaleString()}</span> : null}
                        {notice.author_name || notice.authorName ? <span>By {notice.author_name || notice.authorName}</span> : null}
                      </div>
                      {notice.file_url || notice.fileUrl ? (
                        <Button asChild variant="outline">
                          <Link href={notice.file_url || notice.fileUrl} target="_blank" rel="noreferrer">
                            Open attachment
                          </Link>
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              }

              return null;
            })
          )}
        </section>
      </div>
    </main>
  );
}
