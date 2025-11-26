/**
 * MarkerAnimator - Animates a marker along a path of points
 * Uses requestAnimationFrame for smooth animation
 */
class MarkerAnimator {
  constructor({ points, durationMs, onUpdate, onComplete, onSegmentChange }) {
    this.originalPoints = points || [];
    this.durationMs = durationMs || 5000;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.onSegmentChange = onSegmentChange;

    // Create interpolated path for smooth continuous movement
    this.points = this._createInterpolatedPath(this.originalPoints);

    // Animation state
    this._isPlaying = false;
    this._raf = null;
    this._startTime = null;
    this._pauseTime = null;
    this._elapsedTime = 0;
    this._currentSegment = -1;
    this._currentOriginalSegment = -1;
    this._frameCount = 0;

    // Define step as an arrow function to preserve context
    this.step = (timestamp) => {
      if (!this._isPlaying) {
        if (this._raf) {
          cancelAnimationFrame(this._raf);
          this._raf = null;
        }
        return;
      }

      this._frameCount++;
      this._elapsedTime = timestamp - this._startTime;
      let progress = Math.min(this._elapsedTime / this.durationMs, 1);

      // Calculate which segment we're in
      const totalLength = this.points.length - 1;
      let currentPointIndex = Math.floor(progress * totalLength);
      let segmentProgress = (progress * totalLength) - currentPointIndex;

      // Clamp to valid range (both lower and upper bounds)
      if (currentPointIndex < 0) {
        currentPointIndex = 0;
        segmentProgress = 0;
      } else if (currentPointIndex >= totalLength) {
        currentPointIndex = totalLength - 1;
        segmentProgress = 1;
        progress = 1;
      }

      const a = this.points[currentPointIndex];
      const b = this.points[currentPointIndex + 1];

      // Validate points
      if (!a || !b || typeof a.x !== 'number' || typeof a.y !== 'number' ||
        typeof b.x !== 'number' || typeof b.y !== 'number') {
        console.error('[MarkerAnimator] Invalid points in segment', currentPointIndex);
        this._isPlaying = false;
        if (this._raf) {
          cancelAnimationFrame(this._raf);
          this._raf = null;
        }
        return;
      }

      // Interpolate position
      const x = a.x + (b.x - a.x) * segmentProgress;
      const y = a.y + (b.y - a.y) * segmentProgress;

      // Calculate angle
      let angleDeg = 0;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      if (dx !== 0 || dy !== 0) {
        angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      }

      // Get original segment index from the current point
      const originalSegmentIndex = a.originalSegmentIndex;

      // Call onUpdate callback
      if (this.onUpdate) {
        this.onUpdate({ x, y, angleDeg, progress, originalSegmentIndex });
      }

      // Call onSegmentChange if original segment changed
      if (this._currentOriginalSegment !== originalSegmentIndex && this.onSegmentChange) {
        this._currentOriginalSegment = originalSegmentIndex;
        this.onSegmentChange(this._currentOriginalSegment);
      }

      // Check if animation is complete
      if (progress >= 1) {
        // Ensure we report the final segment/point index to trigger the "Arrived" step
        if (this.onSegmentChange) {
          this.onSegmentChange(this.originalPoints.length - 1);
        }

        this._isPlaying = false;
        if (this._raf) {
          cancelAnimationFrame(this._raf);
          this._raf = null;
        }
        this._startTime = null;
        this._pauseTime = null;
        this._elapsedTime = 0;
        if (this.onComplete) {
          this.onComplete();
        }
        return;
      }

      // Schedule next frame
      this._raf = requestAnimationFrame(this.step);
    };
  }

  /**
   * Create interpolated path with extra points for ultra-smooth movement
   * Uses distance-based interpolation for constant speed
   */
  _createInterpolatedPath(originalPoints) {
    if (!originalPoints || originalPoints.length < 2) {
      return originalPoints;
    }

    const interpolatedPath = [];
    const stepSize = 5; // pixels per step for constant speed

    for (let i = 0; i < originalPoints.length - 1; i++) {
      const start = originalPoints[i];
      const end = originalPoints[i + 1];

      const dist = Math.hypot(end.x - start.x, end.y - start.y);
      const steps = Math.max(1, Math.floor(dist / stepSize));

      // Add interpolated points between start and end
      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        const x = start.x + (end.x - start.x) * t;
        const y = start.y + (end.y - start.y) * t;
        interpolatedPath.push({ x, y, originalSegmentIndex: i });
      }
    }

    // Add the final point
    interpolatedPath.push({
      ...originalPoints[originalPoints.length - 1],
      originalSegmentIndex: originalPoints.length - 2 // Belongs to the last segment
    });

    return interpolatedPath;
  }

  play() {
    if (!this.points || this.points.length < 2) {
      console.warn('[MarkerAnimator] Cannot play: insufficient points');
      return;
    }

    if (this._isPlaying && this._raf) {
      return; // Already playing
    }

    this._isPlaying = true;
    this._frameCount = 0;

    if (this._pauseTime) {
      // Resuming from pause
      const pauseDuration = performance.now() - this._pauseTime;
      this._startTime += pauseDuration;
      this._pauseTime = null;
    } else {
      // Starting fresh
      this._startTime = performance.now();
      this._elapsedTime = 0;
      this._currentSegment = -1;
      this._currentOriginalSegment = -1;
    }

    // Cancel any existing animation frame
    if (this._raf) {
      cancelAnimationFrame(this._raf);
    }

    // Start the animation loop
    this._raf = requestAnimationFrame(this.step);
  }

  pause() {
    if (!this._isPlaying) {
      return;
    }
    this._isPlaying = false;
    this._pauseTime = performance.now();
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }

  stop() {
    this._isPlaying = false;
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    this._startTime = null;
    this._pauseTime = null;
    this._elapsedTime = 0;
    this._currentSegment = -1;
    this._currentOriginalSegment = -1;
    this._frameCount = 0;
  }

  replay() {
    this.stop();
    this.play();
  }

  setPoints(points) {
    this.stop();
    this.originalPoints = points || [];
    this.points = this._createInterpolatedPath(this.originalPoints);
  }

  setSpeed(durationMs) {
    const wasPlaying = this._isPlaying;
    const currentProgress = this._elapsedTime / this.durationMs;

    this.durationMs = durationMs;

    if (wasPlaying) {
      // Adjust start time to maintain current progress
      this._startTime = performance.now() - (currentProgress * durationMs);
    }
  }

  destroy() {
    this.stop();
    this.onUpdate = null;
    this.onComplete = null;
    this.onSegmentChange = null;
    this.points = [];
    this.originalPoints = [];
  }

  // Getter for current state (useful for debugging)
  getState() {
    return {
      isPlaying: this._isPlaying,
      frameCount: this._frameCount,
      elapsedTime: this._elapsedTime,
      progress: this._elapsedTime / this.durationMs,
      currentSegment: this._currentSegment,
      totalPoints: this.points.length,
      rafId: this._raf,
    };
  }
}

export default MarkerAnimator;
