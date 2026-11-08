/* Public preview only: an in-memory WebSocket simulator. No network calls, hardware, or commands. */
(() => {
  'use strict';
  const metadata = Object.freeze([
    ['motor.speed', 'Float64', 'rpm'],
    ['motor.torque', 'Float64', 'Nm'],
    ['motor.power', 'Float64', 'kW'],
    ['motor.current', 'Float64', 'A'],
    ['motor.temperature', 'Float64', '°C'],
    ['motor.running', 'Boolean', ''],
    ['test.result', 'Enum', ''],
    ['gear.actual', 'Enum', ''],
    ['profile.step', 'String', ''],
    ['profile.progress', 'Float64', '%']
  ]);
  const allowed = new Set(metadata.map(([id]) => id));
  const gears = Object.freeze(['N', '1', '2', '3', '4', '5', '6']); // Fictional demo sequence, NOT G1800 map.
  function mockFrame(tick, chosen) {
    const x = tick / 10;
    const speed = Math.max(0, 1480 + 320 * Math.sin(x / 3));
    const torque = Math.max(0, 126 + 36 * Math.sin(x / 3 + 1.2));
    const values = {
      'motor.speed': Number(speed.toFixed(1)),
      'motor.torque': Number(torque.toFixed(1)),
      'motor.power': Number((speed * torque / 9549).toFixed(2)),
      'motor.current': Number((18 + 5 * Math.sin(x / 4)).toFixed(2)),
      'motor.temperature': Number((42 + x / 100 + 3 * Math.sin(x / 15)).toFixed(1)),
      'motor.running': true,
      'test.result': tick % 240 < 210 ? 'PASS' : 'WAIT',
      'gear.actual': gears[Math.floor(tick / 55) % gears.length],
      'profile.step': ['Ramp up', 'Hold speed', 'Ramp down'][Math.floor(tick / 90) % 3],
      'profile.progress': Number(((tick % 270) / 2.7).toFixed(1))
    };
    const now = new Date().toISOString();
    return {
      type: 'snapshot', schema_version: 1, mode: 'BROWSER_MOCK_ONLY', sequence: tick,
      signals: metadata.filter(([id]) => chosen.has(id)).map(([id, data_type, unit]) => ({
        id, data_type, unit, value: values[id],
        quality: id === 'motor.temperature' && tick % 180 >= 120 && tick % 180 < 140 ? 'Stale' : 'Good',
        source_timestamp: now, gateway_timestamp: now, sequence: tick
      }))
    };
  }
  class BrowserMockWebSocket extends EventTarget {
    constructor(url) {
      super();
      const u = new URL(url, location.href);
      if (u.pathname !== '/ws' || u.host !== location.host) throw new Error('Only the mock /ws endpoint exists in the public demo');
      this.readyState = 0;
      this._tick = 0;
      this._timer = null;
      this._chosen = new Set(allowed);
      setTimeout(() => {
        if (this.readyState !== 0) return;
        this.readyState = 1;
        this.dispatchEvent(new Event('open'));
        this._publish();
        this._timer = setInterval(() => this._publish(), 250);
      }, 35);
    }
    _publish() {
      if (this.readyState !== 1) return;
      this.dispatchEvent(new MessageEvent('message', {data: JSON.stringify(mockFrame(this._tick++, this._chosen))}));
    }
    send(value) {
      if (this.readyState !== 1) throw new Error('Mock socket not open');
      let incoming;
      try { incoming = JSON.parse(value); } catch { this._error('INVALID_JSON'); return; }
      if (!incoming || incoming.type !== 'subscribe') { this._error('READ_ONLY'); return; }
      if (!Array.isArray(incoming.tags) || incoming.tags.length > 64 || incoming.tags.some(tag => !allowed.has(tag))) {
        this._error('INVALID_SUBSCRIPTION'); return;
      }
      this._chosen = new Set(incoming.tags);
      this.dispatchEvent(new MessageEvent('message', {data: JSON.stringify({type: 'subscribed', tags: Array.from(this._chosen)})}));
    }
    _error(code) { this.dispatchEvent(new MessageEvent('message', {data: JSON.stringify({type: 'error', code})})); }
    close() {
      if (this.readyState >= 2) return;
      this.readyState = 3;
      clearInterval(this._timer);
      this.dispatchEvent(new Event('close'));
    }
  }
  BrowserMockWebSocket.CONNECTING = 0;
  BrowserMockWebSocket.OPEN = 1;
  BrowserMockWebSocket.CLOSING = 2;
  BrowserMockWebSocket.CLOSED = 3;
  // Replace WebSocket only in this deliberately isolated public demo build.
  window.WebSocket = BrowserMockWebSocket;
})();
