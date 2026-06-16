// Waterdrop Survivor — All game data: weapons, enemies, level-up cards, meta upgrades.

export const RARITY = {
  common:    { name: 'COMMON',    weight: 60, color: '#9a8fa6', cls: 'r-common',    mult: 1.0 },
  magic:     { name: 'MAGIC',     weight: 28, color: '#4dc4ff', cls: 'r-magic',     mult: 1.6 },
  rare:      { name: 'RARE',      weight: 9,  color: '#ffd166', cls: 'r-rare',      mult: 2.4 },
  epic:      { name: 'EPIC',      weight: 2.5,color: '#b362ff', cls: 'r-epic',      mult: 3.6 },
  legendary: { name: 'LEGENDARY', weight: 0.5,color: '#ff7a1a', cls: 'r-legendary', mult: 5.0 },
};

export function rollRarity(luck = 0) {
  // luck shifts roll up
  const keys = ['common', 'magic', 'rare', 'epic', 'legendary'];
  const weights = keys.map((k, i) => RARITY[k].weight * (1 + luck * i * 0.5));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < keys.length; i++) {
    r -= weights[i];
    if (r <= 0) return keys[i];
  }
  return 'common';
}

// ---------- WEAPONS ----------
// type: 'manual' (mouse aim) or 'auto' (auto-aim nearest)
// behaviour: 'projectile' | 'orbit' | 'aura' | 'beam' | 'aoe'
export const WEAPONS = {
  hydropistol: {
    id: 'hydropistol',
    name: 'Hydro Pistol',
    icon: '💧',
    type: 'manual',
    behaviour: 'projectile',
    desc: 'Manual-aim sidearm. Crisp, snappy, deadly.',
    base: {
      damage: 18,
      fireRate: 4.0, // shots per second
      projSpeed: 880,
      projSize: 6,
      magazine: 12,
      reloadTime: 1.0,
      pierce: 0,
      knockback: 90,
      spread: 0.02,
      crit: 0.08,
      color: '#4dc4ff',
      sound: 'shoot',
    },
    levelUps: [
      { stat: 'damage', mult: 1.18 },
      { stat: 'fireRate', mult: 1.10 },
      { stat: 'magazine', add: 4 },
      { stat: 'pierce', add: 1 },
      { stat: 'damage', mult: 1.25 },
      { stat: 'projSpeed', mult: 1.2 },
      { stat: 'crit', add: 0.10 },
      { stat: 'damage', mult: 1.4, evolve: true }, // final
    ],
  },
  bloodscythe: {
    id: 'bloodscythe',
    name: 'Blood Scythe',
    icon: '☠️',
    type: 'auto',
    behaviour: 'aoe',
    desc: 'Spinning scythe that auto-cuts surrounding foes.',
    base: { damage: 24, fireRate: 1.6, range: 110, area: 140, knockback: 40, crit: 0.05, color: '#b51d28' },
    levelUps: [
      { stat: 'damage', mult: 1.2 },
      { stat: 'area', mult: 1.15 },
      { stat: 'fireRate', mult: 1.15 },
      { stat: 'damage', mult: 1.3 },
      { stat: 'area', mult: 1.2 },
      { stat: 'fireRate', mult: 1.2 },
      { stat: 'damage', mult: 1.5, evolve: true },
    ],
  },
  runebolts: {
    id: 'runebolts',
    name: 'Rune Bolts',
    icon: '⚡',
    type: 'auto',
    behaviour: 'projectile',
    desc: 'Homing cyan bolts that seek the nearest foe.',
    base: { damage: 12, fireRate: 2.8, projSpeed: 520, projSize: 8, projectiles: 1, pierce: 0, homing: 0.08, color: '#4dffd4' },
    levelUps: [
      { stat: 'projectiles', add: 1 },
      { stat: 'damage', mult: 1.2 },
      { stat: 'homing', mult: 1.5 },
      { stat: 'projectiles', add: 1 },
      { stat: 'fireRate', mult: 1.25 },
      { stat: 'pierce', add: 1 },
      { stat: 'damage', mult: 1.5, evolve: true },
    ],
  },
  emberOrbs: {
    id: 'emberOrbs',
    name: 'Ember Orbs',
    icon: '🔥',
    type: 'auto',
    behaviour: 'orbit',
    desc: 'Burning orbs orbit the waterdrop, igniting all in reach.',
    base: { damage: 14, orbitCount: 2, orbitRadius: 90, orbitSpeed: 2.2, area: 26, color: '#ff7a1a' },
    levelUps: [
      { stat: 'orbitCount', add: 1 },
      { stat: 'damage', mult: 1.25 },
      { stat: 'orbitRadius', mult: 1.15 },
      { stat: 'orbitCount', add: 1 },
      { stat: 'orbitSpeed', mult: 1.2 },
      { stat: 'damage', mult: 1.4 },
      { stat: 'orbitCount', add: 1, evolve: true },
    ],
  },
  shockwave: {
    id: 'shockwave',
    name: 'Annunaki Pulse',
    icon: '💥',
    type: 'auto',
    behaviour: 'aoe',
    desc: 'Pulse of eldritch energy blasts foes around the player.',
    base: { damage: 30, fireRate: 0.6, range: 0, area: 180, knockback: 220, color: '#b362ff' },
    levelUps: [
      { stat: 'area', mult: 1.2 },
      { stat: 'damage', mult: 1.25 },
      { stat: 'fireRate', mult: 1.2 },
      { stat: 'damage', mult: 1.4 },
      { stat: 'area', mult: 1.25 },
      { stat: 'fireRate', mult: 1.25 },
      { stat: 'damage', mult: 1.6, evolve: true },
    ],
  },
  voidBeam: {
    id: 'voidBeam',
    name: 'Void Beam',
    icon: '🔮',
    type: 'auto',
    behaviour: 'beam',
    desc: 'Tethers a beam to the closest target, draining life.',
    base: { damage: 8, fireRate: 8.0, range: 320, color: '#b362ff' }, // damage per tick
    levelUps: [
      { stat: 'damage', mult: 1.2 },
      { stat: 'range', mult: 1.15 },
      { stat: 'fireRate', mult: 1.2 },
      { stat: 'damage', mult: 1.3 },
      { stat: 'range', mult: 1.2 },
      { stat: 'damage', mult: 1.5, evolve: true },
    ],
  },
};

