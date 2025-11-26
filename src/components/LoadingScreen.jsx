import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function LoadingScreen({ isLoading, onComplete }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isLoading) return;

        const startTime = Date.now();
        const minimumDisplayTime = 5000; // 5 seconds minimum

        // Simulate progress over 5 seconds
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);

                    // Ensure minimum display time has elapsed
                    const elapsedTime = Date.now() - startTime;
                    const remainingTime = Math.max(0, minimumDisplayTime - elapsedTime);

                    // Wait for remaining time + 300ms before calling onComplete
                    setTimeout(() => onComplete?.(), remainingTime + 300);
                    return 100;
                }
                // Increment by 1% every 50ms = 5 seconds total (100% / 100 intervals)
                return Math.min(prev + 1, 100);
            });
        }, 50);

        return () => clearInterval(interval);
    }, [isLoading, onComplete]);

    if (!isLoading) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
                }}
            >
                {/* Animated grid background */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                        animation: 'gridMove 20s linear infinite',
                    }}
                />

                {/* Rotating gradient background */}
                <div
                    className="absolute w-[200%] h-[200%] animate-spin-slow"
                    style={{
                        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
                        animationDuration: '25s',
                    }}
                />

                {/* Enhanced particles with different sizes */}
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="particle absolute rounded-full"
                        style={{
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 3 + 1}px`,
                            backgroundColor: i % 3 === 0 ? 'rgba(56, 189, 248, 0.6)' :
                                i % 3 === 1 ? 'rgba(14, 165, 233, 0.5)' :
                                    'rgba(6, 182, 212, 0.4)',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `floatParticle ${5 + Math.random() * 4}s infinite ease-in-out`,
                            animationDelay: `${Math.random() * 5}s`,
                            '--x': `${(Math.random() - 0.5) * 300}px`,
                            '--y': `${(Math.random() - 0.5) * 300}px`,
                            boxShadow: '0 0 10px currentColor',
                        }}
                    />
                ))}

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        duration: 1.2,
                        ease: [0.34, 1.56, 0.64, 1],
                    }}
                    className="relative z-10 text-center"
                >
                    {/* Logo with enhanced glow */}
                    <motion.div
                        animate={{
                            y: [0, -20, 0],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="text-[120px] font-black mb-4 tracking-[0.5rem] relative font-orbitron"
                        style={{
                            background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #06b6d4 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: 'drop-shadow(0 0 40px rgba(56, 189, 248, 0.8)) drop-shadow(0 0 80px rgba(56, 189, 248, 0.4))',
                        }}
                    >
                        BHHRAMAN
                    </motion.div>

                    {/* Tagline */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="text-lg text-sky-400/80 font-light mb-2 tracking-[0.3rem] italic"
                    >
                        Navigate Your Campus
                    </motion.div>

                    {/* Subtitle */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="text-3xl text-slate-500 font-medium mb-12 tracking-[0.25rem]"
                    >
                        by GL Bajaj
                    </motion.div>

                    {/* Enhanced Spinner with pulse effect */}
                    <div className="w-24 h-24 mx-auto mb-10 relative">
                        <div
                            className="absolute inset-0 rounded-full animate-ping"
                            style={{
                                border: '3px solid rgba(56, 189, 248, 0.3)',
                                animationDuration: '2s',
                            }}
                        />
                        <div
                            className="w-full h-full rounded-full animate-spin relative"
                            style={{
                                border: '5px solid rgba(56, 189, 248, 0.15)',
                                borderTopColor: '#38bdf8',
                                borderRightColor: '#0ea5e9',
                                boxShadow: '0 0 40px rgba(56, 189, 248, 0.6), inset 0 0 20px rgba(56, 189, 248, 0.2)',
                            }}
                        />
                    </div>

                    {/* Progress Bar with enhanced styling */}
                    <div className="w-[450px] max-w-[90vw] mx-auto mb-4">
                        <div className="h-2 bg-slate-900/80 rounded-full overflow-hidden relative backdrop-blur-sm border border-slate-800/50">
                            <motion.div
                                className="h-full rounded-full relative"
                                style={{
                                    background: 'linear-gradient(90deg, #38bdf8 0%, #0ea5e9 50%, #06b6d4 100%)',
                                    boxShadow: '0 0 30px rgba(56, 189, 248, 0.8), 0 0 60px rgba(56, 189, 248, 0.4)',
                                }}
                                initial={{ width: '0%' }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8 }}
                            >
                                {/* Shimmer effect */}
                                <div
                                    className="absolute inset-0 opacity-50"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                        animation: 'shimmer 2s infinite',
                                    }}
                                />
                            </motion.div>
                        </div>
                    </div>

                    {/* Progress Text with percentage */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="flex items-center justify-center gap-3"
                    >
                        <span className="text-slate-600 text-sm font-medium">Loading</span>
                        <div className="flex gap-1">
                            <motion.span
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                                className="text-sky-400"
                            >
                                •
                            </motion.span>
                            <motion.span
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                className="text-sky-400"
                            >
                                •
                            </motion.span>
                            <motion.span
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                className="text-sky-400"
                            >
                                •
                            </motion.span>
                        </div>
                        <span className="text-sky-400 text-sm font-bold tabular-nums">
                            {Math.round(progress)}%
                        </span>
                    </motion.div>

                    {/* Loading tip */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="mt-8 text-slate-700 text-xs font-light max-w-md mx-auto"
                    >
                        Preparing your navigation experience...
                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default LoadingScreen;
