'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2, Search, TrendingUp, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { usePermissions } from "@/hooks/usePermissions";
import { cancelFollowRequest, checkFollowStatus, getFollowing, sendFollowRequest, unfollowUser } from "@/lib/api";
import { supabase } from "@/supabase";
import { toast } from "sonner";

type ExploreUser = {
  id: string;
  email: string;
  display_name: string;
  username?: string;
  profile_photo_url?: string | null;
  college?: string | null;
  bio?: string | null;
};

type FollowStatus = {
  status: "following" | "pending" | "not-following";
  requestId?: string;
};

function ExploreUserCard({
  user,
  followStatus,
  loading,
  onAction,
}: {
  user: ExploreUser;
  followStatus: FollowStatus;
  loading: boolean;
  onAction: (user: ExploreUser) => void;
}) {
  const primaryLabel =
    followStatus.status === "following"
      ? "Following"
      : followStatus.status === "pending"
        ? "Pending"
        : "Follow";

  return (
    <Card className="border-border/60 transition-colors hover:bg-accent/30">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={user.profile_photo_url || undefined} alt={user.display_name || user.email} />
            <AvatarFallback>
              {(user.display_name || user.email || "U").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{user.display_name || user.email.split("@")[0]}</h3>
              {user.username ? <Badge variant="outline">@{user.username}</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.bio ? <p className="text-sm text-muted-foreground">{user.bio}</p> : null}
            {user.college ? <p className="text-xs text-muted-foreground">{user.college}</p> : null}
          </div>
        </div>

        <Button
          type="button"
          variant={followStatus.status === "not-following" ? "default" : "outline"}
          onClick={() => onAction(user)}
          disabled={loading}
          className="min-w-28"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
          {primaryLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ExploreClient() {
  const { user: authUser } = useAuth();
  const { selectedCollege, isReadOnly } = useCollege();
  const { canFollow } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<ExploreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);
  const [statusMap, setStatusMap] = useState<Record<string, FollowStatus>>({});
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadExploreData() {
      if (!selectedCollege?.domain || !authUser?.email) {
        setUsers([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [{ data, error }, followingResponse] = await Promise.all([
          supabase
            .from("users")
            .select("id, email, display_name, username, profile_photo_url, college, bio")
            .ilike("email", `%@${selectedCollege.domain}`)
            .limit(50),
          getFollowing(),
        ]);

        if (error) throw error;

        const nextUsers = ((data || []) as ExploreUser[]).filter((entry) => entry.email !== authUser.email);
        if (ignore) return;

        setUsers(nextUsers);
        setFollowingCount(followingResponse.following.length);

        const statuses = await Promise.all(
          nextUsers.map(async (entry) => {
            try {
              const result = await checkFollowStatus(entry.email);
              return [entry.email, result] as const;
            } catch {
              return [entry.email, { status: "not-following" as const }] as const;
            }
          }),
        );

        if (ignore) return;
        setStatusMap(Object.fromEntries(statuses));
      } catch (error) {
        console.error("Failed to load explore data", error);
        toast.error("Failed to load students from your college.");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadExploreData();

    return () => {
      ignore = true;
    };
  }, [authUser?.email, selectedCollege?.domain]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter((entry) =>
      [entry.display_name, entry.username, entry.bio, entry.email]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [searchQuery, users]);

  async function handleFollowAction(target: ExploreUser) {
    if (!canFollow) {
      toast.error("Follow requests require a verified college email.");
      return;
    }

    const currentStatus = statusMap[target.email] || { status: "not-following" as const };

    try {
      setPendingEmail(target.email);

      if (currentStatus.status === "following") {
        await unfollowUser(target.email);
        setStatusMap((prev) => ({ ...prev, [target.email]: { status: "not-following" } }));
        setFollowingCount((count) => Math.max(0, count - 1));
        toast.success(`Unfollowed ${target.display_name || target.email}`);
        return;
      }

      if (currentStatus.status === "pending" && currentStatus.requestId) {
        await cancelFollowRequest(currentStatus.requestId);
        setStatusMap((prev) => ({ ...prev, [target.email]: { status: "not-following" } }));
        toast.success(`Cancelled request to ${target.display_name || target.email}`);
        return;
      }

      const response = await sendFollowRequest(target.email);
      setStatusMap((prev) => ({
        ...prev,
        [target.email]: {
          status: response.request.status === "accepted" ? "following" : "pending",
          requestId: response.request.id,
        },
      }));
      if (response.request.status === "accepted") {
        setFollowingCount((count) => count + 1);
      }
      toast.success(`Request sent to ${target.display_name || target.email}`);
    } catch (error: any) {
      console.error("Follow action failed", error);
      toast.error(error?.message || "Unable to update follow state right now.");
    } finally {
      setPendingEmail(null);
    }
  }

  if (isReadOnly) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-lg border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-600" />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Explore is locked in read-only mode</h1>
              <p className="text-sm text-muted-foreground">
                Sign in with your verified college email to discover classmates and send follow requests.
              </p>
            </div>
            <Button asChild>
              <Link href="/study">Back to study</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Button variant="ghost" className="-ml-3 w-fit px-3" asChild>
              <Link href="/study">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to study
              </Link>
            </Button>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Explore students</h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Discover students using <strong>@{selectedCollege?.domain}</strong> and grow your academic network inside {selectedCollege?.name || "your college"}.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:min-w-72 sm:grid-cols-2">
            <Card className="border-border/60">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{users.length}</div>
                  <div className="text-xs text-muted-foreground">Students visible</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{followingCount}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, username, bio, or email"
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          {loading ? (
            <Card className="border-border/60">
              <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading students from your college domain...</p>
              </CardContent>
            </Card>
          ) : filteredUsers.length === 0 ? (
            <Card className="border-dashed border-border/70">
              <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">No students found yet</h2>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "Try a broader search query."
                      : `We couldn't find student profiles using @${selectedCollege?.domain} yet.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((entry) => (
              <ExploreUserCard
                key={entry.id}
                user={entry}
                followStatus={statusMap[entry.email] || { status: "not-following" }}
                loading={pendingEmail === entry.email}
                onAction={handleFollowAction}
              />
            ))
          )}
        </section>
      </div>
    </main>
  );
}
