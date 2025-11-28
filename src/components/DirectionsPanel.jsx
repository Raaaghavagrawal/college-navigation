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
          ? 'fixed inset-x-0 bottom-0 z-20 flex flex-col justify-end pointer-events-none'
          : 'relative z-10 h-full'
      }
    >
      <AnimatePresence initial={false}>
        {(!isCollapsed || !isMobile) && (
          <motion.aside
            key="directions-panel"
            initial={isMobile ? { y: '100%' } : { width: 56 }}
            animate={
              isMobile
                ? { y: isCollapsed ? '100%' : 0, width: '100%' }
                : { width: isCollapsed ? 56 : 320, y: 0 }
            }
            exit={isMobile ? { y: '100%' } : { width: 56 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className={
              'pointer-events-auto overflow-hidden rounded-t-3xl md:rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/70 md:shadow-xl md:shadow-black/60' +
              ' ' +
              (isMobile ? 'mx-0 mb-3 max-h-[55vh] sm:max-h-[70vh]' : 'h-full')
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

                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 mt-1 scroll-smooth overscroll-contain" style={{
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgb(71 85 105) transparent'
                }}>
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
                    <div className="space-y-4 pt-2 overflow-y-auto scroll-smooth overscroll-contain" style={{
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgb(71 85 105) transparent'
                    }}>
                      {/* Main instruction */}
                      <div className="text-[11px] text-slate-400 leading-relaxed">
                        Choose a start and destination, then tap <span className="font-medium text-sky-400">Find route</span> to see turn-by-turn guidance.
                      </div>

                      {/* Quick Tips Section */}
                      <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-3 space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Quick Tips
                        </div>
                        <ul className="space-y-1.5 text-[11px] text-slate-300">
                          <li className="flex items-start gap-2">
                            <span className="text-sky-400 mt-0.5">•</span>
                            <span>Click on any location marker on the map to view details</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-sky-400 mt-0.5">•</span>
                            <span>Use the search box to quickly find buildings and facilities</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-sky-400 mt-0.5">•</span>
                            <span>Zoom and pan the map to explore the campus</span>
                          </li>
                        </ul>
                      </div>

                      {/* Popular Destinations */}
                      <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-3 space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Popular Destinations
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                          <div className="bg-slate-800/50 rounded-lg px-2 py-1.5 text-slate-300">Main Gate 1</div>
                          <div className="bg-slate-800/50 rounded-lg px-2 py-1.5 text-slate-300">AB1 Entry</div>
                          <div className="bg-slate-800/50 rounded-lg px-2 py-1.5 text-slate-300">Library</div>
                          <div className="bg-slate-800/50 rounded-lg px-2 py-1.5 text-slate-300">Mess & Gym</div>
                        </div>
                      </div>

                      {/* Keyboard Shortcuts */}
                      <div className="rounded-xl bg-slate-800/30 border border-slate-700/40 p-3 space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          Navigation
                        </div>
                        <div className="space-y-1 text-[10px] text-slate-400">
                          <div className="flex justify-between items-center">
                            <span>Zoom In/Out</span>
                            <span className="text-slate-500">Mouse Wheel</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Pan Map</span>
                            <span className="text-slate-500">Click & Drag</span>
                          </div>
                        </div>
                      </div>

                      {/* Campus Stats */}
                      <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300 mb-2 flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Campus Overview
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-lg font-bold text-emerald-400">35</div>
                            <div className="text-[9px] text-slate-400">Locations</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-sky-400">12</div>
                            <div className="text-[9px] text-slate-400">Buildings</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-purple-400">8</div>
                            <div className="text-[9px] text-slate-400">Facilities</div>
                          </div>
                        </div>
                      </div>
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
        )}
      </AnimatePresence>

      <div
        className={
          'pointer-events-auto absolute flex z-40 ' +
          (isMobile
            ? 'left-1/2 -translate-x-1/2 ' + (isCollapsed ? 'bottom-12' : 'bottom-full mb-2')
            : 'top-1/2 -left-3 items-center')
        }
      >
        <div className="relative">
          {!isCollapsed && isMobile && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce pointer-events-none">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-sky-500"></div>
              <div className="bg-sky-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap z-20">
                Click here
              </div>
            </div>
          )}
          <IconButton
            label={isCollapsed ? 'Expand directions panel' : 'Collapse directions panel'}
            className="h-7 w-7 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-lg shadow-black/60 relative z-10"
            onClick={onToggle}
          >
            {isCollapsed ? (
              <FiChevronLeft className={`text-sm ${isMobile ? 'rotate-90' : ''}`} />
            ) : (
              <FiChevronRight className={`text-sm ${isMobile ? 'rotate-90' : ''}`} />
            )}
          </IconButton>
        </div>
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
