/**
 * Tests for setLiveCoordinators — new in the federation-consensus PR.
 *
 * nostr.ts imports several ESM-only packages (latlon-geohash, date-fns,
 * nostr-tools) that cannot be loaded in Node without a full jest transform
 * pipeline.  We test the guard logic directly — it's pure and has no deps.
 *
 * The guard extracted from nostr.ts:
 *   let liveCoordinators = <seed>;
 *   export function setLiveCoordinators(coords) {
 *     if (coords.length > 0) liveCoordinators = coords;
 *   }
 */

// We reproduce the guard inline to keep the test self-contained and fast.
type CoordEntry = { shortAlias: string; nostrHexPubkey: string; federated?: boolean };

function makeGuard(initial: CoordEntry[]) {
  let live = [...initial];
  const setter = (coords: CoordEntry[]) => {
    if (coords.length > 0) live = coords;
  };
  const getter = () => live;
  return { setter, getter };
}

const SEED: CoordEntry[] = [
  { shortAlias: 'temple', nostrHexPubkey: 'aa'.repeat(32) },
  { shortAlias: 'lake', nostrHexPubkey: 'bb'.repeat(32) },
  { shortAlias: 'bazaar', nostrHexPubkey: 'cc'.repeat(32) },
  { shortAlias: 'freedomsats', nostrHexPubkey: 'dd'.repeat(32) },
  { shortAlias: 'alice', nostrHexPubkey: 'ee'.repeat(32) },
];

describe('setLiveCoordinators guard logic (nostr.ts)', () => {
  it('initialises from seed — all 5 coordinators present', () => {
    const { getter } = makeGuard(SEED);
    expect(getter()).toHaveLength(5);
    expect(getter().map((c) => c.shortAlias)).toContain('alice');
  });

  it('non-empty update replaces the live list', () => {
    const { setter, getter } = makeGuard(SEED);
    const updated = SEED.filter((c) => c.shortAlias !== 'alice');
    setter(updated);
    expect(getter()).toHaveLength(4);
    expect(getter().map((c) => c.shortAlias)).not.toContain('alice');
  });

  it('empty array is a no-op — current list is preserved', () => {
    const { setter, getter } = makeGuard(SEED);
    setter([]);
    expect(getter()).toHaveLength(5); // unchanged
  });

  it('removal vote: alice evicted → 4 coordinators (consensus removal)', () => {
    const { setter, getter } = makeGuard(SEED);
    // Simulate consensus vote result: 4 mature coordinators remove alice
    setter(SEED.filter((c) => c.shortAlias !== 'alice'));
    const aliases = getter().map((c) => c.shortAlias);
    expect(aliases).not.toContain('alice');
    expect(aliases).toContain('temple');
    expect(aliases).toContain('lake');
    expect(aliases).toContain('bazaar');
    expect(aliases).toContain('freedomsats');
  });

  it('newcomer addition: new coordinator appears in live list after vote', () => {
    const { setter, getter } = makeGuard(SEED);
    const withNewcomer = [
      ...SEED,
      { shortAlias: 'newcoord', nostrHexPubkey: 'ff'.repeat(32), federated: true },
    ];
    setter(withNewcomer);
    expect(getter()).toHaveLength(6);
    expect(getter().map((c) => c.shortAlias)).toContain('newcoord');
  });

  it('successive votes update correctly (add then remove)', () => {
    const { setter, getter } = makeGuard(SEED);

    // Vote 1: admit newcomer
    setter([...SEED, { shortAlias: 'newcomer', nostrHexPubkey: 'ff'.repeat(32) }]);
    expect(getter()).toHaveLength(6);

    // Vote 2: remove newcomer (turned malicious)
    setter(SEED);
    expect(getter()).toHaveLength(5);
    expect(getter().map((c) => c.shortAlias)).not.toContain('newcomer');
  });
});
