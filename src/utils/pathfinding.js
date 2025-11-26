// Global conversion: how many meters does one pixel on the map represent?
// This should match the scale you used when tracing routes in route_editor.html.
export const PIXELS_TO_METERS = 0.5;

// Simple Euclidean distance helper (in pixels)
function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * (Legacy) simple direct route helper kept for tests/examples.
 * Prefer computing routes from real nodes/edges/routes in App.jsx.
 */
export function computeRoute(places, startId, endId) {
  const start = places.find(p => p.id === startId);
  const end = places.find(p => p.id === endId);
  if (!start || !end || start.id === end.id) {
    return { points: [], length: 0 };
  }

  const points = [
    { x: start.x, y: start.y, placeId: start.id },
    { x: end.x, y: end.y, placeId: end.id },
  ];
  const length = distance(start, end);

  return { points, length };
}

/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate distance in pixels between two points
 */
function segmentPixels(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

/**
 * Generate detailed turn-by-turn directions from a route.
 * This algorithm detects turns based on angle changes between path segments.
 *
 * @param {{ points: Array<{x:number;y:number;placeId?:number|string}>, length: number }} route
 * @param {Record<string|number, {id:string|number; name:string}>} placesById
 * @returns {Array<{id:string; title:string; detail:string; distance:number; kind:string}>}
 */
export function generateDirections(route, placesById = {}) {
  // Validate route input
  if (!route || !route.points || !Array.isArray(route.points)) {
    console.warn('Invalid route provided to generateDirections');
    return [];
  }

  const { points, length } = route;
  if (points.length < 2) return [];

  // Validate start and end points
  const start = points[0];
  const end = points[points.length - 1];

  if (!start || !end ||
    typeof start.x !== 'number' || typeof start.y !== 'number' ||
    typeof end.x !== 'number' || typeof end.y !== 'number') {
    console.warn('Invalid start or end point in route');
    return [];
  }

  const startPlace = start.placeId ? placesById[start.placeId] : null;
  const endPlace = end.placeId ? placesById[end.placeId] : null;

  const startName = startPlace ? startPlace.name : 'Start';
  const endName = endPlace ? endPlace.name : 'Destination';

  const steps = [];
  let totalPixels = 0;
  let pixelsSinceLastTurn = 0;
  let lastTurnIndex = 0;

  // Add starting step
  steps.push({
    id: 'start',
    kind: 'start',
    title: `Start at ${startName}`,
    detail: 'Begin your journey here.',
    distance: 0,
    startIndex: 0,
  });

  // Analyze the path for turns
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Skip if any point is invalid
    if (!prev || !curr || !next ||
      typeof prev.x !== 'number' || typeof prev.y !== 'number' ||
      typeof curr.x !== 'number' || typeof curr.y !== 'number' ||
      typeof next.x !== 'number' || typeof next.y !== 'number') {
      continue;
    }

    const segPixels = segmentPixels(prev, curr);
    pixelsSinceLastTurn += segPixels;

    // Calculate vectors for angle detection
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    const mag1 = Math.hypot(v1.x, v1.y);
    const mag2 = Math.hypot(v2.x, v2.y);

    if (!mag1 || !mag2) continue;

    // Calculate angle between vectors
    const dot = v1.x * v2.x + v1.y * v2.y;
    const cos = clamp(dot / (mag1 * mag2), -1, 1);
    const angleDeg = (Math.acos(cos) * 180) / Math.PI;

    // Detect significant turns (> 35 degrees)
    if (angleDeg > 35) {
      const cross = v1.x * v2.y - v1.y * v2.x;
      const dir = cross > 0 ? 'left' : 'right';
      const meters = Number((pixelsSinceLastTurn * PIXELS_TO_METERS).toFixed(0));
      totalPixels += pixelsSinceLastTurn;
      pixelsSinceLastTurn = 0;

      if (meters > 0) {
        // Add straight segment BEFORE the turn
        // This segment started at lastTurnIndex and ends at i
        // But we don't add explicit straight steps usually? 
        // Wait, the original code added turn steps with "In X m, turn left".
        // That implies the step starts NOW (at lastTurnIndex) and ends at the turn.

        steps.push({
          id: `turn-${i}`,
          kind: 'turn',
          title: `Turn ${dir}`,
          detail: `In ${meters} m, turn ${dir}.`,
          distance: meters,
          startIndex: lastTurnIndex, // This step covers the distance leading up to the turn
        });
      } else {
        steps.push({
          id: `turn-${i}`,
          kind: 'turn',
          title: `Turn ${dir}`,
          detail: `Turn ${dir} here.`,
          distance: 0,
          startIndex: i, // Immediate turn
        });
      }
      lastTurnIndex = i;
    }
  }

  // Add final segment distance
  if (points.length >= 2) {
    const secondLast = points[points.length - 2];
    const last = points[points.length - 1];

    if (secondLast && last &&
      typeof secondLast.x === 'number' && typeof secondLast.y === 'number' &&
      typeof last.x === 'number' && typeof last.y === 'number') {
      const lastSeg = segmentPixels(secondLast, last);
      pixelsSinceLastTurn += lastSeg;
    }
  }

  totalPixels += pixelsSinceLastTurn;
  const remainingMeters = Number((pixelsSinceLastTurn * PIXELS_TO_METERS).toFixed(0));

  if (remainingMeters > 0) {
    steps.push({
      id: 'straight',
      kind: 'straight',
      title: 'Continue straight',
      detail: `Continue for about ${remainingMeters} m to reach your destination.`,
      distance: remainingMeters,
      startIndex: lastTurnIndex,
    });
  }

  // Add ending step
  steps.push({
    id: 'end',
    kind: 'end',
    title: `Arrive at ${endName}`,
    detail: `You have reached ${endName}.`,
    distance: 0,
    startIndex: points.length - 1,
  });

  return steps;
}
