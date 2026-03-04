'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { InteractiveRobotSpline } from '@/components/blocks/interactive-3d-robot';
import { ArrowDown, Sparkles, BookOpen, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function RobotHero() {
    const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";
    const navigate = useNavigate();

    const handleContinue = () => {
        navigate('/select-college');
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#0A1D08]">
            {/* 3D Background */}
            <InteractiveRobotSpline
                scene={ROBOT_SCENE_URL}
                className="absolute inset-0 z-0"
            />

            {/* Overlay gradient to ensure text readability */}
            <div className="absolute inset-0 z-[5] bg-gradient-to-b from-[#0A1D08]/80 via-transparent to-[#0A1D08] pointer-events-none" />

            {/* Content */}
            <div className="absolute inset-0 z-10 flex flex-col justify-between pt-32 pb-12 px-6 md:px-12 pointer-events-none">

                {/* Header Section */}
                <motion.div
                    className="w-full max-w-4xl mx-auto text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 mb-6 drop-shadow-sm pointer-events-auto"
                    >
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium tracking-wide">Welcome to the Future of Learning</span>
                    </motion.div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-2xl mb-6 tracking-tight leading-tight">
                        Meet <span className="text-emerald-400">Whobee</span>.<br />Your AI Study Buddy.
                    </h1>

                    <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto drop-shadow-md font-light">
                        Interactive, intelligent, and always here to help. Explore your college community and supercharge your studies.
                    </p>
                </motion.div>

                {/* Feature Cards (SVG/Icons and Unsplash via visual representation) */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mb-12"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                >
                    {/* Feature 1 */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group pointer-events-auto transition-transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <BookOpen className="w-8 h-8 text-emerald-400 mb-4 drop-shadow-md" />
                        <h3 className="text-xl font-semibold text-white mb-2">Smart Notes</h3>
                        <p className="text-white/60 text-sm leading-relaxed">Instantly access curated study materials powered by your community.</p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group pointer-events-auto transition-transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Users className="w-8 h-8 text-emerald-400 mb-4 drop-shadow-md" />
                        <h3 className="text-xl font-semibold text-white mb-2">College Network</h3>
                        <p className="text-white/60 text-sm leading-relaxed">Connect exclusively with peers from your exact university.</p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group pointer-events-auto transition-transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Sparkles className="w-8 h-8 text-emerald-400 mb-4 drop-shadow-md" />
                        <h3 className="text-xl font-semibold text-white mb-2">AI Tutoring</h3>
                        <p className="text-white/60 text-sm leading-relaxed">Get unstuck instantly with our context-aware AI learning assistant.</p>
                    </div>
                </motion.div>

                <motion.div
                    className="flex justify-center w-full pointer-events-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                >
                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={handleContinue}
                        className="group flex flex-col items-center gap-2 text-white/70 hover:text-white hover:bg-white/10 rounded-3xl h-auto py-4 px-6 transition-all"
                    >
                        <span className="text-sm tracking-widest uppercase font-semibold">Continue to College Selection</span>
                        <motion.div
                            animate={{ x: [0, 8, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        >
                            <ArrowRight className="w-5 h-5" />
                        </motion.div>
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
