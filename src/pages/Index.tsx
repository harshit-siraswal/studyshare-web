import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { GraduationCap, Search, Users, BookOpen, Sparkles, Plus } from "lucide-react";
import RequestCollegeDialog from "@/components/RequestCollegeDialog";
import { SEO } from "@/components/SEO";
import { supabase } from "../supabase";

// College data - KIET (id 9) will show actual user count
const initialColleges = [
  { id: 1, name: "Indian Institute of Technology Delhi", location: "New Delhi", students: 12500, domain: null },
  { id: 2, name: "Indian Institute of Technology Bombay", location: "Mumbai", students: 11000, domain: null },
  { id: 3, name: "Indian Institute of Technology Madras", location: "Chennai", students: 10500, domain: null },
  { id: 4, name: "Delhi University", location: "New Delhi", students: 132000, domain: null },
  { id: 5, name: "Birla Institute of Technology", location: "Pilani", students: 15000, domain: null },
  { id: 6, name: "Vellore Institute of Technology", location: "Vellore", students: 25000, domain: null },
  { id: 7, name: "National Institute of Technology", location: "Trichy", students: 8000, domain: null },
  { id: 8, name: "Anna University", location: "Chennai", students: 85000, domain: null },
  { id: 9, name: "Krishna Institute of Engineering and Technology", location: "Ghaziabad", students: 0, domain: "kiet.edu" },
  { id: 10, name: "Amity University", location: "Noida", students: 45000, domain: null },
  { id: 11, name: "SRM Institute of Technology", location: "Chennai", students: 38000, domain: null },
  { id: 12, name: "Manipal Institute of Technology", location: "Manipal", students: 20000, domain: null },
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [colleges, setColleges] = useState(initialColleges);
  const navigate = useNavigate();

  // Fetch actual user count for KIET
  useEffect(() => {
    const fetchKietUserCount = async () => {
      try {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .ilike('email', '%@kiet.edu');

        if (!error && count !== null) {
          setColleges(prev => prev.map(c =>
            c.id === 9 ? { ...c, students: count } : c
          ));
        }
      } catch (err) {
        console.error('Failed to fetch KIET user count:', err);
      }
    };

    fetchKietUserCount();
  }, []);

  const filteredColleges = colleges.filter((college) =>
    college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    college.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCollegeSelect = (collegeId: number) => {
    // Only allow KIET (id 9) to proceed
    if (collegeId === 9) {
      localStorage.setItem("selectedCollege", JSON.stringify(colleges.find(c => c.id === collegeId)));
      navigate("/auth");
    } else {
      // Show work in progress for other colleges
      const college = colleges.find(c => c.id === collegeId);
      alert(`🚧 Work in Progress\n\n${college?.name} will be available soon!\n\nCurrently, only Krishna Institute of Engineering and Technology (KIET) is accessible.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEO
        title="Select Your College"
        description="Join your college community on StudySpace. Access curated study materials, notes, videos, and connect with peers."
      />
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold">
              Study<span className="text-gradient">Space</span>
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Join your college community. Access curated study materials, connect with peers, and ace your exams together.
          </p>
        </header>

        {/* Features preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto mb-12 md:mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {[
            { icon: BookOpen, label: "Curated Resources", desc: "Notes, videos & PYQs" },
            { icon: Users, label: "Community Driven", desc: "Upvote the best content" },
            { icon: Sparkles, label: "Smart Study", desc: "Timer & music integration" },
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow">
              <div className="p-2 rounded-lg bg-primary/10">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{feature.label}</p>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8 md:mb-12 animate-slide-up px-4" style={{ animationDelay: "0.3s" }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for your college or university..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 md:h-14 text-base md:text-lg bg-card border-border"
            />
          </div>
        </div>

        {/* College Grid */}
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-lg font-medium text-muted-foreground mb-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            Select your institution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {filteredColleges.map((college, index) => (
              <Card
                key={college.id}
                variant="interactive"
                className="p-4 md:p-5 animate-slide-up"
                style={{ animationDelay: `${0.1 * index}s` }}
                onClick={() => handleCollegeSelect(college.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors text-sm md:text-base">
                      {college.name}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{college.location}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full shrink-0">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {college.domain
                        ? (college.students > 0 ? college.students : '...')
                        : `${(college.students / 1000).toFixed(0)}k+`
                      }
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredColleges.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No colleges found matching your search.</p>
              <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                Clear search
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 md:mt-20 text-sm text-muted-foreground">
          <p>Can't find your college?</p>
          <RequestCollegeDialog
            trigger={
              <Button variant="link" className="mt-1">
                <Plus className="w-4 h-4 mr-1" />
                Request to add it
              </Button>
            }
          />
        </footer>
      </div>
    </div>
  );
};

export default Index;
