// Waterdrop Survivor — Iter 4 data: blueprints, parts, missions, achievements, stages, challenges, active skills, new lvlup cards.
import { WEAPONS } from './data';

// ---------- 5 STARTER WEAPONS (all manual-aim) ----------
export const STARTER_WEAPONS = {
  hydropistol: {  // already in WEAPONS - this is canonical starter
    id: 'hydropistol', name: 'Hydro Pistol', icon: '💧',
    blueprint: null, // already owned by default
  },
  twinSMG: {
    id: 'twinSMG', name: 'Twin SMG', icon: '🔫',
    blueprintCost: 5,
    desc: 'Dual SMGs. Rapid fire, low damage, huge mag.',
    base: { damage: 9, fireRate: 9.0, projSpeed: 760, projSize: 4, magazine: 32, reloadTime: 1.3, pierce: 0, knockback: 30, spread: 0.10, crit: 0.05, color: '#4dffd4' },
    type: 'manual', behaviour: 'projectile',
    levelUps: [
      { stat: 'damage', mult: 1.15 }, { stat: 'fireRate', mult: 1.1 }, { stat: 'magazine', add: 12 },
      { stat: 'damage', mult: 1.2 }, { stat: 'pierce', add: 1 }, { stat: 'crit', add: 0.06 }, { stat: 'damage', mult: 1.4, evolve: true },
    ],
  },
  tidalShotgun: {
    id: 'tidalShotgun', name: 'Tidal Shotgun', icon: '💥',
    blueprintCost: 6,
    desc: 'Wide spray, 5 pellets, brutal close range.',
    base: { damage: 14, fireRate: 1.4, projSpeed: 680, projSize: 6, magazine: 6, reloadTime: 1.8, pierce: 0, knockback: 200, spread: 0.45, crit: 0.06, color: '#ff7a1a', pellets: 5 },
    type: 'manual', behaviour: 'shotgun',
    levelUps: [
      { stat: 'pellets', add: 1 }, { stat: 'damage', mult: 1.2 }, { stat: 'magazine', add: 2 },
      { stat: 'pellets', add: 1 }, { stat: 'fireRate', mult: 1.2 }, { stat: 'damage', mult: 1.3 }, { stat: 'damage', mult: 1.5, evolve: true },
    ],
  },
  runicRifle: {
    id: 'runicRifle', name: 'Runic Rifle', icon: '🎯',
    blueprintCost: 8,
    desc: 'Slow, hard-hitting, piercing rifle.',
    base: { damage: 55, fireRate: 1.5, projSpeed: 1200, projSize: 5, magazine: 5, reloadTime: 1.8, pierce: 4, knockback: 140, spread: 0.005, crit: 0.18, color: '#ffd166' },
    type: 'manual', behaviour: 'projectile',
    levelUps: [
      { stat: 'damage', mult: 1.25 }, { stat: 'pierce', add: 2 }, { stat: 'crit', add: 0.10 },
      { stat: 'damage', mult: 1.3 }, { stat: 'fireRate', mult: 1.2 }, { stat: 'crit', add: 0.10 }, { stat: 'damage', mult: 1.7, evolve: true },
    ],
  },
  plasmaLance: {
    id: 'plasmaLance', name: 'Plasma Lance', icon: '⚡',
    blueprintCost: 10,
    desc: 'Charged plasma bolts that explode on impact.',
    base: { damage: 32, fireRate: 2.5, projSpeed: 900, projSize: 9, magazine: 10, reloadTime: 1.5, pierce: 1, knockback: 90, spread: 0.02, crit: 0.10, color: '#b362ff', explode: 60 },
    type: 'manual', behaviour: 'projectile',
    levelUps: [
      { stat: 'damage', mult: 1.2 }, { stat: 'explode', add: 20 }, { stat: 'fireRate', mult: 1.15 },
      { stat: 'damage', mult: 1.25 }, { stat: 'pierce', add: 1 }, { stat: 'explode', add: 30 }, { stat: 'damage', mult: 1.5, evolve: true },
    ],
  },
};
// merge into WEAPONS so existing code finds them
for (const k of Object.keys(STARTER_WEAPONS)) {
  if (!WEAPONS[k]) WEAPONS[k] = STARTER_WEAPONS[k];
}

