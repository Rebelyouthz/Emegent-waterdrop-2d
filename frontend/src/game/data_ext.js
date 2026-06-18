// Extended game data: skills, equipment, chests, quests, daily rewards, parts, avatars.
import { WEAPONS } from './data';

// ---------- AVATARS ----------
export const AVATARS = [
  { id: 'drop',    icon: '💧', name: 'Pure Drop',    desc: 'A waterdrop of the Lake.' },
  { id: 'flame',   icon: '🔥', name: 'Emberkin',     desc: 'Born from fire and tide.' },
  { id: 'void',    icon: '🌀', name: 'Voidwalker',   desc: 'Touched by the eldritch.' },
  { id: 'rune',    icon: '✨', name: 'Runebearer',   desc: 'Marked by A.I.D.A.' },
  { id: 'horus',   icon: '👁', name: 'Eye-bound',    desc: 'Sees through Horus.' },
  { id: 'spectre', icon: '💀', name: 'Spectre',      desc: 'Already dead.' },
];

// ---------- SKILL TREE ----------
// Branches: Combat, Mobility, Defense, Greed, Arcane
// Each skill has cost (SP), max level, prerequisite, and effect (applied as run modifiers).
export const SKILL_TREE = {
  combat: {
    name: 'COMBAT', color: '#ff3146', icon: '⚔️',
    skills: [
      { id: 'sk_atk',     name: 'Edge',          icon: '⚔️',  max: 5, costPerLvl: 1, req: null,           desc: '+3% damage / lvl',                 stat: 'dmg',     amount: 0.03 },
      { id: 'sk_crit',    name: 'Sharp Eye',     icon: '👁',  max: 5, costPerLvl: 1, req: 'sk_atk',       desc: '+2% crit chance / lvl',           stat: 'crit',    amount: 0.02 },
      { id: 'sk_headshot',name: 'Headshot',      icon: '🎯', max: 1, costPerLvl: 3, req: 'sk_crit',       desc: 'ACTIVE: 8% chance to one-shot non-bosses', stat: 'headshot', amount: 0.08, active: true },
      { id: 'sk_berserk', name: 'Berserker',     icon: '🩸', max: 1, costPerLvl: 4, req: 'sk_headshot',   desc: 'ACTIVE: +40% dmg below 30% HP',   stat: 'berserk', amount: 1, active: true },
      { id: 'sk_pierce',  name: 'Piercing',      icon: '➰', max: 3, costPerLvl: 2, req: 'sk_atk',        desc: '+1 pierce / lvl',                 stat: 'pierce',  amount: 1 },
      { id: 'sk_proj',    name: 'Multishot',     icon: '🎯', max: 2, costPerLvl: 3, req: 'sk_pierce',     desc: '+1 projectile / lvl',             stat: 'proj',    amount: 1 },
    ],
  },
  mobility: {
    name: 'MOBILITY', color: '#4dffd4', icon: '🥾',
    skills: [
      { id: 'sk_spd',     name: 'Light Step',    icon: '🥾', max: 5, costPerLvl: 1, req: null,            desc: '+3% move speed / lvl',            stat: 'mspd',    amount: 0.03 },
      { id: 'sk_dash',    name: 'Dash',          icon: '💨', max: 1, costPerLvl: 2, req: 'sk_spd',        desc: 'ACTIVE: SHIFT to dash (i-frames)', stat: 'dash',   amount: 1, active: true },
      { id: 'sk_dashcd',  name: 'Quick Recall',  icon: '⏱',  max: 3, costPerLvl: 2, req: 'sk_dash',       desc: '-15% dash cooldown / lvl',        stat: 'dashcd',  amount: 0.15 },
      { id: 'sk_blink',   name: 'Blink',         icon: '🌀', max: 1, costPerLvl: 4, req: 'sk_dashcd',     desc: 'ACTIVE: Dash teleports & deals AoE', stat: 'blink', amount: 1, active: true },
      { id: 'sk_dodge',   name: 'Phasing',       icon: '👻', max: 3, costPerLvl: 2, req: 'sk_spd',        desc: '+3% dodge / lvl',                 stat: 'dodge',   amount: 0.03 },
    ],
  },
  defense: {
    name: 'DEFENSE', color: '#ffd166', icon: '🛡',
    skills: [
      { id: 'sk_hp',      name: 'Vital',         icon: '❤️', max: 5, costPerLvl: 1, req: null,            desc: '+12 max HP / lvl',                stat: 'maxhp',   amount: 12 },
      { id: 'sk_armor',   name: 'Plated',        icon: '🛡', max: 4, costPerLvl: 2, req: 'sk_hp',         desc: '+1 armor / lvl',                  stat: 'armor',   amount: 1 },
      { id: 'sk_regen',   name: 'Regrowth',      icon: '🌿', max: 4, costPerLvl: 2, req: 'sk_hp',         desc: '+0.2 HP/s / lvl',                 stat: 'regen',   amount: 0.2 },
      { id: 'sk_shield',  name: 'Aegis',         icon: '✨', max: 1, costPerLvl: 4, req: 'sk_armor',      desc: 'ACTIVE: Absorb 1 hit / 25s',      stat: 'shield',  amount: 1, active: true },
      { id: 'sk_revive',  name: 'Phoenix',       icon: '🪽', max: 1, costPerLvl: 6, req: 'sk_regen',      desc: 'ACTIVE: Revive once at 50% HP',   stat: 'revive',  amount: 1, active: true },
    ],
  },
  greed: {
    name: 'GREED', color: '#ffd700', icon: '💰',
    skills: [
      { id: 'sk_gold',    name: 'Greed',         icon: '💰', max: 5, costPerLvl: 1, req: null,            desc: '+8% gold / lvl',                  stat: 'gold',    amount: 0.08 },
      { id: 'sk_xp',      name: 'Wisdom',        icon: '📖', max: 5, costPerLvl: 1, req: null,            desc: '+5% XP / lvl',                    stat: 'xp',      amount: 0.05 },
      { id: 'sk_magnet',  name: 'Magnet',        icon: '🧲', max: 4, costPerLvl: 2, req: 'sk_gold',       desc: '+12% pickup range / lvl',         stat: 'pickup',  amount: 0.12 },
      { id: 'sk_luck',    name: 'Fortune',       icon: '🍀', max: 4, costPerLvl: 2, req: 'sk_xp',         desc: '+0.5 luck / lvl (better rolls)',  stat: 'luck',    amount: 0.5 },
      { id: 'sk_chest',   name: 'Chest Sense',   icon: '📦', max: 1, costPerLvl: 4, req: 'sk_magnet',     desc: 'ACTIVE: Chest enemies spawn 2x more often', stat: 'chestSense', amount: 1, active: true },
    ],
  },
  arcane: {
    name: 'ARCANE', color: '#b362ff', icon: '🔮',
    skills: [
      { id: 'sk_area',    name: 'Wider Wake',    icon: '🌀', max: 5, costPerLvl: 1, req: null,            desc: '+5% area / lvl',                  stat: 'area',    amount: 0.05 },
      { id: 'sk_atks',    name: 'Quickened',     icon: '⏱',  max: 5, costPerLvl: 1, req: null,            desc: '+3% atk speed / lvl',             stat: 'atks',    amount: 0.03 },
      { id: 'sk_critdmg', name: 'Critical Will', icon: '🩸', max: 4, costPerLvl: 2, req: 'sk_atks',       desc: '+10% crit damage / lvl',          stat: 'critd',   amount: 0.10 },
      { id: 'sk_aida',    name: 'A.I.D.A. Link', icon: '👁', max: 1, costPerLvl: 6, req: 'sk_critdmg',    desc: 'ACTIVE: Bonus damage to bosses +30%', stat: 'bossDmg', amount: 0.30, active: true },
      { id: 'sk_void',    name: 'Voidcaller',    icon: '🌌', max: 1, costPerLvl: 4, req: 'sk_area',       desc: 'ACTIVE: 10% chance to spawn void burst on kill', stat: 'voidBurst', amount: 0.10, active: true },
    ],
  },
};

