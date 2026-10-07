import { describe, it, expect, vi } from 'vitest';

// Test implementation of the warmup algorithm mirroring client logic
async function simulateWarmup({ mockFetch, maxWaitMs = 10000, initialDelay = 50 }) {
  const startTime = Date.now();
  let delay = initialDelay;
  let attempt = 1;
  const statusEvents = [];

  const onStatusChange = (evt) => {
    statusEvents.push(evt);
  };

  while (Date.now() - startTime < maxWaitMs) {
    try {
      if (attempt > 1) {
        onStatusChange({
          status: 'waking',
          message: 'Waking up the server... Please hold on while the free instance boots.',
          attempt,
          elapsedSeconds: Math.round((Date.now() - startTime) / 1000)
        });
      }

      const res = await mockFetch();
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.ok) {
          onStatusChange({ status: 'ready', app: data.app, version: data.version });
          return { ok: true, app: data.app, attempts: attempt, statusEvents };
        }
      }
    } catch (e) {
      // transient failure while booting
    }

    attempt++;
    if (Date.now() - startTime + delay >= maxWaitMs) break;
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.5, 500); // scaled down for rapid unit test
  }

  onStatusChange({ status: 'timeout', message: 'Server wake up timed out.' });
  return { ok: false, error: 'Warmup timeout', attempts: attempt, statusEvents };
}

describe('Server Cold-Start Warm-up & Retry Backoff Engine', () => {
  it('succeeds immediately when server is already awake', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, app: 'Khabo Kothay?', version: '1.1.0' })
    });

    const result = await simulateWarmup({ mockFetch });
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(1);
    expect(result.app).toBe('Khabo Kothay?');
    expect(result.statusEvents).toEqual([
      { status: 'ready', app: 'Khabo Kothay?', version: '1.1.0' }
    ]);
  });

  it('handles sleeping server with retry backoff and displays waking message before succeeding', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        // First 2 calls fail (e.g. Render HTTP 503 or ECONNREFUSED)
        throw new Error('Service Unavailable - 503');
      }
      return {
        ok: true,
        json: async () => ({ ok: true, app: 'Khabo Kothay?', version: '1.1.0', commit: 'abc1234' })
      };
    });

    const result = await simulateWarmup({ mockFetch, initialDelay: 20 });
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(3);
    expect(result.app).toBe('Khabo Kothay?');

    // Verified that waking message was dispatched
    const wakingEvent = result.statusEvents.find((e) => e.status === 'waking');
    expect(wakingEvent).toBeDefined();
    expect(wakingEvent.message).toContain('Waking up the server');
    expect(result.statusEvents[result.statusEvents.length - 1].status).toBe('ready');
  });

  it('gracefully times out if server fails to respond within maxWaitMs window', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const result = await simulateWarmup({ mockFetch, maxWaitMs: 150, initialDelay: 30 });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Warmup timeout');
    expect(result.statusEvents.some((e) => e.status === 'timeout')).toBe(true);
  });
});
