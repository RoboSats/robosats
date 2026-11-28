"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TorMonitor = exports.BOOTSTRAP_STALL_THRESHOLD = exports.BOOTSTRAP_TIMEOUT_MS = void 0;
exports.parseTorLine = parseTorLine;
exports.buildFailureMessage = buildFailureMessage;
const events_1 = require("events");
exports.BOOTSTRAP_TIMEOUT_MS = 90000;
exports.BOOTSTRAP_STALL_THRESHOLD = 30;
const BOOTSTRAP_RE = /Bootstrapped (\d+)%[^:]*:\s*(.*)/i;
const MISSING_PROTO_RE = /missing.{0,40}(?:protocol|subchannel|Desc|Microdesc)/i;
const ERROR_RE = /\[err\]/i;
function parseTorLine(line) {
    const bm = BOOTSTRAP_RE.exec(line);
    if (bm) {
        const percent = parseInt(bm[1], 10);
        const summary = bm[2].trim();
        if (percent === 100) {
            return { type: 'connected' };
        }
        return { type: 'bootstrap', percent, summary };
    }
    if (MISSING_PROTO_RE.test(line)) {
        return { type: 'protocol-error', line: line.trim() };
    }
    if (ERROR_RE.test(line)) {
        return { type: 'error-line', line: line.trim() };
    }
    return null;
}
function buildFailureMessage(event) {
    var _a, _b;
    if (event.type === 'protocol-error') {
        return ('Tor cannot connect: the bundled Tor version does not meet the ' +
            'network\'s current protocol requirements.\n\n' +
            'Tor reported:\n' +
            event.line +
            '\n\nTo resolve this, download the latest RoboSats release from ' +
            'https://github.com/RoboSats/robosats/releases which includes an ' +
            'updated Tor binary.');
    }
    if (event.type === 'timeout') {
        return (`Tor stalled at ${event.lastPercent}% and did not reach 100% within ` +
            `${Math.round(exports.BOOTSTRAP_TIMEOUT_MS / 1000)} seconds.\n\n` +
            'If this is a network connectivity problem, verify that outgoing ' +
            'connections on TCP port 443 and 9001 are not blocked.\n\n' +
            'If Tor Browser connects on this machine, your network is fine — ' +
            'try restarting the app. If the problem persists, download the latest ' +
            'RoboSats release from https://github.com/RoboSats/robosats/releases');
    }
    if (event.type === 'exit') {
        return (`Tor process exited unexpectedly (code ${(_a = event.code) !== null && _a !== void 0 ? _a : 'null'}, ` +
            `signal ${(_b = event.signal) !== null && _b !== void 0 ? _b : 'none'}).`);
    }
    if (event.type === 'error-line') {
        return `Tor reported an error:\n\n${event.line}`;
    }
    return 'Tor connection failed for an unknown reason.';
}
class TorMonitor extends events_1.EventEmitter {
    constructor(tor, options = {}) {
        var _a;
        super();
        this.tor = tor;
        this.lastPercent = 0;
        this.timer = null;
        this.done = false;
        this.timeoutMs = (_a = options.timeoutMs) !== null && _a !== void 0 ? _a : exports.BOOTSTRAP_TIMEOUT_MS;
        this.attach();
    }
    attach() {
        let stdoutBuf = '';
        this.tor.stdout.on('data', (chunk) => {
            stdoutBuf += chunk.toString();
            let idx;
            while ((idx = stdoutBuf.indexOf('\n')) !== -1) {
                const line = stdoutBuf.slice(0, idx);
                stdoutBuf = stdoutBuf.slice(idx + 1);
                this.handleLine(line);
            }
        });
        this.tor.stderr.on('data', (chunk) => {
            const text = chunk.toString().trim();
            if (text) {
                this.emit('tor-event', { type: 'error-line', line: text });
            }
        });
        this.tor.on('exit', (code, signal) => {
            this.clearTimer();
            if (!this.done) {
                this.emit('tor-event', { type: 'exit', code, signal });
            }
        });
        this.timer = setTimeout(() => {
            if (!this.done) {
                this.emit('tor-event', {
                    type: 'timeout',
                    lastPercent: this.lastPercent,
                });
            }
        }, this.timeoutMs);
    }
    handleLine(line) {
        const event = parseTorLine(line);
        if (!event)
            return;
        if (event.type === 'bootstrap') {
            this.lastPercent = event.percent;
        }
        if (event.type === 'connected') {
            this.done = true;
            this.clearTimer();
        }
        this.emit('tor-event', event);
    }
    clearTimer() {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    stop() {
        this.done = true;
        this.clearTimer();
    }
}
exports.TorMonitor = TorMonitor;
//# sourceMappingURL=torMonitor.js.map