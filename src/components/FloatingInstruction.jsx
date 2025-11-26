import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FiNavigation, FiArrowRight, FiArrowLeft, FiArrowUp } from 'react-icons/fi';

export function FloatingInstruction({ step, isVisible, isMobile }) {
  // Determine icon based on step type
  const getStepIcon = () => {
    if (!step) return FiNavigation;

    const title = step.title?.toLowerCase() || '';
    if (title.includes('right')) return FiArrowRight;
    if (title.includes('left')) return FiArrowLeft;
    if (title.includes('straight') || title.includes('continue')) return FiArrowUp;
    return FiNavigation;
  };

  const StepIcon = getStepIcon();

  return (
    <AnimatePresence>
      {step && isVisible && (
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className={
            'pointer-events-none fixed z-30 flex justify-center w-full px-3 ' +
            (isMobile ? 'bottom-28' : 'top-24')
          }
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="pointer-events-auto max-w-md rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-sky-500/50 shadow-2xl shadow-sky-500/40 px-4 py-3 flex items-center gap-3 floating-instruction-shadow backdrop-blur-xl"
          >
            {/* Animated Icon */}
            <motion.div
              animate={{
                rotate: step.title?.toLowerCase().includes('turn') ? [0, -10, 10, 0] : 0,
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6a11cb] to-[#2575fc] text-white shadow-lg shadow-indigo-500/50"
            >
              <StepIcon className="text-lg" />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-50 truncate mb-0.5">
                {step.title}
              </div>
              {step.distance > 0 && (
                <div className="flex items-center gap-2">
                  <div className="text-xs text-sky-400 font-medium">
                    ~{step.distance} m ahead
                  </div>
                  {/* Progress indicator */}
                  <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden max-w-[80px]">
                    <motion.div
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pulse indicator */}
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-sky-400"
              />
              <div className="relative w-2 h-2 rounded-full bg-sky-400 shadow-lg shadow-sky-400/50" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

FloatingInstruction.propTypes = {
  step: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    detail: PropTypes.string,
    distance: PropTypes.number,
  }),
  isVisible: PropTypes.bool,
  isMobile: PropTypes.bool,
};

export default FloatingInstruction;
