# Waterdrop Survivor — PRD

## Iter 4 (2026-06-15) — Arsenal + Casino + Challenges + Achievements + Audio + Bug Fixes

### Bug fixes (from review)
- **Object pool iteration race** fixed: iterate backwards, length-stable, skip dead.
- **Tab visibility pause**: switching tabs pauses the game (`visibilitychange`).
- **Engine destroy** removes visibility listener.
- **Generation counter** on pool objects.

### Arsenal & Parts (Update A)
- **5 starter weapons** total: Hydro Pistol (default), Twin SMG, Tidal Shotgun, Runic Rifle, Plasma Lance — each with own behaviour, level-ups, evolved final form.
- **Blueprint shards system**: drop from missions, craft at `📜 BLUEPRINTS`. Each weapon needs 5–10 shards.
- **AK-style parts** with 7 slots (Barrel/Magazine/Sight/Muzzle/Stock/Bullets/Grip), 5 rarities (Common→Legendary), primary + 0-2 sub stats. Roll random per chest/mission.
- **Parts Workshop** (`🔧 PARTS`): equip parts per starter weapon, sell for gold.
- **Daily Missions** (3 stages: Recon Sweep / Salvage Run / Boss Hunt). Energy: 3 attempts max, regen 1/8h. Rewards drop with mission-stage rarity weighting.
- **Mission Reveal modal** after completion: shows gold + blueprint shards + parts found.
- **Brutal weapon-specific kill anims**: gibs (bullets), bisect (scythe), ash (orbital fire), voidImplode (beam) — particle systems with chunks + blood + screen shake per type.

### Card Casino & Active Skills (Update B)
- **🎰 Card Shop** in Camp: slot-machine pull with reel-spinning animation, rarity reveal. Escalating cost (×1.45 per pull).
- Pulls grant permanent stat bonuses **OR** unlock active skills.
- **6 active skills**: Lightning Strike (chain), Aegis Aura, Time Warp (slow), Decoy Drop, Meteor Call, Void Vortex. Keys 1-4 + touch buttons.
- **🎯 Active Skill Loadout**: equip up to 4 unlocked skills into hot-bar slots.
- **In-game Skill Button Bar** with cooldown overlays + key numbers + ready-state glow.
- **16 new advanced level-up cards** added to in-run pool: Lightning Crit, Damage Aura, Vampirism, Chain Strike, Slow Field, Burn DoT, Poison Cloud, Glass Cannon, Reflect, Explosive Death, Lifeline, Mirror Image, Knockback Wave, Star Burst, Multistrike, Grit. All wired to engine effects.

### Challenges & Achievements (Update C)
- **4 challenges**: Boss Rush, Horde (10× spawn 60s), Time Trial (kill 500), No-Hit Hero (180s zero hits).
- **20 achievements** with progress bars + claim buttons + gold/SP rewards.
- **Milestone Bar** ready for placement (account-level reward gates).
- **Deep Stats panel** expanded: 18 metrics (lifetime gold, no-hit runs, legendary parts found, weapons crafted, etc.).
- **Run completion logic**: mission duration / kill goal / boss-rush all trigger victory modal with reward roll.

### Audio & Polish (Update D)
- **Procedural WebAudio SFX**: shoot, hit, kill, reload, level-up, click, dash, boss, crit, pickup, blueprint, active-skill (per skill ID). ~3 KB.
- **Procedural ambient BGM**: dual-osc drone with lowpass + LFO modulation. Starts on game enter, stops on exit.
- **Settings panel**: SFX vol, music vol, mute, screen shake toggle, particle density.
- **Lightning particles** with jittered segments — visual feedback for chain skills and on-crit lightning card.
- **Poison clouds**, **chunks** with blood trails, **decoy/mirror image** entities.

## Verified live (no testing agent call — credit budget)
- 60 FPS stable in mission, active skill bar with CD overlay rendering, Card Shop slot-machine spins → settle on RARE +1 LUCK and applies permanent bonus, Blueprints page lists all 4 craftable weapons with shard progress, Camp navigation works across all tabs (Meta / Missions / Challenges / Achievements / Milestones / Stats), Camp action buttons (Card Shop, Loadout, Blueprints, Parts, Skills, Smith, Chests, Settings) all open modals correctly.

## Backlog
- Stage themes (lake/ruins/void/ship) — data ready, engine doesn't apply visuals yet (P2).
- Tutorial overlay (P3).
- Damage type icons on numbers (P3).
- Companion system (P2).
- Steam/Capacitor wrap (P3, separate ticket).

## Tech notes
- Engine: `/app/frontend/src/game/engine.js` (~1700 lines).
- Data: `data.js` + `data_ext.js` + `data_ext2.js` (split for tree-shaking + clean iter history).
- Audio: `/app/frontend/src/game/audio.js` (procedural, no asset cost).
- UI panels in `CampPanels.jsx` (Missions, Challenges, Achievements, Card Shop, Loadout, Weapon Crafting, Settings, Parts Inventory).