// Flatten skill lookup
export const SKILL_INDEX = (() => {
  const m = {};
  for (const k of Object.keys(SKILL_TREE)) for (const s of SKILL_TREE[k].skills) m[s.id] = { ...s, branch: k };
  return m;
})();

// ---------- WEAPON PARTS (Weaponsmith) ----------
// Each part has 4 tiers. Applied to one weapon owned permanently across runs.
export const WEAPON_PARTS = {
  magazine: { name: 'Magazine', icon: '📦', tiers: [
    { name: 'Standard',  bonus: 0,   cost: 0 },
    { name: 'Extended',  bonus: 4,   cost: 80 },
    { name: 'Drum',      bonus: 10,  cost: 240 },
    { name: 'Cosmic',    bonus: 20,  cost: 600 },
  ], stat: 'magazine' },
  sight: { name: 'Sight', icon: '🎯', tiers: [
    { name: 'Iron',      crit: 0,    cost: 0 },
    { name: 'Red Dot',   crit: 0.04, cost: 100 },
    { name: 'Tactical',  crit: 0.08, cost: 280 },
    { name: 'Eye Of Horus', crit: 0.16, cost: 700 },
  ], stat: 'sight' },
  barrel: { name: 'Barrel', icon: '🔫', tiers: [
    { name: 'Short',     dmg: 0,     cost: 0 },
    { name: 'Standard',  dmg: 0.10,  cost: 120 },
    { name: 'Long',      dmg: 0.22,  cost: 320 },
    { name: 'Annunaki',  dmg: 0.45,  cost: 800 },
  ], stat: 'barrel' },
  bullets: { name: 'Bullets', icon: '🔥', tiers: [
    { name: 'FMJ',       effect: 'none',  bonus: 0,     cost: 0 },
    { name: 'AP',        effect: 'pierce', bonus: 1,    cost: 150 },
    { name: 'Incendiary',effect: 'burn',   bonus: 0.06, cost: 350 },
    { name: 'Voidlash',  effect: 'chain',  bonus: 0.25, cost: 900 },
  ], stat: 'bullets' },
  rarity: { name: 'Rarity', icon: '✨', tiers: [
    { name: 'Common',    mult: 1.00, cost: 0 },
    { name: 'Magic',     mult: 1.15, cost: 200 },
    { name: 'Rare',      mult: 1.32, cost: 500 },
    { name: 'Epic',      mult: 1.55, cost: 1200 },
    { name: 'Legendary', mult: 1.85, cost: 3000 },
  ], stat: 'rarity' },
};

