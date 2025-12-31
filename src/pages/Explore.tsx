import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, Users as UsersIcon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "../supabase";
import { toast } from "sonner";

interface User {
    id: string;
    email: string;
    display_name: string;
    username: string;
    profile_photo_url: string | null;
    college: string;
    bio: string;
}

const Explore = () => {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

    // Fetch all users
    useEffect(() => {
        fetchUsers();
        if (authUser?.email) {
            fetchFollowedUsers();
        }
    }, [authUser]);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, email, display_name, username, profile_photo_url, college, bio')
                .limit(50);

            if (error) throw error;

            // Filter out current user
            const filteredData = data?.filter(u => u.email !== authUser?.email) || [];
            setUsers(filteredData);
            setFilteredUsers(filteredData);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchFollowedUsers = async () => {
        if (!authUser?.email) return;

        try {
            const { data, error } = await supabase
                .from('follows')
                .select('following_email')
                .eq('follower_email', authUser.email);

            if (error) throw error;

            const followed = new Set(data?.map(f => f.following_email) || []);
            setFollowedUsers(followed);
        } catch (error) {
            console.error('Error fetching followed users:', error);
        }
    };

    const handleFollow = async (userEmail: string) => {
        if (!authUser?.email) {
            toast.error('Please login to follow users');
            return;
        }

        try {
            const isFollowing = followedUsers.has(userEmail);

            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_email', authUser.email)
                    .eq('following_email', userEmail);

                if (error) throw error;

                setFollowedUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(userEmail);
                    return newSet;
                });
                toast.success('Unfollowed user');
            } else {
                // Follow
                const { error } = await supabase
                    .from('follows')
                    .insert([{
                        follower_email: authUser.email,
                        following_email: userEmail
                    }]);

                if (error) throw error;

                setFollowedUsers(prev => new Set([...prev, userEmail]));
                toast.success('Following user!');
            }
        } catch (error) {
            console.error('Error following user:', error);
            toast.error('Failed to follow user');
        }
    };

    // Filter users based on search
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredUsers(users);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = users.filter(user =>
                user.display_name.toLowerCase().includes(query) ||
                user.username.toLowerCase().includes(query) ||
                user.college.toLowerCase().includes(query)
            );
            setFilteredUsers(filtered);
        }
    }, [searchQuery, users]);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/study")}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-foreground">Explore</h1>
                            <p className="text-sm text-muted-foreground">Discover students from your college</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-4">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, username, or college..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <UsersIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{users.length}</p>
                                <p className="text-sm text-muted-foreground">Students</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{followedUsers.size}</p>
                                <p className="text-sm text-muted-foreground">Following</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Users List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                            <p className="text-muted-foreground mt-4">Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No users found</p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <Card
                                key={user.id}
                                className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        className="w-12 h-12 cursor-pointer"
                                        onClick={() => navigate(`/profile/${user.username}`)}
                                    >
                                        <AvatarImage src={user.profile_photo_url || undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {user.display_name[0]}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => navigate(`/profile/${user.username}`)}
                                    >
                                        <h3 className="font-semibold text-foreground truncate">
                                            {user.display_name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground truncate">
                                            @{user.username}
                                        </p>
                                        {user.bio && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                {user.bio}
                                            </p>
                                        )}
                                        <Badge variant="outline" className="mt-2 text-xs">
                                            {user.college}
                                        </Badge>
                                    </div>

                                    <Button
                                        variant={followedUsers.has(user.email) ? "outline" : "default"}
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFollow(user.email);
                                        }}
                                    >
                                        {followedUsers.has(user.email) ? (
                                            <>Following</>
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4 mr-1" />
                                                Follow
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Explore;
