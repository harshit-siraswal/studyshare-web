'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import type { ChatComment } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatTimeAgo(dateString?: string | null) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diffInMs = Date.now() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return "Just now";
  if (diffInMins < 60) return `${diffInMins}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  return `${diffInDays}d`;
}

function CommentNode({
  comment,
  getReplies,
  currentUserEmail,
  onReply,
  onDelete,
}: {
  comment: ChatComment;
  getReplies: (commentId: string) => ChatComment[];
  currentUserEmail?: string | null;
  onReply: (content: string, parentId?: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const canDelete = Boolean(currentUserEmail && currentUserEmail === comment.author_email);

  return (
    <div className="space-y-3 rounded-2xl border border-border/50 p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 border">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {comment.author_name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href={`/profile/${encodeURIComponent(comment.author_email?.split("@")[0] || comment.author_name.toLowerCase())}`}
              className="font-medium hover:text-primary"
            >
              {comment.author_name}
            </Link>
            <span className="text-muted-foreground">• {formatTimeAgo(comment.created_at)}</span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{comment.content}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setReplying((value) => !value)}>
              <MessageCircle className="mr-1 h-4 w-4" />
              Reply
            </Button>
            {canDelete ? (
              <Button variant="ghost" size="sm" onClick={() => void onDelete(comment.id)}>
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>

          {replying ? (
            <div className="flex gap-2">
              <Input
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Write a reply..."
                onKeyDown={(event) => {
                  if (event.key === "Enter" && replyText.trim()) {
                    event.preventDefault();
                    void onReply(replyText, comment.id).then(() => {
                      setReplyText("");
                      setReplying(false);
                    });
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (!replyText.trim()) return;
                  void onReply(replyText, comment.id).then(() => {
                    setReplyText("");
                    setReplying(false);
                  });
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {getReplies(comment.id).length > 0 ? (
        <div className="ml-6 space-y-3 border-l border-border/60 pl-4">
          {getReplies(comment.id).map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              getReplies={getReplies}
              currentUserEmail={currentUserEmail}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ChatCommentThread({
  comments,
  currentUserEmail,
  onReply,
  onDelete,
}: {
  comments: ChatComment[];
  currentUserEmail?: string | null;
  onReply: (content: string, parentId?: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}) {
  const rootComments = useMemo(
    () => comments.filter((comment) => !comment.parent_id),
    [comments],
  );

  const repliesByParent = useMemo(() => {
    const map = new Map<string, ChatComment[]>();
    comments.forEach((comment) => {
      if (!comment.parent_id) return;
      const existing = map.get(comment.parent_id) || [];
      existing.push(comment);
      map.set(comment.parent_id, existing);
    });
    return map;
  }, [comments]);

  if (rootComments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments yet. Start the conversation below.</p>;
  }

  return (
    <div className="space-y-3">
      {rootComments.map((comment) => (
        <CommentNode
          key={comment.id}
          comment={comment}
          getReplies={(commentId) => repliesByParent.get(commentId) || []}
          currentUserEmail={currentUserEmail}
          onReply={onReply}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