export const WEAPON_KEYS = Object.keys(WEAPONS);

// ---------- ENEMIES ----------
export const ENEMIES = {
  slime: {
    id: 'slime', name: 'Slime', size: 18, hp: 22, dmg: 8, speed: 60, color: '#7ad96b',
    xp: 2, gold: 1, ai: 'chase',
  },
  bat: {
    id: 'bat', name: 'Voidbat', size: 14, hp: 14, dmg: 6, speed: 120, color: '#b362ff',
    xp: 2, gold: 1, ai: 'chase',
  },
  brute: {
    id: 'brute', name: 'Brute', size: 26, hp: 70, dmg: 16, speed: 48, color: '#c97050',
    xp: 6, gold: 3, ai: 'chase',
  },
  ranger: {
    id: 'ranger', name: 'Ranger', size: 20, hp: 30, dmg: 10, speed: 70, color: '#ffd166',
    xp: 4, gold: 2, ai: 'ranged', shootRange: 320, shootCD: 1.8, projSpeed: 320,
  },
  charger: {
    id: 'charger', name: 'Charger', size: 22, hp: 45, dmg: 18, speed: 80, color: '#ff3146',
    xp: 5, gold: 3, ai: 'charge',
  },
  ghoul: {
    id: 'ghoul', name: 'Ghoul', size: 19, hp: 35, dmg: 9, speed: 95, color: '#9aa6b2',
    xp: 3, gold: 2, ai: 'chase',
  },
  necron: {
    id: 'necron', name: 'Necron', size: 28, hp: 220, dmg: 24, speed: 55, color: '#4dffd4',
    xp: 22, gold: 14, ai: 'chase', boss: false,
  },
  // Bosses
  bossOcular: {
    id: 'bossOcular', name: 'Eye of Horus', size: 60, hp: 1600, dmg: 28, speed: 50, color: '#ffd166',
    xp: 200, gold: 200, ai: 'boss', boss: true, shootCD: 1.0,
  },
  bossAida: {
    id: 'bossAida', name: 'A.I.D.A.', size: 80, hp: 6000, dmg: 40, speed: 60, color: '#b362ff',
    xp: 800, gold: 800, ai: 'boss', boss: true, shootCD: 0.6,
  },
};

