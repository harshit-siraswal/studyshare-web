import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Video, HelpCircle, Users, UserPlus, LogOut, Edit2, Search, Camera, X, Check, ExternalLink, MessageCircle, MoreVertical, Trash2, Bookmark, Moon, Sun } from "lucide-react";
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
import { useTheme } from "@/hooks/useTheme";

const mockContributions = [
  { id: 1, title: "Complete Guide to Arrays", type: "video", votes: 156, status: "approved", date: "2024-03-10", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 2, title: "OS Process Management Notes", type: "notes", votes: 89, status: "pending", date: "2024-03-08", pdfUrl: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf" },
  { id: 3, title: "DBMS Mid-Sem 2023", type: "pyq", votes: 234, status: "approved", date: "2024-03-05", pdfUrl: "https://www.db-book.com/slides-dir/PDF-dir/ch1.pdf" },
  { id: 4, title: "Network Protocols Summary", type: "notes", votes: 67, status: "approved", date: "2024-03-01", pdfUrl: "https://intronetworks.cs.luc.edu/current2/ComputerNetworks.pdf" },
];

const mockFollowers = [
  { id: 1, name: "Rahul K.", username: "rahul_k_2024", college: "IIT Delhi" },
  { id: 2, name: "Priya M.", username: "priya_m_tech", college: "NIT Trichy" },
  { id: 3, name: "Amit S.", username: "amit_bits", college: "BITS Pilani" },
  { id: 4, name: "Sneha P.", username: "sneha_iitb", college: "IIT Bombay" },
];

const mockFollowing = [
  { id: 1, name: "Prof. Sharma", username: "prof_sharma_cs", college: "Computer Science Dept." },
  { id: 2, name: "Vikram R.", username: "vikram_r_24", college: "IIT Delhi" },
  { id: 3, name: "Study Group", username: "cse_2024_group", college: "CSE 2024" },
];

const allUsers = [
  { id: 5, name: "Neha Singh", username: "neha_singh_cs", college: "IIT Kanpur", contributions: mockContributions.slice(0, 2), followers: mockFollowers.slice(0, 2), following: mockFollowing.slice(0, 1) },
  { id: 6, name: "Arjun Verma", username: "arjun_v_2024", college: "NIT Surathkal", contributions: mockContributions.slice(1, 3), followers: mockFollowers.slice(1, 3), following: mockFollowing.slice(0, 2) },
  { id: 7, name: "Pooja Reddy", username: "pooja_r_aiml", college: "IIIT Hyderabad", contributions: mockContributions.slice(0, 3), followers: mockFollowers.slice(0, 3), following: mockFollowing },
  { id: 8, name: "Prof. Kumar", username: "prof_kumar_ml", college: "ML Department", contributions: mockContributions, followers: mockFollowers, following: mockFollowing, isTeacher: true },
  ...mockFollowers.map(f => ({ ...f, contributions: mockContributions.slice(0, 2), followers: mockFollowers.slice(0, 2), following: mockFollowing.slice(0, 1) })),
  ...mockFollowing.map(f => ({ ...f, contributions: mockContributions.slice(1, 3), followers: mockFollowers.slice(1, 3), following: mockFollowing.slice(0, 2) })),
];

const Profile = () => {
  const navigate = useNavigate();
  const { username: viewingUsername } = useParams();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof allUsers>([]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{title: string; url: string} | null>(null);
  const [contributions, setContributions] = useState(mockContributions);
  const [editingContribution, setEditingContribution] = useState<typeof mockContributions[0] | null>(null);
  const [savedPosts, setSavedPosts] = useState<any[]>(() => JSON.parse(localStorage.getItem("savedPosts") || "[]"));
  const { theme, toggleTheme } = useTheme();
  const [editForm, setEditForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    username: user.username || generateUsername(),
    profilePhoto: user.profilePhoto || "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isViewingOther = !!viewingUsername;
  const viewedUser = isViewingOther 
    ? allUsers.find(u => u.username === viewingUsername) 
    : null;
  
  const displayUser = isViewingOther ? viewedUser : user;
  const displayContributions = isViewingOther 
    ? (viewedUser as any)?.contributions || mockContributions.slice(0, 2)
    : contributions;
  const displayFollowers = isViewingOther 
    ? (viewedUser as any)?.followers || mockFollowers.slice(0, 2)
    : mockFollowers;
  const displayFollowing = isViewingOther 
    ? (viewedUser as any)?.following || mockFollowing.slice(0, 1)
    : mockFollowing;

  const isTeacher = user.role === "teacher";
  const isFollowing = mockFollowing.some(f => f.username === viewingUsername);

  function generateUsername() {
    const adjectives = ["happy", "smart", "cool", "quick", "bright"];
    const nouns = ["student", "learner", "coder", "reader", "scholar"];
    const num = Math.floor(Math.random() * 1000);
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}_${nouns[Math.floor(Math.random() * nouns.length)]}_${num}`;
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const results = allUsers.filter(u => 
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleFollow = (userId: number) => {
    toast.success("Following!");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    const updatedUser = { ...user, ...editForm };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
    toast.success("Profile updated!");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("selectedCollege");
    navigate("/");
  };

  const handleContributionClick = (contribution: typeof mockContributions[0]) => {
    if (contribution.type === "video" && contribution.url) {
      window.open(contribution.url, "_blank");
    } else if ((contribution.type === "notes" || contribution.type === "pyq") && contribution.pdfUrl) {
      setSelectedPdf({ title: contribution.title, url: contribution.pdfUrl });
    }
  };

  const navigateToProfile = (username: string) => {
    navigate("/profile/" + username);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleStartChat = (username: string, name: string) => {
    navigate(`/messages/${username}`);
  };

  const handleDeleteContribution = (id: number) => {
    setContributions(prev => prev.filter(c => c.id !== id));
    toast.success("Contribution deleted");
  };

  const handleEditContribution = (contribution: typeof mockContributions[0]) => {
    setEditingContribution(contribution);
  };

  const handleSaveContributionEdit = () => {
    if (editingContribution) {
      setContributions(prev => prev.map(c => 
        c.id === editingContribution.id ? editingContribution : c
      ));
      setEditingContribution(null);
      toast.success("Contribution updated");
    }
  };

  const typeIcons = {
    video: Video,
    notes: FileText,
    pyq: HelpCircle,
  };

  if (isViewingOther && !viewedUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">User not found</p>
          <Button onClick={() => navigate("/profile")}>Go to your profile</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
              {isViewingOther ? viewedUser?.name || "Profile" : "Profile"}
            </h1>
            {!isViewingOther && (
              <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={toggleTheme}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        {/* Search Bar - only on own profile */}
        {!isViewingOther && (
          <div className="mb-4 sm:mb-6 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by username..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchResults.length > 0 && (
              <Card className="mt-2 p-2 absolute z-50 w-full bg-background border border-border shadow-lg">
                <ScrollArea className="max-h-64">
                  {searchResults.map((result) => (
                    <div 
                      key={result.id} 
                      className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                      onClick={() => navigateToProfile(result.username)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {result.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{result.name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{result.username}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleFollow(result.id); }}>
                        <UserPlus className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Follow</span>
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </Card>
            )}
          </div>
        )}

        {/* Profile Card */}
        <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative shrink-0">
              <Avatar className="w-20 h-20 sm:w-20 sm:h-20">
                {(isViewingOther ? false : editForm.profilePhoto) ? (
                  <AvatarImage src={editForm.profilePhoto} />
                ) : (
                  <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                    {displayUser?.name?.[0] || "S"}
                  </AvatarFallback>
                )}
              </Avatar>
              {!isViewingOther && isEditing && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">{displayUser?.name || "Student"}</h2>
                {(isViewingOther ? (viewedUser as any)?.isTeacher : isTeacher) && (
                  <Badge variant="default" className="bg-primary">Teacher</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{displayUser?.username || editForm.username}</p>
              {!isViewingOther && <p className="text-muted-foreground text-sm truncate">{user.email}</p>}
              <p className="text-sm text-muted-foreground mt-1">{displayUser?.college || "College"}</p>
              {(isViewingOther ? false : user.bio) && <p className="text-sm mt-2">{user.bio}</p>}
              
              <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 mt-4">
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-foreground">{displayContributions.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Contributions</p>
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-foreground">{displayFollowers.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-foreground">{displayFollowing.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Following</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {isViewingOther ? (
                <>
                  <Button variant={isFollowing ? "secondary" : "default"} size="sm">
                    {isFollowing ? (
                      <>
                        <Users className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Follow</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStartChat(viewedUser?.username || "", viewedUser?.name || "")}
                  >
                    <MessageCircle className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Message</span>
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Profile</span>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="contributions" className="w-full">
          <TabsList className="w-full justify-start mb-4 overflow-x-auto">
            <TabsTrigger value="contributions" className="text-xs sm:text-sm">Contributions</TabsTrigger>
            <TabsTrigger value="followers" className="text-xs sm:text-sm">Followers</TabsTrigger>
            <TabsTrigger value="following" className="text-xs sm:text-sm">Following</TabsTrigger>
            {!isViewingOther && <TabsTrigger value="saved" className="text-xs sm:text-sm">Saved</TabsTrigger>}
            {!isViewingOther && isTeacher && <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending</TabsTrigger>}
          </TabsList>

          <TabsContent value="contributions">
            <ScrollArea className="h-[calc(100vh-520px)] sm:h-[calc(100vh-500px)]">
              <div className="space-y-3">
                {displayContributions.map((contribution) => {
                  const Icon = typeIcons[contribution.type as keyof typeof typeIcons];
                  return (
                    <Card 
                      key={contribution.id} 
                      variant="interactive" 
                      className="p-3 sm:p-4 cursor-pointer"
                      onClick={() => handleContributionClick(contribution)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground text-sm sm:text-base truncate">{contribution.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {contribution.votes} votes · {contribution.date}
                          </p>
                        </div>
                        {(!isViewingOther || isTeacher) && (
                          <Badge
                            variant={contribution.status === "approved" ? "default" : "secondary"}
                            className={`text-xs shrink-0 ${contribution.status === "approved" ? "bg-green-500/10 text-green-500" : ""}`}
                          >
                            {contribution.status}
                          </Badge>
                        )}
                        {!isViewingOther && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditContribution(contribution); }}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={(e) => { e.stopPropagation(); handleDeleteContribution(contribution.id); }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="followers">
            <ScrollArea className="h-[calc(100vh-520px)] sm:h-[calc(100vh-500px)]">
              <div className="space-y-3">
                {displayFollowers.map((follower) => (
                  <Card 
                    key={follower.id} 
                    variant="interactive" 
                    className="p-3 sm:p-4 cursor-pointer"
                    onClick={() => navigateToProfile(follower.username)}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Avatar className="w-9 h-9 sm:w-10 sm:h-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {follower.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm sm:text-base truncate">{follower.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">@{follower.username}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{follower.college}</p>
                      </div>
                      {!isViewingOther && (
                        <div className="flex gap-1 sm:gap-2 shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); handleStartChat(follower.username, follower.name); }}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleFollow(follower.id); }}>
                            <UserPlus className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Follow</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="following">
            <ScrollArea className="h-[calc(100vh-520px)] sm:h-[calc(100vh-500px)]">
              <div className="space-y-3">
                {displayFollowing.map((person) => (
                  <Card 
                    key={person.id} 
                    variant="interactive" 
                    className="p-3 sm:p-4 cursor-pointer"
                    onClick={() => navigateToProfile(person.username)}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Avatar className="w-9 h-9 sm:w-10 sm:h-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {person.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm sm:text-base truncate">{person.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">@{person.username}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{person.college}</p>
                      </div>
                      {!isViewingOther && (
                        <div className="flex gap-1 sm:gap-2 shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); handleStartChat(person.username, person.name); }}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            Following
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
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

          {!isViewingOther && isTeacher && (
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
                              <Button variant="default" size="sm" className="flex-1 sm:flex-none">Approve</Button>
                              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">Reject</Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
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
      </AlertDialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
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
                      {editForm.name?.[0] || "S"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4" />
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
      </Dialog>

      {/* Edit Contribution Dialog */}
      <Dialog open={!!editingContribution} onOpenChange={() => setEditingContribution(null)}>
        <DialogContent className="mx-4 max-w-sm sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Contribution</DialogTitle>
          </DialogHeader>
          
          {editingContribution && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingContribution.title}
                  onChange={(e) => setEditingContribution(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingContribution(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveContributionEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Viewer */}
      {selectedPdf && (
        <PDFViewer
          isOpen={!!selectedPdf}
          onClose={() => setSelectedPdf(null)}
          title={selectedPdf.title}
          pdfUrl={selectedPdf.url}
        />
      )}
    </div>
  );
};

export default Profile;
