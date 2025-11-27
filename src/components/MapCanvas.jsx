import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { IconButton } from './UiComponents/Button.jsx';
import { FiMinus, FiPlus, FiTarget, FiPause, FiPlay } from 'react-icons/fi';
import MarkerAnimator from '../core/MarkerAnimator.js';

// Basic SVG size used for internal coordinate system
// Match the GLBITM campus map coordinate system from nodes/routes.
// Leaflet uses bounds [[0, 0], [IMG_H, IMG_W]] = [[0, 0], [1286, 1500]]
// This means lat (y) from 0-1286, lng (x) from 0-1500
// So SVG viewBox should be: x=0-1500, y=0-1286
const VIEWBOX_WIDTH = 1500;  // matches lng range (x-axis)
const VIEWBOX_HEIGHT = 1286; // matches lat range (y-axis)

export const MapCanvas = forwardRef(function MapCanvas(
  { backgroundUrl, route, edges, activeStepIndex, onSegmentChange, enableAnimation = true, onNavigationComplete },
  ref,
) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(null);

  // Image is rendered inside the SVG as a background so coordinates align with routes

  const [markerState, setMarkerState] = useState(null);
  const animatorRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Rebuild animator when route changes
  useEffect(() => {
    if (animatorRef.current) {
      animatorRef.current.destroy();
      animatorRef.current = null;
    }

    if (!route || !Array.isArray(route.points) || route.points.length < 2) {
      setMarkerState(null);
      setIsPlaying(false);
      return;
    }

    // Sanitize points before giving them to the animator so we never pass undefined/NaN
    const cleanPoints = route.points.filter(
      p => p && typeof p.x === 'number' && typeof p.y === 'number',
    );

    if (cleanPoints.length < 2) {
      setMarkerState(null);
      setIsPlaying(false);
      return;
    }

    animatorRef.current = new MarkerAnimator({
      points: cleanPoints,
      durationMs: 6000,
      onUpdate: payload => {
        setMarkerState(payload);
      },
      onComplete: () => {
        setIsPlaying(false);
        if (onNavigationComplete) {
          onNavigationComplete();
        }
      },
      onSegmentChange: index => {
        if (onSegmentChange) onSegmentChange(index);
      },
    });

    setIsPlaying(true);
    animatorRef.current.play();
  }, [route, onSegmentChange, onNavigationComplete]);

  useImperativeHandle(ref, () => ({
    replay() {
      if (!animatorRef.current) return;
      setIsPlaying(true);
      animatorRef.current.replay();
    },
    play() {
      if (!animatorRef.current) return;
      setIsPlaying(true);
      animatorRef.current.play();
    },
    pause() {
      if (!animatorRef.current) return;
      setIsPlaying(false);
      animatorRef.current.pause();
    },
    setSpeed(multiplier) {
      if (!animatorRef.current) return;
      animatorRef.current.setSpeed(multiplier);
    },
    recenter() {
      setOffset({ x: 0, y: 0 });
      setZoom(1);
    },
  }));

  // Pan handlers
  const handlePointerDown = e => {
    if (e.button !== 0) return;
    const { clientX, clientY } = e;
    panStartRef.current = { x: clientX, y: clientY, offsetX: offset.x, offsetY: offset.y };
    setIsPanning(true);
  };

  const handlePointerMove = e => {
    if (!isPanning || !panStartRef.current) return;
    const { clientX, clientY } = e;
    const dx = clientX - panStartRef.current.x;
    const dy = clientY - panStartRef.current.y;
    setOffset({ x: panStartRef.current.offsetX + dx, y: panStartRef.current.offsetY + dy });
  };

  const endPan = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };

  const fitMapToScreen = () => {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const scaleX = width / VIEWBOX_WIDTH;
    const scaleY = height / VIEWBOX_HEIGHT;
    // Fit entirely with 5% padding (0.95 factor)
    const fitZoom = Math.min(scaleX, scaleY) * 0.95;

    const scaledWidth = VIEWBOX_WIDTH * fitZoom;
    const scaledHeight = VIEWBOX_HEIGHT * fitZoom;

    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    setZoom(fitZoom);
    setOffset({ x: offsetX, y: offsetY });
  };

  // Initial fit and resize handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      fitMapToScreen();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const zoomBy = delta => {
    setZoom(prev => {
      // Allow zooming out more to ensure fit on small screens
      const next = Math.min(4.0, Math.max(0.1, prev + delta));
      return next;
    });
  };

  const recenter = () => {
    fitMapToScreen();
  };

  const markerNode = (markerState && enableAnimation) ? (
    <g transform={`translate(${markerState.x}, ${VIEWBOX_HEIGHT - markerState.y}) rotate(${-markerState.angleDeg || 0})`}>
      {/* Directional Arrow */}
      <path
        d="M -10 -10 L 14 0 L -10 10 L -6 0 Z"
        fill="#00f2fe"
        stroke="#ffffff"
        strokeWidth="1.5"
        style={{
          filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.9))'
        }}
      />
      {/* Inner glow center */}
      <circle cx="-2" cy="0" r="2" fill="white" />
    </g>
  ) : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <motion.div
        ref={containerRef}
        className="map-shell relative h-full w-full cursor-grab active:cursor-grabbing overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPan}
        onPointerLeave={endPan}
      >
        <motion.div
          className="absolute"
          style={{
            zIndex: 1,
            left: 0,
            top: 0,
            transformOrigin: '0 0',
          }}
          animate={{
            scale: zoom,
            x: offset.x,
            y: offset.y,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        >
          <svg
            width={VIEWBOX_WIDTH}
            height={VIEWBOX_HEIGHT}
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            style={{
              display: 'block',
              position: 'relative',
            }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Map background image rendered inside SVG so coordinates match */}
            <image
              href={backgroundUrl.replace(/ /g, '%20')}
              x={0}
              y={0}
              width={VIEWBOX_WIDTH}
              height={VIEWBOX_HEIGHT}
              preserveAspectRatio="xMidYMid meet"
            />

            {/* Base campus graph edges */}
            {edges && edges.length > 0 &&
              edges.map(edge => {
                const coords = edge?.geom?.geometry?.coordinates;
                if (!coords || !coords.length) return null;
                // Invert Y-axis to match Leaflet coordinate system
                const pts = coords.map(([x, y]) => `${x},${VIEWBOX_HEIGHT - y}`).join(' ');
                return (
                  <polyline
                    key={edge.id}
                    fill="none"
                    stroke="rgba(148,163,184,0.55)"
                    strokeWidth="4"
                    opacity={0.55}
                    points={pts}
                  />
                );
              })}

            {/* Active route overlay */}
            {route && Array.isArray(route.points) && route.points.length > 1 && (() => {
              // Filter out any invalid/undefined points so we never try to read .x of undefined
              const validPoints = route.points.filter(
                p => p && typeof p.x === 'number' && typeof p.y === 'number',
              );
              if (validPoints.length < 2) {
                return null;
              }

              // routes.json stores [x, y] pixel coordinates
              // Leaflet's Y-axis increases upward, SVG's Y-axis increases downward
              // So we invert Y: cy = VIEWBOX_HEIGHT - y
              const routePoints = validPoints.map(p => `${p.x},${VIEWBOX_HEIGHT - p.y}`).join(' ');
              return (
                <>
                  {/* Debug circles at each route vertex so it is VERY visible */}
                  {validPoints.map((p, i) => (
                    <circle
                      key={`debug-${i}`}
                      cx={p.x}
                      cy={VIEWBOX_HEIGHT - p.y}
                      r="10"
                      fill="none"
                      stroke="yellow"
                      strokeWidth="4"
                    />
                  ))}

                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6a11cb" />
                      <stop offset="50%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                  <polyline
                    className="route-path"
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="8"
                    opacity={1}
                    points={routePoints}
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.9))',
                      zIndex: 10,
                    }}
                  />
                  {/* Start marker */}
                  {validPoints[0] && (
                    <circle
                      cx={validPoints[0].x}
                      cy={VIEWBOX_HEIGHT - validPoints[0].y}
                      r="8"
                      fill="#e74c3c"
                      stroke="#fff"
                      strokeWidth="2"
                      style={{ zIndex: 11 }}
                    />
                  )}
                  {/* End marker */}
                  {validPoints[validPoints.length - 1] && (
                    <circle
                      cx={validPoints[validPoints.length - 1].x}
                      cy={VIEWBOX_HEIGHT - validPoints[validPoints.length - 1].y}
                      r="8"
                      fill="#22c55e"
                      stroke="#fff"
                      strokeWidth="2"
                      style={{ zIndex: 11 }}
                    />
                  )}
                </>
              );
            })()}

            {markerNode}
          </svg>
        </motion.div>
      </motion.div>

      {/* Map controls - Responsive positioning */}
      <div className="pointer-events-none absolute top-5 left-2 md:top-auto md:bottom-4 md:left-4 flex flex-col gap-1.5 md:gap-2 z-50">
        <div className="pointer-events-auto inline-flex flex-col rounded-xl md:rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg shadow-black/60">
          <IconButton label="Zoom in" onClick={() => zoomBy(0.2)} className="p-1.5 md:p-2">
            <FiPlus className="text-xs md:text-sm" />
          </IconButton>
          <IconButton label="Zoom out" onClick={() => zoomBy(-0.2)} className="p-1.5 md:p-2">
            <FiMinus className="text-xs md:text-sm" />
          </IconButton>
          <IconButton label="Recenter" onClick={recenter} className="p-1.5 md:p-2">
            <FiTarget className="text-xs md:text-sm" />
          </IconButton>
        </div>

        <div className="pointer-events-auto mt-1 md:mt-2 inline-flex items-center gap-1 rounded-xl md:rounded-2xl bg-slate-900/80 border border-slate-800/80 px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-[11px] text-slate-300">
          <IconButton
            label={isPlaying ? 'Pause route animation' : 'Play route animation'}
            onClick={() => {
              if (!animatorRef.current) return;
              if (isPlaying) {
                animatorRef.current.pause();
                setIsPlaying(false);
              } else {
                animatorRef.current.play();
                setIsPlaying(true);
              }
            }}
            className="h-6 w-6 md:h-7 md:w-7"
          >
            {isPlaying ? <FiPause className="text-[10px] md:text-xs" /> : <FiPlay className="text-[10px] md:text-xs" />}
          </IconButton>
          <span className="pr-0.5 md:pr-1">Route</span>
        </div>
      </div>
    </div>
  );
});

MapCanvas.propTypes = {
  backgroundUrl: PropTypes.string.isRequired,
  route: PropTypes.shape({
    points: PropTypes.arrayOf(
      PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
      }),
    ),
    length: PropTypes.number,
  }),
  edges: PropTypes.arrayOf(PropTypes.object),
  activeStepIndex: PropTypes.number,
  onSegmentChange: PropTypes.func,
  onNavigationComplete: PropTypes.func,
};

export default MapCanvas;