// ---------- WEAPON PARTS (AK47 style attachment system) ----------
export const PART_SLOTS = ['barrel', 'magazine', 'sight', 'muzzle', 'stock', 'bullets', 'grip'];
export const PART_RARITIES = ['common', 'magic', 'rare', 'epic', 'legendary'];
export const PART_RARITY_COLORS = { common: '#9a8fa6', magic: '#4dc4ff', rare: '#ffd166', epic: '#b362ff', legendary: '#ff7a1a' };
export const PART_RARITY_MULT  = { common: 1.0, magic: 1.5, rare: 2.1, epic: 2.9, legendary: 4.0 };
export const PART_SLOT_INFO = {
  barrel:   { icon: '🔫', primary: 'damage', secondary: ['range', 'projSpeed'] },
  magazine: { icon: '📦', primary: 'magBonus', secondary: ['reloadMult', 'magBonus'] },
  sight:    { icon: '🎯', primary: 'crit', secondary: ['critd', 'headshot'] },
  muzzle:   { icon: '💢', primary: 'fireRate', secondary: ['knockback', 'spreadReduce'] },
  stock:    { icon: '🪵', primary: 'recoil', secondary: ['atks', 'reloadMult'] },
  bullets:  { icon: '🔸', primary: 'pierce', secondary: ['damage', 'burn', 'shock'] },
  grip:     { icon: '🪢', primary: 'mspd', secondary: ['atks', 'reloadMult'] },
};
const PART_NAME_BASE = {
  barrel: ['Stub', 'Heavy', 'Annunaki', 'Voidsteel', 'Eldritch'],
  magazine: ['Standard', 'Extended', 'Drum', 'Cosmic', 'Infinite'],
  sight: ['Iron', 'Red Dot', 'Tactical', 'Eye of Horus', 'A.I.D.A. Vision'],
  muzzle: ['Plain', 'Compensator', 'Suppressor', 'Echo', 'Voidlash'],
  stock: ['Wooden', 'Carbon', 'Tactical', 'Stabilized', 'Aida-Tech'],
  bullets: ['FMJ', 'AP', 'Incendiary', 'Shock', 'Voidshard'],
  grip: ['Rubber', 'Carbon', 'Bone', 'Voidweave', 'Aida-Grip'],
};
export function partName(slot, rarity) {
  const rIdx = PART_RARITIES.indexOf(rarity);
  const base = PART_NAME_BASE[slot][Math.min(rIdx, PART_NAME_BASE[slot].length - 1)];
  return base + ' ' + PART_SLOT_INFO[slot].icon;
}
export function rollPart(slot, forcedRarity = null) {
  const rarity = forcedRarity || rollPartRarity();
  const mult = PART_RARITY_MULT[rarity];
  const info = PART_SLOT_INFO[slot];
  // Primary stat always
  const primary = { stat: info.primary, val: rollStatValue(info.primary, mult, true) };
  // Secondary 0..2 by rarity
  const rIdx = PART_RARITIES.indexOf(rarity);
  const subCount = Math.max(0, rIdx); // common=0, magic=1, rare=2, epic=2, legendary=3 (capped at 2 unique)
  const sub = [];
  const used = new Set([info.primary]);
  const pool = info.secondary.filter(s => !used.has(s));
  for (let i = 0; i < Math.min(subCount, pool.length); i++) {
    const stat = pool[i];
    used.add(stat);
    sub.push({ stat, val: rollStatValue(stat, mult, false) });
  }
  return {
    id: 'pt_' + Math.random().toString(36).slice(2, 9),
    slot, rarity, name: partName(slot, rarity),
    primary, sub,
  };
}
function rollPartRarity() {
  const weights = { common: 60, magic: 28, rare: 9, epic: 2.5, legendary: 0.5 };
  const tot = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * tot;
  for (const [k, v] of Object.entries(weights)) { r -= v; if (r <= 0) return k; }
  return 'common';
}
function rollStatValue(stat, mult, primary) {
  const base = primary ? 0.10 : 0.05;
  if (stat === 'magBonus') return Math.ceil(2 * mult);
  if (stat === 'damage')   return +(base * mult).toFixed(2);
  if (stat === 'pierce')   return mult >= 2 ? Math.ceil(mult / 2) : 0;
  if (stat === 'burn' || stat === 'shock') return +(0.04 * mult).toFixed(2);
  if (stat === 'headshot') return +(0.02 * mult).toFixed(2);
  if (stat === 'recoil' || stat === 'spreadReduce') return +(0.10 * mult).toFixed(2);
  if (stat === 'range' || stat === 'projSpeed') return +(0.08 * mult).toFixed(2);
  return +((0.03 + Math.random() * 0.04) * mult).toFixed(2);
}
export const STAT_DISPLAY = {
  damage: 'Damage', fireRate: 'Atk Speed', crit: 'Crit', critd: 'Crit Dmg', magBonus: 'Magazine',
  pierce: 'Pierce', range: 'Range', projSpeed: 'Velocity', burn: 'Burn', shock: 'Shock',
  headshot: 'Headshot', recoil: 'Recoil-', reloadMult: 'Reload-', mspd: 'Move Spd',
  knockback: 'Knockback', atks: 'Atk Speed', spreadReduce: 'Accuracy',
};

