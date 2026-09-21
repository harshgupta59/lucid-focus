# Lucid — Crystal Clear Focus

Lucid is a premium study and deep-work companion designed to help you dive deep into focus. It combines customizable timer modes, breathing rituals, ambient sounds, and depth-based focus tracking to create a truly immersive productivity experience.

## 🚀 Live Demo

**[View the Live App Here](https://lucid-focus-ja0i47jcs-heisenberg-78f3.vercel.app)**
*(Dashboard Link: [Vercel Deployment](https://vercel.com/heisenberg-78f3/lucid-focus/F9FzuLqsjh6JbX4J17poCcZPGbPg))*

## ✨ Features

- **Timer Engine & Modes**: Choose from various focus modes including Deep Work (90 min), Pomodoro (25/5), Flow (infinite), and Custom lengths.
- **Depth-Based Tracking**: A dynamic gauge visually represents your "depth" of focus, rewarding longer sessions.
- **Ambient Soundscape**: An integrated procedural sound engine plays ambient audio to drown out distractions.
- **Breathing Rituals**: Built-in breathing exercises help you center yourself before diving into deep work.
- **Insights & Heatmaps**: Local storage-based statistics manager tracks your focus time, streaks, and generates activity heatmaps over time.
- **Visual Relaxation**: Beautiful, smooth CSS/Canvas-based particle backgrounds and animations.
- **Intention Setting**: State exactly what you are focusing on for each session.

## 🛠️ Tech Stack

- Vanilla HTML, CSS, JavaScript
- HTML5 Canvas for Particle Effects
- Web Audio API / HTML5 Audio for Procedural Sound
- LocalStorage for Data Persistence

## 💻 How to Run Locally

If you'd like to run or develop Lucid locally, no complex build steps are required.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/harshgupta59/lucid-focus.git
   cd lucid-focus
   ```

2. **Serve the application:**
   Since it uses standard web technologies, you can simply open `index.html` in your browser. However, to ensure all local storage, audio files, and scripts load correctly without CORS restrictions, it is recommended to run a local web server:

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

## 🧠 Usage Guide

1. **Select a Mode**: Choose Pomodoro for structured breaks, Deep Work for extended sessions, or Flow for an untimed state.
2. **Set an Intention**: Type out exactly what you want to achieve (e.g., "Write blog post" or "Fix auth bug").
3. **Begin Dive**: Press `Space` or click "Begin Dive". The timer will start, and the background will transition to deep focus mode.
4. **Use Breathing / Sounds**: Toggle ambient sounds or take a moment to use the breathing exercises if you feel distracted.
5. **Review Insights**: After a few sessions, check the **Insights** tab to view your daily heatmaps and focus streaks!

## 🤝 Contributing
Feel free to open issues or submit pull requests. Any contributions to add new ambient sounds, new timer modes, or better visual effects are highly appreciated.