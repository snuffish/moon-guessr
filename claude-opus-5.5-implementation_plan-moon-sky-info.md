<!-- artifact-owner: claude-opus-5.5 · session 1bfd081f-579d-425d-983b-393959da87ea · created 2026-10-31T03:05:00+01:00 -->

# Implementation Plan: Moon up/down + rise/set in location line

**Status:** Approved — all code done + tested; manual browser check pending
**Suffix:** `moon-sky-info`
**Inputs:** [research](docs/research/realtime-moon-data.md) · [base plan](claude-sonnet-5.5-implementation_plan-moon-guessr.md) · user choice "Coords + sky info", fully local
**Review:** READY FOR /proceed · 4 findings folded

## 1. Context & Goal

- Result screen already shows coords via `LocationInfo` (`src/components/LocationInfo.tsx`), built by research agent.
- Add, when location ok: moon up/down + altitude, next rise, next set.
- Local only: `suncalc` `getMoonPosition` / `getMoonTimes`; no network.
- Verified in `node_modules/suncalc/index.d.ts`: angles in **degrees**; `getMoonTimes(date, lat, lng, utcOffset?)` covers one day, `rise`/`set` optional, `alwaysUp`/`alwaysDown` flags.

## 2. Decisions

| Decision | Why |
| --- | --- |
| Show **next** rise/set after guess instant, not "today's" | Today's set is often already past (Stockholm today: set 13:03Z before rise 18:42Z) |
| Search today + next day (2 × `getMoonTimes`, `utcOffset` = device offset) | Covers normal latitudes; civil day matches displayed times |
| None found in window → "no moonrise/moonset in next 2 days" | Polar `alwaysUp`/`alwaysDown`; avoid "Invalid Date" |
| Up = `altitude > 0` | suncalc altitude already refraction-corrected (d.ts) |
| Times via `Intl.DateTimeFormat(undefined, { timeStyle: 'short' })`; add weekday if not today | Device locale/tz = user's location |
| Compute at round instant `at`, stored in `Round` | Same instant as %, deterministic tests |
| Logic in `src/lib/moon.ts`, rendering in `LocationInfo` | Matches existing lib/component split |
| Keep agent's OSM link (click-only) | User: yes; sends nothing unless clicked |
| Show direction: 8-point compass from `azimuth` (N, NE, …) | User: yes; helps find moon |

## 3. Proposed Changes

- [MODIFY] `src/lib/moon.ts`: add `getMoonSky(at, lat, lng)` → `{ up, altitude, direction, nextRise?, nextSet? }`
  - `direction`: `azimuth` (deg from N, clockwise) → 8-point compass
  - `nextRise`/`nextSet`: first event `> at` across day 0 and day +1
- [MODIFY] `src/App.tsx`: `Round` gets `at: Date`; set in `submit`, pass to `Result`
- [MODIFY] `src/components/Result.tsx`: forward `at` to `LocationInfo`
- [MODIFY] `src/components/LocationInfo.tsx`: on `ok`, second line e.g. "Moon is up (54°, SE) · sets 14:03 · rises 19:42"
  - Order events chronologically
- [MODIFY] `src/lib/location.ts`, `LocationInfo.tsx`, `location.test.ts`, `App.test.tsx`: convert to repo style (single quotes, no semicolons) — agent files deviate
- [MODIFY] `src/lib/moon.test.ts`, `src/App.test.tsx`: tests below
- [MODIFY] `README.md`: one line: location used locally only for up/down + rise/set

## 4. Verification Plan

- `npm test` — `getMoonSky`, Stockholm 59.33/18.07, `2026-10-31T02:00Z`:
  - `up` true, altitude ≈ 54° (±1), direction `SE` (azimuth ≈ 152°)
  - `nextSet` = 2026-10-31T13:03Z (±1 min), `nextRise` = 2026-10-31T18:42Z (±1 min)
  - both strictly after `at` (fails if "today's" times used after they pass: test with `at` = 15:00Z → set comes from next day)
- `npm test` — compass: 0→N, 44→NE, 338→N, 180→S, 359.9→N
- `npm test` — polar 78.2/15.6 around an alwaysUp/alwaysDown date (pick via `node` probe before pinning): missing events → `undefined`, no throw
- `npm test` — `App`: mocked geolocation → `/moon is (up|down)/i` shown; denied → no sky line, error message only
- `npx tsc --noEmit` and `npm run build` exit 0
- Manual: `npm run dev`, allow location, compare rise/set vs timeanddate.com for your city (±2 min)

## 5. Risks

| Risk | Mitigation |
| --- | --- |
| Pinned expected times copied from suncalc itself (circular) | Cross-check one pair vs timeanddate.com before pinning; tolerance ±1 min |
| Timezone in CI (UTC) vs local changes "today" | Tests pass explicit `utcOffset`; assert on UTC instants, not strings |
| `Intl` output differs by locale in tests | Component test matches regex, not exact time text |
| Rejected: topocentric % correction | Research: ≤0.8 pp; out of scope |
| Style conversion touches agent files | Formatting only; tests re-run |

## 6. Task Checklist

- [x] `getMoonSky` + unit tests (normal, after-set, polar, compass)
- [x] `Round.at` plumbing App → Result → LocationInfo
- [x] Sky line in `LocationInfo`
- [x] Style-align agent files
- [x] App test (ok + denied)
- [x] README line
- [x] `npm test`, `npm run build`
- [ ] Manual check vs timeanddate.com

## 7. Open Questions

None. (Answered: keep OSM link; add compass direction.)
