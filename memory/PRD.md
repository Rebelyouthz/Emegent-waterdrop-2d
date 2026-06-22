# Waterdrop Survivor — PRD

## Iter 13 (2026-02) — Crit Tiers, Magnet Fix, Weapon/Skill Caps, Map Path

### Crit Hit Tier System
- Normal hit: shows damage number (white)
- CRIT: shows "CRIT" in orange (#ff8c00) — replaces damage number
- SUPER: shows "SUPER" in red (#ff4444) — replaces damage number
- MEGA: shows "MEGA" in deep red (#cc0000) — replaces damage number
- HEAD!: shows "HEAD!" in pure red (#ff0000) — replaces damage number
- critTier logic in rollDamage, stored in s._lastCritTier, read in dealDamage
- Upgradeable via: m_superCrit meta (+4% per level, max 5), m_megaCrit meta (+2% per level, max 5)
- GameScreen.jsx buildMetaEffects adds superCrit, megaCrit stats

### Magnet / Pickup Range Fix
- Base pickup radius reduced 60 → 18 (nearly 0 at start)
- Player must upgrade via skill tree / meta / run cards to get meaningful pull

### Weapon Cap
- MAX_ACTIVE_WEAPONS: 4 → 10 (data_ext.js + engine.js buildLevelUpChoices)

### Passive Skill Max Levels (Skill Tree)
- All non-active passive skills: max 3-5 → 15-20 levels
- Active skills (dash, blink, shield, revive, headshot, berserk, aegis, phoenix, aida, void, chest): unchanged (max 1)

### Audio
- SFX volume: 0.4 → 0.54 (+35%)

### Maps Visual Path
- Node connectors (▼ arrow) between map nodes, colored by unlock/completion state



### Removals
- Combo meter completely removed (engine.js, HUD.jsx, index.css)
- Point lights (blinking rings under enemies on kill) removed

### Camp UI Scroll Hint Fix
- Added static `.camp-scroll-hint` div between profile bar and tabs
- Animated bounce hint "↓ scroll for more ↓" always visible above first tab button

### Maps System (P2 complete)
- 4 world stages: The Lake, Sunken Ruins, Void Lab, Annunaki Ship
- Each stage: 3 nodes (Easy/Medium/Hard) with duration, spawn multiplier, node chaining
- MAP_STAGES in data_ext2.js; save.mapProgress in store.js
- MapsPanel in CampPanels.jsx; 🗺 MAPS tab in Camp.jsx
- Completing a node unlocks the next; stages lock until requirements met
- Rewards (gold + SP) awarded to save on run victory

### New Achievements (+12)
- Boss hunters: Bone Collector (necro), Titan Crusher (void), Eye Closer (horus)
- Endless Walker (endlessReached), Transcendent (lvl 50), Reaper (50k kills)
- Centurion (100 runs), Dragon Hoard (50k gold), Phantom (5 no-hit), Cartographer (all maps)
- Tracked via new save fields: necroSlain, voidSlain, horusSlain, endlessReached, mapProgress

### Boss Kill Tracking
- engine.js tracks _necroKilled, _voidKilled, _horusKilled in snapshot
- App.js onRunEnd increments save fields accordingly



### Camp UI Layout
- Profile/avatar bar moved to TOP of sidebar (above all tab buttons)
- Camp header "Forge Your Edge" reduced from 30px → 22px, centered
- Tab buttons enlarged: padding 14px 18px, scroll hint updated to ::after on tabs
- `camp-profile-bar` now has `border-bottom` (was border-top)

### HUD Boss Bar Fix
- Boss bar extracted from `.hud-top` → separate `position:fixed top:0` element
- No longer overlaps weapon strip or XP bar
- CSS: `.boss-active ~ .weapon-strip` pushes strip to top:160px when boss active

### XP Audio Throttle
- `_xpPingLastT` variable, xpPing limited to max 1 call per 100ms
- Fixes inaudible rapid-fire XP sound when collecting multiple gems per frame

### Combo / Kill-Streak System
- Track kills within 1.5s rolling window in `_recentKillTimes`
- 3+ kills → COMBO xN (gold/XP multiplier = 1 + (N-2)×0.25)
- Combo resets after 2.5s inactivity
- HUD: centered "COMBO xN / ×M.M MULT" overlay with animated pop + timer bar
- Gold drops and XP gains multiplied by `combo.mult`

### Canvas Visual Effects (60-120 FPS optimized)
- **Muzzle flash**: radialGradient burst + 4 lens flare lines on fresh shots (recoil > 0.5)
- **Point lights**: additive (`lighter` composite) glow blobs on each enemy kill, capped at 30
- **Speed trails**: ghost-tails on enemies with speed > 88 (3-frame trail, decreasing alpha)
- **Boss death flash**: full screen yellow flash + expanding ring on boss kill (`_bossDeathFlash`)
- **Level-up flash**: teal radialGradient screen overlay + actual 55dmg shockwave to nearby enemies
- **Crit screen-punch**: red vignette at screen edges + white center flash on crit (`_critPunch`)



### Rarity-system (slutgiltigt)
- **6 nivåer**: Common (grå #9a8fa6) → Uncommon (grön #4dff91) → Rare (blå #4dc4ff) → Epic (lila #b362ff) → Legendary (orange #ff7a1a) → Mythical (röd #ff3146)
- Inget "magic" kvar — renamed till Uncommon överallt (data.js, data_ext.js, data_ext2.js, CampPanels.jsx, index.css)
- Level-up-kort: tydlig vänster-border per sällsynthet + tonad bakgrund + animated glow för Legendary/Mythical
- Part-chips, slot-cells, EQUIP_RARITY, CHESTS: alla uppdaterade

### Boss-buggar fixade
- Eye of Horus speed: 55 → 165 (bossen når nu spelaren!)
- Nekromansen speed: 50 → 95, Void Titan: 32 → 62, A.I.D.A.: 60 → 145
- Spawn-avstånd: 0.7 → 0.42 (bossen spawnar nära, on-screen snabbt)
- Boss flags (_hasFleed, _fleeing, _fleeTimer, _summonCD, _voidCD) resetas vid spawn
- Boss annonserar sig med namntext vid spawn (t.name + '!')

### Reset-knapp fixad
- Ersatt window.confirm + window.location.reload med in-app bekräftelsedialog
- Kallar direkt setSave(DEFAULT_SAVE) + saveLocal + onBack() — ingen sidladdning
- Svenska bekräftelsetext: "ÄR DU SÄKER? Allt raderas"

### Camp-struktur förbättrad
- Sidebar omstrukturerad: .camp-tabs-scroll (scrollbar) + .camp-profile-bar (nedan)
- Profilbild/nivå visas UNDER flik-raden (inte inne i scroll-ytan)
- Mobil: horisontell scroll med gradient-fade hint på höger sida (visar att det finns mer)

### XP-ljud (Halls of Torment-stil)
- Audio.xpPing(progress): tonhöjden stiger från 480 Hz (tom XP-bar) till 1880 Hz (full XP-bar)
- Anropas vid varje XP-gem-pickup
- Audio.waterDrop(): vattendroppe-ljud vid milstolps-/missions-belöning

### Joystick-transparens
- Ring-border: 0.40 → 0.18 opacity, glow: 0.22 → 0.08
- Ring-bakgrund: 0.30 → 0.10 opacity
- Knob-opacity: 1.0 → 0.45
- Skill-button: 0.80 → 0.45 bakgrund, ny opacity: 0.65 idle, 0.80 ready

### 18 milstolpar (utökat från 5)
- Kills: 1K/5K/20K, Runs: 10/50/100, Bossar: alla 4, Tid: 3min/5min/10min, Level: 10/25/40, NoHit, Endless

## Iter 9 (2026-02-XX) — 6-Step Gameplay Overhaul

### What was built

**1. Scythe — riktig 180° svänganimation**
- Träffar nu bara fiender i framåtriktad halvbåge (90° från siktoriktning)
- Visuell svepande ljusbåge animeras från -90° till +90° relativt aim-vinkeln
- Ljusbrant ledande kant-effekt under svängen

**2. Arc Tesla — nytt vapen (studsande blixt)**
- `behaviour: 'chain'` — drabbar närmaste fiende, studsar sedan till 3 ytterligare
- Visuell blixtlinje (lightning-partiklar) mellan varje hopp
- Weapon parts: Voltage Cell / Conductor / Arc Range / Tesla Type

**3. 6:e sällsynthetsnivå — Mythical**
- `mythical` (vikt 0.05, färg #ff4dff) lagd till RARITY + EQUIP_RARITY
- CSS: `.r-mythical` med pulserande magenta glow-animation
- Slot machine: `rar-mythical` slot cell

**4. XP Gems — blå, 4 storlekar**
- Färg ändrad från teal #4dffd4 → blå #5ba3ff med vit glow
- 4 storlekar: tiny(xp≤2), small(xp≤6), medium(xp≤15), large(xp>15)
- Stor/medium gems har vit kärnglimt

**5. Boss-uppdateringar**
- Eye of Horus flyr vid 50% HP i 15s, återvänder sedan med meddelande
- Ny boss: **Nekromansen** (t=280) — kallar 3 ghouls var 6:e sekund, grönögd skalle-rendering
- Ny boss: **Void Titan** (t=430) — avfyrar 6 void-orbs spiralformigt, hexagonal med pulserande void-öga
- WAVE_TIMELINE utökad med endless-vågor efter A.I.D.A. (t=620–1240)
- Spelet slutar INTE automatiskt efter Aida — endless mode annonseras med +500 gold bonus
- GameOverScreen visar "ENDLESS SURVIVOR" + "∞ ENDLESS MODE" rubrik om endless uppnåtts

**6. Balansering**
- Tidiga fiender +30% HP: slime 22→29, bat 14→18, brute 70→91, ranger 30→39, ghoul 35→45
- XP-kurva mjukare: multiplikator 1.42 → 1.38
- Weapon parts: hydropistol + bloodscythe + arcTesla tillagda till WEAPON_PART_OVERRIDES

## Iter 8 (2026-06-18) — Mobile UX overhaul + Slot machine + Eye of Horus + Per-weapon parts + Custom music
[preserved]

## Backlog (P1–P3)
- Fler achievements/milstolpar med belöningar (P1)
- Camp scroll: spelarprofilnivå fastnar ovanför menyn (P2)
- Kartor med progressionsstigar (P2)
- Apple Sign-In (P3, kräver $99/yr Apple Developer)
- Per-account cloud save sync (P3)


### What was built (high-impact items from user feature list, ~95 credits target)

**1. Swipe-to-dash gesture (removes dash button overlay bug)**
- The dash button no longer covers weapons/skills on touch devices — REMOVED.
- New gesture: fast flick on the LEFT joystick (>40px in <180ms) triggers a dash in the swipe direction.
- A glowing dash-ready ring appears around the left joystick; shows cooldown in seconds when on CD.
- `engine.tryDash(dirX, dirY)` accepts explicit direction; keyboard SPACE still uses movement/aim fallback.

**2. Mobile HUD redesign for iPhone 16 / phones (≤540px or coarse pointer)**
- Top bar: timer + wave + XP bar tightened, no overlap.
- **Weapon strip → top-left vertical column** (5 chips, 40×40).
- **Active skills → top-right vertical column** (5 buttons, 50×50, no fight with dash gesture area).
- **HP bar → bottom center** (between joysticks) with mag/no-hit readout.
- FPS counter + keyboard hint hidden on touch.
- Reload button → top-right (away from skills column).

**3. Eye of Horus — actually visible + winnable**
- Stylized **animated EYE rendering**: golden pulsing ring + white sclera + iris that LOOKS AT THE PLAYER + pupil + specular highlight.
- Bigger (size 60 → 90), more HP (1600 → 1200 with no time-scaling penalty), less damage (28 → 18), slower shoot rate (1.0s → 1.8s).
- **Off-screen boss arrow** — when the boss is outside the camera, a glowing pulsing golden "BOSS" arrow points toward it along the screen edge so the player always knows where it is.

**4. Custom uploaded music in menus + game**
- The user-uploaded `Waterdrop survivor .mp3` (6.7MB) is now served from `/public/menu-music.mp3` and loaded on first user interaction.
- Music starts on first pointer/key/touch (browsers block autoplay otherwise).
- Music continues across welcome → camp → game without restarting.

**5. Per-weapon themed parts (Weaponsmith)**
- `WEAPON_PART_OVERRIDES` lets each weapon rename its part slots & tier names thematically.
- Examples:
  - **Meteor Rain**: Meteor Volume (Solo/Pair/Cluster/Swarm), Targeting, Impact, Meteor Type (Stone/Burning/Splitting/Voidshard)
  - **Void Beam**: Power Cell, Lens, Aperture, Beam Type
  - **Ember Orbs**: Orb Count (Two/Three/Four/Six), Orbit Pattern, Ember Power, Burn
  - **Shotgun/Tidal**: Shell Box, Choke, Barrel/Wave Length, Shell Type (Buckshot/Slugs/Incendiary/Voidshell)
  - **Ice Lance**: Shard Stack, Lock, Spear Length, Frost Type
  - **Plasma Lance, Runic Rifle, Twin SMG, Rune Bolts, Scythe** — all themed.

**6. Card Shop — slot machine dopamine**
- THREE physical reels instead of one card flipping.
- Each reel spins independently with staggered stop times (900ms, 1450ms, 2100ms) — classic slot-machine suspense.
- Reel blur during spin, bounce-in pop animation when each stops, sound feedback per stop.
- Rarity color glow flashes around result cells (legendary = golden pulsing).
- Jackpot scale-bounce on legendary pull.
- Suspense text "SPINNING…" with pulse.

**7. Better per-weapon projectile visuals (with level scaling)**
- Each weapon's projectile now renders with its own custom shape and glow:
  - **Hydropistol**: cyan water droplet (elongated tear)
  - **Auto Bolts / Runic Rifle**: bright glowing tracer rod
  - **Twin SMG**: yellow bullet rectangle
  - **Tidal/Shotgun**: golden pellet
  - **Ice Lance**: sharp ice diamond with cyan stroke
  - **Plasma Lance**: plasma orb with crackling lightning
  - **Rune Bolts**: purple kite-shaped magic dart
  - **Default**: glow ball + trail
- Each visual scales by 8% per weapon level → upgrades feel visually meaningful.

**8. Frame-loop hardening (carried forward from iter 6)**
- `update`/`render`/`onTick` wrapped in try/catch. requestAnimationFrame ALWAYS requeues. No more silent freezes.

### Skipped (user explicitly requested skip): Maps with missions, More achievements/milestones
### Deferred to future session
- More new weapons & active skills
- Per-level projectile evolution (currently scales but no new shape on milestones)
- New level-up cards
- More missions content

### Backlog (P3, cheap when budget allows)
- Apple Sign-In (still requires $99/yr Apple Dev account)
- React hook deps lint warnings (cosmetic)
- Spike Plates visual trap entity

### Zip download (latest)
`https://waterdrop-preview.preview.emergentagent.com/waterdrop-survivor.zip` — now ~7 MB (includes custom mp3).

## Iter 7 (2026-06-16) — Google login + Stripe paywall + Leaderboard
[preserved]

## Iter 6 (2026-06-16) — Level-up loop fix
[preserved]


### What was built
**Goal**: Make the game monetizable as a one-time $1.99 unlock with a global leaderboard, gated by Google sign-in.

### Backend (server.py — extended)
- **Emergent Google Auth** (managed): `POST /api/auth/session` exchanges fragment session_id, sets httpOnly cookie `session_token` (7-day), upserts user doc with custom `user_id = user_<uuid12>`. `GET /api/auth/me`, `POST /api/auth/logout`.
- **Stripe one-time paywall** ($1.99) via `emergentintegrations.payments.stripe.checkout`:
  - `POST /api/payment/checkout` (auth-required) — creates Checkout Session, server-side `amount` (never trusted from FE), records `payment_transactions` row as `initiated`.
  - `GET /api/payment/status/{session_id}` — polls Stripe, updates `payment_transactions`, grants `entitlements.paid=true` ONCE per session.
  - `POST /api/webhook/stripe` — defensive duplicate path that also grants entitlement.
  - `GET /api/entitlement` — public; returns `{paid, user, price_usd, title}`.
- **Leaderboard**:
  - `POST /api/leaderboard/submit` (auth-required) — stores `{user_id, name, picture, time, level, kills, victory, no_hit}`.
  - `GET /api/leaderboard?limit=50&sort_by=time|kills|level` — public. Falls back to legacy `runs` collection if empty.
- New env vars: `STRIPE_API_KEY=sk_test_emergent`, `GAME_PRICE_USD=1.99`, `GAME_TITLE`.

### Frontend
- `/app/frontend/src/auth.js` — `<AuthProvider>` + `useAuth()` (user, paid, price, login(), logout(), refresh()); `<AuthCallback>` (detects `#session_id=` in URL fragment, exchanges, reloads); `<StripeReturnHandler>` (detects `?stripe_session_id=...` after Stripe returns, polls status, refreshes entitlement, shows verification overlay).
- `/app/frontend/src/components/PaywallModal.jsx` — blocks game start, shows price + "Sign in with Google" → "Buy Now". Opens Stripe Checkout in same tab via redirect.
- `/app/frontend/src/components/LeaderboardPanel.jsx` — sortable by time/kills/level, fetches `/api/leaderboard`, renders avatars + badges.
- `Welcome.jsx` — top-right `AccountWidget` shows user / login button + 🏆 leaderboard button; opens leaderboard as modal.
- `App.js` — `tryStartGame()` gate. If `paid=false`, shows `<PaywallModal>` before allowing `Enter the Lake` / mission start. Submits run results to `/api/leaderboard/submit` (fire-and-forget) when user is logged in.

### Verified end-to-end (curl + browser)
- `GET /api/health` → `{price_usd: 1.99}` ✓
- `GET /api/auth/me` w/ seeded bearer token → returns Test Survivor user ✓
- `GET /api/entitlement` w/ token → `{paid:false, user:{name:'Test Survivor',...}}` ✓
- `POST /api/payment/checkout` w/ token → returns real Stripe URL `https://checkout.stripe.com/c/pay/cs_test_...` ✓
- `POST /api/leaderboard/submit` w/ token → stores ✓
- `GET /api/leaderboard` → returns the submitted row ✓
- Browser: Welcome shows account widget, "Enter the Lake" opens paywall modal with $1.99 + Google sign-in button, leaderboard modal opens with rows ✓

### Test card for Stripe test mode
`4242 4242 4242 4242` · any expiry/CVC/ZIP

### Pricing
Set via `GAME_PRICE_USD` env var (currently 1.99). Change in `/app/backend/.env` to adjust.

## Iter 6 (2026-06-16) — Critical level-up loop fix
[previous content preserved]

## Iter 5 (2026-06-16) — Restart fix + visuals
[previous content preserved]

## Backlog
- Apple Sign-In (needs Apple Developer account $99/yr + custom impl)
- Per-account save sync (currently saves stay in localStorage)
- Stage themes (P2), companion system (P2)
- "Best Run Highlight" auto-shareable card (P3)
- Code-review nitpicks (eslint hook-deps, empty catches) — deferred as cosmetic


### THE BUG
User reported: after first level-up, modal kept showing the "same" level-up screen multiple times → game eventually froze. Root cause was actually two separate issues:

1. **addXp ran a `while` loop** that incremented `r.level` multiple times in a single XP gain (e.g., one gem could push you from level 1 → 5 instantly), queuing 4 separate level-up cards. From the user's perspective this looked like "the same level 2 screen repeating" because the modal kept opening rapidly with new card sets.
2. **useEffect dep on `levelUpChoices`** caused re-fire on every `setLevelUpChoices(null)`, and the stale `snap` still said `pendingLevelUp=true` → modal could re-open before the next engine tick arrived.

### FIX
- Split `addXp` into:
  - `addXp(amount)` — just banks XP into `r.xp`.
  - `_maybeLevelUp()` — increments level by **exactly one** if queue is empty and XP threshold reached. Triggers the visual blast + iframes for that single level.
- `applyCardChoice` now ends with `this._maybeLevelUp()`, so picking a card decrements queue → checks if banked XP can fuel another level → spawns next level-up screen with new level number.
- `useEffect` in GameScreen now reads `gameRef.current.levelUpQueue` (LIVE engine state) instead of stale `snap.pendingLevelUp`.

### RESULT (verified by test harness)
- `addXp(10)` → q=1, lvl=2, 3 cards → pick → q=0, lvl=2, modal closed, **no loop**.
- `addXp(2000)` → q=1, lvl=3 (not 11 instantly), 3 cards → each pick ticks lvl: 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 with fresh card choices and the modal title clearly showing the new level number each time.

### Also: frame-loop hardening
Wrapped `update/render/onTick` in try/catch with `requestAnimationFrame(this.frame)` ALWAYS re-queued, so no single exception can kill the game loop again (previously caused the "audio works but canvas frozen" symptom).

### Zip download
`https://waterdrop-preview.preview.emergentagent.com/waterdrop-survivor.zip` (264 KB) — refreshed with all iter-6 fixes.

## Iter 5 (2026-06-16) — Restart fix + visual upgrades + death summary + mobile-fit
[previous content preserved — see file history]

## Backlog (unchanged)
- Stage themes (P2), companion system (P2), tutorial overlay (P3), Capacitor wrap (P3).
- React hook exhaustive-deps cosmetic warnings (P3).
- Spike Plates visual trap entity (P3).


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


## Batch 1 komplett (2026-06-22) — Snabba A–G

### A. Ljud-mix
- SFX default: 0.54 → 1.0 (max)
- Musik default: 0.15 → 0.28 (~28%)
- Settings-slider visar nya defaults korrekt

### B. Fiende/spelare HP
- Spelare start-HP: 100 → 50 (-50%)
- Fiende HP: ×1 → ×3 (200% mer)
- Boss HP: ×1 → ×3

### C. Betalvägg efter 3:e run
- `runStarts` spåras i save
- Gratis run om `runStarts < 3`, annars paywall

### D. Röda hjärtan
- 3.5% chans per fiende att droppa ♥️
- Helar 10% max-HP vid pickup
- `heartPickup()` ljud tillagt

### E. Guld 4 storlekar + XP-kurva
- Guld: 4 storlekar (1-2, 3-5, 6-12, 13+)
- XP start: 4 → 16; tillväxt: ×1.38+3 → ×1.25+6 (långsammare tidigt)

### F. In-game passiva ikoner
- Passiva kort spåras i `run.pickedPassives`
- Visas som `passive-chip`-rad under vapnen i HUD

### G. Dopamin-animation
- CSS `@keyframes cardPop` + `.card-pop` klass
- Meta-uppgradering i Camp triggar zoom+shake-animation



## Iter 14 (2026-06-22) — Free Spin Counter, Level Up Streak Bonus

### claimPing Audio
- Bekräftad korrekt: 480Hz → 240Hz dip → 860Hz (positiv uppåtgående vattendroppe)

### Free Spin Counter i Card Shop
- `CardShopModal` visar "🎰 X FREE SPIN(S)" bredvid pull-info när `save.freeShopSpins > 0`

## Batch 2 komplett (2026-06-22) — Alla Medium + Stora Features

### Bugg-fix: Utrustade föremål i Chest-listan
- `.card` klassen på mobil kollapsar till 46% bredd → skapar visuell rotation
- Nytt: `.equip-mini` klass utan flex-problem, ersätter `.drop-item.card` i equip-slots

### K — Character-tabb
- `CharacterPanel.jsx` skapad: Rarity-bar, Level 0-15 per rarity, Evolve
- Nya save-fält: `character`, `charBonuses`
- Profile Level-Up ger nu 🔷 Pieces och 💎 Shards
- Character-stats appliceras i `buildMetaEffects` (GameScreen.jsx)
- Weapon-slots + skill-slots begränsas av character rarity (2→7)

### J — Talent Tree
- `TalentTree.jsx` skapad: 30 noder, visuella linjer, milstenar var 5:e
- Noder köps i ordning nerifrån, milestone-noder framhävda
- `talentBonuses` appliceras i buildMetaEffects

### L — Campaign Questline
- `CampaignPanel.jsx` skapad: 12 uppdrag, check-funktioner, claim-knappar
- Ny "📜 CAMPAIGN"-tab i Camp

### I — Card Shop Overhaul
- 4 sektioner: PASSIVE / ACTIVE / AUTO / MANUAL
- `rollShopPull3()`: 3 oberoende reels, jackpot (3 lika) = +2 rarity
- 2-match = +1 rarity bonus
- Jackpot-animationer: guld-flash, banner
- `unlockWeapon` effect hanteras: sparar till `save.unlockedWeapons`

### H — Combo Meter
- `comboCount`, `comboTimer`, `maxCombo` i engine run-state
- Decay efter 1.8s utan kill
- HUD visar ×N COMBO med decay-bar

### 6 Nya Vapen (data.js)
- Auto: chainlightning, whirlwind, boneshards (`requireUnlock: true`)
- Manual: daggers, flameburst, icespike (`requireUnlock: true`)
- Weapon-filter i engine: visas bara i level-up om unlockad


- Pull-knappen ändras till "🎰 FREE PULL! (X left)" och hoppar över guldkostnad
- `freeShopSpins` dekrementeras korrekt vid användning

### Level Up Streak Bonus
- Nytt save-fält: `levelUpStreak: { day: number, count: number }`
- `addAccountXp()` i `store.js` spårar rank-ups per dag
- Vid 3:e rank-up samma dag: `mult = 2` → guld & SP fördubblas
- `pendingLevelUp` får `streakBonus: true, streakCount: N`
- `LevelUpOverlay` i `Camp.jsx` visar "★ 2× STREAK BONUS! ★" med gyllene glow

