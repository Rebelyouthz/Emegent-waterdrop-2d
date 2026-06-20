import React, { useState } from 'react';
import { META_UPGRADES, metaCost } from '../game/data';
import { MILESTONES, AVATARS, CHESTS, rollChest } from '../game/data_ext';
import { applyReward, DEFAULT_SAVE, saveLocal } from '../store';
import SkillTree from './SkillTree';
import Weaponsmith from './Weaponsmith';
import Shop from './Shop';
import { MissionsPanel, ChallengesPanel, AchievementsPanel, CardShopModal, ActiveLoadoutPanel, WeaponCrafting, SettingsPanel, PartsInventory, MapsPanel } from './CampPanels';
import { Audio } from '../game/audio';

const openChest = (chestId) => {
  const c = CHESTS.find(x => x.id === chestId);
  return c ? rollChest(c, 0.5) : [];
};

export default function Camp({ save, setSave, onBack, onStart, onMission }) {
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState('cards');
  const [shopOpen, setShopOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [forgeOpen, setForgeOpen] = useState(false);
  const [chestOpen, setChestOpen] = useState(false);
  const [loadoutOpen, setLoadoutOpen] = useState(false);
  const [craftOpen, setCraftOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [partsOpen, setPartsOpen] = useState(false);

  const buy = (upg) => {
    const cur = save.meta[upg.id] || 0;
    if (cur >= upg.max) return;
    const cost = metaCost(upg, cur);
    if (save.gold < cost) { setToast('NOT ENOUGH GOLD'); setTimeout(() => setToast(''), 1200); return; }
    setSave({ ...save, gold: save.gold - cost, meta: { ...save.meta, [upg.id]: cur + 1 } });
    Audio.click();
    setToast(`Acquired: ${upg.name} Lv.${cur + 1}`);
    setTimeout(() => setToast(''), 1400);
  };

  const claimMilestone = (m) => {
    if (save.milestones.claimed[m.id]) return;
    const val = save[m.metric] || 0;
    if (val < m.goal) return;
    const ns = { ...save, milestones: { ...save.milestones, claimed: { ...save.milestones.claimed, [m.id]: true } } };
    applyReward(ns, m.reward, openChest);
    setSave(ns); Audio.levelUp(); Audio.waterDrop();
  };

  const handleReset = () => {
    const fresh = { ...DEFAULT_SAVE };
    setSave(fresh);
    saveLocal(fresh);
    onBack();
  };

  const avatar = AVATARS.find(a => a.id === save.profile.avatar) || AVATARS[0];

  return (
    <div className="app-shell">
      <div className="camp" data-testid="camp-screen">
        <div className="camp-sidebar">
          <div className="camp-profile-bar">
            <span style={{ fontSize: 28 }}>{avatar.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{save.profile.name || 'Wanderer'}</div>
              <div style={{ fontSize: 11, color: 'var(--rune)', letterSpacing: '0.2em' }}>RANK {save.profile.level}</div>
            </div>
            <div style={{ marginLeft: 'auto', fontFamily: 'VT323', color: 'var(--ink-dim)', fontSize: 15, lineHeight: 1.6, textAlign: 'right' }}>
              ★ {save.gold}<br />◆ {save.sp} SP
            </div>
          </div>
          <div className="camp-scroll-hint">↓ scroll for more ↓</div>
          <div className="camp-tabs-scroll">
            <button className={`camp-tab ${tab === 'cards' ? 'active' : ''}`} onClick={() => setTab('cards')} data-testid="tab-cards">💠 META</button>
            <button className={`camp-tab ${tab === 'maps' ? 'active' : ''}`} onClick={() => setTab('maps')} data-testid="tab-maps">🗺 MAPS</button>
            <button className={`camp-tab ${tab === 'missions' ? 'active' : ''}`} onClick={() => setTab('missions')} data-testid="tab-missions">📋 MISSIONS</button>
            <button className={`camp-tab ${tab === 'challenges' ? 'active' : ''}`} onClick={() => setTab('challenges')} data-testid="tab-challenges">🏆 CHALLENGES</button>
            <button className={`camp-tab ${tab === 'achievements' ? 'active' : ''}`} onClick={() => setTab('achievements')} data-testid="tab-ach">🎖 ACHIEVEMENTS</button>
            <button className={`camp-tab ${tab === 'milestones' ? 'active' : ''}`} onClick={() => setTab('milestones')} data-testid="tab-milestones">⭐ MILESTONES</button>
            <button className={`camp-tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')} data-testid="tab-stats">📊 STATS</button>
            <div className="camp-tab-divider" />
            <button className="camp-tab" onClick={() => setShopOpen(true)} data-testid="open-card-shop">🎰 CARD SHOP</button>
            <button className="camp-tab" onClick={() => setLoadoutOpen(true)} data-testid="open-loadout">🎯 LOADOUT</button>
            <button className="camp-tab" onClick={() => setCraftOpen(true)} data-testid="open-craft">📜 BLUEPRINTS</button>
            <button className="camp-tab" onClick={() => setPartsOpen(true)} data-testid="open-parts">🔧 PARTS</button>
            <button className="camp-tab" onClick={() => setSkillOpen(true)} data-testid="open-skills">🧠 SKILLS</button>
            <button className="camp-tab" onClick={() => setForgeOpen(true)} data-testid="open-forge">🔨 SMITH</button>
            <button className="camp-tab" onClick={() => setChestOpen(true)} data-testid="open-chest">📦 CHESTS</button>
            <button className="camp-tab" onClick={() => setSettingsOpen(true)} data-testid="open-settings">⚙ SETTINGS</button>
          </div>
        </div>

        <div className="camp-main">
          {tab === 'cards' && (
            <>
              <div className="camp-header">
                <h1>Forge Your Edge</h1>
                <div className="camp-currency">
                  <span className="gold" data-testid="camp-gold">★ {save.gold}</span>
                  <span className="essence">◆ {save.sp} SP</span>
                </div>
              </div>
              <div className="upgrade-grid">
                {META_UPGRADES.map(upg => {
                  const lvl = save.meta[upg.id] || 0;
                  const maxed = lvl >= upg.max;
                  const cost = maxed ? null : metaCost(upg, lvl);
                  const canAfford = !maxed && save.gold >= cost;
                  return (
                    <div className={`upgrade-card ${maxed ? 'maxed' : ''}`} key={upg.id} data-testid={`meta-${upg.id}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="name">{upg.icon} {upg.name}</div>
                        <div className="lvl">{lvl}/{upg.max}</div>
                      </div>
                      <div className="pips">
                        {Array.from({ length: upg.max }, (_, i) => <span key={i} className={'pip ' + (i < lvl ? 'on' : '')} />)}
                      </div>
                      <div className="desc">{upg.desc}</div>
                      {maxed ? <div style={{ color: 'var(--accent-2)', fontFamily: 'VT323', letterSpacing: '0.2em' }}>MAX</div> :
                        <button onClick={() => buy(upg)} disabled={!canAfford} data-testid={`buy-${upg.id}`}>★ {cost}</button>}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === 'missions' && <MissionsPanel save={save} setSave={setSave} onStart={onMission} />}
          {tab === 'maps' && <MapsPanel save={save} setSave={setSave} onStart={(cfg) => onMission(cfg)} />}
          {tab === 'challenges' && <ChallengesPanel save={save} setSave={setSave} onStart={(c) => onMission({ ...c, isChallenge: true })} />}
          {tab === 'achievements' && <AchievementsPanel save={save} setSave={setSave} />}

          {tab === 'milestones' && (
            <>
              <div className="camp-header"><h1>Milestones</h1></div>
              <div className="upgrade-grid">
                {MILESTONES.map(m => {
                  const val = save[m.metric] || 0;
                  const pct = Math.min(100, (val / m.goal) * 100);
                  const done = val >= m.goal;
                  const claimed = save.milestones.claimed[m.id];
                  return (
                    <div className="upgrade-card" key={m.id} data-testid={`ms-${m.id}`}>
                      <div className="name">🏆 {m.name}</div>
                      <div className="desc">{m.desc}</div>
                      <div className="hud-xpbar" style={{ width: '100%' }}><div className="hud-xpbar-fill" style={{ width: pct + '%' }} /></div>
                      <div className="lvl">{Math.min(val, m.goal)} / {m.goal}</div>
                      <div style={{ fontSize: 12, color: 'var(--accent-2)' }}>{m.reward.gold && `★ ${m.reward.gold}`} {m.reward.sp && `◆ ${m.reward.sp} SP`}</div>
                      {claimed ? <div style={{ color: 'var(--rune)' }}>✓ CLAIMED</div> :
                        <button onClick={() => claimMilestone(m)} disabled={!done}>{done ? '✓ CLAIM' : 'LOCKED'}</button>}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === 'stats' && (
            <>
              <div className="camp-header"><h1>Deep Statistics</h1></div>
              <div className="stats-grid">
                <Stat label="Runs Completed" val={save.runsCompleted} />
                <Stat label="Total Kills" val={save.totalKills} />
                <Stat label="Best Run Time" val={fmtTime(save.bestRunTime)} />
                <Stat label="Best Run Level" val={save.bestKills} />
                <Stat label="A.I.D.A. Slain" val={save.aidaSlain} />
                <Stat label="Necromancer Slain" val={save.necroSlain || 0} />
                <Stat label="Void Titan Slain" val={save.voidSlain || 0} />
                <Stat label="Eye of Horus Slain" val={save.horusSlain || 0} />
                <Stat label="Endless Mode Reached" val={save.endlessReached || 0} />
                <Stat label="Account Rank" val={save.profile.level} />
                <Stat label="Skill Points" val={save.sp} />
                <Stat label="Gold Hoarded" val={save.gold} />
                <Stat label="Equipment" val={(save.inventory || []).length} />
                <Stat label="Parts" val={(save.parts || []).length} />
                <Stat label="Weapons Crafted" val={Object.keys(save.craftedWeapons || {}).length} />
                <Stat label="Skills Learned" val={Object.values(save.skills || {}).reduce((a, b) => a + b, 0)} />
                <Stat label="Meta Cards" val={Object.values(save.meta || {}).reduce((a, b) => a + b, 0)} />
                <Stat label="Daily Streak" val={(save.daily.streak || 0) + ' days'} />
                <Stat label="Shop Pulls" val={save.shopPulls || 0} />
                <Stat label="Chests Opened" val={save.chestsOpened || 0} />
                <Stat label="No-Hit Runs" val={save.noHitRuns || 0} />
                <Stat label="Legendary Parts" val={save.legendaryPartsFound || 0} />
              </div>
            </>
          )}

          <div className="camp-actions">
            <button onClick={onBack} data-testid="camp-back">◂ Back</button>
            <button onClick={onStart} data-testid="camp-fight"
              style={{ borderColor: '#ff7a1a', boxShadow: 'var(--pixel-edge), 0 6px 0 #000, 0 0 28px #ff7a1a66' }}>▸ FIGHT</button>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
      {shopOpen && <CardShopModal save={save} setSave={setSave} onClose={() => setShopOpen(false)} />}
      {skillOpen && <SkillTree save={save} setSave={setSave} onClose={() => setSkillOpen(false)} />}
      {forgeOpen && <Weaponsmith save={save} setSave={setSave} onClose={() => setForgeOpen(false)} />}
      {chestOpen && <Shop save={save} setSave={setSave} onClose={() => setChestOpen(false)} />}
      {loadoutOpen && <ActiveLoadoutPanel save={save} setSave={setSave} onClose={() => setLoadoutOpen(false)} />}
      {craftOpen && <WeaponCrafting save={save} setSave={setSave} onClose={() => setCraftOpen(false)} />}
      {settingsOpen && <SettingsPanel save={save} setSave={setSave} onClose={() => setSettingsOpen(false)} onReset={handleReset} />}
      {partsOpen && <PartsInventory save={save} setSave={setSave} onClose={() => setPartsOpen(false)} />}
      {save.pendingLevelUp && (
        <LevelUpOverlay save={save} onCollect={() => {
          const r = save.pendingLevelUp;
          setSave({
            ...save,
            pendingLevelUp: null,
            gold: (save.gold || 0) + r.gold,
            sp:   (save.sp   || 0) + r.sp,
            freeShopSpins: (save.freeShopSpins || 0) + (r.freeSpin ? 1 : 0),
          });
          Audio.claimPing();
        }} />
      )}
    </div>
  );
}

function Stat({ label, val }) {
  return (<div className="stat-cell"><div className="stat-lbl">{label}</div><div className="stat-val">{val}</div></div>);
}
function fmtTime(t) { if (!t) return '00:00'; const m = Math.floor(t / 60); const s = Math.floor(t % 60); return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }

const _CF = [
  {l:6,d:0,c:'#ff3146'},{l:14,d:.4,c:'#ffd166'},{l:23,d:.8,c:'#4dffd4'},
  {l:33,d:.2,c:'#b362ff'},{l:44,d:1.1,c:'#ff8c00'},{l:55,d:.6,c:'#4dc4ff'},
  {l:66,d:1.5,c:'#ffd700'},{l:76,d:.3,c:'#ff3146'},{l:85,d:.9,c:'#4dffd4'},
  {l:93,d:.1,c:'#b362ff'},{l:10,d:1.8,c:'#ffd166'},{l:29,d:1.3,c:'#ff8c00'},
  {l:50,d:1.0,c:'#4dc4ff'},{l:70,d:1.7,c:'#ff3146'},{l:88,d:.5,c:'#ffd700'},
  {l:19,d:1.4,c:'#4dffd4'},
];
const _LASERS = [0,45,90,135,180,225,270,315];

function LevelUpOverlay({ save, onCollect }) {
  const r = save.pendingLevelUp;
  const av = AVATARS[save.profile.avatar] || AVATARS[0];
  return (
    <div className="lu-overlay" data-testid="levelup-overlay">
      {_CF.map((c,i) => <div key={i} className="lu-confetti" style={{left:`${c.l}%`,animationDelay:`${c.d}s`,background:c.c}} />)}
      {_LASERS.map(a => <div key={a} className="lu-laser" style={{transform:`translate(-50%,-50%) rotate(${a}deg)`}} />)}
      <div className="lu-card">
        <div className="lu-avatar">{av.icon}</div>
        <div className="lu-title">RANK UP!</div>
        <div className="lu-rank">★ RANK {r.level} ★</div>
        <div className="lu-xp"><div className="lu-xp-fill" /></div>
        <div className="lu-rewards">
          <div className="lu-rwd">★ +{r.gold} Gold</div>
          <div className="lu-rwd">◆ +{r.sp} SP</div>
          {r.freeSpin && <div className="lu-rwd" style={{color:'#4dffd4',textShadow:'0 0 10px #4dffd4'}}>🎰 Free Shop Spin!</div>}
        </div>
        <button className="lu-collect" onClick={onCollect} data-testid="levelup-collect">COLLECT ▸</button>
      </div>
    </div>
  );
}
