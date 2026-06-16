import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Game } from '../game/engine';
import { SKILL_INDEX, WEAPON_PARTS } from '../game/data_ext';
import { STARTER_WEAPONS, PART_SLOT_INFO } from '../game/data_ext2';
import { Audio } from '../game/audio';
import HUD from './HUD';
import LevelUpModal from './LevelUpModal';
import GameOver from './GameOverScreen';
import MobileControls from './MobileControls';

function buildMetaEffects(save) {
  const m = save.meta || {};
  const sk = save.skills || {};
  const eqList = Object.values(save.equipped || {});
  const shopB = save.shopBonuses || {};
  const metaSum = (id, mult) => (m[id] || 0) * mult;

  const result = {
    maxHp:    metaSum('m_hp', 15)   + (shopB.maxHp || 0),
    dmg:      metaSum('m_dmg', 0.04) + (shopB.dmg || 0),
    atks:     metaSum('m_atks', 0.03) + (shopB.atks || 0),
    mspd:     metaSum('m_spd', 0.03) + (shopB.mspd || 0),
    crit:     metaSum('m_crit', 0.02) + (shopB.crit || 0),
    critd:    metaSum('m_critd', 0.10) + (shopB.critd || 0),
    armor:    metaSum('m_armor', 1) + (shopB.armor || 0),
    regen:    metaSum('m_regen', 0.2),
    pickup:   metaSum('m_pickup', 0.10) + (shopB.pickup || 0),
    xp:       metaSum('m_xp', 0.05) + (shopB.xp || 0),
    gold:     metaSum('m_gold', 0.08) + (shopB.gold || 0),
    luck:     metaSum('m_luck', 0.5) + (shopB.luck || 0),
    dodge:    metaSum('m_dodge', 0.02),
    revive:   !!m.m_revive,
    startBoon:(m.m_start || 0),
    area: 0, proj: 0, pierce: 0,
    headshot: 0, berserk: false, dash: false, dashcd: 0, blink: false, shield: false, bossDmg: 0, voidBurst: 0,
    flags: {},
  };

  Object.entries(sk).forEach(([id, lvl]) => {
    const s = SKILL_INDEX[id]; if (!s || lvl < 1) return;
    const amt = s.amount * lvl;
    if (['dmg','crit','critd','atks','mspd','armor','regen','pickup','xp','gold','luck','dodge','area','proj','pierce','headshot','dashcd','bossDmg','voidBurst'].includes(s.stat)) {
      result[s.stat] = (result[s.stat] || 0) + amt;
    } else if (s.stat === 'maxhp') result.maxHp += amt;
    else if (s.stat === 'berserk') result.berserk = true;
    else if (s.stat === 'dash') result.dash = true;
    else if (s.stat === 'blink') result.blink = true;
    else if (s.stat === 'shield') result.shield = true;
    else if (s.stat === 'revive') result.revive = true;
  });

  for (const eq of eqList) {
    if (!eq) continue;
    for (const st of eq.stats) {
      if (st.stat === 'maxhp') result.maxHp += st.val;
      else if (st.stat === 'armor') result.armor += st.val;
      else if (st.stat === 'regen') result.regen += st.val;
      else if (result[st.stat] !== undefined) result[st.stat] += st.val;
    }
  }

  // Old weaponsmith tiers (kept for compatibility)
  const oldParts = save.weaponParts || {};
  const pistolParts = oldParts['hydropistol'] || {};
  if (pistolParts.barrel && WEAPON_PARTS.barrel) result.dmg += (WEAPON_PARTS.barrel.tiers[pistolParts.barrel] || {}).dmg || 0;
  if (pistolParts.sight && WEAPON_PARTS.sight)   result.crit += (WEAPON_PARTS.sight.tiers[pistolParts.sight] || {}).crit || 0;
  if (pistolParts.rarity && WEAPON_PARTS.rarity) result.dmg += ((WEAPON_PARTS.rarity.tiers[pistolParts.rarity] || {}).mult - 1) * 0.4 || 0;

  // NEW parts inventory equipped per starter weapon
  const parts = save.parts || [];
  const eqParts = save.equippedParts || {};
  for (const wid of Object.keys(eqParts)) {
    const slotMap = eqParts[wid] || {};
    for (const slot of Object.keys(slotMap)) {
      const p = parts.find(x => x.id === slotMap[slot]); if (!p) continue;
      const apply = (stat, val) => {
        if (stat === 'magBonus') result.maxHp = result.maxHp; // mag handled per-weapon; skip global
        else if (['damage','dmg'].includes(stat)) result.dmg += val;
        else if (stat === 'fireRate') result.atks += val;
        else if (stat === 'pierce') result.pierce += Math.floor(val);
        else if (stat === 'crit') result.crit += val;
        else if (stat === 'critd') result.critd += val;
        else if (stat === 'mspd') result.mspd += val;
        else if (stat === 'headshot') result.headshot += val;
        else if (stat === 'atks') result.atks += val;
        else if (stat === 'reloadMult') result.atks += val * 0.5;
        else if (stat === 'knockback') result.dmg += val * 0.2;
        else if (stat === 'spreadReduce') result.crit += val * 0.1;
        else if (stat === 'range' || stat === 'projSpeed') result.dmg += val * 0.1;
        else if (stat === 'burn' || stat === 'shock') { result.flags.burnDoT = true; }
      };
      apply(p.primary.stat, p.primary.val);
      for (const sub of p.sub) apply(sub.stat, sub.val);
    }
  }

  // Apply card-shop flag unlocks
  if (save.shopBonuses) {
    // shopBonuses are stat numeric only — handled above
  }

  // Card flags from in-run cards aren't here; engine handles those via levelup
  return result;
}

