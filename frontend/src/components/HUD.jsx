import React from 'react';

const fmt = (t) => { const m = Math.floor(t / 60); const s = Math.floor(t % 60); return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; };

export default function HUD({ snap, onActiveSkill }) {
  if (!snap) return null;
  const xpPct = (snap.xp / snap.xpToNext) * 100;
  const hpPct = (snap.hp / snap.maxHp) * 100;
  const missionTimeLeft = snap.targetDuration && snap.targetDuration < 999 ? Math.max(0, snap.targetDuration - snap.time) : null;

  const skills = snap.activeSkills || [];

  return (
    <>
      {/* Boss bar ABOVE the main hud — fixed, full width centered at very top */}
      {snap.bossActive && (
        <div className="hud-boss-bar" data-testid="hud-boss-bar">
          <div className="hud-boss-name">⚠ {snap.bossName} ⚠</div>
          <div className="hud-boss-bar-track">
            <div className="hud-boss-bar-fill" style={{ width: ((snap.bossHp / snap.bossMaxHp) * 100) + '%' }} />
          </div>
        </div>
      )}

      <div className={`hud-top${snap.bossActive ? ' boss-active' : ''}`}>
        <div className="hud-timer" data-testid="hud-timer">{missionTimeLeft != null ? fmt(missionTimeLeft) : fmt(snap.time)}</div>
        <div className="hud-wave">
          {snap.killGoal > 0 ? `KILLS ${snap.kills} / ${snap.killGoal}` : `WAVE ${Math.ceil(snap.time / 30)}`} · KILLS {snap.kills} · ★ {snap.gold}
          {snap.challenge && <span style={{ color: 'var(--accent)', marginLeft: 10 }}>· {snap.challenge.name}</span>}
        </div>
        <div className="hud-xpbar">
          <div className="hud-xpbar-fill" style={{ width: xpPct + '%' }} />
          <div className="hud-level">LV {snap.level}</div>
        </div>
      </div>

      {/* COMBO METER - removed */}

      <div className="weapon-strip">
        {snap.weapons.map(w => (
          <div className="weapon-chip" key={w.id} title={w.name}>{w.icon}<span className="lv">Lv{w.lvl}</span></div>
        ))}
      </div>

      {/* Active skills — right column */}
      {skills.length > 0 && (
        <div className="active-bar active-bar-overflow" data-testid="active-bar-overflow">
          {skills.map((s, idx) => {
            const ready = s.cd <= 0;
            const pct = s.maxCd > 0 ? Math.max(0, Math.min(100, 100 - (s.cd / s.maxCd) * 100)) : 100;
            return (
              <button key={idx} className={`skill-btn ${ready ? 'ready' : ''}`} onClick={() => onActiveSkill && onActiveSkill(idx)} data-testid={`skill-${idx}`} aria-label={s.name}>
                <div className="skill-icon">{s.icon}</div>
                <div className="skill-key">{idx + 1}</div>
                <div className="skill-cd" style={{ height: `${100 - pct}%` }} />
                {!ready && <div className="skill-cd-num">{Math.ceil(s.cd)}</div>}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom area: MAG text + HP bar (NO center active skill button) */}
      <div className="hud-bottom-stack">
        <div className="hud-mag-text">
          {snap.reloading ? <span style={{ color: 'var(--accent-2)' }}>↻ RELOADING…</span> : `MAG ${snap.mag}`}
          {snap.noHit && <span style={{ marginLeft: 12, color: 'var(--rune)' }}>👻 NO-HIT</span>}
        </div>
        <div className="hud-hp">
          <div className="hud-hp-bar">
            <div className="hud-hp-fill" style={{ width: hpPct + '%' }} />
            <div className="hud-hp-text">{Math.max(0, Math.floor(snap.hp))} / {Math.floor(snap.maxHp)}</div>
          </div>
        </div>
        <div className="hud-stats">
          <div className="hud-stat"><span className="lbl">FPS</span><span className="val">{Math.round(snap.fps)}</span></div>
        </div>
      </div>

      <div className="help">
        <b>WASD</b> move · <b>MOUSE</b> aim · <b>CLICK</b> fire<br />
        <b>R</b> reload · <b>SPACE</b> dash · <b>1-4</b> skills · <b>ESC</b> pause
      </div>
    </>
  );
}
