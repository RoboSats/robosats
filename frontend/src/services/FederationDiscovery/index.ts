/**
 * FederationDiscovery — hash-first design.
 * See /development/federation-discovery.md for the full spec.
 *
 * Phase A: read coordinator.info.federation_hash (zero new requests).
 * Phase B: vote on hashes — coordinator majority, client x2 on tie.
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

// Badge re-application from bundled seed
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

// Phase B: vote on hashes (pure, no I/O)
export interface VoteResult {
  winnerHash: string;
  usedSeed: boolean;
}

export function voteOnHashes(coordHashes: string[], seedHash: string): VoteResult {
  if (coordHashes.length < 2) return { winnerHash: seedHash, usedSeed: true };
  const buildCounts = (hs: string[]): Map<string, number> => {
    const m = new Map<string, number>();
    for (const h of hs) m.set(h, (m.get(h) ?? 0) + 1);
    return m;
  };
  const tally = (counts: Map<string, number>): string | null => {
    const max = Math.max(...counts.values());
    const w = [...counts.entries()].filter(([, v]) => v === max).map(([k]) => k);
    return w.length === 1 ? w[0] : null;
  };
  const coordCounts = buildCounts(coordHashes);
  const w1 = tally(coordCounts);
  if (w1 !== null) return { winnerHash: w1, usedSeed: w1 === seedHash };
  const withClient = new Map(coordCounts);
  withClient.set(seedHash, (withClient.get(seedHash) ?? 0) + 2);
  const w2 = tally(withClient);
  if (w2 !== null) return { winnerHash: w2, usedSeed: w2 === seedHash };
  return { winnerHash: seedHash, usedSeed: true };
}

// Phase C: fetch + verify on mismatch
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
