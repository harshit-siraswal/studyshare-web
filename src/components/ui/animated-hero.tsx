import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoveRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ANDROID_APK_PATH = "/downloads/studyshare-android.apk";

function Hero() {
    const [titleNumber, setTitleNumber] = useState(0);
    const titles = useMemo(
        () => ["smarter", "faster", "simpler", "together", "better"],
        []
    );

    const navigate = useNavigate();

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (titleNumber === titles.length - 1) {
                setTitleNumber(0);
            } else {
                setTitleNumber(titleNumber + 1);
            }
        }, 2500);
        return () => clearTimeout(timeoutId);
    }, [titleNumber, titles]);

    return (
        <div className="w-full flex justify-start">
            <div className="flex flex-col gap-8 py-20 lg:py-32 items-start justify-center max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Button variant="secondary" size="sm" className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-full cursor-default">
                        <Sparkles className="w-4 h-4" /> Welcome to StudyShare
                    </Button>
                </motion.div>

                <div className="flex gap-4 flex-col text-left">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground drop-shadow-sm flex flex-col md:flex-row md:items-center gap-2 md:gap-4 flex-wrap">
                        <span className="text-foreground">Study</span>
                        <span className="relative flex overflow-hidden min-w-[250px] h-[1.2em]">
                            <AnimatePresence mode="popLayout">
                                <motion.span
                                    key={titleNumber}
                                    className="absolute text-primary drop-shadow-[0_0_15px_rgba(22,163,74,0.2)]"
                                    initial={{ opacity: 0, y: 100 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -100 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                >
                                    {titles[titleNumber]}
                                </motion.span>
                            </AnimatePresence>
                        </span>
                    </h1>

                    <motion.p
                        className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-xl font-light"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        The ultimate platform for college students. Access curated notes, previous year questions, and let your AI buddy Whobee supercharge your studies.
                    </motion.p>
                </div>

                <motion.div
                    className="flex flex-row gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                >
                    <Button
                        size="lg"
                        className="gap-3 bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-[0_0_30px_rgba(22,163,74,0.3)] rounded-full px-8 text-base h-12 transition-all hover:scale-105"
                        onClick={() => navigate('/select-college')}
                    >
                        Get Started <MoveRight className="w-5 h-5" />
                    </Button>
                    <a href={ANDROID_APK_PATH} download>
                        <Button
                            size="lg"
                            variant="outline"
                            className="gap-3 rounded-full px-8 text-base h-12 transition-all hover:scale-105 bg-background border-border text-foreground shadow-sm"
                        >
                            Download Android APK
                        </Button>
                    </a>
                </motion.div>
            </div>
        </div>
    );
}

export { Hero };