// ---------- DAILY MISSIONS ----------
export const MISSION_DEFS = [
  {
    id: 'm_easy',  name: 'Recon Sweep',  icon: '🪶', stage: 1,
    desc: 'Survive 90 seconds. 60% spawn rate. Easy.',
    duration: 90,  spawnMult: 0.6, hpMult: 0.8,
    reward: { blueprintShards: { random: true, count: 1 }, parts: { common: 2 }, gold: 80 },
  },
  {
    id: 'm_med',   name: 'Salvage Run',  icon: '⚙️', stage: 2,
    desc: 'Survive 3 minutes. Normal spawn. Magic parts drop.',
    duration: 180, spawnMult: 1.0, hpMult: 1.0,
    reward: { blueprintShards: { random: true, count: 2 }, parts: { magic: 2, common: 1 }, gold: 200 },
  },
  {
    id: 'm_hard',  name: 'Boss Hunt',    icon: '👁', stage: 3,
    desc: 'Survive 5 min — boss waves. Rare+ parts drop.',
    duration: 300, spawnMult: 1.3, hpMult: 1.2, forceBoss: true,
    reward: { blueprintShards: { random: true, count: 3 }, parts: { rare: 2, magic: 1 }, gold: 500 },
  },
];
export const MISSION_DAILY_LIMIT = 3;
export const MISSION_REGEN_MS = 8 * 60 * 60 * 1000;
export function rollMissionRewards(reward, weapons) {
  const out = { gold: reward.gold || 0, blueprintShards: {}, parts: [] };
  if (reward.blueprintShards) {
    const pool = ['twinSMG', 'tidalShotgun', 'runicRifle', 'plasmaLance'];
    for (let i = 0; i < reward.blueprintShards.count; i++) {
      const id = pool[Math.floor(Math.random() * pool.length)];
      out.blueprintShards[id] = (out.blueprintShards[id] || 0) + 1;
    }
  }
  if (reward.parts) {
    for (const [rarity, count] of Object.entries(reward.parts)) {
      for (let i = 0; i < count; i++) {
        const slot = PART_SLOTS[Math.floor(Math.random() * PART_SLOTS.length)];
        out.parts.push(rollPart(slot, rarity));
      }
    }
  }
  return out;
}

