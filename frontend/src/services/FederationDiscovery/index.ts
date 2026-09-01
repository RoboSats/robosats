/**
 * FederationDiscovery — hash-first design with seniority-weighted voting.
 * See /development/federation-discovery.md for the full spec.
 *
 * Phase A: read coordinator.info.federation_hash (zero new requests).
 * Phase B: seniority-weighted vote — strict majority (>50%) required to win;
 *          on indecision the client keeps its current trusted doc unchanged.
 * Phase C: fetch /api/federation/ once on mismatch, verify hash locally.
 */

import { apiClient } from '../api';
import defaultFederation from '../../../static/federation.json';

export type FederationDoc = Record<string, Record<string, unknown>>;

const KEY_ATTRS = [
  'shortAlias',
  'nostrHexPubkey',
  'established',
  'federated',
  'mainnetNodesPubkeys',
  'testnetNodesPubkeys',
] as const;
const NET_ATTRS = ['onion', 'clearnet', 'i2p'] as const;

// Normalization & hashing
export function normalizeDoc(doc: FederationDoc): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [alias, entry] of Object.entries(doc)) {
    const n: Record<string, unknown> = {};
    for (const k of KEY_ATTRS) n[k] = entry[k] ?? null;
    for (const net of ['mainnet', 'testnet'] as const) {
      const netObj = (entry[net] as Record<string, string> | undefined) ?? {};
      n[net] = Object.fromEntries(NET_ATTRS.map((k) => [k, netObj[k] ?? '']));
    }
    out[alias] = n;
  }
  return out;
}

function stableStringify(val: unknown): string {
  if (val === null || typeof val !== 'object') return JSON.stringify(val);
  if (Array.isArray(val)) return '[' + val.map(stableStringify).join(',') + ']';
  const obj = val as Record<string, unknown>;
  return (
    '{' +
    Object.keys(obj)
      .sort()
      .map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k]))
      .join(',') +
    '}'
  );
}

export async function canonicalHash(obj: Record<string, unknown>): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stableStringify(obj)));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

let _seedHashCache: string | null = null;
export async function getSeedHash(): Promise<string> {
  if (_seedHashCache) return _seedHashCache;
  _seedHashCache = await canonicalHash(normalizeDoc(defaultFederation as unknown as FederationDoc));
  return _seedHashCache;
}

