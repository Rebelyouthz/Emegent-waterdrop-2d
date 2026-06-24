# Waterdrop Survivor — PRD & Changelog

## Original Problem Statement
Continue developing a React+Canvas 2D twin-stick survivor game "Waterdrop Survivor". Implement:
- Massive progression: Character Rarity, POE2-styled Skill Tree, Pet System
- Rebalance for extreme grinding (tiny meta increments)
- New currencies: Gems, Slot Coins, Talent Points
- Features: Pet Tab, Equipment Paperdoll, Battle Pass grid, Codex Library

## Architecture
```
/app/frontend/src/
├── App.js
├── store.js
├── components/
│   ├── Camp.jsx          # Main hub with all tabs
│   ├── SkillTree.jsx     # POE2 SVG skill tree (pan+zoom)
│   ├── GearPanel.jsx     # Equipment paperdoll + forge
│   ├── MetaFeatures.jsx  # BattlePassPanel + CodexPanel
│   ├── CharacterPanel.jsx
│   ├── PetPanel.jsx
│   └── ...
└── game/
    ├── engine.js         # Canvas game loop (2792 lines)
    ├── data.js           # ENEMIES, STAT_CARDS, META_UPGRADES
    ├── data_ext.js       # Weapons, chests, shop
    ├── data_ext2.js      # Talents, rarity, active skills
    ├── poe_tree.js       # POE tree data (65 nodes, 8 branches)
    └── gear.js           # Equipment item system
```

## Save Format (localStorage wds.save.v1)
```js
{
  gold, gems, slotCoins, talentPoints, petFood, sp,
  profile: { name, avatar, level, xp },
  meta: {}, skills: {}, talent: {}, talentBonuses: {},
  attrs: {},               // POE attribute allocations
  character: { rarity, level, pieces, shards },
  gearInventory: [],       // [{ id, slot, rarity, stat, val, name }]
  gearEquipped: {},        // { helmet: itemId, ... }
  codex: { enemies: {}, weapons: {} },
  battlePass: { claimed: [] },
  pets: [], petEggs: [],
  inventory: [], equipped: {}, parts: [], equippedParts: {}
}
```

## Completed Features (all tested ✅)
- [x] React + Canvas 120fps game loop (engine.js)
- [x] Gamepad + mouse aim support
- [x] 8 new enemy types + 4 bosses
- [x] Kill/hit particles, screen flash, combo meter
- [x] Currency system: Gold, Gems, Slot Coins, Talent Points, SP
- [x] Chest system using Gems
- [x] Character Rarity leveling + shard auto-grant
- [x] Card Shop with Slot Coins
- [x] POE2 Skill Tree (SVG, pan+zoom, 65 nodes, 8 branches)
- [x] Meta Unlock Gates (7 meta upgrades locked by skill tree)
- [x] Attribute System (7 attributes, 1 per profile level)
- [x] Equipment Paperdoll (7 slots, forge/merge, gear drops from runs)
- [x] Season Pass (40 reward nodes, based on profile XP)
- [x] Codex Library (enemies/bosses/weapons discovery log)
- [x] Balance: enemy HP +50-100%, enemy dmg increased, in-run cards nerfed
- [x] Vampirism card: 0.1% (was 5%), requires Bloodline skill tree node
- [x] Character rarity levels: rare=10, epic=15, legendary=20, mythical=25

## P1 Remaining
- [ ] Equipment drops in-game HUD notification (item pickup animation)
- [ ] Codex weapon tracking (track when a weapon is used in runs)
- [ ] Daily Missions expansion (5/day → gems+coins+petFood)

## P2/Backlog
- [ ] Idle/Patrol System (send pets on offline missions)
- [ ] Dynamic in-game background
- [ ] Achievement rewards in Codex
- [ ] Better boss fight UI (HP bar, special warnings)
