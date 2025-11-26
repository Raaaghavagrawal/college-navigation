import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCommand } from 'react-icons/fi';

export function KeyboardShortcutHint() {
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        // Check if user has seen the hint before
        const hasSeenHint = localStorage.getItem('bhhraman_keyboard_hint_seen');

        if (!hasSeenHint) {
            // Show hint after a short delay
            const timer = setTimeout(() => {
                setShowHint(true);
            }, 2000);

            // Auto-hide after 5 seconds
            const hideTimer = setTimeout(() => {
                setShowHint(false);
                localStorage.setItem('bhhraman_keyboard_hint_seen', 'true');
            }, 7000);

            return () => {
                clearTimeout(timer);
                clearTimeout(hideTimer);
            };
        }
    }, []);

    return (
        <AnimatePresence>
            {showHint && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                >
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-2xl shadow-indigo-500/50 flex items-center gap-3">
                        <FiCommand className="text-xl" />
                        <span className="text-sm font-medium">
                            Press <kbd className="px-2 py-1 bg-white/20 rounded mx-1">?</kbd> for keyboard shortcuts
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default KeyboardShortcutHint;
