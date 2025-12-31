import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bell, Building, Users, Heart, MessageCircle, Share, Calendar, FileText, Video as VideoIcon, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "../supabase";
import { useAuth } from "@/context/AuthContext";
import ImageViewer from "@/components/ImageViewer";
import VideoPlayer from "@/components/VideoPlayer";

const DEPARTMENTS = [
    { value: 'all', label: 'All Departments', icon: '🏛️' },
    { value: 'cse', label: 'Computer Science', icon: '💻' },
    { value: 'ece', label: 'Electronics', icon: '⚡' },
    { value: 'me', label: 'Mechanical', icon: '⚙️' },
    { value: 'ce', label: 'Civil', icon: '🏗️' },
    { value: 'eee', label: 'Electrical', icon: '🔌' },
    { value: 'aiml', label: 'AI & ML', icon: '🤖' },
    { value: 'ds', label: 'Data Science', icon: '📊' },
    { value: 'it', label: 'Information Technology', icon: '🌐' },
];

interface Notice {
    id: string;
    title: string;
    content: string;
    department: string;
    priority: string;
    file_url: string | null;
    file_type: 'pdf' | 'video' | 'image' | null;
    created_by: string;
    created_at: string;
    expires_at: string | null;
    is_active: boolean;
    likes: number;
    comments: number;
}

