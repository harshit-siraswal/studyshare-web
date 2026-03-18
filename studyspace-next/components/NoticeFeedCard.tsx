'use client';

import Link from "next/link";
import type { ElementType } from "react";
import { Bell, Bookmark, ExternalLink, FileImage, FileText, MessageCircle, PlayCircle } from "lucide-react";
import type { Notice } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NoticeFeedCardProps = {
  notice: Notice;
  departmentLabel: string;
  DepartmentIcon: ElementType;
  bookmarked?: boolean;
  onToggleBookmark?: (noticeId: string) => void;
  onOpenDepartment?: (departmentId: string) => void;
  className?: string;
};

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function getAttachmentLabel(notice: Notice) {
  if (notice.file_type === "video") {
    return { label: "Open video", Icon: PlayCircle };
  }
  if (notice.file_type === "image") {
    return { label: "Open image", Icon: FileImage };
  }
  return { label: "Open attachment", Icon: FileText };
}

export function NoticeFeedCard({
  notice,
  departmentLabel,
  DepartmentIcon,
  bookmarked = false,
  onToggleBookmark,
  onOpenDepartment,
  className,
}: NoticeFeedCardProps) {
  const attachment = getAttachmentLabel(notice);

  return (
    <Card className={cn("border-border/60 bg-card/90 shadow-sm", className)}>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <button
            type="button"
            className="shrink-0"
            onClick={() => onOpenDepartment?.(notice.department)}
            disabled={!onOpenDepartment}
          >
            <Avatar className="h-10 w-10 border border-border/60">
              <AvatarFallback className="bg-background">
                <DepartmentIcon className="h-4 w-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="font-medium hover:underline"
                onClick={() => onOpenDepartment?.(notice.department)}
                disabled={!onOpenDepartment}
              >
                {departmentLabel}
              </button>
              <Badge variant="outline">@{notice.department}</Badge>
              {notice.priority ? <Badge variant={notice.priority === 'urgent' ? 'destructive' : 'secondary'}>{notice.priority}</Badge> : null}
            </div>
            <CardTitle className="text-lg leading-snug">{notice.title || 'Untitled notice'}</CardTitle>
          </div>
        </div>
        {onToggleBookmark ? (
          <Button
            type="button"
            variant={bookmarked ? "default" : "outline"}
            size="icon"
            className="shrink-0"
            onClick={() => onToggleBookmark(notice.id)}
            aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark className={cn("h-4 w-4", bookmarked ? "fill-current" : "")} />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{notice.content}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Bell className="h-3.5 w-3.5" />
            {formatRelativeDate(notice.created_at)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {notice.comments_count ?? notice.comments ?? 0} comments
          </span>
          <span>{notice.likes || 0} likes</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          Department updates stay scoped to your selected college.
        </div>
        {notice.file_url ? (
          <Button asChild>
            <Link href={notice.file_url} target="_blank" rel="noreferrer">
              {attachment.label}
              <attachment.Icon className="ml-2 h-4 w-4" />
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button disabled variant="outline">
            No attachment
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

