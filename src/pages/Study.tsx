import { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Plus, ChevronDown, BookOpen, Menu, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import StudySidebar from "@/components/StudySidebar";
import MobileSidebar from "@/components/mobile/MobileSidebar";
import MusicPlayer from "@/components/MusicPlayer";
import StudyTimer from "@/components/StudyTimer";
import ResourceCard, { ResourceType } from "@/components/ResourceCard";
import ResourceCardSkeleton from "@/components/ResourceCardSkeleton";
import UploadResourceDialog from "@/components/UploadResourceDialog";
import SyllabusSection from "@/components/SyllabusSection";
import FollowingFeed from '@/components/FollowingFeed';
import NotificationButton from '@/components/NotificationButton';
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "../supabase";
import { toast } from "sonner";

const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];
const branches = ["cse", "ece", "me", "ce", "eee", "aiml", "ds", "it"];
const branchLabels: Record<string, string> = {
  cse: "Computer Science",
  ece: "Electronics",
  me: "Mechanical",
  ce: "Civil",
  eee: "Electrical",
  aiml: "AI & ML",
  ds: "Data Science",
  it: "Information Technology",
};

const subjects: Record<string, string[]> = {
  cse: ["Data Structures", "Algorithms", "Operating Systems", "DBMS", "Computer Networks", "Machine Learning"],
  ece: ["Digital Electronics", "Analog Circuits", "Signal Processing", "VLSI", "Embedded Systems"],
  me: ["Thermodynamics", "Fluid Mechanics", "Machine Design", "Manufacturing", "Heat Transfer"],
  ce: ["Structural Analysis", "Concrete Technology", "Geotechnical", "Surveying", "Hydrology"],
  eee: ["Power Systems", "Control Systems", "Electrical Machines", "Power Electronics"],
  aiml: ["Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Data Mining"],
  ds: ["Statistics", "Data Mining", "Big Data Analytics", "Machine Learning", "Data Visualization"],
  it: ["Web Development", "Database Systems", "Networking", "Cloud Computing", "Cybersecurity"],
};

type SortOption = "teacher" | "votes" | "recent";

