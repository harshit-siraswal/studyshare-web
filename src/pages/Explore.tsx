// src/pages/Explore.tsx
// Explore page - discover users from same college domain
// FIX: Filter users by college email domain, use FollowButton for request-based flow

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users as UsersIcon, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { usePermissions } from "@/hooks/usePermissions";
import * as api from "@/lib/api";
import { supabase } from "../supabase";
import { toast } from "sonner";
import FollowButton from "@/components/FollowButton";
import { SEO } from "@/components/SEO";

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
    const { selectedCollege, isReadOnly } = useCollege();
    const { canFollow } = usePermissions();

    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [followingCount, setFollowingCount] = useState(0);

    // Fetch users from same college domain ONLY
    useEffect(() => {
        if (selectedCollege) {
            fetchUsersFromSameDomain();
            fetchFollowingCount();
        }
    }, [authUser, selectedCollege]);

    const fetchUsersFromSameDomain = async () => {
        if (!selectedCollege) return;

        try {
            // FIX: Filter by email domain to show only same-college users
            const domain = selectedCollege.domain;

            const { data, error } = await supabase
                .from('users')
                .select('id, email, display_name, username, profile_photo_url, college, bio')
                .ilike('email', `%@${domain}`) // Only users with matching domain
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

    const fetchFollowingCount = async () => {
        if (!authUser?.email) return;

        try {
            // Get list via Backend API
            const { following } = await api.getFollowing();
            setFollowingCount(following.length);
        } catch (error) {
            console.error('Error fetching following count:', error);
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
                user.bio?.toLowerCase().includes(query)
            );
            setFilteredUsers(filtered);
        }
    }, [searchQuery, users]);

    // Policy: Show message for readonly users
    if (isReadOnly) {
        return (
            <div className="min-h-screen-safe bg-background flex items-center justify-center">
                <div className="text-center p-8">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-semibold mb-2">Explore Students</h2>
                    <p className="text-muted-foreground mb-4">
                        Sign in with your college email to discover and connect with students
                    </p>
                    <Button onClick={() => navigate('/study')}>
                        Back to Study
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen-safe bg-background">
            <SEO
                title="Explore Students"
                description="Discover and connect with students from your college. Find classmates, follow peers, and build your academic network."
                noIndex
            />
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/study")}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-foreground">Explore</h1>
                            <p className="text-sm text-muted-foreground">
                                Discover students from {selectedCollege?.name || 'your college'}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-3 sm:p-4 pb-20 sm:pb-4">
                {/* Domain Filter Notice */}
                <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-primary">
                        Showing students with <strong>@{selectedCollege?.domain}</strong> email addresses
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or username..."
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
                                <p className="text-2xl font-bold">{followingCount}</p>
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
                            <p className="text-muted-foreground mt-4">Loading students...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">
                                {searchQuery ? "No students found matching your search" : "No students found from your college"}
                            </p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <Card
                                key={user.id}
                                className="p-2 sm:p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <Avatar
                                        className="w-12 h-12 cursor-pointer"
                                        onClick={() => navigate(`/profile/${user.username}`)}
                                    >
                                        <AvatarImage src={user.profile_photo_url || undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {user.display_name?.[0] || user.email[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => navigate(`/profile/${user.username}`)}
                                    >
                                        <h3 className="font-semibold text-foreground truncate">
                                            {user.display_name || user.email?.split('@')[0] || 'User'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground truncate">
                                            @{user.username || user.email?.split('@')[0] || 'user'}
                                        </p>
                                        {user.bio && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                {user.bio}
                                            </p>
                                        )}
                                    </div>

                                    {/* FIX: Use FollowButton component for request-based follow */}
                                    <FollowButton
                                        targetUserEmail={user.email}
                                        targetUserName={user.display_name}
                                        size="sm"
                                    />
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
