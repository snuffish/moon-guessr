# Moon Guessr

Guess how full (0–100 %) the moon is right now. Moon data is computed in the browser with [suncalc](https://github.com/mourner/suncalc) from your device clock.

After a guess the site asks for your location (optional) to show whether the moon is up, its direction and next rise/set. Rounded coordinates (~1 km) are sent once to [OpenStreetMap Nominatim](https://nominatim.org/) to show your city name (cached in the browser); nothing else leaves the browser.

```sh
npm install
npm run dev      # local dev server
npm test         # unit + component tests
npm run build    # type-check + production build to dist/
```

## Deploy (GitHub Pages)

Not deployed yet. To deploy:

1. Create the GitHub repo, `git init`, add the remote, push `main`.
2. Repo Settings → Pages → Source: **GitHub Actions**.
3. `.github/workflows/deploy.yml` runs tests, builds and publishes on every push to `main` (or run it manually via *Actions → Run workflow*).

`vite.config.ts` uses `base: './'`, so the site works under `/<repo>/` without config.
