// src/components/BookmarkedResources.tsx
// Shows unified bookmarks: Resources + Notices (Twitter-style)

import { useState } from "react";
import { Bookmark, FileText, Bell, Heart, MessageCircle, Share, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useBookmarks } from "@/hooks/useBookmarks";
import ResourceCard, { ResourceType } from "@/components/ResourceCard";
import ResourceCardSkeleton from "@/components/ResourceCardSkeleton";
import { cn } from "@/lib/utils";

// Department info helper
const DEPARTMENTS: Record<string, { label: string; icon: string }> = {
    cse: { label: 'Computer Science', icon: '💻' },
    ece: { label: 'Electronics', icon: '⚡' },
    me: { label: 'Mechanical', icon: '⚙️' },
    ce: { label: 'Civil', icon: '🏗️' },
    eee: { label: 'Electrical', icon: '🔌' },
    aiml: { label: 'AI & ML', icon: '🤖' },
    ds: { label: 'Data Science', icon: '📊' },
    it: { label: 'Information Technology', icon: '🌐' },
};

const BookmarkedResources = () => {
    const navigate = useNavigate();
    const { bookmarks, loading, refresh, toggleBookmark } = useBookmarks();
    const [filter, setFilter] = useState<'all' | 'resources' | 'notices'>('all');

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);
        if (diffInHours < 1) return `${Math.floor(diffInMs / (1000 * 60))}m`;
        if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
        return `${Math.floor(diffInHours / 24)}d`;
    };

    const filteredBookmarks = bookmarks.filter(b => {
        if (filter === 'all') return true;
        return filter === b.type + 's'; // 'resources' or 'notices'
    });

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">My Bookmarks</h2>
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => <ResourceCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (bookmarks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <Bookmark className="w-16 h-16 mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">No Bookmarks Yet</h2>
                <p className="text-muted-foreground mb-4 max-w-md">
                    Save resources and notices by clicking the bookmark icon.
                    Your saved items will appear here for quick access.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with filter tabs */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">My Bookmarks</h2>
                    <p className="text-sm text-muted-foreground">
                        {filteredBookmarks.length} saved item{filteredBookmarks.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={refresh}>Refresh</Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
                {(['all', 'resources', 'notices'] as const).map((f) => (
                    <Button
                        key={f}
                        variant={filter === f ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(f)}
                        className="capitalize"
                    >
                        {f === 'all' ? 'All' : f === 'resources' ? '📚 Resources' : '📢 Notices'}
                    </Button>
                ))}
            </div>

            {/* Mixed Content Feed */}
            <div className="space-y-4">
                {filteredBookmarks.map((bookmark) => {
                    if (bookmark.type === 'resource' && bookmark.content) {
                        const r = bookmark.content;
                        return (
                            <ResourceCard
                                key={bookmark.id}
                                id={r.id}
                                title={r.title}
                                type={r.type as ResourceType}
                                author={r.uploaded_by_name || "Anonymous"}
                                authorType="student"
                                upvotes={r.upvotes || 0}
                                downvotes={r.downvotes || 0}
                                votes={(r.upvotes || 0) - (r.downvotes || 0)}
                                subject={r.subject}
                                chapter={r.chapter || "General"}
                                pdfUrl={r.file_url}
                                videoUrl={r.video_url}
                                semester={r.semester}
                                branch={r.branch}
                                uploaded_by_email={r.uploaded_by_email}
                                created_at={r.created_at}
                            />
                        );
                    }

                    if (bookmark.type === 'notice' && bookmark.content) {
                        const notice = bookmark.content;
                        const dept = DEPARTMENTS[notice.department] || { label: notice.department, icon: '📌' };
                        return (
                            <div
                                key={bookmark.id}
                                className="p-4 border border-border/50 rounded-xl hover:bg-secondary/10 transition-colors cursor-pointer bg-card"
                                onClick={() => navigate(`/department/${notice.department}`)}
                            >
                                <div className="flex gap-3">
                                    <Avatar className="w-10 h-10 border border-border shrink-0">
                                        <AvatarFallback className="bg-secondary text-lg">{dept.icon}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-bold hover:underline">{dept.label}</span>
                                            <span className="text-muted-foreground text-sm">@{notice.department}</span>
                                            <span className="text-muted-foreground text-sm">·</span>
                                            <span className="text-muted-foreground text-sm">{formatTimeAgo(notice.created_at)}</span>
                                            {notice.priority === 'urgent' && <Badge variant="destructive" className="ml-auto h-5 text-[10px]">Urgent</Badge>}
                                        </div>
                                        {notice.title && <h3 className="font-bold mt-1 text-base">{notice.title}</h3>}
                                        <p className="text-foreground/90 whitespace-pre-wrap mt-1 text-[15px] leading-normal line-clamp-3">{notice.content}</p>

                                        {/* Media preview */}
                                        {notice.file_url && notice.file_type === 'image' && (
                                            <img src={notice.file_url} alt="" className="mt-3 rounded-xl max-h-48 object-cover border border-border/50" />
                                        )}

                                        {/* Action bar */}
                                        <div className="flex items-center gap-6 mt-3 text-muted-foreground">
                                            <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-blue-400 rounded-full">
                                                <MessageCircle className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-pink-500 rounded-full">
                                                <Heart className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-8 h-8 text-primary rounded-full"
                                                onClick={(e) => { e.stopPropagation(); toggleBookmark(notice.id, 'notice'); }}
                                            >
                                                <Bookmark className="w-4 h-4 fill-current" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-green-500 rounded-full">
                                                <Share className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return null;
                })}
            </div>
        </div>
    );
};

export default BookmarkedResources;
