import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Users, BookOpen, Sparkles, Plus, Download, Sun, Moon } from "lucide-react";
import RequestCollegeDialog from "@/components/RequestCollegeDialog";
import { SEO } from "@/components/SEO";
import { supabase } from "../supabase";
import BrandMark from "@/components/BrandMark";
import { useTheme } from "@/hooks/useTheme";
import { openAndroidApkDownload } from "@/lib/apk";
import { toast } from "sonner";

// All active colleges with online-verified institutional/student domains
const initialColleges = [
    { id: 9, name: "Krishna Institute of Engineering and Technology", location: "Ghaziabad", students: 0, domain: "kiet.edu" },
    { id: 13, name: "IIIT Bhagalpur", location: "Bhagalpur, Bihar", students: 0, domain: "iiitbh.ac.in" },
    { id: 14, name: "IIIT Sonepat", location: "Sonepat, Haryana", students: 0, domain: "iiitsonepat.ac.in" },
    { id: 15, name: "ABES Engineering College", location: "Ghaziabad", students: 0, domain: "abes.ac.in" },
    { id: 16, name: "Delhi University", location: "New Delhi", students: 0, domain: "du.ac.in" },
    { id: 1, name: "Indian Institute of Technology Delhi", location: "New Delhi", students: 0, domain: "iitd.ac.in" },
    { id: 2, name: "Indian Institute of Technology Bombay", location: "Mumbai", students: 0, domain: "iitb.ac.in" },
    { id: 3, name: "Indian Institute of Technology Madras", location: "Chennai", students: 0, domain: "smail.iitm.ac.in" },
    { id: 5, name: "Birla Institute of Technology and Science, Pilani", location: "Pilani", students: 0, domain: "bits-pilani.ac.in" },
    { id: 6, name: "Vellore Institute of Technology", location: "Vellore", students: 0, domain: "vit.ac.in" },
    { id: 7, name: "National Institute of Technology Tiruchirappalli", location: "Tiruchirappalli", students: 0, domain: "nitt.edu" },
    { id: 8, name: "Anna University", location: "Chennai", students: 0, domain: "student.annauniv.edu" },
    { id: 10, name: "Amity University", location: "Noida", students: 0, domain: "amity.edu" },
    { id: 11, name: "SRM Institute of Science and Technology", location: "Chennai", students: 0, domain: "srmist.edu.in" },
    { id: 12, name: "Manipal Institute of Technology", location: "Manipal", students: 0, domain: "learner.manipal.edu" },
];

const SelectCollege = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [colleges, setColleges] = useState(initialColleges);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    // Fetch actual user counts for all active colleges
    useEffect(() => {
        const fetchUserCounts = async () => {
            try {
                // Fetch counts for each active college domain
                for (const college of initialColleges) {
                    if (!college.domain) continue;

                    const { count, error } = await supabase
                        .from('users')
                        .select('id', { count: 'exact', head: true })
                        .or(`email.ilike.%@${college.domain},email.ilike.%@%.${college.domain}`);

                    if (!error && count !== null) {
                        setColleges(prev => prev.map(c =>
                            c.id === college.id ? { ...c, students: count } : c
                        ));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch user counts:', err);
            }
        };

        fetchUserCounts();
    }, []);

    const filteredColleges = colleges.filter((college) =>
        college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        college.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCollegeSelect = (collegeId: number) => {
        const college = colleges.find(c => c.id === collegeId);
        if (!college) return;

        localStorage.setItem("selectedCollege", JSON.stringify(college));
        navigate("/auth");
    };

    const handleDownloadApk = async () => {
        const opened = await openAndroidApkDownload();
        if (!opened) {
            toast.error("APK download is temporarily unavailable. Please contact support.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-hero text-foreground font-ai overflow-x-hidden">
            <SEO
                title="StudyShare | AI Study Platform for College Notes, PYQs and Notices"
                description="StudyShare is an AI-powered college learning platform for notes, PYQs, notices, syllabi, and campus communities. Join your college, find semester-wise resources, and study faster."
                canonical="https://studyshare.in/"
                keywords={[
                    "StudyShare",
                    "StudyShare AI",
                    "college notes",
                    "PYQs",
                    "college notices",
                    "syllabus",
                    "AI study platform",
                    "semester wise resources",
                    "campus learning platform",
                ]}
            />
            {/* Background decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
                <div className="mb-6 flex items-center justify-end gap-2 md:mb-8">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleTheme}
                        className="bg-card/70 backdrop-blur-sm"
                    >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {theme === "dark" ? "Light" : "Dark"}
                    </Button>
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleDownloadApk}
                    >
                        <Download className="h-4 w-4" />
                        Download APK
                    </Button>
                </div>

                {/* Header */}
                <header className="text-center mb-12 md:mb-16 animate-fade-in">
                    <div className="inline-flex items-center gap-2 md:gap-3 mb-6">
                        <BrandMark
                            size={112}
                            className="h-16 w-16 md:h-20 md:w-20 origin-center motion-safe:animate-[spin_14s_linear_infinite] drop-shadow-[0_16px_30px_rgba(37,99,235,0.18)]"
                            alt="StudyShare"
                        />
                        <h1 className="text-3xl md:text-5xl font-bold">
                            Study<span className="text-gradient">Share</span>
                        </h1>
                    </div>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                        AI-powered college learning for notes, PYQs, notices, and campus communities. Join your college, find semester-wise resources, and study faster.
                    </p>
                </header>

                {/* Features preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto mb-12 md:mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                    {[
                        { icon: BookOpen, label: "Curated Resources", desc: "Notes, videos & PYQs" },
                        { icon: Users, label: "Community Driven", desc: "Upvote the best content" },
                        { icon: Sparkles, label: "Smart Study", desc: "AI Buddy & Timer integration" },
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
                            className="pl-12 h-12 md:h-14 text-base md:text-lg bg-card/80 backdrop-blur-sm border-border focus:ring-primary/50"
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
                                className="p-4 md:p-5 animate-slide-up hover:border-primary/50 hover:shadow-glow cursor-pointer transition-all hover:-translate-y-0.5 bg-card/80 backdrop-blur-sm group"
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
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/80 group-hover:bg-primary/10 group-hover:text-primary transition-colors px-2.5 py-1 rounded-full shrink-0">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>
                                            {college.students > 0 ? college.students : '...'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {filteredColleges.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-muted-foreground">No colleges found matching your search.</p>
                            <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2 text-primary">
                                Clear search
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="text-center mt-16 md:mt-20 text-sm text-muted-foreground pb-8">
                    <p>Can't find your college?</p>
                    <RequestCollegeDialog
                        trigger={
                            <Button variant="link" className="mt-1 text-primary">
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

export default SelectCollege;