// ---------- LEVEL UP CARD POOL (in-run) ----------
// Cards mutate run-state stats or grant/upgrade weapons.
export const STAT_CARDS = [
  { id: 'dmg',       icon: '⚔️', name: 'Sharpened Edge',  desc: '+{v}% damage',          stat: 'damageMult',    mult: true,  amount: 0.10 },
  { id: 'atks',      icon: '⏱️', name: 'Quickened Hand',  desc: '+{v}% attack speed',    stat: 'fireRateMult',  mult: true,  amount: 0.10 },
  { id: 'spd',       icon: '🥾', name: 'Light Step',      desc: '+{v}% move speed',      stat: 'moveMult',      mult: true,  amount: 0.08 },
  { id: 'maxhp',     icon: '❤️', name: 'Vital Surge',     desc: '+{v} max HP',           stat: 'maxHp',         mult: false, amount: 20 },
  { id: 'heal',      icon: '✨', name: 'Cleansing Wave',  desc: 'Heal {v} HP now',       stat: 'heal',          mult: false, amount: 30 },
  { id: 'regen',     icon: '🌿', name: 'Regrowth',        desc: '+{v} HP / sec',         stat: 'regen',         mult: false, amount: 0.4 },
  { id: 'armor',     icon: '🛡️', name: 'Iron Skin',       desc: '+{v} armor',           stat: 'armor',         mult: false, amount: 2 },
  { id: 'crit',      icon: '💢', name: 'Lucky Strikes',   desc: '+{v}% crit chance',     stat: 'crit',          mult: false, amount: 0.05 },
  { id: 'critdmg',   icon: '🩸', name: 'Critical Mass',   desc: '+{v}% crit damage',     stat: 'critDmgMult',   mult: true,  amount: 0.25 },
  { id: 'area',      icon: '🌀', name: 'Wider Wake',      desc: '+{v}% area',            stat: 'areaMult',      mult: true,  amount: 0.10 },
  { id: 'proj',      icon: '🎯', name: 'Projectile Up',   desc: '+{v} extra projectile', stat: 'projBonus',     mult: false, amount: 1 },
  { id: 'pickup',    icon: '🧲', name: 'Magnet',          desc: '+{v}% pickup range',    stat: 'pickupMult',    mult: true,  amount: 0.25 },
  { id: 'xpgain',    icon: '📖', name: 'Wisdom',          desc: '+{v}% XP gain',         stat: 'xpMult',        mult: true,  amount: 0.10 },
  { id: 'gold',      icon: '💰', name: 'Greed',           desc: '+{v}% gold drops',      stat: 'goldMult',      mult: true,  amount: 0.15 },
  { id: 'pierce',    icon: '➰', name: 'Piercing Shot',   desc: '+{v} pierce',           stat: 'pierceBonus',   mult: false, amount: 1 },
  { id: 'dodge',     icon: '👻', name: 'Phasing',         desc: '+{v}% dodge',           stat: 'dodge',         mult: false, amount: 0.04 },
  { id: 'reload',    icon: '🔄', name: 'Fast Reload',     desc: '-{v}% reload time',     stat: 'reloadMult',    mult: true,  amount: -0.10 },
  { id: 'mag',       icon: '📦', name: 'Bigger Mag',      desc: '+{v} magazine size',    stat: 'magBonus',      mult: false, amount: 3 },
];

