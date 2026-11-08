"""MOCK ONLY — produces LabVIEW-shaped, read-only TCP telemetry."""
from __future__ import annotations
import argparse
import json
import math
import socket
import struct
import time

MAX_FRAME = 65_536

def encode_frame(value: dict) -> bytes:
    payload = json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    if not 0 < len(payload) <= MAX_FRAME:
        raise ValueError("packet too large or empty")
    return struct.pack(">I", len(payload)) + payload

def mock_telemetry(seq: int) -> dict:
    return {"type": "telemetry", "schema_version": 1, "source": "MOCK_LABVIEW",
            "sequence": seq, "source_timestamp_ms": int(time.time() * 1000),
            "signals": [
                {"id": "motor.speed", "data_type": "Float64", "value": round(1480 + 100 * math.sin(seq / 10), 2), "unit": "rpm", "quality": "Good"},
                {"id": "motor.torque", "data_type": "Float64", "value": 127.5, "unit": "Nm", "quality": "Good"},
                {"id": "motor.running", "data_type": "Boolean", "value": True, "unit": "", "quality": "Good"},
            ]}

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=20)
    parser.add_argument("--rate", type=float, default=5)
    args = parser.parse_args()
    if not 1 <= args.count <= 5000 or not 0.1 <= args.rate <= 50:
        parser.error("count 1..5000, rate 0.1..50 required")
    with socket.create_connection(("127.0.0.1", 8767), timeout=3) as s:
        for seq in range(args.count):
            s.sendall(encode_frame(mock_telemetry(seq)))
            time.sleep(1 / args.rate)
    print(f"MOCK ONLY: sent {args.count} read-only frames")

if __name__ == "__main__":
    main()
