import { useState, useEffect } from "react";
import { Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Plus, ChevronDown, BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import StudySidebar from "@/components/StudySidebar";
import MusicPlayer from "@/components/MusicPlayer";
import StudyTimer from "@/components/StudyTimer";
import ResourceCard, { ResourceType } from "@/components/ResourceCard";
import UploadResourceDialog from "@/components/UploadResourceDialog";
import SyllabusSection from "@/components/SyllabusSection";

const semesters = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"];
const branches = ["Computer Science", "Electronics", "Mechanical", "Civil", "Electrical", "Chemical"];
const subjects = {
  "Computer Science": ["Data Structures", "Algorithms", "Operating Systems", "DBMS", "Computer Networks", "Machine Learning"],
  "Electronics": ["Digital Electronics", "Analog Circuits", "Signal Processing", "VLSI", "Embedded Systems"],
  "Mechanical": ["Thermodynamics", "Fluid Mechanics", "Machine Design", "Manufacturing", "Heat Transfer"],
  "Civil": ["Structural Analysis", "Concrete Technology", "Geotechnical", "Surveying", "Hydrology"],
  "Electrical": ["Power Systems", "Control Systems", "Electrical Machines", "Power Electronics"],
  "Chemical": ["Mass Transfer", "Reaction Engineering", "Process Control", "Thermodynamics"],
};

const mockResources = [
  { id: 1, title: "Complete Guide to Arrays and Linked Lists", type: "video" as ResourceType, author: "Prof. Sharma", authorType: "teacher" as const, votes: 156, subject: "Data Structures", chapter: "Arrays", subtopics: ["arrays", "linked lists", "pointers", "memory allocation"], date: "2024-03-10" },
  { id: 2, title: "Handwritten Notes - Tree Traversals", type: "notes" as ResourceType, author: "Rahul K.", authorType: "student" as const, votes: 89, subject: "Data Structures", chapter: "Trees", subtopics: ["binary tree", "bst", "inorder", "preorder", "postorder"], date: "2024-03-08" },
  { id: 3, title: "OS Mid-Sem 2023 with Solutions", type: "pyq" as ResourceType, author: "Priya M.", authorType: "student" as const, votes: 234, subject: "Operating Systems", chapter: "Process Management", subtopics: ["process", "threads", "scheduling", "deadlock"], date: "2024-03-05" },
  { id: 4, title: "SQL Joins Explained Simply", type: "video" as ResourceType, author: "Prof. Kumar", authorType: "teacher" as const, votes: 178, subject: "DBMS", chapter: "SQL", subtopics: ["inner join", "outer join", "left join", "right join", "cross join"], date: "2024-03-12" },
  { id: 5, title: "Network Protocols Summary", type: "notes" as ResourceType, author: "Amit S.", authorType: "student" as const, votes: 67, subject: "Computer Networks", chapter: "TCP/IP", subtopics: ["tcp", "udp", "ip", "http", "dns", "osi model"], date: "2024-03-01" },
  { id: 6, title: "End-Sem 2022 Question Paper", type: "pyq" as ResourceType, author: "Library", authorType: "teacher" as const, votes: 312, subject: "Algorithms", chapter: "Full Syllabus", subtopics: ["sorting", "searching", "dynamic programming", "greedy", "graph algorithms"], date: "2024-02-28" },
];

type SortOption = "teacher" | "votes" | "recent";

const Study = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [filterType, setFilterType] = useState<ResourceType | "all">("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<"resources" | "syllabus">("resources");
  const [sortBy, setSortBy] = useState<SortOption>("teacher");
  const [showMobileTools, setShowMobileTools] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const availableSubjects = selectedBranch 
    ? subjects[selectedBranch as keyof typeof subjects] || []
    : [];

  const filteredResources = mockResources
    .filter((resource) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        resource.title.toLowerCase().includes(query) ||
        resource.subject.toLowerCase().includes(query) ||
        resource.chapter.toLowerCase().includes(query) ||
        resource.subtopics.some(subtopic => subtopic.includes(query));
      const matchesType = filterType === "all" || resource.type === filterType;
      const matchesSubject = !selectedSubject || resource.subject === selectedSubject;
      
      return matchesSearch && matchesType && matchesSubject;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "teacher":
          if (a.authorType === "teacher" && b.authorType !== "teacher") return -1;
          if (a.authorType !== "teacher" && b.authorType === "teacher") return 1;
          return b.votes - a.votes;
        case "votes":
          return b.votes - a.votes;
        case "recent":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        default:
          return 0;
      }
    });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <StudySidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <StudySidebar isOpen={true} onToggle={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Search Mode Toggle */}
            <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden">
              <Button
                variant={searchMode === "resources" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSearchMode("resources")}
                className="rounded-none h-9"
              >
                <Search className="w-4 h-4 mr-2" />
                Resources
              </Button>
              <Button
                variant={searchMode === "syllabus" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSearchMode("syllabus")}
                className="rounded-none h-9"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Syllabus
              </Button>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-2xl relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={searchMode === "resources" 
                  ? "Search resources..." 
                  : "Search syllabus..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-11 pr-4 h-10 sm:h-11 text-sm"
              />
            </div>

            {/* Upload Button */}
            <UploadResourceDialog
              trigger={
                <Button className="shrink-0 h-10 sm:h-11" size="sm">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Share Resource</span>
                </Button>
              }
            />
          </div>

          {/* Mobile Search Mode Toggle */}
          <div className="flex sm:hidden items-center gap-2 mt-3">
            <Button
              variant={searchMode === "resources" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("resources")}
              className="flex-1 h-8 text-xs"
            >
              <Search className="w-3 h-3 mr-1" />
              Resources
            </Button>
            <Button
              variant={searchMode === "syllabus" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("syllabus")}
              className="flex-1 h-8 text-xs"
            >
              <BookOpen className="w-3 h-3 mr-1" />
              Syllabus
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:overflow-visible">
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-[120px] sm:w-[160px] h-8 sm:h-9 text-xs sm:text-sm shrink-0">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((sem) => (
                  <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBranch} onValueChange={(value) => {
              setSelectedBranch(value);
              setSelectedSubject("");
            }}>
              <SelectTrigger className="w-[120px] sm:w-[180px] h-8 sm:h-9 text-xs sm:text-sm shrink-0">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedBranch}>
              <SelectTrigger className="w-[140px] sm:w-[200px] h-8 sm:h-9 text-xs sm:text-sm shrink-0">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(selectedSemester || selectedBranch || selectedSubject || filterType !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSemester("");
                  setSelectedBranch("");
                  setSelectedSubject("");
                  setFilterType("all");
                  setSearchQuery("");
                }}
                className="h-8 sm:h-9 text-xs sm:text-sm text-muted-foreground hover:text-foreground shrink-0"
              >
                Clear
              </Button>
            )}

            <div className="hidden sm:flex items-center gap-1 ml-auto shrink-0">
              <Button
                variant={filterType === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterType("all")}
                className="h-8"
              >
                All
              </Button>
              <Button
                variant={filterType === "video" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterType("video")}
                className="h-8"
              >
                Videos
              </Button>
              <Button
                variant={filterType === "notes" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterType("notes")}
                className="h-8"
              >
                Notes
              </Button>
              <Button
                variant={filterType === "pyq" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterType("pyq")}
                className="h-8"
              >
                PYQs
              </Button>
            </div>
          </div>

          {/* Mobile Filter Pills */}
          <div className="flex sm:hidden items-center gap-1 mt-2 overflow-x-auto pb-1 -mx-3 px-3">
            {["all", "video", "notes", "pyq"].map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type as ResourceType | "all")}
                className="h-7 text-xs shrink-0"
              >
                {type === "all" ? "All" : type === "video" ? "Videos" : type === "notes" ? "Notes" : "PYQs"}
              </Button>
            ))}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Resources Grid */}
          <ScrollArea className="flex-1">
            <div className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-foreground">
                    {searchMode === "resources" ? "Study Resources" : "Subject Syllabus"}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {searchMode === "resources" 
                      ? `${filteredResources.length} resources found`
                      : selectedSubject 
                        ? `Showing ${selectedSubject} syllabus`
                        : "Select filters to view syllabus"}
                  </p>
                </div>
                {searchMode === "resources" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm">
                        <SlidersHorizontal className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Sort by {sortBy === "teacher" ? "Teacher" : sortBy === "votes" ? "Votes" : "Recent"}</span>
                        <ChevronDown className="w-4 h-4 ml-1 sm:ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortBy("teacher")}>
                        Sort by Teacher
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("votes")}>
                        Sort by Votes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("recent")}>
                        Sort by Recent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {searchMode === "resources" ? (
                <div className="space-y-3 sm:space-y-4">
                  {filteredResources.map((resource, index) => (
                    <div
                      key={resource.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <ResourceCard {...resource} />
                    </div>
                  ))}

                  {filteredResources.length === 0 && (
                    <div className="text-center py-12 sm:py-16">
                      <p className="text-muted-foreground">No resources found matching your criteria.</p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterType("all");
                          setSelectedSubject("");
                        }}
                        className="mt-2"
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <SyllabusSection 
                  availableSubjects={availableSubjects} 
                  selectedBranch={selectedBranch}
                  selectedSubject={selectedSubject}
                />
              )}
            </div>
          </ScrollArea>

          {/* Right Tools Panel - Timer & Music (Desktop) */}
          <div className="w-72 shrink-0 border-l border-border p-4 space-y-4 hidden lg:block">
            <StudyTimer />
            <MusicPlayer />
          </div>
        </div>

        {/* Mobile Bottom Tools Button */}
        <div className="fixed bottom-4 right-4 lg:hidden z-50">
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg"
            onClick={() => setShowMobileTools(true)}
          >
            <Music className="w-6 h-6" />
          </Button>
        </div>

        {/* Mobile Tools Sheet */}
        <Sheet open={showMobileTools} onOpenChange={setShowMobileTools}>
          <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
            <div className="space-y-4 pt-2 pb-6">
              <StudyTimer />
              <MusicPlayer />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default Study;
