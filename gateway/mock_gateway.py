"""Phase 1 read-only mock LabVIEW gateway. NOT a production LabVIEW adapter."""
from __future__ import annotations

import argparse
import asyncio
import json
import math
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from aiohttp import WSMsgType, web

ROOT = Path(__file__).resolve().parents[1] / "web"
SIGNALS = (
    ("motor.speed", "Float64", "rpm"),
    ("motor.torque", "Float64", "Nm"),
    ("motor.power", "Float64", "kW"),
    ("motor.current", "Float64", "A"),
    ("motor.temperature", "Float64", "°C"),
    ("motor.running", "Boolean", ""),
    ("test.result", "Enum", ""),
    ("gear.actual", "Enum", ""),
    ("profile.step", "String", ""),
    ("profile.progress", "Float64", "%"),
)
SIGNAL_IDS = {s[0] for s in SIGNALS}
GEARS = ("N", "1", "2", "3", "4", "5", "6")  # DEMO ONLY: not a G1800 mapping


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def make_values(tick: int) -> dict[str, object]:
    x = tick / 10
    speed = max(0, 1480 + 320 * math.sin(x / 3))
    torque = max(0, 126 + 36 * math.sin(x / 3 + 1.2))
    return {
        "motor.speed": round(speed, 1),
        "motor.torque": round(torque, 1),
        "motor.power": round(speed * torque / 9549, 2),
        "motor.current": round(18 + 5 * math.sin(x / 4), 2),
        "motor.temperature": round(42 + x / 100 + 3 * math.sin(x / 15), 1),
        "motor.running": True,
        "test.result": "PASS" if tick % 240 < 210 else "WAIT",
        "gear.actual": GEARS[(tick // 55) % len(GEARS)],
        "profile.step": ("Ramp up", "Hold speed", "Ramp down")[(tick // 90) % 3],
        "profile.progress": round((tick % 270) / 2.7, 1),
    }


def snapshot(tick: int) -> dict:
    now = utc_now()
    values = make_values(tick)
    return {
        "type": "snapshot",
        "schema_version": 1,
        "mode": "MOCK_ONLY",
        "sequence": tick,
        "signals": [
            {
                "id": signal_id,
                "data_type": data_type,
                "unit": unit,
                "value": values[signal_id],
                "quality": "Stale" if signal_id == "motor.temperature" and 120 <= tick % 180 < 140 else "Good",
                "source_timestamp": now,
                "gateway_timestamp": now,
                "sequence": tick,
            }
            for signal_id, data_type, unit in SIGNALS
        ],
    }


def valid_local_request(request: web.Request) -> bool:
    # Prevent Host-header/DNS-rebinding access to this mock's HTTP and WebSocket endpoints.
    if request.host.split(":", 1)[0].lower() not in {"localhost", "127.0.0.1"}:
        return False
    origin = request.headers.get("Origin")
    if not origin:
        return True
    parsed = urlparse(origin)
    host = request.host.split(":", 1)[0].lower()
    return parsed.scheme == "http" and parsed.hostname == host and parsed.netloc == request.host


@web.middleware
async def local_only(request: web.Request, handler):
    if not valid_local_request(request):
        raise web.HTTPForbidden(text="Only same-origin local requests are allowed")
    result = await handler(request)
    result.headers.update({
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "X-Frame-Options": "DENY",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' ws://localhost:* ws://127.0.0.1:*; base-uri 'none'; form-action 'none'",
    })
    return result


async def homepage(_: web.Request):
    return web.FileResponse(ROOT / "index.html")


async def css(_: web.Request):
    return web.FileResponse(ROOT / "styles.css")


async def js(_: web.Request):
    return web.FileResponse(ROOT / "app.js")


async def health(_: web.Request):
    return web.json_response({"status": "ok", "mode": "MOCK_ONLY", "read_only": True})


async def signals(_: web.Request):
    return web.json_response(snapshot(0))


async def websocket(request: web.Request):
    ws = web.WebSocketResponse(heartbeat=20, max_msg_size=8192, compress=False)
    await ws.prepare(request)
    subscribed = set(SIGNAL_IDS)
    tick = 0
    await ws.send_json(snapshot(tick))

    async def telemetry():
        nonlocal tick
        while not ws.closed:
            await asyncio.sleep(0.25)
            tick += 1
            frame = snapshot(tick)
            frame["signals"] = [s for s in frame["signals"] if s["id"] in subscribed]
            await ws.send_json(frame)

    stream = asyncio.create_task(telemetry())
    try:
        async for message in ws:
            if message.type is not WSMsgType.TEXT:
                if message.type is WSMsgType.ERROR:
                    break
                await ws.send_json({"type": "error", "code": "TEXT_ONLY"})
                continue
            try:
                incoming = json.loads(message.data)
            except (json.JSONDecodeError, TypeError):
                await ws.send_json({"type": "error", "code": "INVALID_JSON"})
                continue
            if not isinstance(incoming, dict):
                await ws.send_json({"type": "error", "code": "INVALID_SCHEMA"})
                continue
            if incoming.get("type") == "subscribe":
                tags = incoming.get("tags")
                if not isinstance(tags, list) or len(tags) > 64 or any(not isinstance(t, str) or t not in SIGNAL_IDS for t in tags):
                    await ws.send_json({"type": "error", "code": "INVALID_SUBSCRIPTION"})
                    continue
                subscribed = set(tags)
                await ws.send_json({"type": "subscribed", "tags": sorted(subscribed)})
            else:
                # Never accept equipment commands, alarm acknowledgements, or writes in Phase 1.
                await ws.send_json({"type": "error", "code": "READ_ONLY"})
    finally:
        stream.cancel()
        await asyncio.gather(stream, return_exceptions=True)
    return ws


def create_app() -> web.Application:
    app = web.Application(middlewares=[local_only], client_max_size=8192)
    app.router.add_get("/", homepage)
    app.router.add_get("/styles.css", css)
    app.router.add_get("/app.js", js)
    app.router.add_get("/api/health", health)
    app.router.add_get("/api/signals", signals)
    app.router.add_get("/ws", websocket)
    return app


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Read-only LabVIEW mock gateway")
    parser.add_argument("--port", type=int, default=8766)
    args = parser.parse_args()
    web.run_app(create_app(), host="127.0.0.1", port=args.port, access_log=None)
