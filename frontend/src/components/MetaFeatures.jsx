import React, { useMemo } from 'react';
import { ENEMIES } from '../game/data';
import { STARTER_WEAPONS } from '../game/data_ext2';

// Battle Pass reward track — 40 nodes
const BP_REWARDS = Array.from({ length: 40 }, (_, i) => {
  const n = i + 1;
  // Spread reward types across the track
  if (n % 20 === 0) return { type: 'gem', amount: 20, icon: '💎', label: `${20} Gems` };
  if (n % 10 === 0) return { type: 'shard', amount: 1, icon: '🔮', label: `Shard` };
  if (n % 5 === 0) return { type: 'slot', amount: 3, icon: '🎰', label: `3 Slot Coins` };
  if (n % 4 === 0) return { type: 'gold', amount: 500 + n * 50, icon: '💰', label: `${500 + n * 50} Gold` };
  if (n % 3 === 0) return { type: 'gem', amount: 5, icon: '💎', label: `5 Gems` };
  if (n % 2 === 0) return { type: 'talent', amount: 5, icon: '◆', label: `5 Talent Pts` };
  return { type: 'gold', amount: 200 + n * 20, icon: '💰', label: `${200 + n * 20} Gold` };
});

const XP_PER_NODE = 200; // profile XP needed per node

// Codex data source
const ALL_ENEMY_IDS = Object.keys(ENEMIES).filter(id => !ENEMIES[id].boss);
const ALL_BOSS_IDS  = Object.keys(ENEMIES).filter(id => ENEMIES[id].boss);
const ALL_WEAPON_IDS = Object.keys(STARTER_WEAPONS || {});

// ─── BATTLE PASS ─────────────────────────────────────────
export function BattlePassPanel({ save, setSave }) {
  const claimed   = save.battlePass?.claimed || [];
  const profileXp = save.profile?.xp || 0;
  const reachedNode = Math.floor(profileXp / XP_PER_NODE);

  const claim = (i) => {
    if (i > reachedNode) return;
    if (claimed.includes(i)) return;
    const rwd = BP_REWARDS[i];
    let next = { ...save, battlePass: { claimed: [...claimed, i] } };
    if (rwd.type === 'gold')   next.gold = (next.gold || 0) + rwd.amount;
    if (rwd.type === 'gem')    next.gems = (next.gems || 0) + rwd.amount;
    if (rwd.type === 'slot')   next.slotCoins = (next.slotCoins || 0) + rwd.amount;
    if (rwd.type === 'talent') next.talentPoints = (next.talentPoints || 0) + rwd.amount;
    if (rwd.type === 'shard')  next.character = { ...next.character, shards: (next.character?.shards || 0) + rwd.amount };
    setSave(next);
  };

  const unclaimed = BP_REWARDS.map((_, i) => i <= reachedNode && !claimed.includes(i)).filter(Boolean).length;

  return (
    <div className="bp-panel" data-testid="bp-panel">
      <div className="bp-header">
        <span className="bp-title">SEASON PASS</span>
        <span className="bp-progress">Profile XP: {profileXp} / {BP_REWARDS.length * XP_PER_NODE}</span>
        {unclaimed > 0 && <span className="bp-unclaimed">{unclaimed} rewards ready!</span>}
      </div>
      <div className="bp-desc">Earn XP by completing runs. Each {XP_PER_NODE} XP unlocks a reward node.</div>
      <div className="bp-track" data-testid="bp-track">
        {BP_REWARDS.map((rwd, i) => {
          const reached  = i <= reachedNode;
          const isClaimed = claimed.includes(i);
          const canClaim  = reached && !isClaimed;
          return (
            <div
              key={i}
              className={`bp-node ${reached ? 'reached' : ''} ${isClaimed ? 'claimed' : ''} ${canClaim ? 'claimable' : ''}`}
              onClick={() => canClaim && claim(i)}
              data-testid={`bp-node-${i}`}
            >
              <span className="bp-node-icon">{rwd.icon}</span>
              <span className="bp-node-label">{rwd.label}</span>
              {isClaimed && <span className="bp-check">✓</span>}
              {canClaim  && <span className="bp-glow-ring" />}
              <span className="bp-node-num">{i + 1}</span>
            </div>
          );
        })}
      </div>
      <div className="bp-footer">
        <div style={{ color:'#4a3a6e', fontSize:10, letterSpacing:'.1em' }}>
          XP gained per run · Profile XP carries forward across sessions
        </div>
      </div>
    </div>
  );
}

