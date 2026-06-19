import React, { useEffect, useRef, useState } from 'react';

// Robust dynamic twin joysticks. Touch listeners are attached to DOCUMENT
// (not to a div) so element z-index / pointer-events can never block them.
// Touches on the LEFT half of the viewport drive movement; RIGHT half = aim.
// Touch-and-flick on LEFT = dash gesture.

const RING = 140;     // outer ring diameter (px)
const KNOB = 64;      // inner knob diameter (px)
const MAX_DELTA = (RING - KNOB) / 2;

export default function MobileControls({ onUpdate, onDashDir, dashCD, dashReady, fireOnAim = true }) {
  const [show, setShow] = useState(true);
  const [left, setLeft] = useState({ active: false, cx: 0, cy: 0, vx: 0, vy: 0 });
  const [right, setRight] = useState({ active: false, cx: 0, cy: 0, vx: 0, vy: 0 });
  const tracking = useRef({ left: null, right: null }); // touchId per side
  const startInfo = useRef({ left: null, right: null }); // for swipe-dash
  const lastSwipeRef = useRef(0);
  const cbRef = useRef({ onUpdate, onDashDir });
  cbRef.current = { onUpdate, onDashDir };

  // Hide on real desktop (mouse-only); show on touch devices AND on narrow viewports
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isNarrow = window.innerWidth <= 900;
    setShow(isTouch || isNarrow);
  }, []);

  useEffect(() => {
    if (!show) return;

    const sideOf = (clientX) => clientX < window.innerWidth / 2 ? 'left' : 'right';

    const setter = (side, val) => (side === 'left' ? setLeft(val) : setRight(val));

    const onTouchStart = (e) => {
      for (const t of e.changedTouches) {
        const side = sideOf(t.clientX);
        if (tracking.current[side] != null) continue;
        tracking.current[side] = t.identifier;
        startInfo.current[side] = { x: t.clientX, y: t.clientY, time: performance.now(), fired: false };
        setter(side, { active: true, cx: t.clientX, cy: t.clientY, vx: 0, vy: 0 });
      }
    };
    const onTouchMove = (e) => {
      for (const t of e.changedTouches) {
        const side = (tracking.current.left === t.identifier) ? 'left'
                    : (tracking.current.right === t.identifier) ? 'right' : null;
        if (!side) continue;
        const state = side === 'left' ? left : right;
        const cx = state.cx, cy = state.cy;
        const dx = t.clientX - cx, dy = t.clientY - cy;
        const max = 70;
        const l = Math.hypot(dx, dy) || 1;
        const cl = Math.min(l, max);
        const vx = (dx / l) * (cl / max);
        const vy = (dy / l) * (cl / max);
        setter(side, { active: true, cx, cy, vx, vy });
        // Swipe-dash on left
        if (side === 'left' && startInfo.current.left && !startInfo.current.left.fired) {
          const elapsed = performance.now() - startInfo.current.left.time;
          const sx = t.clientX - startInfo.current.left.x;
          const sy = t.clientY - startInfo.current.left.y;
          const sLen = Math.hypot(sx, sy);
          if (elapsed > 0 && elapsed < 180 && sLen > 40) {
            startInfo.current.left.fired = true;
            const now = performance.now();
            if (now - lastSwipeRef.current > 220) {
              lastSwipeRef.current = now;
              cbRef.current.onDashDir && cbRef.current.onDashDir(sx / sLen, sy / sLen);
            }
          }
        }
      }
    };
    const onTouchEnd = (e) => {
      for (const t of e.changedTouches) {
        const side = (tracking.current.left === t.identifier) ? 'left'
                    : (tracking.current.right === t.identifier) ? 'right' : null;
        if (!side) continue;
        tracking.current[side] = null;
        startInfo.current[side] = null;
        setter(side, { active: false, cx: 0, cy: 0, vx: 0, vy: 0 });
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [show, left, right]);

  // Push current vec to engine on every change
  useEffect(() => {
    const moveVec = { x: left.vx, y: left.vy };
    const aimVec = { x: right.vx, y: right.vy };
    const firing = fireOnAim && (Math.abs(aimVec.x) > 0.15 || Math.abs(aimVec.y) > 0.15);
    cbRef.current.onUpdate(moveVec, aimVec, firing);
  }, [left.vx, left.vy, right.vx, right.vy, fireOnAim]);

  if (!show) return null;

  const renderStick = (side, s) => {
    if (!s.active) return null;
    const tx = s.vx * MAX_DELTA;
    const ty = s.vy * MAX_DELTA;
    return (
      <React.Fragment key={side}>
        <div className={`dyn-joy-ring dyn-${side}`}
             style={{ left: s.cx - RING / 2, top: s.cy - RING / 2, width: RING, height: RING }} />
        <div className={`dyn-joy-knob dyn-${side}`}
             style={{ left: s.cx - KNOB / 2 + tx, top: s.cy - KNOB / 2 + ty, width: KNOB, height: KNOB }} />
      </React.Fragment>
    );
  };

  return (
    <>
      {/* Persistent hint circles in bottom-left & bottom-right so player knows where to touch */}
      <div className="dyn-hint dyn-hint-left"  data-testid="dyn-hint-left">
        <div className="dyn-hint-ring" />
        <div className="dyn-hint-label">MOVE · SWIPE TO DASH</div>
      </div>
      <div className="dyn-hint dyn-hint-right" data-testid="dyn-hint-right">
        <div className="dyn-hint-ring" />
        <div className="dyn-hint-label">AIM · FIRE</div>
      </div>

      {renderStick('left', left)}
      {renderStick('right', right)}

      {dashReady !== undefined && (
        <div className={`dash-pip ${dashCD > 0 ? 'cooldown' : 'ready'}`} data-testid="dash-pip">
          {dashCD > 0 ? `dash ${Math.ceil(dashCD)}s` : '⚡ swipe to dash'}
        </div>
      )}
    </>
  );
}
