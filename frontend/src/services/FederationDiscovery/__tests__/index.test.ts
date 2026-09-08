/**
 * FederationDiscovery unit tests.
 *
 * Pure voting / hash logic (Phase B) — no I/O, no React, no Lightning.
 *
 * Hash constants are computed live from SEED_DOC in beforeAll so they never
 * go stale when coordinators are added/removed from federation.json.
 *
 * Coordinator aliases are derived by sorting SEED_DOC by `established` date:
 *   ALIAS_FIRST  — oldest  (highest weight)   ALIAS_LAST — newest (lowest weight)
 *   ALIAS_THIRD  — 3rd oldest  → HASH_NO_THIRD removes it from the hash
 *   ALIAS_LAST   — newest      → HASH_NO_LAST  removes it from the hash
 */

import {
  normalizeDoc,
  canonicalHash,
  isValidDoc,
  seniorityWeight,
  trustedEstablishedDate,
  voteOnHashes,
  ONE_YEAR_MS,
  WEIGHT_MIN,
  WEIGHT_FLOOR,
  WEIGHT_MAX,
  type FederationDoc,
  type CoordVote,
} from '../index';
import SEED_DOC_IMPORT from '../../../../static/federation.json';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pin "today" for deterministic weight arithmetic. */
const NOW = new Date('2026-08-28T00:00:00Z');

function makeDoc(alias: string, extra: Record<string, unknown> = {}): FederationDoc {
  return {
    [alias]: {
      shortAlias: alias,
      nostrHexPubkey: 'aa'.repeat(32),
      established: '2023-12-02',
      federated: true,
      mainnetNodesPubkeys: [],
      testnetNodesPubkeys: [],
      mainnet: {
        onion: `http://${alias}aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.onion`,
        clearnet: null,
        i2p: null,
      },
      testnet: { onion: null, clearnet: null, i2p: null },
      ...extra,
    },
  } as unknown as FederationDoc;
}

function vote(alias: string, hash: string): CoordVote {
  return { alias, hash };
}

// ---------------------------------------------------------------------------
// SEED_DOC + derived aliases (sorted oldest → newest by established date)
// ---------------------------------------------------------------------------

const SEED_DOC: FederationDoc = SEED_DOC_IMPORT as unknown as FederationDoc;

const SORTED_ALIASES: string[] = Object.entries(SEED_DOC)
  .sort(([, a], [, b]) => {
    const ae = (a as Record<string, string>).established ?? '';
    const be = (b as Record<string, string>).established ?? '';
    return ae < be ? -1 : ae > be ? 1 : 0;
  })
  .map(([alias]) => alias);

const ALIAS_FIRST = SORTED_ALIASES[0];
const ALIAS_SECOND = SORTED_ALIASES[1];
const ALIAS_THIRD = SORTED_ALIASES[2];
const ALIAS_FOURTH = SORTED_ALIASES[3];
const ALIAS_LAST = SORTED_ALIASES[SORTED_ALIASES.length - 1];

// ---------------------------------------------------------------------------
// Live-computed hashes — populated in beforeAll
// ---------------------------------------------------------------------------

let GOLDEN_SEED_HASH = '';
let HASH_NO_THIRD = '';
let HASH_NO_LAST = '';
/** Seniority weight sum of the first four coordinators at NOW. */
let HONEST_WEIGHT = 0;

beforeAll(async () => {
  const norm = normalizeDoc(SEED_DOC);
  GOLDEN_SEED_HASH = await canonicalHash(norm);

  const omit = (key: string): Record<string, unknown> =>
    Object.fromEntries(Object.entries(norm).filter(([k]) => k !== key));

  HASH_NO_THIRD = await canonicalHash(omit(ALIAS_THIRD));
  HASH_NO_LAST = await canonicalHash(omit(ALIAS_LAST));

  const oldestDate = new Date((SEED_DOC[ALIAS_FIRST] as Record<string, string>).established);
  HONEST_WEIGHT = SORTED_ALIASES.slice(0, 4).reduce((sum, alias) => {
    const est = new Date((SEED_DOC[alias] as Record<string, string>).established);
    return sum + seniorityWeight(est, oldestDate, NOW);
  }, 0);
});