// ---------- ACHIEVEMENTS ----------
export const ACHIEVEMENTS = [
  { id: 'a_first_kill',   name: 'First Blood',       icon: '🩸', desc: 'Kill 1 enemy', metric: 'totalKills', goal: 1,    rwd: { gold: 25 } },
  { id: 'a_kills_100',    name: 'Hundred',           icon: '⚔️', desc: '100 total kills',  metric: 'totalKills', goal: 100,  rwd: { gold: 100, sp: 1 } },
  { id: 'a_kills_1k',     name: 'Massacre',          icon: '💀', desc: '1000 total kills', metric: 'totalKills', goal: 1000, rwd: { gold: 600, sp: 3 } },
  { id: 'a_kills_10k',    name: 'Annihilator',       icon: '👹', desc: '10000 total kills',metric: 'totalKills', goal: 10000,rwd: { gold: 3000, sp: 10 } },
  { id: 'a_runs_10',      name: 'Survivor',          icon: '🛡', desc: '10 runs completed',metric: 'runsCompleted', goal: 10, rwd: { gold: 300 } },
  { id: 'a_runs_50',      name: 'Veteran',           icon: '🏅', desc: '50 runs completed',metric: 'runsCompleted', goal: 50, rwd: { gold: 1500, sp: 5 } },
  { id: 'a_time_5m',      name: 'Endurance',         icon: '⏱', desc: 'Survive 5 min',     metric: 'bestRunTime', goal: 300, rwd: { gold: 400, sp: 1 } },
  { id: 'a_time_10m',     name: 'Eternal',           icon: '♾', desc: 'Survive 10 min',    metric: 'bestRunTime', goal: 600, rwd: { gold: 1200, sp: 3 } },
  { id: 'a_aida',         name: 'Bossfall',          icon: '👁', desc: 'Defeat A.I.D.A.',   metric: 'aidaSlain', goal: 1, rwd: { gold: 2000, sp: 5 } },
  { id: 'a_lvl_30',       name: 'Apex',              icon: '⭐', desc: 'Reach run level 30',metric: 'bestKills', goal: 30, rwd: { gold: 400 } },
  { id: 'a_gold_10k',     name: 'Wealthy',           icon: '💰', desc: 'Earn 10000 gold',   metric: 'lifetimeGold', goal: 10000, rwd: { sp: 5 } },
  { id: 'a_blueprint',    name: 'Gunsmith',          icon: '📜', desc: 'Craft a starter weapon', metric: 'weaponsCrafted', goal: 1, rwd: { gold: 200 } },
  { id: 'a_all_weapons',  name: 'Arsenal',           icon: '🗡', desc: 'Craft all 4 weapons', metric: 'weaponsCrafted', goal: 4, rwd: { gold: 2000, sp: 5 } },
  { id: 'a_part_leg',     name: 'Legendary Smith',   icon: '✨', desc: 'Find a legendary part', metric: 'legendaryPartsFound', goal: 1, rwd: { gold: 500, sp: 2 } },
  { id: 'a_skill_25',     name: 'Awakened',          icon: '🧠', desc: 'Learn 25 skill levels', metric: 'skillsLearned', goal: 25, rwd: { gold: 600, sp: 3 } },
  { id: 'a_active_4',     name: 'Hot Bar',           icon: '🔥', desc: 'Equip 4 active skills', metric: 'activeSkillsCount', goal: 4, rwd: { gold: 400 } },
  { id: 'a_chest_50',     name: 'Hoarder',           icon: '📦', desc: 'Open 50 chests',    metric: 'chestsOpened', goal: 50, rwd: { gold: 800, sp: 2 } },
  { id: 'a_no_hit',       name: 'Untouchable',       icon: '👻', desc: 'Complete a mission without taking damage', metric: 'noHitRuns', goal: 1, rwd: { gold: 600, sp: 3 } },
  { id: 'a_challenge_4',  name: 'Trial Master',      icon: '🏆', desc: 'Complete all challenges', metric: 'challengesCompleted', goal: 4, rwd: { gold: 1500, sp: 5 } },
  { id: 'a_daily_7',      name: 'Devoted',           icon: '📅', desc: '7-day daily login streak', metric: 'dailyStreak', goal: 7, rwd: { gold: 500 } },
];

// ---------- STAGES (visual themes + spawn mods) ----------
export const STAGES = {
  lake:    { id: 'lake',    name: 'The Lake',         icon: '🌊', desc: 'The shallows. Where it all begins.',     bg: '#0c0a16', accent: '#4dc4ff', enemyMix: ['slime', 'bat', 'ghoul'],     spawnMult: 1.0, unlock: { kind: 'default' } },
  ruins:   { id: 'ruins',   name: 'Sunken Ruins',     icon: '🏛',  desc: 'Forgotten halls. Ranged threats lurk.',  bg: '#1a1208', accent: '#ffd166', enemyMix: ['ghoul', 'ranger', 'brute'],   spawnMult: 1.1, unlock: { kind: 'kills',  goal: 200 } },
  void:    { id: 'void',    name: 'Void Lab',         icon: '🌌', desc: 'A.I.D.A.\'s old chambers. Eldritch fiends.', bg: '#0a081a', accent: '#b362ff', enemyMix: ['bat', 'charger', 'necron'],  spawnMult: 1.2, unlock: { kind: 'runs',   goal: 5 } },
  ship:    { id: 'ship',    name: 'Annunaki Ship',    icon: '🛸', desc: 'The final outpost. A.I.D.A. waits.',     bg: '#1a0a08', accent: '#ff7a1a', enemyMix: ['brute', 'charger', 'necron', 'ranger'], spawnMult: 1.4, unlock: { kind: 'boss',   goal: 1 } },
};

