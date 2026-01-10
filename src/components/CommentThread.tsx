
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, MessageCircle, CornerDownRight, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Maximum nesting depth to prevent abuse (Reddit uses ~10, we use 5 for mobile UX)
const MAX_DEPTH = 5;

// Unified comment interface supporting both Notices (user_name) and Chat (author_name)
export interface CommentData {
    id: string;
    content: string;
    created_at: string;
    parent_id?: string;

    // Notice comments use these
    user_name?: string;
    user_email?: string;

    // Chat comments use these
    author_name?: string;
    author_email?: string;
}

interface CommentThreadProps {
    comments: CommentData[];
    currentUserEmail?: string | null;
    onReply: (content: string, parentId?: string) => Promise<void>;
    onDelete?: (commentId: string) => Promise<void>;
    className?: string;
}

export function CommentThread({ comments, currentUserEmail, onReply, onDelete, className }: CommentThreadProps) {
    // Build tree with defensive null handling
    const buildTree = (parentId: string | null | undefined = undefined) => {
        // Normalize parent_id to handle null/undefined consistently
        const normalizedParentId = parentId ?? null;
        return comments
            .filter(c => (c.parent_id ?? null) === normalizedParentId)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Oldest first
            .map(comment => ({
                ...comment,
                replies: buildTree(comment.id)
            }));
    };

    const rootComments = buildTree();

    return (
        <div className={cn("space-y-4", className)}>
            {rootComments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
            ) : (
                rootComments.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        replies={comment.replies}
                        currentUserEmail={currentUserEmail}
                        onReply={onReply}
                        onDelete={onDelete}
                    />
                ))
            )}
        </div>
    );
}

interface CommentItemProps {
    comment: CommentData;
    replies: any[];
    currentUserEmail?: string | null;
    onReply: (content: string, parentId?: string) => Promise<void>;
    onDelete?: (commentId: string) => Promise<void>;
    depth?: number;
}

function CommentItem({ comment, replies, currentUserEmail, onReply, onDelete, depth = 0 }: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmitReply = async () => {
        if (!replyContent.trim()) return;
        setSubmitting(true);
        try {
            await onReply(replyContent, comment.id);
            setIsReplying(false);
            setReplyContent("");
        } catch (error) {
            console.error("Failed to reply", error);
        } finally {
            setSubmitting(false);
        }
    };

    const authorName = comment.author_name || comment.user_name || 'User';
    const authorEmail = comment.author_email || comment.user_email;

    const isOwner = currentUserEmail && authorEmail === currentUserEmail;

    return (
        <div className="group">
            <div className={cn("flex gap-3", depth > 0 && "mt-3")}>
                <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-secondary text-xs">
                        {authorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{authorName}</span>
                        <span className="text-xs text-muted-foreground">
                            {(() => {
                                try {
                                    return formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
                                } catch {
                                    return 'just now';
                                }
                            })()}
                        </span>
                        {isOwner && onDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-6 h-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => onDelete(comment.id)}
                            >
                                <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                        )}
                    </div>

                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>

                    <div className="flex items-center gap-4 mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => setIsReplying(!isReplying)}
                        >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Reply
                        </Button>
                    </div>

                    {isReplying && (
                        <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
                            <div className="w-8 shrink-0 flex justify-center">
                                <CornerDownRight className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                            <div className="flex-1 flex gap-2">
                                <Input
                                    placeholder={`Reply to ${authorName}...`}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="h-9 text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmitReply();
                                        }
                                    }}
                                    autoFocus
                                />
                                <Button size="icon" className="h-9 w-9" onClick={handleSubmitReply} disabled={!replyContent.trim() || submitting}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Replies - with depth limiting */}
            {replies.length > 0 && depth < MAX_DEPTH && (
                <div className="ml-4 pl-4 border-l border-border/50 mt-3 space-y-3">
                    {replies.map((reply: any) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            replies={reply.replies}
                            currentUserEmail={currentUserEmail}
                            onReply={onReply}
                            onDelete={onDelete}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
            {/* Show indicator when max depth reached but there are more replies */}
            {replies.length > 0 && depth >= MAX_DEPTH && (
                <div className="ml-4 pl-4 mt-2">
                    <span className="text-xs text-muted-foreground italic">
                        {replies.length} more {replies.length === 1 ? 'reply' : 'replies'}...
                    </span>
                </div>
            )}
        </div>
    );
}
