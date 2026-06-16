import React, { useState } from 'react';
import { WEAPONS } from '../game/data';
import { WEAPON_PARTS } from '../game/data_ext';

export default function Weaponsmith({ save, setSave, onClose }) {
  const [wid, setWid] = useState('hydropistol');
  const w = WEAPONS[wid];
  const parts = save.weaponParts[wid] || {};

  const buyTier = (partKey, tierIdx) => {
    const tier = WEAPON_PARTS[partKey].tiers[tierIdx];
    if (save.gold < tier.cost) return;
    const cur = parts[partKey] || 0;
    if (tierIdx <= cur) return;
    const ns = {
      ...save,
      gold: save.gold - tier.cost,
      weaponParts: { ...save.weaponParts, [wid]: { ...parts, [partKey]: tierIdx } },
    };
    setSave(ns);
  };

  return (
    <div className="modal-overlay" data-testid="weaponsmith" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="forge-panel">
        <div className="forge-header">
          <div className="forge-title">🔨 WEAPONSMITH</div>
          <div className="forge-gold">★ {save.gold}</div>
          <button onClick={onClose} style={{ padding: '6px 12px', fontSize: 12 }}>✕</button>
        </div>
        <div className="forge-weapons">
          {Object.keys(WEAPONS).map(id => (
            <div key={id} className={`forge-wch ${wid === id ? 'sel' : ''}`} onClick={() => setWid(id)} data-testid={`forge-weapon-${id}`}>
              <div style={{ fontSize: 28 }}>{WEAPONS[id].icon}</div>
              <div style={{ fontSize: 11 }}>{WEAPONS[id].name}</div>
            </div>
          ))}
        </div>
        <div className="forge-name">{w.icon} {w.name}</div>
        <div className="forge-desc">{w.desc}</div>
        <div className="forge-parts">
          {Object.entries(WEAPON_PARTS).map(([pk, part]) => {
            const cur = parts[pk] || 0;
            return (
              <div className="forge-part" key={pk} data-testid={`part-${pk}`}>
                <div className="forge-part-h">{part.icon} {part.name} — <span style={{ color: 'var(--accent-2)' }}>{part.tiers[cur].name}</span></div>
                <div className="forge-tiers">
                  {part.tiers.map((t, i) => {
                    const owned = i <= cur;
                    const canBuy = i === cur + 1 && save.gold >= t.cost;
                    return (
                      <button
                        key={i}
                        className={`forge-tier ${owned ? 'owned' : ''}`}
                        onClick={() => buyTier(pk, i)}
                        disabled={!owned && !canBuy}
                        data-testid={`tier-${pk}-${i}`}
                        style={{ fontSize: 11, padding: '6px 8px' }}
                      >
                        <div>{t.name}</div>
                        {!owned && <div style={{ fontSize: 10, color: 'var(--accent-2)' }}>★ {t.cost}</div>}
                        {owned && <div style={{ fontSize: 10, color: 'var(--rune)' }}>✓</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
