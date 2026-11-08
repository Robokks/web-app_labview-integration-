# Light industrial UI redesign — 2026-11-08

## Change scope
- White industrial dashboard canvas, panels and signal cards with clear blue header, bright accents and light grid.
- Default light theme; dark appearance still available via top-bar control on desktop and More menu on mobile.
- More compact phone widget cards, preserving large waveform/trend cards and bottom navigation.
- Chart colors adapted for light/dark appearance.
- No new hardware commands, no LabVIEW communication changes. Synthetic mock browser data only.

## Test evidence
- JavaScript syntax: `node --check app.js`; `node --check theme-switch.js` passed.
- Playwright Chromium local in-memory checks at 1536x950, 390x844, 768x1024: 8 simulated widgets, connected mock state, zero page exceptions, no horizontal body overflow.
- Mobile: Add, Edit, theme toggle light/dark/light and 9 widgets after adding one passed.
- Direct localhost page navigation is blocked by administrator policy in this test environment. The same limitation applies to the previous milestone. Host deployment readiness must be verified separately.

## Not yet verified
- Actual LabVIEW integration; physical hardware; native WebView hosting; real vibration signal acquisition and FFT; comprehensive mobile-device accessibility evaluation.