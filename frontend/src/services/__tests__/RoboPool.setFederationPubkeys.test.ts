/**
 * Tests for setFederationPubkeys — new in the federation-consensus PR.
 *
 * After a successful federation vote the Nostr pubkey filter used by
 * RoboPool.subscribeBook and subscribeRatings is updated to include only
 * the current live coordinator set.
 */

import { setFederationPubkeys } from '../RoboPool';

describe('setFederationPubkeys', () => {
  it('is a function', () => {
    expect(typeof setFederationPubkeys).toBe('function');
  });

  it('does not throw when called with non-empty pubkey list', () => {
    expect(() => setFederationPubkeys(['aa'.repeat(32), 'bb'.repeat(32)])).not.toThrow();
  });

  it('does not throw when called with empty array (guard: no-op)', () => {
    // Guard: `if (pubkeys.length > 0)` — empty list is silently ignored.
    expect(() => setFederationPubkeys([])).not.toThrow();
  });

  it('can be called multiple times (successive vote updates)', () => {
    // Initial state: 5 coordinators
    expect(() =>
      setFederationPubkeys([
        'aa'.repeat(32), // temple
        'bb'.repeat(32), // lake
        'cc'.repeat(32), // bazaar
        'dd'.repeat(32), // freedomsats
        'ee'.repeat(32), // alice
      ]),
    ).not.toThrow();

    // After removal vote: alice removed → 4 pubkeys
    expect(() =>
      setFederationPubkeys(['aa'.repeat(32), 'bb'.repeat(32), 'cc'.repeat(32), 'dd'.repeat(32)]),
    ).not.toThrow();
  });

  it('accepts pubkeys of varying lengths (real hex pubkeys are 64 chars)', () => {
    const realLengthPubkey = 'a1b2c3d4'.repeat(8); // 64 hex chars
    expect(() => setFederationPubkeys([realLengthPubkey])).not.toThrow();
  });
});
