/* ═══════════════════════════════════════════
   Lucid — Task Manager
   Handles creating, editing, deleting, and 
   tracking Pomodoro estimates for tasks.
   ═══════════════════════════════════════════ */

class TaskManager {
  constructor() {
    this.STORAGE_KEY = 'lucid_tasks';
    this.tasks = this._load();
    this.activeTaskId = this.tasks.length > 0 ? this.tasks[0].id : null;
    this.listeners = [];
  }

  /* ─── API ─── */

  addTask(title, estimatedPomodoros = 1) {
    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      estimatedPomodoros: Math.max(1, parseInt(estimatedPomodoros) || 1),
      completedPomodoros: 0,
      completed: false,
      createdAt: Date.now()
    };
    
    this.tasks.push(newTask);
    if (!this.activeTaskId) {
      this.activeTaskId = newTask.id;
    }
    
    this._save();
    this._notify();
    return newTask;
  }

  editTask(id, updates) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      if (updates.title !== undefined) task.title = updates.title.trim();
      if (updates.estimatedPomodoros !== undefined) task.estimatedPomodoros = Math.max(1, parseInt(updates.estimatedPomodoros) || 1);
      
      this._save();
      this._notify();
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.activeTaskId === id) {
      this.activeTaskId = this.tasks.length > 0 ? this.tasks[0].id : null;
    }
    this._save();
    this._notify();
  }

  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this._save();
      this._notify();
    }
  }

  incrementPomodoroCount(id = this.activeTaskId) {
    if (!id) return;
    const task = this.tasks.find(t => t.id === id);
    if (task && !task.completed) {
      task.completedPomodoros++;
      this._save();
      this._notify();
    }
  }

  setActiveTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      this.activeTaskId = id;
      this._save();
      this._notify();
    }
  }

  getActiveTask() {
    return this.tasks.find(t => t.id === this.activeTaskId) || null;
  }

  getAllTasks() {
    return [...this.tasks];
  }

  clearCompleted() {
    this.tasks = this.tasks.filter(t => !t.completed);
    if (!this.tasks.find(t => t.id === this.activeTaskId)) {
      this.activeTaskId = this.tasks.length > 0 ? this.tasks[0].id : null;
    }
    this._save();
    this._notify();
  }

  onChange(callback) {
    this.listeners.push(callback);
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
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasks));
    } catch (e) {
      console.warn('TaskManager: Failed to save to localStorage', e);
    }
  }

  _notify() {
    this.listeners.forEach(cb => cb(this.tasks));
  }
}

window.TaskManager = TaskManager;
