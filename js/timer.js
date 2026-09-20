/* ═══════════════════════════════════════════
   Lucid — Focus Timer
   Timer logic with 4 modes: Deep Work,
   Pomodoro, Flow (stopwatch), Custom.
   ═══════════════════════════════════════════ */

class FocusTimer {
  constructor() {
    this.mode = 'deep'; // 'deep' | 'pomodoro' | 'flow' | 'custom'
    this.state = 'idle'; // 'idle' | 'running' | 'paused' | 'break'

    // Mode configurations (seconds)
    this.modes = {
      deep:     { work: 90 * 60, break: 15 * 60, sessions: 1, label: 'Deep Work' },
      pomodoro: { work: 25 * 60, break: 5 * 60,  sessions: 4, label: 'Pomodoro', longBreak: 15 * 60 },
      flow:     { work: Infinity, break: 0, sessions: 1, label: 'Flow' },
      custom:   { work: 45 * 60, break: 9 * 60,  sessions: 1, label: 'Custom' },
    };

    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.elapsedSeconds = 0;
    this.breakRemaining = 0;
    this.breakTotal = 0;
    this.pomodoroSession = 0;
    this.intervalId = null;
    this.startTimestamp = null;

    // Callbacks
    this.onTick = null;        // (remaining, elapsed, progress) => {}
    this.onDepthChange = null;  // (depthLevel, depthName) => {}
    this.onComplete = null;     // () => {}
    this.onBreakTick = null;    // (remaining) => {}
    this.onBreakEnd = null;     // () => {}
  }

  setMode(mode) {
    if (this.state !== 'idle') return;
    this.mode = mode;
  }

  setCustomTime(minutes) {
    this.modes.custom.work = minutes * 60;
    this.modes.custom.break = Math.max(Math.floor(minutes * 60 / 5), 60); // 1/5 of work, min 1 min
  }

  getDisplayTime() {
    if (this.mode === 'flow' && this.state === 'idle') return '∞';
    const secs = this.state === 'idle'
      ? this.modes[this.mode].work
      : (this.mode === 'flow' ? this.elapsedSeconds : this.remainingSeconds);
    return this._formatTime(secs);
  }

  getModeLabel() {
    return this.modes[this.mode].label;
  }

  start() {
    if (this.state !== 'idle') return;
    const config = this.modes[this.mode];
    this.totalSeconds = config.work;
    this.remainingSeconds = config.work;
    this.elapsedSeconds = 0;
    this.pomodoroSession = 1;
    this.state = 'running';
    this.startTimestamp = Date.now();
    this._startInterval();
    this._updateDepth();
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this._stopInterval();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'running';
    this._startInterval();
  }

  stop() {
    const elapsed = this.elapsedSeconds;
    this.state = 'idle';
    this._stopInterval();
    this.remainingSeconds = 0;
    this.elapsedSeconds = 0;
    return elapsed;
  }

  startBreak() {
    const config = this.modes[this.mode];
    let breakDuration = config.break;

    // Long break for Pomodoro after 4th session
    if (this.mode === 'pomodoro' && this.pomodoroSession >= config.sessions) {
      breakDuration = config.longBreak || config.break;
    }

    this.breakTotal = breakDuration;
    this.breakRemaining = breakDuration;
    this.state = 'break';
    this._startBreakInterval();
  }

  skipBreak() {
    this._stopInterval();
    this.state = 'idle';
    if (this.mode === 'pomodoro' && this.pomodoroSession < this.modes.pomodoro.sessions) {
      // Continue to next pomodoro session
      this._startNextPomodoro();
    }
  }

  getProgress() {
    if (this.mode === 'flow') {
      // For flow mode, progress based on time elapsed (cap at 2 hours)
      return Math.min(this.elapsedSeconds / (120 * 60), 1);
    }
    if (this.totalSeconds <= 0) return 0;
    return 1 - (this.remainingSeconds / this.totalSeconds);
  }

  getDepthInfo() {
    const progress = this.getProgress();
    if (progress < 0.15)      return { level: 0, name: 'Surface',  color: '#4a8fe7' };
    else if (progress < 0.35) return { level: 1, name: 'Shallow',  color: '#3366cc' };
    else if (progress < 0.55) return { level: 2, name: 'Mid',      color: '#1f3d7a' };
    else if (progress < 0.80) return { level: 3, name: 'Deep',     color: '#7c6aff' };
    else                      return { level: 4, name: 'Abyss',    color: '#00ddb3' };
  }

  /* ─── Private ─── */

  _startInterval() {
    this._stopInterval();
    this.intervalId = setInterval(() => {
      if (this.state !== 'running') return;

      this.elapsedSeconds++;

      if (this.mode !== 'flow') {
        this.remainingSeconds = Math.max(0, this.remainingSeconds - 1);
      }

      const progress = this.getProgress();

      if (this.onTick) {
        this.onTick(this.remainingSeconds, this.elapsedSeconds, progress);
      }

      this._updateDepth();

      // Check completion (not for flow mode)
      if (this.mode !== 'flow' && this.remainingSeconds <= 0) {
        this._stopInterval();
        this.state = 'idle';
        if (this.onComplete) this.onComplete();
      }
    }, 1000);
  }

  _startBreakInterval() {
    this._stopInterval();
    this.intervalId = setInterval(() => {
      this.breakRemaining--;

      if (this.onBreakTick) {
        this.onBreakTick(this.breakRemaining);
      }

      if (this.breakRemaining <= 0) {
        this._stopInterval();
        this.state = 'idle';

        if (this.mode === 'pomodoro' && this.pomodoroSession < this.modes.pomodoro.sessions) {
          this._startNextPomodoro();
        } else if (this.onBreakEnd) {
          this.onBreakEnd();
        }
      }
    }, 1000);
  }

  _startNextPomodoro() {
    this.pomodoroSession++;
    this.totalSeconds = this.modes.pomodoro.work;
    this.remainingSeconds = this.modes.pomodoro.work;
    this.elapsedSeconds = 0;
    this.state = 'running';
    this._startInterval();
    this._updateDepth();
  }

  _stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  _updateDepth() {
    const depth = this.getDepthInfo();
    if (this.onDepthChange) {
      this.onDepthChange(this.getProgress(), depth);
    }
  }

  _formatTime(seconds) {
    if (seconds === Infinity) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

window.FocusTimer = FocusTimer;
