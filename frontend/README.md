# Waterdrop Survivor - GitHub Pages Version

This is a static-friendly version of the Waterdrop Survivor game, adapted from the full Emergent-hosted build (which includes backend + auth + payments).

## GitHub Pages

The app is configured to run on GitHub Pages at:
https://Rebelyouthz.github.io/Emegent-waterdrop-2d/

### How to deploy (already set up)
- Push to `main` branch.
- GitHub Actions (`.github/workflows/deploy-pages.yml`) will build the frontend and deploy the `build` folder to Pages.
- In repo Settings > Pages, make sure "Source" is set to "GitHub Actions".

### Notes for static version
- No backend: saves use only localStorage.
- Demo mode: always "paid", no real login or paywall (unlimited runs).
- Leaderboard and cloud sync disabled (local only).
- Google/Emergent auth and Stripe removed for demo.

### Run locally
```bash
cd frontend
npm install
npm start
```

### Build for Pages
```bash
cd frontend
npm run build
# The `build` folder is what gets deployed.
```

## Original full version
See the root README for backend, Emergent hosting, and full features.

This static version lets you play the core 2D survivor game right in the browser on GitHub Pages.