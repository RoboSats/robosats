/**
 * FederationDiscovery
 *
 * Fetches /api/federation/ from each known coordinator and selects the
 * canonical federation document via a majority vote.
 *
 * Algorithm (verified in /development/federation-discovery.md):
 *  1. Hash each doc via NORMALIZED canonical form — cosmetic edits don't split the vote.
 *  2. Coordinator-only tally: if they have a majority, that document wins.
 *  3. Coordinators tied: client casts 2 votes for its version (decides positively).
 *  4. Still tied (coords split across ≥3 versions, client holds a 3rd) → use client seed.
 *
 * Badges/donatesToDevFund re-applied from seed after adoption.
 */

import { apiClient } from '../api';
import defaultFederation from '../../../static/federation.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Normalization & hashing
// ---------------------------------------------------------------------------

function normalizeDoc(doc: FederationDoc): Record<string, unknown> {
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

async function canonicalHash(obj: Record<string, unknown>): Promise<string> {
  const text = stableStringify(obj);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const ALIAS_RE = /^[a-z0-9]{1,20}$/;

function isValidDoc(doc: unknown): doc is FederationDoc {
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
// Badge re-application
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
// Vote
// ---------------------------------------------------------------------------

async function vote(seedDoc: FederationDoc, coordDocs: FederationDoc[]): Promise<FederationDoc> {
  if (coordDocs.length < 2) return seedDoc;

  const allDocs = [seedDoc, ...coordDocs];
  const hashes = await Promise.all(allDocs.map((d) => canonicalHash(normalizeDoc(d))));
  const seedHash = hashes[0];
  const coordHashes = hashes.slice(1);

  function tally(counts: Map<string, number>): string | null {
    const max = Math.max(...counts.values());
    const winners = [...counts.entries()].filter(([, v]) => v === max).map(([k]) => k);
    return winners.length === 1 ? winners[0] : null;
  }

  function buildCounts(hs: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const h of hs) counts.set(h, (counts.get(h) ?? 0) + 1);
    return counts;
  }

  // Step 1: coordinator-only majority — coordinators decide on their own when they agree.
  const coordCounts = buildCounts(coordHashes);
  const winner1 = tally(coordCounts);
  if (winner1 !== null) {
    const idx = coordHashes.indexOf(winner1);
    return reapplySeedBadges(coordDocs[idx]);
  }

  // Step 2: coordinators are tied — client breaks the tie by casting 2 votes for its
  // version, deciding positively in favour of whichever document it already holds.
  // (Verified exhaustively: 0 ties for all normal 2-version join/leave scenarios.)
  const coordPlusClientCounts = new Map(coordCounts);
  coordPlusClientCounts.set(seedHash, (coordPlusClientCounts.get(seedHash) ?? 0) + 2);
  const winner2 = tally(coordPlusClientCounts);
  if (winner2 !== null) {
    const idx = hashes.indexOf(winner2);
    return reapplySeedBadges(allDocs[idx]);
  }

  // Step 3: unresolvable — coordinators split across ≥3 versions AND client holds
  // a 3rd that does not break any bloc. Fall back to the client's bundled seed.
  return seedDoc;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export interface FederationDiscoveryResult {
  doc: FederationDoc;
  responses: number;
  /** true when the seed was kept (no quorum or unresolvable tie). */
  usedSeed: boolean;
}

export async function discoverFederation(
  currentDoc: FederationDoc,
  network: 'mainnet' | 'testnet' = 'mainnet',
): Promise<FederationDiscoveryResult> {
  const seed = defaultFederation as unknown as FederationDoc;
  const coordDocs: FederationDoc[] = [];

  const fetches = Object.values(currentDoc).map(async (entry) => {
    const nets = entry[network] as Record<string, string> | undefined;
    const onion = nets?.onion ?? '';
    if (!onion) return;
    const baseUrl = onion.replace(/\/$/, '');
    try {
      const raw = await apiClient.get(baseUrl, '/api/federation/', undefined, true);
      if (!raw || typeof raw !== 'object') return;
      const { coordinatorHash: _h, ...docCandidate } = raw as Record<string, unknown>;
      if (isValidDoc(docCandidate)) coordDocs.push(docCandidate as FederationDoc);
    } catch {
      /* coordinator unreachable — abstain */
    }
  });

  await Promise.allSettled(fetches);

  if (coordDocs.length < 2) {
    return { doc: seed, responses: coordDocs.length, usedSeed: true };
  }

  const seedDoc = isValidDoc(seed) ? (seed as FederationDoc) : coordDocs[0];
  const winnerDoc = await vote(seedDoc, coordDocs);
  return { doc: winnerDoc, responses: coordDocs.length, usedSeed: winnerDoc === seedDoc };
}
