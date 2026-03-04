import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import BrandMark from "@/components/BrandMark";

export const ExactAdalineNavbar = ({ hideCenter = false }: { hideCenter?: boolean }) => {
    return (
        <div className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-5 flex items-center justify-between transition-all duration-300">

            {/* Left Links */}
            <nav className="hidden md:flex flex-1 items-center gap-8 text-[11px] font-bold tracking-[0.1em] uppercase text-[#1B291A]">
                <Link to="/" className="hover:opacity-70 transition-opacity flex items-center gap-1">
                    Features
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </Link>
                <Link to="/" className="hover:opacity-70 transition-opacity">Pricing</Link>
                <Link to="/" className="hover:opacity-70 transition-opacity">Blog</Link>
            </nav>

            {/* Center Logo */}
            <div className={`flex-1 flex justify-center items-center gap-2 transition-opacity duration-500 ${hideCenter ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <BrandMark size={24} className="text-[#131B12]" />
                <span className="text-2xl font-normal font-ai tracking-tight text-[#131B12]">
                    StudyShare
                </span>
            </div>

            {/* Right CTA */}
            <div className="flex-1 flex justify-end">
                <Button
                    className="rounded-full bg-[#131B12] text-[#FDFCF5] hover:bg-[#131B12]/80 px-6 py-5 text-xs font-bold tracking-[0.1em] uppercase shadow-none border-none"
                    onClick={() => {
                        const el = document.getElementById("college-selection");
                        el?.scrollIntoView({ behavior: "smooth" });
                    }}
                >
                    Select College
                </Button>
            </div>

        </div>
    );
};