// ---------- CHALLENGE MODES ----------
export const CHALLENGES = [
  { id: 'c_bossrush', name: 'Boss Rush',  icon: '👹', desc: 'Endless bosses. No respite.',  mod: { bossRush: true, duration: 999 },  rwd: { gold: 800, sp: 3 } },
  { id: 'c_horde',    name: 'Horde',      icon: '🌊', desc: '10× spawn. Survive 60s.',     mod: { spawnMult: 10, duration: 60 },     rwd: { gold: 500, sp: 2 } },
  { id: 'c_trial',    name: 'Time Trial', icon: '⏱', desc: 'Kill 500 enemies fast.',      mod: { killGoal: 500 },                   rwd: { gold: 1000, sp: 4 } },
  { id: 'c_nohit',    name: 'No-Hit Hero',icon: '👻', desc: 'Survive 3 min. ZERO hits.',   mod: { duration: 180, noHit: true },      rwd: { gold: 1200, sp: 5 } },
];

// ---------- ACTIVE SKILLS (button-icon with cooldown) ----------
export const ACTIVE_SKILLS = {
  lightning: { id: 'lightning', name: 'Lightning Strike', icon: '⚡', cd: 8,  cost: 0, key: '1', desc: 'Strike a foe with lightning. Chains to 4 nearby.' },
  aegis:     { id: 'aegis',     name: 'Aegis Aura',       icon: '🛡', cd: 18, cost: 0, key: '2', desc: 'Invuln + reflect 3s.' },
  timewarp:  { id: 'timewarp',  name: 'Time Warp',        icon: '⏱', cd: 25, cost: 0, key: '3', desc: 'Slow all enemies for 4s.' },
  decoy:     { id: 'decoy',     name: 'Decoy Drop',       icon: '👤', cd: 12, cost: 0, key: '4', desc: 'Drop decoy that pulls aggro 6s.' },
  meteor:    { id: 'meteor',    name: 'Meteor Call',      icon: '☄️', cd: 14, cost: 0, key: '1', desc: 'Call meteor on cursor — massive AoE.' },
  vortex:    { id: 'vortex',    name: 'Void Vortex',      icon: '🌀', cd: 16, cost: 0, key: '2', desc: 'Black hole pulls enemies, drains HP.' },
};
export const ACTIVE_SKILL_KEYS = Object.keys(ACTIVE_SKILLS);
// You can equip up to 4 active skills (out of pool). Unlock via card shop.

