import React, { useState } from 'react';
import { SKILL_TREE } from '../game/data_ext';

export default function SkillTree({ save, setSave, onClose }) {
  const [branch, setBranch] = useState('combat');
  const tree = SKILL_TREE[branch];

  const canBuy = (sk) => {
    const lvl = save.skills[sk.id] || 0;
    if (lvl >= sk.max) return false;
    if (sk.req && (!save.skills[sk.req] || save.skills[sk.req] < 1)) return false;
    return save.sp >= sk.costPerLvl;
  };

  const buy = (sk) => {
    if (!canBuy(sk)) return;
    const lvl = save.skills[sk.id] || 0;
    const ns = { ...save, sp: save.sp - sk.costPerLvl, skills: { ...save.skills, [sk.id]: lvl + 1 } };
    setSave(ns);
  };

  return (
    <div className="modal-overlay" data-testid="skill-tree" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="skilltree-panel">
        <div className="st-header">
          <div className="st-title">🧠 SKILL TREE</div>
          <div className="st-sp">◆ {save.sp} SP</div>
          <button onClick={onClose} data-testid="st-close" style={{ padding: '6px 12px', fontSize: 12 }}>✕</button>
        </div>
        <div className="st-tabs">
          {Object.entries(SKILL_TREE).map(([key, b]) => (
            <div
              key={key}
              className={`st-tab ${branch === key ? 'active' : ''}`}
              style={{ '--c': b.color }}
              onClick={() => setBranch(key)}
              data-testid={`st-tab-${key}`}
            >
              <span style={{ fontSize: 18 }}>{b.icon}</span> {b.name}
            </div>
          ))}
        </div>
        <div className="st-grid">
          {tree.skills.map(sk => {
            const lvl = save.skills[sk.id] || 0;
            const maxed = lvl >= sk.max;
            const locked = sk.req && (!save.skills[sk.req] || save.skills[sk.req] < 1);
            return (
              <div className={`st-card ${maxed ? 'maxed' : ''} ${locked ? 'locked' : ''} ${sk.active ? 'active-skill' : ''}`} key={sk.id} data-testid={`skill-${sk.id}`}>
                <div className="st-card-h">
                  <span className="st-icon" style={{ color: tree.color }}>{sk.icon}</span>
                  <span className="st-name">{sk.name}</span>
                  <span className="st-lv">{lvl}/{sk.max}</span>
                </div>
                <div className="st-desc">{sk.desc}</div>
                {sk.active && <div className="st-tag">ACTIVE</div>}
                <div className="st-pips">
                  {Array.from({ length: sk.max }).map((_, i) => (
                    <span key={i} className={`st-pip ${i < lvl ? 'on' : ''}`} style={{ '--c': tree.color }} />
                  ))}
                </div>
                {!maxed && (
                  <button onClick={() => buy(sk)} disabled={!canBuy(sk)} data-testid={`buy-skill-${sk.id}`}>
                    ◆ {sk.costPerLvl} SP
                  </button>
                )}
                {maxed && <div className="st-maxed">MAXED</div>}
                {locked && <div className="st-locked">Requires {sk.req}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
