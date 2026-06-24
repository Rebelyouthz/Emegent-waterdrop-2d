// Waterdrop Survivor — Canvas 2D engine with pooling, twin-stick combat, juicy effects.
import { WEAPONS, ENEMIES, STAT_CARDS, RARITY, rollRarity, waveAt, nextBossEvent } from './data';
import { ACTIVE_SKILLS, KILL_FX, ADVANCED_CARDS } from './data_ext2';
import { Audio } from './audio';

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const len = (x, y) => Math.hypot(x, y);

class Pool {
  constructor(factory, size) {
    this.factory = factory;
    this.free = []; this.active = [];
    for (let i = 0; i < size; i++) this.free.push(factory());
  }
  acquire() {
    const o = this.free.pop() || this.factory();
    o.alive = true;
    o._gen = (o._gen || 0) + 1;
    this.active.push(o);
    return o;
  }
  release(o) {
    if (!o.alive) return;
    o.alive = false;
    const i = this.active.indexOf(o);
    if (i >= 0) this.active.splice(i, 1);
    this.free.push(o);
  }
  // Safe iteration: snapshot active array length and skip dead-during-iteration.
  forEach(fn) {
    const arr = this.active;
    for (let i = arr.length - 1; i >= 0; i--) {
      const o = arr[i];
      if (o && o.alive) fn(o, i);
    }
  }
}

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.meta = opts.meta || {}; // permanent upgrades effects
    this.callbacks = opts.callbacks || {};
    this.W = 0; this.H = 0; this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.input = { x: 0, y: 0, mx: 0, my: 0, shooting: false, keys: {}, pause: false };
    this.cam = { x: 0, y: 0, shake: 0, slowmo: 0 };
    this.world = { w: 6400, h: 6400 };
    this.time = 0; // game seconds
    this.dt = 0;
    this.last = performance.now();
    this.acc = 0;
    this.over = false;
    this.paused = false;
    this.levelUpQueue = 0;
    this.victory = false;
    this.fps = 60;

    // Pools
    this.enemies = new Pool(() => ({ alive: false, x: 0, y: 0, vx: 0, vy: 0, hp: 0, maxHp: 0, t: null, hit: 0, cd: 0, dz: 0, kbX: 0, kbY: 0 }), 600);
    this.projs = new Pool(() => ({ alive: false, x: 0, y: 0, vx: 0, vy: 0, dmg: 0, pierce: 0, life: 0, hit: new Set(), color: '', size: 4, homing: 0, friendly: true, crit: false }), 400);
    this.eprojs = new Pool(() => ({ alive: false, x: 0, y: 0, vx: 0, vy: 0, dmg: 0, life: 0, color: '#ff3146', size: 5 }), 200);
    this.parts = new Pool(() => ({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 0, color: '', size: 1, type: 'blood' }), 1200);
    this.gems = new Pool(() => ({ alive: false, x: 0, y: 0, xp: 0, gold: 0, t: 0, heart: 0 }), 400);
    this.dmgNums = new Pool(() => ({ alive: false, x: 0, y: 0, life: 0, text: '', color: '#fff', vy: 0, size: 14 }), 300);
    this.corpses = []; // simple corpse list (rendered floor decals)
    this.bloodDecals = []; // floor blood (capped)

    // Player
    this.player = this.createPlayer();

    // Stats / run state
    this.run = {
      time: 0, kills: 0, level: 1, xp: 0, xpToNext: 16, gold: 0,
      comboCount: 0, comboTimer: 0, maxCombo: 0,
      ownedWeapons: opts.startWeapons || ['hydropistol'],
      weaponLvls: {},
      noHit: true,
      activeSkillUses: 0,
      stats: {
        damageMult: 1.0 + (this.meta.dmg || 0),
        fireRateMult: 1.0 + (this.meta.atks || 0),
        moveMult: 1.0 + (this.meta.mspd || 0),
        maxHp: 50 + (this.meta.maxHp || 0),
        regen: (this.meta.regen || 0),
        armor: (this.meta.armor || 0),
        crit: 0.05 + (this.meta.crit || 0),
        critDmgMult: 1.5 + (this.meta.critd || 0),
        superCritChance: (this.meta.superCrit || 0),
        megaCritChance:  (this.meta.megaCrit  || 0),
        areaMult: 1.0 + (this.meta.area || 0),
        projBonus: (this.meta.proj || 0),
        pickupMult: 1.0 + (this.meta.pickup || 0),
        xpMult: 1.0 + (this.meta.xp || 0),
        goldMult: 1.0 + (this.meta.gold || 0),
        pierceBonus: (this.meta.pierce || 0),
        dodge: (this.meta.dodge || 0),
        reloadMult: 1.0,
        magBonus: 0,
        luck: 0.5 + (this.meta.luck || 0),
        revive: this.meta.revive ? 1 : 0,
        headshot: (this.meta.headshot || 0),
        berserk: this.meta.berserk ? 1 : 0,
        dash: this.meta.dash ? 1 : 0,
        dashCDMult: 1.0 - (this.meta.dashcd || 0),
        blink: this.meta.blink ? 1 : 0,
        shield: this.meta.shield ? 1 : 0,
        bossDmg: 1.0 + (this.meta.bossDmg || 0),
        voidBurst: (this.meta.voidBurst || 0),
        heartHeal: (this.meta.heartHeal || 0),
        zoom:      (this.meta.zoom || 0),
        // Advanced card flags
        flags: this.meta.flags || {},
      },
    };
    for (const w of this.run.ownedWeapons) this.run.weaponLvls[w] = 0;
    // Glass cannon adjust
    if (this.run.stats.flags.glassCannon) {
      this.run.stats.damageMult *= 2.5;
      this.run.stats.maxHp = Math.floor(this.run.stats.maxHp * 0.5);
    }
    this.player.maxHp = this.run.stats.maxHp;
    this.player.hp = this.player.maxHp;

    // Wave spawn state
    this.spawnTimer = 0;
    this.bossActive = null;
    this.nextBoss = nextBossEvent(0);
    this.bossesKilled = 0;
    this._aidaKilled = false;
    this._endlessAnnounced = false;

    // Canvas visual effects state
    this._bossDeathFlash = 0;
    this._critPunch = 0;
    this._levelUpFlash = 0;
    // Boss-specific kill tracking
    this._necroKilled = false;
    this._voidKilled = false;
    this._horusKilled = false;

    // Active skills slots and cooldowns
    this.activeSkills = (opts.activeSkills || []).slice(0, this.meta.skillSlots || 2);
    this.skillCD = {};
    for (const k of this.activeSkills) this.skillCD[k] = 0;

    // Stage / challenge config
    this.stage = opts.stage || null;
    this.challenge = opts.challenge || null;
    this.targetDuration = (this.challenge && this.challenge.duration) || (opts.missionDuration || 9999);
    this.killGoal = (this.challenge && this.challenge.killGoal) || 0;
    this.spawnMultExtra = (this.challenge && this.challenge.spawnMult) || (opts.spawnMult || 1.0);

    // periodic ticks for card flags
    this._auraTick = 0; this._knockTick = 0; this._mirrorTick = 0;

    this.bindInput();
    this.resize();

    // Initial starter cards
    const boons = this.meta.startBoon || 0;
    for (let i = 0; i < boons; i++) this.levelUpQueue++;

    this.frame = this.frame.bind(this);
    this.running = true;
    requestAnimationFrame(this.frame);
  }

  createPlayer() {
    return {
      x: this.world.w / 2, y: this.world.h / 2,
      r: 14, hp: 100, maxHp: 100,
      iframes: 0, hit: 0, regenCarry: 0,
      aimX: 1, aimY: 0,
      reloading: false, reloadT: 0, mag: 12,
      shootCD: 0,
      moving: false,
      // velocity smoothing
      vx: 0, vy: 0, dirX: 0, dirY: 0,
      // visual feedback
      squish: 0, tilt: 0, bob: 0,
      recoil: 0,
      orbitAngle: 0,
      shockwaveCD: 0, scytheCD: 0, beamCD: 0, boltCD: 0, teslaCD: 0,
      meteorCD: 0,
      dashCD: 0, dashing: 0, dashVX: 0, dashVY: 0,
      shieldCharge: 1, shieldCD: 0,
    };
  }

  resize() {
    const c = this.canvas;
    this.W = c.clientWidth; this.H = c.clientHeight;
    c.width = Math.floor(this.W * this.dpr);
    c.height = Math.floor(this.H * this.dpr);
    const zoom = this._visionZoom || 1;
    this.ctx.setTransform(this.dpr / zoom, 0, 0, this.dpr / zoom, 0, 0);
  }

  destroy() {
    this.running = false;
    window.removeEventListener('keydown', this._kd);
    window.removeEventListener('keyup', this._ku);
    window.removeEventListener('mousemove', this._mm); // window-level
    window.removeEventListener('mousedown', this._md);
    window.removeEventListener('mouseup', this._mu);
    document.removeEventListener('visibilitychange', this._vis);
    this.canvas.removeEventListener('touchstart', this._ts);
    this.canvas.removeEventListener('touchmove', this._tm);
    this.canvas.removeEventListener('touchend', this._te);
    window.removeEventListener('resize', this._rs);
    if (this._gpLoop) cancelAnimationFrame(this._gpLoop);
  }

  bindInput() {
    this._kd = (e) => {
      const k = e.key.toLowerCase();
      this.input.keys[k] = true;
      if (k === 'r') this.tryReload();
      if (k === ' ' || k === 'shift') { e.preventDefault(); this.tryDash(); }
      if (k === '1') this.tryActiveSkill(0);
      if (k === '2') this.tryActiveSkill(1);
      if (k === '3') this.tryActiveSkill(2);
      if (k === '4') this.tryActiveSkill(3);
      if (e.key === 'Escape' || k === 'p') {
        if (this.callbacks.onPauseToggle) this.callbacks.onPauseToggle();
      }
    };
    this._vis = () => { if (document.hidden && this.callbacks.onPauseToggle && !this.paused) this.callbacks.onPauseToggle(); };
    document.addEventListener('visibilitychange', this._vis);
    this._ku = (e) => { this.input.keys[e.key.toLowerCase()] = false; };

    // === Mouse: window-level so aim never gets stuck when leaving canvas ===
    this._mm = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.input.mx = e.clientX - rect.left;
      this.input.my = e.clientY - rect.top;
    };
    this._md = (e) => { if (e.button === 0) this.input.shooting = true; };
    this._mu = (e) => { if (e.button === 0) this.input.shooting = false; };

    // touch (mobile fallback)
    this._ts = (e) => { this.input.shooting = true; this._tm(e); };
    this._tm = (e) => {
      if (e.touches.length) {
        const rect = this.canvas.getBoundingClientRect();
        this.input.mx = e.touches[0].clientX - rect.left;
        this.input.my = e.touches[0].clientY - rect.top;
      }
    };
    this._te = () => { this.input.shooting = false; };
    this._rs = () => this.resize();

    window.addEventListener('keydown', this._kd);
    window.addEventListener('keyup', this._ku);
    window.addEventListener('mousemove', this._mm);   // FIXED: window-level
    window.addEventListener('mousedown', this._md);   // FIXED: window-level
    window.addEventListener('mouseup', this._mu);     // FIXED: window-level
    this.canvas.addEventListener('touchstart', this._ts, { passive: true });
    this.canvas.addEventListener('touchmove', this._tm, { passive: true });
    this.canvas.addEventListener('touchend', this._te);
    window.addEventListener('resize', this._rs);

    // === Gamepad support ===
    this._pollGamepad();
  }

  _pollGamepad() {
    const poll = () => {
      if (!this.running) return;
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gamepads) {
        if (!gp) continue;
        // Left stick: movement
        const lx = Math.abs(gp.axes[0]) > 0.12 ? gp.axes[0] : 0;
        const ly = Math.abs(gp.axes[1]) > 0.12 ? gp.axes[1] : 0;
        if (lx || ly) this.input.joyMove = { x: lx, y: ly };
        else if (this.input.joyMove) this.input.joyMove = { x: 0, y: 0 };

        // Right stick: aim
        const rx = Math.abs(gp.axes[2]) > 0.12 ? gp.axes[2] : 0;
        const ry = Math.abs(gp.axes[3]) > 0.12 ? gp.axes[3] : 0;
        if (rx || ry) this.input.joyAim = { x: rx, y: ry };
        else if (rx === 0 && ry === 0) this.input.joyAim = this.input.joyAim || { x: 0, y: 0 };

        // Right trigger (RT / R2): shoot
        const rt = gp.buttons[7]?.value || 0;
        const rb = gp.buttons[5]?.pressed;
        this.input.shooting = rt > 0.4 || rb;

        // A button: dash
        if (gp.buttons[0]?.pressed) this.tryDash();
        // B: reload
        if (gp.buttons[1]?.pressed) this.tryReload();
        // Y: skill 1
        if (gp.buttons[3]?.pressed) this.tryActiveSkill(0);
        // X: skill 2
        if (gp.buttons[2]?.pressed) this.tryActiveSkill(1);
        // Start: pause
        if (gp.buttons[9]?.pressed && this.callbacks.onPauseToggle) this.callbacks.onPauseToggle();
        break; // use first connected gamepad
      }
      this._gpLoop = requestAnimationFrame(poll);
    };
    this._gpLoop = requestAnimationFrame(poll);
  }

  setPaused(p) { this.paused = p; this.last = performance.now(); }

  frame(now) {
    if (!this.running) return;
    try {
      let dt = (now - this.last) / 1000;
      this.last = now;
      // Cap dt to avoid spiral-of-death, min to avoid NaN
      if (dt > 0.1) dt = 0.1;
      if (dt < 0.0001) dt = 0.0001;
      // FPS tracking (EWMA)
      this.fps = this.fps * 0.92 + (1 / dt) * 0.08;
      // Adaptive quality: reduce shadows/blur when FPS < 55
      this._qualityHigh = this.fps > 55;

      if (!this.paused && !this.over && this.levelUpQueue === 0) {
        const speed = this.cam.slowmo > 0 ? 0.35 : 1.0;
        try { this.update(dt * speed); } catch (e) { console.error('[engine.update]', e); }
        this.cam.slowmo = Math.max(0, this.cam.slowmo - dt);
      }
      try { this.render(); } catch (e) { console.error('[engine.render]', e); }
      if (this.callbacks.onTick) {
        try { this.callbacks.onTick(this.snapshot()); } catch (e) { console.error('[engine.onTick]', e); }
      }
    } catch (e) {
      console.error('[engine.frame fatal]', e);
    }
    // ALWAYS re-queue — never let an error kill the loop
    requestAnimationFrame(this.frame);
  }

  snapshot() {
    return {
      time: this.run.time,
      hp: this.player.hp, maxHp: this.player.maxHp,
      level: this.run.level, xp: this.run.xp, xpToNext: this.run.xpToNext,
      kills: this.run.kills, gold: this.run.gold,
      mag: Math.max(0, Math.floor(this.player.mag)),
      reloading: this.player.reloading,
      weapons: this.run.ownedWeapons.map(id => ({
        id, icon: WEAPONS[id].icon, lvl: (this.run.weaponLvls[id] || 0) + 1, name: WEAPONS[id].name,
      })),
      over: this.over,
      victory: this.victory,
      fps: this.fps,
      pendingLevelUp: this.levelUpQueue > 0,
      wave: waveAt(this.run.time),
      bossActive: !!this.bossActive,
      bossHp: this.bossActive ? this.bossActive.hp : 0,
      bossMaxHp: this.bossActive ? this.bossActive.maxHp : 0,
      bossName: this.bossActive ? this.bossActive.t.name : '',
      dashCD: this.player.dashCD,
      dashReady: this.run.stats.dash > 0,
      shieldReady: this.run.stats.shield > 0 && this.player.shieldCharge > 0,
      activeSkills: this.activeSkills.map(id => ({
        id, icon: ACTIVE_SKILLS[id] ? ACTIVE_SKILLS[id].icon : '?',
        name: ACTIVE_SKILLS[id] ? ACTIVE_SKILLS[id].name : id,
        cd: this.skillCD[id] || 0,
        maxCd: ACTIVE_SKILLS[id] ? ACTIVE_SKILLS[id].cd : 1,
      })),
      noHit: this.run.noHit,
      targetDuration: this.targetDuration,
      killGoal: this.killGoal,
      challenge: this.challenge,
      aidaKilled: this._aidaKilled,
      endless: this._endlessAnnounced,
      necroKilled: this._necroKilled,
      voidKilled:  this._voidKilled,
      horusKilled: this._horusKilled,
      passiveIcons: (this.run.pickedPassives || []).slice(0, 14),
      combo: this.run.comboCount,
      comboTimer: this.run.comboTimer,
      maxCombo: this.run.maxCombo,
    };
  }

  setMobileInput(joyMove, joyAim, firing) {
    this.input.joyMove = joyMove;
    this.input.joyAim = joyAim;
    if (firing !== undefined) this.input.shooting = firing;
  }

  // ====== UPDATE ======
  update(dt) {
    this.run.time += dt;
    // Combo decay
    if (this.run.comboTimer > 0) {
      this.run.comboTimer -= dt;
      if (this.run.comboTimer <= 0) { this.run.comboTimer = 0; this.run.comboCount = 0; }
    }
    this.time += dt;
    this.cam.shake = Math.max(0, this.cam.shake - dt * 30);

    // FORCE mouse aim update every frame - fixes mouse not aiming (shoots only in fixed dir)
    // Convert screen mouse to world relative to player for proper twin-stick aim
    if (!this.input.joyAim || (!this.input.joyAim.x && !this.input.joyAim.y)) {
      const p = this.player;
      const mx = this.input.mx - this.W / 2 + this.cam.x;
      const my = this.input.my - this.H / 2 + this.cam.y;
      const dx = mx - p.x;
      const dy = my - p.y;
      const l = len(dx, dy) || 1;
      p.aimX = dx / l;
      p.aimY = dy / l;
    }

    // Active skill cooldown ticks
    for (const k of Object.keys(this.skillCD)) this.skillCD[k] = Math.max(0, this.skillCD[k] - dt);
    // Timewarp + Vortex timers
    this._timewarpT = Math.max(0, (this._timewarpT || 0) - dt);
    this._vortexT = Math.max(0, (this._vortexT || 0) - dt);

    this.updatePlayer(dt);
    this.updateWeapons(dt);
    this.updateEnemies(dt);
    this.updateProjs(dt);
    this.updateEProjs(dt);
    this.updateParts(dt);
    this.updateGems(dt);
    this.updateDmgNums(dt);
    this.spawnWave(dt);
    this.tickCardFlags(dt);

    // Canvas effects decay
    this._bossDeathFlash = Math.max(0, this._bossDeathFlash - dt * 2.5);
    this._critPunch      = Math.max(0, this._critPunch - dt * 5);
    this._levelUpFlash   = Math.max(0, this._levelUpFlash - dt * 4);

    if (this.nextBoss && this.run.time >= this.nextBoss.t && !this.bossActive) {
      this.spawnBoss(this.nextBoss.event);
      this.nextBoss = nextBossEvent(this.run.time + 0.1);
    }

    // Challenge / mission completion
    if (this.killGoal > 0 && this.run.kills >= this.killGoal && !this.over) {
      this.victory = true; this.over = true;
      if (this.callbacks.onGameOver) this.callbacks.onGameOver({ ...this.snapshot(), victory: true, completed: 'killGoal' });
    }
    if (this.targetDuration && this.targetDuration < 999 && this.run.time >= this.targetDuration && !this.over) {
      this.victory = true; this.over = true;
      if (this.callbacks.onGameOver) this.callbacks.onGameOver({ ...this.snapshot(), victory: true, completed: 'duration' });
    }

    if (this._aidaKilled && !this._endlessAnnounced) {
      this._endlessAnnounced = true;
      this.cam.shake = 22; this.cam.slowmo = 0.25;
      this.spawnDamageNumber(this.player.x, this.player.y - 80, '∞ ENDLESS', '#ff4dff');
      this.spawnDamageNumber(this.player.x, this.player.y - 50, '+500 GOLD', '#ffd166');
      this.run.gold += 500;
      this.spawnRing(this.player.x, this.player.y, 200, '#ff4dff', 0.6);
    }

    if (this.player.hp <= 0 && !this.over) {
      if (this.run.stats.revive > 0) {
        this.run.stats.revive = 0;
        this.player.hp = this.player.maxHp * 0.5;
        this.player.iframes = 2;
        this.cam.shake = 12;
        this.spawnHitBurst(this.player.x, this.player.y, '#ffd166', 60);
      } else {
        this.over = true;
        if (this.callbacks.onGameOver) this.callbacks.onGameOver({ ...this.snapshot(), victory: false });
      }
    }
  }

  tickCardFlags(dt) {
    const s = this.run.stats; const p = this.player; const f = s.flags || {};
    // Damage aura
    if (f.damageAura) {
      this._auraTick = (this._auraTick || 0) + dt;
      if (this._auraTick >= 0.5) {
        this._auraTick = 0;
        const r = 90 * s.areaMult;
        const dmg = 18 * s.damageMult;
        this.enemies.forEach(e => { if (dist2(e.x, e.y, p.x, p.y) <= r * r) this.dealDamage(e, dmg, false, 0, p.x, p.y, true); });
      }
    }
    // Slow field — done in enemy update via flag check
    // Knockback wave
    if (f.knockbackWave) {
      this._knockTick = (this._knockTick || 0) + dt;
      if (this._knockTick >= 8) {
        this._knockTick = 0;
        this.enemies.forEach(e => {
          const dx = e.x - p.x, dy = e.y - p.y; const d = Math.hypot(dx, dy) || 1;
          e.kbX += (dx / d) * 280; e.kbY += (dy / d) * 280;
        });
        this.spawnRing(p.x, p.y, 200, '#bff0ff', 0.4);
      }
    }
    // Mirror image
    if (f.mirrorAura) {
      this._mirrorTick = (this._mirrorTick || 0) + dt;
      if (this._mirrorTick >= 12) {
        this._mirrorTi
    }
  }
}