import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import * as api from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Crown, CreditCard, FileText, Video, HelpCircle, Users, LogOut, Edit2, Search, Camera, X, Check, MoreVertical, Trash2, Bookmark, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import PDFViewer from "@/components/PDFViewer";
import EditResourceDialog from "@/components/EditResourceDialog";
import FollowButton from "@/components/FollowButton";
import ImageCropper from "@/components/ImageCropper";
import { supabase } from "../supabase";
import { SEO } from "@/components/SEO";
import PremiumModal from "@/components/PremiumModal";
import { buildAiTokenBudgetSnapshot, formatVisibleAiTokens } from "@/lib/aiTokens";
import VideoPlayer from "@/components/VideoPlayer";
import {
  BRANCH_OPTIONS,
  SEMESTER_OPTIONS,
  getBranchLabel,
  getSubjectsForBranchAndSemester,
  normalizeBranchCode,
} from "@/lib/academicSubjects";

// TypeScript Interfaces
interface Contribution {
  id: number | string;
  title: string;
  type: string;
  votes: number;
  status: string;
  date: string;
  url?: string;
  pdfUrl?: string;
  semester?: string;
  branch?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  description?: string;
  uploaded_by_email?: string;
  uploaded_by_name?: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  college: string;
  email?: string;
  bio?: string;
  profilePhoto?: string;
  role?: string;
  contributions?: Contribution[];
  followers?: User[];
  following?: User[];
  isTeacher?: boolean;
}

interface ProfileUser {
  name: string;
  username: string;
  email: string;
  college: string;
  bio: string;
  profilePhoto: string;
  role: string;
}

interface SavedPost {
  id: string;
  roomName: string;
  roomId: string | null;
  messageId: string | null;
  savedAt: string | null;
  content: string | null;
  imageUrl: string | null;
  authorName: string | null;
  authorEmail: string | null;
  postedAt: string | null;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  bio?: string;
  profile_photo_url?: string;
  college?: string;
  branch?: string;
  semester?: string;
  subject?: string;
  username?: string;
  role?: string;
  created_at?: string;
  ai_token_budget?: number;
  ai_token_used?: number;
  ai_token_remaining?: number;
  ai_token_base_budget?: number;
  ai_token_budget_multiplier?: number;
  ai_token_premium_multiplier?: number;
  ai_token_cycle_days?: number;
  ai_token_cycle_started_at?: string;
  ai_token_cycle_ends_at?: string;
  subscription_tier?: string;
  subscription_end_date?: string;
  ai_budget_inr?: number;
}

interface AiTokenUsage {
  budget: number;
  used: number;
  remaining: number;
  baseBudget: number;
  budgetMultiplier: number;
  premiumMultiplier: number;
  cycleDays: number;
  cycleStartedAt: string | null;
  cycleEndsAt: string | null;
  budgetInr: number;
}

const DEFAULT_AI_TOKEN_BASE_BUDGET = 40160;
const USER_PROFILE_SELECT =
  "id, email, display_name, bio, profile_photo_url, college, branch, semester, subject, username, role, created_at, subscription_tier, subscription_end_date";
const DISCOVER_USER_SELECT =
  "id, email, display_name, username, profile_photo_url, college";

const DEFAULT_AI_TOKEN_BUDGET = (() => {
  const raw = Number(import.meta.env.VITE_AI_TOKEN_BUDGET ?? 10000);
  if (!Number.isFinite(raw) || raw <= 0) return 10000;
  return Math.round(raw);
})();

