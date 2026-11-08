# PanelForge — Phase 1 Test Rig Template Library

**Status:** browser-only prototype, `VERIFIED_MOCK_ONLY`. No LabVIEW VI, WebView toolkit or hardware verification.

Open the hosted demo and select **Templates** from the dashboard toolbar. The chooser offers five starting pages:

| Template | Display sections and widgets | Signal source |
| --- | --- | --- |
| Motor Test Rig | Motor RPM, torque, power, current, trends, status and test profile | Generated browser mock |
| Transmission Test Rig | Input, FA LH, RA LH/RH, PTO speed/torque, gear indicator, speed trend, result | Generated browser mock |
| Steering Gear Test Rig | Steering angle, torque, hydraulic pressure, oil flow/temperature, actuator position, readiness and trend | Generated browser mock |
| Dynamometer Test Rig | Shaft speed, torque, absorbed power, load, temperatures, test profile and trends | Generated browser mock |
| General Industrial HMI | Pressure, temperature, flow, level, trend, generic measurements and status | Generated browser mock |

All templates are structured widget layouts, **not functional equivalents** of the rigs in the user's photos. Gear positions in the demonstration do not represent validated G1800 codes. Pressing **Templates** and selecting a card asks before replacing the current editor. Existing saved browser layout remains unchanged until **Save layout** is pressed. Exporting JSON preserves the template ID, title and editable widget geometry.

The new `section` widget is informational only, with no signal binding. Equipment commands, manual switches, Start/Stop, alarm acknowledgements, safety operation and TCU mappings remain outside the Phase 1 scope. Status LEDs are read-only displays, and the simulated WebSocket explicitly rejects `command` messages.

## Test evidence

`python hosted-demo/test_templates.py` requires Python Playwright and Chromium. In the development sandbox a direct HTTP browser navigation was restricted; the test injects HTML/CSS/JavaScript into a browser document and uses an in-memory mock WebSocket and storage stub. It verifies five templates, cancel/accept, save format, mock signal availability, command rejection, mobile Add panel, 390/768/1440px overflow and JavaScript errors.

This is not a real HTTP end-to-end or LabVIEW integration test. Treat actual hosted URL and real WebView integration separately. Do not release as production HMI based on these tests.
