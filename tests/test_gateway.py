"""Mock-only contract/security smoke tests. These are NOT LabVIEW integration tests."""
import json
import unittest

from aiohttp.test_utils import TestClient, TestServer

from gateway.mock_gateway import SIGNAL_IDS, create_app, snapshot


class TestGateway(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.server = TestServer(create_app())
        self.client = TestClient(self.server)
        await self.client.start_server()
        self.local = {"Host": f"127.0.0.1:{self.client.port}"}

    async def asyncTearDown(self):
        await self.client.close()

    async def test_health_and_security_headers(self):
        r = await self.client.get('/api/health', headers=self.local)
        self.assertEqual(r.status, 200)
        data = await r.json()
        self.assertTrue(data['read_only'])
        self.assertEqual(data['mode'], 'MOCK_ONLY')
        self.assertIn("'self'", r.headers['Content-Security-Policy'])
        self.assertEqual(r.headers['X-Content-Type-Options'], 'nosniff')

    async def test_snapshot_typed_quality_and_timestamps(self):
        s = snapshot(120)
        self.assertEqual(s['schema_version'], 1)
        self.assertEqual({x['id'] for x in s['signals']}, SIGNAL_IDS)
        self.assertEqual(next(x['quality'] for x in s['signals'] if x['id'] == 'motor.temperature'), 'Stale')
        for x in s['signals']:
            self.assertTrue(x['source_timestamp'])
            self.assertTrue(x['gateway_timestamp'])
            self.assertEqual(x['sequence'], 120)

    async def test_reject_cross_origin_and_dns_rebinding(self):
        r = await self.client.get('/api/health', headers={'Host': 'evil.example'})
        self.assertEqual(r.status, 403)
        r = await self.client.get('/api/health', headers={**self.local, 'Origin':'https://evil.example'})
        self.assertEqual(r.status, 403)

    async def test_no_http_write_routes(self):
        r = await self.client.post('/api/signals', headers=self.local, json={'value':3000})
        self.assertEqual(r.status, 405)
        r = await self.client.post('/api/command', headers=self.local, json={'speed':3000})
        self.assertEqual(r.status, 404)

    async def test_ws_read_only_and_subscriptions(self):
        async with self.client.ws_connect('/ws', headers={**self.local, 'Origin':f'http://127.0.0.1:{self.client.port}'}) as ws:
            first = await ws.receive_json(timeout=2)
            self.assertEqual(first['type'], 'snapshot')
            await ws.send_json({'type':'command', 'tag':'motor.speed', 'value':3000})
            rejected = await ws.receive_json(timeout=2)
            self.assertEqual(rejected['code'], 'READ_ONLY')
            await ws.send_json({'type':'subscribe', 'tags':['motor.speed']})
            confirm = await ws.receive_json(timeout=2)
            self.assertEqual(confirm['type'], 'subscribed')
            frame = await ws.receive_json(timeout=2)
            self.assertEqual([s['id'] for s in frame['signals']], ['motor.speed'])
            await ws.send_json({'type':'subscribe', 'tags':['does.not.exist']})
            self.assertEqual((await ws.receive_json(timeout=2))['code'],'INVALID_SUBSCRIPTION')
            await ws.send_str('{invalid')
            self.assertEqual((await ws.receive_json(timeout=2))['code'],'INVALID_JSON')


if __name__ == '__main__':
    unittest.main()