const Study = () => {
  /* ---------------------------------------------------------------- */
  /* HOOKS (MUST BE FIRST) */
  /* ---------------------------------------------------------------- */
  const { user, loading } = useAuth();
  const { selectedCollege } = useCollege();
  const { isFullAccess, canViewFollowing } = usePermissions();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [filterType, setFilterType] = useState<ResourceType | "all">("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchMode, setSearchMode] =
    useState<"resources" | "syllabus" | "following">("resources");
  const [sortBy, setSortBy] = useState<SortOption>("votes");
  const [showMobileTools, setShowMobileTools] = useState(false);

  // Supabase state
  const [resources, setResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);

  /* ---------------------------------------------------------------- */
  /* AUTH GUARD (SAFE & STABLE) */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  // Fetch resources from Supabase
  useEffect(() => {
    fetchResources();
  }, [selectedSemester, selectedBranch, selectedSubject]);

  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      // Policy: Filter by college_id for data isolation
      const collegeId = selectedCollege?.domain || 'kiet.edu';

      let query = supabase
        .from('resources')
        .select('*')
        .eq('status', 'approved') // Only show approved resources
        .eq('college_id', collegeId) // Policy: College data isolation
        .order('created_at', { ascending: false });

      // Apply filters (skip if value is 'all')
      if (selectedSemester && selectedSemester !== 'all') {
        query = query.eq('semester', selectedSemester);
      }
      if (selectedBranch && selectedBranch !== 'all') {
        query = query.eq('branch', selectedBranch);
      }
      if (selectedSubject && selectedSubject !== 'all') {
        query = query.eq('subject', selectedSubject);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include upvotes/downvotes and calculate net votes
      const transformed = data?.map(resource => ({
        ...resource,
        upvotes: resource.upvotes || 0,
        downvotes: resource.downvotes || 0,
        votes: (resource.upvotes || 0) - (resource.downvotes || 0), // Net votes for sorting
      })) || [];

      setResources(transformed);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
      setResources([]); // Set empty array on error
    } finally {
      setLoadingResources(false);
    }
  };

  if (loading) return null;
  if (!user) return null;

  const availableSubjects = (selectedBranch && selectedBranch !== 'all')
    ? subjects[selectedBranch as keyof typeof subjects] || []
    : [];

  const filteredResources = resources
    .filter((resource) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        resource.title.toLowerCase().includes(query) ||
        (resource.description || '').toLowerCase().includes(query) ||
        resource.subject.toLowerCase().includes(query) ||
        (resource.chapter || '').toLowerCase().includes(query);
      const matchesType = filterType === "all" || resource.type === filterType;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "votes":
          return (b.votes || 0) - (a.votes || 0);
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return (b.votes || 0) - (a.votes || 0);
      }
    });

  const handleRefresh = () => {
    fetchResources();
    toast.success('Resources refreshed');
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar - Fixed height */}
      <div className={`hidden lg:block transition-all duration-300 ${sidebarOpen ? "w-72" : "w-14"} h-screen overflow-hidden shrink-0`}>
        <StudySidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content - Scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-lg border-b border-border">
          <div className="px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-4 h-16 md:h-20">
              {/* Mobile menu button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>

              {/* Search Tabs - Hidden on mobile (available in sidebar) */}
              <div className="hidden md:flex gap-1 bg-secondary/50 rounded-lg p-1 flex-shrink-0">
                <Button
                  variant={searchMode === "resources" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSearchMode("resources")}
                  className="text-xs h-8"
                >
                  <Search className="w-3.5 h-3.5 mr-1.5" />
                  Resources
                </Button>
                <Button
                  variant={searchMode === "syllabus" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSearchMode("syllabus")}
                  className="text-xs h-8"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  Syllabus
                </Button>
                {/* Policy: Hide Following tab for readonly users */}
                {canViewFollowing && (
                  <Button
                    variant={searchMode === "following" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSearchMode("following")}
                    className="text-xs h-8"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Following
                  </Button>
                )}
              </div>

              {/* Search Bar - only show for resources */}
              {searchMode === "resources" && (
                <div className="relative flex-1 max-w-2xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4"
                  />
                </div>
              )}

              {/* Notification Button */}
              <NotificationButton />

              {/* Policy: Hide Upload buttons for readonly users */}
              {isFullAccess && (
                <>
                  {/* Upload Button */}
                  <UploadResourceDialog
                    trigger={
                      <Button className="hidden md:flex shrink-0">
                        <Plus className="w-4 h-4 mr-2" />
                        Share Resource
                      </Button>
                    }
                  />

                  {/* Mobile Upload */}
                  <UploadResourceDialog
                    trigger={
                      <Button size="icon" className="md:hidden shrink-0">
                        <Plus className="w-5 h-5" />
                      </Button>
                    }
                  />
                </>
              )}
            </div>

            {/* Filters - Show for both Resources and Syllabus */}
            <div className="flex gap-2 pb-4 overflow-x-auto no-scrollbar">
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesters.map((sem) => (
                    <SelectItem key={sem} value={sem}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBranch} onValueChange={(val) => {
                setSelectedBranch(val);
                setSelectedSubject("all");
              }}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branchLabels[branch]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={!selectedBranch}
              >
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Only show Type and Sort in Resources mode */}
              {searchMode === "resources" && (
                <>
                  <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
                    <SelectTrigger className="w-28 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="notes">Notes</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="pyq">PYQ</SelectItem>
                    </SelectContent>
                  </Select>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        Sort by
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortBy("votes")}>
                        Most Upvoted
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("recent")}>
                        Most Recent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {(selectedSemester !== 'all' || selectedBranch !== 'all' || selectedSubject !== 'all' || filterType !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSemester("all");
                    setSelectedBranch("all");
                    setSelectedSubject("all");
                    setFilterType("all");
                  }}
                  className="h-9"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 px-4 md:px-6 lg:px-8 py-6 overflow-y-auto">
          {searchMode === "resources" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {filteredResources.length} Resource{filteredResources.length !== 1 ? 's' : ''} Found
                </h2>
                <Button variant="ghost" size="sm" onClick={handleRefresh}>
                  Refresh
                </Button>
              </div>

              {loadingResources ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <ResourceCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">
                    No resources found. Be the first to share!
                  </p>
                  <UploadResourceDialog
                    trigger={
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Share Resource
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      id={resource.id}
                      title={resource.title}
                      type={resource.type as ResourceType}
                      author={resource.uploaded_by_name || "Anonymous"}
                      authorType="student"
                      upvotes={resource.upvotes || 0}
                      downvotes={resource.downvotes || 0}
                      votes={resource.votes || 0}
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
              )}
            </div>
          ) : searchMode === "following" ? (
            <FollowingFeed />
          ) : (
            <SyllabusSection
              selectedSemester={selectedSemester}
              selectedBranch={selectedBranch}
              selectedSubject={selectedSubject}
            />
          )}
        </div>

        {/* Mobile Floating Timer Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="lg:hidden fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-40"
            >
              <Timer className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-2xl">
            <div className="py-4">
              <StudyTimer />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Right Sidebar - Desktop Only - Fixed */}
      <div className="hidden xl:block w-80 border-l border-border shrink-0 h-screen overflow-y-auto">
        <div className="p-6 space-y-6">
          <StudyTimer />
          <MusicPlayer />
        </div>
      </div>
    </div>
  );
};

export default Study;