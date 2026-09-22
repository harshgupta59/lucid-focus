/* ═══════════════════════════════════════════
   Lucid — Focus Timer
   Timer logic with 4 modes: Deep Work,
   Pomodoro, Flow (stopwatch), Custom.
   ═══════════════════════════════════════════ */

class FocusTimer {
  /* ─── Depth threshold constants ─── */
  static DEPTH_THRESHOLDS = {
    SHALLOW: 0.15,
    MID:     0.35,
    DEEP:    0.55,
    ABYSS:   0.80,
  };

  static DEPTHS = [
    { level: 0, name: 'Surface',  color: '#4a8fe7' },
    { level: 1, name: 'Shallow',  color: '#3366cc' },
    { level: 2, name: 'Mid',      color: '#1f3d7a' },
    { level: 3, name: 'Deep',     color: '#7c6aff' },
    { level: 4, name: 'Abyss',    color: '#00ddb3' },
  ];

  constructor() {
    this.mode = 'deep'; // 'deep' | 'pomodoro' | 'flow' | 'custom'
    this.state = 'idle'; // 'idle' | 'running' | 'paused' | 'break'

    // Mode configurations (seconds) - updated via updateConfig()
    this.modes = {
      deep:     { work: 90 * 60, break: 15 * 60, sessions: 1, label: 'Deep Work' },
      pomodoro: { work: 25 * 60, break: 5 * 60,  sessions: 4, label: 'Pomodoro', longBreak: 15 * 60 },
      flow:     { work: Infinity, break: 0, sessions: 1, label: 'Flow' },
      custom:   { work: 45 * 60, break: 9 * 60,  sessions: 1, label: 'Custom' },
    };
    
    // Auto-start flags
    this.autoStartBreaks = false;
    this.autoStartPomodoros = false;

    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.elapsedSeconds = 0;
    this.breakRemaining = 0;
    this.breakTotal = 0;
    this.pomodoroSession = 0;
    this.intervalId = null;

    // Drift-corrected timing: track wall-clock timestamps
    this._wallStart = null;      // Date.now() when timer started
    this._wallPausedAt = null;   // Date.now() when paused
    this._wallPausedTotal = 0;   // total ms spent paused
    this._breakWallStart = null;
    this._breakWallPausedAt = null;
    this._breakWallPausedTotal = 0;

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

  updateConfig(settings) {
    this.modes.deep.work = settings.deepWork * 60;
    // Deep work break is usually not standard, we'll keep it proportional or just a generic break
    this.modes.pomodoro.work = settings.pomodoroWork * 60;
    this.modes.pomodoro.break = settings.pomodoroShortBreak * 60;
    this.modes.pomodoro.longBreak = settings.pomodoroLongBreak * 60;
    this.modes.pomodoro.sessions = settings.pomodoroLongBreakInterval;
    
    this.autoStartBreaks = settings.autoStartBreaks;
    this.autoStartPomodoros = settings.autoStartPomodoros;
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

    // Drift-corrected wall-clock tracking
    this._wallStart = Date.now();
    this._wallPausedAt = null;
    this._wallPausedTotal = 0;

    this._startInterval();
    this._updateDepth();
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this._wallPausedAt = Date.now();
    this._stopInterval();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'running';
    // Accumulate pause duration for drift correction
    if (this._wallPausedAt) {
      this._wallPausedTotal += Date.now() - this._wallPausedAt;
      this._wallPausedAt = null;
    }
    this._startInterval();
  }

  stop() {
    const elapsed = this.elapsedSeconds;
    this.state = 'idle';
    this._stopInterval();
    this.remainingSeconds = 0;
    this.elapsedSeconds = 0;
    this._wallStart = null;
    this._wallPausedAt = null;
    this._wallPausedTotal = 0;
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

    // Drift-corrected wall-clock tracking for breaks
    this._breakWallStart = Date.now();
    this._breakWallPausedAt = null;
    this._breakWallPausedTotal = 0;

    this._startBreakInterval();
  }

  skipBreak() {
    this._stopInterval();
    this.state = 'idle';
    if (this.mode === 'pomodoro' && this.pomodoroSession < this.modes.pomodoro.sessions) {
      if (this.autoStartPomodoros) {
        this._startNextPomodoro();
      } else {
        // Just prepare for next pomodoro but don't start
        this.pomodoroSession++;
        this.totalSeconds = this.modes.pomodoro.work;
        this.remainingSeconds = this.modes.pomodoro.work;
        this.elapsedSeconds = 0;
        this._updateDepth();
      }
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
    const T = FocusTimer.DEPTH_THRESHOLDS;
    const D = FocusTimer.DEPTHS;

    if (progress < T.SHALLOW)     return D[0];
    else if (progress < T.MID)    return D[1];
    else if (progress < T.DEEP)   return D[2];
    else if (progress < T.ABYSS)  return D[3];
    else                          return D[4];
  }

  /* ─── Private ─── */

  _startInterval() {
    this._stopInterval();
    this.intervalId = setInterval(() => {
      if (this.state !== 'running') return;

      // Drift-corrected elapsed time from wall clock
      const wallElapsed = Math.floor((Date.now() - this._wallStart - this._wallPausedTotal) / 1000);
      this.elapsedSeconds = wallElapsed;

      if (this.mode !== 'flow') {
        this.remainingSeconds = Math.max(0, this.totalSeconds - wallElapsed);
      }

      const progress = this.getProgress();

      if (this.onTick) {
        this.onTick(this.remainingSeconds, this.elapsedSeconds, progress);
      }

      this._updateDepth();

      // Check completion (not for flow mode)
      if (this.mode !== 'flow' && this.remainingSeconds <= 0) {
        this._stopInterval();
        // Fire callback before setting idle so handler can inspect state
        if (this.onComplete) this.onComplete();
        this.state = 'idle';
      }
    }, 1000);
  }

  _startBreakInterval() {
    this._stopInterval();
    this.intervalId = setInterval(() => {
      // Drift-corrected break remaining
      const breakElapsed = Math.floor((Date.now() - this._breakWallStart - this._breakWallPausedTotal) / 1000);
      this.breakRemaining = Math.max(0, this.breakTotal - breakElapsed);

      if (this.onBreakTick) {
        this.onBreakTick(this.breakRemaining);
      }

      if (this.breakRemaining <= 0) {
        this._stopInterval();
        this.state = 'idle';

        if (this.mode === 'pomodoro' && this.pomodoroSession < this.modes.pomodoro.sessions) {
          if (this.autoStartPomodoros) {
            this._startNextPomodoro();
          } else {
            this.pomodoroSession++;
            this.totalSeconds = this.modes.pomodoro.work;
            this.remainingSeconds = this.modes.pomodoro.work;
            this.elapsedSeconds = 0;
            this._updateDepth();
            if (this.onBreakEnd) this.onBreakEnd();
          }
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

    // Reset wall clock for new pomodoro
    this._wallStart = Date.now();
    this._wallPausedAt = null;
    this._wallPausedTotal = 0;

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
