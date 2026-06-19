import React, { useEffect, useRef, useState } from 'react';

// Twin DYNAMIC virtual joysticks. Touch anywhere on the left/right half of the
// screen — the joystick anchors at your touch point, follows your finger, and
// vanishes on release. Swipe gesture on the LEFT triggers a dash.

function useDynamicJoystick({ side, onSwipeDash, onVecChange }) {
  const areaRef = useRef(null);
  const [vis, setVis] = useState(null); // {cx, cy} when active
  const stateRef = useRef({
    touchId: null,
    cx: 0, cy: 0,
    startX: 0, startY: 0,
    startTime: 0,
    fired: false,
  });
  const [vec, setVec] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = areaRef.current; if (!el) return;
    const onStart = (e) => {
      // Only react to touches inside our area
      for (const t of e.changedTouches) {
        const st = stateRef.current;
        if (st.touchId != null) continue;
        const rect = el.getBoundingClientRect();
        if (t.clientX < rect.left || t.clientX > rect.right ||
            t.clientY < rect.top  || t.clientY > rect.bottom) continue;
        st.touchId = t.identifier;
        st.cx = t.clientX;
        st.cy = t.clientY;
        st.startX = t.clientX;
        st.startY = t.clientY;
        st.startTime = performance.now();
        st.fired = false;
        setVis({ cx: t.clientX, cy: t.clientY });
        setVec({ x: 0, y: 0 });
      }
    };
    const onMove = (e) => {
      for (const t of e.changedTouches) {
        const st = stateRef.current;
        if (t.identifier !== st.touchId) continue;
        const dx = t.clientX - st.cx;
        const dy = t.clientY - st.cy;
        const max = 70;
        const l = Math.hypot(dx, dy) || 1;
        const cl = Math.min(l, max);
        setVec({ x: (dx / l) * (cl / max), y: (dy / l) * (cl / max) });
        if (side === 'left' && !st.fired && onSwipeDash) {
          const elapsed = performance.now() - st.startTime;
          const sx = t.clientX - st.startX;
          const sy = t.clientY - st.startY;
          const sLen = Math.hypot(sx, sy);
          if (elapsed > 0 && elapsed < 180 && sLen > 40) {
            const nx = sx / sLen, ny = sy / sLen;
            st.fired = true;
            onSwipeDash(nx, ny);
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
          setVis(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

  useEffect(() => { if (onVecChange) onVecChange(vec); }, [vec, onVecChange]);

  return { areaRef, vis, vec };
}

export default function MobileControls({ onUpdate, onDashDir, dashCD, dashReady, fireOnAim = true }) {
  const lastSwipeRef = useRef(0);
  const onSwipeDash = React.useCallback((nx, ny) => {
    const now = performance.now();
    if (now - lastSwipeRef.current < 220) return;
    lastSwipeRef.current = now;
    if (onDashDir) onDashDir(nx, ny);
  }, [onDashDir]);

  const left = useDynamicJoystick({ side: 'left', onSwipeDash });
  const right = useDynamicJoystick({ side: 'right' });
  const [isTouch] = useState(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0);

  useEffect(() => {
    const firing = fireOnAim && (Math.abs(right.vec.x) > 0.15 || Math.abs(right.vec.y) > 0.15);
    onUpdate(left.vec, right.vec, firing);
  }, [left.vec, right.vec, fireOnAim, onUpdate]);

  if (!isTouch) return null;

  // Knob size constants
  const RING_SIZE = 140;   // outer ring diameter
  const KNOB_SIZE = 64;    // inner knob diameter

  const renderStick = ({ vis, vec }, side) => {
    if (!vis) return null;
    const tx = vec.x * (RING_SIZE / 2 - KNOB_SIZE / 2);
    const ty = vec.y * (RING_SIZE / 2 - KNOB_SIZE / 2);
    return (
      <>
        <div
          className={`dyn-joy-ring dyn-${side}`}
          style={{ left: vis.cx - RING_SIZE / 2, top: vis.cy - RING_SIZE / 2, width: RING_SIZE, height: RING_SIZE }}
        />
        <div
          className={`dyn-joy-knob dyn-${side}`}
          style={{ left: vis.cx - KNOB_SIZE / 2 + tx, top: vis.cy - KNOB_SIZE / 2 + ty, width: KNOB_SIZE, height: KNOB_SIZE }}
        />
      </>
    );
  };

  return (
    <>
      {/* Invisible touch zones — left and right halves of the screen */}
      <div ref={left.areaRef} className="dyn-joy-area dyn-area-left" data-testid="joy-move-area" />
      <div ref={right.areaRef} className="dyn-joy-area dyn-area-right" data-testid="joy-aim-area" />

      {/* Visual rings only appear when active */}
      {renderStick(left, 'left')}
      {renderStick(right, 'right')}

      {/* Dash indicator (small fixed pip in bottom-left corner) */}
      {dashReady !== undefined && (
        <div className={`dash-pip ${dashCD > 0 ? 'cooldown' : 'ready'}`} data-testid="dash-pip">
          {dashCD > 0 ? Math.ceil(dashCD) : '⚡ swipe to dash'}
        </div>
      )}
    </>
  );
}
