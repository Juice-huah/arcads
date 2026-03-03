// ─────────────────────────────────────────────────────────────────────────────
//  SoundManager.js  –  Synthesized sound effects via Web Audio API
//  No external files needed — all sounds generated procedurally.
// ─────────────────────────────────────────────────────────────────────────────

class SoundManager {
  constructor() {
    this._ctx = null;
    this._enabled = true;
    this._volume = 0.5;
  }

  _getCtx() {
    if (!this._ctx) {
      try {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    // Resume if suspended (autoplay policy)
    if (this._ctx.state === "suspended") {
      this._ctx.resume();
    }
    return this._ctx;
  }

  get enabled() { return this._enabled; }
  set enabled(v) { this._enabled = v; }

  get volume() { return this._volume; }
  set volume(v) { this._volume = Math.max(0, Math.min(1, v)); }

  /* ── Core helpers ───────────────────────────────────────────────────────── */
  _play(buildFn) {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    try { buildFn(ctx, this._volume); } catch (_) {}
  }

  _tone(ctx, freq, type, startTime, duration, gainPeak, vol) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak * vol, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  _noise(ctx, startTime, duration, gainPeak, vol, filterFreq = 3000) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainPeak * vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(startTime);
    source.stop(startTime + duration);
  }

  /* ── Sound effects ──────────────────────────────────────────────────────── */

  /** Correct answer — bright ascending chime */
  playCorrect() {
    this._play((ctx, vol) => {
      const t = ctx.currentTime;
      const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        this._tone(ctx, freq, "sine", t + i * 0.08, 0.3, 0.35, vol);
      });
    });
  }

  /** Wrong answer — descending buzz */
  playWrong() {
    this._play((ctx, vol) => {
      const t = ctx.currentTime;
      this._tone(ctx, 200, "sawtooth", t, 0.15, 0.4, vol);
      this._tone(ctx, 150, "sawtooth", t + 0.12, 0.25, 0.3, vol);
    });
  }

  /** Enemy death — pop/crunch */
  playEnemyDie(style = "burst") {
    this._play((ctx, vol) => {
      const t = ctx.currentTime;
      if (style === "burst") {
        this._noise(ctx, t, 0.18, 0.5, vol, 800);
        this._tone(ctx, 180, "square", t, 0.1, 0.3, vol);
      } else if (style === "collapse") {
        this._noise(ctx, t, 0.25, 0.4, vol, 300);
        this._tone(ctx, 100, "triangle", t, 0.2, 0.25, vol);
      } else if (style === "explode") {
        this._noise(ctx, t, 0.4, 0.7, vol, 400);
        this._tone(ctx, 80, "sawtooth", t, 0.35, 0.4, vol);
        this._tone(ctx, 160, "square", t + 0.05, 0.2, 0.2, vol);
      } else {
        this._tone(ctx, 220, "sine", t, 0.2, 0.25, vol);
        this._noise(ctx, t + 0.05, 0.15, 0.2, vol, 1200);
      }
    });
  }

  /** Tower fires — swoosh / zap based on level */
  playTowerFire(projectileType = "arrow") {
    this._play((ctx, vol) => {
      const t = ctx.currentTime;
      if (projectileType === "arrow") {
        // Whoosh
        this._noise(ctx, t, 0.15, 0.35, vol, 2000);
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.linearRampToValueAtTime(300, t + 0.15);
        g.gain.setValueAtTime(0.2 * vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t); osc.stop(t + 0.2);
      } else if (projectileType === "bolt") {
        this._noise(ctx, t, 0.12, 0.4, vol, 1500);
        this._tone(ctx, 400, "square", t, 0.1, 0.25, vol);
      } else if (projectileType === "lightning") {
        this._noise(ctx, t, 0.08, 0.6, vol, 4000);
        this._tone(ctx, 900, "sawtooth", t, 0.06, 0.4, vol);
        this._tone(ctx, 600, "square", t + 0.03, 0.08, 0.3, vol);
      } else if (projectileType === "fireball") {
        this._noise(ctx, t, 0.3, 0.55, vol, 600);
        this._tone(ctx, 120, "sawtooth", t, 0.25, 0.35, vol);
        this._tone(ctx, 250, "triangle", t + 0.1, 0.2, 0.2, vol);
      }
    });
  }

  /** Boss appears — dramatic impact */
  playBossAppear() {
    this._play((ctx, vol) => {
      const t = ctx.currentTime;
      this._noise(ctx, t, 0.6, 0.8, vol, 200);
      this._tone(ctx, 55, "sawtooth", t, 0.5, 0.5, vol);
      this._tone(ctx, 110, "square", t + 0.1, 0.4, 0.3, vol);
      [440, 330, 220, 110].forEach((f, i) => {
        this._tone(ctx, f, "sawtooth", t + 0.3 + i * 0.08, 0.15, 0.2, vol);
      });
    });
  }

  /** Special ability activated */
  playAbility(type) {
    this._play((ctx, vol) => {
      const t = ctx.currentTime;
      if (type === "freeze") {
        // Ice crystal tinkles
        [1047, 1319, 1568, 2093].forEach((f, i) => {
          this._tone(ctx, f, "sine", t + i * 0.06, 0.3, 0.3, vol);
        });
        this._noise(ctx, t + 0.1, 0.3, 0.2, vol, 5000);
      } else if (type === "storm") {
        // Arrow whooshes
        for (let i = 0; i < 5; i++) {
          this._noise(ctx, t + i * 0.05, 0.12, 0.35, vol, 2500);
        }
      } else if (type === "shield") {
        // Metallic clang
        this._noise(ctx, t, 0.08, 0.5, vol, 3000);
        this._tone(ctx, 440, "square", t, 0.4, 0.35, vol);
        this._tone(ctx, 880, "square", t + 0.02, 0.3, 0.2, vol);
      }
    });
  }

  /** Castle takes damage */
  playCastleHit() {
    this._play((ctx, vol) => {
      const t = ctx.currentTime;
      this._noise(ctx, t, 0.4, 0.6, vol, 200);
      this._tone(ctx, 80, "sawtooth", t, 0.3, 0.4, vol);
    });
  }

  /** Wave cleared — fanfare */
  playWaveComplete() {
    this._play((ctx, vol) => {
      const t = ctx.currentTime;
      const fanfare = [523, 659, 784, 659, 784, 1047];
      fanfare.forEach((freq, i) => {
        this._tone(ctx, freq, "triangle", t + i * 0.1, 0.2, 0.4, vol);
      });
    });
  }

  /** Combo milestone */
  playComboMilestone(level) {
    this._play((ctx, vol) => {
      const t = ctx.currentTime;
      const base = [400, 500, 600][Math.min(level, 2)] || 400;
      [base, base * 1.25, base * 1.5, base * 2].forEach((f, i) => {
        this._tone(ctx, f, "sine", t + i * 0.07, 0.25, 0.4, vol);
      });
    });
  }

  /** Tower upgrade */
  playTowerUpgrade() {
    this._play((ctx, vol) => {
      const t = ctx.currentTime;
      [261, 329, 392, 523, 659, 784, 1047].forEach((f, i) => {
        this._tone(ctx, f, "sine", t + i * 0.06, 0.2, 0.35, vol);
      });
    });
  }
}

// Export singleton
export const soundManager = new SoundManager();
export default soundManager;