// ---------- META UPGRADES (permanent — Project Clean Earth style) ----------
// Cost scales each level; max levels keep things tight.
export const META_UPGRADES = [
  { id: 'm_hp',     name: 'Hardened Core',     icon: '❤️', desc: '+15 max HP per level',         stat: 'maxHp',     amount: 15,   max: 12, baseCost: 50,  curve: 1.6 },
  { id: 'm_dmg',    name: 'Sharpened Will',    icon: '⚔️', desc: '+4% damage per level',         stat: 'dmg',       amount: 0.04, max: 12, baseCost: 75,  curve: 1.65 },
  { id: 'm_atks',   name: 'Resonant Pulse',    icon: '⏱️', desc: '+3% attack speed per level',   stat: 'atks',      amount: 0.03, max: 10, baseCost: 80,  curve: 1.7 },
  { id: 'm_spd',    name: 'Lightfoot',         icon: '🥾', desc: '+3% move speed per level',     stat: 'mspd',      amount: 0.03, max: 10, baseCost: 60,  curve: 1.6 },
  { id: 'm_crit',   name: 'Eye of Fortune',    icon: '💢', desc: '+2% crit chance per level',    stat: 'crit',      amount: 0.02, max: 10, baseCost: 90,  curve: 1.7 },
  { id: 'm_critd',  name: 'Vorpal Mind',       icon: '🩸', desc: '+10% crit damage per level',   stat: 'critd',     amount: 0.10, max: 10, baseCost: 110, curve: 1.7 },
  { id: 'm_armor',  name: 'Annunaki Plating',  icon: '🛡️', desc: '+1 armor per level',          stat: 'armor',     amount: 1,    max: 10, baseCost: 100, curve: 1.7 },
  { id: 'm_regen',  name: 'Flow of Nirvana',   icon: '🌿', desc: '+0.2 HP/s per level',          stat: 'regen',     amount: 0.2,  max: 10, baseCost: 120, curve: 1.7 },
  { id: 'm_pickup', name: 'Tidal Pull',        icon: '🧲', desc: '+10% pickup range per level',  stat: 'pickup',    amount: 0.10, max: 8,  baseCost: 70,  curve: 1.6 },
  { id: 'm_xp',     name: 'Memory of Lake',    icon: '📖', desc: '+5% XP per level',             stat: 'xp',        amount: 0.05, max: 8,  baseCost: 130, curve: 1.75 },
  { id: 'm_gold',   name: 'Goldsense',         icon: '💰', desc: '+8% gold per level',           stat: 'gold',      amount: 0.08, max: 8,  baseCost: 100, curve: 1.7 },
  { id: 'm_luck',   name: 'Eldritch Luck',     icon: '🍀', desc: '+0.5 luck per level',          stat: 'luck',      amount: 0.5,  max: 8,  baseCost: 150, curve: 1.8 },
  { id: 'm_revive', name: 'Phoenix Echo',      icon: '🪽', desc: 'Revive once per run (50% HP)', stat: 'revive',    amount: 1,    max: 1,  baseCost: 800, curve: 1.0 },
  { id: 'm_dodge',  name: 'Veil Walker',       icon: '👻', desc: '+2% dodge per level',          stat: 'dodge',     amount: 0.02, max: 5,  baseCost: 200, curve: 1.85 },
  { id: 'm_start',  name: 'Survivor\'s Cache', icon: '🎁', desc: 'Start runs with +1 random card', stat: 'startBoon', amount: 1,  max: 3,  baseCost: 600, curve: 2.0 },
];

export function metaCost(upg, currentLvl) {
  return Math.floor(upg.baseCost * Math.pow(upg.curve, currentLvl));
}

// ---------- WAVE / DIFFICULTY ----------
export const WAVE_TIMELINE = [
  { t: 0,   spawn: 1.4, types: ['slime'] },
  { t: 20,  spawn: 1.8, types: ['slime', 'bat'] },
  { t: 45,  spawn: 2.2, types: ['slime', 'bat', 'ghoul'] },
  { t: 75,  spawn: 2.6, types: ['bat', 'ghoul', 'ranger'] },
  { t: 110, spawn: 3.0, types: ['ghoul', 'ranger', 'brute'], event: 'bossOcular' },
  { t: 170, spawn: 3.4, types: ['brute', 'ranger', 'charger'] },
  { t: 230, spawn: 3.8, types: ['brute', 'charger', 'bat', 'ghoul'] },
  { t: 290, spawn: 4.2, types: ['charger', 'ranger', 'necron'], event: 'bossOcular' },
  { t: 380, spawn: 4.8, types: ['brute', 'charger', 'necron', 'ghoul'] },
  { t: 480, spawn: 5.4, types: ['necron', 'charger', 'brute'] },
  { t: 540, spawn: 6.0, types: ['necron', 'charger', 'brute'], event: 'bossAida' },
];

export function waveAt(t) {
  let cur = WAVE_TIMELINE[0];
  for (const w of WAVE_TIMELINE) if (w.t <= t) cur = w;
  return cur;
}

export function nextBossEvent(t) {
  for (const w of WAVE_TIMELINE) if (w.t > t && w.event) return w;
  return null;
}