function toSafeInt(value: unknown): number {
  const parsed = toOptionalNumber(value);
  if (parsed === undefined || !Number.isFinite(parsed)) return 0;
  return Math.round(parsed);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatCycleDate(value: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function formatVisibleCreditCount(rawValue: number): string {
  return formatVisibleAiTokens(rawValue);
}

function getContributionDescription(description?: string): string | null {
  if (!description) return null;
  const normalized = description.trim();
  if (!normalized) return null;

  if (
    /fallback classification used/i.test(normalized) ||
    /llm_disabled/i.test(normalized) ||
    /resource_create_failed/i.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

function normalizeProfilePhotoUrl(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;

  const nullLikeValues = new Set(["null", "undefined", "n/a", "-"]);
  if (nullLikeValues.has(trimmed.toLowerCase())) {
    return null;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  return trimmed;
}

function resolveProfilePhotoUrl(
  source: unknown,
  fallbackValues: Array<string | null | undefined> = [],
): string | null {
  const candidates: Array<string | null | undefined> = [];

  const addCandidate = (value: unknown) => {
    if (value == null) return;
    candidates.push(String(value));
  };

  const addFromMap = (map: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      if (!(key in map)) continue;
      addCandidate(map[key]);
    }
  };

  if (source && typeof source === "object") {
    const map = source as Record<string, unknown>;
    const defaultKeys = [
      "profile_photo_url",
      "photo_url",
      "avatar_url",
      "author_photo_url",
      "user_photo_url",
      "photoURL",
      "avatarUrl",
    ];

    addFromMap(map, defaultKeys);

    for (const nestedKey of ["user", "author", "profile"]) {
      const nested = map[nestedKey];
      if (!nested || typeof nested !== "object") continue;
      addFromMap(nested as Record<string, unknown>, defaultKeys);
    }
  } else {
    addCandidate(source);
  }

  candidates.push(...fallbackValues);

  for (const candidate of candidates) {
    const normalized = normalizeProfilePhotoUrl(candidate);
    if (normalized) return normalized;
  }

  return null;
}

function extractCollegeName(value?: string | null): string {
  if (!value) return "College";
  const trimmed = value.trim();
  if (!trimmed) return "College";

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed?.name === "string" && parsed.name.trim()) {
        return parsed.name.trim();
      }
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

function isPremiumTierActive(profile?: Partial<UserProfile> | null): boolean {
  if (!profile) return false;
  const tier = String(profile.subscription_tier ?? "").trim().toLowerCase();
  if (!["pro", "max", "premium"].includes(tier)) return false;
  if (!profile.subscription_end_date) return false;
  const expiry = new Date(profile.subscription_end_date);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() > Date.now();
}

function getBranchBadgeLabel(branch?: string | null): string {
  const normalized = normalizeBranchCode(branch);
  const shortLabels: Record<string, string> = {
    cse: "CSE",
    it: "IT",
    cse_ai: "CSE (AI)",
    aiml: "CSE (AI & ML)",
    ds: "CSE (DS)",
    cse_cs: "CSE (Cyber Security)",
    me: "ME",
    amia: "AM&IA",
    elce: "ELCE",
    eee: "EEE",
    ece: "ECE",
    ece_vlsi: "ECE (VLSI)",
    ce: "CE",
  };

  if (normalized && shortLabels[normalized]) {
    return shortLabels[normalized];
  }

  const label = getBranchLabel(branch);
  return label || (branch ?? "");
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const direct = Number(trimmed);
    if (Number.isFinite(direct)) return direct;

    const commaNormalized = trimmed.replace(/,/g, "");
    const commaParsed = Number(commaNormalized);
    if (Number.isFinite(commaParsed)) return commaParsed;

    const match = commaNormalized.match(/-?\d+(?:\.\d+)?/);
    if (!match) return undefined;
    const fromSubstring = Number(match[0]);
    return Number.isFinite(fromSubstring) ? fromSubstring : undefined;
  }
  return undefined;
}

const mockContributions: Contribution[] = [
  { id: 1, title: "Complete Guide to Arrays", type: "video", votes: 156, status: "approved", date: "2024-03-10", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 2, title: "OS Process Management Notes", type: "notes", votes: 89, status: "pending", date: "2024-03-08", pdfUrl: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf" },
  { id: 3, title: "DBMS Mid-Sem 2023", type: "pyq", votes: 234, status: "approved", date: "2024-03-05", pdfUrl: "https://www.db-book.com/slides-dir/PDF-dir/ch1.pdf" },
  { id: 4, title: "Network Protocols Summary", type: "notes", votes: 67, status: "approved", date: "2024-03-01", pdfUrl: "https://intronetworks.cs.luc.edu/current2/ComputerNetworks.pdf" },
];

const mockFollowers: User[] = [
  { id: 1, name: "Rahul K.", username: "rahul_k_2024", college: "IIT Delhi" },
  { id: 2, name: "Priya M.", username: "priya_m_tech", college: "NIT Trichy" },
  { id: 3, name: "Amit S.", username: "amit_bits", college: "BITS Pilani" },
  { id: 4, name: "Sneha P.", username: "sneha_iitb", college: "IIT Bombay" },
];

const mockFollowing: User[] = [
  { id: 1, name: "Prof. Sharma", username: "prof_sharma_cs", college: "Computer Science Dept." },
  { id: 2, name: "Vikram R.", username: "vikram_r_24", college: "IIT Delhi" },
  { id: 3, name: "Study Group", username: "cse_2024_group", college: "CSE 2024" },
];

const allUsers: User[] = [
  { id: 5, name: "Neha Singh", username: "neha_singh_cs", college: "IIT Kanpur", contributions: mockContributions.slice(0, 2), followers: mockFollowers.slice(0, 2), following: mockFollowing.slice(0, 1) },
  { id: 6, name: "Arjun Verma", username: "arjun_v_2024", college: "NIT Surathkal", contributions: mockContributions.slice(1, 3), followers: mockFollowers.slice(1, 3), following: mockFollowing.slice(0, 2) },
  { id: 7, name: "Pooja Reddy", username: "pooja_r_aiml", college: "IIIT Hyderabad", contributions: mockContributions.slice(0, 3), followers: mockFollowers.slice(0, 3), following: mockFollowing },
  { id: 8, name: "Prof. Kumar", username: "prof_kumar_ml", college: "ML Department", contributions: mockContributions, followers: mockFollowers, following: mockFollowing, isTeacher: true },
  ...mockFollowers.map(f => ({ ...f, contributions: mockContributions.slice(0, 2), followers: mockFollowers.slice(0, 2), following: mockFollowing.slice(0, 1) })),
  ...mockFollowing.map(f => ({ ...f, contributions: mockContributions.slice(1, 3), followers: mockFollowers.slice(1, 3), following: mockFollowing.slice(0, 2) })),
];

const typeIcons = {
  video: Video,
  notes: FileText,
  pyq: HelpCircle,
};

function generateUsername() {
  const adjectives = ["happy", "smart", "cool", "quick", "bright"];
  const nouns = ["student", "learner", "coder", "reader", "scholar"];
  const num = Math.floor(Math.random() * 1000);
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}_${nouns[Math.floor(Math.random() * nouns.length)]}_${num}`;
}

const Profile = () => {
  const navigate = useNavigate();
  const { username: viewingUsername } = useParams();
  const isViewingOther = !!viewingUsername;

  /* === AUTH === */
  const { user: authUser, loading, logout } = useAuth();
  const { selectedCollege } = useCollege();

  /* === STATE === */
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ title: string; url: string; resourceId?: string } | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ title: string; url: string; resourceId?: string } | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);

  // Supabase state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [viewFollowers, setViewFollowers] = useState<any[]>([]);
  const [viewFollowing, setViewFollowing] = useState<any[]>([]);
  const [viewFollowersCount, setViewFollowersCount] = useState(0);
  const [viewFollowingCount, setViewFollowingCount] = useState(0);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [viewingOtherProfile, setViewingOtherProfile] = useState<UserProfile | null>(null);
  const [aiTokenUsage, setAiTokenUsage] = useState<AiTokenUsage | null>(null);

  // Discover Users State
  const [showDiscoverDialog, setShowDiscoverDialog] = useState(false);
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([]);
  const [discoverSearch, setDiscoverSearch] = useState("");

  // Image Cropper State
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalMode, setPremiumModalMode] = useState<"premium" | "recharge">("premium");


  /* === EDIT FORM === */
  const [editForm, setEditForm] = useState({
    name: authUser?.displayName || "",
    bio: "",
    username: generateUsername(),
    profilePhoto: authUser?.photoURL || "",
    semester: "",
    branch: "",
    subject: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* === AUTH GUARD - SAFE === */
  useEffect(() => {
    if (!loading && !authUser) {
      navigate("/auth", { replace: true });
    }
  }, [authUser, loading, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) return;

      setLoadingProfile(true);
      try {
        let profile: UserProfile | null = null;

        try {
          const profileResult = await api.getMyProfile();
          profile = (profileResult?.profile ?? null) as UserProfile | null;
        } catch (apiError) {
          console.warn("Primary profile fetch failed, falling back to users table", apiError);
        }

        if (!profile) {
          const { data, error } = await supabase
            .from("users_safe")
            .select(USER_PROFILE_SELECT)
            .eq("email", authUser.email || "")
            .maybeSingle();

          if (error) throw error;

          if (!data) {
            profile = {
              id: authUser.uid,
              email: authUser.email || "",
              display_name: authUser.displayName || authUser.email?.split("@")[0] || "User",
              bio: "",
              profile_photo_url: authUser.photoURL || null,
              college: localStorage.getItem("selectedCollege") || "",
              username:
                authUser.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "user",
              branch: "",
              semester: "",
              subject: "",
            } as UserProfile;
          } else {
            profile = data as UserProfile;
          }
        }

        const resolvedProfile: UserProfile = {
          ...profile,
          id: profile?.id || authUser.uid,
          email: profile?.email || authUser.email || "",
          display_name:
            profile?.display_name ||
            authUser.displayName ||
            authUser.email?.split("@")[0] ||
            "User",
          bio: profile?.bio || "",
          college: extractCollegeName(
            profile?.college ||
              (selectedCollege?.name ? selectedCollege.name : localStorage.getItem("selectedCollege")),
          ),
          username:
            profile?.username ||
            authUser.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
            "user",
          profile_photo_url:
            resolveProfilePhotoUrl(profile, [authUser.photoURL]) || undefined,
          semester: profile?.semester || "",
          branch: normalizeBranchCode(profile?.branch) || profile?.branch || "",
          subject: profile?.subject || "",
          role: profile?.role || "student",
          subscription_tier: profile?.subscription_tier,
          subscription_end_date: profile?.subscription_end_date,
        };

        setUserProfile(resolvedProfile);
        setEditForm(prev => ({
          ...prev,
          name: resolvedProfile.display_name,
          bio: resolvedProfile.bio || "",
          username: resolvedProfile.username || prev.username,
          profilePhoto: resolvedProfile.profile_photo_url || prev.profilePhoto,
          semester: resolvedProfile.semester || "",
          branch: normalizeBranchCode(resolvedProfile.branch) || resolvedProfile.branch || "",
          subject: resolvedProfile.subject || "",
        }));
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [authUser]);

  // Fetch followers, following, and contributions in PARALLEL for faster load
  const fetchProfileData = async () => {
    if (!authUser?.email) return;

    try {
      // Parallel fetch - reduces load time by 50-70%
      const [followersData, followingData, savedPostsData, contributionsData] = await Promise.all([
        api.getFollowers(),
        api.getFollowing(),
        api.getSavedChatPosts(),
        // Fetch contributions from Supabase
        supabase
          .from('resources')
          .select('*')
          .eq('uploaded_by_email', authUser.email)
          .order('created_at', { ascending: false }),
      ]);

      // Update followers/following
      setFollowersCount(followersData.followers.length);
      setFollowers(followersData.followers);
      setFollowingCount(followingData.following.length);
      setFollowing(followingData.following);
      setSavedPosts(savedPostsData.savedPosts || []);

      // Transform and update contributions
      if (contributionsData.data && !contributionsData.error) {
        const transformed = contributionsData.data.map(r => ({
          id: r.id,
          title: r.title,
          type: r.type,
          votes: (r.upvotes || 0) - (r.downvotes || 0),
          status: r.status || 'pending',
          date: new Date(r.created_at).toLocaleDateString(),
          url: r.video_url || undefined,
          pdfUrl: r.file_url || undefined,
          semester: r.semester,
          branch: r.branch,
          subject: r.subject,
          chapter: r.chapter,
          topic: r.topic,
          description: r.description,
          uploaded_by_email: r.uploaded_by_email || authUser?.email || '',
        }));
        setContributions(transformed);
      } else if (contributionsData.error) {
        console.error('Error fetching contributions:', contributionsData.error);
        setContributions([]);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const fetchViewedSocialData = async (targetEmail?: string) => {
    if (!targetEmail) {
      setViewFollowers([]);
      setViewFollowing([]);
      setViewFollowersCount(0);
      setViewFollowingCount(0);
      return;
    }

    try {
      const [followersData, followingData] = await Promise.all([
        api.getFollowers(targetEmail),
        api.getFollowing(targetEmail),
      ]);

      setViewFollowers(followersData.followers || []);
      setViewFollowersCount(followersData.followers?.length || 0);
      setViewFollowing(followingData.following || []);
      setViewFollowingCount(followingData.following?.length || 0);
    } catch (error) {
      console.error('Error fetching viewed profile social data:', error);
      setViewFollowers([]);
      setViewFollowing([]);
      setViewFollowersCount(0);
      setViewFollowingCount(0);
    }
  };

  // Aliases for refetching (used by follow button and contribution refresh)
  const fetchContributions = fetchProfileData;

  useEffect(() => {
    fetchProfileData();
  }, [authUser]);

  useEffect(() => {
    const fetchAiTokenUsage = async () => {
      if (!authUser || isViewingOther) return;

      try {
        const profileResult = await api.getMyProfile();
        const profile = (profileResult?.profile || {}) as Partial<UserProfile>;
        setUserProfile(prev => ({
          ...(prev ?? {}),
          ...profile,
          profile_photo_url: resolveProfilePhotoUrl(profile, [
            prev?.profile_photo_url,
            authUser.photoURL,
          ]) || undefined,
        } as UserProfile));
        const balance = await api.getAiTokenBalance();
        const snapshot = buildAiTokenBudgetSnapshot(profile as Record<string, unknown>);
        const budgetFromApi = toSafeInt(balance.budget ?? profile.ai_token_budget);
        const usedFromApi = toSafeInt(balance.used ?? profile.ai_token_used);
        const remainingFromApi = toSafeInt(balance.remaining ?? profile.ai_token_remaining);
        const budget = budgetFromApi > 0 ? budgetFromApi : snapshot.currentBudget;
        const used = clamp(usedFromApi, 0, Math.max(budget, 0));
        let remaining = budget > 0
          ? clamp(remainingFromApi, 0, budget)
          : 0;
        if (budget > 0 && remaining === 0 && used < budget) {
          remaining = clamp(budget - used, 0, budget);
        }

        const cycleDaysRaw = toSafeInt(profile.ai_token_cycle_days);
        const cycleDays = cycleDaysRaw > 0 ? cycleDaysRaw : 30;
        const cycleStartedAt = profile.ai_token_cycle_started_at
          ? new Date(profile.ai_token_cycle_started_at)
          : null;
        const cycleEndsAt = profile.ai_token_cycle_ends_at
          ? new Date(profile.ai_token_cycle_ends_at)
          : null;

        setAiTokenUsage({
          budget,
          used,
          remaining,
          baseBudget: snapshot.baseBudget > 0 ? snapshot.baseBudget : DEFAULT_AI_TOKEN_BASE_BUDGET,
          budgetMultiplier: snapshot.budgetMultiplier,
          premiumMultiplier: snapshot.premiumMultiplier,
          cycleDays,
          cycleStartedAt: cycleStartedAt && !Number.isNaN(cycleStartedAt.getTime())
            ? cycleStartedAt.toISOString()
            : null,
          cycleEndsAt: cycleEndsAt && !Number.isNaN(cycleEndsAt.getTime())
            ? cycleEndsAt.toISOString()
            : null,
          budgetInr: snapshot.budgetInr,
        });
      } catch (error) {
        console.error('Failed to fetch AI token usage:', error);
        setAiTokenUsage({
          budget: DEFAULT_AI_TOKEN_BUDGET,
          used: 0,
          remaining: DEFAULT_AI_TOKEN_BUDGET,
          baseBudget: DEFAULT_AI_TOKEN_BASE_BUDGET,
          budgetMultiplier: 1,
          premiumMultiplier: 1,
          cycleDays: 30,
          cycleStartedAt: null,
          cycleEndsAt: null,
          budgetInr: 1,
        });
      }
    };

    fetchAiTokenUsage();
  }, [authUser, isViewingOther]);

  // Fetch Discover Users (users not yet followed)
  const fetchDiscoverUsers = async () => {
    if (!authUser?.email) return;

    try {
      // Fetch users from the same college, excluding current user
      const { data: allUsersData, error } = await supabase
        .from('users_safe')
        .select(DISCOVER_USER_SELECT)
        .neq('email', authUser.email)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter out already followed users
      const followingEmails = new Set(following.map(f => f.email));
      const notFollowed = allUsersData?.filter(u => !followingEmails.has(u.email)) || [];

      setDiscoverUsers(notFollowed);
    } catch (error) {
      console.error('Error fetching discover users:', error);
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    if (showDiscoverDialog) {
      fetchDiscoverUsers();
    }
  }, [showDiscoverDialog, following]);

  const handleFollowStatusChange = () => {
    void fetchProfileData();
    if (isViewingOther && viewingOtherProfile?.email) {
      void fetchViewedSocialData(viewingOtherProfile.email);
    }
  };

  useEffect(() => {
    const fetchViewedProfile = async () => {
      if (!isViewingOther || !authUser?.email || !viewingUsername) {
        // Clear profile data when not viewing others
        setViewingOtherProfile(null);
        return;
      }


      // Clear old data before fetching new profile
      setContributions([]);
      setViewingOtherProfile(null);

      // Fetch the other user's profile
      const { data: otherProfile } = await supabase
        .from('users_safe')
        .select(USER_PROFILE_SELECT)
        .eq('username', viewingUsername)
        .maybeSingle();

      if (otherProfile) {
        setViewingOtherProfile({
          ...otherProfile,
          college: extractCollegeName(otherProfile.college),
          profile_photo_url: resolveProfilePhotoUrl(otherProfile) || undefined,
          role: otherProfile.role || "student",
        });

      }
    };

    fetchViewedProfile();
  }, [isViewingOther, viewingUsername, authUser]);

  useEffect(() => {
    if (!isViewingOther || !viewingOtherProfile?.email) {
      setViewFollowers([]);
      setViewFollowing([]);
      setViewFollowersCount(0);
      setViewFollowingCount(0);
      return;
    }

    void fetchViewedSocialData(viewingOtherProfile.email);
  }, [isViewingOther, viewingOtherProfile?.email]);

  // Fetch contributions for viewed user
  useEffect(() => {
    const fetchViewedUserContributions = async () => {
      if (!isViewingOther || !viewingOtherProfile) return;

      try {
        // Query by uploaded_by_email to match how resources are stored
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('uploaded_by_email', viewingOtherProfile.email)
          .order('created_at', { ascending: false });

        if (error) throw error;


        const transformed = data?.map(r => ({
          id: r.id,
          title: r.title,
          type: r.type,
          votes: (r.upvotes || 0) - (r.downvotes || 0),
          status: r.status || 'pending',
          date: new Date(r.created_at).toLocaleDateString(),
          url: r.video_url || undefined,
          pdfUrl: r.file_url || undefined,
          semester: r.semester,
          branch: r.branch,
          subject: r.subject,
          chapter: r.chapter,
          topic: r.topic,
          description: r.description,
          uploaded_by_email: r.uploaded_by_email || viewingOtherProfile.email,
        })) || [];

        setContributions(transformed);
      } catch (error) {
        console.error('Error fetching viewed user contributions:', error);
        setContributions([]); // Clear contributions on error
      }
    };



    if (isViewingOther && viewingOtherProfile) {
      fetchViewedUserContributions();
    } else if (!isViewingOther) {
      fetchContributions(); // Fetch own contributions
    } else {
      // Viewing other but profile not loaded yet
      setContributions([]);
    }
  }, [isViewingOther, viewingOtherProfile]);



  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  /* === VIEW MODE - Phase 2: Fix profile routing === */
  const activeProfile = isViewingOther && viewingOtherProfile
    ? viewingOtherProfile
    : userProfile;
  const profileUser: ProfileUser = {
    name:
      activeProfile?.display_name ||
      authUser.displayName ||
      authUser.email?.split("@")[0] ||
      "Student",
    username: activeProfile?.username || editForm.username,
    email: activeProfile?.email || authUser.email || "",
    college: extractCollegeName(
      activeProfile?.college ||
      (selectedCollege?.name ? selectedCollege.name : "College"),
    ),
    bio: activeProfile?.bio || "",
    profilePhoto:
      resolveProfilePhotoUrl(activeProfile, [
        authUser.photoURL,
        editForm.profilePhoto,
      ]) || "",
    role: activeProfile?.role || "student",
  };

  /* === DISPLAY VALUES === */
  const displayName = profileUser.name || "Student";
  const displayEmail = profileUser.email;
  const displayUsername = profileUser.username;
  const displayBio = profileUser.bio;
  const normalizedEditBranch = normalizeBranchCode(editForm.branch);
  const availableProfileSubjects =
    normalizedEditBranch && editForm.semester
      ? getSubjectsForBranchAndSemester(normalizedEditBranch, editForm.semester)
      : [];
  const profileSubjectOptions =
    editForm.subject && !availableProfileSubjects.includes(editForm.subject)
      ? [editForm.subject, ...availableProfileSubjects]
      : availableProfileSubjects;
  const displaySemester = (activeProfile?.semester || editForm.semester || "").trim();
  const displayBranch = getBranchBadgeLabel(activeProfile?.branch || editForm.branch);
  const displaySubject = (activeProfile?.subject || editForm.subject || "").trim();
  const premiumActive = isPremiumTierActive(activeProfile);
  const premiumTierLabel = premiumActive
    ? String(activeProfile?.subscription_tier ?? "")
        .trim()
        .replace(/^./, (value) => value.toUpperCase())
    : "Free";
  const premiumExpiryLabel =
    premiumActive && activeProfile?.subscription_end_date
      ? formatCycleDate(activeProfile.subscription_end_date)
      : null;

  /* === SOCIAL DATA === */
  const displayContributions = contributions;
  const activeFollowers = isViewingOther ? viewFollowers : followers;
  const activeFollowing = isViewingOther ? viewFollowing : following;
  const activeFollowersCount = isViewingOther ? viewFollowersCount : followersCount;
  const activeFollowingCount = isViewingOther ? viewFollowingCount : followingCount;

  /* === ROLE === */
  const isTeacher = ["teacher", "admin", "moderator"].includes(profileUser.role.toLowerCase());

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // Escape SQL LIKE wildcards
      const escapeLike = (str: string) => str.replace(/[\\%_]/g, '\\$&');
      const escapedQuery = escapeLike(query);

      // Search users from database
      const { data, error } = await supabase
        .from('users_safe')
        .select('id, email, display_name, username, profile_photo_url, college')
        .or(`username.ilike.%${escapedQuery}%,display_name.ilike.%${escapedQuery}%`)
        .limit(10);

      if (error) throw error;

      // Transform to User interface
      const results = (data || []).map(u => ({
        id: u.id,
        name: u.display_name || u.email?.split('@')[0] || 'User',
        username: u.username || u.email?.split('@')[0] || 'user',
        college: u.college || 'College',
        email: u.email,
        profilePhoto: u.profile_photo_url,
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit before crop
      toast.error('Image must be less than 5MB');
      return;
    }

    // Convert to data URL for cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropperImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  };

  // Handle cropped image from ImageCropper
  const handleCroppedImage = async (croppedBlob: Blob) => {
    if (!authUser) return;

    setUploadingPhoto(true);
    try {
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(croppedBlob);
      });

      // Use backend API which bypasses RLS
      await api.updateProfile({ profile_photo_url: base64 });

      // Update local state
      setUserProfile(prev => prev ? { ...prev, profile_photo_url: base64 } : null);
      setEditForm(prev => ({ ...prev, profilePhoto: base64 }));

      // Close cropper
      setShowCropper(false);
      setCropperImage(null);

      toast.success('Profile photo updated!');
    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!authUser) return;

    const normalizedDisplayName = editForm.name.trim();
    const normalizedUsername = editForm.username.trim();
    const normalizedBio = editForm.bio.trim();
    const normalizedSemester = editForm.semester.trim();
    const normalizedBranch = normalizeBranchCode(editForm.branch);
    const normalizedSubject = editForm.subject.trim();

    // Validate username
    if (!normalizedUsername || normalizedUsername.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      // Check if username is taken (via frontend read - allowed by RLS)
      if (normalizedUsername !== userProfile?.username) {
        const { data: existingUser } = await supabase
          .from('users_safe')
          .select('id, email')
          .eq('username', normalizedUsername)
          .maybeSingle();

        if (existingUser && existingUser.email !== authUser.email) {
          toast.error('Username already taken');
          return;
        }
      }

      // Use backend API which bypasses RLS
      const profileUpdates: Partial<UserProfile> = {
        display_name: normalizedDisplayName,
        bio: normalizedBio,
        username: normalizedUsername,
      };

      if (normalizedSemester) {
        profileUpdates.semester = normalizedSemester;
      }
      if (normalizedBranch) {
        profileUpdates.branch = normalizedBranch;
      }
      if (normalizedSubject) {
        profileUpdates.subject = normalizedSubject;
      }

      const result = await api.updateProfile(profileUpdates);

      setUserProfile(prev => prev ? {
        ...prev,
        display_name: normalizedDisplayName,
        bio: normalizedBio || undefined,
        username: normalizedUsername,
        semester: normalizedSemester || undefined,
        branch: normalizedBranch || undefined,
        subject: normalizedSubject || undefined,
      } : null);

      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (error: any) {
      console.error('Save profile error:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleDeleteContribution = async (id: number | string) => {
    try {
      await api.deleteResource(id.toString());

      setContributions(prev => prev.filter(c => c.id !== id));
      toast.success('Resource deleted');
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };

  const handleEditSuccess = async () => {
    // Refresh contributions after edit
    if (!authUser) return;

    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('uploaded_by_email', authUser.email)
      .order('created_at', { ascending: false });

    if (data) {
      const transformed = data.map(r => ({
        id: r.id,
        title: r.title,
        type: r.type,
        votes: (r.upvotes || 0) - (r.downvotes || 0),
        status: r.status || 'pending',
        date: new Date(r.created_at).toLocaleDateString(),
        url: r.video_url || undefined,
        pdfUrl: r.file_url || undefined,
        semester: r.semester,
        branch: r.branch,
        subject: r.subject,
        chapter: r.chapter,
        topic: r.topic,
        description: r.description,
      }));
      setContributions(transformed);
    }

    setEditDialogOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  const aiUsedPercent = aiTokenUsage?.budget
    ? Math.min((aiTokenUsage.used / aiTokenUsage.budget) * 100, 100)
    : 0;
  const aiVisibleRemaining = aiTokenUsage
    ? formatVisibleCreditCount(aiTokenUsage.remaining)
    : "0";
  const aiVisibleUsed = aiTokenUsage
    ? formatVisibleCreditCount(aiTokenUsage.used)
    : "0";
  const aiVisibleBudget = aiTokenUsage
    ? formatVisibleCreditCount(aiTokenUsage.budget)
    : "0";

  const openPremiumPlans = () => {
    setPremiumModalMode("premium");
    setShowPremiumModal(true);
  };

  const openRechargePlans = () => {
    setPremiumModalMode("recharge");
    setShowPremiumModal(true);
  };

  const openContributionPreview = (contribution: Contribution) => {
    if (contribution.type === "video" && contribution.url) {
      setSelectedVideo({
        title: contribution.title,
        url: contribution.url,
        resourceId: String(contribution.id),
      });
      return;
    }

    if ((contribution.type === "notes" || contribution.type === "pyq") && contribution.pdfUrl) {
      setSelectedPdf({
        title: contribution.title,
        url: contribution.pdfUrl,
        resourceId: String(contribution.id),
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <SEO
        title={isViewingOther ? `${displayName}'s Profile` : "Your Profile"}
        description={isViewingOther
          ? `View ${displayName}'s profile and contributions on StudyShare.`
          : "Manage your profile, view your contributions, and connect with other students."
        }
        noIndex
      />
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/study')}>
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold">{isViewingOther ? `${profileUser.name}'s Profile` : "My Profile"}</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isViewingOther && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogoutDialog(true)}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div className="min-w-0 space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="relative mx-auto sm:mx-0">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                  {profileUser.profilePhoto ? (
                    <AvatarImage
                      src={profileUser.profilePhoto}
                      alt={displayName}
                    />
                  ) : (
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                {!isViewingOther && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-1 text-center sm:text-left w-full">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold truncate">{displayName}</h2>
                      <Badge
                        variant={premiumActive ? "default" : "secondary"}
                        className={premiumActive ? "border-amber-500/30 bg-amber-500/15 text-amber-300" : ""}
                      >
                        {premiumTierLabel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">@{displayUsername}</p>
                  </div>
                  {!isViewingOther && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="w-full sm:w-auto"
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                  {isViewingOther && viewingOtherProfile?.email && (
                    <FollowButton
                      targetUserEmail={viewingOtherProfile.email}
                      targetUserName={viewingOtherProfile?.display_name}
                      size="sm"
                      className="w-full sm:w-auto"
                      onStatusChange={handleFollowStatusChange}
                    />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">{displayEmail}</p>
                {displayBio && (
                  <p className="text-sm text-foreground mb-3">{displayBio}</p>
                )}
                {(displaySemester || displayBranch || displaySubject) && (
                  <div className="mb-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    {displaySemester && (
                      <Badge variant="secondary" className="font-medium">
                        Sem {displaySemester}
                      </Badge>
                    )}
                    {displayBranch && (
                      <Badge variant="outline" className="font-medium">
                        {displayBranch}
                      </Badge>
                    )}
                    {displaySubject && (
                      <Badge variant="outline" className="max-w-full">
                        <span className="truncate">{displaySubject}</span>
                      </Badge>
                    )}
                  </div>
                )}
                {premiumExpiryLabel && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    Premium active until {premiumExpiryLabel}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex gap-3 sm:gap-4">
                    <span className="text-foreground font-medium">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                      {contributions.length} contributions
                    </span>
                    <button
                      className="text-foreground font-medium hover:underline cursor-pointer"
                      onClick={() => setShowFollowersDialog(true)}
                    >
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                      {activeFollowersCount} followers
                    </button>
                    <button
                      className="text-foreground font-medium hover:underline cursor-pointer"
                      onClick={() => setShowFollowingDialog(true)}
                    >
                      {activeFollowingCount} following
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </Card>

            {/* Search Bar for Contributions */}
            <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contributions (notes, title, subject)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 sm:h-11"
          />
        </div>

        {/* Content Tabs */}
            <Tabs defaultValue="contributions" className="mt-0">
          <TabsList className="w-full grid grid-cols-3 h-auto">
            <TabsTrigger value="contributions" className="text-xs sm:text-sm py-2">
              Contributions
            </TabsTrigger>
            {!isViewingOther && (
              <TabsTrigger value="saved" className="text-xs sm:text-sm py-2">
                Saved
              </TabsTrigger>
            )}
            {!isViewingOther && isTeacher && (
              <TabsTrigger value="pending" className="text-xs sm:text-sm py-2">
                Pending
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="contributions">
            <ScrollArea className="h-[calc(100vh-400px)] min-h-[300px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  // Phase 3: Filter contributions by search query
                  const filteredContributions = contributions.filter(c =>
                    searchQuery === "" ||
                    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.chapter?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.topic?.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  if (filteredContributions.length === 0) {
                    return (
                      <div className="col-span-2 text-center py-12 bg-card rounded-lg">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground mb-4">
                          {searchQuery ? `No contributions found matching "${searchQuery}"` : "No contributions yet"}
                        </p>
                        {!searchQuery && !isViewingOther && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/study')}
                          >
                            Share Your First Resource
                          </Button>
                        )}
                      </div>
                    );
                  }

                  return filteredContributions.map((contribution) => {
                    const Icon = typeIcons[contribution.type as keyof typeof typeIcons];
                    const contributionDescription = getContributionDescription(contribution.description);
                    const previewable =
                      (contribution.type === "video" && !!contribution.url) ||
                      ((contribution.type === "notes" || contribution.type === "pyq") && !!contribution.pdfUrl);

                    return (
                      <Card
                        key={contribution.id}
                        variant="interactive"
                        role={previewable ? "button" : undefined}
                        tabIndex={previewable ? 0 : -1}
                        onClick={previewable ? () => openContributionPreview(contribution) : undefined}
                        onKeyDown={previewable ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openContributionPreview(contribution);
                          }
                        } : undefined}
                        className={`p-4 transition-shadow ${previewable ? "cursor-pointer hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-foreground text-base line-clamp-2 flex-1">
                                {contribution.title}
                              </h3>
                              {!isViewingOther && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 shrink-0"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <DropdownMenuItem
                                      onSelect={(event) => {
                                        event.stopPropagation();
                                        setEditingContribution(contribution);
                                        setEditDialogOpen(true);
                                      }}
                                    >
                                      <Edit2 className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={(event) => {
                                        event.stopPropagation();
                                        handleDeleteContribution(contribution.id);
                                      }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant={contribution.status === "approved" ? "default" : "secondary"} className="text-xs">
                                {contribution.status}
                              </Badge>
                              {contribution.semester && (
                                <span>Sem {contribution.semester}</span>
                              )}
                              {contribution.branch && (
                                <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 uppercase tracking-wide">
                                  {getBranchBadgeLabel(contribution.branch)}
                                </span>
                              )}
                              {contribution.subject && (
                                <span className="text-foreground/80">{contribution.subject}</span>
                              )}
                            </div>
                            {contributionDescription && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {contributionDescription}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{contribution.votes || 0} votes</span>
                                <span>{contribution.date}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  });
                })()}
              </div>
            </ScrollArea>
          </TabsContent>


          {!isViewingOther && (
            <TabsContent value="saved">
              <ScrollArea className="h-[calc(100vh-520px)] sm:h-[calc(100vh-500px)]">
                <div className="space-y-3">
                  {savedPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <Bookmark className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">No saved posts yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Posts you save from chat rooms will appear here</p>
                    </div>
                  ) : (
                    savedPosts.map((saved) => (
                      <Card
                        key={saved.id}
                        className="p-3 sm:p-4 cursor-pointer transition-colors hover:bg-accent/20"
                        onClick={() => {
                          if (saved.roomId && saved.messageId) {
                            navigate(`/chatroom/${saved.roomId}/post/${saved.messageId}`);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>#{saved.roomName}</span>
                          {saved.savedAt && (
                            <span>{new Date(saved.savedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {saved.content?.trim() || `Saved post from ${saved.roomName}`}
                        </p>
                        {saved.authorName && (
                          <p className="text-xs text-muted-foreground mt-2">
                            by {saved.authorName}
                          </p>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {
            !isViewingOther && isTeacher && (
              <TabsContent value="pending">
                <ScrollArea className="h-[calc(100vh-520px)] sm:h-[calc(100vh-500px)]">
                  <div className="space-y-3">
                    {contributions
                      .filter((c) => c.status === "pending")
                      .map((contribution) => {
                        const Icon = typeIcons[contribution.type as keyof typeof typeIcons];
                        return (
                          <Card key={contribution.id} variant="interactive" className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-medium text-foreground text-sm sm:text-base truncate">{contribution.title}</h3>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    Submitted on {contribution.date}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="flex-1 sm:flex-none"
                                  onClick={() => {
                                    toast.error('Use the Admin Dashboard to approve resources.');
                                  }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 sm:flex-none"
                                  onClick={() => {
                                    toast.error('Use the Admin Dashboard to reject resources.');
                                  }}
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                </ScrollArea>
              </TabsContent>
            )
          }
            </Tabs>
          </div>

          {!isViewingOther && (
            <aside className="xl:sticky xl:top-24">
              <Card className="h-fit border-primary/15 bg-gradient-to-br from-primary/6 via-card to-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Tokens
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-foreground">
                      {aiTokenUsage ? `${aiVisibleRemaining} left this cycle` : "AI tokens"}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Plan: <span className={premiumActive ? "font-semibold text-amber-300" : "font-medium text-foreground"}>{premiumTierLabel}</span>
                    </p>
                    {premiumExpiryLabel && (
                      <p className="text-xs text-muted-foreground">
                        Active until {premiumExpiryLabel}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 border-primary/20 bg-background/80 text-primary"
                    onClick={openPremiumPlans}
                  >
                    <Crown className="h-4 w-4" />
                  </Button>
                </div>

                {aiTokenUsage ? (
                  <>
                    <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all ${aiTokenUsage.remaining <= 0 ? "bg-red-500" : "bg-primary"}`}
                        style={{ width: `${aiUsedPercent}%` }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Remaining</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{aiVisibleRemaining}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Used</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{aiVisibleUsed}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{aiVisibleBudget}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 rounded-xl border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
                      <p>Cycle: {aiTokenUsage.cycleDays} days. Resets on {formatCycleDate(aiTokenUsage.cycleEndsAt)}.</p>
                      <p>1 AI token = 2,000 raw billable tokens.</p>
                      <p>Base budget: {formatVisibleCreditCount(aiTokenUsage.baseBudget)} tokens. Premium multiplier: {aiTokenUsage.premiumMultiplier}x.</p>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button className="w-full" onClick={openRechargePlans}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Recharge AI Tokens
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-primary/20 text-primary"
                        onClick={openPremiumPlans}
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Upgrade to Premium
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="h-2.5 w-full animate-pulse rounded-full bg-muted" />
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((value) => (
                        <div key={value} className="rounded-xl border border-border/60 bg-background/70 p-3">
                          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                          <div className="mt-3 h-6 w-10 animate-pulse rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/60 bg-background/60 p-4">
                      <div className="h-3 w-full animate-pulse rounded bg-muted" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="grid gap-2">
                      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                    </div>
                  </div>
                )}
              </Card>
            </aside>
          )}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      < AlertDialog open={showLogoutDialog} onOpenChange={(open) => {
        console.log("Dialog state changing to:", open);
        setShowLogoutDialog(open);
      }}>
        <AlertDialogContent className="mx-4 max-w-sm sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the college selection page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        mode={premiumModalMode}
      />

      {/* Edit Profile Dialog */}
      < Dialog open={isEditing} onOpenChange={setIsEditing} >
        <DialogContent className="mx-4 flex w-[min(94vw,720px)] max-w-2xl flex-col overflow-hidden rounded-3xl border border-border/70 bg-background/95 p-0 shadow-2xl backdrop-blur sm:mx-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5 text-left">
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your public profile details, branch, semester, and primary subject.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[min(82vh,760px)] space-y-6 overflow-y-auto px-6 py-5">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  {editForm.profilePhoto ? (
                    <AvatarImage src={editForm.profilePhoto} />
                  ) : (
                    <AvatarFallback className="text-3xl bg-gradient-primary text-primary-foreground">
                      {getInitials(editForm.name || "S")}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="username"
                />
                <p className="text-xs text-muted-foreground">This is how others can find you</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select
                  value={editForm.semester}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, semester: value, subject: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTER_OPTIONS.map((semester) => (
                      <SelectItem key={semester.value} value={semester.value}>
                        {semester.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Branch</Label>
                <Select
                  value={normalizedEditBranch}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, branch: value, subject: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCH_OPTIONS.map((branch) => (
                      <SelectItem key={branch.value} value={branch.value}>
                        {branch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={editForm.subject}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, subject: value }))}
                disabled={!normalizedEditBranch || !editForm.semester}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      normalizedEditBranch && editForm.semester
                        ? "Select subject"
                        : "Select branch and semester first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {profileSubjectOptions.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="w-full sm:w-auto">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} className="w-full sm:w-auto">
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog >

      {/* Edit Contribution Dialog */}
      {
        editingContribution && (
          <EditResourceDialog
            resource={editingContribution as any}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={handleEditSuccess}
          />
        )
      }

      {/* PDF Viewer */}
      {
        selectedPdf && (
          <PDFViewer
            isOpen={!!selectedPdf}
            onClose={() => setSelectedPdf(null)}
            title={selectedPdf.title}
            pdfUrl={selectedPdf.url}
            resourceId={selectedPdf.resourceId}
          />
        )
      }

      {selectedVideo && (
        <VideoPlayer
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          title={selectedVideo.title}
          videoUrl={selectedVideo.url}
          resourceId={selectedVideo.resourceId}
        />
      )}

      {/* Followers Dialog - Instagram Style */}
      <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
            <DialogDescription>
              People who follow this profile.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {activeFollowers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No followers yet</p>
                </div>
              ) : (
                activeFollowers.map((follower) => (
                  <div
                    key={follower.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <Avatar className="w-12 h-12">
                      {follower.profile_photo_url ? (
                        <AvatarImage src={follower.profile_photo_url} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {follower.display_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {follower.display_name || follower.email?.split('@')[0]}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{follower.username || follower.email?.split('@')[0]}
                      </p>
                    </div>
                    {follower.email && (
                      <FollowButton
                        targetUserEmail={follower.email}
                        targetUserName={follower.display_name}
                        size="sm"
                        variant="default"
                        onStatusChange={handleFollowStatusChange}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Following Dialog - Instagram Style */}
      <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
            <DialogDescription>
              People and profiles this account follows.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {activeFollowing.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Not following anyone yet</p>
                </div>
              ) : (
                activeFollowing.map((followed) => (
                  <div
                    key={followed.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <Avatar className="w-12 h-12">
                      {followed.profile_photo_url ? (
                        <AvatarImage src={followed.profile_photo_url} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {followed.display_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {followed.display_name || followed.email?.split('@')[0]}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{followed.username || followed.email?.split('@')[0]}
                      </p>
                    </div>
                    {followed.email && (
                      <FollowButton
                        targetUserEmail={followed.email}
                        targetUserName={followed.display_name}
                        size="sm"
                        variant="outline"
                        onStatusChange={handleFollowStatusChange}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Discover Users Dialog */}
      <Dialog open={showDiscoverDialog} onOpenChange={setShowDiscoverDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Discover People</DialogTitle>
            <DialogDescription>
              Search students and faculty profiles across the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, college..."
              value={discoverSearch}
              onChange={(e) => setDiscoverSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {discoverUsers
                .filter(user =>
                  !discoverSearch ||
                  user.display_name?.toLowerCase().includes(discoverSearch.toLowerCase()) ||
                  user.username?.toLowerCase().includes(discoverSearch.toLowerCase()) ||
                  user.college?.toLowerCase().includes(discoverSearch.toLowerCase())
                )
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <Avatar
                      className="w-12 h-12 cursor-pointer"
                      onClick={() => {
                        navigate(`/profile/${encodeURIComponent(user.username || user.email?.split('@')[0] || 'user')}`);
                        setShowDiscoverDialog(false);
                      }}
                    >
                      {user.profile_photo_url ? (
                        <AvatarImage src={user.profile_photo_url} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.display_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        navigate(`/profile/${encodeURIComponent(user.username || user.email?.split('@')[0] || 'user')}`);
                        setShowDiscoverDialog(false);
                      }}>
                      <p className="font-medium text-foreground truncate">
                        {user.display_name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                    {user.email && (
                      <FollowButton
                        targetUserEmail={user.email}
                        targetUserName={user.display_name}
                        size="sm"
                        variant="default"
                        onStatusChange={handleFollowStatusChange}
                      />
                    )}
                  </div>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Image Cropper Modal */}
      {cropperImage && (
        <ImageCropper
          image={cropperImage}
          isOpen={showCropper}
          onClose={() => {
            setShowCropper(false);
            setCropperImage(null);
          }}
          onCropComplete={handleCroppedImage}
          aspectRatio={1}
        />
      )}
    </div >
  );
};

export default Profile;

