# Lucid — Crystal Clear Focus

Lucid is a premium study and deep-work companion designed to help you dive deep into focus. It combines customizable timer modes, guided breathing rituals, layered ambient soundscapes, and depth-based focus tracking to create a truly immersive productivity experience.

## 🚀 Live Demo

**[lucid-focus.vercel.app](https://lucid-focus-ja0i47jcs-heisenberg-78f3.vercel.app)**

## ✨ Features

### 🧠 Focus Timer Modes
- **Deep Work** — 90-minute uninterrupted focus session
- **Pomodoro** — Classic 25/5 intervals with 4 sessions and long break
- **Flow** — Infinite stopwatch mode for when you're in the zone
- **Custom** — Set any length from 5 to 180 minutes

### 📝 Task Management
- Build a customized to-do list for your session
- Estimate the number of Pomodoros required for each task
- Tracks completed Pomodoros automatically as the timer finishes
- State is persisted securely in your browser's local storage

### ⚙️ Personalization & Auto-start
- **Custom Durations** — Tweak Pomodoro work and break times to your liking
- **Auto-start Flow** — Automatically transition from work to break and back without clicking
- **Skip Rituals** — Toggle the breathing exercise on or off based on your preference

### 🌊 Depth-Based Tracking
A dynamic circular gauge tracks your "depth" of focus as you progress through a session:
**Surface → Shallow → Mid → Deep → Abyss**
The background, particles, and color palette shift as you dive deeper — rewarding longer, unbroken sessions.

### 🎵 Ambient Sound Mixer
Six procedurally generated soundscapes using the Web Audio API (no external audio files):
| Sound | Description |
|---|---|
| 🌧️ Rain | White noise through bandpass filter with slow intensity LFO |
| 🌊 Ocean | Brown noise with wave-surge filter sweeps |
| 🔥 Fire | Brown noise bass + sparse crackle impulses |
| ☕ Café | Pink noise through voice-like bandpass with conversational modulation |
| 💨 Wind | White noise with sweeping bandpass and low-pass smoothing |
| 🎵 Tones | Detuned minor chord drone (C minor) through heavy low-pass |

Sounds can be **layered** and individually volume-controlled via the side mixer panel.

### 🧘 Breathing Rituals
A guided 4-7-8 breathing exercise plays before each session to help you center your mind:
- **Inhale** (4s) → **Hold** (7s) → **Exhale** (8s) × 3 cycles
- Can be skipped with one click

### 📊 Focus Insights
- **Daily heatmap** — GitHub-style contribution grid showing focus time per day
- **Streak tracking** — Consecutive days of focus
- **Best session** and **all-time totals**
- **9 depth achievements** — First Dive, Deep Diver, Abyss Walker, Marathon, and more
- **Session history** with intention, duration, depth, and star rating

### 🔔 Smart Notifications
- Browser notifications when a session completes (works even when the tab is backgrounded)
- Bell sound notification on timer completion

### ⌨️ Keyboard Shortcuts
| Key | Action |
|---|---|
| `Space` | Start / Pause / Resume |
| `Escape` | Stop session / Close mixer |
| `S` | Toggle sound mixer |

## 🛠️ Tech Stack

- **HTML5** — Semantic structure
- **Vanilla CSS** — Custom properties, glassmorphism, responsive design
- **Vanilla JavaScript** — ES6 classes, modular architecture
- **Canvas API** — Particle system background
- **Web Audio API** — Procedural ambient sound generation
- **LocalStorage** — Session persistence and stats

## 📁 Project Structure

```
lucid-focus/
├── index.html          # Main application shell
├── favicon.svg         # SVG favicon
├── css/
│   ├── style.css       # Design tokens, base styles, layout
│   ├── animations.css  # Keyframe animations and transitions
│   └── components.css  # Component styles, responsive breakpoints
└── js/
    ├── app.js          # Main controller, event bindings, view management
    ├── timer.js        # Timer engine (4 modes, depth calculation)
    ├── sounds.js       # Web Audio API procedural sound engine
    ├── breathing.js    # 4-7-8 breathing ritual controller
    ├── particles.js    # Canvas particle system
    ├── stats.js        # LocalStorage stats, heatmap, achievements
    ├── settings.js     # User preferences and timer duration config
    └── tasks.js        # Task manager, Pomodoro estimation tracking
```

## 💻 How to Run Locally

No build step required — just serve the static files.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/harshgupta59/lucid-focus.git
   cd lucid-focus
   ```

2. **Serve the application:**

   *Using Python 3:*
   ```bash
   python3 -m http.server 8000
   ```

   *Using Node.js:*
   ```bash
   npx serve .
   ```

3. **Open in browser:**
   Navigate to `http://localhost:8000`

> **Note:** A local server is recommended over opening `index.html` directly to avoid CORS restrictions with the Web Audio API.

## 🧠 Usage Guide

1. **Select a Mode** — Choose your timer format from the top cards
2. **Add Tasks** — Click the '+' button to add actionable tasks and estimate Pomodoros
3. **Open Ambient Sounds** — Click the music note button to layer soundscapes
4. **Begin Dive** — Press `Space` or click the button to start the breathing ritual
5. **Stay Deep** — Watch the depth gauge progress as you maintain focus
6. **Reflect** — Rate your session and add notes when the timer completes
7. **Track Progress** — Switch to Insights to view your heatmap and achievements

## 🤝 Contributing

Feel free to open issues or submit pull requests. Contributions for new ambient sounds, timer modes, themes, or visual effects are welcome.

## 📄 License

MIT