import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import TopBar from './components/TopBar.jsx';
import LeftSidebar from './components/LeftSidebar.jsx';
import MapCanvas from './components/MapCanvas.jsx';
import DirectionsPanel from './components/DirectionsPanel.jsx';
import FloatingInstruction from './components/FloatingInstruction.jsx';
import { FeedbackModal } from './components/FeedbackModal.jsx';
import { LoadingScreen } from './components/LoadingScreen.jsx';
import HelpButton from './components/HelpButton.jsx';
import { KeyboardShortcutHint } from './components/KeyboardShortcutHint.jsx';
import { generateDirections, PIXELS_TO_METERS } from './utils/pathfinding.js';
import { API_ENDPOINTS } from './config/api.js';

// Map image path - file is in public folder
// If you renamed the file to remove space, use: '/GLBITM_Map.jpg'
// Otherwise, keep the space and it will be URL encoded automatically
const MAP_IMAGE_PATH = '/GLBITM Map.jpg';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// Simple Dijkstra implementation over edges adjacency
function dijkstra(adj, start, goal) {
  const dist = {};
  const prev = {};
  const visited = new Set();
  const queue = [];

  Object.keys(adj).forEach(id => {
    dist[id] = Infinity;
    prev[id] = null;
  });

  dist[start] = 0;
  queue.push({ node: start, dist: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const { node: u } = queue.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === goal) break;

    (adj[u] || []).forEach(n => {
      const alt = dist[u] + n.weight;
      if (alt < dist[n.to]) {
        dist[n.to] = alt;
        prev[n.to] = u;
        queue.push({ node: n.to, dist: alt });
      }
    });
  }

  if (dist[goal] === undefined || dist[goal] === Infinity) return null;

  const path = [];
  let cur = goal;
  while (cur != null) {
    path.unshift(parseInt(cur));
    cur = prev[cur];
    if (cur === start) {
      path.unshift(parseInt(start));
      break;
    }
  }
  return { path, distance: dist[goal] };
}

