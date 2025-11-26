import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiCheck } from 'react-icons/fi';

const EMOJIS = ['😶', '😞', '😐', '🙂', '😃', '🤩']; // 0 to 5

export function FeedbackModal({ isOpen, onClose, onSubmit }) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setRating(0);
            setComment('');
            setIsSubmitting(false);
            setIsSuccess(false);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);

        // Simulate a small delay for better UX (or wait for actual submit)
        await onSubmit(rating, comment);

        setIsSuccess(true);
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-sm relative overflow-hidden rounded-3xl bg-slate-900/95 border border-slate-700/50 shadow-2xl shadow-black/80 ring-1 ring-white/10"
                >
                    {/* Background Gradient Blob */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative p-6 text-center">
                        {isSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-10 flex flex-col items-center"
                            >
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 ring-1 ring-green-500/50">
                                    <FiCheck className="text-4xl text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                                <p className="text-slate-400">Your feedback helps us improve.</p>
                            </motion.div>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <motion.div
                                        key={hoveredRating || rating}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-6xl mb-3"
                                    >
                                        {EMOJIS[hoveredRating || rating]}
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-white">Rate your experience</h3>
                                    <p className="text-xs text-slate-400 mt-1">How was the navigation to your destination?</p>
                                </div>

                                <div className="flex justify-center gap-2 mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onMouseEnter={() => setHoveredRating(star)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            onClick={() => setRating(star)}
                                            className="group focus:outline-none transition-transform hover:scale-110 active:scale-95 p-1"
                                        >
                                            <FiStar
                                                className={`text-3xl transition-colors duration-200 ${star <= (hoveredRating || rating)
                                                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                                                        : 'text-slate-700 fill-slate-800/50'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Tell us more (optional)..."
                                    className="w-full h-24 bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none mb-6 transition-all"
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3 rounded-xl bg-slate-800/50 text-slate-400 font-medium hover:bg-slate-800 hover:text-slate-200 transition-colors"
                                    >
                                        Skip
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={rating === 0 || isSubmitting}
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                    >
                                        {isSubmitting ? 'Sending...' : 'Submit'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
