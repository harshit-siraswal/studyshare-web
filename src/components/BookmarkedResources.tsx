// src/components/BookmarkedResources.tsx
// Shows resources the user has bookmarked

import { useState, useEffect } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { supabase } from "../supabase";
import { useBookmarks } from "@/hooks/useBookmarks";
import ResourceCard, { ResourceType } from "@/components/ResourceCard";
import ResourceCardSkeleton from "@/components/ResourceCardSkeleton";

interface BookmarkedResource {
    id: string;
    title: string;
    type: ResourceType;
    subject: string;
    chapter: string | null;
    semester: string;
    branch: string;
    file_url: string | null;
    video_url: string | null;
    uploaded_by_name: string | null;
    uploaded_by_email: string | null;
    upvotes: number;
    downvotes: number;
    created_at: string;
}

const BookmarkedResources = () => {
    const { user } = useAuth();
    const { selectedCollege } = useCollege();
    const { bookmarkedIds, loading: bookmarksLoading, refresh } = useBookmarks();
    const [resources, setResources] = useState<BookmarkedResource[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch bookmarked resources when bookmarkedIds changes
    useEffect(() => {
        if (!bookmarksLoading && bookmarkedIds.size > 0) {
            fetchBookmarkedResources();
        } else if (!bookmarksLoading) {
            setResources([]);
            setLoading(false);
        }
    }, [bookmarkedIds, bookmarksLoading]);

    const fetchBookmarkedResources = async () => {
        setLoading(true);
        try {
            const resourceIds = Array.from(bookmarkedIds);

            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .in('id', resourceIds)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformed = (data || []).map(resource => ({
                ...resource,
                upvotes: resource.upvotes || 0,
                downvotes: resource.downvotes || 0,
                votes: (resource.upvotes || 0) - (resource.downvotes || 0),
            }));

            setResources(transformed);
        } catch (error) {
            console.error('Error fetching bookmarked resources:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || bookmarksLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            My Bookmarks
                        </h2>
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <ResourceCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (resources.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <Bookmark className="w-16 h-16 mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">No Bookmarks Yet</h2>
                <p className="text-muted-foreground mb-4 max-w-md">
                    Save resources by clicking the bookmark icon on any resource card.
                    Your saved items will appear here for quick access.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        My Bookmarks
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {resources.length} saved resource{resources.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { refresh(); fetchBookmarkedResources(); }}>
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((resource) => (
                    <ResourceCard
                        key={resource.id}
                        id={resource.id}
                        title={resource.title}
                        type={resource.type}
                        author={resource.uploaded_by_name || "Anonymous"}
                        authorType="student"
                        upvotes={resource.upvotes}
                        downvotes={resource.downvotes}
                        votes={(resource.upvotes || 0) - (resource.downvotes || 0)}
                        subject={resource.subject}
                        chapter={resource.chapter || "General"}
                        pdfUrl={resource.file_url}
                        videoUrl={resource.video_url}
                        semester={resource.semester}
                        branch={resource.branch}
                        uploaded_by_email={resource.uploaded_by_email}
                        created_at={resource.created_at}
                    />
                ))}
            </div>
        </div>
    );
};

export default BookmarkedResources;
