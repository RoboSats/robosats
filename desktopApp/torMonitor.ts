import { ChildProcessWithoutNullStreams } from 'child_process';
import { EventEmitter } from 'events';

export const BOOTSTRAP_TIMEOUT_MS = 90_000;
export const BOOTSTRAP_STALL_THRESHOLD = 30;

export type TorEvent =
  | { type: 'bootstrap'; percent: number; summary: string }
  | { type: 'connected' }
  | { type: 'protocol-error'; line: string }
  | { type: 'error-line'; line: string }
  | { type: 'exit'; code: number | null; signal: NodeJS.Signals | null }
  | { type: 'timeout'; lastPercent: number };

export interface TorMonitorOptions {
  timeoutMs?: number;
  stallThreshold?: number;
}

const BOOTSTRAP_RE = /Bootstrapped (\d+)%[^:]*:\s*(.*)/i;
const MISSING_PROTO_RE = /missing.{0,40}(?:protocol|subchannel|Desc|Microdesc)/i;
const ERROR_RE = /\[err\]/i;

export function parseTorLine(line: string): TorEvent | null {
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

export function buildFailureMessage(event: TorEvent): string {
  if (event.type === 'protocol-error') {
    return (
      'Tor cannot connect: the bundled Tor version does not meet the ' +
      'network\'s current protocol requirements.\n\n' +
      'Tor reported:\n' +
      event.line +
      '\n\nTo resolve this, download the latest RoboSats release from ' +
      'https://github.com/RoboSats/robosats/releases which includes an ' +
      'updated Tor binary.'
    );
  }
  if (event.type === 'timeout') {
    return (
      `Tor stalled at ${event.lastPercent}% and did not reach 100% within ` +
      `${Math.round(BOOTSTRAP_TIMEOUT_MS / 1000)} seconds.\n\n` +
      'If this is a network connectivity problem, verify that outgoing ' +
      'connections on TCP port 443 and 9001 are not blocked.\n\n' +
      'If Tor Browser connects on this machine, your network is fine — ' +
      'try restarting the app. If the problem persists, download the latest ' +
      'RoboSats release from https://github.com/RoboSats/robosats/releases'
    );
  }
  if (event.type === 'exit') {
    return (
      `Tor process exited unexpectedly (code ${event.code ?? 'null'}, ` +
      `signal ${event.signal ?? 'none'}).`
    );
  }
  if (event.type === 'error-line') {
    return `Tor reported an error:\n\n${event.line}`;
  }
  return 'Tor connection failed for an unknown reason.';
}

export class TorMonitor extends EventEmitter {
  private lastPercent = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private done = false;
  private readonly timeoutMs: number;

  constructor(
    private readonly tor: ChildProcessWithoutNullStreams,
    options: TorMonitorOptions = {},
  ) {
    super();
    this.timeoutMs = options.timeoutMs ?? BOOTSTRAP_TIMEOUT_MS;
    this.attach();
  }

  private attach(): void {
    let stdoutBuf = '';
    this.tor.stdout.on('data', (chunk: Buffer) => {
      stdoutBuf += chunk.toString();
      let idx: number;
      while ((idx = stdoutBuf.indexOf('\n')) !== -1) {
        const line = stdoutBuf.slice(0, idx);
        stdoutBuf = stdoutBuf.slice(idx + 1);
        this.handleLine(line);
      }
    });

    this.tor.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString().trim();
      if (text) {
        this.emit('tor-event', { type: 'error-line', line: text } as TorEvent);
      }
    });

    this.tor.on('exit', (code, signal) => {
      this.clearTimer();
      if (!this.done) {
        this.emit('tor-event', { type: 'exit', code, signal } as TorEvent);
      }
    });

    this.timer = setTimeout(() => {
      if (!this.done) {
        this.emit('tor-event', {
          type: 'timeout',
          lastPercent: this.lastPercent,
        } as TorEvent);
      }
    }, this.timeoutMs);
  }

  private handleLine(line: string): void {
    const event = parseTorLine(line);
    if (!event) return;
    if (event.type === 'bootstrap') {
      this.lastPercent = event.percent;
    }
    if (event.type === 'connected') {
      this.done = true;
      this.clearTimer();
    }
    this.emit('tor-event', event);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  stop(): void {
    this.done = true;
    this.clearTimer();
  }
}
