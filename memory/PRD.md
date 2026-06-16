# Waterdrop Survivor — PRD

## Iter 5 (2026-06-16) — Restart fix + Visual upgrades + Death summary + Mobile-fit

### Critical bug fix
- **Mid-game random restart fixed**: `<GameScreen key={Math.random()}>` was forcing a remount on every App re-render. Replaced with stable `runKey` counter (only increments on retry / new run). Engine destroy + new Game instance no longer fires mid-run.
- **GameOver crash fix**: `result.wave` (object from `waveAt`) was rendered as React child → crash. Now computed from time.

### Visuals
- **Player redesign**: squish/stretch + tilt based on velocity, idle bob, iframe glow eyes, gradient droplet body.
- **Detailed rifle**: stock + grip + magazine + body + rail + sight dot + barrel + muzzle, color-shifts per equipped weapon, recoil offset on shoot, reload arc indicator, muzzle flash glow.
- **Meteor weapon/skill**: now visually falls from sky with fire trail + glowing head + growing ground shadow. Impact = 2 shockwave rings + 14 flying fire chunks + 32-particle burst + cam-shake 9.
- **Level-up explosion**: 180u AoE blast on level — damage + knockback (helps survival), 3 concentric shockwave rings, 36 golden/teal spark burst, brief iframes. Triggers BEFORE the card modal opens.
- **Movement acceleration**: velocity now lerps toward target dir (accel 9.0, decel 12.0) giving weighty "good feel" character control.

### Balance
- Slightly slower XP curve (`xpToNext * 1.42` from `1.32`) — less rushed leveling.

### Game Over screen — full reward summary
- New modern GameOver layout with: 4-stat grid (Time/Level/Kills/Wave), Rewards section (Gold/Account XP/Skill Points earned), Badges section (NEW BEST TIME / NEW LEVEL RECORD / FLAWLESS RUN / A.I.D.A. SLAIN / CHALLENGE CLEARED), 3 large buttons (Menu / Camp / RETRY).
- Compact responsive layout fits mobile (480px breakpoint).

### Level-up modal — fits iPhone 16+
- `levelup-overlay` constrained, cards reflow to 3 narrow columns in portrait, title scales clamp, height-aware media query for short viewports (<700px). No scroll required.

### New cards (8 new ADVANCED_CARDS)
- **Thunder Cult** — auto-strike random foe every 4s for 60 dmg + lightning bolt.
- **Ice Shards** — auto-homing ice projectile every 1.6s.
- **Holy Water** — heal pulse every 6s (+15 HP).
- **Swarm** — orbiting bee aura + 12 dmg pulse.
- **Spike Plates** — drop spike traps on dash/spawn (60 dmg) [data only — partial impl].
- **Overcharge** — every 6th shot doubles damage.
- **Railgun Stance** — standing still 1s+ = +60% dmg.
- **Juggernaut** — +1 regen per 5 enemies in 200u radius.

## Iter 4 (2026-06-15) — Arsenal + Casino + Challenges + Achievements + Audio + Bug Fixes
[unchanged — see git history]

## Iter 3 (2026-06-15) — Stand-alone build / packaging
[unchanged]

## Backlog
- Stage themes (lake/ruins/void/ship) (P2).
- Tutorial overlay (P3).
- Damage type icons on numbers (P3).
- Companion system (P2).
- Steam/Capacitor wrap (P3, separate ticket).
- React hooks exhaustive-deps eslint warnings (P3, cosmetic — game functionally correct).
- Spike Plates: visual + trap entity (P3).

## Tech notes
- Engine: `/app/frontend/src/game/engine.js` (~1990 lines).
- Stable `runKey` in `/app/frontend/src/App.js` controls game remount lifecycle.
- GameOver enriched via `gameOverExtras` state computed in `/app/frontend/src/components/GameScreen.jsx`.
