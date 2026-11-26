import {
  MAX_ROUTING_ATTEMPTS,
  formatRetryCountdown,
  getRoutingFailureKind,
  getRoutingRetryProgress,
  routingFailureReport,
} from '../routingFailure';

describe('getRoutingRetryProgress', () => {
  it('reports the failed attempt out of the total while the coordinator retries', () => {
    expect(getRoutingRetryProgress(1)).toEqual({ attempt: 1, total: MAX_ROUTING_ATTEMPTS });
    expect(getRoutingRetryProgress(2)).toEqual({ attempt: 2, total: MAX_ROUTING_ATTEMPTS });
  });

  it('returns null when no retry is pending', () => {
    expect(getRoutingRetryProgress(0)).toBeNull();
    expect(getRoutingRetryProgress(MAX_ROUTING_ATTEMPTS)).toBeNull();
    expect(getRoutingRetryProgress(-1)).toBeNull();
    expect(getRoutingRetryProgress(1.5)).toBeNull();
    expect(getRoutingRetryProgress(undefined)).toBeNull();
    expect(getRoutingRetryProgress(null)).toBeNull();
  });
});

describe('getRoutingFailureKind', () => {
  it.each([
    ['There are more routes to try, but the payment timeout was exceeded.', 'route'],
    [
      'All possible routes were tried and failed permanently. Or there were no routes to the destination at all.',
      'route',
    ],
    [
      'All possible routes were tried and failed permanently. Or were no routes to the destination at all.',
      'route',
    ],
    [
      'Payment details are incorrect (unknown hash, invalid amount or invalid final CLTV delta).',
      'invoice',
    ],
    ["Insufficient unlocked balance in RoboSats' node.", 'coordinator'],
    ['A non-recoverable error has occurred.', 'coordinator'],
    ["Payment isn't failed (yet)", 'unknown'],
    ['', 'unknown'],
  ])('maps %p to %p', (reason, kind) => {
    expect(getRoutingFailureKind(reason)).toBe(kind);
  });

  it('treats a missing reason as unknown', () => {
    expect(getRoutingFailureKind(undefined)).toBe('unknown');
    expect(getRoutingFailureKind(null)).toBe('unknown');
  });
});

describe('formatRetryCountdown', () => {
  it('shows minutes and seconds when the next attempt is less than an hour away', () => {
    expect(formatRetryCountdown({ days: 0, hours: 0, minutes: 0, seconds: 42 })).toBe('00m 42s');
    expect(formatRetryCountdown({ days: 0, hours: 0, minutes: 9, seconds: 5 })).toBe('09m 05s');
  });

  it('adds the hours, counting whole days, when the next attempt is further away', () => {
    expect(formatRetryCountdown({ days: 0, hours: 1, minutes: 0, seconds: 30 })).toBe(
      '01h 00m 30s',
    );
    expect(formatRetryCountdown({ days: 1, hours: 2, minutes: 3, seconds: 4 })).toBe('26h 03m 04s');
  });
});

describe('routingFailureReport', () => {
  it('includes the order id, the coordinator and the failure reason', () => {
    expect(
      routingFailureReport({
        id: 93,
        shortAlias: 'temple',
        failure_reason: 'A non-recoverable error has occurred.',
      }),
    ).toBe(
      'RoboSats order 93 (coordinator: temple)\nLightning payout failed: A non-recoverable error has occurred.',
    );
  });

  it('says so when the coordinator did not report a reason', () => {
    expect(routingFailureReport({ id: 7, shortAlias: 'alice', failure_reason: '' })).toBe(
      'RoboSats order 7 (coordinator: alice)\nLightning payout failed: no failure reason reported',
    );
  });
});