// ---------- PER-WEAPON PART LABEL OVERRIDES ----------
// Each weapon may override what each "slot" is called + the tier names so the
// upgrades feel native to that weapon. Mechanics stay the same; only labels change.
export const WEAPON_PART_OVERRIDES = {
  meteor: {
    magazine: { name: 'Meteor Volume',  icon: '☄️', tierNames: ['Solo', 'Pair', 'Cluster', 'Swarm'] },
    sight:    { name: 'Targeting',      icon: '🎯', tierNames: ['Manual', 'Tracking', 'Predictive', 'Eye of Horus'] },
    barrel:   { name: 'Impact',         icon: '💥', tierNames: ['Light', 'Heavy', 'Devastating', 'Annunaki'] },
    bullets:  { name: 'Meteor Type',    icon: '🔥', tierNames: ['Stone', 'Burning', 'Splitting', 'Voidshard'] },
  },
  voidBeam: {
    magazine: { name: 'Power Cell',     icon: '🔋', tierNames: ['Standard', 'Extended', 'Reactor', 'Cosmic'] },
    sight:    { name: 'Lens',           icon: '🔭', tierNames: ['Plain', 'Coated', 'Prismatic', 'Eye of Horus'] },
    barrel:   { name: 'Aperture',       icon: '🌀', tierNames: ['Narrow', 'Standard', 'Wide', 'Annunaki'] },
    bullets:  { name: 'Beam Type',      icon: '✨', tierNames: ['Pure', 'Pierce', 'Burning', 'Voidlash'] },
  },
  emberOrbs: {
    magazine: { name: 'Orb Count',      icon: '🟠', tierNames: ['Two', 'Three', 'Four', 'Six'] },
    sight:    { name: 'Orbit Pattern',  icon: '🎯', tierNames: ['Tight', 'Wide', 'Elliptical', 'Eye of Horus'] },
    barrel:   { name: 'Ember Power',    icon: '🔥', tierNames: ['Spark', 'Flame', 'Inferno', 'Annunaki'] },
    bullets:  { name: 'Burn',           icon: '🔥', tierNames: ['None', 'Brief', 'Lasting', 'Voidburn'] },
  },
  shotgun: {
    magazine: { name: 'Shell Box',      icon: '📦', tierNames: ['Standard', 'Extended', 'Drum', 'Cosmic'] },
    sight:    { name: 'Choke',          icon: '🎯', tierNames: ['Open', 'Modified', 'Full', 'Eye of Horus'] },
    barrel:   { name: 'Barrel Length',  icon: '🔫', tierNames: ['Sawed', 'Standard', 'Long', 'Annunaki'] },
    bullets:  { name: 'Shell Type',     icon: '🟡', tierNames: ['Buckshot', 'Slugs', 'Incendiary', 'Voidshell'] },
  },
  tidal: {
    magazine: { name: 'Shell Box',      icon: '📦', tierNames: ['Standard', 'Extended', 'Drum', 'Cosmic'] },
    sight:    { name: 'Choke',          icon: '🎯', tierNames: ['Open', 'Modified', 'Tight', 'Eye of Horus'] },
    barrel:   { name: 'Wave Length',    icon: '🌊', tierNames: ['Ripple', 'Wave', 'Tidal', 'Tsunami'] },
    bullets:  { name: 'Shell Type',     icon: '💧', tierNames: ['Buckshot', 'Slugs', 'Bursting', 'Voidshell'] },
  },
  iceLance: {
    magazine: { name: 'Shard Stack',    icon: '🧊', tierNames: ['Single', 'Pair', 'Triple', 'Hailstorm'] },
    sight:    { name: 'Lock',           icon: '🎯', tierNames: ['Manual', 'Tracking', 'Auto-Lock', 'Eye of Horus'] },
    barrel:   { name: 'Spear Length',   icon: '🔱', tierNames: ['Short', 'Standard', 'Long', 'Annunaki'] },
    bullets:  { name: 'Frost Type',     icon: '❄️', tierNames: ['Chill', 'Pierce', 'Freezing', 'Voidfrost'] },
  },
  plasmaLance: {
    magazine: { name: 'Plasma Cell',    icon: '🔋', tierNames: ['Standard', 'Extended', 'Reactor', 'Cosmic'] },
    sight:    { name: 'Optics',         icon: '🎯', tierNames: ['Plain', 'Holographic', 'Smart', 'Eye of Horus'] },
    barrel:   { name: 'Coil',           icon: '⚡', tierNames: ['Single', 'Twin', 'Triple', 'Annunaki'] },
    bullets:  { name: 'Charge',         icon: '✨', tierNames: ['Standard', 'Pierce', 'Overcharged', 'Voidcharge'] },
  },
  runicRifle: {
    magazine: { name: 'Rune Quiver',    icon: '📜', tierNames: ['Standard', 'Extended', 'Bound', 'Cosmic Tome'] },
    sight:    { name: 'Rune Sight',     icon: '👁', tierNames: ['Plain', 'Etched', 'Inscribed', 'Eye of Horus'] },
    barrel:   { name: 'Shaft',          icon: '🪵', tierNames: ['Oak', 'Bone', 'Ash', 'Annunaki'] },
    bullets:  { name: 'Rune Type',      icon: '🔮', tierNames: ['Common', 'Pierce', 'Burning', 'Voidrune'] },
  },
  twinSMG: {
    magazine: { name: 'Twin Mag',       icon: '📦', tierNames: ['Standard', 'Extended', 'Drum', 'Cosmic'] },
    sight:    { name: 'Sight',          icon: '🎯', tierNames: ['Iron', 'Red Dot', 'Tactical', 'Eye of Horus'] },
    barrel:   { name: 'Twin Barrel',    icon: '🔫', tierNames: ['Short', 'Standard', 'Long', 'Annunaki'] },
    bullets:  { name: 'Bullets',        icon: '🔥', tierNames: ['FMJ', 'AP', 'Incendiary', 'Voidlash'] },
  },
  runeBolts: {
    magazine: { name: 'Bolt Quiver',    icon: '🏹', tierNames: ['Standard', 'Extended', 'Bound', 'Cosmic'] },
    sight:    { name: 'Rune Sight',     icon: '👁', tierNames: ['Plain', 'Etched', 'Bound', 'Eye of Horus'] },
    barrel:   { name: 'Bow Tension',    icon: '🪶', tierNames: ['Standard', 'Heavy', 'Master', 'Annunaki'] },
    bullets:  { name: 'Bolt Type',      icon: '🔮', tierNames: ['Wood', 'Pierce', 'Burning', 'Voidrune'] },
  },
  scythe: {
    magazine: { name: 'Swing Range',    icon: '📏', tierNames: ['Short', 'Extended', 'Wide', 'Cosmic'] },
    sight:    { name: 'Focus',          icon: '🎯', tierNames: ['Iron', 'Sharp', 'Razor', 'Eye of Horus'] },
    barrel:   { name: 'Blade',          icon: '🌑', tierNames: ['Standard', 'Heavy', 'Long', 'Annunaki'] },
    bullets:  { name: 'Edge Type',      icon: '🩸', tierNames: ['Plain', 'Bleeding', 'Burning', 'Voidedge'] },
  },
};