export default function GameScreen({ save, setSave, onExit, onRunEnd, mission }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [snap, setSnap] = useState(null);
  const [levelUpChoices, setLevelUpChoices] = useState(null);
  const [gameOverResult, setGameOverResult] = useState(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    Audio.startMusic();
    const canvas = canvasRef.current;
    const opts = {
      meta: buildMetaEffects(save),
      activeSkills: (save.equippedActives || []).filter(Boolean),
      startWeapons: ['hydropistol'],
      missionDuration: mission ? mission.duration : null,
      spawnMult: mission ? (mission.spawnMult || 1.0) : 1.0,
      stage: mission ? null : null,
      challenge: mission && mission.isChallenge ? mission.mod : null,
      callbacks: {
        onTick: (s) => setSnap(s),
        onGameOver: (r) => {
          setGameOverResult(r);
          const newSave = { ...save, gold: save.gold + r.gold, lifetimeGold: (save.lifetimeGold || 0) + r.gold, runsCompleted: save.runsCompleted + 1, bestRunTime: Math.max(save.bestRunTime, r.time), bestKills: Math.max(save.bestKills, r.level), totalKills: save.totalKills + r.kills };
          if (r.noHit) newSave.noHitRuns = (newSave.noHitRuns || 0) + 1;
          setSave(newSave);
          onRunEnd && onRunEnd(r, newSave, mission);
        },
        onPauseToggle: () => setPaused(p => { const np = !p; g.setPaused(np); return np; }),
      },
    };
    const g = new Game(canvas, opts);
    gameRef.current = g;
    if (typeof window !== 'undefined') window.__game = g;
    return () => { g.destroy(); Audio.stopMusic(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!snap || !gameRef.current) return;
    if (snap.pendingLevelUp && !gameOverResult) {
      setLevelUpChoices(cur => cur || gameRef.current.buildLevelUpChoices());
    }
  }, [snap, gameOverResult]);

  const pickCard = (c) => { gameRef.current.applyCardChoice(c); setLevelUpChoices(null); };
  const onMobileUpdate = useCallback((joyMove, joyAim, firing) => {
    if (gameRef.current) gameRef.current.setMobileInput(joyMove, joyAim, firing);
  }, []);
  const onMobileReload = () => gameRef.current && gameRef.current.tryReload();
  const onMobileDash = () => gameRef.current && gameRef.current.tryDash();
  const onActiveSkill = (i) => gameRef.current && gameRef.current.tryActiveSkill(i);

  return (
    <div className="game-stage">
      <canvas ref={canvasRef} id="game" data-testid="game-canvas" />
      <HUD snap={snap} onActiveSkill={onActiveSkill} />
      <MobileControls onUpdate={onMobileUpdate} onReload={onMobileReload} onDash={onMobileDash} dashCD={snap ? snap.dashCD : 0} dashReady={snap ? snap.dashReady : false} />
      {levelUpChoices && <LevelUpModal choices={levelUpChoices} onPick={pickCard} playerLevel={snap ? snap.level : 1} />}
      {paused && !gameOverResult && (
        <div className="pause-overlay">
          <div className="pause-box">
            <h2>PAUSED</h2>
            <button onClick={() => { setPaused(false); gameRef.current.setPaused(false); }} data-testid="resume">Resume</button>
            <button onClick={() => { gameRef.current.destroy(); onExit('menu'); }} data-testid="quit-menu">Menu</button>
            <button onClick={() => { gameRef.current.destroy(); onExit('camp'); }} data-testid="quit-camp">⛺ Camp</button>
          </div>
        </div>
      )}
      {gameOverResult && (
        <GameOver result={gameOverResult} onMenu={() => onExit('menu')} onCamp={() => onExit('camp')} onRetry={() => onExit('retry')} />
      )}
    </div>
  );
}
