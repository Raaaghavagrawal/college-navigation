import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHelpCircle, FiX, FiMapPin, FiNavigation, FiZap, FiStar } from 'react-icons/fi';

export function HelpButton({ isOpen, onOpenChange }) {
    const [showHelp, setShowHelp] = useState(false);

    // Sync with external control if provided
    React.useEffect(() => {
        if (isOpen !== undefined) {
            setShowHelp(isOpen);
        }
    }, [isOpen]);

    const handleToggle = (newState) => {
        setShowHelp(newState);
        if (onOpenChange) {
            onOpenChange(newState);
        }
    };

    const tips = [
        {
            icon: FiMapPin,
            title: 'Select Locations',
            description: 'Choose your start and destination from the dropdown menus in the left sidebar.',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: FiNavigation,
            title: 'Find Route',
            description: 'Click "Find Route" to see the optimal path with turn-by-turn directions.',
            color: 'from-purple-500 to-pink-500',
        },
        {
            icon: FiZap,
            title: 'Quick Access',
            description: 'Use the "Explore" section for quick access to popular campus locations.',
            color: 'from-green-500 to-emerald-500',
        },
        {
            icon: FiStar,
            title: 'Live Animation',
            description: 'Watch the animated marker follow your route in real-time on the map.',
            color: 'from-orange-500 to-red-500',
        },
    ];

    return (
        <>
            {/* Help Button - Positioned on the left to avoid overlapping with Done button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleToggle(true)}
                className="fixed bottom-6 left-6 z-40 flex items-center justify-center gap-2 p-3 md:px-4 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all"
            >
                <FiHelpCircle className="text-xl md:text-lg" />
                <span className="hidden md:inline text-sm font-medium">Help</span>
            </motion.button>

            {/* Help Modal */}
            <AnimatePresence>
                {showHelp && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => handleToggle(false)}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                        >
                            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-50 mb-1">
                                            How to Use Bhhraman
                                        </h2>
                                        <p className="text-sm text-slate-400">
                                            Your guide to navigating GL Bajaj campus
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(false)}
                                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <FiX className="text-xl text-slate-400" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-4">
                                    {tips.map((tip, index) => (
                                        <motion.div
                                            key={tip.title}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex gap-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all"
                                        >
                                            <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${tip.color} rounded-xl flex items-center justify-center`}>
                                                <tip.icon className="text-white text-xl" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-slate-100 mb-1">
                                                    {tip.title}
                                                </h3>
                                                <p className="text-sm text-slate-400">
                                                    {tip.description}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Keyboard Shortcuts */}
                                    <div className="mt-6 p-4 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl border border-indigo-500/30">
                                        <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
                                            <FiZap className="text-indigo-400" />
                                            Keyboard Shortcuts
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600 text-slate-300">
                                                    Esc
                                                </kbd>
                                                <span className="text-slate-400">Close panels</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600 text-slate-300">
                                                    R
                                                </kbd>
                                                <span className="text-slate-400">Replay route</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600 text-slate-300">
                                                    C
                                                </kbd>
                                                <span className="text-slate-400">Clear route</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-600 text-slate-300">
                                                    ?
                                                </kbd>
                                                <span className="text-slate-400">Show help</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-slate-700/50 bg-slate-800/30">
                                    <p className="text-xs text-slate-500 text-center">
                                        Need more help? Contact the campus IT support team
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export default HelpButton;