// ---------- EQUIPMENT (chest drops) ----------
export const EQUIP_SLOTS = ['head', 'chest', 'boots', 'trinket'];
export const EQUIP_BASE = {
  head:    { icon: '👑', stats: ['crit', 'crit'] },
  chest:   { icon: '🦺', stats: ['maxhp', 'armor'] },
  boots:   { icon: '🥾', stats: ['mspd', 'dodge'] },
  trinket: { icon: '🔮', stats: ['xp', 'gold', 'luck', 'pickup'] },
};
// rarity adds a stat slot and multiplies values
export const EQUIP_RARITY = {
  common:    { mult: 1.0, slots: 1, color: '#9a8fa6', cls: 'r-common' },
  magic:     { mult: 1.5, slots: 2, color: '#4dc4ff', cls: 'r-magic' },
  rare:      { mult: 2.0, slots: 3, color: '#ffd166', cls: 'r-rare' },
  epic:      { mult: 2.7, slots: 4, color: '#b362ff', cls: 'r-epic' },
  legendary: { mult: 3.6, slots: 5, color: '#ff7a1a', cls: 'r-legendary' },
};
const EQUIP_NAMES = {
  head: ['Helm of Tides', 'Drowned Crown', 'Visor of Horus', 'Skull of A.I.D.A.', 'Cap of Echoes'],
  chest: ['Plate of Nirvana', 'Robe of Ash', 'Vest of Voidsteel', 'Hauberk of Lake', 'Shroud of Annunaki'],
  boots: ['Tideboots', 'Lightstep', 'Voidwalkers', 'Phasing Greaves', 'Boots of Drift'],
  trinket: ['Eye Pendant', 'Coin of Drown', 'Sigil of Aida', 'Lake Heart', 'Wisp Ring'],
};
const STAT_NAMES = {
  maxhp: 'Max HP', dmg: 'Damage %', atks: 'Atk Speed %', mspd: 'Move Speed %',
  crit: 'Crit %', critd: 'Crit Dmg %', armor: 'Armor', regen: 'Regen',
  pickup: 'Pickup %', xp: 'XP %', gold: 'Gold %', luck: 'Luck',
  dodge: 'Dodge %', area: 'Area %', proj: 'Projectiles',
};
export function rollEquip(rarity, level = 1) {
  const slotsAll = ['maxhp', 'dmg', 'atks', 'mspd', 'crit', 'critd', 'armor', 'pickup', 'xp', 'gold', 'luck', 'dodge', 'area'];
  const slot = EQUIP_SLOTS[Math.floor(Math.random() * EQUIP_SLOTS.length)];
  const r = EQUIP_RARITY[rarity];
  const name = EQUIP_NAMES[slot][Math.floor(Math.random() * EQUIP_NAMES[slot].length)];
  const baseStats = EQUIP_BASE[slot].stats;
  const statsRolled = [];
  const used = new Set();
  for (let i = 0; i < r.slots; i++) {
    const pool = i < baseStats.length ? [baseStats[i]] : slotsAll.filter(s => !used.has(s));
    const stat = pool[Math.floor(Math.random() * pool.length)];
    used.add(stat);
    let val;
    if (stat === 'maxhp') val = Math.floor((8 + Math.random() * 12) * r.mult * level);
    else if (stat === 'armor') val = Math.floor((1 + Math.random() * 2) * r.mult);
    else if (stat === 'regen') val = (0.1 + Math.random() * 0.2) * r.mult;
    else val = (0.02 + Math.random() * 0.05) * r.mult; // percent
    statsRolled.push({ stat, val, name: STAT_NAMES[stat] || stat });
  }
  return {
    id: 'eq_' + Math.random().toString(36).slice(2, 9),
    slot, name, rarity, level,
    stats: statsRolled,
    icon: EQUIP_BASE[slot].icon,
  };
}

