import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, IconButton } from './UiComponents/Button.jsx';
import { FiChevronLeft, FiChevronRight, FiRotateCcw, FiCheckCircle } from 'react-icons/fi';

export function DirectionsPanel({
  isCollapsed,
  onToggle,
  steps,
  activeIndex,
  onStepClick,
  onReplay,
  onDone,
  isMobile,
}) {
  const hasSteps = steps && steps.length > 0;

  return (
    <div
      className={
        isMobile
          ? 'fixed inset-x-0 bottom-0 z-20 flex justify-center pointer-events-none'
          : 'relative z-10 h-full'
      }
    >
      <AnimatePresence initial={false}>
        <motion.aside
          key="directions-panel"
          initial={false}
          animate={{
            width: isCollapsed ? (isMobile ? 0 : 56) : isMobile ? '100%' : 320,
            opacity: isCollapsed && isMobile ? 0 : 1,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className={
            'pointer-events-auto overflow-hidden rounded-t-3xl md:rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/70 md:shadow-xl md:shadow-black/60' +
            ' ' +
            (isMobile ? 'mb-3 mx-3' : 'h-full')
          }
        >
          {!isCollapsed && (
            <div className="flex h-full flex-col p-3 md:p-4 pb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Directions
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {hasSteps ? 'Tap a step to focus that segment.' : 'Route instructions will appear here.'}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 mt-1">
                {hasSteps ? (
                  steps.map((step, index) => (
                    <motion.button
                      key={step.id}
                      type="button"
                      onClick={() => onStepClick(index)}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.09, duration: 0.4 }}
                      className={
                        'relative w-full text-left rounded-2xl border px-3 py-2.5 text-xs transition ' +
                        (index === activeIndex
                          ? 'border-sky-400/70 bg-sky-500/10 shadow shadow-sky-500/40'
                          : index < activeIndex
                            ? 'border-green-500/30 bg-green-500/5 opacity-80'
                            : 'border-slate-700/70 bg-slate-900/70 hover:bg-slate-800/80')
                      }
                    >
                      {/* Active Indicator Bar */}
                      {index === activeIndex && (
                        <motion.div
                          className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-sky-400 to-blue-500 rounded-full"
                          layoutId="activeBar"
                        />
                      )}

                      <div className="flex items-center gap-2">
                        {/* Status Icon/Number */}
                        <div className={
                          `flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold shadow-lg transition-colors duration-300 ` +
                          (index < activeIndex
                            ? 'bg-green-500 text-white shadow-green-500/40'
                            : index === activeIndex
                              ? 'bg-sky-500 text-white shadow-sky-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700')
                        }>
                          {index < activeIndex ? (
                            <FiCheckCircle className="text-xs" />
                          ) : (
                            index + 1
                          )}
                        </div>

                        <div className="flex-1">
                          <div className={`text-[11px] font-medium transition-colors ${index < activeIndex ? 'text-slate-400 line-through' : 'text-slate-50'}`}>
                            {step.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {step.detail}
                          </div>
                        </div>
                        {step.distance > 0 && (
                          <div className="text-[10px] text-slate-400 whitespace-nowrap pl-1">
                            ~{step.distance} m
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-500 pt-3">
                    Choose a start and destination, then tap <span className="font-medium text-slate-200">Find route</span> to see turn-by-turn guidance.
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2 mb-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={onReplay}
                  disabled={!hasSteps}
                >
                  <FiRotateCcw className="text-xs" />
                  <span>Replay route</span>
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  className="flex-1"
                  disabled={!hasSteps}
                  onClick={onDone}
                >
                  <FiCheckCircle className="text-xs" />
                  <span>Done</span>
                </Button>
              </div>
            </div>
          )}
        </motion.aside>
      </AnimatePresence>

      <div
        className={
          'pointer-events-auto absolute md:top-1/2 md:-left-3 flex ' +
          (isMobile ? '-top-3 left-6' : 'items-center')
        }
      >
        <IconButton
          label={isCollapsed ? 'Expand directions panel' : 'Collapse directions panel'}
          className="h-7 w-7 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-lg shadow-black/60"
          onClick={onToggle}
        >
          {isCollapsed ? (
            <FiChevronLeft className="text-sm" />
          ) : (
            <FiChevronRight className="text-sm" />
          )}
        </IconButton>
      </div>
    </div>
  );
}

DirectionsPanel.propTypes = {
  isCollapsed: PropTypes.bool,
  onToggle: PropTypes.func,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      detail: PropTypes.string,
      distance: PropTypes.number,
    }),
  ),
  activeIndex: PropTypes.number,
  onStepClick: PropTypes.func.isRequired,
  onReplay: PropTypes.func.isRequired,
  onDone: PropTypes.func,
  isMobile: PropTypes.bool,
};

export default DirectionsPanel;
