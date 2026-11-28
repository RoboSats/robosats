import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'events';
import {
  parseTorLine,
  buildFailureMessage,
  TorMonitor,
  TorEvent,
} from '../torMonitor';

describe('parseTorLine', () => {
  it('returns null for a plain log line', () => {
    assert.equal(parseTorLine('Nov 03 17:00:00.000 [notice] Tor 0.4.9.15 running'), null);
  });

  it('parses a mid-progress bootstrap line', () => {
    const ev = parseTorLine(
      'Nov 03 17:00:05.000 [notice] Bootstrapped 25% (conn): Connecting to a relay',
    );
    assert.deepEqual(ev, { type: 'bootstrap', percent: 25, summary: 'Connecting to a relay' });
  });

  it('returns connected event at 100%', () => {
    const ev = parseTorLine(
      'Nov 03 17:00:30.000 [notice] Bootstrapped 100% (done): Done',
    );
    assert.deepEqual(ev, { type: 'connected' });
  });

  it('detects a missing-protocol error line (Desc)', () => {
    const line = '[warn] Missing links for descriptor download: missing protocol Desc=3';
    const ev = parseTorLine(line);
    assert.ok(ev);
    assert.equal(ev!.type, 'protocol-error');
    assert.equal((ev as Extract<TorEvent, { type: 'protocol-error' }>).line, line);
  });

  it('detects a Microdesc missing-protocol error line', () => {
    const line = '[warn] missing Microdesc protocol subversion';
    const ev = parseTorLine(line);
    assert.ok(ev);
    assert.equal(ev!.type, 'protocol-error');
  });

  it('detects an [err] line', () => {
    const line = "[err] Couldn't open persistent state file";
    const ev = parseTorLine(line);
    assert.ok(ev);
    assert.equal(ev!.type, 'error-line');
    assert.equal((ev as Extract<TorEvent, { type: 'error-line' }>).line, line);
  });
});

describe('buildFailureMessage', () => {
  it('mentions protocol requirements for protocol-error', () => {
    const msg = buildFailureMessage({ type: 'protocol-error', line: 'missing Desc=3' });
    assert.match(msg, /protocol/i);
    assert.match(msg, /robosats\/releases/);
  });

  it('includes percent for timeout', () => {
    const msg = buildFailureMessage({ type: 'timeout', lastPercent: 30 });
    assert.match(msg, /30%/);
    assert.match(msg, /robosats\/releases/);
  });

  it('includes code for exit', () => {
    const msg = buildFailureMessage({ type: 'exit', code: 1, signal: null });
    assert.match(msg, /code 1/);
  });

  it('returns non-empty for connected (fallback branch)', () => {
    const msg = buildFailureMessage({ type: 'connected' });
    assert.ok(msg.length > 0);
  });
});

function makeFakeTor() {
  const stdout = new EventEmitter() as NodeJS.EventEmitter & { push: (s: string) => void };
  const stderr = new EventEmitter() as NodeJS.EventEmitter & { push: (s: string) => void };
  stdout.push = (s: string) => stdout.emit('data', Buffer.from(s));
  stderr.push = (s: string) => stderr.emit('data', Buffer.from(s));
  const proc = new EventEmitter() as any;
  proc.stdout = stdout;
  proc.stderr = stderr;
  proc.exit = (code: number) => proc.emit('exit', code, null);
  return proc;
}

describe('TorMonitor events', () => {
  it('emits bootstrap events from stdout', (t, done) => {
    const proc = makeFakeTor();
    const mon = new TorMonitor(proc, { timeoutMs: 5000 });
    mon.on('tor-event', (ev: TorEvent) => {
      if (ev.type === 'bootstrap') {
        assert.equal(ev.percent, 25);
        mon.stop();
        done();
      }
    });
    proc.stdout.push('Bootstrapped 25% (conn): Connecting to a relay\n');
  });

  it('emits connected when bootstrap reaches 100%', (t, done) => {
    const proc = makeFakeTor();
    const mon = new TorMonitor(proc, { timeoutMs: 5000 });
    mon.on('tor-event', (ev: TorEvent) => {
      if (ev.type === 'connected') { mon.stop(); done(); }
    });
    proc.stdout.push('Bootstrapped 100% (done): Done\n');
  });

  it('emits protocol-error from a missing-protocol line', (t, done) => {
    const proc = makeFakeTor();
    const mon = new TorMonitor(proc, { timeoutMs: 5000 });
    mon.on('tor-event', (ev: TorEvent) => {
      if (ev.type === 'protocol-error') {
        assert.match(ev.line, /missing.*Desc/i);
        mon.stop();
        done();
      }
    });
    proc.stdout.push('[warn] missing descriptor Desc=3\n');
  });

  it('emits exit event when the process exits before bootstrap', (t, done) => {
    const proc = makeFakeTor();
    const mon = new TorMonitor(proc, { timeoutMs: 5000 });
    mon.on('tor-event', (ev: TorEvent) => {
      if (ev.type === 'exit') { assert.equal(ev.code, 1); mon.stop(); done(); }
    });
    proc.exit(1);
  });

  it('emits timeout when bootstrap stalls', (t, done) => {
    const proc = makeFakeTor();
    const mon = new TorMonitor(proc, { timeoutMs: 50 });
    proc.stdout.push('Bootstrapped 30% (conn): Connecting\n');
    mon.on('tor-event', (ev: TorEvent) => {
      if (ev.type === 'timeout') { assert.equal(ev.lastPercent, 30); mon.stop(); done(); }
    });
  });

  it('does not emit timeout after stop()', (t, done) => {
    const proc = makeFakeTor();
    const mon = new TorMonitor(proc, { timeoutMs: 50 });
    mon.stop();
    mon.on('tor-event', (ev: TorEvent) => {
      if (ev.type === 'timeout') assert.fail('timeout emitted after stop()');
    });
    setTimeout(done, 120);
  });

  it('does not emit exit after connected', (t, done) => {
    const proc = makeFakeTor();
    const mon = new TorMonitor(proc, { timeoutMs: 5000 });
    let sawConnected = false;
    mon.on('tor-event', (ev: TorEvent) => {
      if (ev.type === 'connected') sawConnected = true;
      if (ev.type === 'exit') assert.fail('exit emitted after connected');
    });
    proc.stdout.push('Bootstrapped 100% (done): Done\n');
    proc.exit(0);
    setTimeout(() => { assert.ok(sawConnected); mon.stop(); done(); }, 50);
  });

  it('handles multi-line chunks split across data events', (t, done) => {
    const proc = makeFakeTor();
    const mon = new TorMonitor(proc, { timeoutMs: 5000 });
    const percents: number[] = [];
    mon.on('tor-event', (ev: TorEvent) => {
      if (ev.type === 'bootstrap') percents.push(ev.percent);
      if (percents.length === 2) {
        assert.deepEqual(percents, [10, 50]);
        mon.stop();
        done();
      }
    });
    proc.stdout.push('Bootstrapped 10% (conn): Starting\nBootstr');
    proc.stdout.push('apped 50% (loading): Loading\n');
  });
});