// ---------- CHESTS ----------
export const CHESTS = [
  { id: 'wood',     name: 'Wooden Chest',    icon: '📦',  cost: 100,  rolls: 1, rarityWeights: { common: 80, magic: 18, rare: 2 } },
  { id: 'iron',     name: 'Iron Chest',      icon: '🗄',  cost: 350,  rolls: 1, rarityWeights: { magic: 65, rare: 28, epic: 7 } },
  { id: 'gold',     name: 'Gold Chest',      icon: '🏆',  cost: 1200, rolls: 2, rarityWeights: { rare: 60, epic: 32, legendary: 8 } },
  { id: 'annunaki', name: 'Annunaki Cache',  icon: '🛸',  cost: 4500, rolls: 3, rarityWeights: { epic: 70, legendary: 30 } },
];
export function rollChest(chest, luck = 0) {
  const drops = [];
  for (let i = 0; i < chest.rolls; i++) {
    const w = { ...chest.rarityWeights };
    // luck shifts weight up
    if (luck > 0) {
      const keys = Object.keys(w);
      for (let j = 0; j < keys.length; j++) w[keys[j]] = w[keys[j]] * (1 + luck * (j + 1) * 0.3);
    }
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let chosen = Object.keys(w)[0];
    for (const k of Object.keys(w)) { r -= w[k]; if (r <= 0) { chosen = k; break; } }
    drops.push(rollEquip(chosen, 1));
  }
  return drops;
}

