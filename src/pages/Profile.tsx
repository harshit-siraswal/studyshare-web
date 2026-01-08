import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import * as api from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, FileText, Video, HelpCircle, Users, UserPlus, LogOut, Edit2, Search, Camera, X, Check, ExternalLink, MessageCircle, MoreVertical, Trash2, Bookmark, Moon, Sun, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import PDFViewer from "@/components/PDFViewer";
import EditResourceDialog from "@/components/EditResourceDialog";
import FollowButton from "@/components/FollowButton";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "../supabase";

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
  roomName: string;
  message?: string;
  timestamp?: string;
  author?: string;
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
  username?: string;
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

  /* 🔐 AUTH */
  const { user: authUser, loading, logout } = useAuth();
  const { selectedCollege } = useCollege();

  /* 🧠 STATE */
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ title: string; url: string } | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>(
    () => JSON.parse(localStorage.getItem("savedPosts") || "[]")
  );

  // Supabase state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [viewingOtherProfile, setViewingOtherProfile] = useState<UserProfile | null>(null);

  // Discover Users State
  const [showDiscoverDialog, setShowDiscoverDialog] = useState(false);
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([]);
  const [discoverSearch, setDiscoverSearch] = useState("");

  const { theme, toggleTheme } = useTheme();

  /* ✏️ EDIT FORM */
  const [editForm, setEditForm] = useState({
    name: authUser?.displayName || "",
    bio: "",
    username: generateUsername(),
    profilePhoto: authUser?.photoURL || "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFollowingOther, setIsFollowingOther] = useState(false);

  /* 🔐 AUTH GUARD — SAFE */
  useEffect(() => {
    if (!loading && !authUser) {
      navigate("/auth", { replace: true });
    }
  }, [authUser, loading, navigate]);

  // Fetch user profile from Supabase
  // Fetch user profile from Supabase
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) return;

      setLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.uid)
          .single();

        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const emailUsername = authUser.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';

          const newProfile = {
            id: authUser.uid,
            email: authUser.email || '',
            display_name: authUser.displayName || authUser.email?.split('@')[0] || 'User',
            bio: '',
            profile_photo_url: authUser.photoURL || null,
            college: localStorage.getItem('selectedCollege') || '',
            username: emailUsername,
            branch: '',
            semester: '',
          };

          const { data: created, error: createError } = await supabase
            .from('users')
            .insert([newProfile])
            .select()
            .single();

          if (createError) throw createError;

          setUserProfile(created);
          setEditForm(prev => ({
            ...prev,
            name: created.display_name,
            bio: created.bio || '',
            username: created.username,
            profilePhoto: created.profile_photo_url || prev.profilePhoto,
          }));
        } else if (error) {
          throw error;
        } else {
          setUserProfile(data);
          setEditForm(prev => ({
            ...prev,
            name: data.display_name,
            bio: data.bio || '',
            username: data.username || prev.username,
            profilePhoto: data.profile_photo_url || prev.profilePhoto,
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [authUser]);

  // Fetch followers and following via Backend API
  const fetchFollowersFollowing = async () => {
    if (!authUser?.email) return;

    try {
      const [followersData, followingData] = await Promise.all([
        api.getFollowers(),
        api.getFollowing()
      ]);

      setFollowersCount(followersData.followers.length);
      setFollowers(followersData.followers);

      setFollowingCount(followingData.following.length);
      setFollowing(followingData.following);
    } catch (error) {
      console.error('Error fetching followers/following:', error);
    }
  };

  useEffect(() => {
    fetchFollowersFollowing();
  }, [authUser]);

  // Fetch Discover Users (users not yet followed)
  const fetchDiscoverUsers = async () => {
    if (!authUser?.email) return;

    try {
      // Fetch users from the same college preferably, or all users
      // Excluding current user
      const { data: allUsersData, error } = await supabase
        .from('users')
        .select('*')
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
  }, [showDiscoverDialog, following]); // Re-fetch when following list changes

  // Fetch REAL contributions from Supabase
  const fetchContributions = async () => {
    if (!authUser) return;

    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('uploaded_by_email', authUser.email)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase data to match Contribution interface
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
        uploaded_by_email: r.uploaded_by_email || authUser?.email || '',
      })) || [];

      setContributions(transformed);
    } catch (error) {
      console.error('Error fetching contributions:', error);
      toast.error('Failed to load contributions');
      setContributions([]);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, [authUser]);

  // Check if viewing other user and if we're following them - MUST be before early returns
  const isViewingOther = !!viewingUsername;

  // Generic Follow Handler
  const handleFollowUser = async (targetEmail: string, targetName?: string) => {
    if (!authUser?.email) {
      toast.error('Please login to follow users');
      return;
    }

    if (targetEmail === authUser.email) {
      toast.error('You cannot follow yourself');
      return;
    }

    const isAlreadyFollowing = following.some(f => f.email === targetEmail);

    try {
      if (isAlreadyFollowing) {
        // Unfollow via backend API
        await api.unfollowUser(targetEmail);

        // Update local state
        setFollowing(prev => prev.filter(f => f.email !== targetEmail));
        setFollowingCount(prev => Math.max(0, prev - 1));

        // If viewing this profile
        if (viewingOtherProfile?.email === targetEmail) {
          setIsFollowingOther(false);
          // Only update followers count if I'm viewing THEIR profile
          if (isViewingOther) {
            setFollowersCount(prev => Math.max(0, prev - 1));
          }
        }

        toast.success(`Unfollowed ${targetName || 'user'}`);
      } else {
        // Follow via backend API
        await api.sendFollowRequest(targetEmail);

        // Refresh following list to get full user details
        // This will also update the `following` state, which is a dependency for `fetchDiscoverUsers`
        // and will trigger a re-fetch of discover users.
        fetchFollowersFollowing();

        if (viewingOtherProfile?.email === targetEmail) {
          setIsFollowingOther(true);
          if (isViewingOther) {
            setFollowersCount(prev => prev + 1);
          }
        }

        toast.success(`Following ${targetName || 'user'}`);
        // Backend API handles notification creation automatically
      }
    } catch (error: any) {
      console.error('Follow error:', error);
      toast.error(error.message || 'Failed to update follow status');
    }
  };

  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!isViewingOther || !authUser?.email || !viewingUsername) {
        // Clear profile data when not viewing others
        setViewingOtherProfile(null);
        return;
      }

      // Clear old data before fetching new profile
      console.log('🔄 Switching to view profile:', viewingUsername);
      setContributions([]);
      setViewingOtherProfile(null);

      // Fetch the other user's profile
      const { data: otherProfile } = await supabase
        .from('users')
        .select('*')
        .eq('username', viewingUsername)
        .single();

      if (otherProfile) {
        console.log('✅ Loaded profile for:', otherProfile.display_name, 'ID:', otherProfile.id);
        setViewingOtherProfile(otherProfile);

        // Check if we're following them via backend API
        try {
          const statusResult = await api.getFollowStatus(otherProfile.email);
          setIsFollowingOther(statusResult.status === 'following');
        } catch (err) {
          console.error('Error checking follow status:', err);
          setIsFollowingOther(false);
        }
      }
    };

    checkFollowingStatus();
  }, [isViewingOther, viewingUsername, authUser]);

  // Fetch contributions for viewed user
  useEffect(() => {
    const fetchViewedUserContributions = async () => {
      if (!isViewingOther || !viewingOtherProfile) return;

      try {
        // Query by uploaded_by_email to match how resources are stored
        console.log('📚 Fetching contributions for user email:', viewingOtherProfile.email);
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('uploaded_by_email', viewingOtherProfile.email)
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('✅ Found', data?.length || 0, 'contributions for', viewingOtherProfile.display_name);

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

  /* 🧭 VIEW MODE - Phase 2: Fix profile routing */
  const profileUser: ProfileUser = isViewingOther && viewingOtherProfile
    ? {
      name: viewingOtherProfile.display_name,
      username: viewingOtherProfile.username,
      email: viewingOtherProfile.email || "",
      college: typeof viewingOtherProfile.college === 'string' && viewingOtherProfile.college.startsWith('{')
        ? JSON.parse(viewingOtherProfile.college).name // Handle JSON string
        : viewingOtherProfile.college || "College",
      bio: viewingOtherProfile.bio || "",
      profilePhoto: viewingOtherProfile.profile_photo_url || "",
      role: "student",
    }
    : {
      name: userProfile?.display_name || authUser.displayName || "Student",
      username: userProfile?.username || editForm.username,
      email: authUser.email || "",
      college: userProfile?.college || "College",
      bio: userProfile?.bio || "",
      profilePhoto: userProfile?.profile_photo_url || authUser.photoURL || "",
      role: "student",
    };

  /* 🧾 DISPLAY VALUES */
  const displayName = isViewingOther
    ? profileUser.name || "Student"
    : (userProfile?.display_name || authUser.displayName || "Student");

  const displayEmail = isViewingOther
    ? profileUser.email
    : (authUser.email || "");

  const displayUsername = isViewingOther
    ? profileUser.username
    : (userProfile?.username || editForm.username);

  const displayBio = isViewingOther
    ? profileUser.bio
    : (userProfile?.bio || editForm.bio);

  const displayCollege = isViewingOther
    ? profileUser.college
    : (userProfile?.college || "College");

  /* 👥 SOCIAL DATA */
  const displayContributions = contributions;

  /* 🎓 ROLE */
  const isTeacher = profileUser.role === "teacher";

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
      // Search users from database
      const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name, username, profile_photo_url, college')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
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

  const handleFollow = (userId: number) => {
    toast.success("Following!");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for base64
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      console.log('Converting image to base64...');

      // Convert image to base64 and store directly in database
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('Image converted, updating database...');

      // Save base64 directly to database
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_photo_url: base64 })
        .eq('id', authUser.uid);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      console.log('Profile photo updated successfully!');

      // Update local state
      setUserProfile(prev => prev ? { ...prev, profile_photo_url: base64 } : null);
      setEditForm(prev => ({ ...prev, profilePhoto: base64 }));

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

    // Validate username
    if (!editForm.username || editForm.username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(editForm.username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      // Check if username is taken
      if (editForm.username !== userProfile?.username) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', editForm.username)
          .single();

        if (existingUser && existingUser.id !== authUser.uid) {
          toast.error('Username already taken');
          return;
        }
      }

      console.log('Updating profile for user:', authUser.uid);
      console.log('Update data:', {
        display_name: editForm.name,
        bio: editForm.bio,
        username: editForm.username,
      });

      const { data, error } = await supabase
        .from('users')
        .update({
          display_name: editForm.name,
          bio: editForm.bio,
          username: editForm.username,
        })
        .eq('id', authUser.uid)
        .select();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      console.log('Update successful:', data);

      setUserProfile(prev => prev ? {
        ...prev,
        display_name: editForm.name,
        bio: editForm.bio,
        username: editForm.username,
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
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id.toString());

      if (error) throw error;

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
      .eq('uploaded_by', authUser.uid)
      .order('created_at', { ascending: false });

    if (data) {
      const transformed = data.map(r => ({
        id: r.id,
        title: r.title,
        type: r.type,
        votes: r.votes || 0,
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

  const handleDeletePost = (index: number) => {
    const updatedPosts = savedPosts.filter((_, i) => i !== index);
    setSavedPosts(updatedPosts);
    localStorage.setItem("savedPosts", JSON.stringify(updatedPosts));
    toast.success("Post removed from saved");
  };

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/study')}>
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold">{isViewingOther ? `${profileUser.name}'s Profile` : "My Profile"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
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

      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Profile Header */}
        <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Profile Photo */}
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

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left w-full">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold truncate">{displayName}</h2>
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
                {isViewingOther && (
                  <Button
                    variant={isFollowingOther ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleFollowUser(viewingOtherProfile?.email || "", viewingOtherProfile?.display_name)}
                    className="w-full sm:w-auto"
                  >
                    {isFollowingOther ? (
                      <>
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">{displayEmail}</p>
              {displayBio && (
                <p className="text-sm text-foreground mb-3">{displayBio}</p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm">
                <span className="text-muted-foreground">{displayCollege}</span>
                <div className="flex gap-3 sm:gap-4">
                  <button
                    className="text-foreground font-medium hover:underline cursor-pointer"
                    onClick={() => setShowFollowersDialog(true)}
                  >
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                    {followersCount} followers
                  </button>
                  <button
                    className="text-foreground font-medium hover:underline cursor-pointer"
                    onClick={() => setShowFollowingDialog(true)}
                  >
                    {followingCount} following
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Search Bar for Contributions */}
        <div className="relative mt-4 sm:mt-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contributions (notes, title, subject)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 sm:h-11"
          />
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="contributions" className="mt-4 sm:mt-6">
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
            <ScrollArea className="h-[calc(100vh-520px)] sm:h-[calc(100vh-500px)]">
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
                    return (
                      <Card key={contribution.id} variant="interactive" className="p-4 hover:shadow-lg transition-shadow">
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
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setEditingContribution(contribution);
                                      setEditDialogOpen(true);
                                    }}>
                                      <Edit2 className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteContribution(contribution.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <Badge variant={contribution.status === "approved" ? "default" : "secondary"} className="text-xs">
                                {contribution.status}
                              </Badge>
                              {contribution.semester && (
                                <span>Sem {contribution.semester}</span>
                              )}
                              {contribution.branch && (
                                <span>• {contribution.branch}</span>
                              )}
                              {contribution.subject && (
                                <span>• {contribution.subject}</span>
                              )}
                            </div>
                            {contribution.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {contribution.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{contribution.votes || 0} votes</span>
                                <span>{contribution.date}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              {contribution.type === "video" && contribution.url && (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={contribution.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3 h-3 mr-2" />
                                    Watch
                                  </a>
                                </Button>
                              )}
                              {(contribution.type === "notes" || contribution.type === "pyq") && contribution.pdfUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedPdf({ title: contribution.title, url: contribution.pdfUrl! })}
                                >
                                  <FileText className="w-3 h-3 mr-2" />
                                  View PDF
                                </Button>
                              )}
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
                    savedPosts.map((saved, index) => (
                      <Card key={index} className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>#{saved.roomName}</span>
                        </div>
                        <p className="text-sm text-foreground">Saved post from {saved.roomName}</p>
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
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from('resources')
                                        .update({ status: 'approved' })
                                        .eq('id', contribution.id);

                                      if (error) throw error;

                                      // Create approval notification
                                      await supabase.from('notifications').insert([{
                                        user_email: contribution.uploaded_by_email || '',
                                        type: 'resource_approved',
                                        title: 'Resource Approved',
                                        message: `Your resource "${contribution.title}" has been approved and is now visible to everyone.`,
                                        resource_id: contribution.id,
                                        resource_title: contribution.title,
                                        read: false,
                                        college_id: selectedCollege?.domain || 'kiet.edu', // Policy
                                      }]);

                                      toast.success('Resource approved!');
                                      fetchContributions();
                                    } catch (error: any) {
                                      toast.error(error.message || 'Failed to approve resource');
                                    }
                                  }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 sm:flex-none"
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from('resources')
                                        .update({ status: 'rejected' })
                                        .eq('id', contribution.id);

                                      if (error) throw error;

                                      // Create rejection notification
                                      await supabase.from('notifications').insert([{
                                        user_email: contribution.uploaded_by_email || '',
                                        type: 'resource_rejected',
                                        title: 'Resource Rejected',
                                        message: `Your resource "${contribution.title}" was not approved. Please review the guidelines and try again.`,
                                        resource_id: contribution.id,
                                        resource_title: contribution.title,
                                        read: false,
                                        college_id: selectedCollege?.domain || 'kiet.edu', // Policy
                                      }]);

                                      toast.success('Resource rejected');
                                      fetchContributions();
                                    } catch (error: any) {
                                      toast.error(error.message || 'Failed to reject resource');
                                    }
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
        </Tabs >
      </div >

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

      {/* Edit Profile Dialog */}
      < Dialog open={isEditing} onOpenChange={setIsEditing} >
        <DialogContent className="mx-4 max-w-sm sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>
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
          />
        )
      }

      {/* Followers Dialog - Instagram Style */}
      <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {followers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No followers yet</p>
                </div>
              ) : (
                followers.map((follower) => (
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
                    <Button
                      size="sm"
                      variant={following.some(f => f.email === follower.email) ? "outline" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowUser(follower.email, follower.display_name);
                      }}
                    >
                      {following.some(f => f.email === follower.email) ? "Following" : "Follow"}
                    </Button>
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
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {following.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Not following anyone yet</p>
                </div>
              ) : (
                following.map((followed) => (
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
                    <Button
                      size="sm"
                      variant="outline" // Always following in Following list, but allow unfollow
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowUser(followed.email, followed.display_name);
                      }}
                    >
                      Following
                    </Button>
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
                        navigate(`/profile/${user.username}`);
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
                        navigate(`/profile/${user.username}`);
                        setShowDiscoverDialog(false);
                      }}>
                      <p className="font-medium text-foreground truncate">
                        {user.display_name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username} • {user.college?.substring(0, 20)}...
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={following.some(f => f.email === user.email) ? "outline" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowUser(user.email, user.display_name);
                      }}
                    >
                      {following.some(f => f.email === user.email) ? "Following" : "Follow"}
                    </Button>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default Profile;