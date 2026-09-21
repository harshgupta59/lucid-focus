/* ═══════════════════════════════════════════
   Lucid — Settings Manager
   Handles user preferences for timer durations,
   auto-start behavior, and sounds.
   ═══════════════════════════════════════════ */

class SettingsManager {
  constructor() {
    this.STORAGE_KEY = 'lucid_settings';
    
    // Default settings
    this.defaults = {
      // Timer Durations (in minutes)
      pomodoroWork: 25,
      pomodoroShortBreak: 5,
      pomodoroLongBreak: 15,
      pomodoroLongBreakInterval: 4, // After 4 sessions
      deepWork: 90,
      
      // Auto-start behavior
      autoStartBreaks: false,
      autoStartPomodoros: false,
      
      // Behavior
      skipBreathing: false,
      browserNotifications: true
    };

    this.settings = this._load();
    this.listeners = [];
  }

  /* ─── API ─── */

  get(key) {
    if (this.settings[key] !== undefined) {
      return this.settings[key];
    }
    return this.defaults[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this._save();
    this._notify(key, value);
  }

  updateAll(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this._save();
    this._notify('all', this.settings);
  }

  getAll() {
    return { ...this.defaults, ...this.settings };
  }

  reset() {
    this.settings = { ...this.defaults };
    this._save();
    this._notify('all', this.settings);
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  /* ─── Persistence ─── */

  _load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? { ...this.defaults, ...JSON.parse(raw) } : { ...this.defaults };
    } catch {
      return { ...this.defaults };
    }
  }

  _save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('SettingsManager: Failed to save to localStorage', e);
    }
  }

  _notify(key, value) {
    this.listeners.forEach(cb => cb(key, value));
  }
}

window.SettingsManager = SettingsManager;