// ---------- QUESTS (rotates daily) ----------
export const QUEST_POOL = [
  { id: 'q_kill_100',   icon: '⚔️', name: 'Slay 100',        desc: 'Kill 100 enemies in one run', goal: 100, type: 'kills',  reward: { gold: 200, sp: 1 } },
  { id: 'q_kill_300',   icon: '⚔️', name: 'Slay 300',        desc: 'Kill 300 enemies in one run', goal: 300, type: 'kills',  reward: { gold: 500, sp: 2 } },
  { id: 'q_surv_3',     icon: '⏱', name: 'Survive 3m',       desc: 'Survive 3 minutes in a run',  goal: 180, type: 'time',    reward: { gold: 300, sp: 1 } },
  { id: 'q_surv_5',     icon: '⏱', name: 'Survive 5m',       desc: 'Survive 5 minutes in a run',  goal: 300, type: 'time',    reward: { gold: 600, sp: 2 } },
  { id: 'q_lvl_10',     icon: '⭐', name: 'Reach Level 10',   desc: 'Reach character level 10',    goal: 10,  type: 'level',   reward: { gold: 250, sp: 1 } },
  { id: 'q_lvl_20',     icon: '⭐', name: 'Reach Level 20',   desc: 'Reach character level 20',    goal: 20,  type: 'level',   reward: { gold: 700, sp: 2 } },
  { id: 'q_boss',       icon: '👁', name: 'Slay the Eye',    desc: 'Defeat the Eye of Horus',     goal: 1,   type: 'boss',    reward: { gold: 800, sp: 3 } },
  { id: 'q_gold_500',   icon: '💰', name: 'Hoard 500',       desc: 'Collect 500 gold in one run', goal: 500, type: 'gold',    reward: { gold: 300, sp: 1 } },
];

export function dailyQuests(daySeed) {
  // pick 3 deterministic by day
  const seeded = (n) => {
    let s = daySeed * 9301 + n * 49297;
    s = (s % 233280); if (s < 0) s += 233280;
    return s / 233280;
  };
  const idx = [0, 1, 2].map(i => Math.floor(seeded(i + 1) * QUEST_POOL.length));
  return idx.map((i, k) => ({ ...QUEST_POOL[i % QUEST_POOL.length], slot: k }));
}

// ---------- DAILY REWARDS (7-day streak loop) ----------
export const DAILY_REWARDS = [
  { day: 1, icon: '💰', label: '+200 Gold',  type: 'gold', amount: 200 },
  { day: 2, icon: '⭐', label: '+1 SP',      type: 'sp',   amount: 1 },
  { day: 3, icon: '💰', label: '+400 Gold',  type: 'gold', amount: 400 },
  { day: 4, icon: '📦', label: 'Wood Chest', type: 'chest', chestId: 'wood' },
  { day: 5, icon: '⭐', label: '+2 SP',      type: 'sp',   amount: 2 },
  { day: 6, icon: '💰', label: '+800 Gold',  type: 'gold', amount: 800 },
  { day: 7, icon: '🏆', label: 'Gold Chest', type: 'chest', chestId: 'gold' },
];

