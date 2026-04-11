import { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Plus, ChevronDown, BookOpen, Menu, Users } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
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
import UploadSyllabusDialog from "@/components/UploadSyllabusDialog";
import SyllabusSection from "@/components/SyllabusSection";
import FollowingFeed from '@/components/FollowingFeed';
import BookmarkedResources from '@/components/BookmarkedResources';
import NotificationButton from '@/components/NotificationButton';
import PremiumButton from "@/components/PremiumButton";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useDebounce } from "@/hooks/use-debounce";
import { useResources } from "@/hooks/useResources";
import { BRANCH_OPTIONS, SEMESTER_OPTIONS, getBranchLabel, getSubjectsForBranchAndSemester } from "@/lib/academicSubjects";
import { getAcademicCatalog, type AcademicCatalog } from "@/lib/api";

type SortOption = "teacher" | "votes" | "recent";

const Study = () => {
  /* ---------------------------------------------------------------- */
  /* HOOKS (MUST BE FIRST) */
  /* ---------------------------------------------------------------- */
  const { user, loading, hasElevatedAccess } = useAuth();
  const { selectedCollege, selectedCollegeId } = useCollege();
  const { isFullAccess, canViewFollowing } = usePermissions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [filterType, setFilterType] = useState<ResourceType | "all">("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchMode, setSearchMode] =
    useState<"resources" | "syllabus" | "following" | "bookmarks">("resources");
  const [sortBy, setSortBy] = useState<SortOption>("votes");
  const [catalog, setCatalog] = useState<AcademicCatalog | null>(null);

  // React Query: Fetch resources with caching
  const { resources, isLoading: loadingResources, refresh: handleRefresh } = useResources({
    semester: selectedSemester,
    branch: selectedBranch,
    subject: selectedSubject,
  });

  // Read tab from URL and sync with searchMode
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "syllabus") {
      setSearchMode("syllabus");
    } else if (tab === "following") {
      setSearchMode("following");
    } else if (tab === "bookmarks") {
      setSearchMode("bookmarks");
    } else {
      setSearchMode("resources");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedCollegeId) {
      setCatalog(null);
      return;
    }

    let active = true;
    getAcademicCatalog(selectedCollegeId)
      .then((data) => {
        if (active) {
          setCatalog(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load academic catalog:", error);
      });

    return () => {
      active = false;
    };
  }, [selectedCollegeId]);

  /* ---------------------------------------------------------------- */
  /* AUTH GUARD (SAFE & STABLE) */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user) return null;

  const availableSubjects = (selectedBranch && selectedBranch !== 'all')
    ? (
      catalog?.offerings
        .filter((offering) =>
          offering.branch === selectedBranch &&
          (selectedSemester === "all" ? true : offering.semester === selectedSemester)
        )
        .map((offering) => offering.subject) ||
      getSubjectsForBranchAndSemester(selectedBranch, selectedSemester === "all" ? undefined : selectedSemester)
    )
    : [];

  // Filter and sort resources (memoized for performance)
  const filteredResources = resources
    .filter((resource) => {
      const query = debouncedSearchQuery.toLowerCase();
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
        case "teacher":
          // Teacher/admin content first, then by votes
          const aIsTeacher = (a as any).uploaded_by_role === 'admin' || (a as any).uploaded_by_role === 'teacher' ? 1 : 0;
          const bIsTeacher = (b as any).uploaded_by_role === 'admin' || (b as any).uploaded_by_role === 'teacher' ? 1 : 0;
          if (bIsTeacher !== aIsTeacher) return bIsTeacher - aIsTeacher;
          return (b.votes || 0) - (a.votes || 0);
        default:
          return (b.votes || 0) - (a.votes || 0);
      }
    });

  const handleSearchModeChange = (mode: "resources" | "syllabus" | "following" | "bookmarks") => {
    setSearchMode(mode);

    const nextSearchParams = new URLSearchParams(searchParams);
    if (mode === "resources") {
      nextSearchParams.delete("tab");
    } else {
      nextSearchParams.set("tab", mode);
    }

    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <SEO
        title="Study Resources"
        description="Access curated study materials, notes, videos, and previous year questions for your courses."
        noIndex
        keywords={["study resources", "college notes", "previous year questions", "video lectures"]}
      />
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
            <div className="flex items-center gap-2 md:gap-3 h-16 md:h-20 min-w-0">
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
                  onClick={() => handleSearchModeChange("resources")}
                  className="text-xs h-8"
                >
                  <Search className="w-3.5 h-3.5 mr-1.5" />
                  Resources
                </Button>
                <Button
                  variant={searchMode === "syllabus" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleSearchModeChange("syllabus")}
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
                    onClick={() => handleSearchModeChange("following")}
                    className="text-xs h-8"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Following
                  </Button>
                )}
              </div>

              {/* Search Bar - show for resources and following */}
              {(searchMode === "resources" || searchMode === "following") && (
                <div className="relative flex-1 min-w-0 md:min-w-[180px] lg:min-w-[240px] xl:min-w-[300px] max-w-[640px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={searchMode === "following" ? "Search following content..." : "Search resources..."}
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
                  {/* Upload Button - Desktop only (mobile uses bottom nav) */}
                  {searchMode === "syllabus" ? (
                    hasElevatedAccess && (
                      <UploadSyllabusDialog
                        trigger={
                          <Button className="hidden md:flex shrink-0">
                            <Plus className="w-4 h-4 md:mr-0 xl:mr-2" />
                            <span className="hidden xl:inline">Upload Syllabus</span>
                            <span className="sr-only xl:hidden">Upload Syllabus</span>
                          </Button>
                        }
                      />
                    )
                  ) : (
                    <UploadResourceDialog
                      trigger={
                        <Button className="hidden md:flex shrink-0">
                          <Plus className="w-4 h-4 md:mr-0 xl:mr-2" />
                          <span className="hidden xl:inline">Share Resource</span>
                          <span className="sr-only xl:hidden">Share Resource</span>
                        </Button>
                      }
                    />
                  )}
                </>
              )}
            </div>

            {/* Filters - Show for both Resources and Syllabus */}
            <div className="flex items-center gap-2 pb-4">
              <div className="flex flex-1 min-w-0 gap-2 overflow-x-auto no-scrollbar">
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {SEMESTER_OPTIONS.map((sem) => (
                    <SelectItem key={sem.value} value={sem.value}>
                      {sem.label}
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
                  {BRANCH_OPTIONS.map((branch) => (
                    <SelectItem key={branch.value} value={branch.value}>
                      {getBranchLabel(branch.value)}
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
                      <DropdownMenuItem onClick={() => setSortBy("teacher")}>
                        Teacher Content
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

              {/* Premium CTA moved out of top bar so search remains practical */}
              <div className="hidden md:flex shrink-0">
                <PremiumButton />
              </div>
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
                /* Virtualized grid for performance - only renders visible items */
                <VirtuosoGrid
                  style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
                  totalCount={filteredResources.length}
                  listClassName="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
                  itemClassName=""
                  itemContent={(index) => {
                    const resource = filteredResources[index];
                    // Determine author type based on uploaded_by_role
                    const authorType = (resource.uploaded_by_role === 'admin' || resource.uploaded_by_role === 'teacher')
                      ? 'teacher'
                      : 'student';
                    return (
                      <ResourceCard
                        key={resource.id}
                        id={resource.id}
                        title={resource.title}
                        type={resource.type as ResourceType}
                        author={resource.uploaded_by_name || "Anonymous"}
                        authorType={authorType}
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
                    );
                  }}
                  components={{
                    Footer: () => <div className="h-20" />,
                  }}
                />
              )}
            </div>
          ) : searchMode === "following" ? (
            <FollowingFeed searchQuery={searchQuery} />
          ) : searchMode === "bookmarks" ? (
            <BookmarkedResources />
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
