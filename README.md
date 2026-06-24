**Waterdrop Survivor**

2D survivor game built with React Canvas + FastAPI backend.

---

## Play on GitHub Pages (static demo – easiest)

**Live:** https://Rebelyouthz.github.io/Emegent-waterdrop-2d/

Fully playable right now. No install needed.

---

## Clone & Run Everything (Local + Pages)

### 1. Clone

```powershell
git clone https://github.com/Rebelyouthz/Emegent-waterdrop-2d.git
cd Emegent-waterdrop-2d/frontend
```

### 2. Run Locally (Windows – easiest)

Double-click **`frontend/Start-Waterdrop.bat`**

Or manually:

```powershell
cd frontend
npm install
npm start
```

Game runs instantly in demo mode (unlimited, offline, all features).

### 3. Deploy to GitHub Pages

Already configured.

- Push to `main` (or manually trigger the "Deploy to GitHub Pages" workflow)
- Make sure **Settings → Pages → Source** = GitHub Actions

See the **detailed guide** in [frontend/README.md](./frontend/README.md) for:
- Full step-by-step (clone → local → preview build → deploy)
- Windows/PowerShell commands
- Troubleshooting (Node, git, npm, audio, etc.)
- How to add a real backend later
- One-time setup for reproducible installs (package-lock.json)

---

## Full Version (with backend)

The complete experience (cloud saves, Google login via Emergent, Stripe payments, real leaderboard) is what runs on the Emergent server.

`backend/` contains the FastAPI + Mongo code (not needed for the Pages demo).

---

## Project Layout

```
Emegent-waterdrop-2d/
├── frontend/          # The game (this is what you want for local/Pages)
│   ├── Start-Waterdrop.bat
│   └── ...
├── backend/           # Full version only
├── .github/workflows/deploy-pages.yml
└── README.md
```

Open [frontend/README.md](./frontend/README.md) for the complete "how to clone + set up + publish" instructions.