// ---------- ACCOUNT LEVEL XP CURVE ----------
export function accountXpToNext(level) {
  return Math.floor(60 * Math.pow(1.18, level));
}
// rewards per account level
export function accountLevelReward(level) {
  if (level % 10 === 0) return { type: 'chest', chestId: 'gold', icon: '🏆', label: 'Gold Chest' };
  if (level % 5 === 0)  return { type: 'sp', amount: 2, icon: '⭐', label: '+2 SP' };
  if (level % 3 === 0)  return { type: 'gold', amount: 300, icon: '💰', label: '+300 Gold' };
  return { type: 'gold', amount: 100, icon: '💰', label: '+100 Gold' };
}

// ---------- MILESTONES ----------
export const MILESTONES = [
  { id: 'ms_kills_1k',  name: '1K Kills',     desc: 'Reach 1000 total kills',     metric: 'totalKills', goal: 1000, reward: { gold: 500, sp: 2 } },
  { id: 'ms_runs_10',   name: '10 Runs',      desc: 'Complete 10 runs',           metric: 'runsCompleted', goal: 10,    reward: { gold: 400, sp: 1 } },
  { id: 'ms_runs_50',   name: '50 Runs',      desc: 'Complete 50 runs',           metric: 'runsCompleted', goal: 50,    reward: { gold: 2000, sp: 5 } },
  { id: 'ms_boss',      name: 'Boss Slayer',  desc: 'Defeat A.I.D.A.',            metric: 'aidaSlain', goal: 1,    reward: { gold: 5000, sp: 10 } },
  { id: 'ms_time_5m',   name: 'Endurance',    desc: 'Survive 5 minutes',          metric: 'bestRunTime', goal: 300, reward: { gold: 600, sp: 2 } },
];

// ---------- EXTRA WEAPON (extra variety) ----------
export const EXTRA_WEAPONS = {
  iceLance: {
    id: 'iceLance', name: 'Ice Lance', icon: '❄️',
    type: 'auto', behaviour: 'projectile',
    desc: 'A piercing lance of cold that slows on hit.',
    base: { damage: 22, fireRate: 1.6, projSpeed: 720, projSize: 12, projectiles: 1, pierce: 3, color: '#bff0ff' },
    levelUps: [
      { stat: 'damage', mult: 1.2 },
      { stat: 'pierce', add: 2 },
      { stat: 'fireRate', mult: 1.2 },
      { stat: 'damage', mult: 1.3 },
      { stat: 'pierce', add: 2 },
      { stat: 'fireRate', mult: 1.2 },
      { stat: 'damage', mult: 1.5, evolve: true },
    ],
  },
  meteorRain: {
    id: 'meteorRain', name: 'Meteor Rain', icon: '☄️',
    type: 'auto', behaviour: 'meteor',
    desc: 'Calls down burning meteors from above.',
    base: { damage: 60, fireRate: 0.4, area: 90, color: '#ff7a1a' },
    levelUps: [
      { stat: 'fireRate', mult: 1.3 },
      { stat: 'damage', mult: 1.25 },
      { stat: 'area', mult: 1.2 },
      { stat: 'fireRate', mult: 1.3 },
      { stat: 'damage', mult: 1.3 },
      { stat: 'area', mult: 1.25 },
      { stat: 'damage', mult: 1.6, evolve: true },
    ],
  },
};

// Merge into WEAPONS at runtime
Object.assign(WEAPONS, EXTRA_WEAPONS);

// ---------- AIDA INTRO DIALOGUE ----------
export const AIDA_INTRO = [
  { who: 'A.I.D.A.', text: 'Signal stabilising… you hear me, waterdrop?', emote: '◈' },
  { who: 'A.I.D.A.', text: 'The Lake has fractured. The collective is silent.', emote: '◈' },
  { who: 'A.I.D.A.', text: 'I will guide you. Survive the contamination. Return home.', emote: '◈' },
  { who: 'A.I.D.A.', text: 'Begin at the camp. Build. Grow. Ascend.', emote: '◈' },
];

// ---------- HELP CONSTANTS ----------
export const MAX_ACTIVE_WEAPONS = 4;
