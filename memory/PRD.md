# Waterdrop Survivor — PRD

## Original Problem Statement
Continue developing "Waterdrop Survivor" (React + Canvas 2D game). 
Key user goals:
- Massive progression/meta-gameplay features
- Long grind (20h+ to reach full power)
- Balanced upgrades (tiny per-level, many levels)
- Character rarity, branching skill tree, pet system
- Tutorial questline, card shop slot machine
- Multiple currencies, equipment system, daily missions

## Architecture
```
/app/
├── backend/
│   ├── server.py              
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main state, runs, auth gate, tutorial logic
│   │   ├── store.js           # Save state (gems, slotCoins, talentPoints, pets)
│   │   ├── components/        
│   │   │   ├── Camp.jsx       # Camp UI with reordered tabs + currency display
│   │   │   ├── CampPanels.jsx # Card shop (slot coins), missions, etc.
│   │   │   ├── TalentTree.jsx # 30 nodes × 10 levels = 300 total, uses TP
│   │   │   ├── PetPanel.jsx   # Pet system (eggs, hatch, feed, grow)
│   │   │   ├── HUD.jsx        # Tutorial bubbles overlay
│   │   │   ├── CharacterPanel.jsx
│   │   │   ├── GameScreen.jsx # buildMetaEffects (rebalanced), pet bonuses
│   │   │   └── SkillTree.jsx  # Basic skill tree (needs POE2 redesign)
│   │   └── game/              
│   │       ├── engine.js      # Canvas 2D game loop (hearts: 1.65%, 5HP)
│   │       ├── audio.js       
│   │       ├── data.js        # META_UPGRADES (rebalanced), ENEMIES (8 new types), WAVE_TIMELINE
│   │       ├── data_ext.js    
│   │       └── data_ext2.js   # TALENT_NODES (300 levels), MISSIONS, etc.
```

## What's Been Implemented

### Session 1 (Batch 1 — Core Engine)
- Heart drops (red hearts), 4 coin sizes
- Dopamine UI animations (Camp + Level Up)
- Bug Fix: Equipped chest items rendering too narrow

### Session 1 (Batch 2 — Camp Systems)
- CharacterPanel.jsx (rarity system)
- TalentTree.jsx (initially linear 30 nodes)
- CampaignPanel.jsx
- CardShopModal with passive/active/manual sections + slot machine jackpot
- Combo Meter (HUD + engine)
- Level Up Streak Bonus + Free Spin Counter
- 6 new weapons added

### Session 2 (2026-06-22) — MAJOR OVERHAUL
**Balance:**
- META_UPGRADES: Rebalanced to tiny increments (+1HP/level, +0.1-0.2%/level, max 80-100 levels)
- Talent Tree: 30 nodes × 10 levels = 300 total, uses Talent Points (TP)
- Heart drop rate: 3.5% → 1.65%
- Heart heal: 10% max HP → flat 5 HP (upgradeable via m_heal meta)
- New meta: Eagle Eye (zoom +0.5%/level, max 35%), Vital Drops (+0.5 heart heal/level)

**New Currencies:**
- 💎 Gems: for chests & pets (earned from kills, boss kills, map completion)
- 🎰 Slot Coins: for card shop spins (1 coin = 1 spin, 500 gold fallback)
- 🌿 Talent Points: for talent tree (5 TP per run, 2 per rank-up)
- 🍖 Pet Food: feed pets (5 from shop for 50 gems, also from missions)

**New Systems:**
- Pet System (PetPanel.jsx): 5 pet types, eggs with rarities, hatch/feed/grow/merge
- Tutorial Mode: First run = tutorial mission (pre-loaded weapons, text bubbles)
- 8 new enemy types (crystalite, soulshard, bonewalker, voidspawn, steelbrute, lightningbug, techsoldier, nanoswarm)

**Camp UI:**
- Tab reorder: Campaign first, then Maps/Missions/Challenges/Achievements, then Character/Pets/Talent/Skills/Meta, then Gear
- Currency display: All 5 currencies (★💎🎰🌿◆) in profile sidebar
- META progress bars (not pips) for upgrades with max > 20 levels
- Level up overlay: Shows TP + Gems + SlotCoins rewards
- Card Shop: Uses Slot Coins (1 per spin), gold fallback (500 gold)

