import { schnorr } from '@noble/curves/secp256k1.js';
import { nip19 } from 'nostr-tools';

const HEX_PUBKEY = /^[0-9a-f]{64}$/;

export const isValidNostrPubkey = (pubkey?: string | null): boolean => {
  if (!pubkey || !HEX_PUBKEY.test(pubkey)) return false;
  try {
    schnorr.utils.lift_x(BigInt(`0x${pubkey}`));
    return true;
  } catch {
    return false;
  }
};

export const toNpub = (pubkey?: string | null): string =>
  pubkey && isValidNostrPubkey(pubkey) ? nip19.npubEncode(pubkey) : '';
