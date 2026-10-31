# Real-time moon illumination for the user's location

Status: complete. Researched 2026-10-31. Primary sources only. Items not checked are marked (unverified).

## 1. Does illumination depend on observer location?

**Answer: barely. Max effect is about ±0.8 percentage points; the app's local value is already accurate to ~0.001 pp of the geocentric truth.**

Code (suncalc 2.1.1, `node_modules/suncalc/package.json:3`):

- `getMoonIllumination(date)` takes **no lat/lng** (`node_modules/suncalc/index.js:430`). Uses geocentric sun and moon coordinates (`:431-433`, `moonCoords` = "geocentric apparent equatorial coordinates", `:356`). Fraction = `(1 + cos(inc)) / 2` (`:448`), with `inc` the phase angle from the Earth-centre geometry (`:435-436`).
- `getMoonPosition(date, lat, lng)` is the only location-aware moon function. It applies topocentric parallax to **altitude** only (`:412-415`) and returns azimuth/altitude/distance/parallacticAngle (`:420-426`). It does not affect the fraction.
- App: `src/lib/moon.ts:1,11-14` calls `getMoonIllumination(date)` only. No location input.

Astronomy:

- Illuminated fraction k = (1 + cos i)/2, i = Sun-Moon-observer phase angle (Meeus ch. 48, as cited in `index.js:429`).
- Moving the observer from Earth's centre to the surface shifts the line of sight by up to the lunar horizontal parallax (asin(R_earth/dist) ~ 0.9-1.0 deg; formula at `index.js:415`). So i changes by at most ~1 deg. dk = (sin i / 2) di, so the largest change is at quarter phase: 0.5 x 0.0175 rad = **~0.87 pp**; near new and full moon (sin i -> 0) it is close to 0.
- Phase/waxing (`index.js:442-443`) and named phases are defined geocentrically. They do not depend on location.

Measured with JPL Horizons (`QUANTITIES='10'` = Illu%, geocentric `CENTER='500@399'` vs topocentric `CENTER='coord@399'` + `SITE_COORD`), 2026-11-02 00:00 UT (near last quarter, worst case):

| Observer (E-lon, lat)    | Moon elevation (deg) | Illu %   |
| ------------------------ | -------------------- | -------- |
| geocentric               | n/a                  | 48.47391 |
| 0, 0                     | -3.85 (on horizon)   | 47.65150 |
| 180, 0                   | 1.90 (on horizon)    | 49.29817 |
| 90, 0                    | 70.80 (near zenith)  | 48.50700 |
| 18.07, 59.33 (Stockholm) | 22.69                | 47.88169 |
| 151.2, -33.87 (Sydney)   | 12.75                | 49.21489 |

- Spread across the globe: 1.65 pp; largest offset from geocentric: 0.82 pp. This matches the estimate above.
- At 70% (2026-10-31 00:00 UT), Stockholm: 70.354 topocentric vs 70.692 geocentric (0.34 pp).
- Local suncalc vs Horizons geocentric (`node -e` with `getMoonIllumination`): 48.47427 vs 48.47391; 70.68968 vs 70.69191; 99.24477 vs 99.24426 (11-24); 0.26696 vs 0.26663 (11-09). **Error under 0.003 pp.**
- What location really changes: whether the Moon is **above the horizon** (`getMoonPosition().altitude`, `getMoonTimes`) and the **tilt of the bright limb** (`angle - parallacticAngle`, `index.js:451-452`). Not the %.
- Clock: the real "real-time" risk is a wrong device clock. The moon's % changes by up to ~0.45 pp per hour (Horizons: 70.69 -> 70.25 from 00:00 to 01:00 UT on 10-31). The device time zone has no effect, because `Date` is UTC-based.

## 2. Browser Geolocation API

