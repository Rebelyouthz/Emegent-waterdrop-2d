import React from 'react';

const fmt = (t) => { const m = Math.floor(t / 60); const s = Math.floor(t % 60); return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; };

export default function HUD({ snap, onActiveSkill }) {
  if (!snap) return null;
  const xpPct = (snap.xp / snap.xpToNext) * 100;
  const hpPct = (snap.hp / snap.maxHp) * 100;
  const missionTimeLeft = snap.targetDuration && snap.targetDuration < 999 ? Math.max(0, snap.targetDuration - snap.time) : null;
  return (
    <>
      <div className="hud-top">
        <div className="hud-timer" data-testid="hud-timer">{missionTimeLeft != null ? fmt(missionTimeLeft) : fmt(snap.time)}</div>
        <div className="hud-wave">
          {snap.killGoal > 0 ? `KILLS ${snap.kills} / ${snap.killGoal}` : `WAVE ${Math.ceil(snap.time / 30)}`} · KILLS {snap.kills} · ★ {snap.gold}
          {snap.challenge && <span style={{ color: 'var(--accent)', marginLeft: 10 }}>· {snap.challenge.name}</span>}
        </div>
        <div className="hud-xpbar">
          <div className="hud-xpbar-fill" style={{ width: xpPct + '%' }} />
          <div className="hud-level">LV {snap.level}</div>
        </div>
        {snap.bossActive && (
          <div style={{ width: 'min(680px,70vw)', marginTop: 6 }}>
            <div style={{ fontFamily: 'VT323', color: '#ff7a1a', letterSpacing: '0.3em', textAlign: 'center', fontSize: 16 }}>⚠ {snap.bossName} ⚠</div>
            <div style={{ height: 8, background: '#00000099', border: '1px solid #000' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,#ff7a1a,#b51d28)', width: ((snap.bossHp / snap.bossMaxHp) * 100) + '%', transition: 'width 200ms' }} />
            </div>
          </div>
        )}
      </div>

      <div className="weapon-strip">
        {snap.weapons.map(w => (
          <div className="weapon-chip" key={w.id} title={w.name}>{w.icon}<span className="lv">Lv{w.lvl}</span></div>
        ))}
      </div>

      {snap.activeSkills && snap.activeSkills.length > 0 && (
        <div className="active-bar" data-testid="active-bar">
          {snap.activeSkills.map((s, i) => {
            const pct = s.maxCd > 0 ? Math.max(0, Math.min(100, 100 - (s.cd / s.maxCd) * 100)) : 100;
            const ready = s.cd <= 0;
            return (
              <button
                key={i}
                className={`skill-btn ${ready ? 'ready' : ''}`}
                onClick={() => onActiveSkill && onActiveSkill(i)}
                data-testid={`skill-${i}`}
                aria-label={s.name}
              >
                <div className="skill-icon">{s.icon}</div>
                <div className="skill-key">{i + 1}</div>
                <div className="skill-cd" style={{ height: `${100 - pct}%` }} />
                {!ready && <div className="skill-cd-num">{Math.ceil(s.cd)}</div>}
              </button>
            );
          })}
        </div>
      )}

      <div className="hud-bottom">
        <div className="hud-hp">
          <div className="hud-hp-bar">
            <div className="hud-hp-fill" style={{ width: hpPct + '%' }} />
            <div className="hud-hp-text">{Math.max(0, Math.floor(snap.hp))} / {Math.floor(snap.maxHp)}</div>
          </div>
          <div style={{ fontFamily: 'VT323', color: 'var(--ink-dim)', fontSize: 14, marginTop: 4, letterSpacing: '0.2em' }}>
            {snap.reloading ? <span style={{ color: 'var(--accent-2)' }}>↻ RELOADING…</span> : `MAG ${snap.mag}`}
            {snap.noHit && <span style={{ marginLeft: 12, color: 'var(--rune)' }}>👻 NO-HIT</span>}
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
