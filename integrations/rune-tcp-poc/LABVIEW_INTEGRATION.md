# PanelForge native Rune ↔ LabVIEW TCP starter (Phase 1, read-only)

## Status and architectural boundary

This is **native Rust/TCP**, with **no JavaScript, WebSocket, browser or Python runtime**. A completed Rune UI is **not** included: the native Rust reader is ready to feed a Rune view via a bounded channel. No real LabVIEW 2025/2026 or WebView tests have been executed. Use this as an **independent Windows Rune application**, not an embedded LabVIEW front-panel control.

`LabVIEW (TCP server and source of truth) → 127.0.0.1:8767 → native Rust client → Rune UI (next step)`

## Protocol v0.1

Each frame is a **4-byte big-endian unsigned payload length** followed by **exactly that many UTF-8 JSON bytes**, maximum 65,536 bytes (no NUL terminator). Connection is stream-oriented; do not assume every TCP Read/Write maps to a complete message. Types and fields:

```json
{"type":"snapshot","schema_version":1,"mode":"MOCK_ONLY","sequence":42,"signals":[{"id":"motor.speed","data_type":"Float64","unit":"rpm","value":1460.2,"quality":"Good","source_timestamp_ms":1794111000000,"gateway_timestamp_ms":1794111000001}]}
```

**Real LabVIEW publisher** must emit `mode: "LABVIEW_REAL"` only when actual LabVIEW supplies the data. Use source-acquisition and gateway/transport times independently; the mock intentionally uses equal times. Do not rely on a fake or guessed TCU/G1800 gear map. Validation includes schema version, sequence, data types, allowed tags and qualities, timestamps and bounds. Never treat a malformed frame as trusted data. A future parser and binary numeric block contract must be reviewed before production.

## LabVIEW side (publisher/server) — block-diagram build guide

1. Create `PF_TCP_Publisher.vi`, separate from acquisition and control loops. Its input is **read-only signal snapshots** from the existing measurement/tag bus.
2. Add `TCP Create Listener` (port **8767**, bind to `127.0.0.1` / loopback only as supported by the chosen LabVIEW environment). Use `TCP Wait on Listener` to accept a connection. Use **connection ID** (not listener ID) for subsequent `TCP Write` and close.
3. In a telemetry publishing loop, build one JSON UTF-8 text record with the typed tag fields above. Use LabVIEW JSON functions. For the initial proof, publish a `motor.speed` numeric value every 250 ms; do not drive acquisition timing with the UI update loop.
4. Compute **payload length in bytes** (after UTF-8 encoding), validate 1–65536, explicitly encode a U32 into **four network-order (big-endian) bytes** without a hidden type/array length prefix. Concatenate `U32 length header` + `JSON payload`.
5. Call `TCP Write` with the entire concatenated binary-safe LabVIEW string. On any disconnect, close only that connection, wait for another client, and keep control/test loops independent.
6. On shutdown, close the accepted connection and listener cleanly. Set bounded timeouts and handle listener ownership and repeated starts.
7. Phase 1 remains one-way: **no command, setpoint, start/stop, acknowledgment or equipment-write receiver**. The TCP reader in this starter never sends application messages.

NI references:
- https://www.ni.com/docs/en-US/bundle/labview-api-ref/page/functions/tcp-read.html
- https://www.ni.com/docs/en-US/bundle/labview-api-ref/page/functions/tcp-wait-on-listener.html
- https://www.ni.com/en/support/documentation/supplemental/06/basic-tcp-ip-communication-in-labview.html

## Rust-only mock and client (Windows PowerShell)

Install Rust via rustup, then from this directory:

Terminal A:
```powershell
cargo run --bin panel-tcp-mock
```

Terminal B:
```powershell
cargo run --bin panel-tcp-client
```

Expected console: `Connected` and a continuous stream of `"type":"snapshot"` JSON with the mock-only mode. Then run:
```powershell
cargo test
```

For **real LabVIEW**, stop mock (`Ctrl+C`), run `PF_TCP_Publisher.vi` on the **same PC** and then run `cargo run --bin panel-tcp-client` again. For a different host, use `panel-tcp-client 192.0.2.10:8767` only with an explicitly secured network design; this starter has **no encryption or authentication** and must not be exposed beyond localhost.

## Rune hookup (to be implemented separately)

The native client currently prints telemetry. Replace printing with strict JSON decoding to typed telemetry, send messages from a dedicated TCP reader worker through a bounded channel to the UI, and update Rune state on its UI thread / supported event mechanism. Do not call blocking TCP I/O from a Rune rendering callback. A native Rune app uses its own window; direct embedding inside a LabVIEW front panel is not verified or supported by this proof.

## Testing / security

- `cargo test` tests framing, multiple messages, zero/oversize and truncated frames.
- Manual mock streaming test: Rust mock server and client on loopback.
- Real LabVIEW CP-06: **NOT_TESTED** until verified with LabVIEW 2025/2026.
- No TCP access control or TLS beyond loopback, no user plugin isolation, no performance benchmark. **NOT production-ready.**
