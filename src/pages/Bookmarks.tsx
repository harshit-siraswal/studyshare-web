// src/pages/Bookmarks.tsx
// Dedicated bookmarks page (like Twitter's /bookmarks)

import { useState } from "react";
import { Bookmark, Search, ArrowLeft, MoreHorizontal, Trash2, FileText, Heart, MessageCircle, Share, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import ResourceCard, { ResourceType } from "@/components/ResourceCard";
import ResourceCardSkeleton from "@/components/ResourceCardSkeleton";
import StudySidebar from "@/components/StudySidebar";
import StudyTimer from "@/components/StudyTimer";
import MusicPlayer from "@/components/MusicPlayer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const Bookmarks = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { bookmarks, loading, refresh, toggleBookmark, clearAll } = useBookmarks();
    const [filter, setFilter] = useState<'all' | 'resources' | 'notices'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Get username from user email
    const username = user?.email?.split('@')[0] || 'user';

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);
        if (diffInHours < 1) return `${Math.floor(diffInMs / (1000 * 60))}m`;
        if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
        return `${Math.floor(diffInHours / 24)}d`;
    };

    // Filter bookmarks by type and search query
    const filteredBookmarks = bookmarks.filter(b => {
        // Type filter
        if (filter !== 'all' && filter !== b.type + 's') return false;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            if (b.type === 'resource' && b.content) {
                return b.content.title?.toLowerCase().includes(query) ||
                    b.content.subject?.toLowerCase().includes(query);
            }
            if (b.type === 'notice' && b.content) {
                return b.content.title?.toLowerCase().includes(query) ||
                    b.content.content?.toLowerCase().includes(query);
            }
            return false;
        }
        return true;
    });

    const handleClearAll = async () => {
        setClearing(true);
        try {
            await clearAll();
            toast.success('All bookmarks cleared');
            setShowClearDialog(false);
        } catch (error) {
            toast.error('Failed to clear bookmarks');
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <div className="hidden md:block shrink-0">
                <StudySidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex justify-center">
                <div className="w-full max-w-2xl border-x border-border min-h-screen">
                    {/* Twitter-style sticky header */}
                    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
                        <div className="flex items-center gap-4 px-4 py-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="flex-1">
                                <h1 className="text-xl font-bold">Bookmarks</h1>
                                <p className="text-sm text-muted-foreground">@{username}</p>
                            </div>

                            {/* Three dots menu with Clear all option */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={refresh}
                                        className="cursor-pointer"
                                    >
                                        Refresh
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setShowClearDialog(true)}
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                        disabled={bookmarks.length === 0}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Clear all Bookmarks
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Search bar */}
                        <div className="px-4 pb-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search Bookmarks"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 rounded-full bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                                />
                            </div>
                        </div>

                        {/* Filter Tabs - Twitter style */}
                        <div className="flex border-b border-border">
                            {(['all', 'resources', 'notices'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "flex-1 py-3 text-sm font-medium transition-colors hover:bg-secondary/50 relative",
                                        filter === f ? "text-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    {f === 'all' ? 'All' : f === 'resources' ? 'Resources' : 'Notices'}
                                    {filter === f && (
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Feed */}
                    <div className="divide-y divide-border">
                        {loading ? (
                            // Loading skeletons
                            <div className="p-4 space-y-4">
                                {[1, 2, 3, 4].map((i) => <ResourceCardSkeleton key={i} />)}
                            </div>
                        ) : bookmarks.length === 0 ? (
                            // Empty state
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                                <Bookmark className="w-16 h-16 mb-4 text-muted-foreground/30" />
                                <h2 className="text-xl font-bold mb-2">Save posts for later</h2>
                                <p className="text-muted-foreground max-w-sm">
                                    Bookmark resources and notices to easily find them later.
                                    Just tap the bookmark icon on any post.
                                </p>
                            </div>
                        ) : filteredBookmarks.length === 0 ? (
                            // No search results
                            <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-4">
                                <Search className="w-12 h-12 mb-4 text-muted-foreground/30" />
                                <h3 className="text-lg font-semibold mb-1">No results found</h3>
                                <p className="text-muted-foreground text-sm">
                                    Try searching for something else
                                </p>
                            </div>
                        ) : (
                            // Bookmarks list
                            filteredBookmarks.map((bookmark) => {
                                if (bookmark.type === 'resource' && bookmark.content) {
                                    const r = bookmark.content;
                                    return (
                                        <div key={bookmark.id} className="px-4 py-3 hover:bg-secondary/20 transition-colors">
                                            <ResourceCard
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
                                        </div>
                                    );
                                }

                                if (bookmark.type === 'notice' && bookmark.content) {
                                    const notice = bookmark.content;
                                    const dept = DEPARTMENTS[notice.department || ''] || { label: notice.department || 'Notice', icon: '📌' };
                                    return (
                                        <div key={bookmark.id} className="px-4 py-3">
                                            {/* Notice Card - styled like resource cards */}
                                            <div
                                                className="p-4 border border-border/50 rounded-xl hover:bg-secondary/20 transition-colors cursor-pointer bg-card"
                                                onClick={() => notice.department && navigate(`/department/${notice.department}`)}
                                            >
                                                <div className="flex gap-3">
                                                    <Avatar className="w-10 h-10 border border-border shrink-0">
                                                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-500 text-white text-lg">{dept.icon}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold">{dept.label}</span>
                                                            <span className="text-muted-foreground text-sm">@{notice.department || 'notice'}</span>
                                                            <span className="text-muted-foreground text-sm">·</span>
                                                            <span className="text-muted-foreground text-sm">{notice.created_at ? formatTimeAgo(notice.created_at) : ''}</span>
                                                            {notice.priority === 'urgent' && (
                                                                <Badge variant="destructive" className="ml-auto h-5 text-[10px]">Urgent</Badge>
                                                            )}
                                                        </div>
                                                        {notice.title && <h3 className="font-bold mt-2 text-base text-foreground">{notice.title}</h3>}
                                                        <p className="text-foreground/80 whitespace-pre-wrap mt-1 text-sm leading-relaxed line-clamp-3">{notice.content}</p>

                                                        {/* Media preview */}
                                                        {notice.file_url && notice.file_type === 'image' && (
                                                            <img src={notice.file_url} alt="" className="mt-3 rounded-xl max-h-48 object-cover border border-border/50" />
                                                        )}

                                                        {/* Action bar */}
                                                        <div className="flex items-center gap-6 mt-3 pt-3 border-t border-border/30 text-muted-foreground">
                                                            <Button variant="ghost" size="sm" className="gap-1 hover:text-blue-400 rounded-full h-8 px-2">
                                                                <MessageCircle className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="gap-1 hover:text-pink-500 rounded-full h-8 px-2">
                                                                <Heart className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="gap-1 text-primary rounded-full h-8 px-2"
                                                                onClick={(e) => { e.stopPropagation(); toggleBookmark(notice.id, 'notice'); }}
                                                            >
                                                                <Bookmark className="w-4 h-4 fill-current" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="gap-1 hover:text-green-500 rounded-full h-8 px-2">
                                                                <Share className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return null;
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Desktop only */}
            <div className="hidden lg:block w-80 shrink-0 p-4 space-y-4">
                <StudyTimer />
                <MusicPlayer />
            </div>

            {/* Clear All Confirmation Dialog */}
            <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear all Bookmarks?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove all your saved bookmarks. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearAll}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={clearing}
                        >
                            {clearing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Clear all
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Bookmarks;
