/* ═══════════════════════════════════════════
   Lucid — Stats Manager
   LocalStorage persistence, analytics,
   heatmap data, streaks, achievements.
   ═══════════════════════════════════════════ */

class StatsManager {
  constructor() {
    this.STORAGE_KEY = 'lucid_sessions';
    this.sessions = this._load();
  }

  /* ─── Session CRUD ─── */

  saveSession(session) {
    // session: { date, duration, mode, depthReached, rating, intention, note, timestamp }
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: session.date || new Date().toISOString().split('T')[0],
      timestamp: session.timestamp || Date.now(),
      duration: session.duration || 0,       // seconds
      mode: session.mode || 'deep',
      depth: session.depthReached || 'Surface',
      rating: session.rating || 0,
      intention: session.intention || '',
      note: session.note || '',
    };
    this.sessions.push(entry);
    this._save();
    return entry;
  }

  getSessions() {
    return [...this.sessions].sort((a, b) => b.timestamp - a.timestamp);
  }

  getRecentSessions(count = 10) {
    return this.getSessions().slice(0, count);
  }

  /* ─── Analytics ─── */

  getTotalFocusToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.sessions
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + s.duration, 0);
  }

  getTotalFocusAllTime() {
    return this.sessions.reduce((sum, s) => sum + s.duration, 0);
  }

  getSessionCountToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.sessions.filter(s => s.date === today).length;
  }

  getBestSession() {
    if (this.sessions.length === 0) return 0;
    return Math.max(...this.sessions.map(s => s.duration));
  }

  getTotalSessions() {
    return this.sessions.length;
  }

  /* ─── Streak ─── */

  getStreak() {
    if (this.sessions.length === 0) return 0;

    const days = new Set(this.sessions.map(s => s.date));
    const sortedDays = [...days].sort().reverse();

    // Check if today or yesterday had a session
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (!days.has(today) && !days.has(yesterday)) return 0;

    let streak = 0;
    let checkDate = new Date();

    // If no session today, start from yesterday
    if (!days.has(today)) {
      checkDate = new Date(Date.now() - 86400000);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (days.has(dateStr)) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }

    return streak;
  }

  /* ─── Heatmap Data ─── */

  getHeatmapData(weeks = 12) {
    const data = [];
    const today = new Date();

    // Find the most recent Monday to align the grid
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Calculate focus minutes per day
    const dayTotals = {};
    this.sessions.forEach(s => {
      if (!dayTotals[s.date]) dayTotals[s.date] = 0;
      dayTotals[s.date] += s.duration;
    });

    // Generate cells for the last N weeks
    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1 - daysToMonday + (daysToMonday > 0 ? 0 : 0));

    // Adjust to start from Monday
    const start = new Date(today);
    start.setDate(today.getDate() - totalDays + 1);
    // Align to Monday
    while (start.getDay() !== 1) {
      start.setDate(start.getDate() - 1);
    }

    for (let i = 0; i < totalDays + 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d > today) break;

      const dateStr = d.toISOString().split('T')[0];
      const totalSecs = dayTotals[dateStr] || 0;
      const totalMins = totalSecs / 60;

      let level = 0;
      if (totalMins > 0 && totalMins <= 30) level = 1;
      else if (totalMins > 30 && totalMins <= 60) level = 2;
      else if (totalMins > 60 && totalMins <= 120) level = 3;
      else if (totalMins > 120) level = 4;

      data.push({
        date: dateStr,
        minutes: Math.round(totalMins),
        level,
        dayOfWeek: d.getDay(),
      });
    }

    return data;
  }

  /* ─── Achievements ─── */

  getAchievements() {
    const totalSessions = this.getTotalSessions();
    const streak = this.getStreak();
    const bestSession = this.getBestSession();
    const totalHours = this.getTotalFocusAllTime() / 3600;
    const depths = this.sessions.map(s => s.depth);
    const hasDeep = depths.includes('Deep') || depths.includes('Abyss');
    const hasAbyss = depths.includes('Abyss');
    const todayMins = this.getTotalFocusToday() / 60;

    return [
      {
        id: 'first-dive',
        icon: '🏊',
        name: 'First Dive',
        desc: 'Complete your first session',
        unlocked: totalSessions >= 1,
      },
      {
        id: 'deep-diver',
        icon: '🐋',
        name: 'Deep Diver',
        desc: 'Reach Deep depth level',
        unlocked: hasDeep,
      },
      {
        id: 'abyss-walker',
        icon: '🌌',
        name: 'Abyss Walker',
        desc: 'Reach the Abyss level',
        unlocked: hasAbyss,
      },
      {
        id: 'marathon',
        icon: '🏃',
        name: 'Marathon',
        desc: '2+ hours focused in a day',
        unlocked: todayMins >= 120 || this._anyDayOver(120),
      },
      {
        id: 'streak-3',
        icon: '🔥',
        name: 'On Fire',
        desc: '3-day focus streak',
        unlocked: streak >= 3,
      },
      {
        id: 'streak-7',
        icon: '⚡',
        name: 'Streak Master',
        desc: '7-day focus streak',
        unlocked: streak >= 7,
      },
      {
        id: 'ten-sessions',
        icon: '🎯',
        name: 'Dedicated',
        desc: 'Complete 10 sessions',
        unlocked: totalSessions >= 10,
      },
      {
        id: 'century',
        icon: '💯',
        name: 'Century',
        desc: 'Complete 100 sessions',
        unlocked: totalSessions >= 100,
      },
      {
        id: 'ten-hours',
        icon: '⏰',
        name: 'Time Lord',
        desc: '10+ total hours focused',
        unlocked: totalHours >= 10,
      },
    ];
  }

  _anyDayOver(minutes) {
    const dayTotals = {};
    this.sessions.forEach(s => {
      if (!dayTotals[s.date]) dayTotals[s.date] = 0;
      dayTotals[s.date] += s.duration;
    });
    return Object.values(dayTotals).some(secs => secs / 60 >= minutes);
  }

  /* ─── Formatting Helpers ─── */

  formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  }

  formatDurationShort(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  }

  /* ─── Persistence ─── */

  _load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  _save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sessions));
    } catch (e) {
      console.warn('StatsManager: Failed to save to localStorage', e);
    }
  }
}

window.StatsManager = StatsManager;
