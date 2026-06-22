import React, { useState } from 'react';
import { TALENT_NODES } from '../game/data_ext2';
import { Audio } from '../game/audio';

export default function TalentTree({ save, setSave, onClose }) {
  const [popNode, setPopNode] = useState(null);
  const talent = save.talent || {};

  const isPurchased = (id) => !!talent[id];
  const canBuy = (node, idx) => {
    if (isPurchased(node.id)) return false;
    if ((save.gold || 0) < node.cost) return false;
    if (idx === 0) return true;
    return isPurchased(TALENT_NODES[idx - 1].id);
  };

  const buy = (node, idx) => {
    if (!canBuy(node, idx)) return;
    const tb = { ...(save.talentBonuses || {}) };
    if (node.stat === 'all') {
      ['maxHp', 'dmg', 'mspd', 'gold', 'xp', 'crit'].forEach(s => { tb[s] = (tb[s] || 0) + node.val; });
    } else {
      tb[node.stat] = (tb[node.stat] || 0) + node.val;
    }
    setSave({ ...save, gold: save.gold - node.cost, talent: { ...talent, [node.id]: true }, talentBonuses: tb });
    Audio.click();
    setPopNode(node.id);
    setTimeout(() => setPopNode(null), 600);
  };

  const boughtCount = Object.keys(talent).length;

  return (
    <div className="modal-overlay" data-testid="talent-tree" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="forge-panel" style={{ maxWidth: 620, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        <div className="forge-header">
          <div className="forge-title">🌿 TALENT TREE</div>
          <div style={{ fontFamily: 'VT323', color: 'var(--ink-dim)', fontSize: 15, marginRight: 8 }}>
            {boughtCount}/{TALENT_NODES.length} · ★ {save.gold}
          </div>
          <button onClick={onClose} style={{ padding: '6px 12px', fontSize: 12 }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 4px' }}>
          <div className="talent-grid">
            {TALENT_NODES.map((node, idx) => {
              const bought = isPurchased(node.id);
              const available = canBuy(node, idx);
              const locked = !bought && !available;
              const prevBought = idx === 0 || isPurchased(TALENT_NODES[idx - 1].id);
              const statDisplay = node.stat === 'all'
                ? '+all'
                : ['maxHp', 'armor'].includes(node.stat) ? `+${node.val}` : `+${Math.round(node.val * 100)}%`;

              return (
                <div key={node.id} className={`talent-node${bought ? ' bought' : ''}${available ? ' available' : ''}${locked ? ' locked' : ''}${node.milestone ? ' milestone' : ''}${popNode === node.id ? ' card-pop' : ''}`}
                  onClick={() => buy(node, idx)} data-testid={`talent-${node.id}`}>
                  {idx > 0 && (
                    <div className={`talent-line ${prevBought ? 'lit' : ''}`} />
                  )}
                  <div className="talent-icon">{node.icon}</div>
                  <div className="talent-name">{node.name}</div>
                  <div className="talent-stat">{statDisplay}</div>
                  {!bought && !locked && <div className="talent-cost">★ {node.cost}</div>}
                  {bought && <div className="talent-done">✓</div>}
                  {locked && <div className="talent-locked">🔒</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