| Topic               | Fact                                                                                                                                                                                                                                                                                                          | Source                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Secure context      | "available only in secure contexts (HTTPS)". The spec does the check at runtime: a call from a non-secure context fails with `PERMISSION_DENIED`.                                                                                                                                                             | https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API ; https://www.w3.org/TR/geolocation/ (CRD, 2026-10-30) |
| GitHub Pages        | "sites ... using `github.io` domains are served over HTTPS automatically" (created after 2016-06-15). "Enforce HTTPS" is an optional redirect. On plain http:// the call fails.                                                                                                                               | https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https           |
| Prompt              | "users must grant explicit permission via a prompt when either `getCurrentPosition()` or `watchPosition()` is called (unless the permission state is already granted or denied)". The spec does not require a user gesture, but asking from a button click is better UX (unverified as a browser rule).       | MDN Geolocation_API                                                                                                     |
| Permission lifetime | "may be time based, session based, or even permanent". Query it with the Permissions API `geolocation` permission (`granted`/`denied`/`prompt`).                                                                                                                                                              | MDN Geolocation_API                                                                                                     |
| iframes             | Permissions-Policy default allowlist is `self`. A cross-origin iframe needs `allow="geolocation"`. Not relevant for a top-level Pages site.                                                                                                                                                                   | MDN Geolocation_API                                                                                                     |
| Options             | `maximumAge` default 0, `timeout` default `Infinity` (so always set a timeout), `enableHighAccuracy` default false. City-level accuracy is enough here; keep it false.                                                                                                                                        | https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition                                         |
| Failure modes       | `1 PERMISSION_DENIED`, `2 POSITION_UNAVAILABLE`, `3 TIMEOUT`. Also: no `navigator.geolocation`, an insecure context, or a Permissions-Policy block. MDN notes Wi-Fi location is often provided by Google, so it "may be unavailable in China".                                                                | https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError/code ; MDN Geolocation_API                    |
| Privacy             | "Geolocation data may reveal information that the device owner does not want to share". The spec requires "express permission" and asks browsers to show when location is being shared. If coordinates go to a third-party API, they leave the device. Rounding to about 0.1 deg (~11 km) costs nothing here. | MDN; W3C sec. 3.1/3.3                                                                                                   |

## 3. Data APIs callable from a static site

CORS checks: `curl -D -` with `Origin: https://snuffish.github.io`, run 2026-10-31. A plain `fetch(url)` GET with no custom headers is a CORS "simple request", so it sends no preflight. Only `Access-Control-Allow-Origin` on the GET response matters.

### 3a. US Naval Observatory (USNO) Astronomical Applications API

- Docs: https://aa.usno.navy.mil/data/api
- `GET https://aa.usno.navy.mil/api/rstt/oneday?date=YYYY-MM-DD&coords=LAT,LON&tz=H[&dst=bool][&ID=xxxx]`. Returns `fracillum` = "the fraction of the Moon's apparent surface which is lit", **computed "at noon in the local time zone on the date requested"**. Comes as an integer string, e.g. `"43%"`.
- `GET https://aa.usno.navy.mil/api/celnav?date=...&time=HH:MM&coords=LAT,LON` returns `moon_illum` (integer %, for a given time) and `moon_phase`.
- Location-aware? **No, for the %.** `fracillum` was `"43%"` for coords 59.33,18.07 / 0,180 / 0,0 at tz=0. Changing tz=10 gives `"48%"`, because that moves "local noon". celnav `moon_illum` was `48` at all three coords. Coords only drive rise/set/transit (`moondata`, `sundata`).
- Auth/limits/licence: no key. Optional `ID` "to keep track of how many unique users". The docs page states no rate limit or licence (unverified). US Gov work, probably public domain (unverified).
- CORS: works.
  ```
  HTTP/2 200
  content-type: application/json
  access-control-allow-origin: *
  access-control-allow-methods: GET, POST, OPTIONS
  ```
  (OPTIONS returns 405. Harmless for simple GETs.)
- Verdict: whole-percent, once-a-day or per-minute values. Coarser than local suncalc (0.1 pp in `src/lib/moon.ts:13`).

### 3b. MET Norway Sunrise 3.0 (`/moon`)

