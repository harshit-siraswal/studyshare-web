'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export const AdalineNavbar = () => {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-300 backdrop-blur-sm bg-background/50 border-b border-border/20">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                    <BrandMark size={24} className="text-primary" />
                    <span className="text-xl font-bold font-editorial text-foreground">
                        Study<span className="text-primary">share</span>
                    </span>
                </div>

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground/80">
                    <Link href="/" className="hover:text-primary transition-colors">Resources</Link>
                    <Link href="/" className="hover:text-primary transition-colors">Community</Link>
                    <Link href="/" className="hover:text-primary transition-colors">AI Studio</Link>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <Button
                    variant="default"
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 font-medium shadow-none h-10"
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
