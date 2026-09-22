/* ═══════════════════════════════════════════
   Lucid — Particle System
   Canvas-based floating particles that respond
   to focus depth level.
   ═══════════════════════════════════════════ */

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.depthLevel = 0; // 0–1
    this.running = false;
    this.baseCount = 60;
    this.maxCount = 180;
    this._resizeTimer = null;
    this._resize();
    this._boundResize = () => this._debouncedResize();
    window.addEventListener('resize', this._boundResize);
  }

  /* ─── Debounced resize (#17) ─── */
  _debouncedResize() {
    if (this._resizeTimer) clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => this._resize(), 150);
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    // Fix #3: Use setTransform instead of scale to prevent cumulative scaling
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  _createParticle(randomY) {
    const depth = this.depthLevel;
    // At deeper levels, particles shift from blue to teal/green with more glow
    const hueBase = 220 - depth * 40; // 220 (blue) → 180 (teal)
    const hueRange = 30 + depth * 20;
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : this.height + Math.random() * 50,
      size: Math.random() * (2 + depth * 3) + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -(Math.random() * (0.3 + depth * 0.4) + 0.1),
      opacity: Math.random() * 0.4 + 0.1 + depth * 0.2,
      maxOpacity: Math.random() * 0.4 + 0.1 + depth * 0.2,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: Math.random() * 0.015 + 0.005,
      hue: hueBase + Math.random() * hueRange,
      saturation: 60 + depth * 20,
      lightness: 50 + depth * 20,
      glowSize: depth > 0.4 ? (4 + depth * 12) : 0,
    };
  }

  setDepth(level) {
    this.depthLevel = Math.max(0, Math.min(1, level));
    const targetCount = Math.floor(this.baseCount + this.depthLevel * (this.maxCount - this.baseCount));

    while (this.particles.length < targetCount) {
      this.particles.push(this._createParticle(true));
    }
    while (this.particles.length > targetCount) {
      this.particles.pop();
    }
  }

  _update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Gentle drift
      p.x += p.speedX + Math.sin(p.phase * 0.5) * 0.1;
      p.y += p.speedY;
      p.phase += p.phaseSpeed;

      // Pulsing opacity
      const pulse = 0.5 + 0.5 * Math.sin(p.phase);
      p.currentOpacity = p.maxOpacity * (0.4 + 0.6 * pulse);

      // Wrap around
      if (p.y < -20) {
        p.y = this.height + 20;
        p.x = Math.random() * this.width;
      }
      if (p.x < -20) p.x = this.width + 20;
      if (p.x > this.width + 20) p.x = -20;
    }
  }

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    for (const p of this.particles) {
      ctx.save();

      if (p.glowSize > 0) {
        ctx.shadowBlur = p.glowSize * p.currentOpacity;
        ctx.shadowColor = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.currentOpacity * 0.6})`;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.currentOpacity})`;
      ctx.fill();

      ctx.restore();
    }
  }

  _loop() {
    if (!this.running) return;
    // Fix #16: Skip rendering when tab is hidden to save CPU
    if (!document.hidden) {
      this._update();
      this._draw();
    }
    this.rafId = requestAnimationFrame(() => this._loop());
  }

  start() {
    if (this.running) return;
    this.running = true;
    // Initialize with base particles
    this.setDepth(this.depthLevel);
    this._loop();
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  destroy() {
    this.stop();
    if (this._resizeTimer) clearTimeout(this._resizeTimer);
    window.removeEventListener('resize', this._boundResize);
    this.particles = [];
  }
}

window.ParticleSystem = ParticleSystem;
