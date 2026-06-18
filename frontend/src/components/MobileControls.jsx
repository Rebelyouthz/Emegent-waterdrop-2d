import React, { useEffect, useRef, useState } from 'react';

// Twin virtual joystick with SWIPE-DASH gesture on the left stick.
// - Hold and drag left = move
// - Fast flick (>40px in <180ms) = dash in that direction (if cooldown ready)
// - Right joystick = aim/fire
// - Reload button stays in corner
// - Dash button REMOVED (gesture handles it)

function useJoystickWithSwipe({ onSwipeDash, onMoveChange }) {
  const ref = useRef(null);
  const stateRef = useRef({
    touchId: null,
    cx: 0, cy: 0,
    startX: 0, startY: 0,
    startTime: 0,
    fired: false,
  });
  const [vec, setVec] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onStart = (e) => {
      const t = e.changedTouches[0]; if (!t) return;
      const st = stateRef.current;
      st.touchId = t.identifier;
      const r = el.getBoundingClientRect();
      st.cx = r.left + r.width / 2;
      st.cy = r.top + r.height / 2;
      st.startX = t.clientX;
      st.startY = t.clientY;
      st.startTime = performance.now();
      st.fired = false;
    };
    const onMove = (e) => {
      for (const t of e.changedTouches) {
        const st = stateRef.current;
        if (t.identifier !== st.touchId) continue;
        const dx = t.clientX - st.cx;
        const dy = t.clientY - st.cy;
        const max = 60;
        const l = Math.hypot(dx, dy) || 1;
        const cl = Math.min(l, max);
        setVec({ x: (dx / l) * (cl / max), y: (dy / l) * (cl / max) });
        // SWIPE-DASH detection: fast flick from start
        if (!st.fired) {
          const elapsed = performance.now() - st.startTime;
          const sx = t.clientX - st.startX;
          const sy = t.clientY - st.startY;
          const sLen = Math.hypot(sx, sy);
          if (elapsed > 0 && elapsed < 180 && sLen > 40) {
            const nx = sx / sLen, ny = sy / sLen;
            st.fired = true;
            if (onSwipeDash) onSwipeDash(nx, ny);
          }
        }
      }
    };
    const onEnd = (e) => {
      for (const t of e.changedTouches) {
        const st = stateRef.current;
        if (t.identifier === st.touchId) {
          st.touchId = null;
          setVec({ x: 0, y: 0 });
        }
      }
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [onSwipeDash]);

  useEffect(() => { if (onMoveChange) onMoveChange(vec); }, [vec, onMoveChange]);

  return [ref, vec];
}

function useJoystick() {
  const ref = useRef(null);
  const [vec, setVec] = useState({ x: 0, y: 0 });
  const stateRef = useRef({ touchId: null, cx: 0, cy: 0 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onStart = (e) => {
      const t = e.changedTouches[0]; if (!t) return;
      stateRef.current.touchId = t.identifier;
      const r = el.getBoundingClientRect();
      stateRef.current.cx = r.left + r.width / 2;
      stateRef.current.cy = r.top + r.height / 2;
    };
    const onMove = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === stateRef.current.touchId) {
          const dx = t.clientX - stateRef.current.cx;
          const dy = t.clientY - stateRef.current.cy;
          const max = 60;
          const l = Math.hypot(dx, dy) || 1;
          const cl = Math.min(l, max);
          setVec({ x: (dx / l) * (cl / max), y: (dy / l) * (cl / max) });
        }
      }
    };
    const onEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === stateRef.current.touchId) {
          stateRef.current.touchId = null;
          setVec({ x: 0, y: 0 });
        }
      }
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, []);
  return [ref, vec];
}

export default function MobileControls({ onUpdate, onReload, onDashDir, dashCD, dashReady, fireOnAim = true }) {
  const lastSwipeRef = useRef(0);
  const onSwipeDash = React.useCallback((nx, ny) => {
    // throttle to prevent spam; dash cooldown handled by engine
    const now = performance.now();
    if (now - lastSwipeRef.current < 220) return;
    lastSwipeRef.current = now;
    if (onDashDir) onDashDir(nx, ny);
  }, [onDashDir]);

  const [moveRef, moveVec] = useJoystickWithSwipe({ onSwipeDash });
  const [aimRef, aimVec] = useJoystick();
  const [isTouch] = useState(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0);

  useEffect(() => {
    const firing = fireOnAim && (Math.abs(aimVec.x) > 0.15 || Math.abs(aimVec.y) > 0.15);
    onUpdate(moveVec, aimVec, firing);
  }, [moveVec, aimVec, fireOnAim, onUpdate]);

  if (!isTouch) return null;
  return (
    <>
      <div ref={moveRef} className="joy joy-l" data-testid="joy-move">
        <div className="joy-stick" style={{ transform: `translate(${moveVec.x * 40}px, ${moveVec.y * 40}px)` }} />
        {dashReady && (
          <div className={`joy-dash-ring ${dashCD > 0 ? 'cooldown' : 'ready'}`} data-testid="joy-dash-ring">
            <span>{dashCD > 0 ? Math.ceil(dashCD) : '⚡'}</span>
          </div>
        )}
      </div>
      <div ref={aimRef} className="joy joy-r" data-testid="joy-aim">
        <div className="joy-stick" style={{ transform: `translate(${aimVec.x * 40}px, ${aimVec.y * 40}px)` }} />
      </div>
      <button className="touch-btn touch-reload" onClick={onReload} data-testid="touch-reload">↻</button>
    </>
  );
}
