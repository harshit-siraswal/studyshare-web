'use client';

import Link from "next/link";
import { Bookmark, ExternalLink, FileText, PlayCircle, Clock3, GraduationCap, Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ResourceKind = "notes" | "video" | "pyq";

type ResourceFeedCardProps = {
  id: string;
  title: string;
  description?: string;
  type: ResourceKind;
  subject: string;
  chapter?: string;
  semester?: string;
  branch?: string;
  votes?: number;
  author?: string;
  createdAt?: string;
  fileUrl?: string;
  videoUrl?: string;
  bookmarked?: boolean;
  onToggleBookmark?: (resourceId: string) => void;
  className?: string;
};

const typeConfig: Record<ResourceKind, { label: string; icon: typeof FileText }> = {
  notes: { label: "Notes", icon: FileText },
  pyq: { label: "PYQ", icon: FileText },
  video: { label: "Video", icon: PlayCircle },
};

function formatRelativeDate(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const deltaMs = Date.now() - date.getTime();
  const deltaMinutes = Math.floor(deltaMs / (1000 * 60));
  if (deltaMinutes < 1) return "Just now";
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;

  const deltaDays = Math.floor(deltaHours / 24);
  if (deltaDays < 7) return `${deltaDays}d ago`;

  return date.toLocaleDateString();
}

export function ResourceFeedCard({
  id,
  title,
  description,
  type,
  subject,
  chapter,
  semester,
  branch,
  votes = 0,
  author,
  createdAt,
  fileUrl,
  videoUrl,
  bookmarked = false,
  onToggleBookmark,
  className,
}: ResourceFeedCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;
  const primaryUrl = type === "video" ? videoUrl : fileUrl;

  return (
    <Card className={cn("border-border/60 bg-card/90 shadow-sm", className)}>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Icon className="h-3.5 w-3.5" />
              {config.label}
            </Badge>
            {votes > 0 ? <Badge variant="outline">{votes} votes</Badge> : null}
          </div>
          <CardTitle className="text-lg leading-snug">{title}</CardTitle>
          {description ? (
            <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
          ) : null}
        </div>
        {onToggleBookmark ? (
          <Button
            type="button"
            variant={bookmarked ? "default" : "outline"}
            size="icon"
            className="shrink-0"
            onClick={() => onToggleBookmark(id)}
            aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark className={cn("h-4 w-4", bookmarked ? "fill-current" : "")} />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="h-4 w-4" />
            {subject || "General"}
          </span>
          {chapter ? (
            <span className="inline-flex items-center gap-1">
              <Layers3 className="h-4 w-4" />
              {chapter}
            </span>
          ) : null}
          {branch ? <span>{branch}</span> : null}
          {semester ? <span>Semester {semester}</span> : null}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {author ? <span>By {author}</span> : null}
          {createdAt ? (
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {formatRelativeDate(createdAt)}
            </span>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {type === "video" ? "Open the source video to study." : "Open the resource file in a new tab."}
        </div>
        {primaryUrl ? (
          <Button asChild>
            <Link href={primaryUrl} target="_blank" rel="noreferrer">
              Open {type === "video" ? "video" : "resource"}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button disabled variant="outline">
            File unavailable
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
