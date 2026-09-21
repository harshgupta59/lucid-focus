/* ═══════════════════════════════════════════
   Lucid — Main Application Controller
   Ties all modules together: timer, particles,
   sounds, breathing, stats.
   ═══════════════════════════════════════════ */

(function() {
  'use strict';

  /* ─── Constants ─── */
  const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 140; // ~879.65
  const EXERCISES = [
    { icon: '👁️', text: 'Look at something 20ft away for 20 seconds. Rest your eyes.' },
    { icon: '🧘', text: 'Take 5 deep breaths. Inhale for 4 seconds, exhale for 6.' },
    { icon: '💧', text: 'Drink a glass of water. Hydration sharpens your focus.' },
    { icon: '🙆', text: 'Roll your shoulders 10 times backward, then 10 times forward.' },
    { icon: '🖐️', text: 'Stretch your fingers wide, make fists, repeat 10 times.' },
    { icon: '🚶', text: 'Stand up and walk around for a moment. Move your body.' },
    { icon: '🌱', text: 'Look out a window at nature. Let your mind wander briefly.' },
    { icon: '😌', text: 'Close your eyes and count backwards from 10 slowly.' },
  ];

  /* ─── State ─── */
  let currentView = 'focus';
  let focusRating = 0;
  let mixerOpen = false;
  let lastDepthName = 'Surface';

  /* ─── Modules ─── */
  const particles = new ParticleSystem('particle-canvas');
  const sounds = new SoundEngine();
  const breathing = new BreathingController();
  const timer = new FocusTimer();
  const stats = new StatsManager();
  const settingsManager = new SettingsManager();
  const taskManager = new TaskManager();

  /* ─── DOM References ─── */
  const $ = id => document.getElementById(id);

  const els = {
    // Views
    focusView: $('focus-view'),
    statsView: $('stats-view'),
    // Nav
    navFocus: $('nav-focus'),
    navStats: $('nav-stats'),
    // Timer
    timerDisplay: $('timer-display'),
    depthLabel: $('depth-label'),
    timerSub: $('timer-sub'),
    gaugeProgress: $('gauge-progress'),
    timerContainer: $('timer-container'),
    // Mode
    modeSelector: $('mode-selector'),
    customTimeInput: $('custom-time-input'),
    customMinutes: $('custom-minutes'),
    customTimeLabel: $('custom-time-label'),
    timePlus: $('time-plus'),
    timeMinus: $('time-minus'),
    // Controls
    btnStart: $('btn-start'),
    btnPause: $('btn-pause'),
    btnResume: $('btn-resume'),
    btnStop: $('btn-stop'),
    // Tasks
    tasksContainer: $('tasks-container'),
    taskList: $('task-list'),
    btnAddTask: $('btn-add-task'),
    taskFormInline: $('task-form-inline'),
    taskTitleInput: $('task-title-input'),
    taskEstInput: $('task-est-input'),
    btnTaskSave: $('btn-task-save'),
    btnTaskCancel: $('btn-task-cancel'),
    // Sound
    soundToggle: $('sound-toggle'),
    soundMixer: $('sound-mixer'),
    mixerClose: $('mixer-close'),
    // Overlays & Backdrop
    breathingOverlay: $('breathing-overlay'),
    breakOverlay: $('break-overlay'),
    breakTimerDisplay: $('break-timer-display'),
    exerciseIcon: $('exercise-icon'),
    exerciseText: $('exercise-text'),
    skipBreak: $('skip-break'),
    reflectionOverlay: $('reflection-overlay'),
    summaryDuration: $('summary-duration'),
    summaryDepth: $('summary-depth'),
    ratingStars: $('rating-stars'),
    reflectionNote: $('reflection-note'),
    saveReflection: $('save-reflection'),
    soundMixerBackdrop: $('sound-mixer-backdrop'),
    toast: $('toast'),
    toastText: $('toast-text'),
    toastIcon: $('toast-icon'),
    // Stats
    streakCount: $('streak-count'),
    statTotalToday: $('stat-total-today'),
    statStreak: $('stat-streak'),
    statBest: $('stat-best'),
    statTotalAll: $('stat-total-all'),
    heatmapGrid: $('heatmap-grid'),
    achievementsGrid: $('achievements-grid'),
    sessionList: $('session-list'),
    noSessions: $('no-sessions'),
    // Depth BG
    depthBg: $('depth-bg'),
    // Settings
    btnSettings: $('btn-settings'),
    settingsModal: $('settings-modal'),
    btnCloseSettings: $('btn-close-settings'),
    btnSettingsSave: $('btn-settings-save'),
    btnSettingsReset: $('btn-settings-reset'),
  };

  /* ─── Initialization ─── */

  function init() {
    particles.start();
    updateTimerDisplay();
    updateStreak();
    bindEvents();
    // Set initial gauge
    setGaugeProgress(0);

    // Request notification permission for timer completion alerts
    if ('Notification' in window && Notification.permission === 'default') {
      // Defer the permission request until user interacts
      document.addEventListener('click', function requestNotif() {
        Notification.requestPermission();
        document.removeEventListener('click', requestNotif);
      }, { once: true });
    }

    // Apply settings
    applySettingsToApp();
    populateSettingsUI();

    // Render tasks
    renderTasks();
    taskManager.onChange(renderTasks);
  }

  function applySettingsToApp() {
    timer.updateConfig(settingsManager.getAll());
    if (timer.state === 'idle') {
      updateTimerDisplay();
    }
  }

  function populateSettingsUI() {
    const s = settingsManager.getAll();
    $('set-pomodoro-work').value = s.pomodoroWork;
    $('set-pomodoro-break').value = s.pomodoroShortBreak;
    $('set-pomodoro-long').value = s.pomodoroLongBreak;
    $('set-pomodoro-interval').value = s.pomodoroLongBreakInterval;
    $('set-deep-work').value = s.deepWork;
    
    $('set-auto-break').checked = s.autoStartBreaks;
    $('set-auto-pomodoro').checked = s.autoStartPomodoros;
    $('set-skip-breathing').checked = s.skipBreathing;
  }

  function saveSettingsFromUI() {
    const newSettings = {
      pomodoroWork: parseInt($('set-pomodoro-work').value) || 25,
      pomodoroShortBreak: parseInt($('set-pomodoro-break').value) || 5,
      pomodoroLongBreak: parseInt($('set-pomodoro-long').value) || 15,
      pomodoroLongBreakInterval: parseInt($('set-pomodoro-interval').value) || 4,
      deepWork: parseInt($('set-deep-work').value) || 90,
      
      autoStartBreaks: $('set-auto-break').checked,
      autoStartPomodoros: $('set-auto-pomodoro').checked,
      skipBreathing: $('set-skip-breathing').checked
    };
    
    settingsManager.updateAll(newSettings);
    applySettingsToApp();
    els.settingsModal.classList.add('hidden');
    showToast('Settings saved');
  }

  /* ─── Event Bindings ─── */

  function bindEvents() {
    // Navigation
    els.navFocus.addEventListener('click', () => switchView('focus'));
    els.navStats.addEventListener('click', () => switchView('stats'));

    // Mode selection
    els.modeSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.mode-btn');
      if (!btn || timer.state !== 'idle') return;
      selectMode(btn.dataset.mode);
    });

    // Custom time controls
    els.timePlus.addEventListener('click', () => adjustCustomTime(5));
    els.timeMinus.addEventListener('click', () => adjustCustomTime(-5));
    els.customMinutes.addEventListener('change', () => {
      let val = parseInt(els.customMinutes.value) || 45;
      val = Math.max(5, Math.min(180, val));
      els.customMinutes.value = val;
      timer.setCustomTime(val);
      els.customTimeLabel.textContent = `${val} min`;
      updateTimerDisplay();
    });

    // Controls
    els.btnStart.addEventListener('click', startSession);
    els.btnPause.addEventListener('click', pauseSession);
    els.btnResume.addEventListener('click', resumeSession);
    els.btnStop.addEventListener('click', stopSession);

    // Sound mixer
    els.soundToggle.addEventListener('click', toggleMixer);
    els.mixerClose.addEventListener('click', closeMixer);
    els.soundMixerBackdrop.addEventListener('click', closeMixer);

    // Sound channel toggles
    document.querySelectorAll('.channel-toggle').forEach(toggle => {
      toggle.addEventListener('click', async () => {
        await sounds.init();
        const channel = toggle.closest('.mixer-channel');
        const name = channel.dataset.sound;
        const isActive = sounds.toggle(name);
        toggle.classList.toggle('active', isActive);
        const slider = channel.querySelector('.channel-volume');
        slider.disabled = !isActive;

        // Update sound toggle button state
        updateSoundToggleState();
      });
    });

    // Sound volume sliders
    document.querySelectorAll('.channel-volume').forEach(slider => {
      slider.addEventListener('input', () => {
        const name = slider.closest('.mixer-channel').dataset.sound;
        sounds.setVolume(name, slider.value / 100);
      });
    });

    // Break
    els.skipBreak.addEventListener('click', skipBreak);

    // Reflection stars
    els.ratingStars.addEventListener('click', (e) => {
      const starBtn = e.target.closest('.star-btn');
      if (!starBtn) return;
      setRating(parseInt(starBtn.dataset.rating));
    });

    // Save reflection
    els.saveReflection.addEventListener('click', saveReflection);

    // Settings
    els.btnSettings.addEventListener('click', () => els.settingsModal.classList.remove('hidden'));
    els.btnCloseSettings.addEventListener('click', () => els.settingsModal.classList.add('hidden'));
    els.btnSettingsSave.addEventListener('click', saveSettingsFromUI);
    els.btnSettingsReset.addEventListener('click', () => {
      settingsManager.reset();
      populateSettingsUI();
      applySettingsToApp();
      showToast('Settings reset to defaults');
    });

    // Close modals on outside click
    els.settingsModal.addEventListener('click', (e) => {
      if (e.target === els.settingsModal) els.settingsModal.classList.add('hidden');
    });

    // Task Events
    bindTaskEvents();

    // Timer callbacks
    timer.onTick = (remaining, elapsed, progress) => {
      onTimerTick(remaining, elapsed, progress);
      
      // Update tab title
      const timeStr = timer.getDisplayTime();
      document.title = `${timeStr} — ${timer.getModeLabel()} | Lucid`;
    };
    timer.onDepthChange = onDepthChange;
    timer.onComplete = onTimerComplete;
    timer.onBreakTick = onBreakTick;
    timer.onBreakEnd = onBreakEnd;

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.code) {
        case 'Space':
          e.preventDefault();
          if (timer.state === 'idle') startSession();
          else if (timer.state === 'running') pauseSession();
          else if (timer.state === 'paused') resumeSession();
          break;
        case 'Escape':
          if (timer.state === 'running' || timer.state === 'paused') stopSession();
          if (mixerOpen) closeMixer();
          break;
        case 'KeyS':
          toggleMixer();
          break;
      }
    });
  }

  /* ─── View Switching ─── */

  function switchView(view) {
    currentView = view;
    els.focusView.classList.toggle('active', view === 'focus');
    els.statsView.classList.toggle('active', view === 'stats');
    els.navFocus.classList.toggle('active', view === 'focus');
    els.navStats.classList.toggle('active', view === 'stats');

    if (view === 'stats') {
      renderStats();
    }
  }

  /* ─── Mode Selection ─── */

  function selectMode(mode) {
    timer.setMode(mode);

    // Update active button
    els.modeSelector.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Show/hide custom time input
    els.customTimeInput.classList.toggle('hidden', mode !== 'custom');

    updateTimerDisplay();
  }

  function adjustCustomTime(delta) {
    let val = parseInt(els.customMinutes.value) || 45;
    val = Math.max(5, Math.min(180, val + delta));
    els.customMinutes.value = val;
    timer.setCustomTime(val);
    els.customTimeLabel.textContent = `${val} min`;
    updateTimerDisplay();
  }

  /* ─── Timer Display ─── */

  function updateTimerDisplay() {
    els.timerDisplay.textContent = timer.getDisplayTime();
    els.timerSub.textContent = timer.getModeLabel();
  }

  function setGaugeProgress(progress) {
    const dashArray = progress * GAUGE_CIRCUMFERENCE;
    els.gaugeProgress.setAttribute('stroke-dasharray', `${dashArray} ${GAUGE_CIRCUMFERENCE}`);
  }

  /* ─── Task Rendering & Events ─── */

  function renderTasks() {
    const tasks = taskManager.getAllTasks();
    els.taskList.innerHTML = '';
    
    if (tasks.length === 0) {
      els.taskList.innerHTML = '<li style="text-align:center;color:var(--text-muted);font-size:var(--fs-sm);padding:var(--s-2)">No tasks yet.</li>';
      return;
    }

    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''} ${task.id === taskManager.activeTaskId ? 'active' : ''}`;
      li.dataset.id = task.id;

      li.innerHTML = `
        <div class="task-checkbox"></div>
        <div class="task-title">${task.title}</div>
        <div class="task-pomodoros">${task.completedPomodoros} / ${task.estimatedPomodoros}</div>
        <div class="task-actions">
          <button class="btn-delete-task" aria-label="Delete Task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      `;

      // Set active task
      li.addEventListener('click', (e) => {
        if (!e.target.closest('.task-checkbox') && !e.target.closest('.btn-delete-task')) {
          taskManager.setActiveTask(task.id);
        }
      });

      // Toggle complete
      const checkbox = li.querySelector('.task-checkbox');
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        taskManager.toggleComplete(task.id);
      });

      // Delete task
      const deleteBtn = li.querySelector('.btn-delete-task');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        taskManager.deleteTask(task.id);
      });

      els.taskList.appendChild(li);
    });
  }

  function bindTaskEvents() {
    els.btnAddTask.addEventListener('click', () => {
      els.taskFormInline.classList.remove('hidden');
      els.taskTitleInput.focus();
    });

    els.btnTaskCancel.addEventListener('click', () => {
      els.taskFormInline.classList.add('hidden');
      els.taskTitleInput.value = '';
      els.taskEstInput.value = '1';
    });

    els.btnTaskSave.addEventListener('click', () => {
      const title = els.taskTitleInput.value;
      const est = els.taskEstInput.value;
      if (title.trim()) {
        taskManager.addTask(title, est);
        els.taskFormInline.classList.add('hidden');
        els.taskTitleInput.value = '';
        els.taskEstInput.value = '1';
      }
    });

    els.taskTitleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') els.btnTaskSave.click();
      if (e.key === 'Escape') els.btnTaskCancel.click();
    });
  }

  /* ─── Session Flow ─── */

  function startSession() {
    const skipRitual = settingsManager.get('skipBreathing');

    if (!skipRitual && timer.mode !== 'flow') {
      breathing.start(() => {
        // After breathing, start the timer
        timer.start();
        sounds.playNotification('bell');
        sounds.fadeIn();
        showRunningUI();
      });
      els.breathingOverlay.classList.remove('hidden');
    } else {
      timer.start();
      sounds.playNotification('bell');
      sounds.fadeIn();
      showRunningUI();
    }
  }

  function pauseSession() {
    timer.pause();
    sounds.fadeOut();
    els.btnPause.classList.add('hidden');
    els.btnResume.classList.remove('hidden');
  }

  function resumeSession() {
    timer.resume();
    sounds.fadeIn();
    els.btnResume.classList.add('hidden');
    els.btnPause.classList.remove('hidden');
  }

  function stopSession() {
    const elapsed = timer.stop();
    showIdleUI();
    resetDepthVisuals();
    stopAllSounds();
    document.title = 'Lucid — Crystal Clear Focus';

    // If they spent at least 1 minute, show reflection
    if (elapsed >= 60) {
      showReflection(elapsed);
    } else {
      updateTimerDisplay();
      setGaugeProgress(0);
    }
  }

  function showRunningUI() {
    els.btnStart.classList.add('hidden');
    els.btnPause.classList.remove('hidden');
    els.btnStop.classList.remove('hidden');
    els.modeSelector.style.opacity = '0.3';
    els.modeSelector.style.pointerEvents = 'none';
    els.intentionInput.readOnly = true;
    els.intentionInput.style.opacity = '0.5';

    // Add pulse animation to timer
    els.timerContainer.classList.add('animate-glow');
  }

  function showIdleUI() {
    els.btnStart.classList.remove('hidden');
    els.btnPause.classList.add('hidden');
    els.btnResume.classList.add('hidden');
    els.btnStop.classList.add('hidden');
    els.modeSelector.style.opacity = '1';
    els.modeSelector.style.pointerEvents = 'auto';
    els.intentionInput.readOnly = false;
    els.intentionInput.style.opacity = '1';

    els.timerContainer.classList.remove('animate-glow');
  }

  /* ─── Timer Callbacks ─── */

  function onTimerTick(remaining, elapsed, progress) {
    if (timer.mode === 'flow') {
      // Flow mode: show elapsed time counting up
      const hrs = Math.floor(elapsed / 3600);
      const mins = Math.floor((elapsed % 3600) / 60);
      const secs = elapsed % 60;
      if (hrs > 0) {
        els.timerDisplay.textContent = `${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
      } else {
        els.timerDisplay.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
      }
    } else {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      els.timerDisplay.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    }

    setGaugeProgress(progress);
  }

  function onDepthChange(progress, depth) {
    els.depthLabel.textContent = depth.name;
    lastDepthName = depth.name;

    // Update particle system
    particles.setDepth(progress);

    // Update body background based on depth
    const depthColors = [
      '#07080f', // Surface
      '#060a16', // Shallow
      '#050812', // Mid
      '#04060e', // Deep
      '#03040a', // Abyss
    ];
    document.body.style.backgroundColor = depthColors[depth.level] || depthColors[0];
  }

  function onTimerComplete() {
    const elapsed = timer.elapsedSeconds || (timer.totalSeconds);
    stopAllSounds();
    sounds.playNotification('bell');
    document.title = 'Lucid — Crystal Clear Focus';

    // Send browser notification (useful when tab is backgrounded)
    if (settingsManager.get('browserNotifications')) {
      sendBrowserNotification('Session Complete!', 'Your focus session has ended. Time to reflect.');
    }

    // Pomodoro: check auto-start break
    if (timer.mode === 'pomodoro') {
      taskManager.incrementPomodoroCount();
      
      if (settingsManager.get('autoStartBreaks')) {
        showToast('Starting break...');
        showBreak();
      } else {
        showBreak(); // It auto starts break immediately in timer.js logic if autoStartBreaks was handled, wait, we handle it in app.js.
        // Actually, timer.startBreak() is called in showBreak(). So if we just call showBreak(), it works.
      }
    } else {
      // Other modes: show reflection
      document.title = 'Lucid — Crystal Clear Focus';
      showIdleUI();
      resetDepthVisuals();
      showReflection(elapsed);
    }
  }

  /* ─── Break ─── */

  function showBreak() {
    sounds.fadeOut();
    
    // Pick a random exercise
    const exercise = EXERCISES[Math.floor(Math.random() * EXERCISES.length)];
    els.exerciseIcon.textContent = exercise.icon;
    els.exerciseText.textContent = exercise.text;

    els.breakOverlay.classList.remove('hidden');
    timer.startBreak();
  }

  function onBreakTick(remaining) {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    els.breakTimerDisplay.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }

  function onBreakEnd() {
    els.breakOverlay.classList.add('hidden');

    // If pomodoro has more sessions, the timer auto-continues
    // Otherwise, show reflection for the full pomodoro set
    if (timer.state === 'running') {
      // Next pomodoro started automatically
      sounds.fadeIn();
      showRunningUI();
    } else {
      showIdleUI();
      resetDepthVisuals();
      const totalElapsed = timer.modes.pomodoro.work * timer.modes.pomodoro.sessions;
      showReflection(totalElapsed);
    }
  }

  function skipBreak() {
    els.breakOverlay.classList.add('hidden');
    timer.skipBreak();

    if (timer.state === 'running') {
      sounds.fadeIn();
      showRunningUI();
    } else {
      showIdleUI();
      resetDepthVisuals();
      document.title = 'Lucid — Crystal Clear Focus';
    }
  }

  /* ─── Reflection ─── */

  function showReflection(elapsedSeconds) {
    focusRating = 0;
    const mins = Math.round(elapsedSeconds / 60);
    els.summaryDuration.textContent = mins;
    els.summaryDepth.textContent = lastDepthName;

    // Reset stars
    els.ratingStars.querySelectorAll('.star-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.querySelector('svg').style.fill = 'none';
    });
    els.reflectionNote.value = '';

    els.reflectionOverlay.classList.remove('hidden');
  }

  function setRating(rating) {
    focusRating = rating;
    els.ratingStars.querySelectorAll('.star-btn').forEach(btn => {
      const r = parseInt(btn.dataset.rating);
      const active = r <= rating;
      btn.classList.toggle('active', active);
      btn.querySelector('svg').style.fill = active ? 'var(--warning)' : 'none';
      btn.querySelector('svg').style.stroke = active ? 'var(--warning)' : 'currentColor';
    });
  }

  function saveReflection() {
    const durationText = els.summaryDuration.textContent;
    const duration = parseInt(durationText) * 60; // convert back to seconds

    stats.saveSession({
      duration,
      mode: timer.mode,
      depthReached: lastDepthName,
      rating: focusRating,
      intention: els.intentionInput.value.trim(),
      note: els.reflectionNote.value.trim(),
    });

    els.reflectionOverlay.classList.add('hidden');
    updateTimerDisplay();
    setGaugeProgress(0);
    updateStreak();

    // Clear intention for next session
    els.intentionInput.value = '';
    lastDepthName = 'Surface';
    
    showToast('Session saved to Insights!', '📝');
  }
  
  function showToast(message, icon = '✨') {
    els.toastText.textContent = message;
    els.toastIcon.textContent = icon;
    els.toast.classList.add('show');
    
    setTimeout(() => {
      els.toast.classList.remove('show');
    }, 3000);
  }

  /* ─── Depth Visuals Reset ─── */

  function resetDepthVisuals() {
    particles.setDepth(0);
    document.body.style.backgroundColor = '#07080f';
    els.depthLabel.textContent = 'Surface';
  }

  /* ─── Sound Mixer ─── */

  function toggleMixer() {
    mixerOpen = !mixerOpen;
    els.soundMixer.classList.toggle('open', mixerOpen);
    els.soundToggle.classList.toggle('active', mixerOpen);
    els.soundMixerBackdrop.classList.toggle('show', mixerOpen);
  }

  function closeMixer() {
    mixerOpen = false;
    els.soundMixer.classList.remove('open');
    els.soundToggle.classList.remove('active');
    els.soundMixerBackdrop.classList.remove('show');
  }

  function stopAllSounds() {
    sounds.stopAll();
    document.querySelectorAll('.channel-toggle').forEach(toggle => {
      toggle.classList.remove('active');
      const channel = toggle.closest('.mixer-channel');
      const slider = channel.querySelector('.channel-volume');
      if (slider) slider.disabled = true;
    });
    updateSoundToggleState();
  }

  function updateSoundToggleState() {
    const hasActive = sounds.getActiveSounds().length > 0;
    els.soundToggle.classList.toggle('has-active', hasActive);
    
    // Subtly indicate active sounds even when mixer is closed
    if (hasActive && !mixerOpen) {
      els.soundToggle.style.borderColor = 'rgba(124, 106, 255, 0.3)';
      els.soundToggle.style.color = 'var(--accent)';
    } else if (!mixerOpen) {
      els.soundToggle.style.borderColor = '';
      els.soundToggle.style.color = '';
    }
  }

  /* ─── Stats Rendering ─── */

  function updateStreak() {
    const streak = stats.getStreak();
    els.streakCount.textContent = streak;
  }

  function renderStats() {
    // Stat cards
    const todayFocus = stats.getTotalFocusToday();
    const todayHrs = Math.floor(todayFocus / 3600);
    const todayMins = Math.floor((todayFocus % 3600) / 60);
    els.statTotalToday.textContent = todayHrs > 0 ? `${todayHrs}h ${todayMins}m` : `${todayMins}m`;

    els.statStreak.textContent = `${stats.getStreak()} days`;

    const best = stats.getBestSession();
    els.statBest.textContent = stats.formatDurationShort(best);

    const totalAll = stats.getTotalFocusAllTime();
    const allHrs = Math.floor(totalAll / 3600);
    els.statTotalAll.textContent = allHrs > 0 ? `${allHrs}h` : `${Math.floor(totalAll/60)}m`;

    // Heatmap
    renderHeatmap();

    // Achievements
    renderAchievements();

    // Recent sessions
    renderSessions();
  }

  function renderHeatmap() {
    const data = stats.getHeatmapData(12);
    els.heatmapGrid.innerHTML = '';

    data.forEach((cell, i) => {
      const div = document.createElement('div');
      div.className = `heatmap-cell level-${cell.level}`;
      div.title = `${cell.date}: ${cell.minutes} min`;
      div.style.animationDelay = `${i * 8}ms`;
      els.heatmapGrid.appendChild(div);
    });
  }

  function renderAchievements() {
    const achievements = stats.getAchievements();
    els.achievementsGrid.innerHTML = '';

    achievements.forEach(a => {
      const div = document.createElement('div');
      div.className = `achievement ${a.unlocked ? 'unlocked' : ''}`;
      div.innerHTML = `
        <span class="achievement-icon">${a.icon}</span>
        <span class="achievement-name">${a.name}</span>
        <span class="achievement-desc">${a.desc}</span>
      `;
      els.achievementsGrid.appendChild(div);
    });
  }

  function renderSessions() {
    const sessions = stats.getRecentSessions(10);

    if (sessions.length === 0) {
      els.noSessions.classList.remove('hidden');
      els.noSessions.innerHTML = `
        <span class="empty-icon">🌊</span>
        <div class="empty-motivational">
          <p class="quote">"Focus is a muscle, and you are about to start training."</p>
          <p class="quote-author">— Dive In</p>
        </div>
      `;
      return;
    }

    els.noSessions.classList.add('hidden');

    // Remove existing items (but keep no-sessions element)
    els.sessionList.querySelectorAll('.session-item').forEach(el => el.remove());

    sessions.forEach(s => {
      const div = document.createElement('div');
      div.className = 'session-item';

      const depthClass = `depth-${s.depth.toLowerCase()}`;
      const stars = s.rating > 0 ? '★'.repeat(s.rating) + '☆'.repeat(5 - s.rating) : '';
      const dateObj = new Date(s.timestamp);
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = isToday(s.date) ? 'Today' : isYesterday(s.date) ? 'Yesterday' : s.date;

      div.innerHTML = `
        <div class="session-depth-dot ${depthClass}"></div>
        <div class="session-info">
          <div class="session-intention">${s.intention || s.mode}</div>
          <div class="session-meta">
            <span>${dateStr} ${timeStr}</span>
            <span>${stats.formatDurationShort(s.duration)}</span>
          </div>
        </div>
        ${stars ? `<div class="session-rating">${stars}</div>` : ''}
      `;

      els.sessionList.appendChild(div);
    });
  }

  /* ─── Helpers ─── */

  function isToday(dateStr) {
    return dateStr === new Date().toISOString().split('T')[0];
  }

  function isYesterday(dateStr) {
    return dateStr === new Date(Date.now() - 86400000).toISOString().split('T')[0];
  }

  function sendBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'favicon.svg',
          badge: 'favicon.svg',
        });
      } catch (e) {
        // Notification constructor can fail on some mobile browsers
        console.warn('Notification failed:', e);
      }
    }
  }

  /* ─── Boot ─── */
  document.addEventListener('DOMContentLoaded', init);

})();
