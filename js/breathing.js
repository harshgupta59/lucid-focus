/* ═══════════════════════════════════════════
   Lucid — Breathing Controller
   Guided 4-7-8 breathing ritual before
   focus sessions.
   ═══════════════════════════════════════════ */

class BreathingController {
  constructor() {
    this.overlay = document.getElementById('breathing-overlay');
    this.circle = document.getElementById('breathing-circle');
    this.ring = document.getElementById('breathing-ring');
    this.phaseEl = document.getElementById('breathing-phase');
    this.instructionEl = document.getElementById('breathing-instruction');
    this.counterEl = document.getElementById('breathing-counter');
    this.skipBtn = document.getElementById('skip-breathing');
    this.onComplete = null;
    this.running = false;
    this.timers = [];

    // 4-7-8 breathing pattern (in seconds)
    this.pattern = {
      inhale: 4,
      hold: 7,
      exhale: 8,
    };
    this.totalCycles = 3;
    this.currentCycle = 0;

    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => this.skip());
    }
  }

  start(callback) {
    this.onComplete = callback;
    this.currentCycle = 0;
    this.running = true;
    this._showOverlay();
    this._prepare();
  }

  skip() {
    this._cleanup();
    if (this.onComplete) this.onComplete();
  }

  _showOverlay() {
    this.overlay.classList.remove('hidden');
  }

  _hideOverlay() {
    this.overlay.classList.add('hidden');
  }

  _prepare() {
    this.phaseEl.textContent = 'Prepare';
    this.instructionEl.textContent = 'Find a comfortable position and relax';
    this.counterEl.textContent = `${this.totalCycles} cycles`;

    // Remove any existing animation classes
    this.ring.classList.remove('breathing-inhale', 'breathing-hold', 'breathing-exhale');

    // Reset circle to small state
    this.circle.style.transform = 'scale(0.6)';
    this.circle.style.opacity = '0.5';

    this._addTimer(() => {
      this._runCycle();
    }, 2000);
  }

  _runCycle() {
    if (!this.running) return;
    this.currentCycle++;
    const remaining = this.totalCycles - this.currentCycle + 1;
    this.counterEl.textContent = `Cycle ${this.currentCycle} of ${this.totalCycles}`;
    this._inhale();
  }

  _inhale() {
    if (!this.running) return;
    this.phaseEl.textContent = 'Inhale';
    this.instructionEl.textContent = 'Breathe in slowly through your nose';

    // Animate circle expanding
    this.ring.classList.remove('breathing-hold', 'breathing-exhale');
    this.ring.classList.add('breathing-inhale');
    this.circle.style.transition = `transform ${this.pattern.inhale}s cubic-bezier(0.65, 0, 0.35, 1), opacity ${this.pattern.inhale}s ease`;
    this.circle.style.transform = 'scale(1)';
    this.circle.style.opacity = '1';

    this._addTimer(() => this._hold(), this.pattern.inhale * 1000);
  }

  _hold() {
    if (!this.running) return;
    this.phaseEl.textContent = 'Hold';
    this.instructionEl.textContent = 'Hold your breath gently';

    this.ring.classList.remove('breathing-inhale', 'breathing-exhale');
    this.ring.classList.add('breathing-hold');

    this._addTimer(() => this._exhale(), this.pattern.hold * 1000);
  }

  _exhale() {
    if (!this.running) return;
    this.phaseEl.textContent = 'Exhale';
    this.instructionEl.textContent = 'Slowly breathe out through your mouth';

    this.ring.classList.remove('breathing-inhale', 'breathing-hold');
    this.ring.classList.add('breathing-exhale');
    this.circle.style.transition = `transform ${this.pattern.exhale}s cubic-bezier(0.65, 0, 0.35, 1), opacity ${this.pattern.exhale}s ease`;
    this.circle.style.transform = 'scale(0.6)';
    this.circle.style.opacity = '0.5';

    this._addTimer(() => {
      if (this.currentCycle < this.totalCycles) {
        this._runCycle();
      } else {
        this._finish();
      }
    }, this.pattern.exhale * 1000);
  }

  _finish() {
    if (!this.running) return;
    this.phaseEl.textContent = 'Ready';
    this.instructionEl.textContent = 'Your mind is clear. Let\'s dive in.';
    this.counterEl.textContent = '';

    this._addTimer(() => {
      this._cleanup();
      if (this.onComplete) this.onComplete();
    }, 1500);
  }

  _addTimer(fn, ms) {
    const id = setTimeout(fn, ms);
    this.timers.push(id);
    return id;
  }

  _cleanup() {
    this.running = false;
    this.timers.forEach(id => clearTimeout(id));
    this.timers = [];
    this.ring.classList.remove('breathing-inhale', 'breathing-hold', 'breathing-exhale');
    this.circle.style.transition = '';
    this.circle.style.transform = 'scale(0.6)';
    this.circle.style.opacity = '0.5';
    this._hideOverlay();
  }
}

window.BreathingController = BreathingController;
