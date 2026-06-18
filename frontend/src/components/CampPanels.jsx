// Combined extended Camp panels in one file to save bundle weight.
import React, { useState, useEffect } from 'react';
import { MISSION_DEFS, MISSION_DAILY_LIMIT, MISSION_REGEN_MS, rollMissionRewards, ACHIEVEMENTS, CHALLENGES, STAGES, MILESTONE_BAR, SHOP_CARD_POOL, shopCardCost, rollShopPull, ACTIVE_SKILLS, ACTIVE_SKILL_KEYS, ADVANCED_CARDS, STARTER_WEAPONS, PART_RARITY_COLORS, PART_SLOTS, PART_SLOT_INFO, STAT_DISPLAY, rollPart } from '../game/data_ext2';
import { Audio } from '../game/audio';
import { accountXpToNext } from '../game/data_ext';

const PART_RAR_CLS = { common: 'r-common', magic: 'r-magic', rare: 'r-rare', epic: 'r-epic', legendary: 'r-legendary' };

// ---------- Missions ----------
export function MissionsPanel({ save, setSave, onStart }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(id); }, []);
  // Regen energy by elapsed time
  useEffect(() => {
    const me = save.missionEnergy || { uses: 0, lastRegen: Date.now() };
    const now = Date.now();
    let uses = me.uses || 0; let last = me.lastRegen || now;
    while (uses > 0 && now - last >= MISSION_REGEN_MS) { uses -= 1; last += MISSION_REGEN_MS; }
    if (uses !== (me.uses || 0)) setSave({ ...save, missionEnergy: { uses, lastRegen: last } });
    // eslint-disable-next-line
  }, [tick]);
  const me = save.missionEnergy || { uses: 0, lastRegen: Date.now() };
  const energyLeft = MISSION_DAILY_LIMIT - (me.uses || 0);
  const nextRegen = me.uses > 0 ? Math.max(0, MISSION_REGEN_MS - (Date.now() - me.lastRegen)) : 0;

  const begin = (m) => {
    if (energyLeft <= 0) return;
    const ns = { ...save, missionEnergy: { uses: (me.uses || 0) + 1, lastRegen: me.uses === 0 ? Date.now() : me.lastRegen } };
    setSave(ns);
    Audio.click();
    onStart(m);
  };

  const fmt = (ms) => {
    const s = Math.floor(ms / 1000); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const ss = s % 60;
    return `${h}h ${m}m ${ss}s`;
  };

  return (
    <>
      <div className="camp-header">
        <h1>Daily Missions</h1>
        <div className="camp-currency">
          <span style={{ color: 'var(--rune)' }}>⚡ {energyLeft}/{MISSION_DAILY_LIMIT}</span>
          {energyLeft < MISSION_DAILY_LIMIT && <span style={{ color: 'var(--ink-dim)', fontSize: 14 }}>next in {fmt(nextRegen)}</span>}
        </div>
      </div>
      <div className="upgrade-grid">
        {MISSION_DEFS.map(m => (
          <div className="upgrade-card" key={m.id} data-testid={`mission-${m.id}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 28 }}>{m.icon}</div>
              <div>
                <div className="name">{m.name}</div>
                <div className="lvl">STAGE {m.stage} · {Math.floor(m.duration / 60)}m {m.duration % 60}s</div>
              </div>
            </div>
            <div className="desc">{m.desc}</div>
            <div style={{ fontSize: 13, color: 'var(--accent-2)' }}>
              📜 Blueprint shards × {m.reward.blueprintShards.count}<br />
              {Object.entries(m.reward.parts).map(([rar, n]) => <span key={rar} style={{ color: PART_RARITY_COLORS[rar], marginRight: 6 }}>{n}× {rar}</span>)}
              <br />★ {m.reward.gold} gold
            </div>
            <button onClick={() => begin(m)} disabled={energyLeft <= 0} data-testid={`begin-${m.id}`}>▸ DEPLOY</button>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------- Challenges ----------
export function ChallengesPanel({ save, setSave, onStart }) {
  return (
    <>
      <div className="camp-header">
        <h1>Challenges</h1>
        <div className="camp-currency"><span className="gold">★ {save.gold}</span></div>
      </div>
      <div className="upgrade-grid">
        {CHALLENGES.map(c => {
          const completed = (save.challengesDone || {})[c.id];
          return (
            <div className="upgrade-card" key={c.id} data-testid={`ch-${c.id}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 30 }}>{c.icon}</div>
                <div className="name">{c.name}</div>
              </div>
              <div className="desc">{c.desc}</div>
              <div style={{ fontSize: 13, color: 'var(--accent-2)' }}>★ {c.rwd.gold} · ◆ {c.rwd.sp} SP</div>
              {completed && <div style={{ color: 'var(--rune)', fontSize: 11, letterSpacing: '0.2em' }}>✓ COMPLETED</div>}
              <button onClick={() => { Audio.click(); onStart(c); }} data-testid={`begin-ch-${c.id}`}>▸ ATTEMPT</button>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ---------- Achievements ----------
export function AchievementsPanel({ save, setSave }) {
  const getMetric = (k) => {
    if (k === 'skillsLearned') return Object.values(save.skills || {}).reduce((a, b) => a + b, 0);
    if (k === 'activeSkillsCount') return (save.equippedActives || []).filter(Boolean).length;
    if (k === 'weaponsCrafted') return Object.keys(save.craftedWeapons || {}).length;
    if (k === 'challengesCompleted') return Object.keys(save.challengesDone || {}).length;
    if (k === 'dailyStreak') return save.daily.streak || 0;
    if (k === 'legendaryPartsFound') return save.legendaryPartsFound || 0;
    if (k === 'chestsOpened') return save.chestsOpened || 0;
    if (k === 'lifetimeGold') return save.lifetimeGold || save.gold || 0;
    if (k === 'noHitRuns') return save.noHitRuns || 0;
    return save[k] || 0;
  };
  const claim = (a) => {
    const cl = save.achClaimed || {};
    if (cl[a.id]) return;
    if (getMetric(a.metric) < a.goal) return;
    const ns = { ...save, achClaimed: { ...cl, [a.id]: true } };
    if (a.rwd.gold) ns.gold = (ns.gold || 0) + a.rwd.gold;
    if (a.rwd.sp) ns.sp = (ns.sp || 0) + a.rwd.sp;
    setSave(ns);
    Audio.levelUp();
  };
  return (
    <>
      <div className="camp-header"><h1>Achievements</h1></div>
      <div className="upgrade-grid">
        {ACHIEVEMENTS.map(a => {
          const v = getMetric(a.metric);
          const done = v >= a.goal;
          const claimed = (save.achClaimed || {})[a.id];
          const pct = Math.min(100, (v / a.goal) * 100);
          return (
            <div className="upgrade-card" key={a.id} data-testid={`ach-${a.id}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 26 }}>{a.icon}</div>
                <div className="name">{a.name}</div>
              </div>
              <div className="desc">{a.desc}</div>
              <div className="hud-xpbar"><div className="hud-xpbar-fill" style={{ width: pct + '%' }} /></div>
              <div className="lvl">{Math.min(v, a.goal)} / {a.goal}</div>
              <div style={{ fontSize: 12, color: 'var(--accent-2)' }}>
                {a.rwd.gold && `★ ${a.rwd.gold}`} {a.rwd.sp && `◆ ${a.rwd.sp} SP`}
              </div>
              {claimed ? <div style={{ color: 'var(--rune)', fontSize: 11 }}>✓ CLAIMED</div> :
                <button onClick={() => claim(a)} disabled={!done} data-testid={`claim-ach-${a.id}`}>{done ? '✓ CLAIM' : 'LOCKED'}</button>}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ---------- Milestone Bar (account level rewards) ----------
export function MilestoneBar({ save, setSave }) {
  const level = save.profile.level;
  const claim = (m) => {
    const cl = save.milestoneBar || {};
    if (cl[m.atLevel] || level < m.atLevel) return;
    const ns = { ...save, milestoneBar: { ...cl, [m.atLevel]: true } };
    if (m.rwd.gold) ns.gold = (ns.gold || 0) + m.rwd.gold;
    if (m.rwd.sp) ns.sp = (ns.sp || 0) + m.rwd.sp;
    setSave(ns); Audio.levelUp();
  };
  return (
    <div className="milestone-bar" data-testid="milestone-bar">
      {MILESTONE_BAR.map(m => {
        const reached = level >= m.atLevel;
        const claimed = (save.milestoneBar || {})[m.atLevel];
        return (
          <div key={m.atLevel} className={`ms-pip ${reached ? 'reached' : ''} ${claimed ? 'claimed' : ''}`} onClick={() => claim(m)} data-testid={`ms-${m.atLevel}`}>
            <div className="ms-lvl">LV{m.atLevel}</div>
            <div className="ms-rwd">{m.rwd.gold && `★${m.rwd.gold}`}<br />{m.rwd.sp && `◆${m.rwd.sp}`}{m.rwd.chest && ` 📦`}</div>
            {claimed ? <div className="ms-status">✓</div> : reached && <div className="ms-status pulse">CLAIM</div>}
          </div>
        );
      })}
    </div>
  );
}

// ---------- Card Shop (Slot Machine) ----------
const REEL_ICONS = ['💧', '⚔️', '⭐', '💎', '🎰', '🌟', '🔮', '⚡', '🛡', '❤️'];
const REEL_RARITIES = ['common', 'magic', 'rare', 'epic', 'legendary'];

export function CardShopModal({ save, setSave, onClose }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  // Three reels (slot machine row), each cycles independently then stops
  const [reels, setReels] = useState(['💧', '⚔️', '⭐']);
  const [stopped, setStopped] = useState([true, true, true]);
  const [reelRarity, setReelRarity] = useState('common');
  const pullCount = save.shopPulls || 0;
  const cost = shopCardCost(pullCount);
  const luck = (save.meta.m_luck || 0) * 0.5 + (save.skills.sk_luck || 0) * 0.5;

  const pull = () => {
    if (save.gold < cost || spinning) return;
    setSpinning(true); setResult(null);
    setStopped([false, false, false]);
    setReelRarity('common');
    Audio.click();
    // Pre-roll the actual card outcome so we can animate to it
    const card = rollShopPull(luck);
    // Animate three reels with staggered stop times for dopamine anticipation
    const reelIntervals = [];
    let i = 0;
    reelIntervals.push(setInterval(() => {
      setReels(prev => [REEL_ICONS[(i + 0) % REEL_ICONS.length], prev[1], prev[2]]);
      i++;
    }, 65));
    reelIntervals.push(setInterval(() => {
      setReels(prev => [prev[0], REEL_ICONS[(i + 3) % REEL_ICONS.length], prev[2]]);
    }, 80));
    reelIntervals.push(setInterval(() => {
      setReels(prev => [prev[0], prev[1], REEL_ICONS[(i + 7) % REEL_ICONS.length]]);
    }, 95));
    // Rarity ticker (for the highlight color)
    const rarityTicker = setInterval(() => {
      const idx = Math.floor(Math.random() * REEL_RARITIES.length);
      setReelRarity(REEL_RARITIES[idx]);
      Audio.click();
    }, 130);

    // Stop first reel
    setTimeout(() => {
      clearInterval(reelIntervals[0]);
      setReels(prev => [card.icon, prev[1], prev[2]]);
      setStopped(s => [true, s[1], s[2]]);
      try { Audio.hit && Audio.hit(); } catch (e) {}
    }, 900);
    // Stop second reel
    setTimeout(() => {
      clearInterval(reelIntervals[1]);
      setReels(prev => [prev[0], card.icon, prev[2]]);
      setStopped(s => [s[0], true, s[2]]);
      try { Audio.hit && Audio.hit(); } catch (e) {}
    }, 1450);
    // Stop third reel — moment of truth!
    setTimeout(() => {
      clearInterval(reelIntervals[2]);
      clearInterval(rarityTicker);
      setReels(prev => [prev[0], prev[1], card.icon]);
      setStopped([true, true, true]);
      setReelRarity(card.rarity);
      setResult(card);
      Audio.levelUp();
      const ns = { ...save, gold: save.gold - cost, shopPulls: pullCount + 1 };
      if (card.effect.unlockSkill) {
        ns.unlockedActives = { ...(ns.unlockedActives || {}), [card.effect.unlockSkill]: true };
      } else if (card.effect.stat) {
        ns.shopBonuses = { ...(ns.shopBonuses || {}) };
        const k = card.effect.stat;
        ns.shopBonuses[k] = (ns.shopBonuses[k] || 0) + (card.finalEffect.amount || 0);
      }
      setSave(ns);
      setSpinning(false);
    }, 2100);
  };

  const rarityCls = PART_RAR_CLS[reelRarity] || '';

  return (
    <div className="modal-overlay" data-testid="card-shop" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="forge-panel cs-modal" style={{ maxWidth: 680, textAlign: 'center' }}>
        <div className="forge-header">
          <div className="forge-title">🎰 CARD SHOP</div>
          <div className="forge-gold">★ {save.gold}</div>
          <button onClick={onClose} style={{ padding: '6px 12px', fontSize: 12 }}>✕</button>
        </div>
        <div style={{ color: 'var(--ink-dim)', fontFamily: 'VT323', marginBottom: 14 }}>Pull {pullCount + 1} · luck {luck.toFixed(1)}</div>

        {/* 3-reel slot frame */}
        <div className={`slot-frame ${rarityCls} ${spinning ? 'cs-shake' : ''} ${result && result.rarity === 'legendary' ? 'cs-jackpot' : ''}`}>
          <div className="slot-window" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(80px, 1fr))',
            gap: 8,
            background: '#06040a',
            border: '2px solid #000',
            padding: 8,
            margin: '0 auto 12px',
            width: '100%',
            maxWidth: 420,
            boxShadow: 'inset 0 0 0 1px #ffffff10',
          }}>
            {[0, 1, 2].map(idx => (
              <div key={idx} className={`slot-cell ${stopped[idx] ? 'stopped' : 'spinning'} ${result && stopped[idx] ? 'cs-glow ' + (PART_RAR_CLS[reelRarity] || '') : ''}`} style={{
                background: 'linear-gradient(180deg, #141826 0%, #06080f 100%)',
                border: '1px solid #ffffff15',
                minHeight: 100,
                height: 100,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div className="slot-icon" style={{ fontSize: 54, textShadow: '0 2px 8px #000a' }}>{reels[idx]}</div>
              </div>
            ))}
          </div>
          {result && (
            <div className="cs-result" data-testid="cs-result">
              <div className="card-tag" style={{ marginBottom: 4 }}>{(result.rarity || '').toUpperCase()}</div>
              <div className="card-name" style={{ fontSize: 22, marginBottom: 4 }}>{result.name}</div>
              <div className="card-desc">
                {result.effect.unlockSkill ? `New active skill: ${ACTIVE_SKILLS[result.effect.unlockSkill].name}` :
                  `Permanent +${result.finalEffect.amount}${result.effect.stat === 'maxHp' || result.effect.stat === 'armor' ? '' : '%'} ${result.effect.stat}`}
              </div>
            </div>
          )}
          {!result && spinning && (
            <div className="cs-status" data-testid="cs-status">
              <span className="cs-suspense">SPINNING…</span>
            </div>
          )}
          {!result && !spinning && (
            <div className="cs-status" data-testid="cs-idle">
              <span>READY · PRESS PULL</span>
            </div>
          )}
        </div>

        <button onClick={pull} disabled={save.gold < cost || spinning} style={{ marginTop: 18, width: '100%' }} data-testid="shop-pull">
          ★ {cost} — {spinning ? 'PULLING…' : `PULL #${pullCount + 1}`}
        </button>
        {save.shopBonuses && Object.keys(save.shopBonuses).length > 0 && (
          <div style={{ marginTop: 14, padding: 10, background: '#0e0816', border: '1px solid #000' }}>
            <div style={{ color: 'var(--accent-2)', fontSize: 12, letterSpacing: '0.2em' }}>YOUR PERMANENT BONUSES</div>
            <div style={{ fontFamily: 'VT323', fontSize: 14, color: 'var(--ink)', marginTop: 6 }}>
              {Object.entries(save.shopBonuses).map(([k, v]) => (
                <span key={k} style={{ marginRight: 12 }}>{k}: +{Math.round(v * 100) / 100}{k === 'maxHp' || k === 'armor' ? '' : '%'}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Active Skill Loadout ----------
export function ActiveLoadoutPanel({ save, setSave, onClose }) {
  const unlocked = Object.keys(save.unlockedActives || {});
  const equipped = save.equippedActives || [null, null, null, null];

  const equipAt = (slot, id) => {
    const eq = [...equipped]; eq[slot] = eq[slot] === id ? null : id;
    setSave({ ...save, equippedActives: eq });
  };

  return (
    <div className="modal-overlay" data-testid="loadout" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="forge-panel" style={{ maxWidth: 720 }}>
        <div className="forge-header">
          <div className="forge-title">🎯 ACTIVE SKILL LOADOUT</div>
          <button onClick={onClose} style={{ padding: '6px 12px', fontSize: 12 }}>✕</button>
        </div>
        <div style={{ color: 'var(--ink-dim)', fontFamily: 'VT323', marginBottom: 14, fontSize: 15 }}>Equip up to 4 active skills. Use keys 1-4 or touch buttons in-game.</div>
        <div className="loadout-row">
          {equipped.map((id, i) => (
            <div key={i} className={`loadout-slot ${id ? 'eq' : ''}`}>
              <div className="ls-key">{i + 1}</div>
              {id ? <>
                <div className="ls-icon">{ACTIVE_SKILLS[id].icon}</div>
                <div className="ls-name">{ACTIVE_SKILLS[id].name}</div>
              </> : <div style={{ color: 'var(--ink-dim)' }}>empty</div>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18, color: 'var(--accent-2)', letterSpacing: '0.2em', fontSize: 13 }}>UNLOCKED SKILLS</div>
        {unlocked.length === 0 && <div style={{ color: 'var(--ink-dim)', fontFamily: 'VT323', padding: 12 }}>None yet — pull cards in the Card Shop to unlock active skills.</div>}
        <div className="upgrade-grid" style={{ marginTop: 8 }}>
          {unlocked.map(id => {
            const sk = ACTIVE_SKILLS[id];
            const eqSlot = equipped.indexOf(id);
            return (
              <div key={id} className="upgrade-card">
                <div className="name">{sk.icon} {sk.name}</div>
                <div className="desc">{sk.desc}</div>
                <div className="lvl">CD {sk.cd}s</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {[0, 1, 2, 3].map(i => (
                    <button key={i} onClick={() => equipAt(i, id)} style={{ padding: '4px 8px', fontSize: 11, borderColor: equipped[i] === id ? 'var(--accent)' : undefined }} data-testid={`equip-${id}-${i}`}>
                      {equipped[i] === id ? `✓ Slot ${i + 1}` : `Slot ${i + 1}`}
                    </button>
                  ))}
                </div>
                {eqSlot >= 0 && <div style={{ color: 'var(--rune)', fontSize: 11, letterSpacing: '0.2em' }}>EQUIPPED #{eqSlot + 1}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Blueprints / Weapons Crafting ----------
export function WeaponCrafting({ save, setSave, onClose }) {
  const shards = save.blueprintShards || {};
  const crafted = save.craftedWeapons || {};
  const craft = (id) => {
    const def = STARTER_WEAPONS[id]; if (!def || crafted[id]) return;
    const have = shards[id] || 0;
    if (have < def.blueprintCost) return;
    const ns = { ...save, blueprintShards: { ...shards, [id]: have - def.blueprintCost }, craftedWeapons: { ...crafted, [id]: true } };
    setSave(ns); Audio.blueprint();
  };
  const weapons = Object.keys(STARTER_WEAPONS).filter(k => k !== 'hydropistol');
  return (
    <div className="modal-overlay" data-testid="craft" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="forge-panel" style={{ maxWidth: 760 }}>
        <div className="forge-header">
          <div className="forge-title">📜 WEAPON BLUEPRINTS</div>
          <button onClick={onClose} style={{ padding: '6px 12px', fontSize: 12 }}>✕</button>
        </div>
        <div style={{ color: 'var(--ink-dim)', fontFamily: 'VT323', marginBottom: 10, fontSize: 14 }}>Collect blueprint shards in missions. Craft starter weapons.</div>
        <div className="upgrade-grid">
          {weapons.map(id => {
            const def = STARTER_WEAPONS[id];
            const have = shards[id] || 0;
            const c = crafted[id];
            const pct = Math.min(100, (have / def.blueprintCost) * 100);
            return (
              <div className="upgrade-card" key={id} data-testid={`craft-${id}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 32 }}>{def.icon}</div>
                  <div>
                    <div className="name">{def.name}</div>
                    <div className="lvl">{have} / {def.blueprintCost}</div>
                  </div>
                </div>
                <div className="desc">{def.desc}</div>
                <div className="hud-xpbar"><div className="hud-xpbar-fill" style={{ width: pct + '%' }} /></div>
                {c ? <div style={{ color: 'var(--accent-2)' }}>✓ CRAFTED</div> :
                  <button onClick={() => craft(id)} disabled={have < def.blueprintCost} data-testid={`btn-craft-${id}`}>FORGE</button>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Settings ----------
export function SettingsPanel({ save, setSave, onClose }) {
  const set = (k, v) => setSave({ ...save, settings: { ...(save.settings || {}), [k]: v } });
  const s = save.settings || {};
  useEffect(() => { Audio.setSfxVol(s.sfx ?? 0.4); Audio.setMusicVol(s.music ?? 0.15); Audio.setMuted(s.muted ?? false); }, [s.sfx, s.music, s.muted]);
  return (
    <div className="modal-overlay" data-testid="settings" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="forge-panel" style={{ maxWidth: 480 }}>
        <div className="forge-header">
          <div className="forge-title">⚙ SETTINGS</div>
          <button onClick={onClose} style={{ padding: '6px 12px', fontSize: 12 }}>✕</button>
        </div>
        <div className="setting-row"><span>SFX Volume</span><input type="range" min="0" max="1" step="0.05" value={s.sfx ?? 0.4} onChange={(e) => set('sfx', +e.target.value)} /></div>
        <div className="setting-row"><span>Music Volume</span><input type="range" min="0" max="1" step="0.05" value={s.music ?? 0.15} onChange={(e) => set('music', +e.target.value)} /></div>
        <div className="setting-row"><span>Mute All</span><input type="checkbox" checked={s.muted ?? false} onChange={(e) => set('muted', e.target.checked)} /></div>
        <div className="setting-row"><span>Screen Shake</span><input type="checkbox" checked={s.shake ?? true} onChange={(e) => set('shake', e.target.checked)} /></div>
        <div className="setting-row"><span>Particle Density</span>
          <select value={s.particles ?? 'high'} onChange={(e) => set('particles', e.target.value)}>
            <option value="low">Low (mobile)</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ---------- Inventory / Parts equipper ----------
export function PartsInventory({ save, setSave, onClose }) {
  const parts = save.parts || [];
  const equipped = save.equippedParts || {}; // { weaponId: { slot: partId } }
  const [wid, setWid] = useState(Object.keys(STARTER_WEAPONS)[0]);
  const cw = save.craftedWeapons || { hydropistol: true };
  const weaponList = Object.keys(STARTER_WEAPONS).filter(k => k === 'hydropistol' || cw[k]);
  const equipPart = (part) => {
    const cur = { ...(equipped[wid] || {}) };
    cur[part.slot] = part.id;
    setSave({ ...save, equippedParts: { ...equipped, [wid]: cur } });
    Audio.click();
  };
  const unequipSlot = (slot) => {
    const cur = { ...(equipped[wid] || {}) };
    delete cur[slot];
    setSave({ ...save, equippedParts: { ...equipped, [wid]: cur } });
  };
  const sellPart = (part) => {
    const val = ({ common: 20, magic: 60, rare: 200, epic: 800, legendary: 3000 })[part.rarity] || 10;
    const inv = parts.filter(p => p.id !== part.id);
    const cleared = { ...equipped };
    for (const w of Object.keys(cleared)) if (cleared[w] && cleared[w][part.slot] === part.id) delete cleared[w][part.slot];
    setSave({ ...save, parts: inv, gold: (save.gold || 0) + val, equippedParts: cleared });
  };
  return (
    <div className="modal-overlay" data-testid="parts-inv" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="forge-panel">
        <div className="forge-header">
          <div className="forge-title">🔧 PARTS WORKSHOP</div>
          <div className="forge-gold">★ {save.gold}</div>
          <button onClick={onClose} style={{ padding: '6px 12px', fontSize: 12 }}>✕</button>
        </div>
        <div className="forge-weapons">
          {weaponList.map(id => (
            <div key={id} className={`forge-wch ${wid === id ? 'sel' : ''}`} onClick={() => setWid(id)} data-testid={`pi-w-${id}`}>
              <div style={{ fontSize: 26 }}>{STARTER_WEAPONS[id].icon}</div>
              <div style={{ fontSize: 10 }}>{STARTER_WEAPONS[id].name}</div>
            </div>
          ))}
        </div>
        <div className="forge-name">{STARTER_WEAPONS[wid].icon} {STARTER_WEAPONS[wid].name}</div>
        <div style={{ marginTop: 10, marginBottom: 8, color: 'var(--accent-2)', letterSpacing: '0.2em', fontSize: 13 }}>EQUIPPED PARTS</div>
        <div className="parts-slots">
          {PART_SLOTS.map(slot => {
            const eqId = (equipped[wid] || {})[slot];
            const part = parts.find(p => p.id === eqId);
            return (
              <div key={slot} className="part-slot">
                <div className="ps-name">{PART_SLOT_INFO[slot].icon} {slot}</div>
                {part ? (
                  <div className={`part-chip ${PART_RAR_CLS[part.rarity]}`} onClick={() => unequipSlot(slot)}>
                    <div style={{ fontWeight: 800 }}>{part.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-dim)' }}>+{Math.round(part.primary.val * 100) / 100} {STAT_DISPLAY[part.primary.stat] || part.primary.stat}</div>
                  </div>
                ) : <div className="ps-empty">— empty —</div>}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, color: 'var(--accent-2)', letterSpacing: '0.2em', fontSize: 13 }}>INVENTORY ({parts.length})</div>
        {parts.length === 0 && <div style={{ color: 'var(--ink-dim)', fontFamily: 'VT323', padding: 10 }}>No parts yet. Run missions to find some.</div>}
        <div className="inv-row">
          {parts.map(p => (
            <div className={`part-chip ${PART_RAR_CLS[p.rarity]}`} key={p.id} data-testid={`part-${p.id}`}>
              <div style={{ fontWeight: 800, fontSize: 11 }}>{p.name}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-dim)' }}>{p.slot}</div>
              <div style={{ fontSize: 10 }}>+{Math.round(p.primary.val * 100) / 100} {STAT_DISPLAY[p.primary.stat] || p.primary.stat}</div>
              {p.sub.map((s, i) => <div key={i} style={{ fontSize: 10, color: 'var(--ink-dim)' }}>+{Math.round(s.val * 100) / 100} {STAT_DISPLAY[s.stat] || s.stat}</div>)}
              <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                <button onClick={() => equipPart(p)} style={{ padding: '3px 5px', fontSize: 10 }}>Equip</button>
                <button onClick={() => sellPart(p)} style={{ padding: '3px 5px', fontSize: 10 }}>Sell</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
