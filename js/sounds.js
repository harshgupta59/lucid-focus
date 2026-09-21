/* ═══════════════════════════════════════════
   Lucid — Sound Engine
   Procedural ambient sounds using Web Audio API.
   No external audio files needed.
   ═══════════════════════════════════════════ */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sounds = {};
    this.initialized = false;
    this._masterVolume = 0.6; // Store master volume for pause/resume
  }

  async init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Ensure the context is fully running before proceeding.
      // This handles both initial suspended state and mobile "interrupted" state.
      if (this.ctx.state !== 'running') {
        await this.ctx.resume();
        // Double-check — some browsers need a short delay after resume
        if (this.ctx.state !== 'running') {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('AudioContext failed to start')), 3000);
            this.ctx.addEventListener('statechange', () => {
              if (this.ctx.state === 'running') {
                clearTimeout(timeout);
                resolve();
              }
            }, { once: true });
          });
        }
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this._createRain();
      this._createOcean();
      this._createFire();
      this._createCafe();
      this._createWind();
      this._createTones();
      this._createNotification();

      // Listen for AudioContext state changes (mobile tab switching, interruptions)
      this.ctx.addEventListener('statechange', () => {
        if (this.ctx.state === 'interrupted' || this.ctx.state === 'suspended') {
          // Attempt auto-recovery
          this.ctx.resume().catch(() => {});
        }
      });

      this.initialized = true;
    } catch (e) {
      console.warn('SoundEngine: Web Audio API not available', e);
    }
  }

  /* ─── Noise Buffer Generators ─── */

  _createNoiseBuffer(type, durationSec) {
    const len = (durationSec || 2) * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'brown') {
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * w) / 1.02;
        last = data[i];
        data[i] *= 3.5;
      }
    } else if (type === 'pink') {
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886*b0 + w*0.0555179;
        b1 = 0.99332*b1 + w*0.0750759;
        b2 = 0.96900*b2 + w*0.1538520;
        b3 = 0.86650*b3 + w*0.3104856;
        b4 = 0.55000*b4 + w*0.5329522;
        b5 = -0.7616*b5 - w*0.0168980;
        data[i] = b0+b1+b2+b3+b4+b5+b6+w*0.5362;
        data[i] *= 0.11;
        b6 = w * 0.115926;
      }
    }

    return buffer;
  }

  _makeSource(buffer) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  /* ─── Sound Creators ─── */
  /* Volumes are tuned so each channel is perceptually similar at default 50% slider */

  _createRain() {
    const src = this._makeSource(this._createNoiseBuffer('white', 3));
    // Bandpass to isolate raindrop frequencies
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3500;
    bp.Q.value = 0.4;

    // Slow LFO to vary the rain intensity
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 600;
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);
    lfo.start();

    // High shelf to add brightness
    const shelf = this.ctx.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 6000;
    shelf.gain.value = -6;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;

    src.connect(bp);
    bp.connect(shelf);
    shelf.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.sounds.rain = { gain, active: false, volume: 0.45 };
  }

  _createOcean() {
    const src = this._makeSource(this._createNoiseBuffer('brown', 4));

    // Low-pass filter with LFO for wave surges
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    lp.Q.value = 1;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08; // ~12 second wave cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain);
    lfoGain.connect(lp.frequency);
    lfo.start();

    // Volume swell synchronized with filter
    const volLfo = this.ctx.createOscillator();
    volLfo.type = 'sine';
    volLfo.frequency.value = 0.08;
    const volLfoGain = this.ctx.createGain();
    volLfoGain.gain.value = 0.15;
    volLfo.connect(volLfoGain);

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    volLfoGain.connect(gain.gain);
    volLfo.start();

    src.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.sounds.ocean = { gain, active: false, volume: 0.50 };
  }

  _createFire() {
    // Base warmth: brown noise through low-pass
    const base = this._makeSource(this._createNoiseBuffer('brown', 3));
    const baseLp = this.ctx.createBiquadFilter();
    baseLp.type = 'lowpass';
    baseLp.frequency.value = 350;
    baseLp.Q.value = 0.5;

    // Crackle: sparse impulse buffer through resonant filter
    const crackleBuffer = this._createCrackleBuffer();
    const crackle = this._makeSource(crackleBuffer);
    const crackleBp = this.ctx.createBiquadFilter();
    crackleBp.type = 'bandpass';
    crackleBp.frequency.value = 2000;
    crackleBp.Q.value = 2;
    const crackleGain = this.ctx.createGain();
    crackleGain.gain.value = 0.3;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;

    base.connect(baseLp);
    baseLp.connect(gain);

    crackle.connect(crackleBp);
    crackleBp.connect(crackleGain);
    crackleGain.connect(gain);

    gain.connect(this.masterGain);
    base.start();
    crackle.start();

    this.sounds.fire = { gain, active: false, volume: 0.55 };
  }

  _createCrackleBuffer() {
    const len = 5 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      if (Math.random() < 0.0008) {
        const burstLen = Math.floor(Math.random() * 300 + 80);
        for (let j = 0; j < burstLen && (i + j) < len; j++) {
          data[i + j] = (Math.random() * 2 - 1) * Math.exp(-j / 40);
        }
        i += burstLen;
      }
    }
    return buffer;
  }

  _createCafe() {
    const src = this._makeSource(this._createNoiseBuffer('pink', 4));

    // Voice-like bandpass
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 800;
    bp.Q.value = 0.6;

    // Slow modulation for conversation-like dynamics
    const lfo = this.ctx.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.value = 0.2;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.1;
    lfo.connect(lfoGain);

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    lfoGain.connect(gain.gain);
    lfo.start();

    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.sounds.cafe = { gain, active: false, volume: 0.35 };
  }

  _createWind() {
    const src = this._makeSource(this._createNoiseBuffer('white', 3));

    // Sweeping bandpass
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 500;
    bp.Q.value = 1.5;

    // LFO sweeps the center frequency
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05; // Very slow sweep
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 350;
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);
    lfo.start();

    // Additional low-pass for smoothness
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2000;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;

    src.connect(bp);
    bp.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.sounds.wind = { gain, active: false, volume: 0.40 };
  }

  _createTones() {
    // Warm ambient drone: detuned sine waves forming a minor chord
    const notes = [
      130.81, // C3
      132.5,  // C3 slightly detuned
      155.56, // Eb3
      157.0,  // Eb3 detuned
      196.0,  // G3
      198.0,  // G3 detuned
    ];

    const mergeGain = this.ctx.createGain();
    mergeGain.gain.value = 0.08; // Reduced from 0.12 — 6 oscillators stack up

    // Heavy low-pass for warmth
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    lp.Q.value = 0.5;

    // Slow volume wobble
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 100;
    lfo.connect(lfoGain);
    lfoGain.connect(lp.frequency);
    lfo.start();

    const gain = this.ctx.createGain();
    gain.gain.value = 0;

    notes.forEach(freq => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(mergeGain);
      osc.start();
    });

    mergeGain.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain);

    this.sounds.tones = { gain, active: false, volume: 0.30 };
  }

  _createNotification() {
    this.sounds.notification = { gain: this.masterGain, active: false, volume: 1.0 };
  }

  playNotification(type = 'bell') {
    if (!this.initialized || !this.ctx) return;
    
    // Ensure context is running before playing notification
    if (this.ctx.state !== 'running') {
      this.ctx.resume().catch(() => {});
    }
    
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sine';
    osc2.type = 'sine';
    
    // Nice bell frequencies
    osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
    osc2.frequency.setValueAtTime(1108.73, this.ctx.currentTime); // C#6
    
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
    
    osc.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    osc.start(this.ctx.currentTime);
    osc2.start(this.ctx.currentTime);
    
    osc.stop(this.ctx.currentTime + 3);
    osc2.stop(this.ctx.currentTime + 3);
  }

  /* ─── Public API ─── */

  toggle(name) {
    if (!this.initialized) return false;
    const sound = this.sounds[name];
    if (!sound) return false;

    // Ensure context is running (handles mobile tab-switch recovery)
    if (this.ctx.state !== 'running') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    if (sound.active) {
      // Fade out
      sound.gain.gain.cancelScheduledValues(now);
      sound.gain.gain.setValueAtTime(sound.gain.gain.value, now);
      sound.gain.gain.linearRampToValueAtTime(0, now + 0.5);
      sound.active = false;
    } else {
      // Fade in
      sound.gain.gain.cancelScheduledValues(now);
      sound.gain.gain.setValueAtTime(0, now);
      sound.gain.gain.linearRampToValueAtTime(sound.volume, now + 0.8);
      sound.active = true;
    }
    return sound.active;
  }

  setVolume(name, value) {
    if (!this.initialized) return;
    const sound = this.sounds[name];
    if (!sound) return;
    sound.volume = value;
    if (sound.active) {
      const now = this.ctx.currentTime;
      sound.gain.gain.cancelScheduledValues(now);
      sound.gain.gain.setValueAtTime(sound.gain.gain.value, now);
      sound.gain.gain.linearRampToValueAtTime(value, now + 0.1);
    }
  }

  isActive(name) {
    return this.sounds[name]?.active || false;
  }

  stopAll() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    Object.values(this.sounds).forEach(sound => {
      if (sound.active) {
        sound.gain.gain.cancelScheduledValues(now);
        sound.gain.gain.setValueAtTime(sound.gain.gain.value, now);
        // Soft fade-out over 1 second instead of abrupt stop
        sound.gain.gain.linearRampToValueAtTime(0, now + 1);
        sound.active = false;
      }
    });
  }

  getActiveSounds() {
    return Object.entries(this.sounds)
      .filter(([, s]) => s.active)
      .map(([name]) => name);
  }

  /**
   * Fade the master gain to 0 (mute). Keeps AudioContext running
   * so all BufferSource nodes and LFOs stay in sync.
   * Used when pausing a session.
   */
  fadeOut() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
  }

  /**
   * Restore the master gain to its stored volume level.
   * Used when resuming a session.
   */
  fadeIn() {
    if (!this.ctx || !this.masterGain) return;
    // Ensure context is running (mobile recovery)
    if (this.ctx.state !== 'running') {
      this.ctx.resume().catch(() => {});
    }
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this._masterVolume, now + 0.5);
  }

  /* Legacy API kept for backwards compatibility, now delegates to fade approach */
  suspend() {
    this.fadeOut();
  }

  resume() {
    this.fadeIn();
  }
}

window.SoundEngine = SoundEngine;
