<!-- artifact-owner: claude-sonnet-5.5 · session 1bfd081f-579d-425d-983b-393959da87ea · created 2026-10-31T02:50:00+01:00 -->

# Implementation Plan: Moon Guessr

**Status:** Approved — phases 1–4 done; deploy intentionally not run; moon disc not visually checked
**Suffix:** `moon-guessr`
**Inputs:** `plan.md`
**Review:** READY FOR /proceed · 4 findings folded

## 1. Context & Goal

- Greenfield dir, no git, empty except `plan.md`.
- Site: user guesses current moon illumination (0–100 %), sees actual + error.
- Stack: React. Host: GitHub Pages (static only).
- Moon value computed client-side from `Date.now()`; no backend/API.

## 2. Decisions

| Decision | Why |
| --- | --- |
| Vite + React + TS | Static build, fast, standard for Pages |
| `suncalc` `getMoonIllumination().fraction` ×100 | Tiny, offline, no API key/CORS; fraction = illuminated % |
| Slider 0–100 + number input, Submit | Easy on mobile; exact entry on desktop |
| Hide moon visual until reveal | Showing it makes guess trivial |
| Reveal: actual %, abs error, score, moon SVG | Feedback loop |
| Score = `max(0, 100 − 2·err)`; round-play state in-memory | Simple; no storage v1 |
| "Play again" re-samples `Date.now()` | Moon barely moves in minutes; fine, noted |
| Best score in `localStorage` | Cheap replay hook; guard against unavailable storage |
| Vitest + Testing Library | Vite-native |
| Deploy: GitHub Actions → `actions/deploy-pages` | No `gh-pages` branch |
| Vite `base: './'` | Works under `/<repo>/` without hardcoding repo name |
| Plain CSS, no UI lib | Small scope |

## 3. Proposed Changes

Phase 1 — scaffold
- [NEW] `package.json`, `vite.config.ts` (`base: './'`), `tsconfig*.json`, `index.html`, `.gitignore`
- Deps: `react`, `react-dom`, `suncalc`, `@types/suncalc`; dev: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `jsdom`, `@testing-library/react`

Phase 2 — logic
- [NEW] `src/lib/moon.ts` — `getMoonIllumination(date): number` (0–100, 1 decimal); `getMoonPhase(date)` (phase 0–1 + waxing flag for drawing)
- [NEW] `src/lib/score.ts` — `scoreGuess(guess, actual)`, error clamp, input validation (NaN, <0, >100)

Phase 3 — UI
- [NEW] `src/main.tsx`, `src/App.tsx` — states: `guessing` → `revealed`
- [NEW] `src/components/GuessForm.tsx` — slider + number input synced, clamp 0–100, labelled, keyboard operable
- [NEW] `src/components/Result.tsx` — actual %, error, score, best, Play again
- [NEW] `src/components/MoonDisc.tsx` — SVG disc with terminator from phase (reveal only)
- [NEW] `src/styles.css` — dark theme, responsive

Phase 4 — deploy
- [NEW] `.github/workflows/deploy.yml` — on push `main`: `npm ci`, test, build, upload `dist`, `deploy-pages`; perms `pages: write`, `id-token: write`
- [NEW] `README.md` — run/test/deploy, enable Pages source = "GitHub Actions"

## 4. Verification Plan

- `npm test` — `moon.ts`: known full moon (2026-10-26 ≈ ~100 %), known new moon (≈ 0 %) within ±2 %; result ∈ [0,100]
- `npm test` — `score.ts`: exact = 100, err ≥ 50 = 0, invalid input rejected
- `npm test` — `App`: submit shows result; guess clamped; Play again resets
- `npm run build` exits 0; `npm run preview` serves under a sub-path (`--base /moon-guessr/`) with assets loading (no 404s)
- Manual: guess in browser, compare actual vs an independent source (e.g. timeanddate.com) within ~2 %
- Manual: mobile viewport, keyboard-only flow
- After push: Actions run green, Pages URL loads

## 5. Risks

| Risk | Mitigation |
| --- | --- |
| Asset 404 on Pages sub-path | `base: './'` + preview-under-subpath check |
| Pages not enabled → deploy fails | README step; Source = GitHub Actions |
| `suncalc` accuracy | Fraction accurate to ~1 %; test vs reference dates; accepted |
| Test dates wrong | Verify reference values against independent source before pinning |
| `localStorage` blocked (private mode) | try/catch, degrade silently |
| Device clock wrong → wrong "now" | Accept; note in README |
| Not a git repo | Phase 4 needs `git init` + remote; user does it (no commits by me) |

## 6. Task Checklist

- [x] P1 scaffold + install
- [x] P2 `moon.ts`, `score.ts` + tests
- [x] P3 UI components + App test
- [x] P4 workflow + README
- [x] Build, relative asset paths
- [ ] Manual check vs reference site

## 7. Open Questions

1. Repo name / `git init` + remote? **Rec:** you create `moon-guessr` on GitHub; I make no commits.
2. Show moon image during guessing? **Rec:** no, reveal only (skill is guessing from the real sky).
3. Language of UI? **Rec:** English (matches `plan.md`).
4. Include score + best-score persistence? **Rec:** yes, as listed; drop if you want bare minimum.
