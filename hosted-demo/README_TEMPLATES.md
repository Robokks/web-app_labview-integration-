# PanelForge — Test Rig Template Library (Phase 1)

**Status:** mock-only UI prototype; all rig data is synthetic and **no equipment-control interfaces** are exposed. Native LabVIEW transport and validation on real rigs remain pending.

## Use the hosted designer

1. Open `https://panelforge-labview-demo.vercel.app` on a phone or PC.
2. Choose **Templates** (top toolbar on desktop, bottom navigation on mobile).
3. Browse **Motor**, **Transmission**, **Steering**, **Dynamometer** or **General** templates. Select a card to see its preview, widget names and purpose.
4. Choose **Use this template**. If your current canvas has unsaved edits, you are asked before replacing it.
5. Tap/click any widget to edit its title, read-only signal binding and geometry in **Edit / Properties**. You can still add, duplicate, reorder or delete display widgets.
6. Use **Save layout** to retain the current dashboard in this browser, or **Export JSON** for a portable design snapshot.
7. To save a reusable named custom layout: open **Templates → Save current as template**, enter a name and save. Your layout appears under **My layouts**, where it can be loaded or deleted.

## Included starter templates

| Template | Purpose | Display widgets |
| --- | --- | --- |
| Motor Test Rig | RPM, torque, power, current, motor monitoring and profile | 10 |
| Transmission Test Rig | Input/LH/RH/PTO shaft RPM/torque, trend, gear indication and test status | 12 |
| Steering Gear Rig | Actuator angle, pressure, oil flow, temperatures, trends and status | 10 |
| Dynamometer Rig | RPM, torque, power, dyno loading, efficiency and trends | 10 |
| General Purpose Rig | Read-only telemetry starter dashboard | 7 |

All indicators are bound to synthetic browser-generated signals. The demo gear gate and gear codes do not represent any verified transmission/TCU mapping. The submitted lab screenshots are UI inspirations, not protocols, rig data or specification evidence.

## Persistence and limitations

- Custom templates are stored in this browser's `localStorage`, not the cloud. They are unavailable on another device/browser until a future import/export flow is added. Browser clearing or private-mode expiration can delete them.
- A maximum of 20 custom layouts, each with at most 100 widgets, is supported in this demo. Template loading validates widget types, identifiers, title length and layout structure.
- Templates do not run LabVIEW tests, command motors, change setpoints, acknowledge alarms or connect to industrial hardware.
- Existing mobile grid and desktop free-position HMI layout modes are retained. Template previews are stylized mini layouts, not screenshots of actual rigs.
- No production ready plugin sandbox, global libraries, authentication, authorization, history backend, FFT source or real LabVIEW integration is claimed.

## Evidence

`python -m pytest -q tests/test_templates.py` uses in-memory Chromium, a localStorage shim and a deliberately adapted *test-only* mock URL guard to verify the picker, 5 template choices, loading, custom saving, editability and no horizontal overflow at 1440, 390 and 768 CSS pixels. Test evidence is **MOCK_ONLY**; it does not prove real browser-to-LabVIEW transport or equipment safety.