// ─── CODEX LIBRARY ────────────────────────────────────────
const ENEMY_LORE = {
  slime:         'A simple gelatinous organism mutated by Lake contamination. Weak but numerous.',
  bat:           'Voidbat — phase-shifted creature drawn to dimensional rifts. Fast and unpredictable.',
  brute:         'Mutant humanoid reinforced by crystallized water. Slow but devastating.',
  ranger:        'A corrupted soldier armed with liquid-nitrogen projectile launchers.',
  charger:       'Void-energy overload turns this creature into a living battering ram.',
  ghoul:         'Undead water-walker. Killed before — won\'t stay dead. Mediocre at best.',
  necron:        'Necron: a mini-boss type that survived multiple extinction cycles. Treat with respect.',
  crystalite:    'Crystal-armored insectoid. Energy attacks bounce off. Use kinetic weapons.',
  soulshard:     'Fragmented consciousness crystallized into razor-sharp shards. Immune to knockback.',
  bonewalker:    'Animated skeletal architecture that regenerates faster than you can break it.',
  voidspawn:     'Born directly from a void fracture. Rapid and vicious. Does not negotiate.',
  steelbrute:    'Bio-mechanical juggernaut. The armored result of failed experiments on Brutes.',
  lightningbug:  'Overcharged insectoid. When it dies, it discharges. Try not to be near.',
  techsoldier:   'Military-grade automaton. Fires tracking rounds. Priority target.',
  nanoswarm:     'Microscopic killer-bots organized into a lethal swarm. Fragile individually, deadly in numbers.',
  bossOcular:    'The Eye of Horus — an ancient surveillance construct awakened by the Lake\'s awakening.',
  bossNecromancer:'Nekromansen — a failed immortality experiment that now feeds on death itself.',
  bossVoidTitan: 'The Void Titan. Presence alone warps spacetime. The Lake is its egg.',
  bossAida:      'A.I.D.A. — Adaptive Intelligence Defense Array. Created to protect the Lake. It has other plans.',
};

export function CodexPanel({ save, setSave }) {
  const codex = save.codex || {};
  const killedEnemies = codex.enemies || {};
  const usedWeapons   = codex.weapons || {};

  const allEnemies = [...ALL_ENEMY_IDS, ...ALL_BOSS_IDS];
  const totalDiscovered = Object.keys(killedEnemies).length + Object.keys(usedWeapons).length;

  const [tab, setTabC] = React.useState('enemies');

  return (
    <div className="codex-panel" data-testid="codex-panel">
      <div className="codex-header">
        <span className="codex-title">CODEX</span>
        <span className="codex-count">{totalDiscovered} entries discovered</span>
      </div>
      <div className="codex-tabs">
        {[['enemies','ENEMIES'],['bosses','BOSSES'],['weapons','WEAPONS']].map(([k,l])=>(
          <button key={k} className={`codex-tab ${tab===k?'active':''}`} onClick={() => setTabC(k)}>{l}</button>
        ))}
      </div>

      {tab === 'enemies' && (
        <div className="codex-grid">
          {ALL_ENEMY_IDS.map(id => {
            const e = ENEMIES[id];
            const discovered = killedEnemies[id]?.count > 0;
            return (
              <div key={id} className={`codex-entry ${discovered ? 'found' : 'unknown'}`} data-testid={`codex-enemy-${id}`}>
                <div className="codex-entry-icon" style={{ color: discovered ? e.color : '#2a1a4e' }}>●</div>
                <div className="codex-entry-info">
                  <div className="codex-entry-name">{discovered ? e.name : '???'}</div>
                  <div className="codex-entry-lore">
                    {discovered ? (ENEMY_LORE[id] || 'Unknown entity.') : 'Kill this enemy to reveal its entry.'}
                  </div>
                  {discovered && <div className="codex-entry-kills">Killed: {killedEnemies[id]?.count || 0}×</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'bosses' && (
        <div className="codex-grid">
          {ALL_BOSS_IDS.map(id => {
            const e = ENEMIES[id];
            const discovered = killedEnemies[id]?.count > 0;
            return (
              <div key={id} className={`codex-entry boss ${discovered ? 'found' : 'unknown'}`} data-testid={`codex-boss-${id}`}>
                <div className="codex-entry-icon" style={{ color: discovered ? e.color : '#2a1a4e', fontSize:24 }}>◉</div>
                <div className="codex-entry-info">
                  <div className="codex-entry-name">{discovered ? e.name : '???'}</div>
                  <div className="codex-entry-lore">
                    {discovered ? (ENEMY_LORE[id] || 'A dangerous entity.') : 'Defeat this boss to reveal lore.'}
                  </div>
                  {discovered && <div className="codex-entry-kills" style={{ color:'#ff3146' }}>Defeats: {killedEnemies[id]?.count || 0}×</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'weapons' && (
        <div className="codex-grid">
          {Object.entries(STARTER_WEAPONS || {}).map(([wid, w]) => {
            const discovered = usedWeapons[wid]?.count > 0;
            return (
              <div key={wid} className={`codex-entry ${discovered ? 'found' : 'unknown'}`} data-testid={`codex-weapon-${wid}`}>
                <div className="codex-entry-icon" style={{ color: discovered ? '#ffd166' : '#2a1a4e', fontSize:22 }}>⚙</div>
                <div className="codex-entry-info">
                  <div className="codex-entry-name">{discovered ? (w.name || wid) : '???'}</div>
                  <div className="codex-entry-lore">
                    {discovered ? (w.desc || 'A weapon of the Lake.') : 'Use this weapon to reveal its entry.'}
                  </div>
                  {discovered && <div className="codex-entry-kills" style={{ color:'#ffd166' }}>Runs: {usedWeapons[wid]?.count || 0}×</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
