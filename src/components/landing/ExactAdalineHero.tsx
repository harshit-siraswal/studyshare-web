import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import BrandMark from "@/components/BrandMark";

export const ExactAdalineHero = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Total scroll length is 500vh to give enough room for the 4 sequences.
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // ========== PHASE 1: LOGO INTRO (Scroll 0 -> 0.15) ==========
    // Centered rotating logo that shrinks and moves to header
    const logoRotate = useTransform(scrollYProgress, [0, 0.05, 0.15], [0, 360, 360]); // Spins then stops
    const logoScale = useTransform(scrollYProgress, [0, 0.05, 0.15], [3, 3, 1]);

    // Move from center (y:0) to header (y: -40vh approx)
    // Adjusted percentages to be smoother
    const logoY = useTransform(scrollYProgress, [0.05, 0.15], ["0vh", "-42vh"]);
    const logoX = useTransform(scrollYProgress, [0.05, 0.15], ["0vw", "-12vw"]);

    // Header Text ("StudyShare") fades in next to logo once it lands
    const navTextOpacity = useTransform(scrollYProgress, [0.12, 0.16], [0, 1]);
    // Navbar specific background blur
    const navBgOpacity = useTransform(scrollYProgress, [0.15, 0.2], [0, 1]);

    // ========== PHASE 2: ADALINE TEXT & BG REVEAL (Scroll 0.15 -> 0.25) ==========
    const heroOpacity = useTransform(scrollYProgress, [0.15, 0.2], [0, 1]);
    const heroScale = useTransform(scrollYProgress, [0.15, 0.25], [1.05, 1]);

    // ========== PHASE 3: ADALINE DOORS CLOSE & TEXT LEAVES (Scroll 0.35 -> 0.5) ==========
    // Text translates up and out
    const textTranslateY = useTransform(scrollYProgress, [0.35, 0.45], [0, -150]);
    const textFadeOut = useTransform(scrollYProgress, [0.35, 0.45], [1, 0]);

    // Doors slide in from edges
    const leftDoorXClose = useTransform(scrollYProgress, [0.35, 0.48], ["-100vw", "0vw"]);
    const rightDoorXClose = useTransform(scrollYProgress, [0.35, 0.48], ["100vw", "0vw"]);

    // ========== PHASE 4: UI DASHBOARD FADES IN (Scroll 0.55 -> 0.65) ==========
    // Behind doors, the product UI fades in and scales slightly
    const uiOpacity = useTransform(scrollYProgress, [0.55, 0.65], [0, 1]);
    const uiScale = useTransform(scrollYProgress, [0.55, 0.65], [0.95, 1]);
    const bgZoom = useTransform(scrollYProgress, [0.35, 0.7], [1, 1.1]);

    // ========== PHASE 5: DOORS OPEN & REVEAL (Scroll 0.7 -> 0.85) ==========
    // Doors slide open slightly to frame the UI, then fully open
    const leftDoorXOpen = useTransform(scrollYProgress, [0.7, 0.85], ["0vw", "-100vw"]);
    const rightDoorXOpen = useTransform(scrollYProgress, [0.7, 0.85], ["0vw", "100vw"]);

    // Combine door transforms so they close THEN open
    const leftDoorFinalX = useTransform(() => {
        const status = scrollYProgress.get();
        if (status < 0.6) return leftDoorXClose.get();
        return leftDoorXOpen.get();
    });
    const rightDoorFinalX = useTransform(() => {
        const status = scrollYProgress.get();
        if (status < 0.6) return rightDoorXClose.get();
        return rightDoorXOpen.get();
    });


    return (
        <div ref={containerRef} className="relative h-[500vh] w-full bg-[#FBFDF6]">
            <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-[#FBFDF6]">

                {/* Layer 1: Background Nature Image (Fades in at Phase 2, zooms in later) */}
                <motion.div
                    className="absolute inset-0 z-0 origin-center"
                    style={{ opacity: heroOpacity, scale: bgZoom }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-[#FBFDF6]/80 via-[#FBFDF6]/30 to-[#FBFDF6]/80 z-10" />
                    <img
                        src="/adaline-bg.png"
                        alt="Nature Landscape"
                        className="w-full h-full object-cover object-center"
                    />
                </motion.div>

                {/* Layer 2: The Adaline Hero Text (Fades in Phase 2, exits Phase 3) */}
                <motion.div
                    className="absolute z-10 flex flex-col items-center justify-center text-center px-4 max-w-[1000px] mx-auto mt-[-5vh]"
                    style={{ opacity: textFadeOut, y: textTranslateY, scale: heroScale }}
                >
                    <motion.div style={{ opacity: heroOpacity }} className="flex flex-col items-center">
                        {/* Exactly recreating Adaline text & typography */}
                        <h1
                            className="text-[44.78px] md:text-[56px] font-normal tracking-[-1.79px] text-[#0A1D08] leading-[1.05] mb-[70px] font-ai max-w-[800px]"
                        >
                            The single platform to study, collaborate, & <span className="italic font-serif opacity-90">elevate</span> your campus.
                        </h1>

                        <div className="flex flex-col items-center">
                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0A1D08]/50 mb-8 font-mono">TRUSTED BY</p>
                            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4 opacity-60 grayscale">
                                <span className="text-xl font-bold font-editorial relative">KIET <div className="absolute -top-3 -right-6 text-[8px]">★</div></span>
                                <span className="text-xl font-bold font-editorial">IIIT BHAGALPUR</span>
                                <span className="text-xl font-bold font-editorial">DELHI UNIVERSITY</span>
                                <span className="text-xl font-bold font-editorial">ABESEC</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Layer 3: Glass / Wooden Doors (Adaline style) */}
                <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden flex">
                    {/* Left Door */}
                    <motion.div
                        className="h-full w-1/2 bg-white/40 backdrop-blur-xl border-r border-[#0A1D08]/10 shadow-2xl relative"
                        style={{ x: leftDoorFinalX }}
                    >
                        {/* Inner wood frame edge */}
                        <div className="absolute right-0 top-0 bottom-0 w-[24px] bg-gradient-to-r from-transparent to-[#0A1D08]/10" />
                    </motion.div>

                    {/* Right Door */}
                    <motion.div
                        className="h-full w-1/2 bg-white/40 backdrop-blur-xl border-l border-[#0A1D08]/10 shadow-2xl relative"
                        style={{ x: rightDoorFinalX }}
                    >
                        {/* Inner wood frame edge */}
                        <div className="absolute left-0 top-0 bottom-0 w-[24px] bg-gradient-to-l from-transparent to-[#0A1D08]/10" />
                    </motion.div>
                </div>

                {/* Layer 4: The Product UI Dashboard (Fades in during door close) */}
                <motion.div
                    className="absolute z-[21] w-[85vw] max-w-6xl rounded-2xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.6)] overflow-hidden border border-white/40 bg-[#FBFDF6]/95 backdrop-blur-3xl"
                    style={{ opacity: uiOpacity, scale: uiScale }}
                >
                    <div className="h-10 w-full bg-black/5 flex items-center px-4 gap-2 backdrop-blur-md border-b border-white/20">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                        <div className="mx-auto text-[10px] font-mono tracking-widest text-[#0A1D08]/40">STUDYSHARE.IN</div>
                    </div>
                    <img src="/studyshare-screenshot.png" alt="StudyShare Interface" className="w-full h-auto object-cover" />

                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-b-2xl cursor-pointer">
                        <button
                            className="bg-white text-[#0A1D08] px-8 py-4 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform flex items-center gap-3 tracking-widest text-sm uppercase"
                            onClick={() => {
                                const el = document.getElementById("college-selection");
                                el?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            Continue <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>

                {/* Layer 5: The Intro Logo (Plain screen at start -> Moves to Navbar) */}
                {/* Adjusted Z-index to be high at first but then under the glass panels */}
                <motion.div
                    className="absolute z-[25] flex items-center justify-center pointer-events-none"
                    style={{ y: logoY, x: logoX, rotate: logoRotate, scale: logoScale }}
                >
                    <BrandMark size={80} className="text-[#0A1D08]" />
                </motion.div>

                {/* Layer 6: Dynamic Navbar Elements (Fades in as logo arrives) */}
                <motion.div
                    className="absolute top-0 left-0 right-0 h-24 z-[24] flex items-center justify-between px-6 md:px-12 pointer-events-none"
                    style={{
                        backgroundColor: useTransform(navBgOpacity, [0, 1], ["rgba(251, 253, 246, 0)", "rgba(251, 253, 246, 0.7)"]),
                        backdropFilter: useTransform(navBgOpacity, [0, 1], ["blur(0px)", "blur(12px)"]),
                    }}
                >
                    {/* Logo Text (next to where the icon lands) */}
                    <motion.div className="flex flex-1 justify-center items-center" style={{ opacity: navTextOpacity }}>
                        {/* The absolute position here coordinates exactly with the logo animation translation */}
                        <span className="text-2xl font-normal font-ai tracking-tight text-[#0A1D08] absolute" style={{ transform: 'translateX(6vw)' }}>
                            StudyShare
                        </span>
                    </motion.div>
                </motion.div>

            </div>
        </div>
    );
};
