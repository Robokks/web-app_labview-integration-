# PanelForge Operator Display (Phase 1)

## Addresses

- `/` and `/index.html`: Designer. Layout editing and template selection are available here.
- `/operator.html`: dedicated operator display with **no designer menus, widget editing, keyboard delete, context-menu plugin actions or equipment-control UI**.
- `/operator.html?rig=dynamometer`, `?rig=motor`, `?rig=transmission`, `?rig=steering`, `?rig=general`: direct preset-view examples when sharing a URL.

The Designer's **Operator screen** action saves the current layout in browser-local storage and opens `/operator.html`. Operator page loads that saved layout when available. If no saved layout is available in that browser, it renders the default dynamometer example. Different browsers and devices do not share local storage or custom templates.

Browser full-screen needs a user gesture or kiosk startup (e.g. press F11 in Edge/Chrome, or configure a Windows kiosk). A webpage cannot forcibly remove the browser's toolbar without browser permission.

## Safety and scope

This is an HTML/CSS/JS **mock demonstration**, not yet the Rust Rune TCP viewer. Data is generated in the user's browser; no physical equipment is connected. No control commands or acknowledgements are exposed. The test-status labels represent simulated values.

A separate UI without editing controls is **not access control**: the public Designer route can still be visited directly. Production deployment requires authentication/authorization for design changes, a controlled layout publication process, native LabVIEW integration, and verified rig fault behavior. A browser preview is never a safety-authoritative HMI.

## Verification

Run `python -m pytest -q tests/test_operator.py` after installing Playwright Chromium. The tests use in-memory HTML because some managed test environments block browser network access to localhost. This verifies interface visibility and simulated signal updates; it does not prove a real network transport or LabVIEW device integration.
