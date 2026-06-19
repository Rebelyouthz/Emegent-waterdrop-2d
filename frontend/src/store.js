// Extended save store with profile, skills, equipment, quests, daily streak.
import axios from 'axios';
import { dailyQuests, accountXpToNext } from './game/data_ext';

const KEY = 'wds.save.v1';
const PID_KEY = 'wds.player_id';

export const DEFAULT_SAVE = {
  // legacy / core
  gold: 0,
  essence: 0,
  meta: {},
  runsCompleted: 0,
  bestRunTime: 0,
  bestKills: 0,
  totalKills: 0,
  introSeen: false,
  // profile
  profile: { name: '', avatar: 'drop', level: 1, xp: 0 },
  // skills
  sp: 0,
  skills: {}, // { skillId: level }
  // weapon parts
  weaponParts: {}, // { weaponId: { magazine: tier, sight: tier, barrel: tier, bullets: tier, rarity: tier } }
  // equipment
  inventory: [], // [{id, slot, name, rarity, level, stats}]
  equipped: {}, // { head, chest, boots, trinket }
  // daily
  daily: { lastClaim: 0, streak: 0 }, // unix day index
  quests: { day: 0, completed: {}, claimed: {} },
  // milestones
  milestones: { claimed: {} },
  // stats
  aidaSlain: 0,
  necroSlain: 0,
  voidSlain: 0,
  horusSlain: 0,
  endlessReached: 0,
  mapProgress: {},
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const s = { ...DEFAULT_SAVE, ...JSON.parse(raw) };
    // merge defaults for new fields
    s.profile = { ...DEFAULT_SAVE.profile, ...(s.profile || {}) };
    s.daily = { ...DEFAULT_SAVE.daily, ...(s.daily || {}) };
    s.quests = { ...DEFAULT_SAVE.quests, ...(s.quests || {}) };
    s.milestones = { ...DEFAULT_SAVE.milestones, ...(s.milestones || {}) };
    s.skills = s.skills || {};
    s.weaponParts = s.weaponParts || {};
    s.inventory = s.inventory || [];
    s.equipped = s.equipped || {};
    s.mapProgress = s.mapProgress || {};
    return s;
  } catch { return { ...DEFAULT_SAVE }; }
}

export function saveLocal(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* quota */ }
}

export function getPlayerId() {
  let id = localStorage.getItem(PID_KEY);
  if (!id) {
    id = 'p_' + Math.random().toString(36).slice(2, 12);
    localStorage.setItem(PID_KEY, id);
  }
  return id;
}

const BASE = process.env.REACT_APP_BACKEND_URL;

export async function syncSave(data) {
  if (!BASE) return;
  try { await axios.post(`${BASE}/api/save`, { player_id: getPlayerId(), data }); }
  catch (e) { /* offline ok */ }
}

export async function postRunResult(result) {
  if (!BASE) return;
  try { await axios.post(`${BASE}/api/run-result`, { player_id: getPlayerId(), ...result }); }
  catch (e) { /* offline ok */ }
}

// ---------- helpers ----------
export function todayIdx() { return Math.floor(Date.now() / 86400000); }

export function ensureDailyQuests(save) {
  const day = todayIdx();
  if (save.quests.day !== day) {
    save.quests = { day, completed: {}, claimed: {} };
  }
  return dailyQuests(day);
}

export function addAccountXp(save, amount) {
  save.profile.xp += amount;
  while (save.profile.xp >= accountXpToNext(save.profile.level)) {
    save.profile.xp -= accountXpToNext(save.profile.level);
    save.profile.level += 1;
  }
}

// Apply a reward IN-PLACE on a save object (caller should pass a fresh copy).
// Note: chest rewards are NOT auto-opened here to avoid circular deps.
// Caller should pass an `openChest(chestId, save)` resolver if needed, or read
// _pendingChest and handle it. The Welcome screen handles chest rewards by
// calling rollChest separately.
export function applyReward(save, reward, openChest) {
  if (!reward) return;
  if (reward.gold) save.gold = (save.gold || 0) + reward.gold;
  if (reward.sp) save.sp = (save.sp || 0) + reward.sp;
  if (reward.type === 'gold') save.gold = (save.gold || 0) + reward.amount;
  if (reward.type === 'sp') save.sp = (save.sp || 0) + reward.amount;
  if (reward.type === 'chest' && reward.chestId && openChest) {
    const drops = openChest(reward.chestId);
    if (drops && drops.length) save.inventory = [...(save.inventory || []), ...drops];
  }
}