function App() {
  const isMobile = useIsMobile();

  // Auth state (from original CampusNav)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Loading screen state
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bhhraman_user');
      if (stored) {
        const userData = JSON.parse(stored);
        if (userData && userData.email) {
          setIsLoggedIn(true);
          setLoginEmail(userData.email || '');
          setLoginPhone(userData.phone || '');
        } else {
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (e) {
      console.warn('Unable to read auth from localStorage', e);
      setIsLoggedIn(false);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  function handleLogout() {
    try {
      localStorage.removeItem('bhhraman_user');
    } catch (e) {
      console.warn('Unable to clear auth from localStorage', e);
    }
    setIsLoggedIn(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail) {
      setLoginError('Please enter your email.');
      return;
    }
    if (!loginPhone) {
      setLoginError('Please enter your phone number.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, phone: loginPhone, password: loginPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      try {
        localStorage.setItem('bhhraman_user', JSON.stringify({ email: loginEmail, phone: loginPhone }));
      } catch (err) {
        console.warn('Unable to persist auth to localStorage', err);
      }

      setIsLoggedIn(true);
    } catch (err) {
      setLoginError(err.message || 'Login failed, please try again.');
    } finally {
      setLoginLoading(false);
    }
  }

  // Map / routing state
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const [startId, setStartId] = useState(null);
  const [endId, setEndId] = useState(null);

  const [route, setRoute] = useState(null);
  const [directions, setDirections] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [hasReachedDestination, setHasReachedDestination] = useState(false);

  const mapRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [routesData, setRoutesData] = useState([]);

  // UI Modes
  const [sidebarMode, setSidebarMode] = useState('search'); // Default to search view
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Load campus graph data from public/data
  useEffect(() => {
    async function loadData() {
      try {
        const [nodesRes, edgesRes, routesRes] = await Promise.all([
          fetch('/data/nodes.json'),
          fetch('/data/edges.json'),
          fetch('/data/routes.json'),
        ]);

        if (!nodesRes.ok) {
          console.error('❌ Failed to load nodes.json:', nodesRes.status, nodesRes.statusText);
        }
        if (!edgesRes.ok) {
          console.error('❌ Failed to load edges.json:', edgesRes.status, edgesRes.statusText);
        }
        if (!routesRes.ok) {
          console.warn('⚠️ Failed to load routes.json (optional):', routesRes.status);
        }

        const [nodesJson, edgesJson, routesJson] = await Promise.all([
          nodesRes.ok ? nodesRes.json() : [],
          edgesRes.ok ? edgesRes.json() : [],
          routesRes.ok ? routesRes.json().catch(() => []) : [],
        ]);

        setNodes(nodesJson || []);
        setEdges(edgesJson || []);
        setRoutesData(routesJson || []);
      } catch (err) {
        console.error('❌ Failed to load campus data:', err);
        alert('Failed to load map data. Please check the browser console for details.');
      }
      // Note: Don't set isInitialLoading to false here - let LoadingScreen control its own timing
    }
    loadData();
  }, []);

  const placesById = useMemo(() => {
    const m = {};
    for (const p of nodes) m[p.id] = p;
    return m;
  }, [nodes]);

  const handleSelectPlace = (id) => {
    const place = placesById[id];
    if (place) {
      setSelectedPlace(place);
      setSidebarMode('details');
      // We could also center the map here if we exposed a ref method for it
    }
  };

  const typedPlaces = useMemo(
    () =>
      nodes.map(n => {
        const nameUpper = (n.name || '').toUpperCase();
        let type = 'block';
        if (nameUpper.includes('GATE')) type = 'gate';
        else if (nameUpper.includes('CANTEEN') || nameUpper.includes('MESS')) type = 'canteen';
        else if (nameUpper.includes('PARKING')) type = 'parking';
        return { ...n, type };
      }),
    [nodes],
  );

  const favorites = useMemo(
    () =>
      typedPlaces.filter(p => {
        const nameUpper = (p.name || '').toUpperCase();
        return (
          nameUpper.includes('GATE') ||
          nameUpper.includes('CANTEEN') ||
          nameUpper.includes('HOSTEL')
        );
      }),
    [typedPlaces],
  );

  const edgeMap = useMemo(() => {
    const m = {};
    edges.forEach(e => {
      m[`${e.source}-${e.target}`] = e;
      m[`${e.target}-${e.source}`] = e;
    });
    return m;
  }, [edges]);

  const adj = useMemo(() => {
    const a = {};
    edges.forEach(e => {
      if (!a[e.source]) a[e.source] = [];
      if (!a[e.target]) a[e.target] = [];
      // e.length in edges.json is already in pixels (editor calculates it from coordinates)
      a[e.source].push({ to: e.target, weight: e.length });
      a[e.target].push({ to: e.source, weight: e.length });
    });
    return a;
  }, [edges]);

  // Helper: compute total polyline length in pixels from [x,y] coordinates
  function polylinePixels(coords) {
    if (!coords || coords.length < 2) return 0;
    let len = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i];
      const [x2, y2] = coords[i + 1];
      len += Math.hypot(x2 - x1, y2 - y1);
    }
    return len;
  }

  const handleFindRoute = () => {
    if (!startId || !endId) {
      console.warn('⚠️ Please select both start and end locations');
      return;
    }
    if (!nodes.length) {
      console.error('❌ No nodes loaded. Cannot find route.');
      return;
    }

    // Ensure IDs are numbers for comparison with routes.json
    const sId = typeof startId === 'number' ? startId : parseInt(startId, 10);
    const eId = typeof endId === 'number' ? endId : parseInt(endId, 10);

    // Try to find a manually traced route first (from routes.json)
    let isReverse = false;
    const manual =
      routesData.find(r => {
        const routeStart = typeof r.start === 'number' ? r.start : parseInt(r.start, 10);
        const routeEnd = typeof r.end === 'number' ? r.end : parseInt(r.end, 10);

        if (routeStart === sId && routeEnd === eId) {
          isReverse = false;
          return true;
        }
        if (routeStart === eId && routeEnd === sId) {
          isReverse = true;
          return true;
        }
        return false;
      }) || null;

    const startNode = placesById[sId];
    const endNode = placesById[eId];

    let points = [];
    let length = 0;

    if (manual) {
      // Use manual route from routes.json
      let coords =
        manual.geom?.geometry?.coordinates?.length
          ? manual.geom.geometry.coordinates
          : manual.path || [];

      // Clone coords to avoid mutating the original data
      coords = [...coords];

      if (isReverse) {
        coords.reverse();
      }

      if (coords.length >= 2) {
        points = coords
          .filter(
            coord =>
              coord &&
              coord.length >= 2 &&
              typeof coord[0] === 'number' &&
              typeof coord[1] === 'number',
          )
          .map(([x, y], idx, arr) => ({
            x: Number(x),
            y: Number(y),
            placeId:
              idx === 0 ? startNode?.id : idx === arr.length - 1 ? endNode?.id : undefined,
          }));
        // Recompute length from coordinates in pixels to be precise
        length = polylinePixels(coords);
      }
    } else if (Object.keys(adj).length) {
      // Use Dijkstra over edges if no manual route
      const result = dijkstra(adj, String(sId), String(eId));
      if (result && result.path && result.path.length > 1) {
        const seq = [];
        for (let i = 0; i < result.path.length - 1; i++) {
          const from = result.path[i];
          const to = result.path[i + 1];
          const edge = edgeMap[`${from}-${to}`];
          if (edge && edge.geom && edge.geom.geometry && edge.geom.geometry.coordinates) {
            const coords = edge.geom.geometry.coordinates;
            if (!seq.length) {
              seq.push(...coords);
            } else {
              // avoid duplicating join point
              seq.push(...coords.slice(1));
            }
          } else {
            const fn = placesById[from];
            const tn = placesById[to];
            if (fn && tn) {
              seq.push([fn.x, fn.y], [tn.x, tn.y]);
            }
          }
        }
        if (seq.length >= 2) {
          points = seq
            .filter(
              coord =>
                coord &&
                coord.length >= 2 &&
                typeof coord[0] === 'number' &&
                typeof coord[1] === 'number',
            )
            .map(([x, y], idx, arr) => ({
              x: Number(x),
              y: Number(y),
              placeId:
                idx === 0 ? startNode?.id : idx === arr.length - 1 ? endNode?.id : undefined,
            }));
          length = result.distance ?? 0;
        }
      }
    }

    // Fallback to straight line between nodes if nothing else
    if (!points.length && startNode && endNode) {
      points = [
        { x: startNode.x, y: startNode.y, placeId: startNode.id },
        { x: endNode.x, y: endNode.y, placeId: endNode.id },
      ];
      length = Math.hypot(endNode.x - startNode.x, endNode.y - startNode.y);
    }

    if (points.length < 2) {
      console.error('❌ Route computation failed: insufficient points');
      alert('Could not find a route between the selected locations. Please try different locations.');
      return;
    }

    const newRoute = { points, length };
    setRoute(newRoute);
    const steps = generateDirections(newRoute, placesById);
    setDirections(steps);
    setActiveStepIndex(0);
  };

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'escape':
          // Close panels
          if (rightCollapsed === false) {
            setRightCollapsed(true);
          }
          if (showHelpModal) {
            setShowHelpModal(false);
          }
          if (showFeedbackModal) {
            setShowFeedbackModal(false);
          }
          break;

        case 'r':
          // Replay route
          if (route && mapRef.current?.replay) {
            mapRef.current.replay();
          }
          break;

        case 'c':
          // Clear route
          if (route) {
            handleClearRoute();
          }
          break;

        case '?':
          // Show help
          setShowHelpModal(true);
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [route, rightCollapsed, showHelpModal, showFeedbackModal]);

  const handleFeedbackSubmit = async (rating, comment) => {
    let email = loginEmail;
    if (!email) {
      try {
        const stored = JSON.parse(localStorage.getItem('bhhraman_user'));
        email = stored?.email;
      } catch (e) { }
    }

    if (!email) email = 'guest@example.com';

    try {
      await fetch(API_ENDPOINTS.FEEDBACK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, rating, comment }),
      });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleClearRoute = () => {
    setRoute(null);
    setDirections([]);
    setActiveStepIndex(0);
    setHasReachedDestination(false);
    setSidebarMode('search'); // Return to search view
    setSelectedPlace(null); // Clear selected place
    setShowFeedbackModal(true);
  };

  const handleSegmentChange = React.useCallback(originalIndex => {
    if (originalIndex == null || Number.isNaN(originalIndex)) return;

    // Find the step that covers this segment
    // A step starts at step.startIndex.
    // We are at originalIndex.
    // The active step is the last one with startIndex <= originalIndex.

    let activeIndex = 0;
    for (let i = 0; i < directions.length; i++) {
      if (directions[i].startIndex <= originalIndex) {
        activeIndex = i;
      } else {
        break;
      }
    }

    setActiveStepIndex(activeIndex);
  }, [directions]);

  const handleNavigationComplete = React.useCallback(() => {
    setHasReachedDestination(true);
    // On mobile, automatically switch to "reached" view
    if (isMobile) {
      setSidebarMode('reached');
      setLeftCollapsed(false); // Ensure sidebar is visible
    }
  }, [isMobile]);

  const handleReplayRoute = React.useCallback(() => {
    setHasReachedDestination(false); // Reset reached state
    mapRef.current?.replay?.();
  }, []);

  const activeStep =
    directions && directions.length && activeStepIndex < directions.length
      ? directions[activeStepIndex]
      : null;

  // --- RENDER ---
  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <TopBar
        onCenterOnUser={() => mapRef.current?.recenter?.()}
        onLogout={handleLogout}
        userEmail={loginEmail}
        userPhone={loginPhone}
      />

      {/* Login overlay on top of everything when not logged in */}
      {!checkingAuth && !isLoggedIn && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/90">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl shadow-black/70 p-5">
            <h2 className="text-lg font-semibold text-slate-50 mb-1">Welcome to Bhhraman</h2>
            <p className="text-xs text-slate-400 mb-3">Sign in with your email to continue.</p>
            <form onSubmit={handleLogin} className="space-y-2">
              <label className="text-xs text-slate-200 flex flex-col gap-1">
                Email ID
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label className="text-xs text-slate-200 flex flex-col gap-1">
                Phone number
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)}
                  className="rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="Your phone number"
                  required
                />
              </label>
              <label className="text-xs text-slate-200 flex flex-col gap-1">
                Password
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="Enter your password (optional)"
                />
              </label>
              {loginError && (
                <div className="text-xs text-rose-300 mt-1">{loginError}</div>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#6a11cb] to-[#2575fc] px-4 py-2 text-xs font-medium text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-60"
              >
                {loginLoading ? 'Signing in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main layout (map + sidebars) */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 flex">
          {/* Left sidebar */}
          <div className="relative z-20 flex-shrink-0 flex items-stretch">
            <LeftSidebar
              isCollapsed={leftCollapsed}
              onToggle={() => setLeftCollapsed(v => !v)}
              places={typedPlaces}
              favorites={favorites}
              startId={startId}
              endId={endId}
              onStartChange={setStartId}
              onEndChange={setEndId}
              onFindRoute={handleFindRoute}
              onClearRoute={handleClearRoute}
              onReload={() => {
                // data auto-reloads on mount
              }}
              onReplayRoute={handleReplayRoute}
              isMobile={isMobile}
              mode={sidebarMode}
              selectedPlace={selectedPlace}
              onModeChange={setSidebarMode}
              onSelectPlace={handleSelectPlace}
            />
          </div>

          {/* Map center */}
          <div className="relative flex-1">
            <MapCanvas
              ref={mapRef}
              backgroundUrl={MAP_IMAGE_PATH}
              route={route}
              edges={edges}
              activeStepIndex={activeStepIndex}
              onSegmentChange={handleSegmentChange}
              onNavigationComplete={handleNavigationComplete}
              enableAnimation={true}
            />
          </div>

          {/* Right directions panel */}
          <div className="relative z-20 flex-shrink-0 flex items-stretch">
            <DirectionsPanel
              isCollapsed={rightCollapsed}
              onToggle={() => setRightCollapsed(v => !v)}
              steps={directions}
              activeIndex={activeStepIndex}
              onStepClick={index => setActiveStepIndex(index)}
              onReplay={() => mapRef.current?.replay?.()}
              onDone={handleClearRoute}
              isMobile={isMobile}
            />
          </div>
        </div>

        <FloatingInstruction
          step={activeStep}
          isVisible={!!route && !hasReachedDestination}
          isMobile={isMobile}
        />
      </div>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
      />

      <LoadingScreen
        isLoading={isInitialLoading}
        onComplete={() => setIsInitialLoading(false)}
      />

      {/* Help Button */}
      <HelpButton
        isOpen={showHelpModal}
        onOpenChange={setShowHelpModal}
      />

      {/* Keyboard Shortcut Hint */}
      <KeyboardShortcutHint />
    </div>
  );
}

export default App;
