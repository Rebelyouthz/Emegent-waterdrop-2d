**Waterdrop Survivor – Frontend (2D Canvas Survivor Game)**

This is the **static / GitHub Pages ready** version of the game.

- Fully playable in any modern browser
- Uses only localStorage (no backend needed)
- Always unlocked ("Demo Mode") – unlimited runs, all features
- Same codebase works for `npm start` (local) **and** GitHub Pages deployment

Live demo: https://Rebelyouthz.github.io/Emegent-waterdrop-2d/

---

## 1. Clone the Repository (do this once)

```powershell
# In PowerShell / Terminal
cd ~\Documents          # or wherever you want the project

git clone https://github.com/Rebelyouthz/Emegent-waterdrop-2d.git
cd Emegent-waterdrop-2d/frontend
```

> **Windows tip**: You can also use GitHub Desktop or just double-click the .bat after cloning.

---

## 2. Run Locally (Development – Recommended first step)

### Easiest on Windows (double-click)

After cloning:

1. Go into the `frontend` folder
2. Double-click **`Start-Waterdrop.bat`**

It will:
- Check for Node.js
- Run `npm install`
- Start the game

Browser opens automatically at http://localhost:3000

### Manual way (any OS)

```powershell
cd Emegent-waterdrop-2d/frontend

# First time (or after pulling changes)
npm install

# Run the game (demo mode – fully playable offline)
npm start
```

- Game runs with **demo mode** automatically (no login, no paywall, all content unlocked).
- All progress saved in your browser's localStorage.
- Close the terminal to stop.

---

## 3. Preview a Production Build Locally

This is exactly what GitHub Pages will serve:

```powershell
cd Emegent-waterdrop-2d/frontend

npm run build          # creates the `build` folder
npm run preview        # or: npx serve -s build -l 3000
```

Open http://localhost:3000

> Note: On a production build served locally you will still be in demo mode because there is no backend URL.

---

## 4. Deploy to GitHub Pages (Automatic)

Everything is already wired up.

### One-time repo settings

1. Go to your repo → **Settings → Pages**
2. Under "Build and deployment" → **Source** → choose **GitHub Actions**

### How it works

- Push anything to the `main` branch (or use **Actions** tab → "Deploy to GitHub Pages" → Run workflow)
- GitHub Actions runs `.github/workflows/deploy-pages.yml`
- It does `cd frontend && npm install && npm run build`
- The `build/` folder is deployed automatically

Your game will be live at:
https://Rebelyouthz.github.io/Emegent-waterdrop-2d/

(Usually ready in 1–3 minutes after push.)

### Manual trigger (no code change needed)

Repo → Actions → "Deploy to GitHub Pages" → Run workflow

---

## 5. After First `npm install` (Recommended)

```powershell
# Commit the lockfile so future clones and CI are reproducible
cd Emegent-waterdrop-2d/frontend
git add package-lock.json
git commit -m "Add package-lock.json for reproducible installs"
git push
```

Future clones will use `npm ci` (faster + exact) automatically.

---

## 6. Troubleshooting

### "git: command not found"
Install Git: https://git-scm.com/download/win

### "node: command not found" or npm errors
Install Node.js LTS: https://nodejs.org/

After installing, **restart PowerShell / Terminal**.

### npm install fails / weird errors
```powershell
# In the frontend folder
rm -r -force node_modules, package-lock.json   # PowerShell
npm install
```

### Game doesn't start / black screen
- Make sure you're in the `frontend` folder when running commands
- Try `npm install` again
- Check browser console (F12) for errors
- The large menu-music.mp3 is included and should load

### Audio doesn't play
- First click or keypress anywhere in the page (browser autoplay policy)
- The game starts music on first interaction

### Want the full version with backend, login, Stripe, cloud saves?

The original version lives on the Emergent server (uses FastAPI + Mongo).
This frontend folder can also connect to a real backend if you set:

```env
# .env (or .env.development)
REACT_APP_BACKEND_URL=https://your-backend.example.com
```

Then `IS_DEMO` logic will be disabled.

---

## 7. Project Structure (quick)

```
Emegent-waterdrop-2d/
├── frontend/
│   ├── public/               # static assets (menu-music.mp3 lives here)
│   ├── src/
│   │   ├── game/             # core engine (engine.js), audio, data
│   │   ├── components/       # all UI (menus, HUD, camp, etc.)
│   │   ├── App.js, auth.js, store.js
│   │   └── ...
│   ├── Start-Waterdrop.bat   # Windows one-click starter
│   ├── package.json
│   └── .env.production       # empty → forces demo mode on Pages
├── .github/workflows/deploy-pages.yml
├── backend/                  # (only for full Emergent version)
└── README.md
```

---

## Key Technical Notes

- **Homepage** in package.json → correct asset URLs for sub-directory deployment
- **Demo mode** (`IS_DEMO`) is automatic when no `REACT_APP_BACKEND_URL`
- Saves → localStorage only on this version
- Build output → `frontend/build/`
- GitHub Actions uploads exactly the build folder contents

Everything you need to run locally or publish to Pages is here.
