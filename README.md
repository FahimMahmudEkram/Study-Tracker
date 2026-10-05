# 📚 Study Tracker

> A polished, offline-first study timer and productivity dashboard for students.

**Study Tracker** helps you record focused study time, run accurate Pomodoro sessions, set goals, understand your habits, and keep a visual study streak — with all data stored locally in your browser.

## 🚀 Live demo

Deploy this repository with **GitHub Pages** and open the published site from an HTTPS URL. The app can then be installed as a PWA and its service worker can cache the app shell for offline use.

## ✨ Features

- ⏱️ **Accurate timer** — timestamp-based timing stays correct when browser tabs are throttled or temporarily inactive.
- 🍅 **Pomodoro mode** — separate focus/break phases, pause/resume support, automatic completed-session logging, and break notifications.
- 🎯 **Study goals** — daily, weekly, and monthly targets with live progress.
- 📊 **Better analytics** — 7/30/90-day or all-time views, study-time charts, subject breakdowns, weekday patterns, best day, average session, and days studied.
- 🗓️ **Study heatmap** — a 53-week activity calendar showing your study consistency at a glance.
- 🏆 **Achievements** — built-in milestones plus custom achievements.
- 💾 **JSON export/import** — create portable backups and restore them later.
- 📱 **Mobile redesign** — responsive navigation, controls, charts, and cards for small screens.
- 📲 **PWA installation** — install Study Tracker as a standalone app on supported browsers.
- 🌐 **Offline caching** — the service worker caches the local app shell for offline launches after the first HTTPS visit.
- 🌙 **Dark mode** — saved locally with the rest of your preferences.

## 🛠️ Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- Local Storage
- Service Worker / Web App Manifest

## 📁 Project structure

```text
study-tracker/
├── index.html
├── study-tracker.css
├── study-tracker.js
├── manifest.json
├── service-worker.js
├── favicon.svg
├── icon-192.png
├── icon-512.png
└── README.md
```

## ▶️ Run locally

For the basic web app, you can open `index.html` directly in a browser.

For **PWA installation and service-worker offline caching**, serve the folder over HTTP(S). GitHub Pages is the easiest deployment option.

Example with Python:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## 💾 Your data

Study sessions, goals, achievements, subjects, theme, and timer state are stored in your browser's local storage. Use **Settings → Export JSON** to create a backup before clearing browser data or changing devices.

## 🔐 Privacy

There is no required account, server database, or external analytics service. Your study data stays in the browser unless you choose to export the JSON backup yourself.

## 🗺️ Roadmap ideas

- Calendar day/session drill-down
- More detailed weekly reports
- Optional cloud sync
- Keyboard shortcuts
- More achievement types

## 🙋 Author

**Fahim Mahmud**  
📧 fahimmahmudekram@gmail.com  
🔗 [LinkedIn](https://www.linkedin.com/in/fahim--mahmud/)  
🌍 GitHub: [@FahimMahmudEkram](https://github.com/FahimMahmudEkram)

## 📄 License

This project is open source under the MIT License.
