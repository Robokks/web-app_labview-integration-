"""Wire-framing and local transport tests; does not execute Rust nor real LabVIEW."""
import json
import socket
import struct
import threading
import unittest
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from mock_labview_sender import encode_frame, mock_telemetry

class FramingTest(unittest.TestCase):
    def test_big_endian_length(self):
        frame=encode_frame(mock_telemetry(0))
        self.assertEqual(len(frame)-4,struct.unpack(">I",frame[:4])[0])
        self.assertEqual(json.loads(frame[4:])["signals"][0]["id"],"motor.speed")
    def test_sequence_and_schema(self):
        frame=mock_telemetry(7)
        self.assertEqual(frame["sequence"],7)
        self.assertEqual(frame["schema_version"],1)
        self.assertEqual(frame["source"],"MOCK_LABVIEW")
    def test_limit(self):
        with self.assertRaises(ValueError):encode_frame({"data":"x"*65_536})
    def test_fragmentation(self):
        left,right=socket.socketpair()
        packet=encode_frame(mock_telemetry(2))
        def send_parts():
            with left:
                for chunk in [packet[:1],packet[1:3],packet[3:9],packet[9:]]: left.sendall(chunk)
        th=threading.Thread(target=send_parts)
        th.start()
        with right:
            def exact(n):
                output=b""
                while len(output)<n:
                    part=right.recv(n-len(output))
                    if not part: raise RuntimeError("unexpected EOF")
                    output+=part
                return output
            n=struct.unpack(">I",exact(4))[0]
            self.assertEqual(json.loads(exact(n))["sequence"],2)
        th.join()

if __name__ == "__main__": unittest.main()
