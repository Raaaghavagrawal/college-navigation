import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CampusNav.css';

const IMG_W = 1500;
const IMG_H = 1286;

function CampusNav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Check existing login from localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bhhraman_user');
      if (stored) {
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.warn('Unable to read auth from localStorage', e);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    // Track when the loading screen became visible so we can keep it on-screen briefly
    let loadingStartTime = Date.now();

    function showLoadingScreen() {
      const loadingScreen = document.getElementById('loadingScreen');
      if (loadingScreen) {
        loadingScreen.classList.remove('hide');
      }
      loadingStartTime = Date.now();
    }

    // Create particles for loading screen
    function createParticles() {
      const loadingScreen = document.getElementById('loadingScreen');
      if (!loadingScreen) return;
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        particle.style.setProperty('--x', x + 'px');
        particle.style.setProperty('--y', y + 'px');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        loadingScreen.appendChild(particle);
      }
    }

    // Make sure the loading screen is visible as soon as the component mounts
    showLoadingScreen();
    createParticles();

    function hideLoadingScreen(minVisibleMs = 2000) {
      const loadingScreen = document.getElementById('loadingScreen');
      if (!loadingScreen) return;
      const elapsed = Date.now() - loadingStartTime;
      const remaining = minVisibleMs - elapsed;
      if (remaining > 0) {
        setTimeout(() => {
          loadingScreen.classList.add('hide');
        }, remaining);
      } else {
        loadingScreen.classList.add('hide');
      }
    }

    // Initialize map
    const map = L.map('map', { crs: L.CRS.Simple, minZoom: -2, maxZoom: 2 });
    const bounds = [[0, 0], [IMG_H, IMG_W]];
    L.imageOverlay('/GLBITM Map.jpg', bounds).addTo(map);
    map.fitBounds(bounds);

    map.getContainer().style.filter = 'brightness(0.9) contrast(1.1)';

    let nodes = [];
    let edges = [];
    let routes = [];
    let nodeMap = {};
    let edgeMap = {};
    let routeMap = {};
    let routeLayer = null;
    let startMarker = null;
    let endMarker = null;
    let arrowMarker = null;
    let arrowAnimation = null;

    // Navigation UI state
    let currentRouteCoords = [];
    let currentDirections = [];
    let selectedRating = 0;

    function pointToLatLng(pt) {
      return [pt[1], pt[0]];
    }

    function updateStatus(msg, type = 'success') {
      const status = document.getElementById('status');
      if (!status) return;
      const icon = status.querySelector('i');
      const text = status.querySelector('span');

      status.className = `status ${type}`;

      if (icon) {
        if (type === 'loading') {
          icon.className = 'fas fa-spinner fa-spin';
        } else if (type === 'success') {
          icon.className = 'fas fa-check-circle';
        } else {
          icon.className = 'fas fa-exclamation-circle';
        }
      }

      if (text) {
        text.textContent = msg;
      }
    }

    async function loadAllData() {
      updateStatus('Loading campus data...', 'loading');
      const findBtnEl = document.getElementById('findBtn');
      if (findBtnEl) findBtnEl.disabled = true;
      try {
        const nodesRes = await fetch('/data/nodes.json');
        if (!nodesRes.ok) throw new Error('Failed to load nodes.json');
        nodes = await nodesRes.json();

        try {
          const edgesRes = await fetch('/data/edges.json');
          edges = edgesRes.ok ? await edgesRes.json() : [];
        } catch (e) {
          edges = [];
          console.warn('No edges.json:', e);
        }

        try {
          const routesRes = await fetch('/data/routes.json');
          routes = routesRes.ok ? await routesRes.json() : [];
          routeMap = {};
          routes.forEach(route => {
            routeMap[`${route.start}-${route.end}`] = route;
            routeMap[`${route.end}-${route.start}`] = route;
          });
        } catch (e) {
          routes = [];
          routeMap = {};
          console.warn('No routes.json:', e);
        }

        nodeMap = {};
        nodes.forEach(n => {
          nodeMap[n.id] = n;
        });

        edgeMap = {};
        edges.forEach(e => {
          edgeMap[`${e.source}-${e.target}`] = e;
          edgeMap[`${e.target}-${e.source}`] = e;
        });

        const startSelect = document.getElementById('start');
        const endSelect = document.getElementById('end');

        // Extra safety: if selects are missing for any reason, just skip populating them
        if (!startSelect || !endSelect) {
          console.warn('Start or end <select> element not found when loading data');
        } else {
          let optionsHtml = '<option value="">📍 Select start point...</option>';
          nodes.forEach(n => {
            if (!n) return;
            optionsHtml += `<option value="${n.id}">${n.name}</option>`;
          });

          startSelect.innerHTML = optionsHtml;
          endSelect.innerHTML = optionsHtml.replace('📍 Select start point...', '🎯 Select destination...');
        }

        nodes.forEach(n => {
          L.circle(pointToLatLng([n.x, n.y]), {
            radius: 7,
            color: '#667eea',
            fillColor: '#1a1f3a',
            fillOpacity: 1,
            weight: 3,
          })
            .addTo(map)
            .bindTooltip(n.name, {
              className: 'custom-tooltip',
              permanent: false,
              direction: 'top',
              offset: [0, -10],
            });
        });

        edges.forEach(e => {
          if (e.geom && e.geom.geometry) {
            const coords = e.geom.geometry.coordinates.map(pt => pointToLatLng(pt));
            L.polyline(coords, {
              color: '#4a5568',
              weight: 3,
              opacity: 0.4,
            }).addTo(map);
          }
        });

        updateStatus(`✓ Loaded: ${nodes.length} locations, ${edges.length} paths, ${routes.length} routes`, 'success');
        if (findBtnEl) findBtnEl.disabled = false;
        hideLoadingScreen();
      } catch (error) {
        console.error('Error:', error);
        updateStatus('✗ Error: ' + error.message, 'error');
        if (findBtnEl) findBtnEl.disabled = true;
        hideLoadingScreen();
        setTimeout(() => {
          alert(
            'Error loading data: ' +
            error.message +
            '\n\nMake sure you are using a local server (http://localhost:5173)',
          );
        }, 500);
      }
    }

    function clearRoute() {
      if (routeLayer) map.removeLayer(routeLayer);
      if (startMarker) map.removeLayer(startMarker);
      if (endMarker) map.removeLayer(endMarker);
      if (arrowMarker) map.removeLayer(arrowMarker);
      if (arrowAnimation) {
        cancelAnimationFrame(arrowAnimation);
        arrowAnimation = null;
      }
      routeLayer = null;
      startMarker = null;
      endMarker = null;
      arrowMarker = null;
      const routeInfo = document.getElementById('routeInfo');
      const startSelect = document.getElementById('start');
      const endSelect = document.getElementById('end');
      if (routeInfo) routeInfo.classList.remove('show');
      if (startSelect) startSelect.value = '';
      if (endSelect) endSelect.value = '';
    }

    function calculateAngle(fromLatLng, toLatLng) {
      const fromPoint = map.latLngToContainerPoint(fromLatLng);
      const toPoint = map.latLngToContainerPoint(toLatLng);
      const dx = toPoint.x - fromPoint.x;
      const dy = toPoint.y - fromPoint.y;
      return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    }

    function createArrowIcon(angle) {
      return L.divIcon({
        className: 'arrow-marker',
        html: `
          <div style="transform: rotate(${angle}deg); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="
              width: 0; 
              height: 0; 
              border-left: 7px solid transparent;
              border-right: 7px solid transparent;
              border-bottom: 18px solid #00f2fe;
              filter: drop-shadow(0 0 10px rgba(0, 242, 254, 0.8));
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    }

    function animateArrowAlongPath(pathCoords, duration = 6000) {
      if (!pathCoords || pathCoords.length < 2) return;

      if (arrowMarker) {
        map.removeLayer(arrowMarker);
      }
      if (arrowAnimation) {
        cancelAnimationFrame(arrowAnimation);
      }

      // Calculate total length and segment lengths to ensure constant speed
      const segments = [];

      for (let i = 0; i < pathCoords.length - 1; i++) {
        const start = pathCoords[i];
        const end = pathCoords[i + 1];
        // Calculate distance in coordinate space (which maps to pixels in CRS.Simple)
        const dist = Math.hypot(end[1] - start[1], end[0] - start[0]);
        segments.push({
          start: start,
          end: end,
          dist: dist
        });
      }

      // Interpolate points with constant density (e.g., every 5 units)
      const interpolatedPath = [];
      const stepSize = 5;

      segments.forEach(seg => {
        const steps = Math.max(1, Math.floor(seg.dist / stepSize));
        for (let j = 0; j < steps; j++) {
          const t = j / steps;
          const lat = seg.start[0] + (seg.end[0] - seg.start[0]) * t;
          const lng = seg.start[1] + (seg.end[1] - seg.start[1]) * t;
          interpolatedPath.push([lat, lng]);
        }
      });
      interpolatedPath.push(pathCoords[pathCoords.length - 1]);

      const totalPoints = interpolatedPath.length;
      const startTime = Date.now();

      const startPoint = interpolatedPath[0];
      const nextPoint = interpolatedPath[1] || interpolatedPath[0];
      let initialAngle = 0;
      try {
        initialAngle = calculateAngle(startPoint, nextPoint);
      } catch (e) {
        initialAngle = 0;
      }

      arrowMarker = L.marker(startPoint, {
        icon: createArrowIcon(initialAngle),
        zIndexOffset: 2000,
        interactive: false,
      }).addTo(map);

      function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          const lastPoint = interpolatedPath[totalPoints - 1];
          const secondLastPoint = interpolatedPath[totalPoints - 2] || lastPoint;
          let finalAngle = 0;
          try {
            finalAngle = calculateAngle(secondLastPoint, lastPoint);
          } catch (e) {
            finalAngle = 0;
          }
          arrowMarker.setLatLng(lastPoint);
          arrowMarker.setIcon(createArrowIcon(finalAngle));
          arrowAnimation = null;
          return;
        }

        const currentIndex = Math.floor(progress * (totalPoints - 1));
        const segmentProgress = progress * (totalPoints - 1) - currentIndex;

        const currentPoint = interpolatedPath[currentIndex];
        const nextPoint2 = interpolatedPath[Math.min(currentIndex + 1, totalPoints - 1)];

        const currentLat = currentPoint[0] + (nextPoint2[0] - currentPoint[0]) * segmentProgress;
        const currentLng = currentPoint[1] + (nextPoint2[1] - currentPoint[1]) * segmentProgress;
        const currentPosition = [currentLat, currentLng];

        let angle = 0;
        try {
          angle = calculateAngle(currentPosition, nextPoint2);
        } catch (e) {
          angle = 0;
        }

        arrowMarker.setLatLng(currentPosition);
        arrowMarker.setIcon(createArrowIcon(angle));

        arrowAnimation = requestAnimationFrame(animate);
      }

      arrowAnimation = requestAnimationFrame(animate);
    }

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function buildDirectionsFromRoute(routeCoords, options = {}) {
      const { startName = 'Start', endName = 'Destination' } = options;
      if (!routeCoords || routeCoords.length < 2) {
        return { steps: [], totalMeters: 0, startName, endName };
      }

      const points = routeCoords.map(([lat, lng]) => ({ x: lng, y: lat }));
      const steps = [];

      const segmentPixels = (a, b) => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return Math.hypot(dx, dy);
      };

      let totalPixels = 0;
      let pixelsSinceLastTurn = 0;

      steps.push({
        kind: 'start',
        text: `Start at ${startName}.`,
        distanceMeters: 0,
      });

      for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];

        const segPixels = segmentPixels(prev, curr);
        pixelsSinceLastTurn += segPixels;

        const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
        const v2 = { x: next.x - curr.x, y: next.y - curr.y };
        const mag1 = Math.hypot(v1.x, v1.y);
        const mag2 = Math.hypot(v2.x, v2.y);
        if (!mag1 || !mag2) continue;

        const dot = v1.x * v2.x + v1.y * v2.y;
        const cos = clamp(dot / (mag1 * mag2), -1, 1);
        const angleDeg = (Math.acos(cos) * 180) / Math.PI;

        if (angleDeg > 35) {
          const cross = v1.x * v2.y - v1.y * v2.x;
          const dir = cross > 0 ? 'left' : 'right';
          const meters = Number((pixelsSinceLastTurn * 0.5).toFixed(0));
          totalPixels += pixelsSinceLastTurn;
          pixelsSinceLastTurn = 0;

          if (meters > 0) {
            steps.push({
              kind: 'turn',
              text: `In ${meters} m, turn ${dir}.`,
              distanceMeters: meters,
            });
          } else {
            steps.push({
              kind: 'turn',
              text: `Turn ${dir}.`,
              distanceMeters: 0,
            });
          }
        }
      }

      if (points.length >= 2) {
        const lastSeg = segmentPixels(points[points.length - 2], points[points.length - 1]);
        pixelsSinceLastTurn += lastSeg;
      }

      totalPixels += pixelsSinceLastTurn;
      const remainingMeters = Number((pixelsSinceLastTurn * 0.5).toFixed(0));
      if (remainingMeters > 0) {
        steps.push({
          kind: 'straight',
          text: `Continue for about ${remainingMeters} m to reach your destination.`,
          distanceMeters: remainingMeters,
        });
      }

      steps.push({
        kind: 'end',
        text: `You have reached ${endName}.`,
        distanceMeters: 0,
      });

      const totalMeters = Number((totalPixels * 0.5).toFixed(1));
      return { steps, totalMeters, startName, endName };
    }

    function renderDirectionsModal(directionsData) {
      const list = document.getElementById('directionsList');
      const summary = document.getElementById('directionsSummary');
      if (!list || !summary || !directionsData) return;

      list.innerHTML = '';
      const { steps, totalMeters, startName, endName } = directionsData;

      if (!steps || !steps.length) {
        summary.textContent = 'Smart directions will appear here once you generate a route.';
        return;
      }

      summary.textContent = `Route from ${startName} to ${endName} 																														\u2022 																															\u2248 ${totalMeters} m`;

      steps.forEach((step, index) => {
        const li = document.createElement('li');
        li.className = 'directions-step';

        const indexBadge = document.createElement('div');
        indexBadge.className = 'step-index';
        indexBadge.textContent = index + 1;

        const content = document.createElement('div');
        content.className = 'step-content';

        const main = document.createElement('div');
        main.className = 'step-main';
        main.textContent = step.text;

        const meta = document.createElement('div');
        meta.className = 'step-meta';
        if (step.kind === 'start') {
          meta.textContent = 'Starting point';
        } else if (step.kind === 'end') {
          meta.textContent = 'Destination';
        } else if (step.distanceMeters) {
          meta.textContent = `~${step.distanceMeters} m`;
        }

        content.appendChild(main);
        if (meta.textContent) {
          content.appendChild(meta);
        }

        li.appendChild(indexBadge);
        li.appendChild(content);
        list.appendChild(li);
      });

      // Add a small tick/slide-in animation for the left directions bar
      const items = list.querySelectorAll('.directions-step');
      items.forEach((item, index) => {
        item.style.setProperty('--appear-delay', `${index * 90}ms`);
        item.classList.add('directions-step--animated');
      });
    }

    function openModal(id) {
      const modal = document.getElementById(id);
      if (!modal) return;
      modal.classList.add('show');
    }

    function closeModal(id) {
      const modal = document.getElementById(id);
      if (!modal) return;
      modal.classList.remove('show');
    }

    function buildAdj() {
      const adj = {};
      edges.forEach(e => {
        if (!adj[e.source]) adj[e.source] = [];
        if (!adj[e.target]) adj[e.target] = [];
        adj[e.source].push({ to: e.target, weight: e.length });
        adj[e.target].push({ to: e.source, weight: e.length });
      });
      return adj;
    }

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

      if (dist[goal] === Infinity) return null;

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

    function drawRoute(path) {
      clearRoute();

      const routeCoords = [];
      for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];
        const edge = edgeMap[`${from}-${to}`];
        if (edge && edge.geom && edge.geom.geometry) {
          const coords = edge.geom.geometry.coordinates.map(pt => pointToLatLng(pt));
          routeCoords.push(...coords);
        } else {
          const fromNode = nodeMap[from];
          const toNode = nodeMap[to];
          if (fromNode && toNode) {
            routeCoords.push(pointToLatLng([fromNode.x, fromNode.y]));
            routeCoords.push(pointToLatLng([toNode.x, toNode.y]));
          }
        }
      }

      if (routeCoords.length > 0) {
        routeLayer = L.polyline(routeCoords, {
          color: '#667eea',
          weight: 8,
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);

        const rbounds = L.latLngBounds(routeCoords);
        map.fitBounds(rbounds, { padding: [50, 50] });

        setTimeout(() => {
          animateArrowAlongPath(routeCoords, 6000);
        }, 500);
      }

      const startNode = nodeMap[path[0]];
      const endNode = nodeMap[path[path.length - 1]];

      if (startNode) {
        startMarker = L.circleMarker(pointToLatLng([startNode.x, startNode.y]), {
          radius: 14,
          color: '#f5576c',
          fillColor: '#f5576c',
          fillOpacity: 1,
          weight: 4,
        })
          .addTo(map)
          .bindTooltip('🚩 START: ' + startNode.name, {
            permanent: true,
            className: 'custom-tooltip',
            direction: 'top',
          });
      }

      if (endNode) {
        endMarker = L.circleMarker(pointToLatLng([endNode.x, endNode.y]), {
          radius: 14,
          color: '#00f2fe',
          fillColor: '#00f2fe',
          fillOpacity: 1,
          weight: 4,
        })
          .addTo(map)
          .bindTooltip('🏁 END: ' + endNode.name, {
            permanent: true,
            className: 'custom-tooltip',
            direction: 'top',
          });
      }

      currentRouteCoords = routeCoords;
      const directionsData = buildDirectionsFromRoute(routeCoords, {
        startName: startNode ? startNode.name : 'Start',
        endName: endNode ? endNode.name : 'Destination',
      });
      currentDirections = directionsData.steps;
      renderDirectionsModal(directionsData);
      openModal('directionsModal');
    }

    function drawManualRoute(route, startId, endId) {
      clearRoute();

      if (!route || !route.path) {
        alert('Invalid route data');
        return;
      }

      const routeCoords = route.path.map(pt => pointToLatLng(pt));
      routeLayer = L.polyline(routeCoords, {
        color: '#667eea',
        weight: 8,
        opacity: 0.95,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);

      const startNode = nodeMap[startId];
      const endNode = nodeMap[endId];

      if (startNode) {
        startMarker = L.circleMarker(pointToLatLng([startNode.x, startNode.y]), {
          radius: 14,
          color: '#f5576c',
          fillColor: '#f5576c',
          fillOpacity: 1,
          weight: 4,
        })
          .addTo(map)
          .bindTooltip('🚩 START: ' + startNode.name, {
            permanent: true,
            className: 'custom-tooltip',
            direction: 'top',
          });
      }

      if (endNode) {
        endMarker = L.circleMarker(pointToLatLng([endNode.x, endNode.y]), {
          radius: 14,
          color: '#00f2fe',
          fillColor: '#00f2fe',
          fillOpacity: 1,
          weight: 4,
        })
          .addTo(map)
          .bindTooltip('🏁 END: ' + endNode.name, {
            permanent: true,
            className: 'custom-tooltip',
            direction: 'top',
          });
      }

      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50] });

      setTimeout(() => {
        animateArrowAlongPath(routeCoords, 6000);
      }, 500);

      currentRouteCoords = routeCoords;
      const directionsData = buildDirectionsFromRoute(routeCoords, {
        startName: startNode ? startNode.name : 'Start',
        endName: endNode ? endNode.name : 'Destination',
      });
      currentDirections = directionsData.steps;
      renderDirectionsModal(directionsData);
      openModal('directionsModal');
    }

    const findBtn = document.getElementById('findBtn');
    if (findBtn) {
      findBtn.addEventListener('click', () => {
        const startId = parseInt(document.getElementById('start')?.value || '0', 10);
        const endId = parseInt(document.getElementById('end')?.value || '0', 10);

        if (!startId || !endId) {
          updateStatus('Please select both start and end locations', 'error');
          setTimeout(() => updateStatus(`✓ Ready: ${nodes.length} locations available`, 'success'), 2000);
          return;
        }

        if (startId === endId) {
          updateStatus('Start and end cannot be the same', 'error');
          setTimeout(() => updateStatus(`✓ Ready: ${nodes.length} locations available`, 'success'), 2000);
          return;
        }

        updateStatus('Finding route...', 'loading');

        const routeKey = `${startId}-${endId}`;
        const manualRoute = routeMap[routeKey];

        if (manualRoute) {
          drawManualRoute(manualRoute, startId, endId);
          const distanceInMeters = (manualRoute.length * 0.5).toFixed(1);
          const distanceSpan = document.querySelector('#distance span');
          const pathInfoSpan = document.querySelector('#pathInfo span');
          if (distanceSpan) {
            distanceSpan.textContent = `${manualRoute.length.toFixed(1)} pixels (~${distanceInMeters} m)`;
          }
          if (pathInfoSpan) {
            pathInfoSpan.textContent = `Manually traced route • ${manualRoute.path.length} waypoints`;
          }
          const routeInfo = document.getElementById('routeInfo');
          if (routeInfo) routeInfo.classList.add('show');
          updateStatus('✓ Route found!', 'success');
        } else {
          const adj = buildAdj();
          const result = dijkstra(adj, startId, endId);

          if (!result) {
            updateStatus('No route found. Create a manual route or check connections.', 'error');
            setTimeout(() => updateStatus(`✓ Ready: ${nodes.length} locations available`, 'success'), 3000);
            return;
          }

          drawRoute(result.path);

          let totalDist = 0;
          for (let i = 0; i < result.path.length - 1; i++) {
            const edge = edgeMap[`${result.path[i]}-${result.path[i + 1]}`];
            if (edge) totalDist += edge.length;
          }

          const distanceInMeters = (totalDist * 0.5).toFixed(1);
          const distanceSpan = document.querySelector('#distance span');
          const pathInfoSpan = document.querySelector('#pathInfo span');
          if (distanceSpan) {
            distanceSpan.textContent = `${totalDist.toFixed(1)} pixels (~${distanceInMeters} m)`;
          }
          if (pathInfoSpan) {
            pathInfoSpan.textContent = `Calculated route • ${result.path.length} waypoints`;
          }
          const routeInfo = document.getElementById('routeInfo');
          if (routeInfo) routeInfo.classList.add('show');
          updateStatus('✓ Route calculated!', 'success');
        }
      });
    }

    const reloadBtn = document.getElementById('reloadBtn');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        loadAllData();
      });
    }

    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        clearRoute();
      });
    }

    const skipBtn = document.getElementById('skipIntro');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        hideLoadingScreen();
      });
    }

    // Directions modal controls
    const replayBtn = document.getElementById('replayBtn');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        if (currentRouteCoords && currentRouteCoords.length) {
          animateArrowAlongPath(currentRouteCoords, 6000);
          openModal('directionsModal');
        }
      });
    }

    const doneBtn = document.getElementById('doneBtn');
    if (doneBtn) {
      doneBtn.addEventListener('click', () => {
        closeModal('directionsModal');
        openModal('feedbackModal');
      });
    }

    const closeDirections = document.getElementById('closeDirections');
    if (closeDirections) {
      closeDirections.addEventListener('click', () => {
        closeModal('directionsModal');
      });
    }

    const directionsOverlay = document.getElementById('directionsModal');
    if (directionsOverlay) {
      directionsOverlay.addEventListener('click', e => {
        if (e.target === directionsOverlay) {
          closeModal('directionsModal');
        }
      });
    }

    // Feedback modal controls
    const feedbackOverlay = document.getElementById('feedbackModal');
    const closeFeedback = document.getElementById('closeFeedback');
    const submitFeedback = document.getElementById('submitFeedback');
    const starRating = document.getElementById('starRating');

    if (closeFeedback) {
      closeFeedback.addEventListener('click', () => {
        closeModal('feedbackModal');
      });
    }

    if (feedbackOverlay) {
      feedbackOverlay.addEventListener('click', e => {
        if (e.target === feedbackOverlay) {
          closeModal('feedbackModal');
        }
      });
    }

    if (starRating) {
      const starButtons = starRating.querySelectorAll('button[data-value]');
      starButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const value = Number(btn.getAttribute('data-value') || '0');
          selectedRating = value;
          starButtons.forEach(star => {
            const v = Number(star.getAttribute('data-value') || '0');
            if (v <= value) {
              star.classList.add('active');
            } else {
              star.classList.remove('active');
            }
          });
        });
      });
    }

    if (submitFeedback) {
      submitFeedback.addEventListener('click', async () => {
        closeModal('feedbackModal');

        // Try to look up the logged-in user's email from localStorage
        let email = null;
        try {
          const stored = localStorage.getItem('bhhraman_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            email = parsed?.email || null;
          }
        } catch (e) {
          console.warn('Unable to read user from localStorage for feedback', e);
        }

        if (selectedRating > 0) {
          // Fire-and-forget save of feedback rating to backend
          if (email) {
            try {
              await fetch('http://localhost:4000/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, rating: selectedRating }),
              });
            } catch (err) {
              console.error('Failed to save feedback rating', err);
            }
          }

          updateStatus(`Thanks for rating Bhhraman ${selectedRating}/5 ⭐`, 'success');
        } else {
          updateStatus('Thanks for your feedback on Bhhraman!', 'success');
        }
      });
    }

    // Load data immediately on mount; loading screen will hide when done
    loadAllData();

    return () => {
      if (arrowAnimation) cancelAnimationFrame(arrowAnimation);
      map.remove();
    };
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
      const res = await fetch('http://localhost:4000/api/login', {
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

  return (
    <>
      <div className="loading-screen" id="loadingScreen">
        <div className="loading-content">
          <div className="loading-logo">BHHRAMAN</div>
          <div className="loading-subtitle">by GL Bajaj</div>
          <div className="loading-spinner"></div>
          <div className="loading-progress">
            <div className="loading-progress-bar"></div>
          </div>
          <button className="loading-skip" id="skipIntro">
            Skip intro
          </button>
        </div>
      </div>

      {!checkingAuth && !isLoggedIn && (
        <div className="login-overlay">
          <div className="login-card">
            <h2>Welcome to Bhhraman</h2>
            <p className="login-subtitle">Sign in with your email to continue.</p>
            <form onSubmit={handleLogin} className="login-form">
              <label className="login-label">
                Email ID
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label className="login-label">
                Phone number
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)}
                  placeholder="Your phone number"
                  required
                />
              </label>
              <label className="login-label">
                Password
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </label>
              {loginError && <div className="login-error">{loginError}</div>}
              <button className="btn btn-primary login-btn" type="submit" disabled={loginLoading}>
                <span>{loginLoading ? 'Signing in...' : 'Login'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <div id="map"></div>
      <div className="panel">
        <div className="panel-header">
          <div className="icon">
            <i className="fas fa-map-marked-alt"></i>
          </div>
          <div>
            <h2>Bhhraman</h2>
            <div className="subtitle">GL Bajaj Campus Navigation</div>
          </div>
          {isLoggedIn && (
            <button type="button" className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>

        <div className="form-group">
          <label>
            <i className="fas fa-map-marker-alt"></i>
            Start Location
          </label>
          <select id="start">
            <option value="">📍 Select start point...</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <i className="fas fa-flag-checkered"></i>
            End Location
          </label>
          <select id="end">
            <option value="">🎯 Select destination...</option>
          </select>
        </div>

        <button id="findBtn" className="btn btn-primary" disabled>
          <span>
            <i className="fas fa-route"></i>
            Find Route
          </span>
        </button>

        <button id="clearBtn" className="btn btn-secondary">
          <span>
            <i className="fas fa-times-circle"></i>
            Clear Route
          </span>
        </button>

        <button id="reloadBtn" className="btn btn-success">
          <span>
            <i className="fas fa-sync-alt"></i>
            Reload Data
          </span>
        </button>

        <div className="status loading" id="status">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Loading campus data...</span>
        </div>

        <div className="info" id="routeInfo">
          <div className="distance" id="distance">
            <i className="fas fa-route"></i>
            <span></span>
          </div>
          <div className="path-info" id="pathInfo">
            <i className="fas fa-info-circle"></i>
            <span></span>
          </div>
        </div>
      </div>

      <div className="modal-overlay modal-overlay--side" id="directionsModal">
        <div className="modal">
          <div className="modal-header">
            <div>
              <div className="modal-title">Turn-by-turn directions</div>
              <div className="directions-summary" id="directionsSummary">
                Smart instructions based on your current route.
              </div>
            </div>
            <button
              type="button"
              className="modal-close"
              id="closeDirections"
              aria-label="Close directions"
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <ul className="directions-list" id="directionsList"></ul>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" id="doneBtn">
              <span>
                <i className="fas fa-check-circle"></i>
                Done
              </span>
            </button>
            <button type="button" className="btn btn-primary" id="replayBtn">
              <span>
                <i className="fas fa-play-circle"></i>
                Replay route
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="modal-overlay" id="feedbackModal">
        <div className="modal">
          <div className="modal-header">
            <div>
              <div className="modal-title">Thank you for using Bhhraman!</div>
              <div className="directions-summary">
                Help us improve your campus navigation experience.
              </div>
            </div>
            <button
              type="button"
              className="modal-close"
              id="closeFeedback"
              aria-label="Close feedback"
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="thankyou-badge">
              <i className="fas fa-heart"></i> We hope your journey was smooth.
            </div>
            <div className="feedback-label">How helpful was this navigation?</div>
            <div className="star-rating" id="starRating">
              <button type="button" data-value="1" aria-label="1 star">
                <i className="fas fa-star"></i>
              </button>
              <button type="button" data-value="2" aria-label="2 stars">
                <i className="fas fa-star"></i>
              </button>
              <button type="button" data-value="3" aria-label="3 stars">
                <i className="fas fa-star"></i>
              </button>
              <button type="button" data-value="4" aria-label="4 stars">
                <i className="fas fa-star"></i>
              </button>
              <button type="button" data-value="5" aria-label="5 stars">
                <i className="fas fa-star"></i>
              </button>
            </div>
            <div className="feedback-hint">Tap a star rating and hit submit.</div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" id="submitFeedback">
              <span>
                <i className="fas fa-paper-plane"></i>
                Submit feedback
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default CampusNav;
