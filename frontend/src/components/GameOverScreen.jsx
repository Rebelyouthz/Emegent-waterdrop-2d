import React from 'react';

const fmt = (t) => {
  const m = Math.floor(t / 60); const s = Math.floor(t % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function GameOver({ result, onCamp, onRetry, onMenu }) {
  return (
    <div className="modal-overlay">
      <div className="gameover" data-testid="game-over">
        <h1>{result.victory ? 'A.I.D.A. SLAIN' : 'YOU FELL'}</h1>
        <div style={{ fontFamily: 'VT323', color: 'var(--ink-dim)', letterSpacing: '0.3em' }}>
          {result.victory ? 'The lake awakens. The collective remembers your name.' : 'The lake mourns. Return stronger.'}
        </div>
        <div className="stats">
          <div className="stat-row"><span>TIME</span><span>{fmt(result.time)}</span></div>
          <div className="stat-row"><span>LEVEL</span><span>{result.level}</span></div>
          <div className="stat-row"><span>KILLS</span><span>{result.kills}</span></div>
          <div className="stat-row"><span>GOLD</span><span>{result.gold}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onMenu} data-testid="go-menu">Menu</button>
          <button onClick={onCamp} data-testid="go-camp">⛺ Camp</button>
          <button onClick={onRetry} data-testid="go-retry"
            style={{ borderColor: '#ff7a1a', boxShadow: 'var(--pixel-edge), 0 6px 0 #000, 0 0 28px #ff7a1a66' }}>
            ↻ Retry
          </button>
        </div>
      </div>
    </div>
  );
}
