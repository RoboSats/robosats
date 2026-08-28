/**
 * FederationDiscovery unit tests.
 *
 * Pure voting / hash logic (Phase B) — no I/O, no React, no Lightning.
 * Cross-stack golden hash must match api/tests/test_federation.py::GOLDEN_SEED_HASH.
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
// Cross-stack golden constants  (must match api/tests/test_federation.py)
// ---------------------------------------------------------------------------
const GOLDEN_SEED_HASH = 'd1d5c8c215074b9d163a691082a5fa3f41f82f83bb72760ed7c028960c3caad3';
const HASH_NO_ALICE = '72b90d9cc43ece3cc28376cd3f0838a6a8219df34abde865f9a394b79efe70ce';
const HASH_NO_FREEDOMSATS = '71e1fc7d349c8fb9c24bf1dd550321a5e1076272d9a43c70776316fa710f34d6';

const SEED_DOC: FederationDoc = SEED_DOC_IMPORT as unknown as FederationDoc;

// ---------------------------------------------------------------------------
// canonicalHash
// ---------------------------------------------------------------------------
describe('canonicalHash', () => {
  it('matches the golden seed hash for the bundled federation.json', async () => {
    const hash = await canonicalHash(normalizeDoc(SEED_DOC));
    expect(hash).toBe(GOLDEN_SEED_HASH);
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
  it('returns seed hash when all five coordinators agree on no change', () => {
    const votes = ['temple', 'lake', 'bazaar', 'freedomsats', 'alice'].map((a) =>
      vote(a, GOLDEN_SEED_HASH),
    );
    expect(voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash).toBe(
      GOLDEN_SEED_HASH,
    );
  });
});

// ---------------------------------------------------------------------------
// KEY DRY RUN: consensual removal of young malicious coordinator (alice)
// ---------------------------------------------------------------------------
// Weights at 2026-08-28: temple=10, lake=9, bazaar=4, freedomsats=4, alice=2  total=29
// Removal coalition = 27.  27*2=54 > 29 → strict majority wins.

describe('voteOnHashes — consensual removal of alice (weight 2)', () => {
  const aliceVotes = [
    vote('temple', HASH_NO_ALICE),
    vote('lake', HASH_NO_ALICE),
    vote('bazaar', HASH_NO_ALICE),
    vote('freedomsats', HASH_NO_ALICE),
    vote('alice', GOLDEN_SEED_HASH), // dissents
  ];

  it('removal wins when four mature coordinators agree, alice dissents', () => {
    expect(
      voteOnHashes(aliceVotes, { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash,
    ).toBe(HASH_NO_ALICE);
  });

  it('removal wins when alice is offline (4 voters, 27/27)', () => {
    const votes = aliceVotes.slice(0, 4);
    expect(voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash).toBe(
      HASH_NO_ALICE,
    );
  });

  it('two senior coordinators alone (temple+lake=19/21) can remove alice', () => {
    const votes = [
      vote('temple', HASH_NO_ALICE),
      vote('lake', HASH_NO_ALICE),
      vote('alice', GOLDEN_SEED_HASH),
    ];
    expect(voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash).toBe(
      HASH_NO_ALICE,
    );
  });
});

// ---------------------------------------------------------------------------
// Tie / no majority
// ---------------------------------------------------------------------------
describe('voteOnHashes — tie → null', () => {
  it('three-way split where no hash reaches strict majority → null', () => {
    // temple(10) for hashA, lake(9) for hashB, bazaar+freedomsats+alice(10) for hashC
    // total=29; max candidate weight = 10, 9, 10  — 10*2=20 NOT > 29
    const hashA = HASH_NO_ALICE;
    const hashB = HASH_NO_FREEDOMSATS;
    const hashC = GOLDEN_SEED_HASH;
    const votes = [
      vote('temple', hashA), // 10
      vote('lake', hashB), // 9
      vote('bazaar', hashC), // 4
      vote('freedomsats', hashC), // 4
      vote('alice', hashC), // 2
    ];
    // hashC weight = 4+4+2 = 10, total = 29. 10*2=20 NOT > 29 → no winner
    expect(
      voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash,
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Sybil resistance
// ---------------------------------------------------------------------------
describe('voteOnHashes — sybil resistance', () => {
  it('27 weight-1 sybils cannot override 4 honest mature coordinators (tie → null)', () => {
    // honest=27, sybils=27, total=54, tie
    const sybilVotes: CoordVote[] = Array.from({ length: 27 }, (_, i) =>
      vote(`sybil${i}`, 'a'.repeat(64)),
    );
    const votes = [
      vote('temple', HASH_NO_ALICE),
      vote('lake', HASH_NO_ALICE),
      vote('bazaar', HASH_NO_ALICE),
      vote('freedomsats', HASH_NO_ALICE),
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
      vote('temple', HASH_NO_ALICE),
      vote('lake', HASH_NO_ALICE),
      vote('bazaar', HASH_NO_ALICE),
      vote('freedomsats', HASH_NO_ALICE),
      vote('badcoord', GOLDEN_SEED_HASH),
    ];
    expect(
      voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: { badcoord: '2026-08-28' }, now: NOW })
        .winnerHash,
    ).toBe(HASH_NO_ALICE);
  });
});

// ---------------------------------------------------------------------------
// Removal of a mid-weight coordinator (freedomsats)
// ---------------------------------------------------------------------------
describe('voteOnHashes — removal of freedomsats (weight 4)', () => {
  it('remaining four coordinators can remove freedomsats (25/29 → wins)', () => {
    const votes = [
      vote('temple', HASH_NO_FREEDOMSATS),
      vote('lake', HASH_NO_FREEDOMSATS),
      vote('bazaar', HASH_NO_FREEDOMSATS),
      vote('alice', HASH_NO_FREEDOMSATS),
      vote('freedomsats', GOLDEN_SEED_HASH),
    ];
    // 10+9+4+2=25; 25*2=50>29 → wins
    expect(voteOnHashes(votes, { trustedDoc: SEED_DOC, joinDates: {}, now: NOW }).winnerHash).toBe(
      HASH_NO_FREEDOMSATS,
    );
  });
});