const DepartmentProfile = () => {
    const navigate = useNavigate();
    const { deptId } = useParams<{ deptId: string }>();
    const { user } = useAuth();

    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [likedNotices, setLikedNotices] = useState<string[]>([]);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; url: string; title: string }>({
        isOpen: false, url: "", title: ""
    });
    const [videoPlayer, setVideoPlayer] = useState<{ isOpen: boolean; url: string; title: string }>({
        isOpen: false, url: "", title: ""
    });

    const department = DEPARTMENTS.find(d => d.value === deptId);

    useEffect(() => {
        if (deptId) {
            fetchNotices();
            checkFollowingStatus();
            fetchFollowerCount();
        }
    }, [deptId, user]);

    const fetchNotices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('notices')
                .select('*')
                .eq('department', deptId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const activeNotices = (data || [])
                .filter(notice => !notice.expires_at || new Date(notice.expires_at) > new Date())
                .map(notice => ({
                    ...notice,
                    likes: 0,
                    comments: 0,
                }));

            setNotices(activeNotices);
        } catch (error) {
            console.error('Error fetching notices:', error);
            toast.error('Failed to load department notices');
        } finally {
            setLoading(false);
        }
    };

    const checkFollowingStatus = async () => {
        if (!user?.email || !deptId) return;

        try {
            const { data } = await supabase
                .from('department_followers')
                .select('id')
                .eq('department_id', deptId)
                .eq('follower_email', user.email)
                .maybeSingle();

            setIsFollowing(!!data);
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    };

    const fetchFollowerCount = async () => {
        if (!deptId) return;

        try {
            const { count, error } = await supabase
                .from('department_followers')
                .select('*', { count: 'exact', head: true })
                .eq('department_id', deptId);

            if (error) throw error;
            setFollowerCount(count || 0);
        } catch (error) {
            console.error('Error fetching follower count:', error);
        }
    };

    const handleFollow = async () => {
        if (!user?.email || !deptId) {
            toast.error('Please login to follow departments');
            return;
        }

        try {
            if (isFollowing) {
                const { error } = await supabase
                    .from('department_followers')
                    .delete()
                    .eq('department_id', deptId)
                    .eq('follower_email', user.email);

                if (error) throw error;
                setIsFollowing(false);
                setFollowerCount(prev => Math.max(0, prev - 1));
                toast.success('Unfollowed department');
            } else {
                const { error } = await supabase
                    .from('department_followers')
                    .insert([{
                        department_id: deptId,
                        follower_email: user.email,
                    }]);

                if (error) throw error;
                setIsFollowing(true);
                setFollowerCount(prev => prev + 1);
                toast.success('Following department!');
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            toast.error('Failed to update follow status');
        }
    };

    const toggleLike = (noticeId: string) => {
        setLikedNotices(prev =>
            prev.includes(noticeId) ? prev.filter(id => id !== noticeId) : [...prev, noticeId]
        );
    };

    const handleShare = async (notice: Notice) => {
        const shareText = `${notice.title}\n\n${notice.content}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: notice.title,
                    text: shareText,
                    url: window.location.href,
                });
            } catch { }
        } else {
            await navigator.clipboard.writeText(shareText);
            toast.success("Copied to clipboard!");
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMins = Math.floor(diffInMs / (1000 * 60));
            return diffInMins <= 1 ? 'Just now' : `${diffInMins}m`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d`;
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredNotices = notices.filter(notice =>
        notice.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!department) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-semibold mb-2">Department Not Found</h2>
                    <Button onClick={() => navigate('/notices')}>Back to Notices</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/notices')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <span className="text-2xl">{department.icon}</span>
                                {department.label}
                            </h1>
                            <p className="text-sm text-muted-foreground">{notices.length} notices</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Department Header Card */}
                <Card className="p-6 mb-6">
                    <div className="flex items-start gap-6">
                        <Avatar className="w-24 h-24">
                            <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                                {department.icon}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">{department.label}</h2>
                            <p className="text-muted-foreground mb-4">
                                Official department account for {department.label}
                            </p>
                            <div className="flex items-center gap-6 mb-4">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-semibold">{notices.length}</span>
                                    <span className="text-sm text-muted-foreground">Notices</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-semibold">{followerCount}</span>
                                    <span className="text-sm text-muted-foreground">Followers</span>
                                </div>
                            </div>
                            <Button
                                onClick={handleFollow}
                                variant={isFollowing ? "outline" : "default"}
                                className="w-full sm:w-auto"
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Search */}
                <div className="mb-4">
                    <Input
                        placeholder="Search notices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                </div>

                {/* Notices Feed */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <ScrollArea className="h-[calc(100vh-28rem)]">
                        <div className="space-y-4 pr-4">
                            {filteredNotices.map((notice) => (
                                <Card
                                    key={notice.id}
                                    className="p-6 hover:shadow-lg transition-all cursor-pointer"
                                    onClick={() => setSelectedNotice(notice)}
                                >
                                    <div className="flex items-start gap-4">
                                        <Avatar className="w-12 h-12">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {department.icon}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-semibold">{department.label}</span>
                                                <span className="text-muted-foreground text-sm">·</span>
                                                <span className="text-muted-foreground text-sm">{formatTimeAgo(notice.created_at)}</span>
                                                {notice.priority === 'urgent' && (
                                                    <Badge variant="destructive" className="ml-2">Urgent</Badge>
                                                )}
                                            </div>

                                            {notice.title && (
                                                <h3 className="text-lg font-semibold mb-2">{notice.title}</h3>
                                            )}

                                            <p className="text-foreground mb-3 whitespace-pre-wrap">{notice.content}</p>

                                            {notice.file_url && notice.file_type === 'image' && (
                                                <div
                                                    className="relative rounded-lg overflow-hidden cursor-pointer group mb-3"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setImageViewer({ isOpen: true, url: notice.file_url!, title: notice.title || 'Notice Image' });
                                                    }}
                                                >
                                                    <img
                                                        src={notice.file_url}
                                                        alt="Notice"
                                                        className="w-full h-64 object-cover transition-transform group-hover:scale-105"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-8 mt-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleLike(notice.id);
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-2 transition-colors",
                                                        likedNotices.includes(notice.id) ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                                                    )}
                                                >
                                                    <Heart className={cn("w-5 h-5", likedNotices.includes(notice.id) && "fill-current")} />
                                                    <span className="text-sm">{notice.likes + (likedNotices.includes(notice.id) ? 1 : 0)}</span>
                                                </button>
                                                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                                    <MessageCircle className="w-5 h-5" />
                                                    <span className="text-sm">{notice.comments}</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleShare(notice);
                                                    }}
                                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <Share className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            {filteredNotices.length === 0 && (
                                <div className="text-center py-12">
                                    <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground text-lg">No notices found</p>
                                    <p className="text-muted-foreground text-sm mt-2">
                                        {searchQuery ? 'Try adjusting your search' : 'Check back later for updates'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* Image Viewer */}
            <ImageViewer
                isOpen={imageViewer.isOpen}
                onClose={() => setImageViewer({ isOpen: false, url: "", title: "" })}
                imageUrl={imageViewer.url}
                title={imageViewer.title}
            />

            {/* Video Player */}
            <VideoPlayer
                isOpen={videoPlayer.isOpen}
                onClose={() => setVideoPlayer({ isOpen: false, url: "", title: "" })}
                videoUrl={videoPlayer.url}
                title={videoPlayer.title}
            />
        </div>
    );
};

export default DepartmentProfile;
