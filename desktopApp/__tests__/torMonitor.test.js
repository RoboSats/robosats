"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const events_1 = require("events");
const torMonitor_1 = require("../torMonitor");
(0, node_test_1.describe)('parseTorLine', () => {
    (0, node_test_1.it)('returns null for a plain log line', () => {
        strict_1.default.equal((0, torMonitor_1.parseTorLine)('Nov 03 17:00:00.000 [notice] Tor 0.4.9.15 running'), null);
    });
    (0, node_test_1.it)('parses a mid-progress bootstrap line', () => {
        const ev = (0, torMonitor_1.parseTorLine)('Nov 03 17:00:05.000 [notice] Bootstrapped 25% (conn): Connecting to a relay');
        strict_1.default.deepEqual(ev, { type: 'bootstrap', percent: 25, summary: 'Connecting to a relay' });
    });
    (0, node_test_1.it)('returns connected event at 100%', () => {
        const ev = (0, torMonitor_1.parseTorLine)('Nov 03 17:00:30.000 [notice] Bootstrapped 100% (done): Done');
        strict_1.default.deepEqual(ev, { type: 'connected' });
    });
    (0, node_test_1.it)('detects a missing-protocol error line (Desc)', () => {
        const line = '[warn] Missing links for descriptor download: missing protocol Desc=3';
        const ev = (0, torMonitor_1.parseTorLine)(line);
        strict_1.default.ok(ev);
        strict_1.default.equal(ev.type, 'protocol-error');
        strict_1.default.equal(ev.line, line);
    });
    (0, node_test_1.it)('detects a Microdesc missing-protocol error line', () => {
        const line = '[warn] missing Microdesc protocol subversion';
        const ev = (0, torMonitor_1.parseTorLine)(line);
        strict_1.default.ok(ev);
        strict_1.default.equal(ev.type, 'protocol-error');
    });
    (0, node_test_1.it)('detects an [err] line', () => {
        const line = "[err] Couldn't open persistent state file";
        const ev = (0, torMonitor_1.parseTorLine)(line);
        strict_1.default.ok(ev);
        strict_1.default.equal(ev.type, 'error-line');
        strict_1.default.equal(ev.line, line);
    });
});
(0, node_test_1.describe)('buildFailureMessage', () => {
    (0, node_test_1.it)('mentions protocol requirements for protocol-error', () => {
        const msg = (0, torMonitor_1.buildFailureMessage)({ type: 'protocol-error', line: 'missing Desc=3' });
        strict_1.default.match(msg, /protocol/i);
        strict_1.default.match(msg, /robosats\/releases/);
    });
    (0, node_test_1.it)('includes percent for timeout', () => {
        const msg = (0, torMonitor_1.buildFailureMessage)({ type: 'timeout', lastPercent: 30 });
        strict_1.default.match(msg, /30%/);
        strict_1.default.match(msg, /robosats\/releases/);
    });
    (0, node_test_1.it)('includes code for exit', () => {
        const msg = (0, torMonitor_1.buildFailureMessage)({ type: 'exit', code: 1, signal: null });
        strict_1.default.match(msg, /code 1/);
    });
    (0, node_test_1.it)('returns non-empty for connected (fallback branch)', () => {
        const msg = (0, torMonitor_1.buildFailureMessage)({ type: 'connected' });
        strict_1.default.ok(msg.length > 0);
    });
});
function makeFakeTor() {
    const stdout = new events_1.EventEmitter();
    const stderr = new events_1.EventEmitter();
    stdout.push = (s) => stdout.emit('data', Buffer.from(s));
    stderr.push = (s) => stderr.emit('data', Buffer.from(s));
    const proc = new events_1.EventEmitter();
    proc.stdout = stdout;
    proc.stderr = stderr;
    proc.exit = (code) => proc.emit('exit', code, null);
    return proc;
}
(0, node_test_1.describe)('TorMonitor events', () => {
    (0, node_test_1.it)('emits bootstrap events from stdout', (t, done) => {
        const proc = makeFakeTor();
        const mon = new torMonitor_1.TorMonitor(proc, { timeoutMs: 5000 });
        mon.on('tor-event', (ev) => {
            if (ev.type === 'bootstrap') {
                strict_1.default.equal(ev.percent, 25);
                mon.stop();
                done();
            }
        });
        proc.stdout.push('Bootstrapped 25% (conn): Connecting to a relay\n');
    });
    (0, node_test_1.it)('emits connected when bootstrap reaches 100%', (t, done) => {
        const proc = makeFakeTor();
        const mon = new torMonitor_1.TorMonitor(proc, { timeoutMs: 5000 });
        mon.on('tor-event', (ev) => {
            if (ev.type === 'connected') {
                mon.stop();
                done();
            }
        });
        proc.stdout.push('Bootstrapped 100% (done): Done\n');
    });
    (0, node_test_1.it)('emits protocol-error from a missing-protocol line', (t, done) => {
        const proc = makeFakeTor();
        const mon = new torMonitor_1.TorMonitor(proc, { timeoutMs: 5000 });
        mon.on('tor-event', (ev) => {
            if (ev.type === 'protocol-error') {
                strict_1.default.match(ev.line, /missing.*Desc/i);
                mon.stop();
                done();
            }
        });
        proc.stdout.push('[warn] missing descriptor Desc=3\n');
    });
    (0, node_test_1.it)('emits exit event when the process exits before bootstrap', (t, done) => {
        const proc = makeFakeTor();
        const mon = new torMonitor_1.TorMonitor(proc, { timeoutMs: 5000 });
        mon.on('tor-event', (ev) => {
            if (ev.type === 'exit') {
                strict_1.default.equal(ev.code, 1);
                mon.stop();
                done();
            }
        });
        proc.exit(1);
    });
    (0, node_test_1.it)('emits timeout when bootstrap stalls', (t, done) => {
        const proc = makeFakeTor();
        const mon = new torMonitor_1.TorMonitor(proc, { timeoutMs: 50 });
        proc.stdout.push('Bootstrapped 30% (conn): Connecting\n');
        mon.on('tor-event', (ev) => {
            if (ev.type === 'timeout') {
                strict_1.default.equal(ev.lastPercent, 30);
                mon.stop();
                done();
            }
        });
    });
    (0, node_test_1.it)('does not emit timeout after stop()', (t, done) => {
        const proc = makeFakeTor();
        const mon = new torMonitor_1.TorMonitor(proc, { timeoutMs: 50 });
        mon.stop();
        mon.on('tor-event', (ev) => {
            if (ev.type === 'timeout')
                strict_1.default.fail('timeout emitted after stop()');
        });
        setTimeout(done, 120);
    });
    (0, node_test_1.it)('does not emit exit after connected', (t, done) => {
        const proc = makeFakeTor();
        const mon = new torMonitor_1.TorMonitor(proc, { timeoutMs: 5000 });
        let sawConnected = false;
        mon.on('tor-event', (ev) => {
            if (ev.type === 'connected')
                sawConnected = true;
            if (ev.type === 'exit')
                strict_1.default.fail('exit emitted after connected');
        });
        proc.stdout.push('Bootstrapped 100% (done): Done\n');
        proc.exit(0);
        setTimeout(() => { strict_1.default.ok(sawConnected); mon.stop(); done(); }, 50);
    });
    (0, node_test_1.it)('handles multi-line chunks split across data events', (t, done) => {
        const proc = makeFakeTor();
        const mon = new torMonitor_1.TorMonitor(proc, { timeoutMs: 5000 });
        const percents = [];
        mon.on('tor-event', (ev) => {
            if (ev.type === 'bootstrap')
                percents.push(ev.percent);
            if (percents.length === 2) {
                strict_1.default.deepEqual(percents, [10, 50]);
                mon.stop();
                done();
            }
        });
        proc.stdout.push('Bootstrapped 10% (conn): Starting\nBootstr');
        proc.stdout.push('apped 50% (loading): Loading\n');
    });
});
//# sourceMappingURL=torMonitor.test.js.map