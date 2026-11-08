# PanelForge native Rune/TCP transport proof (no JavaScript)

**Status: protocol prototype, not a native Rune UI yet.** The receiver is an ordinary standalone Rust console application intended to feed a future native Rune application's event/state channel. **No real LabVIEW/Wind​​ows/Rune runtime verification has been performed**. All network traffic is read-only telemetry. Do not use it for control, interlocks, or production rig safety.

## Intended architecture

```text
LabVIEW (Windows)                Native Windows Rust/Rune EXE
Acquisition/Control                 TCP receiver thread
    |                                   |
QMH telemetry publisher -> TCP Write -> TcpListener 127.0.0.1:8767
                                        | 4-byte BE length + JSON payload
                                        v
                                   mpsc telemetry channel
                                        |
                                        v
                                  Rune UI state / indicators
```

TCP server listens **only on 127.0.0.1:8767**. The sender is LabVIEW client. There is **no WebView or JavaScript**. The native Rust app is a separate window; embedding it in LabVIEW's front panel isn't provided by WebView2. A browser/WebView implementation instead needs a browser-compatible transport and would not be zero-runtime-JS.

## Windows proof with simulator

1. Install Rust from https://rustup.rs (build tools required); Python 3.10+ for simulator.
2. In this folder run `cargo test` then `cargo run` (Rust receiver console).
3. In a second terminal run `python mock_labview_sender.py --count 20`.
4. Receiver should print changing speed, torque and a Boolean. Closing the simulator should log disconnection without terminating listener.
5. Python-only framing checks: `python -m unittest discover -s tests -v`.

## Exact LabVIEW publisher block diagram (no custom DLL)

1. Get LabVIEW's TCP functions under **Data Communication » Protocols » TCP**. Start receiver EXE separately for this proof, then use **TCP Open Connection** to `127.0.0.1`, port `8767` (or supervisor-launch it from LabVIEW and wait for readiness).
2. In a QMH publisher loop, read **existing measurement data** without blocking acquisition/control. Convert values to a **JSON UTF-8 string** matching the example below; increment `sequence`, capture `source_timestamp_ms` in Unix epoch milliseconds; do not fabricate real acquisition times.
3. Use **String Length** (byte count of UTF-8 payload) -> convert to **U32** -> **Flatten To String** configured big-endian, without prepending array/string sizes. Concatenate 4-byte header and JSON string, then send with **TCP Write**. Example header for a 100-byte payload is `00 00 00 64` hexadecimal.
4. Wire timeout/error handling, buffered messages and bounded update rate. On error close refnum with **TCP Close Connection**, publish disconnect quality, reconnect with backoff. Continue the rig control loop independently; UI failure must never stop a safe test.
5. On stop, close only this transport connection. Do not add any command or ACK handler in Phase 1.

### Protocol v1

| Field | Type | Description |
| --- | --- | --- |
| TCP frame header | four bytes unsigned big-endian | Length of following JSON (1..65536 bytes) |
| `type` | string | `telemetry` only |
| `schema_version` | integer | `1` |
| `source` | string | `LABVIEW` in real VI; `MOCK_LABVIEW` in simulator |
| `sequence` | unsigned integer | Increasing per connection |
| `source_timestamp_ms` | integer | Acquisition timestamp in Unix epoch milliseconds; use actual source time |
| `signals[]` | max 64 items | Typed ID, value, unit, quality |

Example:
```json
{"type":"telemetry","schema_version":1,"source":"LABVIEW","sequence":12,"source_timestamp_ms":1794100000000,"signals":[{"id":"motor.speed","data_type":"Float64","value":1450.0,"unit":"rpm","quality":"Good"},{"id":"motor.running","data_type":"Boolean","value":true,"unit":"","quality":"Good"}]}
```

For this **proof**, the gateway reception timestamp is sampled by the Rust receiver on receipt. It is not identical to LabVIEW acquisition time. This protocol uses JSON only for low-rate proof; the approved architecture's eventual high-rate numeric binary transport is a separate task.

## Verification states

- Python-only framing tests — tested when executed; **not** a LabVIEW verification.
- Rust receiver — **NOT_TESTED** on this execution machine if no Rust toolchain.
- Actual native Rune UI state connection — **NOT_IMPLEMENTED**.
- LabVIEW 2025/2026 TCP VI — **NOT_TESTED**.
- LabVIEW WebView embedded mode — **NOT_APPLICABLE** to native Rust process; web Rune alternative requires browser-side evaluation.

## Security

This is a loopback-only untrusted prototype with no authentication. Another local process could inject false telemetry; do not use a `source:"LABVIEW"` string as authentication. Do not expose port 8767 to a LAN or internet. Production requires identity/authentication, permissions, bounded queues, freshness checks, and security validation.