- Docs: https://api.met.no/weatherapi/sunrise/3.0/documentation
- `GET https://api.met.no/weatherapi/sunrise/3.0/moon?lat=..&lon=..&date=YYYY-MM-DD[&offset=+HH:MM]`
- Returns moonrise/moonset/high_moon/low_moon (location-aware) and `"moonphase":271.25`. **There is no illuminated fraction.** The documentation and swagger (`/weatherapi/sunrise/3.0/swagger`) do not define `moonphase`. It looks like elongation in degrees (270 = last quarter; last quarter was 2026-11-01 20:28 UT per USNO `closestphase`) (unverified).
- ToS (https://api.met.no/doc/TermsOfService): identify yourself with a User-Agent, "or" with `Origin` from JavaScript. "Browsers and mobile apps should not contact the API directly, but instead use a local proxy". Preflights are "explicitly not supported". Over 20 req/s per application needs an agreement. Cache responses. Data is CC BY 4.0 (attribution required).
- CORS: technically works.
  ```
  HTTP/2 200
  content-type: application/json
  expires: Sat, 31 Oct 2026 02:02:57 GMT
  access-control-allow-origin: *
  access-control-allow-methods: GET
  access-control-allow-headers: Origin
  ```
- Verdict: wrong data (no %). Direct browser use is discouraged by the ToS.

### 3c. NASA/JPL Horizons API

- Docs: https://ssd-api.jpl.nasa.gov/doc/horizons.html. `GET https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='301'&QUANTITIES='10'&CENTER='coord@399'&COORD_TYPE='GEODETIC'&SITE_COORD='lon,lat,alt_km'&START_TIME=..&STOP_TIME=..&STEP_SIZE=..`
- Returns `Illu%` to 5 decimals. **Location-aware (topocentric).** This is the reference used for the table in section 1. (`coord@399` worked in practice; the doc only names `'coord'`.)
- Fair Use (https://ssd-api.jpl.nasa.gov/): "You may not embed these APIs in your website (per NASA CORS policy)". One request at a time. An application-specific User-Agent is required.
- CORS: **blocked.** The GET returns `HTTP/1.1 200 OK`, `Content-Type: application/json`, and **no `Access-Control-Allow-Origin`**. OPTIONS returns `405 Method Not Allowed`.
- Verdict: the best data, but not usable from the browser. You would need a backend or proxy, which the project has none of. It is also against the policy.

## 4. Recommendation

**Keep local suncalc for the %. Don't call an API for it. Location is optional, and only worth adding for extra features.**

Why:

- Local `getMoonIllumination` already matches JPL Horizons geocentric to under 0.003 pp (section 1). It is "real time" as long as the device clock is right.
- Location changes the true topocentric % by at most ~0.8 pp. That is a scoring change of at most ~1.6 points (`src/lib/score.ts:8`: `100 - 2*|diff|`). suncalc cannot compute a topocentric fraction anyway (`index.js:430`, no lat/lng). You would need your own parallax math.
- The APIs are all worse for this. USNO is integer %, not location-aware for %, and needs network. MET has no %. Horizons is CORS-blocked and forbidden to embed.

Trade-offs:

| Option                                                        | Accuracy of %                                                    | Cost                                                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| A. Keep as is                                                 | ~0.003 pp geocentric; ±0.8 pp vs local sky                       | none, works offline                                                                                           |
| B. Add geolocation + suncalc `getMoonPosition`/`getMoonTimes` | same %                                                           | permission prompt, failure handling. Adds "is the moon up?", rise/set, limb tilt (`angle - parallacticAngle`) |
| B'. B + own topocentric parallax for %                        | ~0.01 pp vs local sky (unverified until tested against Horizons) | ~20 lines of math in `moon.ts`, tests against Horizons values                                                 |
| C. USNO API                                                   | 1 pp (integer)                                                   | network, offline failure, still device clock for `time`                                                       |

Optional hardening of "real time" (the clock): show the computed UTC instant next to the result. A server-time check would need a CORS endpoint. USNO does send `date: Sat, 31 Oct 2026 01:59:32 GMT`, but it sends no `Access-Control-Expose-Headers`. `Date` is not a CORS-safelisted response header (https://fetch.spec.whatwg.org/#cors-safelisted-response-header-name), so JS cannot read it.

Files that would change (B / B'): `src/lib/moon.ts` (accept `lat/lng`, call `getMoonPosition`/`getMoonTimes`), new `src/lib/location.ts` (geolocation wrapper, timeout, rounding), `src/App.tsx` (request location on submit or button, pass to `getMoonState`), `src/components/Result.tsx` and `src/components/MoonDisc.tsx` (moon up/down, limb tilt), `src/lib/moon.test.ts`, `src/App.test.tsx` (mock `navigator.geolocation`), `README.md` (location/privacy note).