// ---------- NEW LEVEL UP CARDS (15+ interesting passive/active) ----------
export const ADVANCED_CARDS = [
  { id: 'c_lightning',   icon: '⚡', name: 'Lightning Crit',  desc: 'Crits arc lightning to 2 nearby foes',           flag: 'lightningOnCrit' },
  { id: 'c_aura',        icon: '🔥', name: 'Damage Aura',     desc: 'Burning aura damages foes around you',           flag: 'damageAura' },
  { id: 'c_vamp',        icon: '🩸', name: 'Vampirism',       desc: '5% lifesteal on hit',                            flag: 'vampire', amount: 0.05 },
  { id: 'c_chain',       icon: '🔗', name: 'Chain Strike',    desc: 'Kills chain to nearby for 50% dmg',              flag: 'chainOnKill' },
  { id: 'c_slow',        icon: '❄', name: 'Slow Field',      desc: 'Aura slows enemies 30%',                         flag: 'slowField' },
  { id: 'c_burn',        icon: '🔥', name: 'Burn',            desc: 'Hits apply burn DoT',                            flag: 'burnDoT' },
  { id: 'c_poison',      icon: '☠', name: 'Poison Cloud',    desc: 'On kill leave poison patch',                     flag: 'poisonOnKill' },
  { id: 'c_glass',       icon: '💀', name: 'Glass Cannon',    desc: '+150% damage, -50% HP',                          flag: 'glassCannon' },
  { id: 'c_reflect',     icon: '🪞', name: 'Reflect',         desc: 'Reflect 30% damage back',                        flag: 'reflect', amount: 0.30 },
  { id: 'c_explode',     icon: '💥', name: 'Explosive Death', desc: 'Killed enemies explode for 30 dmg',              flag: 'explosiveDeath' },
  { id: 'c_lifeline',    icon: '🛟', name: 'Lifeline',        desc: 'Below 20% HP gain temporary shield',             flag: 'lifeline' },
  { id: 'c_mirror',      icon: '👯', name: 'Mirror Image',    desc: 'Spawn a decoy every 12s',                        flag: 'mirrorAura' },
  { id: 'c_knockback',   icon: '💨', name: 'Knockback Wave',  desc: 'Every 8s a wave knocks all back',                flag: 'knockbackWave' },
  { id: 'c_starburst',   icon: '🌟', name: 'Star Burst',      desc: 'Every 5 kills → AoE burst',                      flag: 'starBurst' },
  { id: 'c_doublehit',   icon: '⚔️', name: 'Multistrike',     desc: '20% chance to double-hit',                       flag: 'doubleHit', amount: 0.20 },
  { id: 'c_grit',        icon: '🪨', name: 'Grit',            desc: 'When hit, -30% dmg for 2s',                      flag: 'grit' },
  { id: 'c_vision',      icon: '🔭', name: 'Eagle Vision',     desc: '+25% vision range (camera zoom out)',           flag: 'vision' },
  { id: 'c_double_dmg',  icon: '🗡', name: 'Sharp Steel',      desc: '+25% damage permanently this run',              flag: 'sharpSteel' },
  { id: 'c_speed',       icon: '💨', name: 'Bloodrush',        desc: '+15% move speed + reload',                      flag: 'bloodrush' },
  { id: 'c_magnet',      icon: '🧲', name: 'Iron Pull',        desc: '+80% pickup range',                             flag: 'ironPull' },
  // --- new passive auto-weapons & effects ---
  { id: 'c_thunder',     icon: '🌩', name: 'Thunder Cult',      desc: 'Every 4s strike random foe for 60 dmg',         flag: 'thunderCult' },
  { id: 'c_iceShard',    icon: '🧊', name: 'Ice Shards',        desc: 'Auto-launch homing ice shards every 1.6s',      flag: 'iceShards' },
  { id: 'c_holyWater',   icon: '💧', name: 'Holy Water',        desc: 'Heal ring pulses every 6s (+15 HP)',            flag: 'holyWater' },
  { id: 'c_swarm',       icon: '🐝', name: 'Swarm',             desc: 'Orbiting bees pierce + sting nearby foes',      flag: 'swarmAura' },
  { id: 'c_spike',       icon: '🪤', name: 'Spike Plates',      desc: 'Drop spike traps on dash/spawn (60 dmg)',       flag: 'spikePlates' },
  { id: 'c_overcharge',  icon: '⚡', name: 'Overcharge',        desc: 'Every 6th shot is double damage',               flag: 'overcharge' },
  { id: 'c_railgun',     icon: '🎯', name: 'Railgun Stance',    desc: 'Standing still 1s+ = +60% damage',              flag: 'railStance' },
  { id: 'c_juggernaut',  icon: '💪', name: 'Juggernaut',        desc: '+1 HP regen per 5 enemies in 200u',             flag: 'juggernaut' },
];

