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
    this.gems = new Pool(() => ({ alive: false, x: 0, y: 0, xp: 0, gold: 0, t: 0 }), 400);
    this.dmgNums = new Pool(() => ({ alive: false, x: 0, y: 0, life: 0, text: '', color: '#fff', vy: 0, size: 14 }), 300);
    this.corpses = []; // simple corpse list (rendered floor decals)
    this.bloodDecals = []; // floor blood (capped)

    // Player
    this.player = this.createPlayer();

    // Stats / run state
    this.run = {
      time: 0, kills: 0, level: 1, xp: 0, xpToNext: 4, gold: 0,
      ownedWeapons: opts.startWeapons || ['hydropistol'],
      weaponLvls: {},
      noHit: true,
      activeSkillUses: 0,
      stats: {
        damageMult: 1.0 + (this.meta.dmg || 0),
        fireRateMult: 1.0 + (this.meta.atks || 0),
        moveMult: 1.0 + (this.meta.mspd || 0),
        maxHp: 100 + (this.meta.maxHp || 0),
        regen: (this.meta.regen || 0),
        armor: (this.meta.armor || 0),
        crit: 0.05 + (this.meta.crit || 0),
        critDmgMult: 1.5 + (this.meta.critd || 0),
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
    this.activeSkills = (opts.activeSkills || []).slice(0, 4);
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
    document.removeEventListener('visibilitychange', this._vis);
    this.canvas.removeEventListener('mousemove', this._mm);
    this.canvas.removeEventListener('mousedown', this._md);
    this.canvas.removeEventListener('mouseup', this._mu);
    this.canvas.removeEventListener('touchstart', this._ts);
    this.canvas.removeEventListener('touchmove', this._tm);
    this.canvas.removeEventListener('touchend', this._te);
    window.removeEventListener('resize', this._rs);
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
    this._mm = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.input.mx = e.clientX - rect.left;
      this.input.my = e.clientY - rect.top;
    };
    this._md = () => { this.input.shooting = true; };
    this._mu = () => { this.input.shooting = false; };
    // touch (mobile fallback): treat tap as shoot in direction of touch from center
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
    this.canvas.addEventListener('mousemove', this._mm);
    this.canvas.addEventListener('mousedown', this._md);
    this.canvas.addEventListener('mouseup', this._mu);
    this.canvas.addEventListener('touchstart', this._ts, { passive: true });
    this.canvas.addEventListener('touchmove', this._tm, { passive: true });
    this.canvas.addEventListener('touchend', this._te);
    window.addEventListener('resize', this._rs);
  }

  setPaused(p) { this.paused = p; this.last = performance.now(); }

  frame(now) {
    if (!this.running) return;
    try {
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > 0.1) dt = 0.1;
      this.fps = this.fps * 0.9 + (1 / Math.max(dt, 0.001)) * 0.1;
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
    // ALWAYS re-queue next frame — never let an error kill the game loop
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
    this.time += dt;
    this.cam.shake = Math.max(0, this.cam.shake - dt * 30);

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
        this._mirrorTick = 0;
        const e = this.enemies.acquire();
        e.x = p.x + rand(-30, 30); e.y = p.y + rand(-30, 30);
        e.t = { id: 'mirror', name: 'Mirror', size: 14, hp: 100, dmg: 0, speed: 0, color: '#bff0ff', xp: 0, gold: 0, ai: 'decoy', boss: false };
        e.maxHp = 100; e.hp = 100; e.hit = 0; e.cd = 0; e.kbX = 0; e.kbY = 0; e._decoy = 5;
      }
    }
    // Lifeline (shield below 20%)
    if (f.lifeline && p.hp < p.maxHp * 0.2 && !p._lifelineUsed) {
      p._lifelineUsed = this.run.time + 30;
      p.iframes = Math.max(p.iframes, 1.5);
      this.spawnRing(p.x, p.y, 60, '#ffd166', 0.4);
    }
    if (p._lifelineUsed && this.run.time >= p._lifelineUsed) p._lifelineUsed = 0;
    // Burn DoT
    this.enemies.forEach(e => {
      if (e._burn > 0) {
        e._burn -= dt;
        e._burnAcc = (e._burnAcc || 0) + dt;
        if (e._burnAcc >= 0.5) { e._burnAcc = 0; this.dealDamage(e, 6 * s.damageMult, false, 0, e.x, e.y, true); if (Math.random() < 0.5) this.spawnSpark(e.x, e.y, '#ff7a1a'); }
      }
    });
    // Vortex pull
    if (this._vortexT > 0) {
      const vx = this._vortexX, vy = this._vortexY;
      this.enemies.forEach(e => {
        const dx = vx - e.x, dy = vy - e.y; const d = Math.hypot(dx, dy);
        if (d < 320) {
          e.x += (dx / Math.max(d, 1)) * 300 * dt;
          e.y += (dy / Math.max(d, 1)) * 300 * dt;
          if (Math.random() < 0.04) this.dealDamage(e, 8 * s.damageMult, false, 0, vx, vy, true);
        }
      });
    }
    // ===== NEW PASSIVE WEAPONS =====
    if (f.thunderCult) {
      this._thunderT = (this._thunderT || 0) + dt;
      if (this._thunderT >= 4) {
        this._thunderT = 0;
        // Strike a random enemy within 480
        const candidates = [];
        this.enemies.forEach(e => { if (dist2(e.x, e.y, p.x, p.y) <= 480 * 480) candidates.push(e); });
        if (candidates.length) {
          const t = candidates[Math.floor(Math.random() * candidates.length)];
          this.dealDamage(t, 60 * s.damageMult, false, 60, p.x, p.y);
          this.spawnLightning(t.x, t.y - 200, t.x, t.y);
          this.spawnRing(t.x, t.y, 36, '#bff0ff', 0.3);
          this.cam.shake = Math.max(this.cam.shake, 3);
        }
      }
    }
    if (f.iceShards) {
      this._iceT = (this._iceT || 0) + dt;
      if (this._iceT >= 1.6) {
        this._iceT = 0;
        const tgt = this.nearestEnemy(p.x, p.y, 600);
        if (tgt) {
          const ang = Math.atan2(tgt.y - p.y, tgt.x - p.x);
          this.fireProjectile(p.x, p.y, ang, { damage: 28, projSpeed: 520, projSize: 6, color: '#bff0ff', pierce: 2, crit: 0.1, _behaviour: 'projectile' }, true, 1.0);
        }
      }
    }
    if (f.holyWater) {
      this._holyT = (this._holyT || 0) + dt;
      if (this._holyT >= 6) {
        this._holyT = 0;
        p.hp = Math.min(p.maxHp, p.hp + 15);
        this.spawnRing(p.x, p.y, 80, '#bff0ff', 0.5);
        this.spawnDamageNumber(p.x, p.y - 12, '+15', '#4dffd4', 16);
      }
    }
    if (f.swarmAura) {
      // 3 bees orbiting + damaging
      this._swarmT = (this._swarmT || 0) + dt;
      const a0 = this.time * 4;
      for (let i = 0; i < 3; i++) {
        const a = a0 + (i / 3) * TAU;
        const bx = p.x + Math.cos(a) * 60, by = p.y + Math.sin(a) * 60;
        if (Math.random() < 0.15) this.spawnSpark(bx, by, '#ffd166');
      }
      if (this._swarmT >= 0.4) {
        this._swarmT = 0;
        this.enemies.forEach(e => {
          if (dist2(e.x, e.y, p.x, p.y) <= 70 * 70) this.dealDamage(e, 12 * s.damageMult, false, 0, p.x, p.y, true);
        });
      }
    }
    if (f.juggernaut) {
      let count = 0;
      this.enemies.forEach(e => { if (dist2(e.x, e.y, p.x, p.y) <= 200 * 200) count++; });
      if (count > 0) {
        p.regenCarry += (count / 5) * dt;
        while (p.regenCarry >= 1) { p.hp = Math.min(p.maxHp, p.hp + 1); p.regenCarry -= 1; }
      }
    }
    if (f.railStance) {
      // Track standing-still time
      if (Math.hypot(p.vx || 0, p.vy || 0) < 10) {
        p._stillT = (p._stillT || 0) + dt;
      } else {
        p._stillT = 0;
      }
    }
  }

  updatePlayer(dt) {
    const p = this.player, s = this.run.stats, k = this.input.keys;
    let dx = 0, dy = 0;
    if (k['w'] || k['arrowup'])    dy -= 1;
    if (k['s'] || k['arrowdown'])  dy += 1;
    if (k['a'] || k['arrowleft'])  dx -= 1;
    if (k['d'] || k['arrowright']) dx += 1;
    // mobile joystick
    if (this.input.joyMove && (this.input.joyMove.x || this.input.joyMove.y)) {
      dx = this.input.joyMove.x; dy = this.input.joyMove.y;
    }
    const l = Math.hypot(dx, dy) || 1;
    const baseSpd = 200 * s.moveMult;
    // Target velocity (normalized) + accel/decel smoothing for that nice "weight" feel
    const moving = !!(dx || dy);
    const targetX = moving ? (dx / l) : 0;
    const targetY = moving ? (dy / l) : 0;
    // accelerate toward target dir
    const accel = moving ? 9.0 : 12.0;
    p.dirX += (targetX - p.dirX) * Math.min(1, accel * dt);
    p.dirY += (targetY - p.dirY) * Math.min(1, accel * dt);
    p.vx = p.dirX * baseSpd;
    p.vy = p.dirY * baseSpd;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // visual squish & tilt (decays toward 0 when idle)
    const speedRel = Math.hypot(p.dirX, p.dirY);
    p.squish += (speedRel * 0.18 - p.squish) * Math.min(1, dt * 8);
    // tilt: lean into movement direction
    const aimAng = Math.atan2(p.aimY, p.aimX);
    const moveAng = Math.atan2(p.dirY, p.dirX);
    const tiltTarget = moving ? Math.sin(moveAng - aimAng) * 0.35 * speedRel : 0;
    p.tilt += (tiltTarget - p.tilt) * Math.min(1, dt * 10);
    p.bob = (p.bob || 0) + dt * (moving ? 14 : 3);
    p.recoil = Math.max(0, (p.recoil || 0) - dt * 4);

    // Dash motion
    if (p.dashing > 0) {
      p.x += p.dashVX * dt;
      p.y += p.dashVY * dt;
      p.dashing -= dt;
      p.iframes = Math.max(p.iframes, 0.05);
      if (Math.random() < 0.5) this.spawnSpark(p.x, p.y, '#4dffd4');
      if (p.dashing <= 0 && s.blink) {
        // blink AoE on dash end
        const r = 90 * s.areaMult;
        const dmg = this.rollDamage(60 * s.damageMult);
        this.enemies.forEach(e => { if (dist2(e.x, e.y, p.x, p.y) <= r * r) this.dealDamage(e, dmg.dmg, dmg.crit, 120, p.x, p.y); });
        this.spawnRing(p.x, p.y, r, '#b362ff', 0.4);
        this.cam.shake = Math.max(this.cam.shake, 4);
      }
    }
    p.dashCD = Math.max(0, p.dashCD - dt);
    p.shieldCD = Math.max(0, p.shieldCD - dt);
    if (s.shield && p.shieldCharge === 0 && p.shieldCD <= 0) { p.shieldCharge = 1; }

    p.x = clamp(p.x, 20, this.world.w - 20);
    p.y = clamp(p.y, 20, this.world.h - 20);
    p.moving = !!(dx || dy);

    // Aim — desktop mouse OR mobile aim joystick
    let aimX, aimY;
    if (this.input.joyAim && (this.input.joyAim.x || this.input.joyAim.y)) {
      aimX = this.input.joyAim.x; aimY = this.input.joyAim.y;
    } else {
      const wmx = this.input.mx - this.W / 2 + p.x - this.cam.x;
      const wmy = this.input.my - this.H / 2 + p.y - this.cam.y;
      const ax = wmx - p.x, ay = wmy - p.y;
      const al = Math.hypot(ax, ay) || 1;
      aimX = ax / al; aimY = ay / al;
    }
    p.aimX = aimX; p.aimY = aimY;

    p.hit = Math.max(0, p.hit - dt);
    p.iframes = Math.max(0, p.iframes - dt);

    if (s.regen > 0 && p.hp < p.maxHp) {
      p.regenCarry += s.regen * dt;
      while (p.regenCarry >= 1) { p.hp = Math.min(p.maxHp, p.hp + 1); p.regenCarry -= 1; }
    }

    const tx = p.x - this.W / 2, ty = p.y - this.H / 2;
    this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 8);
    this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 8);

    p.orbitAngle += dt * 2.0;
  }

  tryDash(dirX, dirY) {
    const p = this.player; const s = this.run.stats;
    if (!s.dash) return;
    if (p.dashCD > 0 || p.dashing > 0) return;
    let vx, vy;
    if (dirX !== undefined && dirY !== undefined && (dirX || dirY)) {
      // Explicit direction (e.g., from swipe gesture)
      vx = dirX; vy = dirY;
    } else {
      // Fall back to movement keys / aim
      const dx = p.aimX, dy = p.aimY;
      const k = this.input.keys;
      let mvx = 0, mvy = 0;
      if (k['w'] || k['arrowup']) mvy -= 1;
      if (k['s'] || k['arrowdown']) mvy += 1;
      if (k['a'] || k['arrowleft']) mvx -= 1;
      if (k['d'] || k['arrowright']) mvx += 1;
      if (this.input.joyMove && (this.input.joyMove.x || this.input.joyMove.y)) {
        mvx = this.input.joyMove.x; mvy = this.input.joyMove.y;
      }
      vx = mvx; vy = mvy;
      if (!vx && !vy) { vx = dx; vy = dy; }
    }
    const l = Math.hypot(vx, vy) || 1;
    const speed = 1100;
    p.dashVX = (vx / l) * speed;
    p.dashVY = (vy / l) * speed;
    p.dashing = 0.16;
    p.dashCD = 2.4 * (s.dashCDMult || 1);
    p.iframes = 0.22;
    this.cam.shake = Math.max(this.cam.shake, 2);
    for (let i = 0; i < 12; i++) this.spawnSpark(p.x, p.y, '#4dffd4');
    Audio.dash();
  }

  tryActiveSkill(idx) {
    const id = this.activeSkills[idx]; if (!id) return;
    const sk = ACTIVE_SKILLS[id]; if (!sk) return;
    if ((this.skillCD[id] || 0) > 0) return;
    this.skillCD[id] = sk.cd;
    this.run.activeSkillUses++;
    Audio.active(id);
    this.castSkill(id);
  }

  castSkill(id) {
    const p = this.player; const s = this.run.stats;
    if (id === 'lightning') {
      const targets = [];
      let from = { x: p.x + p.aimX * 80, y: p.y + p.aimY * 80 };
      for (let i = 0; i < 5; i++) {
        const t = this.nearestEnemy(from.x, from.y, 280);
        if (!t || targets.includes(t)) break;
        targets.push(t); from = { x: t.x, y: t.y };
      }
      let prev = { x: p.x, y: p.y };
      for (const t of targets) {
        const dmg = this.rollDamage(120 * s.damageMult);
        this.dealDamage(t, dmg.dmg, dmg.crit, 80, p.x, p.y);
        this.spawnLightning(prev.x, prev.y, t.x, t.y);
        prev = { x: t.x, y: t.y };
      }
      this.cam.shake = Math.max(this.cam.shake, 6);
    } else if (id === 'aegis') {
      p.iframes = Math.max(p.iframes, 3);
      p._reflectTimer = 3;
      this.spawnRing(p.x, p.y, 60, '#4dffd4', 0.5);
    } else if (id === 'timewarp') {
      this._timewarpT = 4; this.cam.slowmo = 0.6;
      this.spawnRing(p.x, p.y, 200, '#b362ff', 1.0);
    } else if (id === 'decoy') {
      const e = this.enemies.acquire();
      e.x = p.x + p.aimX * 80; e.y = p.y + p.aimY * 80;
      e.t = { id: 'decoy', name: 'Decoy', size: 16, hp: 9999, dmg: 0, speed: 0, color: '#4dc4ff', xp: 0, gold: 0, ai: 'decoy', boss: false };
      e.maxHp = 9999; e.hp = 9999; e.hit = 0; e.cd = 0; e.dz = 0; e.kbX = 0; e.kbY = 0; e._decoy = 6;
    } else if (id === 'meteor') {
      const tx = p.x + p.aimX * 200, ty = p.y + p.aimY * 200;
      const warn = this.parts.acquire();
      warn.x = tx; warn.y = ty; warn.vx = 0; warn.vy = 0;
      warn.life = 0.9; warn.max = 0.9; warn.color = '#ff7a1a'; warn.size = 180;
      warn.type = 'meteorMark'; warn._dmg = 200 * s.damageMult; warn._radius = 180;
      warn._fallFrom = -480; warn._fallOffX = rand(-100, 100);
    } else if (id === 'vortex') {
      this._vortexT = 2; this._vortexX = p.x + p.aimX * 60; this._vortexY = p.y + p.aimY * 60;
    }
  }

  spawnLightning(x1, y1, x2, y2) {
    const pp = this.parts.acquire();
    pp.x = x1; pp.y = y1; pp.vx = x2; pp.vy = y2; pp.life = 0.18; pp.max = 0.18;
    pp.color = '#bff0ff'; pp.size = 0; pp.type = 'lightning';
  }


  // ====== WEAPONS ======
  updateWeapons(dt) {
    const owned = this.run.ownedWeapons;
    for (const wid of owned) {
      const w = WEAPONS[wid];
      const lvl = this.run.weaponLvls[wid] || 0;
      const stats = this.computeWeaponStats(w, lvl);
      stats._wid = wid;
      stats._wlvl = lvl;
      switch (w.behaviour) {
        case 'projectile':
          stats._behaviour = w.behaviour;
          if (w.type === 'manual') this.weaponManualPistol(stats, dt);
          else this.weaponAutoBolts(stats, dt);
          break;
        case 'shotgun':
          stats._behaviour = w.behaviour;
          this.weaponShotgun(stats, dt);
          break;
        case 'orbit':   stats._behaviour = w.behaviour; this.weaponOrbit(stats, dt); break;
        case 'aoe':     stats._behaviour = w.behaviour; w.id === 'shockwave' ? this.weaponShockwave(stats, dt) : this.weaponScythe(stats, dt); break;
        case 'beam':    stats._behaviour = w.behaviour; this.weaponBeam(stats, dt); break;
        case 'meteor':  stats._behaviour = w.behaviour; this.weaponMeteor(stats, dt); break;
        case 'chain':   stats._behaviour = w.behaviour; this.weaponChain(stats, dt); break;
        default: break;
      }
    }
  }

  computeWeaponStats(w, lvl) {
    const s = { ...w.base };
    for (let i = 0; i < lvl; i++) {
      const up = w.levelUps[i]; if (!up) break;
      if (up.mult != null) s[up.stat] = (s[up.stat] || 0) * up.mult;
      else if (up.add != null) s[up.stat] = (s[up.stat] || 0) + up.add;
      s._evolved = s._evolved || up.evolve === true;
    }
    return s;
  }

  weaponManualPistol(s, dt) {
    const p = this.player; const rs = this.run.stats;
    if (p.reloading) {
      p.reloadT -= dt;
      if (p.reloadT <= 0) {
        p.reloading = false;
        p.mag = (s.magazine || 12) + rs.magBonus;
      }
      return;
    }
    p.shootCD -= dt;
    const mag = (s.magazine || 12) + rs.magBonus;
    if (p.mag === undefined || p.mag > mag) p.mag = mag;
    if (p.mag <= 0) { this.startReload(s); return; }
    if (this.input.shooting && p.shootCD <= 0) {
      const fr = s.fireRate * rs.fireRateMult;
      p.shootCD = 1 / fr;
      const spread = s.spread || 0;
      const ang = Math.atan2(p.aimY, p.aimX) + (Math.random() - 0.5) * spread;
      this.fireProjectile(p.x + p.aimX * 14, p.y + p.aimY * 14, ang, s, true);
      p.mag -= 1;
      this.cam.shake = Math.max(this.cam.shake, 1.4);
      Audio.shoot();
      this.spawnMuzzle(p.x + p.aimX * 18, p.y + p.aimY * 18, ang, s.color);
      if (p.mag <= 0) this.startReload(s);
    }
  }

  startReload(s) {
    const p = this.player;
    if (p.reloading) return;
    p.reloading = true;
    p.reloadT = (s.reloadTime || 1.0) * this.run.stats.reloadMult;
  }

  tryReload() {
    const w = WEAPONS['hydropistol'];
    const lvl = this.run.weaponLvls['hydropistol'] || 0;
    const s = this.computeWeaponStats(w, lvl);
    this.startReload(s);
  }

  weaponAutoBolts(s, dt) {
    const p = this.player; const rs = this.run.stats;
    p.boltCD -= dt;
    const fr = s.fireRate * rs.fireRateMult;
    if (p.boltCD > 0) return;
    p.boltCD = 1 / fr;
    const tgt = this.nearestEnemy(p.x, p.y, 700);
    if (!tgt) return;
    const projCount = (s.projectiles || 1) + rs.projBonus;
    const baseAng = Math.atan2(tgt.y - p.y, tgt.x - p.x);
    const spread = 0.18;
    for (let i = 0; i < projCount; i++) {
      const off = (i - (projCount - 1) / 2) * spread;
      this.fireProjectile(p.x, p.y, baseAng + off, s, true, s.homing || 0);
    }
  }

  weaponShockwave(s, dt) {
    const p = this.player; const rs = this.run.stats;
    p.shockwaveCD -= dt;
    const fr = s.fireRate * rs.fireRateMult;
    if (p.shockwaveCD > 0) return;
    p.shockwaveCD = 1 / fr;
    const r = (s.area || 180) * rs.areaMult;
    const dmg = this.rollDamage(s.damage * rs.damageMult);
    this.enemies.forEach(e => {
      if (dist2(e.x, e.y, p.x, p.y) <= r * r) this.dealDamage(e, dmg.dmg, dmg.crit, s.knockback || 0, p.x, p.y);
    });
    // Visual ring
    this.spawnRing(p.x, p.y, r, s.color, 0.5);
    this.cam.shake = Math.max(this.cam.shake, 3);
  }

  weaponScythe(s, dt) {
    const p = this.player; const rs = this.run.stats;
    p.scytheCD -= dt;
    const fr = s.fireRate * rs.fireRateMult;
    if (p.scytheCD > 0) return;
    p.scytheCD = 1 / fr;
    const r = (s.area || 120) * rs.areaMult;
    const dmg = this.rollDamage(s.damage * rs.damageMult);
    const aimAng = Math.atan2(p.aimY, p.aimX);
    this.enemies.forEach(e => {
      const edx = e.x - p.x, edy = e.y - p.y;
      const ed = Math.hypot(edx, edy);
      if (ed > r) return;
      // Only hit enemies in the forward 180° arc (within 90° of aim direction)
      const eAng = Math.atan2(edy, edx);
      let da = eAng - aimAng;
      while (da > Math.PI) da -= TAU;
      while (da < -Math.PI) da += TAU;
      if (Math.abs(da) <= Math.PI * 0.55) {
        this.dealDamage(e, dmg.dmg, dmg.crit, s.knockback || 0, p.x, p.y);
      }
    });
    // visual sweeping arc in aim direction
    this.spawnArc(p.x, p.y, r, s.color, aimAng);
  }

  weaponOrbit(s, dt) {
    const p = this.player; const rs = this.run.stats;
    const count = s.orbitCount || 2;
    const radius = (s.orbitRadius || 80) * rs.areaMult;
    const speed = (s.orbitSpeed || 2);
    const angBase = this.time * speed;
    // Damage check: for each orb, hit enemies within s.area each frame; cooldown per enemy via e.dz (damage zone cooldown small)
    const dmgPerSec = s.damage * rs.damageMult * 2; // tick rate baked in
    const tickDmg = dmgPerSec * dt;
    for (let i = 0; i < count; i++) {
      const a = angBase + (i / count) * TAU;
      const ox = p.x + Math.cos(a) * radius;
      const oy = p.y + Math.sin(a) * radius;
      const ar = (s.area || 24);
      this.enemies.forEach(e => {
        if (dist2(e.x, e.y, ox, oy) <= ar * ar) {
          this.dealDamage(e, tickDmg, false, 0, ox, oy, true);
          if (Math.random() < 0.2) this.spawnSpark(e.x, e.y, s.color);
        }
      });
    }
  }

  weaponBeam(s, dt) {
    const p = this.player; const rs = this.run.stats;
    p.beamCD -= dt;
    const fr = s.fireRate * rs.fireRateMult;
    if (p.beamCD > 0) {
      return;
    }
    p.beamCD = 1 / fr;
    const t = this.nearestEnemy(p.x, p.y, s.range || 320);
    p._beamTarget = t || null;
    if (t) {
      const dmg = this.rollDamage(s.damage * rs.damageMult);
      this.dealDamage(t, dmg.dmg, dmg.crit, 0, p.x, p.y, true);
      if (Math.random() < 0.4) this.spawnSpark(t.x, t.y, s.color);
    }
  }

  weaponMeteor(s, dt) {
    const p = this.player; const rs = this.run.stats;
    p.meteorCD -= dt;
    const fr = s.fireRate * rs.fireRateMult;
    if (p.meteorCD > 0) return;
    p.meteorCD = 1 / fr;
    const tgt = this.nearestEnemy(p.x, p.y, 500) || { x: p.x + rand(-200, 200), y: p.y + rand(-200, 200) };
    const tx = tgt.x + rand(-30, 30), ty = tgt.y + rand(-30, 30);
    const warn = this.parts.acquire();
    warn.x = tx; warn.y = ty; warn.vx = 0; warn.vy = 0;
    warn.life = 0.9; warn.max = 0.9; warn.color = s.color; warn.size = (s.area || 90) * rs.areaMult;
    warn.type = 'meteorMark';
    warn._dmg = s.damage * rs.damageMult;
    warn._radius = (s.area || 90) * rs.areaMult;
    warn._fallFrom = -420 + rand(-60, 60); // sky height above target
    warn._fallOffX = rand(-80, 80);         // angle from sky
  }

  weaponShotgun(s, dt) {
    const p = this.player; const rs = this.run.stats;
    if (p.reloading) {
      p.reloadT -= dt;
      if (p.reloadT <= 0) { p.reloading = false; p.mag = (s.magazine || 6) + rs.magBonus; Audio.reload(); }
      return;
    }
    p.shootCD -= dt;
    if (p.mag === undefined || p.mag > (s.magazine || 6) + rs.magBonus) p.mag = (s.magazine || 6) + rs.magBonus;
    if (p.mag <= 0) { this.startReload(s); return; }
    if (this.input.shooting && p.shootCD <= 0) {
      const fr = s.fireRate * rs.fireRateMult;
      p.shootCD = 1 / fr;
      const baseAng = Math.atan2(p.aimY, p.aimX);
      const pellets = s.pellets || 5;
      const spread = s.spread || 0.4;
      for (let i = 0; i < pellets; i++) {
        const off = (Math.random() - 0.5) * spread;
        this.fireProjectile(p.x + p.aimX * 14, p.y + p.aimY * 14, baseAng + off, s, true);
      }
      p.mag -= 1;
      this.cam.shake = Math.max(this.cam.shake, 3);
      Audio.shoot();
      this.spawnMuzzle(p.x + p.aimX * 22, p.y + p.aimY * 22, baseAng, s.color);
      if (p.mag <= 0) this.startReload(s);
    }
  }

  fireProjectile(x, y, ang, s, friendly = true, homing = 0) {
    const pr = this.projs.acquire();
    pr.x = x; pr.y = y;
    pr.vx = Math.cos(ang) * (s.projSpeed || 600);
    pr.vy = Math.sin(ang) * (s.projSpeed || 600);
    const dmg = this.rollDamage((s.damage || 10) * this.run.stats.damageMult, s.crit);
    pr.dmg = dmg.dmg; pr.crit = dmg.crit;
    pr.pierce = (s.pierce || 0) + this.run.stats.pierceBonus;
    pr.life = 1.6;
    pr.color = s.color || '#fff';
    pr.size = s.projSize || 6;
    pr.homing = homing;
    pr.knockback = s.knockback || 0;
    pr.explode = s.explode || 0;
    pr._weaponBehaviour = s._behaviour || 'projectile';
    pr._wid = s._wid || null;          // weapon id for custom render
    pr._wlvl = s._wlvl || 0;           // weapon level for visual scaling
    pr._ang = ang;                     // facing for sprite orientation
    pr.hit.clear();
    pr.friendly = friendly;
  }

  rollDamage(base, baseCrit) {
    const p = this.player; const s = this.run.stats;
    let dmg = base;
    if (s.berserk && p.hp < p.maxHp * 0.3) dmg *= 1.4;
    const f = s.flags || {};
    if (f.railStance && (p._stillT || 0) >= 1.0) dmg *= 1.6;
    if (f.overcharge) {
      p._overchargeN = (p._overchargeN || 0) + 1;
      if (p._overchargeN % 6 === 0) dmg *= 2.0;
    }
    if (f.doubleHit && Math.random() < 0.20) dmg *= 2.0;
    const c = (baseCrit || 0) + s.crit;
    const isCrit = Math.random() < c;
    if (isCrit) dmg *= s.critDmgMult;
    return { dmg, crit: isCrit };
  }

  // ====== ENEMIES ======
  spawnWave(dt) {
    if (this.over) return;
    const w = waveAt(this.run.time);
    this.spawnTimer += dt;
    const spawnInterval = 1 / (w.spawn * (this.spawnMultExtra || 1));
    while (this.spawnTimer >= spawnInterval) {
      this.spawnTimer -= spawnInterval;
      const n = 1 + (Math.random() < (this.run.time / 600) ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const type = w.types[randi(0, w.types.length)];
        this.spawnEnemy(type);
      }
    }
  }

  spawnEnemy(typeId) {
    const t = ENEMIES[typeId]; if (!t) return;
    const p = this.player;
    // spawn ring just outside view
    const ang = Math.random() * TAU;
    const dist = Math.max(this.W, this.H) * 0.42 + rand(20, 60);
    const x = clamp(p.x + Math.cos(ang) * dist, 30, this.world.w - 30);
    const y = clamp(p.y + Math.sin(ang) * dist, 30, this.world.h - 30);
    const e = this.enemies.acquire();
    e.x = x; e.y = y; e.vx = 0; e.vy = 0;
    e.t = t;
    const scale = 1 + this.run.time / 240; // gradual scale
    e.maxHp = Math.floor(t.hp * scale);
    e.hp = e.maxHp;
    e.hit = 0; e.cd = 0; e.dz = 0;
    e.kbX = 0; e.kbY = 0;
  }

  spawnBoss(typeId) {
    const t = ENEMIES[typeId]; if (!t) return;
    const p = this.player;
    const ang = Math.random() * TAU;
    const dist = Math.max(this.W, this.H) * 0.42;
    const e = this.enemies.acquire();
    e.x = p.x + Math.cos(ang) * dist;
    e.y = p.y + Math.sin(ang) * dist;
    e.t = t;
    e.maxHp = Math.floor(t.hp * (1 + this.run.time / 600));
    e.hp = e.maxHp;
    e.hit = 0; e.cd = 0; e.dz = 0; e.kbX = 0; e.kbY = 0;
    // Reset boss-specific state flags so recycled pool objects start clean
    e._hasFleed = false; e._fleeing = false; e._fleeTimer = 0;
    e._summonCD = undefined; e._voidCD = undefined;
    this.bossActive = e;
    this.cam.shake = 18;
    this.cam.slowmo = 0.6;
    this.spawnDamageNumber(p.x, p.y - 60, t.name.toUpperCase() + '!', t.color || '#fff');
  }

  updateEnemies(dt) {
    const p = this.player;
    const slowMul = this._timewarpT > 0 ? 0.35 : ((this.run.stats.flags || {}).slowField ? 0.7 : 1);
    this.enemies.forEach(e => {
      if (!e.alive) return;
      const t = e.t;
      if (t.ai === 'decoy' || e._decoy !== undefined) {
        // decoys absorb projectiles, drain timer
        e._decoy -= dt;
        if (e._decoy <= 0) this.killEnemy(e);
        return;
      }
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const nx = dx / d, ny = dy / d;
      let spd = t.speed * slowMul;
      if (t.ai === 'ranged') {
        if (d < (t.shootRange || 320) - 50) spd = -spd * 0.6;
        else if (d < (t.shootRange || 320) + 20) spd = 0;
        e.cd -= dt;
        if (e.cd <= 0 && d < (t.shootRange || 320) + 60) {
          e.cd = (t.shootCD || 2);
          const ep = this.eprojs.acquire();
          ep.x = e.x; ep.y = e.y;
          ep.vx = nx * (t.projSpeed || 300);
          ep.vy = ny * (t.projSpeed || 300);
          ep.dmg = t.dmg * 0.7;
          ep.life = 2.5;
          ep.color = t.color;
          ep.size = 5;
        }
      } else if (t.ai === 'charge') {
        e.cd -= dt;
        if (e.cd <= 0 && d < 240) { e.cd = 2.5; e.kbX = nx * 380; e.kbY = ny * 380; }
        spd *= (Math.random() < 0.3 ? 1.2 : 1.0);
      } else if (t.ai === 'boss') {
        e.cd -= dt;
        if (e.cd <= 0 && d < 800) {
          e.cd = t.shootCD || 1.2;
          // shoot triple burst
          const baseAng = Math.atan2(ny, nx);
          for (let i = -1; i <= 1; i++) {
            const a = baseAng + i * 0.25;
            const ep = this.eprojs.acquire();
            ep.x = e.x; ep.y = e.y;
            ep.vx = Math.cos(a) * 280;
            ep.vy = Math.sin(a) * 280;
            ep.dmg = t.dmg * 0.6;
            ep.life = 3.5;
            ep.color = t.color;
            ep.size = 7;
          }
        }
      }

      // === Eye of Horus: flyr vid 50% HP ===
      if (t.id === 'bossOcular') {
        if (!e._hasFleed && e.hp < e.maxHp * 0.5) {
          e._hasFleed = true; e._fleeing = true; e._fleeTimer = 15;
          this.spawnDamageNumber(e.x, e.y - 35, 'FLEES!', '#ffd166');
          this.cam.shake = 10;
        }
        if (e._fleeing) {
          e._fleeTimer -= dt;
          if (e._fleeTimer <= 0) {
            e._fleeing = false;
            const retAng = Math.random() * TAU;
            const retDist = Math.max(this.W, this.H) * 0.75;
            e.x = p.x + Math.cos(retAng) * retDist;
            e.y = p.y + Math.sin(retAng) * retDist;
            e.kbX = 0; e.kbY = 0;
            this.spawnDamageNumber(e.x, e.y - 35, 'RETURNS!', '#ff3146');
          } else {
            const fdx = e.x - p.x, fdy = e.y - p.y;
            const fd = Math.hypot(fdx, fdy) || 1;
            e.x += (fdx / fd) * t.speed * 2.8 * dt;
            e.y += (fdy / fd) * t.speed * 2.8 * dt;
            e.hit = Math.max(0, e.hit - dt);
            return; // skip normal movement + player collision
          }
        }
      }

      // === Nekromansen: kallar in skelettar ===
      if (t.id === 'bossNecromancer') {
        e._summonCD = (e._summonCD !== undefined ? e._summonCD : 5) - dt;
        if (e._summonCD <= 0) {
          e._summonCD = 6;
          for (let si = 0; si < 3; si++) {
            const sa = Math.random() * TAU;
            const sm = this.enemies.acquire();
            sm.x = e.x + Math.cos(sa) * 70; sm.y = e.y + Math.sin(sa) * 70;
            sm.t = ENEMIES.ghoul; sm.maxHp = 45; sm.hp = 45;
            sm.hit = 0; sm.cd = 0; sm.dz = 0; sm.kbX = 0; sm.kbY = 0;
          }
          this.spawnDamageNumber(e.x, e.y - 42, 'RISE!', '#7ad96b');
          this.cam.shake = Math.max(this.cam.shake, 4);
        }
      }

      // === Void Titan: spiralskjuter void-orbs ===
      if (t.id === 'bossVoidTitan') {
        e._voidCD = (e._voidCD !== undefined ? e._voidCD : 2) - dt;
        if (e._voidCD <= 0) {
          e._voidCD = 2.2;
          for (let vi = 0; vi < 6; vi++) {
            const va = (vi / 6) * TAU + this.time * 0.4;
            const evp = this.eprojs.acquire();
            evp.x = e.x; evp.y = e.y;
            evp.vx = Math.cos(va) * 155; evp.vy = Math.sin(va) * 155;
            evp.dmg = t.dmg * 0.45; evp.life = 5.5; evp.color = '#b362ff'; evp.size = 11;
          }
        }
      }
      e.x += nx * spd * dt + e.kbX * dt;
      e.y += ny * spd * dt + e.kbY * dt;
      e.kbX *= Math.pow(0.001, dt);
      e.kbY *= Math.pow(0.001, dt);
      // separation - mild
      // collision with player
      const sumR = (t.size / 2) + p.r;
      if (d < sumR + 4 && p.iframes <= 0) {
        if (p.shieldCharge > 0) {
          p.shieldCharge = 0; p.shieldCD = 25;
          p.iframes = 0.7;
          this.spawnRing(p.x, p.y, 40, '#4dffd4', 0.4);
          this.spawnDamageNumber(p.x, p.y - 10, 'BLOCK', '#4dffd4');
          this.cam.shake = Math.max(this.cam.shake, 3);
        } else if (Math.random() > this.run.stats.dodge) {
          const f = this.run.stats.flags || {};
          const dmg = Math.max(1, t.dmg - this.run.stats.armor);
          // Reflect
          if (f.reflect) { this.dealDamage(e, dmg * 0.3, false, 0, p.x, p.y, true); }
          // Grit damage reduction
          const reduce = f.grit && (p._gritT || 0) > this.run.time ? 0.7 : 1.0;
          p.hp -= dmg * reduce;
          if (f.grit) p._gritT = this.run.time + 2;
          this.run.noHit = false;
          p.hit = 0.15;
          p.iframes = 0.5;
          if (p._reflectTimer > 0) { this.dealDamage(e, dmg * 0.6, true, 0, p.x, p.y, true); }
          this.cam.shake = Math.max(this.cam.shake, 5);
          this.spawnHitBurst(p.x, p.y, '#b51d28', 18);
          Audio.hit();
        } else {
          this.spawnDamageNumber(p.x, p.y - 10, 'DODGE', '#4dffd4');
        }
      }
      e.hit = Math.max(0, e.hit - dt);
    });
  }

  updateProjs(dt) {
    this.projs.forEach(pr => {
      if (!pr.alive) return;
      // homing
      if (pr.homing > 0) {
        const tgt = this.nearestEnemy(pr.x, pr.y, 320);
        if (tgt) {
          const ang = Math.atan2(tgt.y - pr.y, tgt.x - pr.x);
          const cur = Math.atan2(pr.vy, pr.vx);
          const sp = Math.hypot(pr.vx, pr.vy);
          let na = cur;
          let da = ang - cur;
          while (da > Math.PI) da -= TAU;
          while (da < -Math.PI) da += TAU;
          na = cur + clamp(da, -pr.homing * 6, pr.homing * 6);
          pr.vx = Math.cos(na) * sp;
          pr.vy = Math.sin(na) * sp;
        }
      }
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      pr.life -= dt;
      if (pr.life <= 0) { this.projs.release(pr); return; }

      // collision with enemies
      this.enemies.forEach(e => {
        if (!pr.alive) return;
        if (pr.hit.has(e)) return;
        const sumR = e.t.size / 2 + pr.size;
        if (dist2(pr.x, pr.y, e.x, e.y) <= sumR * sumR) {
          this.dealDamage(e, pr.dmg, pr.crit, pr.knockback, pr.x, pr.y);
          this.spawnHitBurst(pr.x, pr.y, e.t.color, 8);
          pr.hit.add(e);
          if (pr.pierce <= 0) { this.projs.release(pr); return; }
          pr.pierce -= 1;
        }
      });
    });
  }

  updateEProjs(dt) {
    const p = this.player;
    this.eprojs.forEach(ep => {
      if (!ep.alive) return;
      ep.x += ep.vx * dt; ep.y += ep.vy * dt;
      ep.life -= dt;
      if (ep.life <= 0) { this.eprojs.release(ep); return; }
      if (dist2(ep.x, ep.y, p.x, p.y) <= (p.r + ep.size) * (p.r + ep.size) && p.iframes <= 0) {
        if (Math.random() > this.run.stats.dodge) {
          const dmg = Math.max(1, ep.dmg - this.run.stats.armor);
          p.hp -= dmg;
          p.hit = 0.12;
          p.iframes = 0.3;
          this.cam.shake = Math.max(this.cam.shake, 3);
          this.spawnHitBurst(p.x, p.y, '#b51d28', 14);
        } else {
          this.spawnDamageNumber(p.x, p.y - 10, 'DODGE', '#4dffd4');
        }
        this.eprojs.release(ep);
      }
    });
  }

  updateParts(dt) {
    this.parts.forEach(p => {
      if (!p.alive) return;
      if (p.type === 'meteorMark') {
        p.life -= dt;
        if (p.life <= 0) {
          // impact! Big explosion
          this.enemies.forEach(en => {
            if (dist2(en.x, en.y, p.x, p.y) <= p._radius * p._radius) {
              const dmg = this.rollDamage(p._dmg);
              this.dealDamage(en, dmg.dmg, dmg.crit, 220, p.x, p.y);
            }
          });
          this.spawnRing(p.x, p.y, p._radius, p.color, 0.5);
          this.spawnRing(p.x, p.y, p._radius * 0.6, '#fff5d6', 0.35);
          this.spawnHitBurst(p.x, p.y, p.color, 32);
          // fire chunks flying out
          for (let k = 0; k < 14; k++) {
            const a = Math.random() * TAU;
            const sp = rand(180, 420);
            const cp = this.parts.acquire();
            cp.x = p.x; cp.y = p.y;
            cp.vx = Math.cos(a) * sp; cp.vy = Math.sin(a) * sp;
            cp.life = rand(0.5, 0.9); cp.max = cp.life;
            cp.color = k % 2 ? '#ffb84d' : '#ff7a1a';
            cp.size = rand(3, 5); cp.type = 'spark';
          }
          this.cam.shake = Math.max(this.cam.shake, 9);
          this.parts.release(p);
        }
        return;
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= Math.pow(0.05, dt);
      p.vy *= Math.pow(0.05, dt);
      if (p.type === 'blood') p.vy += 200 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        if (p.type === 'blood' && this.bloodDecals.length < 250) {
          this.bloodDecals.push({ x: p.x, y: p.y, r: 2 + Math.random() * 3, a: 0.55 });
        }
        this.parts.release(p);
      }
    });
  }

  updateGems(dt) {
    const p = this.player;
    const pickupR = 60 * this.run.stats.pickupMult;
    const magnetR = pickupR * 2.2;
    this.gems.forEach(g => {
      if (!g.alive) return;
      const dx = p.x - g.x, dy = p.y - g.y;
      const d = Math.hypot(dx, dy);
      g.t += dt;
      if (d < magnetR) {
        const pull = 240 + (magnetR - d) * 4;
        g.x += (dx / Math.max(d, 0.001)) * pull * dt;
        g.y += (dy / Math.max(d, 0.001)) * pull * dt;
      }
      if (d < p.r + 6) {
        if (g.xp > 0) { this.addXp(g.xp); Audio.xpPing(Math.min(1, this.run.xp / this.run.xpToNext)); }
        if (g.gold > 0) this.run.gold += g.gold;
        this.gems.release(g);
      }
    });
  }

  updateDmgNums(dt) {
    this.dmgNums.forEach(d => {
      if (!d.alive) return;
      d.life -= dt;
      d.y += d.vy * dt;
      d.vy *= Math.pow(0.1, dt);
      if (d.life <= 0) this.dmgNums.release(d);
    });
  }

  // ====== COMBAT ======
  dealDamage(e, dmg, crit, kb, ox, oy, silent = false) {
    if (!e.alive) return;
    const s = this.run.stats;
    if (e._decoy !== undefined) { e._decoy -= 0.5; if (e._decoy <= 0) this.killEnemy(e); return; }
    if (e.t.boss && s.bossDmg > 1) dmg *= s.bossDmg;
    let head = false;
    if (!e.t.boss && s.headshot > 0 && Math.random() < s.headshot) { dmg = e.hp + 1; head = true; }
    s._lastHitDmg = dmg; s._lastHitWeapon = s._behaviour || 'projectile';
    if (crit) { Audio.crit(); this._critPunch = Math.min(0.22, this._critPunch + 0.18); }
    if ((s.flags || {}).burnDoT) e._burn = Math.max(e._burn || 0, 3);
    if ((s.flags || {}).vampire && !silent) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + dmg * 0.05);
    }
    e.hp -= dmg;
    e.hit = 0.08;
    if (kb > 0) {
      const dx = e.x - ox, dy = e.y - oy;
      const d = Math.hypot(dx, dy) || 1;
      e.kbX += (dx / d) * kb; e.kbY += (dy / d) * kb;
    }
    if (!silent) this.spawnDamageNumber(e.x + rand(-6, 6), e.y - 14,
      head ? 'HEAD!' : Math.floor(dmg).toString(),
      head ? '#ff3146' : (crit ? '#ffd166' : '#fff'),
      head ? 22 : (crit ? 18 : 14));
    if (Math.random() < 0.55) this.spawnBlood(e.x, e.y, e.t.color);
    if (e.hp <= 0) this.killEnemy(e);
  }

  killEnemy(e) {
    if (!e.alive) return;
    const t = e.t; const s = this.run.stats;
    if (e._decoy !== undefined) { this.enemies.release(e); return; }
    e.alive = false;
    this.run.kills += 1;

    // ---- Boss-specific kill tracking ----
    if (t.id === 'bossNecromancer') this._necroKilled = true;
    if (t.id === 'bossVoidTitan')   this._voidKilled = true;
    if (t.id === 'bossOcular')      this._horusKilled = true;
    const inCascade = this._inCascade; this._inCascade = true;
    if (!inCascade) {
      if (s.voidBurst > 0 && Math.random() < s.voidBurst) {
        const r = 80 * s.areaMult;
        this.enemies.forEach(en => { if (en !== e && en.alive && dist2(en.x, en.y, e.x, e.y) <= r * r) this.dealDamage(en, 40 * s.damageMult, false, 60, e.x, e.y, true); });
        this.spawnRing(e.x, e.y, r, '#b362ff', 0.3);
      }
      const f = s.flags || {};
      if (f.chainOnKill) {
        const t2 = this.nearestEnemy(e.x, e.y, 200);
        if (t2 && t2.alive && t2 !== e) this.dealDamage(t2, 0.5 * (s._lastHitDmg || 30), false, 40, e.x, e.y, true);
      }
      if (f.explosiveDeath) {
        const r = 70 * s.areaMult;
        this.enemies.forEach(en => { if (en !== e && en.alive && dist2(en.x, en.y, e.x, e.y) <= r * r) this.dealDamage(en, 30 * s.damageMult, false, 80, e.x, e.y, true); });
        this.spawnRing(e.x, e.y, r, '#ff7a1a', 0.3);
      }
    }
    this._inCascade = inCascade;
    const fx = KILL_FX[s._lastHitWeapon] || 'gibs';
    this.spawnBrutalKill(e.x, e.y, t.color, t.size, fx);
    Audio.kill();
    // drop XP gem
    const gm = this.gems.acquire();
    gm.x = e.x; gm.y = e.y; gm.t = 0;
    gm.xp = Math.max(1, Math.floor(t.xp * (Math.random() < 0.05 ? 3 : 1)));
    gm.gold = 0;
    if (Math.random() < 0.6) {
      const g = this.gems.acquire();
      g.x = e.x + rand(-8, 8); g.y = e.y + rand(-8, 8); g.t = 0;
      g.gold = Math.max(1, Math.floor(t.gold * s.goldMult));
      g.xp = 0;
    }
    if (t.boss) {
      this.cam.shake = 18; this.cam.slowmo = 0.5;
      this.bossesKilled += 1; this.bossActive = null;
      this._bossDeathFlash = 1.4;
      // Massive boss death rings
      this.spawnRing(e.x, e.y, 240, '#ff7a1a', 0.8);
      this.spawnRing(e.x, e.y, 160, '#ffd166', 0.6);
      this.spawnRing(e.x, e.y, 80,  '#fff', 0.4);
      if (t.id === 'bossAida') { this._aidaKilled = true; }
      for (let i = 0; i < 12; i++) {
        const g = this.gems.acquire();
        const a = Math.random() * TAU;
        g.x = e.x + Math.cos(a) * rand(10, 80); g.y = e.y + Math.sin(a) * rand(10, 80); g.t = 0;
        g.gold = Math.floor(t.gold / 12); g.xp = Math.floor(t.xp / 6);
      }
    } else {
      this.cam.shake = Math.max(this.cam.shake, 1.8);
    }
    this.enemies.release(e);
  }

  spawnBrutalKill(x, y, color, size, fx) {
    if (fx === 'voidImplode') {
      for (let i = 0; i < 14; i++) {
        const pp = this.parts.acquire();
        const a = Math.random() * TAU; const r = size * 1.2;
        pp.x = x + Math.cos(a) * r; pp.y = y + Math.sin(a) * r;
        pp.vx = -Math.cos(a) * 200; pp.vy = -Math.sin(a) * 200;
        pp.life = 0.35; pp.max = 0.35; pp.color = '#b362ff'; pp.size = 3; pp.type = 'spark';
      }
      this.spawnRing(x, y, size * 1.5, '#b362ff', 0.3);
    } else if (fx === 'ash') {
      for (let i = 0; i < 12; i++) {
        const pp = this.parts.acquire();
        pp.x = x + rand(-size * 0.4, size * 0.4); pp.y = y + rand(-size * 0.4, size * 0.4);
        pp.vx = rand(-30, 30); pp.vy = -rand(60, 140);
        pp.life = rand(0.6, 1.2); pp.max = pp.life; pp.color = '#888'; pp.size = rand(2, 4); pp.type = 'spark';
      }
    } else if (fx === 'bisect') {
      for (let i = 0; i < 22; i++) {
        const pp = this.parts.acquire();
        pp.x = x; pp.y = y;
        const a = Math.random() * TAU; const sp = rand(140, 380);
        pp.vx = Math.cos(a) * sp; pp.vy = Math.sin(a) * sp - rand(20, 100);
        pp.life = rand(0.5, 0.9); pp.max = pp.life; pp.color = '#b51d28'; pp.size = rand(3, 5); pp.type = 'blood';
      }
      for (let i = 0; i < 2; i++) {
        const pp = this.parts.acquire();
        pp.x = x; pp.y = y;
        const a = i === 0 ? -0.6 : 0.6;
        pp.vx = Math.cos(a) * 280; pp.vy = Math.sin(a) * 280 - 200;
        pp.life = 0.8; pp.max = 0.8; pp.color = color; pp.size = size * 0.35; pp.type = 'chunk';
      }
    } else {
      for (let i = 0; i < 28; i++) {
        const pp = this.parts.acquire();
        pp.x = x; pp.y = y;
        const a = Math.random() * TAU; const sp = rand(120, 420);
        pp.vx = Math.cos(a) * sp; pp.vy = Math.sin(a) * sp - rand(30, 140);
        pp.life = rand(0.4, 0.9); pp.max = pp.life; pp.color = '#b51d28'; pp.size = rand(2, 5); pp.type = 'blood';
      }
      const chunks = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < chunks; i++) {
        const pp = this.parts.acquire();
        pp.x = x; pp.y = y;
        const a = Math.random() * TAU; const sp = rand(160, 360);
        pp.vx = Math.cos(a) * sp; pp.vy = Math.sin(a) * sp - rand(80, 200);
        pp.life = rand(0.6, 1.0); pp.max = pp.life; pp.color = color; pp.size = size * (0.18 + Math.random() * 0.15); pp.type = 'chunk';
      }
    }
  }

  addXp(amount) {
    const r = this.run;
    r.xp += Math.floor(amount * r.stats.xpMult);
    this._maybeLevelUp();
  }

  _maybeLevelUp() {
    const r = this.run;
    // Only level up if there's no pending card to pick. This prevents the
    // modal from looping the "same" level-up screen (it was actually multiple
    // levels stacking in one frame from a single big gem).
    if (this.levelUpQueue > 0) return;
    if (r.xp < r.xpToNext) return;
    r.xp -= r.xpToNext;
    r.level += 1;
    r.xpToNext = Math.floor(r.xpToNext * 1.38 + 3);
    this.levelUpQueue += 1;
    this.cam.slowmo = 0.3;
    this.cam.shake = 10;
    this._levelUpFlash = 1.0;
    Audio.levelUp();
    // BIG level-up blast — visual + KNOCKBACK ONLY (no damage so we never trigger
    // kill-cascades / chain-XP that previously could hang the loop during gem pickup).
    const p = this.player;
    const blastR = 180 * (r.stats.areaMult || 1);
    const blastR2 = blastR * blastR;
    // snapshot enemies array to a static list to avoid any pool-mutation surprises
    const enemiesSnapshot = [];
    this.enemies.forEach(e => { enemiesSnapshot.push(e); });
    for (let i = 0; i < enemiesSnapshot.length; i++) {
      const e = enemiesSnapshot[i];
      if (!e || !e.alive) continue;
      if (dist2(e.x, e.y, p.x, p.y) > blastR2) continue;
      const dx = e.x - p.x, dy = e.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      e.kbX += (dx / d) * 380;
      e.kbY += (dy / d) * 380;
      e.iframes = Math.max(e.iframes || 0, 0.25);
      // Deal shockwave damage (guarded by _inCascade to prevent chain XP loops)
      const prevCascade = this._inCascade;
      this._inCascade = true;
      this.dealDamage(e, 55 * (r.stats.damageMult || 1), false, 0, p.x, p.y, true);
      this._inCascade = prevCascade;
    }
    this.spawnRing(p.x, p.y, blastR, '#ffd166', 0.55);
    this.spawnRing(p.x, p.y, blastR * 0.55, '#4dffd4', 0.45);
    this.spawnRing(p.x, p.y, blastR * 0.25, '#fff', 0.32);
    // golden spark burst
    for (let k = 0; k < 36; k++) {
      const a = Math.random() * TAU;
      const sp = rand(220, 520);
      const pp = this.parts.acquire();
      pp.x = p.x; pp.y = p.y;
      pp.vx = Math.cos(a) * sp; pp.vy = Math.sin(a) * sp - 40;
      pp.life = rand(0.45, 0.85); pp.max = pp.life;
      pp.color = k % 3 === 0 ? '#fff' : (k % 3 === 1 ? '#ffd166' : '#4dffd4');
      pp.size = rand(2, 4); pp.type = 'spark';
    }
    // brief iframes for safety
    p.iframes = Math.max(p.iframes, 0.6);
  }

  nearestEnemy(x, y, maxR) {
    let best = null, bd = maxR * maxR;
    this.enemies.forEach(e => {
      const d = dist2(e.x, e.y, x, y);
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  }

  // ====== EFFECTS ======
  spawnDamageNumber(x, y, text, color = '#fff', size = 14) {
    const d = this.dmgNums.acquire();
    d.x = x; d.y = y; d.text = text; d.color = color;
    d.vy = -50; d.life = 0.8; d.size = size;
  }

  spawnBlood(x, y, color) {
    const n = 3 + randi(0, 4);
    for (let i = 0; i < n; i++) {
      const p = this.parts.acquire();
      p.x = x; p.y = y;
      const a = Math.random() * TAU;
      const sp = rand(80, 260);
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - rand(30, 120);
      p.life = rand(0.4, 0.9); p.max = p.life;
      p.color = color; p.size = rand(2, 4);
      p.type = 'blood';
    }
  }

  spawnHitBurst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const p = this.parts.acquire();
      p.x = x; p.y = y;
      const a = Math.random() * TAU;
      const sp = rand(120, 360);
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
      p.life = rand(0.3, 0.6); p.max = p.life;
      p.color = color; p.size = rand(2, 5);
      p.type = i % 3 === 0 ? 'spark' : 'blood';
    }
  }

  spawnSpark(x, y, color) {
    const p = this.parts.acquire();
    p.x = x; p.y = y;
    const a = Math.random() * TAU;
    const sp = rand(60, 180);
    p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
    p.life = 0.3; p.max = 0.3; p.color = color; p.size = 2; p.type = 'spark';
  }

  spawnMuzzle(x, y, ang, color) {
    this.player.recoil = Math.min(1, (this.player.recoil || 0) + 0.4);
    for (let i = 0; i < 5; i++) {
      const p = this.parts.acquire();
      p.x = x; p.y = y;
      const a = ang + (Math.random() - 0.5) * 0.4;
      const sp = rand(120, 320);
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
      p.life = 0.12; p.max = 0.12; p.color = color; p.size = 3; p.type = 'spark';
    }
  }

  spawnRing(x, y, r, color, life) {
    const p = this.parts.acquire();
    p.x = x; p.y = y; p.vx = 0; p.vy = 0;
    p.life = life; p.max = life; p.color = color; p.size = r; p.type = 'ring';
  }

  spawnArc(x, y, r, color, angle) {
    const p = this.parts.acquire();
    p.x = x; p.y = y; p.vx = 0; p.vy = 0;
    p.life = 0.32; p.max = 0.32; p.color = color; p.size = r; p.type = 'arc';
    p._ang = angle != null ? angle : 0;
  }

  // Arc Tesla — bouncing chain lightning weapon
  weaponChain(s, dt) {
    const p = this.player; const rs = this.run.stats;
    p.teslaCD -= dt;
    const fr = s.fireRate * rs.fireRateMult;
    if (p.teslaCD > 0) return;
    p.teslaCD = 1 / fr;
    const range = (s.range || 320) * rs.areaMult;
    const dmg = this.rollDamage(s.damage * rs.damageMult);
    const chainCount = Math.floor((s.chainCount || 3) + (rs.projBonus || 0));
    const chainRange = (s.chainRange || 200) * rs.areaMult;

    const first = this.nearestEnemy(p.x, p.y, range);
    if (!first) return;

    this.dealDamage(first, dmg.dmg, dmg.crit, 30, p.x, p.y);

    // Initial bolt: player → first target
    const lp0 = this.parts.acquire();
    lp0.x = p.x; lp0.y = p.y;
    lp0.vx = first.x; lp0.vy = first.y;
    lp0.life = 0.20; lp0.max = 0.20; lp0.color = s.color || '#a0e4ff'; lp0.size = 4; lp0.type = 'lightning';

    // Chain to nearby enemies
    let prev = first;
    const hit = new Set([first]);
    for (let ci = 0; ci < chainCount; ci++) {
      const chainFrom = prev;
      let next = null; let bestD = chainRange;
      this.enemies.forEach(e => {
        if (hit.has(e)) return;
        const cd = Math.hypot(e.x - chainFrom.x, e.y - chainFrom.y);
        if (cd < bestD) { bestD = cd; next = e; }
      });
      if (!next) break;
      const lp = this.parts.acquire();
      lp.x = chainFrom.x; lp.y = chainFrom.y;
      lp.vx = next.x; lp.vy = next.y;
      lp.life = 0.20; lp.max = 0.20; lp.color = s.color || '#a0e4ff'; lp.size = 4; lp.type = 'lightning';
      this.dealDamage(next, dmg.dmg * 0.65, dmg.crit, 20, chainFrom.x, chainFrom.y);
      this.spawnSpark(next.x, next.y, s.color || '#a0e4ff');
      hit.add(next); prev = next;
    }
  }

  // ====== LEVEL UP CHOICES ======
  buildLevelUpChoices() {
    const r = this.run;
    const owned = r.ownedWeapons;
    const choices = [];
    const usedIds = new Set();

    // Weapon upgrade options (allow infinite stacking past list)
    const newWeaponIds = Object.keys(WEAPONS).filter(id => !owned.includes(id));
    const canAddWeapon = owned.length < 4 && newWeaponIds.length > 0;

    // We want a mix; produce up to 4 choices, then random 3
    const pool = [];
    const upgradable = owned;
    for (const id of upgradable) {
      const lvl = r.weaponLvls[id] || 0;
      const def = WEAPONS[id];
      const upg = lvl < def.levelUps.length ? def.levelUps[lvl] : { stat: 'damage', mult: 1.10 };
      pool.push({
        kind: 'weapon-upgrade', weaponId: id, icon: def.icon,
        name: def.name + (upg && upg.evolve ? ' — EVOLVE!' : (lvl >= def.levelUps.length ? ' +' + (lvl - def.levelUps.length + 2) : ' +')),
        desc: this.describeWeaponUpgrade(def, upg),
        rarity: upg && upg.evolve ? 'epic' : (lvl >= 4 ? 'rare' : 'uncommon'),
      });
    }
    // 2: new weapons
    if (canAddWeapon) {
      for (const id of newWeaponIds) {
        pool.push({
          kind: 'weapon-new',
          weaponId: id,
          icon: WEAPONS[id].icon,
          name: 'New: ' + WEAPONS[id].name,
          desc: WEAPONS[id].desc,
          rarity: 'rare',
        });
      }
    }
    // 3: stat cards
    for (const s of STAT_CARDS) {
      const rar = rollRarity(r.stats.luck);
      const mult = RARITY[rar].mult;
      const desc = s.desc.replace('{v}', s.mult ? Math.round(s.amount * mult * 100).toString() : (Math.round(s.amount * mult * 100) / 100).toString());
      pool.push({ kind: 'stat', statId: s.id, statRef: s, icon: s.icon, name: s.name, desc, rarity: rar, multiplier: mult });
    }
    // 4: advanced flag cards (rare/epic only) — only if not already active
    for (const ac of ADVANCED_CARDS) {
      if (r.stats.flags && r.stats.flags[ac.flag]) continue;
      const rar = rollRarity(r.stats.luck + 1);
      pool.push({ kind: 'flag', flagId: ac.flag, icon: ac.icon, name: ac.name, desc: ac.desc, rarity: rar });
    }
    // pick 3 unique
    while (choices.length < 3 && pool.length > 0) {
      const idx = randi(0, pool.length);
      const c = pool.splice(idx, 1)[0];
      const key = c.kind + '|' + (c.weaponId || c.statId || c.flagId);
      if (usedIds.has(key)) continue;
      usedIds.add(key);
      choices.push(c);
    }
    return choices;
  }

  describeWeaponUpgrade(weapon, upg) {
    if (!upg) return 'Mastered.';
    const k = upg.stat;
    if (upg.evolve) return 'EVOLVED: +' + Math.round((upg.mult - 1) * 100) + '% ' + k + '. Awakened form.';
    if (upg.mult != null) return '+' + Math.round((upg.mult - 1) * 100) + '% ' + this.statName(k);
    if (upg.add != null) return '+' + upg.add + ' ' + this.statName(k);
    return '...';
  }

  statName(k) {
    return ({
      damage: 'damage', fireRate: 'attack speed', magazine: 'magazine size',
      pierce: 'pierce', crit: 'crit chance', projSpeed: 'projectile speed',
      area: 'area', range: 'range', orbitCount: 'orbs', orbitRadius: 'orbit radius',
      orbitSpeed: 'orbit speed', homing: 'homing', projectiles: 'projectiles',
    })[k] || k;
  }

  applyCardChoice(choice) {
    const r = this.run;
    if (!choice) { // safety: never leave queue stuck
      this.levelUpQueue = Math.max(0, this.levelUpQueue - 1);
      this.cam.slowmo = 0;
      return;
    }
    if (choice.kind === 'weapon-upgrade') {
      r.weaponLvls[choice.weaponId] = (r.weaponLvls[choice.weaponId] || 0) + 1;
    } else if (choice.kind === 'weapon-new') {
      r.ownedWeapons.push(choice.weaponId);
      r.weaponLvls[choice.weaponId] = 0;
    } else if (choice.kind === 'stat') {
      const s = choice.statRef;
      const mult = choice.multiplier;
      const amount = s.amount * mult;
      if (s.stat === 'heal') {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
      } else if (s.mult) {
        r.stats[s.stat] = (r.stats[s.stat] || 1) + amount;
      } else {
        r.stats[s.stat] = (r.stats[s.stat] || 0) + amount;
      }
      if (s.stat === 'maxHp') {
        this.player.maxHp = r.stats.maxHp;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
      }
    } else if (choice.kind === 'flag') {
      r.stats.flags[choice.flagId] = true;
      if (choice.flagId === 'glassCannon') { r.stats.damageMult *= 2.5; r.stats.maxHp = Math.floor(r.stats.maxHp * 0.5); this.player.maxHp = r.stats.maxHp; this.player.hp = Math.min(this.player.hp, this.player.maxHp); }
      if (choice.flagId === 'sharpSteel') r.stats.damageMult *= 1.25;
      if (choice.flagId === 'bloodrush') { r.stats.moveMult *= 1.15; r.stats.reloadMult *= 0.85; }
      if (choice.flagId === 'ironPull') r.stats.pickupMult *= 1.80;
      if (choice.flagId === 'vision') this._visionZoom = (this._visionZoom || 1) * 1.25;
    }
    this.levelUpQueue -= 1;
    this.cam.slowmo = 0;
    // Process any remaining banked XP — gives ONE level-up per pick, so the
    // user sees the level number tick up between picks instead of multiple
    // identical-looking modals appearing in one frame.
    this._maybeLevelUp();
  }

  // ====== RENDER ======
  render() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    // black bg
    ctx.fillStyle = '#06040a';
    ctx.fillRect(0, 0, W, H);

    // camera shake offset
    const sx = (Math.random() - 0.5) * this.cam.shake;
    const sy = (Math.random() - 0.5) * this.cam.shake;
    ctx.save();
    ctx.translate(-this.cam.x + sx, -this.cam.y + sy);

    // Ground - tiled grid pattern with vignette
    this.drawGround();

    // World edge walls
    const ctx2 = this.ctx;
    ctx2.strokeStyle = '#ff7a1a88'; ctx2.lineWidth = 6;
    ctx2.strokeRect(0, 0, this.world.w, this.world.h);
    ctx2.strokeStyle = '#ff7a1a33'; ctx2.lineWidth = 16;
    ctx2.strokeRect(-8, -8, this.world.w + 16, this.world.h + 16);

    // Blood decals
    for (const d of this.bloodDecals) {
      ctx.fillStyle = 'rgba(120,10,18,' + d.a + ')';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, TAU);
      ctx.fill();
    }

    // XP gems / coins — blue glow, 4 sizes based on xp value
    this.gems.forEach(g => {
      const wobble = Math.sin(g.t * 6) * 2;
      if (g.xp > 0) {
        const gSize = g.xp <= 2 ? 3 : g.xp <= 6 ? 5 : g.xp <= 15 ? 7.5 : 11;
        const gGlow = g.xp > 15 ? '#ffffff' : '#a0c8ff';
        ctx.fillStyle = '#5ba3ff';
        ctx.shadowColor = gGlow; ctx.shadowBlur = 7 + gSize;
        ctx.beginPath();
        ctx.moveTo(g.x, g.y - gSize + wobble);
        ctx.lineTo(g.x + gSize * 0.68, g.y + wobble);
        ctx.lineTo(g.x, g.y + gSize + wobble);
        ctx.lineTo(g.x - gSize * 0.68, g.y + wobble);
        ctx.closePath(); ctx.fill();
        // white core sparkle for medium/large gems
        if (g.xp > 6) {
          ctx.fillStyle = 'rgba(220,240,255,0.85)';
          ctx.beginPath();
          ctx.arc(g.x, g.y + wobble, gSize * 0.28, 0, TAU);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#ffd166';
        ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(g.x, g.y + wobble, 3.5, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Enemies — each enemy in its own try/catch so a single broken render
    // can't kill the whole frame and make everything disappear
    this.enemies.forEach(e => {
      try {
        const t = e.t;
        // Speed trail for fast enemies (ghost-tail)
        if (t.speed > 88 && e.vx !== undefined) {
          const trail = 3;
          for (let ti = 1; ti <= trail; ti++) {
            const ta = (1 - ti / (trail + 1)) * 0.28;
            ctx.globalAlpha = ta;
            ctx.fillStyle = t.color;
            ctx.beginPath();
            ctx.arc(e.x - e.vx * ti * 0.032, e.y - e.vy * ti * 0.032, t.size * (0.45 + ti * 0.06), 0, TAU);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath(); ctx.ellipse(e.x, e.y + t.size * 0.45, t.size * 0.45, t.size * 0.18, 0, 0, TAU); ctx.fill();
        // body
        ctx.fillStyle = e.hit > 0 ? '#fff' : t.color;
        ctx.shadowColor = t.color; ctx.shadowBlur = t.boss ? 24 : 6;
        this.drawEnemyShape(e);
        ctx.shadowBlur = 0;
        // outline
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        this.drawEnemyShape(e, true);
        // HP bar (only damaged)
        if (e.hp < e.maxHp) {
          const bw = t.boss ? 80 : Math.max(20, t.size * 1.2);
          ctx.fillStyle = '#000'; ctx.fillRect(e.x - bw / 2, e.y - t.size * 0.7 - 6, bw, 4);
          ctx.fillStyle = '#ff3146'; ctx.fillRect(e.x - bw / 2, e.y - t.size * 0.7 - 6, bw * Math.max(0, e.hp / e.maxHp), 4);
        }
      } catch (err) { console.error('[draw enemy]', err); ctx.shadowBlur = 0; }
    });

    // Player
    this.drawPlayer();

    // Projectiles — per-weapon custom rendering with level-based scaling
    this.projs.forEach(pr => {
      const sz = pr.size || 6;
      const lvlBoost = 1 + (pr._wlvl || 0) * 0.08;
      const ang = pr._ang != null ? pr._ang : Math.atan2(pr.vy, pr.vx);
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(ang);

      // ENEMY projectiles: bright red pulsing with a glow trail so the player ALWAYS sees them
      if (pr.friendly === false) {
        const pulse = 0.7 + 0.3 * Math.sin(this.time * 18);
        ctx.shadowColor = '#ff3146'; ctx.shadowBlur = 22 * pulse;
        // trail
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#ff3146';
        ctx.beginPath(); ctx.ellipse(-sz * 2.2, 0, sz * 2.0, sz * 0.6, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        // core
        ctx.fillStyle = '#ffec99';
        ctx.beginPath(); ctx.arc(0, 0, sz * 1.4 * pulse, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ff3146';
        ctx.beginPath(); ctx.arc(0, 0, sz * 1.0 * pulse, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
        return;
      }

      switch (pr._wid) {
        case 'hydropistol': {
          // Cyan water droplet — elongated tear shape
          const grad = ctx.createRadialGradient(-sz, 0, 1, 0, 0, sz * 1.6);
          grad.addColorStop(0, '#fff'); grad.addColorStop(0.5, '#5fd6ff'); grad.addColorStop(1, '#1a5d99');
          ctx.fillStyle = grad;
          ctx.shadowColor = '#5fd6ff'; ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.ellipse(0, 0, sz * 1.6 * lvlBoost, sz * 0.7 * lvlBoost, 0, 0, TAU);
          ctx.fill();
          ctx.shadowBlur = 0;
          // Trail
          ctx.globalAlpha = 0.5; ctx.fillStyle = '#5fd6ff';
          ctx.beginPath(); ctx.ellipse(-sz * 2.2, 0, sz * 1.4, sz * 0.4, 0, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }
        case 'shotgun': case 'tidal': {
          // Slug pellet — golden bullet
          ctx.fillStyle = '#ffd166';
          ctx.shadowColor = '#ff7a1a'; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(0, 0, sz * lvlBoost, 0, TAU); ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#fff8d0';
          ctx.beginPath(); ctx.arc(-sz * 0.3, -sz * 0.3, sz * 0.3, 0, TAU); ctx.fill();
          break;
        }
        case 'autoBolts': case 'runicRifle': {
          // Tracer round — bright cyan rod
          const len = sz * 3.6 * lvlBoost;
          const w = sz * 0.5;
          ctx.shadowColor = pr.color; ctx.shadowBlur = 14;
          ctx.fillStyle = pr.color;
          ctx.fillRect(-len * 0.5, -w * 0.5, len, w);
          ctx.fillStyle = '#fff';
          ctx.fillRect(-len * 0.5, -w * 0.2, len, w * 0.4);
          ctx.shadowBlur = 0;
          break;
        }
        case 'twinSMG': {
          // Yellow small bullet with motion lines
          ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 10;
          ctx.fillStyle = '#ffd166';
          ctx.fillRect(-sz * 0.8, -sz * 0.4, sz * 1.6, sz * 0.8);
          ctx.shadowBlur = 0;
          break;
        }
        case 'iceLance': {
          // Ice shard — sharp diamond
          ctx.shadowColor = '#bff0ff'; ctx.shadowBlur = 14;
          ctx.fillStyle = '#e7f9ff';
          ctx.beginPath();
          ctx.moveTo(sz * 2.0 * lvlBoost, 0);
          ctx.lineTo(0, sz * 0.7 * lvlBoost);
          ctx.lineTo(-sz * 1.4 * lvlBoost, 0);
          ctx.lineTo(0, -sz * 0.7 * lvlBoost);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#5fd6ff'; ctx.lineWidth = 1.4; ctx.stroke();
          ctx.shadowBlur = 0;
          break;
        }
        case 'plasmaLance': {
          // Plasma orb with electric crackle
          const r = sz * 1.4 * lvlBoost;
          const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
          grad.addColorStop(0, '#fff'); grad.addColorStop(0.5, '#4dffd4'); grad.addColorStop(1, '#1a5d99');
          ctx.fillStyle = grad;
          ctx.shadowColor = '#4dffd4'; ctx.shadowBlur = 22;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
          ctx.shadowBlur = 0;
          // Crackle
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            const a = Math.random() * TAU;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4);
            ctx.lineTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2);
            ctx.stroke();
          }
          break;
        }
        case 'runeBolts': {
          // Magic rune bolt — purple
          ctx.shadowColor = '#b362ff'; ctx.shadowBlur = 14;
          ctx.fillStyle = '#b362ff';
          ctx.beginPath();
          ctx.moveTo(sz * 1.4 * lvlBoost, 0);
          ctx.lineTo(-sz * 0.8 * lvlBoost, sz * 0.6 * lvlBoost);
          ctx.lineTo(-sz * 0.4 * lvlBoost, 0);
          ctx.lineTo(-sz * 0.8 * lvlBoost, -sz * 0.6 * lvlBoost);
          ctx.closePath(); ctx.fill();
          ctx.shadowBlur = 0;
          break;
        }
        default: {
          // Generic glow ball + trail
          ctx.shadowColor = pr.color; ctx.shadowBlur = 12;
          ctx.fillStyle = pr.color;
          ctx.beginPath(); ctx.arc(0, 0, sz * lvlBoost, 0, TAU); ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 0.4; ctx.fillStyle = pr.color;
          ctx.beginPath(); ctx.arc(-sz * 1.6, 0, sz * 0.7, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    });
    this.eprojs.forEach(ep => {
      ctx.fillStyle = ep.color;
      ctx.shadowColor = ep.color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(ep.x, ep.y, ep.size, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Beam (void beam)
    this.drawBeam();

    // Particles
    this.parts.forEach(p => {
      const a = p.life / p.max;
      if (p.type === 'meteorMark') {
        const t01 = 1 - (p.life / p.max); // 0 → 1
        // (Removed the ground warning ring per player request — meteors fall visibly enough now)
        // shadow on ground that grows
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        const shR = 10 + t01 * (p._radius * 0.35);
        ctx.beginPath(); ctx.ellipse(p.x, p.y, shR, shR * 0.32, 0, 0, TAU); ctx.fill();
        // falling meteor visual
        const fy = (p._fallFrom || -300) * (1 - t01) + 0;
        const fx = (p._fallOffX || 0) * (1 - t01);
        const mx = p.x + fx, my = p.y + fy;
        // fiery trail
        for (let k = 0; k < 6; k++) {
          const f = k / 6;
          const tx = p.x + fx * (1 - f * 0.6);
          const ty = p.y + (fy - f * 60);
          ctx.globalAlpha = (1 - f) * 0.7;
          ctx.fillStyle = k < 3 ? '#fff5d6' : (k < 5 ? '#ff9a3c' : '#b51d28');
          ctx.beginPath(); ctx.arc(tx, ty, (16 - k * 2) * (0.6 + t01 * 0.4), 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // meteor head
        ctx.shadowColor = p.color; ctx.shadowBlur = 24;
        const headR = 12 + t01 * 6;
        const headGrad = ctx.createRadialGradient(mx - headR * 0.3, my - headR * 0.3, 1, mx, my, headR);
        headGrad.addColorStop(0, '#fff5d6');
        headGrad.addColorStop(0.55, '#ffb84d');
        headGrad.addColorStop(1, '#5a1206');
        ctx.fillStyle = headGrad;
        ctx.beginPath(); ctx.arc(mx, my, headR, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
        // dark rocky core dots
        ctx.fillStyle = '#221008';
        ctx.beginPath(); ctx.arc(mx + 2, my - 1, 2.4, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(mx - 3, my + 2, 1.8, 0, TAU); ctx.fill();
      } else if (p.type === 'poison') {
        ctx.globalAlpha = 0.30 * a;
        ctx.fillStyle = '#7ad96b';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.6 * a;
        ctx.strokeStyle = '#5ab93b';
        ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (p.type === 'lightning') {
        ctx.strokeStyle = '#bff0ff'; ctx.lineWidth = 3 + Math.random() * 2;
        ctx.shadowColor = '#bff0ff'; ctx.shadowBlur = 16;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        const sx = (p.vx - p.x), sy = (p.vy - p.y);
        const segs = 5;
        for (let s = 1; s <= segs; s++) {
          const t = s / segs;
          const jitter = s < segs ? (Math.random() - 0.5) * 18 : 0;
          ctx.lineTo(p.x + sx * t + jitter, p.y + sy * t + jitter);
        }
        ctx.stroke();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      } else if (p.type === 'chunk') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, a + 0.2);
        ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        // blood trail behind
        if (Math.random() < 0.35) {
          ctx.fillStyle = 'rgba(120,10,18,0.6)';
          ctx.beginPath(); ctx.arc(p.x - p.vx * 0.02, p.y - p.vy * 0.02, p.size * 0.6, 0, TAU); ctx.fill();
        }
      } else if (p.type === 'ring') {
        const r = p.size * (1 - a);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = a;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (p.type === 'arc') {
        // Directional 180° sweeping scythe arc
        const sweepFrac = Math.min(1, (1 - a) * 2.5 + 0.15);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p._ang || 0);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = a;
        ctx.lineWidth = 7 - (1 - a) * 3;
        ctx.shadowColor = p.color; ctx.shadowBlur = 18 * a;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (0.82 + (1-a) * 0.22), -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * sweepFrac);
        ctx.stroke();
        // Bright leading edge
        if (sweepFrac < 0.98) {
          const tipAng = -Math.PI * 0.5 + Math.PI * sweepFrac;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * (0.82 + (1-a) * 0.22), tipAng - 0.18, tipAng + 0.04);
          ctx.lineWidth = 10 * a;
          ctx.strokeStyle = '#fff';
          ctx.globalAlpha = a * 0.7;
          ctx.stroke();
        }
        ctx.restore();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, a + 0.2);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
    });

    // Damage numbers
    this.dmgNums.forEach(d => {
      const a = Math.min(1, d.life * 2);
      ctx.globalAlpha = a;
      ctx.fillStyle = d.color;
      ctx.font = 'bold ' + d.size + 'px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000';
      ctx.strokeText(d.text, d.x, d.y);
      ctx.fillText(d.text, d.x, d.y);
      ctx.globalAlpha = 1;
    });

    ctx.restore();

    // Off-screen boss indicator — guide arrow pointing toward boss when out of view
    if (this.bossActive) {
      const b = this.bossActive;
      const sx = b.x - this.cam.x + W / 2;
      const sy = b.y - this.cam.y + H / 2;
      const margin = 50;
      if (sx < margin || sx > W - margin || sy < margin || sy > H - margin) {
        // Clamp arrow to screen edge
        const cx = W / 2, cy = H / 2;
        const dx = sx - cx, dy = sy - cy;
        const ang = Math.atan2(dy, dx);
        // distance to edge
        const maxX = (W / 2) - margin;
        const maxY = (H / 2) - margin;
        const tx = Math.max(-maxX, Math.min(maxX, Math.cos(ang) * 9999));
        const ty = Math.max(-maxY, Math.min(maxY, Math.sin(ang) * 9999));
        // Find intersection with the rect edge along this angle
        const k = Math.min(maxX / Math.abs(Math.cos(ang) || 0.0001), maxY / Math.abs(Math.sin(ang) || 0.0001));
        const ax = cx + Math.cos(ang) * k;
        const ay = cy + Math.sin(ang) * k;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(ang);
        const pulse = 0.6 + 0.4 * Math.sin(this.time * 8);
        ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 18 * pulse;
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, 14);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-10, -14);
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', -2, 4);
        ctx.restore();
        // tx,ty unused suppressor
        void tx; void ty;
      }
    }

    const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Hit overlay
    if (this.player.hit > 0) {
      ctx.fillStyle = 'rgba(181,29,40,' + (this.player.hit * 0.35) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    // Slow-mo tint
    if (this.cam.slowmo > 0) {
      ctx.fillStyle = 'rgba(77,196,255,' + Math.min(0.2, this.cam.slowmo * 0.4) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    // ---- Boss death flash ----
    if (this._bossDeathFlash > 0) {
      const a = Math.min(1, this._bossDeathFlash);
      ctx.fillStyle = 'rgba(255,220,100,' + (a * 0.55) + ')';
      ctx.fillRect(0, 0, W, H);
      // expanding ring drawn in screen-space center
      const ringR = (1.4 - this._bossDeathFlash) * Math.max(W, H) * 0.85;
      ctx.strokeStyle = 'rgba(255,200,50,' + (a * 0.7) + ')';
      ctx.lineWidth = 8 * a;
      ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 28 * a;
      ctx.beginPath(); ctx.arc(W / 2, H / 2, ringR, 0, TAU); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // ---- Level-up flash ----
    if (this._levelUpFlash > 0) {
      const a = Math.min(1, this._levelUpFlash) * 0.5;
      const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.6);
      grad.addColorStop(0, 'rgba(77,255,212,' + a + ')');
      grad.addColorStop(0.5, 'rgba(77,196,255,' + (a * 0.5) + ')');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // ---- Crit screen-punch vignette ----
    if (this._critPunch > 0) {
      const a = Math.min(1, this._critPunch);
      // Red vignette edges
      const vg = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(255,49,70,' + (a * 0.38) + ')');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      // Brief scale aberration — quick zoom-in offset at canvas level is too costly,
      // so we simulate micro-punch with a white-flash center dot
      if (a > 0.6) {
        ctx.fillStyle = 'rgba(255,255,255,' + ((a - 0.6) * 0.25) + ')';
        ctx.beginPath(); ctx.arc(W/2, H/2, 12 * a, 0, TAU); ctx.fill();
      }
    }
  }

  drawGround() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    const cx = this.cam.x, cy = this.cam.y;
    // Stone-ish background gradient
    ctx.fillStyle = '#0c0a16';
    ctx.fillRect(cx, cy, W, H);
    // Pattern
    const grid = 64;
    const startX = Math.floor(cx / grid) * grid;
    const startY = Math.floor(cy / grid) * grid;
    ctx.strokeStyle = '#1a1228';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < cx + W + grid; x += grid) {
      ctx.moveTo(x, cy); ctx.lineTo(x, cy + H);
    }
    for (let y = startY; y < cy + H + grid; y += grid) {
      ctx.moveTo(cx, y); ctx.lineTo(cx + W, y);
    }
    ctx.stroke();
    // Some scattered glowing nodes
    ctx.fillStyle = '#2a1a40';
    for (let x = startX; x < cx + W + grid; x += grid * 2) {
      for (let y = startY; y < cy + H + grid; y += grid * 2) {
        const hx = Math.abs((x * 9301) ^ (y * 49297)) % 233280;
        const r = (hx / 233280) * 1.5 + 0.5;
        ctx.beginPath(); ctx.arc(x + grid / 2, y + grid / 2, r, 0, TAU); ctx.fill();
      }
    }
  }

  drawEnemyShape(e, outline) {
    const ctx = this.ctx;
    const t = e.t;
    const s = t.size;
    ctx.beginPath();
    switch (t.id) {
      case 'slime':
        ctx.ellipse(e.x, e.y, s * 0.55, s * 0.45, 0, 0, TAU); break;
      case 'bat':
        ctx.moveTo(e.x, e.y - s * 0.4);
        ctx.lineTo(e.x + s * 0.6, e.y);
        ctx.lineTo(e.x, e.y + s * 0.3);
        ctx.lineTo(e.x - s * 0.6, e.y);
        ctx.closePath(); break;
      case 'brute':
        ctx.rect(e.x - s * 0.5, e.y - s * 0.5, s, s); break;
      case 'ranger':
        ctx.moveTo(e.x, e.y - s * 0.6);
        for (let i = 1; i <= 6; i++) {
          const a = (i / 6) * TAU - Math.PI / 2;
          ctx.lineTo(e.x + Math.cos(a) * s * 0.6, e.y + Math.sin(a) * s * 0.6);
        }
        ctx.closePath(); break;
      case 'charger':
        ctx.moveTo(e.x + s * 0.6, e.y);
        ctx.lineTo(e.x - s * 0.5, e.y - s * 0.5);
        ctx.lineTo(e.x - s * 0.5, e.y + s * 0.5);
        ctx.closePath(); break;
      case 'ghoul':
        ctx.arc(e.x, e.y, s * 0.5, 0, TAU); break;
      case 'necron':
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          const r = i % 2 ? s * 0.4 : s * 0.7;
          const x = e.x + Math.cos(a) * r;
          const y = e.y + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); break;
      case 'bossOcular': {
        ctx.arc(e.x, e.y, s * 0.6, 0, TAU);
        break;
      }
      case 'bossNecromancer': {
        // Skull-like shape: a circle with eye-sockets
        ctx.arc(e.x, e.y, s * 0.55, 0, TAU);
        break;
      }
      case 'bossVoidTitan': {
        // Massive hexagonal titan
        ctx.moveTo(e.x + s * 0.6, e.y);
        for (let i = 1; i <= 6; i++) {
          const a = (i / 6) * TAU;
          ctx.lineTo(e.x + Math.cos(a) * s * 0.6, e.y + Math.sin(a) * s * 0.6);
        }
        ctx.closePath();
        break;
      }
      case 'bossAida':
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + this.time;
          const r = s * 0.55;
          const x = e.x + Math.cos(a) * r;
          const y = e.y + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); break;
      default:
        ctx.arc(e.x, e.y, s * 0.5, 0, TAU); break;
    }
    if (outline) ctx.stroke(); else ctx.fill();

    // Bosses get extra rendering passes (after the outline)
    if (t.id === 'bossOcular' && !outline) {
      // Pulsing golden outline ring so it's always visible
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 4);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(e.x, e.y, s * 0.68 + pulse * 3, 0, TAU);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // White iris
      ctx.fillStyle = '#fff8d0';
      ctx.beginPath(); ctx.arc(e.x, e.y, s * 0.32, 0, TAU); ctx.fill();
      // Black pupil following the player direction
      let pdx = 0, pdy = 0;
      if (this.player) {
        const dx = this.player.x - e.x, dy = this.player.y - e.y;
        const d = Math.hypot(dx, dy);
        if (d > 0.001) { pdx = (dx / d) * s * 0.14; pdy = (dy / d) * s * 0.14; }
      }
      ctx.fillStyle = '#0a0510';
      ctx.beginPath(); ctx.arc(e.x + pdx, e.y + pdy, s * 0.12, 0, TAU); ctx.fill();
      // Red inner glow
      ctx.fillStyle = '#ff3146';
      ctx.beginPath(); ctx.arc(e.x + pdx, e.y + pdy, s * 0.05, 0, TAU); ctx.fill();
    }
    if (t.id === 'bossAida' && !outline) {
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(e.x, e.y, s * 0.18, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff7a1a';
      ctx.beginPath(); ctx.arc(e.x, e.y, s * 0.08, 0, TAU); ctx.fill();
    }
    if (t.id === 'bossNecromancer' && !outline) {
      // Green glowing eye sockets
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 5);
      ctx.shadowColor = '#7ad96b'; ctx.shadowBlur = 18 * pulse;
      ctx.fillStyle = '#7ad96b';
      ctx.beginPath(); ctx.arc(e.x - s * 0.18, e.y - s * 0.08, s * 0.10, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(e.x + s * 0.18, e.y - s * 0.08, s * 0.10, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      // Teeth
      ctx.fillStyle = '#e8f5e0';
      for (let ti = 0; ti < 5; ti++) {
        const tx = e.x - s * 0.28 + ti * s * 0.14;
        ctx.fillRect(tx, e.y + s * 0.22, s * 0.09, s * 0.16);
      }
    }
    if (t.id === 'bossVoidTitan' && !outline) {
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 3);
      // Void eye glow
      ctx.shadowColor = '#b362ff'; ctx.shadowBlur = 30 * pulse;
      ctx.fillStyle = '#b362ff';
      ctx.beginPath(); ctx.arc(e.x, e.y, s * 0.20, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(e.x, e.y, s * 0.08, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      // Rotating void ring
      ctx.strokeStyle = 'rgba(179,98,255,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, s * 0.7 + pulse * 4, 0, TAU);
      ctx.stroke();
    }
  }

  drawPlayer() {
    const ctx = this.ctx;
    const p = this.player;
    const aimAng = Math.atan2(p.aimY, p.aimX);

    // shadow with squish
    const sqx = 1 + p.squish * 0.25;
    const sqy = 1 - p.squish * 0.18;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 10, p.r * 0.9 * sqx, p.r * 0.32, 0, 0, TAU);
    ctx.fill();

    // body: water droplet with tilt + squish
    const flash = p.hit > 0 ? 1 : 0;
    ctx.save();
    ctx.translate(p.x, p.y - Math.abs(Math.sin(p.bob || 0)) * 0.8);
    ctx.rotate(p.tilt);
    ctx.scale(sqx, sqy);
    const grad = ctx.createRadialGradient(-4, -5, 1, 0, 0, p.r);
    grad.addColorStop(0, flash ? '#fff' : '#e8faff');
    grad.addColorStop(0.5, flash ? '#fff' : '#5fd6ff');
    grad.addColorStop(1, flash ? '#fff' : '#1a5d99');
    ctx.shadowColor = '#4dc4ff'; ctx.shadowBlur = 14;
    ctx.fillStyle = grad;
    ctx.beginPath();
    const r = p.r;
    ctx.moveTo(0, -r * 1.15);
    ctx.bezierCurveTo(r * 1.05, -r * 0.4, r * 1.05, r * 0.65, 0, r);
    ctx.bezierCurveTo(-r * 1.05, r * 0.65, -r * 1.05, -r * 0.4, 0, -r * 1.15);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#06121e'; ctx.lineWidth = 2.4; ctx.stroke();
    // highlight droplet
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.5, 2.6, 4.2, -0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.arc(r * 0.3, r * 0.25, 1.6, 0, TAU); ctx.fill();
    // little eyes glow when iframes
    if (p.iframes > 0) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(-2, -2, 1.6, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(3, -2, 1.6, 0, TAU); ctx.fill();
    }
    ctx.restore();

    // ===== RIFLE / GUN — drawn in aim direction with recoil =====
    ctx.save();
    ctx.translate(p.x, p.y + 1);
    ctx.rotate(aimAng);
    const recoil = -p.recoil * 4;
    ctx.translate(recoil, 0);
    // pick visuals based on equipped weapon (use first owned that's a "shooter")
    const owned = this.run.ownedWeapons;
    const isReloading = p.reloading;
    let gunColor = '#3a4658';
    let accentColor = '#6cb4ff';
    if (owned.includes('voidBeam'))      { gunColor = '#2a1a3a'; accentColor = '#b362ff'; }
    else if (owned.includes('emberOrbs')){ gunColor = '#3a201a'; accentColor = '#ff7a1a'; }
    else if (owned.includes('shotgun'))  { gunColor = '#3a302a'; accentColor = '#ffd166'; }
    else if (owned.includes('autoBolts')){ gunColor = '#2a3a44'; accentColor = '#4dffd4'; }
    // stock
    ctx.fillStyle = '#1f2632';
    ctx.fillRect(-6, -3, 8, 6);
    // grip
    ctx.fillStyle = '#0f141c';
    ctx.fillRect(-2, 3, 4, 6);
    // body
    ctx.fillStyle = gunColor;
    ctx.fillRect(2, -3, 14, 6);
    // magazine
    ctx.fillStyle = '#11161e';
    ctx.fillRect(8, 3, 4, 7);
    // top rail with sight
    ctx.fillStyle = '#11161e';
    ctx.fillRect(4, -5, 9, 2);
    // sight dot
    ctx.fillStyle = accentColor;
    ctx.beginPath(); ctx.arc(8, -5.5, 1.2, 0, TAU); ctx.fill();
    // barrel
    ctx.fillStyle = '#2a313d';
    ctx.fillRect(16, -1.6, 12, 3.2);
    // muzzle ring
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(27, -2.4, 2.5, 4.8);
    // accent stripe
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(3, -0.6, 12, 1.2);
    ctx.globalAlpha = 1;
    // muzzle glow if recently fired
    if (p.recoil > 0.05) {
      const muzzleX = 30, muzzleR = 3 + p.recoil * 5;
      // Bright core glow
      ctx.fillStyle = accentColor;
      ctx.shadowColor = accentColor; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(muzzleX, 0, muzzleR, 0, TAU); ctx.fill();
      // Radial flash burst on fresh shots (recoil > 0.5)
      if (p.recoil > 0.5) {
        const flashR = muzzleR * 3.5;
        const grad = ctx.createRadialGradient(muzzleX, 0, 0, muzzleX, 0, flashR);
        grad.addColorStop(0, accentColor + 'dd');
        grad.addColorStop(0.35, accentColor + '66');
        grad.addColorStop(1, accentColor + '00');
        ctx.fillStyle = grad;
        ctx.shadowBlur = 0;
        ctx.globalAlpha = p.recoil * 0.9;
        ctx.beginPath(); ctx.arc(muzzleX, 0, flashR, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        // tiny lens flare lines
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.globalAlpha = p.recoil * 0.5;
        for (let fi = 0; fi < 4; fi++) {
          const fa = (fi / 4) * TAU;
          ctx.beginPath(); ctx.moveTo(muzzleX + Math.cos(fa) * muzzleR, Math.sin(fa) * muzzleR); ctx.lineTo(muzzleX + Math.cos(fa) * flashR * 0.85, Math.sin(fa) * flashR * 0.85); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      ctx.shadowBlur = 0;
    }
    // reload indicator
    if (isReloading) {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(8, 4, 9, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * (1 - p.reloadT / 1.5)); ctx.stroke();
    }
    ctx.restore();

    // crosshair at cursor position in world (desktop)
    if (!this.input.joyAim || (!this.input.joyAim.x && !this.input.joyAim.y)) {
      const wmx = this.input.mx - this.W / 2 + this.cam.x;
      const wmy = this.input.my - this.H / 2 + this.cam.y;
      ctx.strokeStyle = '#ff7a1aaa'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(wmx - 8, wmy); ctx.lineTo(wmx - 3, wmy);
      ctx.moveTo(wmx + 3, wmy); ctx.lineTo(wmx + 8, wmy);
      ctx.moveTo(wmx, wmy - 8); ctx.lineTo(wmx, wmy - 3);
      ctx.moveTo(wmx, wmy + 3); ctx.lineTo(wmx, wmy + 8);
      ctx.stroke();
    }

    // Orbit weapon visuals
    if (this.run.ownedWeapons.includes('emberOrbs')) {
      const w = WEAPONS.emberOrbs;
      const lvl = this.run.weaponLvls.emberOrbs || 0;
      const s = this.computeWeaponStats(w, lvl);
      const count = s.orbitCount || 2;
      const radius = (s.orbitRadius || 80) * this.run.stats.areaMult;
      const angBase = this.time * (s.orbitSpeed || 2);
      for (let i = 0; i < count; i++) {
        const a = angBase + (i / count) * TAU;
        const ox = p.x + Math.cos(a) * radius;
        const oy = p.y + Math.sin(a) * radius;
        ctx.fillStyle = s.color || '#ff7a1a';
        ctx.shadowColor = s.color || '#ff7a1a'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(ox, oy, 8, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  drawBeam() {
    if (!this.run.ownedWeapons.includes('voidBeam')) return;
    const p = this.player;
    const tgt = p._beamTarget;
    if (!tgt || !tgt.alive) return;
    const ctx = this.ctx;
    ctx.strokeStyle = '#b362ff';
    ctx.shadowColor = '#b362ff'; ctx.shadowBlur = 18;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(tgt.x, tgt.y);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