// Validation
const ALIAS_RE = /^[a-z0-9]{1,20}$/;
export function isValidDoc(doc: unknown): doc is FederationDoc {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return false;
  const d = doc as Record<string, unknown>;
  if (Object.keys(d).length === 0) return false;
  for (const [alias, entry] of Object.entries(d)) {
    if (!ALIAS_RE.test(alias)) return false;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
    const e = entry as Record<string, unknown>;
    if (e.shortAlias !== alias) return false;
    const onion = (e.mainnet as Record<string, string> | undefined)?.onion ?? '';
    if (!onion.includes('.onion')) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Badge re-application from bundled seed (unchanged)
// ---------------------------------------------------------------------------

function reapplySeedBadges(doc: FederationDoc): FederationDoc {
  const seed = defaultFederation as unknown as FederationDoc;
  const out: FederationDoc = {};
  for (const [alias, entry] of Object.entries(doc)) {
    const seedEntry = seed[alias] as Record<string, unknown> | undefined;
    out[alias] = {
      ...entry,
      badges: seedEntry?.badges ?? {
        isFounder: false,
        donatesToDevFund: 0,
        hasGoodOpSec: false,
        hasLargeLimits: false,
      },
      _votedIn: !seedEntry,
    };
  }
  return out;
}

// ---------------------------------------------------------------------------
// Phase B — seniority-weighted vote (pure, no I/O)
// ---------------------------------------------------------------------------

/** One coordinator's vote contribution. */
export interface CoordVote {
  alias: string;
  hash: string;
}

export interface VoteOptions {
  /**
   * The client's own trusted federation document (bundled seed or the last
   * accepted voted-in doc).  Used exclusively to look up established dates —
   * we never trust a date that arrived from a coordinator-served doc.
   */
  trustedDoc: FederationDoc;
  /**
   * Client-side join-date ledger: alias → 'YYYY-MM-DD'.  Records the date the
   * client first accepted a coordinator absent from the bundled seed.
   */
  joinDates: Record<string, string>;
  /** Injected so tests can pin the clock. Defaults to new Date(). */
  now?: Date;
}

export interface VoteResult {
  /** Winning hash, or null when no strict majority was reached (keep current). */
  winnerHash: string | null;
}

// Weight constants
export const WEIGHT_MIN = 1; // newcomer / unknown / future-dated
export const WEIGHT_FLOOR = 4; // guaranteed after 1 full year of seniority
export const WEIGHT_MAX = 10; // oldest coordinator
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Return a coordinator's trusted established date.
 *
 * Priority (root of trust = the client's own data):
 *   1. Bundled seed federation.json (compiled into the app bundle at release —
 *      not spoofable by any coordinator).
 *   2. Client's persisted join-date ledger (recorded when a newcomer was first
 *      accepted via a successful weighted vote).
 *   3. null — unknown seniority; receives WEIGHT_MIN.
 *
 * A coordinator-served `established` field is intentionally ignored: if it
 * were trusted, a sybil could backdate itself to maximise its vote weight.
 */
export function trustedEstablishedDate(
  alias: string,
  seedDoc: FederationDoc,
  joinDates: Record<string, string>,
): Date | null {
  const seedEntry = seedDoc[alias] as Record<string, unknown> | undefined;
  const seedDate = seedEntry?.established;
  if (typeof seedDate === 'string' && seedDate.length > 0) {
    const d = new Date(seedDate);
    if (!isNaN(d.getTime())) return d;
  }

  const ledgerDate = joinDates[alias];
  if (typeof ledgerDate === 'string' && ledgerDate.length > 0) {
    const d = new Date(ledgerDate);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Compute seniority weight for a single coordinator.
 *
 * Piecewise linear, anchored on the oldest coordinator among all voters:
 *
 *   age <  1 year  →  1 + floor(3 × age / ONE_YEAR_MS)   [ramp 1 → 3]
 *   age >= 1 year  →  4 + floor(6 × (age−1y) / (ageOldest−1y))  [ramp 4 → 10]
 *
 * Guarantees:
 *   - null / future-dated established  → WEIGHT_MIN (1)
 *   - at least 1 year old              → at least WEIGHT_FLOOR (4)
 *   - oldest coordinator               → WEIGHT_MAX (10)
 */
export function seniorityWeight(
  established: Date | null,
  oldestEstablished: Date | null,
  now: Date,
): number {
  if (!established || !oldestEstablished) return WEIGHT_MIN;

  const ageMs = now.getTime() - established.getTime();
  const ageOldestMs = now.getTime() - oldestEstablished.getTime();

  if (ageMs < 0 || ageOldestMs <= 0) return WEIGHT_MIN;

  if (ageMs < ONE_YEAR_MS) {
    // First-year ramp: 1 → 3
    return WEIGHT_MIN + Math.floor((WEIGHT_FLOOR - WEIGHT_MIN - 1) * (ageMs / ONE_YEAR_MS));
  }

  // Post-year segment: 4 → 10
  if (ageOldestMs <= ONE_YEAR_MS) {
    // Oldest is also under 1 year — young federation, everyone past 1 year
    // gets the floor (degenerate edge case, practically unreachable).
    return WEIGHT_FLOOR;
  }

  const seniorSpanMs = ageOldestMs - ONE_YEAR_MS; // > 0
  const coordSeniorMs = ageMs - ONE_YEAR_MS; // ≥ 0
  return WEIGHT_FLOOR + Math.floor((WEIGHT_MAX - WEIGHT_FLOOR) * (coordSeniorMs / seniorSpanMs));
}

/**
 * Phase B — seniority-weighted vote on federation_hash values.
 *
 * Rules:
 *   - Minimum quorum: ≥ 2 coordinator votes (older behaviour preserved).
 *   - Each coordinator's vote carries a seniority weight (1–10).
 *   - A hash wins only with strict majority: its weight > 50% of total weight.
 *   - Indecision (tie / quorum not met) → winnerHash = null.
 *     The caller keeps the client's current trusted document unchanged.
 *     "No decision" is always the safe direction.
 */
export function voteOnHashes(votes: CoordVote[], options: VoteOptions): VoteResult {
  const { trustedDoc, joinDates, now = new Date() } = options;

  if (votes.length < 2) return { winnerHash: null };

  const established = votes.map((v) => trustedEstablishedDate(v.alias, trustedDoc, joinDates));

  const oldestEstablished = established.reduce<Date | null>((oldest, d) => {
    if (!d) return oldest;
    if (!oldest) return d;
    return d.getTime() < oldest.getTime() ? d : oldest;
  }, null);

  const weightByHash = new Map<string, number>();
  let totalWeight = 0;

  votes.forEach((v, i) => {
    const w = seniorityWeight(established[i], oldestEstablished, now);
    weightByHash.set(v.hash, (weightByHash.get(v.hash) ?? 0) + w);
    totalWeight += w;
  });

  for (const [hash, w] of weightByHash) {
    if (w * 2 > totalWeight) return { winnerHash: hash };
  }

  return { winnerHash: null };
}

// ---------------------------------------------------------------------------
// Phase C: fetch + verify on mismatch (unchanged)
// ---------------------------------------------------------------------------

export async function fetchAndVerifyDoc(
  baseUrl: string,
  expectedHash: string,
): Promise<FederationDoc | null> {
  try {
    const raw = await apiClient.get(baseUrl, '/api/federation/', undefined, true);
    if (!raw || typeof raw !== 'object') return null;
    if (!isValidDoc(raw)) return null;
    const docCandidate = raw as FederationDoc;
    const actualHash = await canonicalHash(normalizeDoc(docCandidate as FederationDoc));
    if (actualHash !== expectedHash) {
      console.warn('[FederationDiscovery] hash mismatch from ' + baseUrl);
      return null;
    }
    return reapplySeedBadges(docCandidate as FederationDoc);
  } catch {
    return null;
  }
}
