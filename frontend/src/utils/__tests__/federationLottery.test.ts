/**
 * Tests for federationLottery — changes in the federation-consensus PR:
 * - _votedIn guard: coordinators admitted via discovery cannot self-declare
 *   a DevFund donation to game lottery ordering.
 */

import federationLottery, { type CoordinatorSeed } from '../federationLottery';

function makeFed(
  entries: Array<{ alias: string; devfund?: number; votedIn?: boolean }>,
): Record<string, CoordinatorSeed> {
  return Object.fromEntries(
    entries.map(({ alias, devfund = 0, votedIn = false }) => [
      alias,
      {
        shortAlias: alias,
        badges: { donatesToDevFund: devfund },
        ...(votedIn ? { _votedIn: true } : {}),
      },
    ]),
  );
}

describe('federationLottery — basic contract', () => {
  it('returns all aliases', () => {
    const result = federationLottery(makeFed([{ alias: 'temple' }, { alias: 'lake' }]));
    expect(result).toEqual(expect.arrayContaining(['temple', 'lake']));
    expect(result).toHaveLength(2);
  });

  it('empty federation returns []', () => {
    expect(federationLottery({})).toEqual([]);
  });

  it('single coordinator returns its alias', () => {
    expect(federationLottery(makeFed([{ alias: 'solo' }]))).toEqual(['solo']);
  });
});

describe('federationLottery — _votedIn guard (PR change)', () => {
  it('_votedIn coordinator is still present in the output', () => {
    const fed = makeFed([
      { alias: 'honest', devfund: 20 },
      { alias: 'bad', devfund: 50, votedIn: true },
    ]);
    const result = federationLottery(fed);
    expect(result).toContain('bad');
    expect(result).toContain('honest');
  });

  it('_votedIn coordinator with claimed devfund=50 does NOT gain lottery priority', () => {
    // honest has real devfund=30, bad claims devfund=50 but _votedIn=true → forced 0.
    // honest (finite weight via chance>0) should beat bad (Infinity weight) most trials.
    const fed = makeFed([
      { alias: 'honest', devfund: 30 },
      { alias: 'bad', devfund: 50, votedIn: true },
    ]);
    let honestFirst = 0;
    for (let i = 0; i < 100; i++) {
      if (federationLottery(fed)[0] === 'honest') honestFirst++;
    }
    expect(honestFirst).toBeGreaterThan(60);
  });

  it('override is ignored for _votedIn coordinator', () => {
    const fed = makeFed([
      { alias: 'honest', devfund: 20 },
      { alias: 'bad', devfund: 0, votedIn: true },
    ]);
    // Even with a large override, bad should not win majority
    let honestFirst = 0;
    for (let i = 0; i < 100; i++) {
      if (federationLottery(fed, { bad: 50 })[0] === 'honest') honestFirst++;
    }
    expect(honestFirst).toBeGreaterThan(60);
  });

  it('_votedIn=false is equivalent to no flag', () => {
    const withFalse = { a: { shortAlias: 'a', badges: { donatesToDevFund: 20 }, _votedIn: false } };
    const withoutFlag = { a: { shortAlias: 'a', badges: { donatesToDevFund: 20 } } };
    expect(federationLottery(withFalse)).toEqual(['a']);
    expect(federationLottery(withoutFlag)).toEqual(['a']);
  });
});

describe('federationLottery — devfundOverrides for normal seed coordinators', () => {
  it('override boosts ordering for non-_votedIn coordinator', () => {
    const fed = makeFed([
      { alias: 'low', devfund: 0 },
      { alias: 'high', devfund: 0 },
    ]);
    let highFirst = 0;
    for (let i = 0; i < 200; i++) {
      if (federationLottery(fed, { high: 40 })[0] === 'high') highFirst++;
    }
    expect(highFirst).toBeGreaterThan(100);
  });
});

describe('federationLottery — default bundled federation', () => {
  it('no-arg call returns all bundled coordinator aliases', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const seed = require('../../../static/federation.json') as Record<string, unknown>;
    const result = federationLottery();
    expect(result).toHaveLength(Object.keys(seed).length);
    Object.keys(seed).forEach((alias) => expect(result).toContain(alias));
  });
});