// ---------- CAMP CARD SHOP POOL (slot-machine pulls) ----------
// Each pull = random pick from this pool weighted by rarity. Permanent boosts and skill unlocks.
export const SHOP_CARD_POOL = [
  // Permanent stat cards
  { id: 'sh_hp',    icon: '❤️', name: '+30 Max HP',      effect: { stat: 'maxHp', amount: 30 } },
  { id: 'sh_dmg',   icon: '⚔️', name: '+8% Damage',       effect: { stat: 'dmg', amount: 0.08 } },
  { id: 'sh_atks',  icon: '⏱', name: '+6% Atk Speed',    effect: { stat: 'atks', amount: 0.06 } },
  { id: 'sh_crit',  icon: '💢', name: '+4% Crit',         effect: { stat: 'crit', amount: 0.04 } },
  { id: 'sh_critd', icon: '🩸', name: '+20% Crit Dmg',    effect: { stat: 'critd', amount: 0.20 } },
  { id: 'sh_spd',   icon: '🥾', name: '+5% Move Speed',  effect: { stat: 'mspd', amount: 0.05 } },
  { id: 'sh_armor', icon: '🛡', name: '+2 Armor',         effect: { stat: 'armor', amount: 2 } },
  { id: 'sh_gold',  icon: '💰', name: '+15% Gold',        effect: { stat: 'gold', amount: 0.15 } },
  { id: 'sh_xp',    icon: '📖', name: '+10% XP',          effect: { stat: 'xp', amount: 0.10 } },
  { id: 'sh_luck',  icon: '🍀', name: '+1 Luck',          effect: { stat: 'luck', amount: 1 } },
  { id: 'sh_pick',  icon: '🧲', name: '+25% Pickup',      effect: { stat: 'pickup', amount: 0.25 } },
  // Active skill unlocks (rarer)
  { id: 'sh_skill_lightning', icon: '⚡', name: 'Unlock: Lightning',  effect: { unlockSkill: 'lightning' } },
  { id: 'sh_skill_aegis',     icon: '🛡', name: 'Unlock: Aegis',      effect: { unlockSkill: 'aegis' } },
  { id: 'sh_skill_timewarp',  icon: '⏱', name: 'Unlock: Time Warp',  effect: { unlockSkill: 'timewarp' } },
  { id: 'sh_skill_decoy',     icon: '👤', name: 'Unlock: Decoy',      effect: { unlockSkill: 'decoy' } },
  { id: 'sh_skill_meteor',    icon: '☄️', name: 'Unlock: Meteor',     effect: { unlockSkill: 'meteor' } },
  { id: 'sh_skill_vortex',    icon: '🌀', name: 'Unlock: Void Vortex',effect: { unlockSkill: 'vortex' } },
];
export function shopCardCost(pullCount) {
  // Escalating: 150, 220, 320, 470, 690, ...
  return Math.floor(150 * Math.pow(1.45, pullCount));
}
export function rollShopPull(luck = 0) {
  const card = SHOP_CARD_POOL[Math.floor(Math.random() * SHOP_CARD_POOL.length)];
  // Rarity affects amount scaling (for stat cards)
  const rarityRoll = Math.random() - (luck * 0.05);
  let rarity = 'common';
  if (rarityRoll < 0.005) rarity = 'legendary';
  else if (rarityRoll < 0.04) rarity = 'epic';
  else if (rarityRoll < 0.16) rarity = 'rare';
  else if (rarityRoll < 0.45) rarity = 'magic';
  const mult = { common: 1.0, magic: 1.5, rare: 2.0, epic: 2.8, legendary: 4.0 }[rarity];
  return { ...card, rarity, mult, finalEffect: card.effect.amount ? { ...card.effect, amount: card.effect.amount * mult } : card.effect };
}

// ---------- MILESTONE REWARD BAR (account level) ----------
export const MILESTONE_BAR = [
  { atLevel: 2,  rwd: { gold: 100 } },
  { atLevel: 5,  rwd: { gold: 300, sp: 1 } },
  { atLevel: 10, rwd: { gold: 600, sp: 2, chest: 'wood' } },
  { atLevel: 15, rwd: { gold: 1200, sp: 3 } },
  { atLevel: 20, rwd: { gold: 2000, sp: 5, chest: 'iron' } },
  { atLevel: 30, rwd: { gold: 5000, sp: 10, chest: 'gold' } },
  { atLevel: 50, rwd: { gold: 12000, sp: 25, chest: 'annunaki' } },
  { atLevel: 100,rwd: { gold: 50000, sp: 100, chest: 'annunaki' } },
];

// ---------- BRUTAL KILL ANIMATIONS by weapon behaviour ----------
export const KILL_FX = {
  projectile: 'gibs',       // pellets/bullets cause chunks
  shotgun:    'gibs',       // big chunks
  aoe:        'bisect',     // sliced clean
  beam:       'voidImplode',// pulled into a point
  orbit:      'ash',        // burnt to ash
  meteor:     'gibs',
};
