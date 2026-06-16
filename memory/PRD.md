# Waterdrop Survivor — PRD

## Iter 7 (2026-06-16) — Google login + Stripe paywall + Leaderboard

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
`https://drop-warrior.preview.emergentagent.com/waterdrop-survivor.zip` (264 KB) — refreshed with all iter-6 fixes.

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
