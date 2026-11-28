import { nip19 } from 'nostr-tools';
import { isValidNostrPubkey, toNpub } from '../nostrPubkey';

const pubkey = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
const npub = 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6';

describe('isValidNostrPubkey', () => {
  it('accepts lowercase x-only public keys on the curve', () => {
    expect(isValidNostrPubkey(pubkey)).toBe(true);
    expect(isValidNostrPubkey(`${'0'.repeat(63)}1`)).toBe(true);
  });

  it.each([
    ['odd-length hex', 'abcde'],
    ['a non-hex placeholder', 'Nostr'],
    ['a stringified null', 'None'],
    ['an empty string', ''],
    ['the coordinator placeholder', '0'.repeat(64)],
    ['an x coordinate that is not on the curve', `${'0'.repeat(63)}5`],
    ['an x coordinate above the field size', 'f'.repeat(64)],
    ['uppercase hex', pubkey.toUpperCase()],
    ['a truncated key', pubkey.slice(1)],
    ['a key with the auth header prefix', `Nostr ${pubkey}`],
  ])('rejects %s', (_label, value) => {
    expect(isValidNostrPubkey(value)).toBe(false);
  });

  it('rejects missing values', () => {
    expect(isValidNostrPubkey(undefined)).toBe(false);
    expect(isValidNostrPubkey(null)).toBe(false);
  });
});

describe('toNpub', () => {
  it('encodes a valid public key', () => {
    expect(toNpub(pubkey)).toBe(npub);
  });

  it('returns an empty string for keys nip19.npubEncode cannot encode', () => {
    expect(() => nip19.npubEncode('Nostr')).toThrow();
    expect(() => nip19.npubEncode('None')).toThrow();
    expect(toNpub('Nostr')).toBe('');
    expect(toNpub('None')).toBe('');
    expect(toNpub(undefined)).toBe('');
    expect(toNpub(null)).toBe('');
  });

  it('returns an empty string for keys that are not on the curve', () => {
    expect(toNpub('0'.repeat(64))).toBe('');
  });
});