## Balance Design Philosophy
- Per run → +5 TP, +gems from kills (1 per 50), boss kills (+8-15 gems)
- Full meta tree max (100 levels each): ~50-80 hours
- Full talent tree max (300 levels): ~90 hours
- Estimated total to fully max: 100-200 hours

## Session 3 (2026-06-23) — Critical Fixes + Input + Performance
**Bug Fixes:**
- Slot machine pull button: fixed disabled condition (now works with Slot Coins + Free Spins)
- Chests: all costs changed from Gold → Gems (7 chest types with proper rarities)
- Mouse aim: moved mousemove to window-level (no longer gets stuck when leaving canvas)
- Character rarity levels: Common=3, Uncommon=6, Rare=8, Epic=10, Legendary=12, Mythical=15
- Auto-grant shard at max level for rarity evolution

**Input improvements:**
- Gamepad support: left stick=move, right stick=aim, RT=shoot, A=dash, B=reload, Y/X=skills
- Mouse events at window level (reliable aim always)
- Touch events preserved for mobile

**Performance:**
- FPS tracking with EWMA (smoother, targets 120fps)
- Adaptive quality: reduces effects when FPS < 55
- bloodDecals capped at 150 (was 250) — reduces memory usage
- Error boundaries in frame loop (errors don't kill game)
- Proper destroy() removes ALL event listeners (no leak on remount)

**Visual improvements:**
- Enhanced kill effects: 32+ blood particles, body chunks, spark burst per kill
- Hit sparks on every bullet impact (new spawnHitSparks method)
- Crit hits show white ring effect
- Combo kills (10+) trigger gold ring, every 25th combo adds shake+slowmo
- [x] Game rebalance (meta/talent amounts)
- [x] New currencies
- [x] Tutorial first run
- [x] Pet system

## P0 Tasks (DONE THIS SESSION)
- [x] POE2 Skill Tree: SVG canvas with pan/zoom, 8 branches, 65 nodes, click-to-preview, buy
- [x] Meta Unlock Gates: 7 meta upgrades locked until skill tree nodes purchased
- [x] Attribute System: 7 attributes (ATK/DEX/VIT/MOB/INT/ELE/MAG), 1 per profile level

## P1 Tasks (NEXT)
- [ ] Skill Tree POE2 redesign (branching nodes with SVG lines, categories)
- [ ] Equipment paperdoll (character in center, slots around)
- [ ] Gem slots on legendary/mythical equipment
- [ ] Character classes with different starting weapons/skill trees
- [ ] Daily missions expansion (5/day, give gems/coins)

## P2 Backlog
- [ ] Enemy tier system rendering (Roman numerals I-V on enemies)
- [ ] Zoom upgrade implementation in engine.js (uses meta.zoom)
- [ ] Weapon behavior fix (manual weapons: empty all mags one by one, then reload all)
- [ ] Dynamic background in-game
- [ ] Decoy skill fix (enemies stay in visibility range)
- [ ] View range upgrade (engine zoom)
- [ ] Merge system for equipment (3 of same → higher rarity)
- [ ] Character class system

## 3rd Party Integrations
- Google OAuth (Login) — uses Emergent LLM Key
- Stripe (Payments) — requires User Production API Key (currently test mode)

## DB Schema
- `runs`: `{ user_id, name, time, level, kills, victory, no_hit, created_at }`

## Key Balance Numbers
META_UPGRADES (max per level → max levels → total at max):
- HP: 1/level × 100 = 100 HP max
- DMG: 0.2%/level × 100 = 20% dmg max
- Crit: 0.1%/level × 100 = 10% crit max
- Heart heal: 0.5/level × 40 = +20 HP heal from hearts
- Zoom: 0.5%/level × 35 = 17.5% view range max

TALENT TREE (per node, per level → total per node):
- Vitality I-VI: 1.5-7.0 HP/level × 10 = 15-70 HP per node
- Power I-VI: 0.2-0.8%/level × 10 = 2-8% dmg per node
- Total HP from all vitality nodes: 215 HP at full max (same as before)

NEW ENEMIES (enter after each boss):
- After Eye of Horus (t=145): crystalite (armor), soulshard (fast/no-kb)
- After Necromancer (t=310): bonewalker (regen), voidspawn (charge)
- After Void Titan (t=465): steelbrute (high armor), lightningbug (fast)
- After A.I.D.A. (t=575): techsoldier (ranged), nanoswarm (swarm)
