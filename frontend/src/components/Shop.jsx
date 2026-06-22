import React, { useState } from 'react';
import { CHESTS, rollChest, EQUIP_RARITY, EQUIP_SLOTS } from '../game/data_ext';

export default function Shop({ save, setSave, onClose }) {
  const [openedDrops, setOpenedDrops] = useState(null);
  const [opening, setOpening] = useState(false);

  const luckSkillLvl = save.skills.sk_luck || 0;
  const luck = (save.meta.m_luck || 0) * 0.5 + luckSkillLvl * 0.5;

  const open = (chest) => {
    if (save.gold < chest.cost || opening) return;
    setOpening(true);
    const drops = rollChest(chest, luck);
    setTimeout(() => {
      const ns = {
        ...save,
        gold: save.gold - chest.cost,
        inventory: [...save.inventory, ...drops],
      };
      setSave(ns);
      setOpenedDrops(drops);
      setOpening(false);
    }, 900);
  };

  const equipItem = (item) => {
    const cur = save.equipped[item.slot];
    const inv = save.inventory.filter(x => x.id !== item.id);
    if (cur) inv.push(cur);
    const ns = { ...save, inventory: inv, equipped: { ...save.equipped, [item.slot]: item } };
    setSave(ns);
  };

  const sellItem = (item) => {
    const r = EQUIP_RARITY[item.rarity];
    const val = Math.floor(50 * r.mult);
    const ns = { ...save, inventory: save.inventory.filter(x => x.id !== item.id), gold: save.gold + val };
    setSave(ns);
  };

  return (
    <div className="modal-overlay" data-testid="shop" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="shop-panel">
        <div className="forge-header">
          <div className="forge-title">📦 CHEST SHOP</div>
          <div className="forge-gold">★ {save.gold}</div>
          <button onClick={onClose} style={{ padding: '6px 12px', fontSize: 12 }}>✕</button>
        </div>

        {opening && (
          <div className="chest-opening">
            <div className="chest-anim">📦</div>
            <div className="chest-text">OPENING…</div>
          </div>
        )}

        {openedDrops && !opening && (
          <div className="chest-result">
            <div className="chest-result-title">YOU GOT</div>
            <div className="drop-row">
              {openedDrops.map((d, i) => {
                const r = EQUIP_RARITY[d.rarity];
                return (
                  <div key={i} className={`drop-item card ${r.cls}`} style={{ animationDelay: (i * 80) + 'ms' }}>
                    <div className="card-tag">{d.rarity.toUpperCase()}</div>
                    <div className="card-icon">{d.icon}</div>
                    <div className="card-name">{d.name}</div>
                    <div className="card-desc">
                      {d.stats.map((s, j) => (
                        <div key={j}>{s.stat === 'maxhp' || s.stat === 'armor' || s.stat === 'regen' ? '+' + (s.val).toFixed(1) : '+' + Math.round(s.val * 100) + '%'} {s.name}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setOpenedDrops(null)} style={{ marginTop: 14 }}>Continue</button>
          </div>
        )}

        {!opening && !openedDrops && (
          <>
            <div className="chest-row">
              {CHESTS.map(c => (
                <div key={c.id} className="chest-card" data-testid={`chest-${c.id}`}>
                  <div className="chest-icon">{c.icon}</div>
                  <div className="chest-name">{c.name}</div>
                  <div className="chest-info">
                    {Object.entries(c.rarityWeights).map(([rar, w]) => {
                      const r = EQUIP_RARITY[rar];
                      const total = Object.values(c.rarityWeights).reduce((a, b) => a + b, 0);
                      return <span key={rar} style={{ color: r.color, marginRight: 6 }}>{rar} {Math.round(w / total * 100)}%</span>;
                    })}
                  </div>
                  <button onClick={() => open(c)} disabled={save.gold < c.cost} data-testid={`open-${c.id}`}>★ {c.cost}</button>
                </div>
              ))}
            </div>

            <div className="inv-section">
              <div className="forge-title" style={{ fontSize: 16, marginTop: 18 }}>EQUIPPED</div>
              <div className="equip-row">
                {EQUIP_SLOTS.map(slot => {
                  const it = save.equipped[slot];
                  return (
                    <div key={slot} className="equip-slot">
                      <div style={{ fontSize: 12, color: 'var(--ink-dim)', textTransform: 'uppercase' }}>{slot}</div>
                      {it ? (
                        <div className={`equip-mini ${EQUIP_RARITY[it.rarity].cls}`}>
                          <div style={{ fontSize: 22 }}>{it.icon}</div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink)' }}>{it.name}</div>
                          {it.stats.map((s, j) => <div key={j} style={{ fontSize: 10, color: 'var(--ink-dim)' }}>+{s.stat === 'maxhp' || s.stat === 'armor' ? s.val.toFixed(0) : Math.round(s.val * 100) + '%'} {s.name}</div>)}
                        </div>
                      ) : <div style={{ color: 'var(--ink-dim)', fontSize: 12, padding: 12 }}>— empty —</div>}
                    </div>
                  );
                })}
              </div>

              <div className="forge-title" style={{ fontSize: 16, marginTop: 18 }}>INVENTORY ({save.inventory.length})</div>
              <div className="inv-row">
                {save.inventory.length === 0 && <div style={{ color: 'var(--ink-dim)', fontSize: 13, padding: 14 }}>Empty. Open chests to get gear.</div>}
                {save.inventory.map(it => (
                  <div key={it.id} className={`drop-item card ${EQUIP_RARITY[it.rarity].cls}`} style={{ width: 160, minHeight: 'auto', padding: 10 }}>
                    <div className="card-tag">{it.rarity.toUpperCase()}</div>
                    <div className="card-icon" style={{ fontSize: 32 }}>{it.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>{it.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-dim)' }}>{it.slot}</div>
                    {it.stats.map((s, j) => <div key={j} style={{ fontSize: 10, color: 'var(--ink)' }}>+{s.stat === 'maxhp' || s.stat === 'armor' ? s.val.toFixed(0) : Math.round(s.val * 100) + '%'} {s.name}</div>)}
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <button onClick={() => equipItem(it)} style={{ padding: '4px 6px', fontSize: 10, flex: 1 }}>Equip</button>
                      <button onClick={() => sellItem(it)} style={{ padding: '4px 6px', fontSize: 10 }}>Sell</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