// ---------------------------------------------------------------------------
// canonicalHash
// ---------------------------------------------------------------------------
describe('canonicalHash', () => {
  it('produces a valid 64-char hex hash for the bundled federation.json', () => {
    expect(GOLDEN_SEED_HASH).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes when any identity field changes', async () => {
    const doc = makeDoc('temple');
    const changed = {
      temple: { ...(doc.temple as object), nostrHexPubkey: 'bb'.repeat(32) },
    } as unknown as FederationDoc;
    expect(await canonicalHash(normalizeDoc(doc))).not.toBe(
      await canonicalHash(normalizeDoc(changed)),
    );
  });
});

// ---------------------------------------------------------------------------
// normalizeDoc
// ---------------------------------------------------------------------------
describe('normalizeDoc — null coercion', () => {
  it('coerces explicit null net attrs to empty string', () => {
    const n = normalizeDoc(makeDoc('bazaar'));
    const entry = n['bazaar'] as Record<string, Record<string, string>>;
    expect(entry.mainnet.clearnet).toBe('');
    expect(entry.mainnet.i2p).toBe('');
    expect(entry.testnet.onion).toBe('');
  });
});

// ---------------------------------------------------------------------------
// isValidDoc
// ---------------------------------------------------------------------------
describe('isValidDoc', () => {
  it('accepts a valid document', () => {
    expect(isValidDoc(makeDoc('temple'))).toBe(true);
  });
  it('rejects null', () => {
    expect(isValidDoc(null)).toBe(false);
  });
  it('rejects empty object', () => {
    expect(isValidDoc({})).toBe(false);
  });
  it('rejects bad alias format', () => {
    expect(isValidDoc({ 'Bad-Alias': makeDoc('badalias')['badalias'] })).toBe(false);
  });
  it('rejects shortAlias mismatch', () => {
    const doc = makeDoc('temple');
    (doc.temple as Record<string, unknown>)['shortAlias'] = 'other';
    expect(isValidDoc(doc)).toBe(false);
  });
  it('rejects missing mainnet onion', () => {
    const doc = makeDoc('temple');
    (doc.temple as Record<string, unknown>)['mainnet'] = { onion: '', clearnet: '', i2p: '' };
    expect(isValidDoc(doc)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// trustedEstablishedDate
// ---------------------------------------------------------------------------
describe('trustedEstablishedDate', () => {
  it('returns seed date for a known coordinator', () => {
    const d = trustedEstablishedDate('temple', SEED_DOC, {});
    expect(d?.toISOString().slice(0, 10)).toBe('2023-12-02');
  });
  it('falls back to join-date ledger for unknown coordinator', () => {
    const d = trustedEstablishedDate('newcomer', SEED_DOC, { newcomer: '2025-06-01' });
    expect(d?.toISOString().slice(0, 10)).toBe('2025-06-01');
  });
  it('returns null for a coordinator absent from seed and ledger (sybil)', () => {
    expect(trustedEstablishedDate('sybil', SEED_DOC, {})).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// seniorityWeight — live federation at NOW
// ---------------------------------------------------------------------------
describe('seniorityWeight', () => {
  const oldest = new Date('2023-12-02');

  it('WEIGHT_MIN for null established', () => {
    expect(seniorityWeight(null, oldest, NOW)).toBe(WEIGHT_MIN);
  });
  it('WEIGHT_MIN for null oldestEstablished', () => {
    expect(seniorityWeight(oldest, null, NOW)).toBe(WEIGHT_MIN);
  });
  it('WEIGHT_MIN for future-dated coordinator', () => {
    expect(seniorityWeight(new Date('2030-01-01'), oldest, NOW)).toBe(WEIGHT_MIN);
  });
  it('WEIGHT_MAX for the oldest coordinator (temple)', () => {
    expect(seniorityWeight(oldest, oldest, NOW)).toBe(WEIGHT_MAX);
  });
  it('lake gets 9 (slightly younger than temple)', () => {
    expect(seniorityWeight(new Date('2023-12-30'), oldest, NOW)).toBe(9);
  });
  it('bazaar gets 4 (~1.3 years)', () => {
    expect(seniorityWeight(new Date('2025-05-20'), oldest, NOW)).toBe(4);
  });
  it('alice gets 2 (~0.75 years, sub-1-year ramp)', () => {
    expect(seniorityWeight(new Date('2025-11-27'), oldest, NOW)).toBe(2);
  });
  it('brand-new sybil (today) gets WEIGHT_MIN (1)', () => {
    expect(seniorityWeight(NOW, oldest, NOW)).toBe(WEIGHT_MIN);
  });
  it('first-year ramp stays in [WEIGHT_MIN, WEIGHT_FLOOR)', () => {
    const sixMonths = new Date(NOW.getTime() - ONE_YEAR_MS / 2);
    const w = seniorityWeight(sixMonths, oldest, NOW);
    expect(w).toBeGreaterThanOrEqual(WEIGHT_MIN);
    expect(w).toBeLessThan(WEIGHT_FLOOR);
  });
  it('post-1-year coordinator reaches at least WEIGHT_FLOOR', () => {
    const twoYears = new Date(NOW.getTime() - 2 * ONE_YEAR_MS);
    expect(seniorityWeight(twoYears, oldest, NOW)).toBeGreaterThanOrEqual(WEIGHT_FLOOR);
  });
});

// ---------------------------------------------------------------------------
// voteOnHashes — quorum + no-change
// ---------------------------------------------------------------------------
describe('voteOnHashes — quorum', () => {
  it('null for fewer than 2 votes', () => {
    expect(
      voteOnHashes([vote('temple', GOLDEN_SEED_HASH)], {
        trustedDoc: SEED_DOC,
        joinDates: {},
        now: NOW,
      }).winnerHash,
    ).toBeNull();
  });
  it('null for empty votes', () => {
    expect(
      voteOnHashes([], { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash,
    ).toBeNull();
  });
  it('returns seed hash when all coordinators agree on no change', () => {
    const votes = SORTED_ALIASES.map((a) => vote(a, GOLDEN_SEED_HASH));
    expect(voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash).toBe(
      GOLDEN_SEED_HASH,
    );
  });
});

// ---------------------------------------------------------------------------
// KEY DRY RUN: consensual removal of the newest coordinator (ALIAS_LAST)
// ---------------------------------------------------------------------------
// First four coordinators (by date) form the honest coalition (HONEST_WEIGHT total).
// ALIAS_LAST is the newest (weight 1).  HONEST_WEIGHT * 2 > total → strict majority.

describe('voteOnHashes — consensual removal of ALIAS_LAST', () => {
  it('removal wins when four mature coordinators agree, ALIAS_LAST dissents', () => {
    const votes = [
      vote(ALIAS_FIRST, HASH_NO_LAST),
      vote(ALIAS_SECOND, HASH_NO_LAST),
      vote(ALIAS_THIRD, HASH_NO_LAST),
      vote(ALIAS_FOURTH, HASH_NO_LAST),
      vote(ALIAS_LAST, GOLDEN_SEED_HASH), // dissents
    ];
    expect(voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash).toBe(
      HASH_NO_LAST,
    );
  });

  it('removal wins when ALIAS_LAST is offline (4 voters)', () => {
    const votes = [
      vote(ALIAS_FIRST, HASH_NO_LAST),
      vote(ALIAS_SECOND, HASH_NO_LAST),
      vote(ALIAS_THIRD, HASH_NO_LAST),
      vote(ALIAS_FOURTH, HASH_NO_LAST),
    ];
    expect(voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash).toBe(
      HASH_NO_LAST,
    );
  });

  it('two senior coordinators alone (ALIAS_FIRST + ALIAS_SECOND) can remove ALIAS_LAST', () => {
    const votes = [
      vote(ALIAS_FIRST, HASH_NO_LAST),
      vote(ALIAS_SECOND, HASH_NO_LAST),
      vote(ALIAS_LAST, GOLDEN_SEED_HASH),
    ];
    expect(voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash).toBe(
      HASH_NO_LAST,
    );
  });
});

// ---------------------------------------------------------------------------
// Tie / no majority
// ---------------------------------------------------------------------------
describe('voteOnHashes — tie → null', () => {
  it('three-way split where no hash reaches strict majority → null', () => {
    // ALIAS_FIRST votes hashA, ALIAS_SECOND votes hashB,
    // ALIAS_THIRD + ALIAS_FOURTH + ALIAS_LAST vote hashC.
    // 10 vs 9 vs (rest) — no candidate reaches >50% of total.
    const hashA = HASH_NO_LAST;
    const hashB = HASH_NO_THIRD;
    const hashC = GOLDEN_SEED_HASH;
    const votes = [
      vote(ALIAS_FIRST, hashA),
      vote(ALIAS_SECOND, hashB),
      vote(ALIAS_THIRD, hashC),
      vote(ALIAS_FOURTH, hashC),
      vote(ALIAS_LAST, hashC),
    ];
    expect(
      voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash,
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Sybil resistance
// ---------------------------------------------------------------------------
describe('voteOnHashes — sybil resistance', () => {
  it('HONEST_WEIGHT sybils cannot override 4 honest mature coordinators (tie → null)', () => {
    // Exactly HONEST_WEIGHT weight-1 sybils creates a perfect tie → null.
    const sybilVotes: CoordVote[] = Array.from({ length: HONEST_WEIGHT }, (_, i) =>
      vote(`sybil${i}`, 'a'.repeat(64)),
    );
    const votes = [
      vote(ALIAS_FIRST, HASH_NO_LAST),
      vote(ALIAS_SECOND, HASH_NO_LAST),
      vote(ALIAS_THIRD, HASH_NO_LAST),
      vote(ALIAS_FOURTH, HASH_NO_LAST),
      ...sybilVotes,
    ];
    expect(
      voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash,
    ).toBeNull();
  });

  it('sybil absent from seed and ledger has null established → gets WEIGHT_MIN', () => {
    expect(trustedEstablishedDate('evildoer', SEED_DOC, {})).toBeNull();
    expect(seniorityWeight(null, new Date('2023-12-02'), NOW)).toBe(WEIGHT_MIN);
  });
});

// ---------------------------------------------------------------------------
// Newcomer join-date ledger (trust-root protection)
// ---------------------------------------------------------------------------
describe('voteOnHashes — newcomer trust-root', () => {
  it('a newly-admitted coordinator with backdated self-reported date still gets weight 1', () => {
    const joinDates = { badcoord: '2026-08-28' };
    const d = trustedEstablishedDate('badcoord', SEED_DOC, joinDates);
    expect(d?.toISOString().slice(0, 10)).toBe('2026-08-28');
    expect(seniorityWeight(d!, new Date('2023-12-02'), NOW)).toBe(WEIGHT_MIN);
  });

  it('four mature coordinators can remove a recently-admitted badcoord (weight 1)', () => {
    const votes = [
      vote(ALIAS_FIRST, HASH_NO_LAST),
      vote(ALIAS_SECOND, HASH_NO_LAST),
      vote(ALIAS_THIRD, HASH_NO_LAST),
      vote(ALIAS_FOURTH, HASH_NO_LAST),
      vote('badcoord', GOLDEN_SEED_HASH),
    ];
    expect(
      voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: { badcoord: '2026-08-28' }, now: NOW })
        .winnerHash,
    ).toBe(HASH_NO_LAST);
  });
});

// ---------------------------------------------------------------------------
// Removal of a mid-weight coordinator (ALIAS_THIRD)
// ---------------------------------------------------------------------------
describe('voteOnHashes — removal of ALIAS_THIRD', () => {
  it('remaining coordinators can remove ALIAS_THIRD (strict majority wins)', () => {
    const votes = [
      vote(ALIAS_FIRST, HASH_NO_THIRD),
      vote(ALIAS_SECOND, HASH_NO_THIRD),
      vote(ALIAS_FOURTH, HASH_NO_THIRD),
      vote(ALIAS_LAST, HASH_NO_THIRD),
      vote(ALIAS_THIRD, GOLDEN_SEED_HASH), // dissents
    ];
    expect(voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash).toBe(
      HASH_NO_THIRD,
    );
  });
});
