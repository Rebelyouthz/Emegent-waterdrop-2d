import React, { useEffect, useRef, useState } from 'react';

// Twin virtual joystick + reload/dash buttons for touch devices.
function useJoystick(side) {
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

export default function MobileControls({ onUpdate, onReload, onDash, dashCD, dashReady, fireOnAim = true }) {
  const [moveRef, moveVec] = useJoystick('L');
  const [aimRef, aimVec] = useJoystick('R');
  // detect touch device
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
      </div>
      <div ref={aimRef} className="joy joy-r" data-testid="joy-aim">
        <div className="joy-stick" style={{ transform: `translate(${aimVec.x * 40}px, ${aimVec.y * 40}px)` }} />
      </div>
      <button className="touch-btn touch-reload" onClick={onReload} data-testid="touch-reload">↻</button>
      {dashReady && (
        <button
          className="touch-btn touch-dash"
          onClick={onDash}
          disabled={dashCD > 0}
          style={{ opacity: dashCD > 0 ? 0.45 : 1 }}
          data-testid="touch-dash"
        >
          💨{dashCD > 0 ? Math.ceil(dashCD) : ''}
        </button>
      )}
    </>
  );
}
