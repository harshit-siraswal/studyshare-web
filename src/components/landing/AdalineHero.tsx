import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRef } from "react";

export const AdalineHero = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Parallax and scale effects for the background
    const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
    const contentY = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    return (
        <div ref={containerRef} className="relative h-[150vh] w-full bg-background overflow-hidden">
            {/* Sticky container for the hero content */}
            <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">

                {/* Animated Background Image - using the user's provided image path */}
                <motion.div
                    className="absolute inset-0 z-0"
                    style={{ scale: bgScale }}
                >
                    <div className="absolute inset-0 bg-background/30 mix-blend-overlay z-10" />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background z-10" />
                    <img
                        src="/adaline-bg.png"
                        alt="Nature Landscape"
                        className="w-full h-full object-cover object-center"
                    />
                </motion.div>

                {/* Hero Content */}
                <motion.div
                    className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto mt-[-5vh]"
                    style={{ y: contentY, opacity }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 border border-border text-sm font-medium text-foreground mb-8 backdrop-blur-md shadow-sm"
                    >
                        <span>🚀</span>
                        <span>Now live for more colleges! Sharing 1M+ resources.</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-foreground leading-[1.1] mb-6 font-editorial drop-shadow-sm"
                    >
                        The single platform to learn,
                        <br />
                        collaborate, and <span className="text-primary italic font-serif">succeed</span>.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="text-lg md:text-xl text-foreground/70 max-w-2xl mb-12 drop-shadow-sm"
                    >
                        Choose your campus to enter a shared study space with resources, chatrooms, notices, and AI tools tailored to your college.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center"
                    >
                        <p className="text-xs font-semibold tracking-widest uppercase text-foreground/50 mb-6 drop-shadow-sm">Trusted By Students From</p>
                        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 opacity-70">
                            {/* College logos/names mockup */}
                            <span className="text-lg font-bold font-editorial">KIET</span>
                            <span className="text-lg font-bold font-editorial">IIIT BHAGALPUR</span>
                            <span className="text-lg font-bold font-editorial">DELHI UNIVERSITY</span>
                            <span className="text-lg font-bold font-editorial">ABESEC</span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-50"
                    style={{ opacity }}
                >
                    <div className="w-[1px] h-12 bg-gradient-to-b from-foreground/50 to-transparent" />
                    <span className="text-xs tracking-widest uppercase text-foreground">Scroll</span>
                </motion.div>
            </div>
        </div>
    );
};
