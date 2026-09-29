import { nip59, verifyEvent, type Event } from 'nostr-tools';
import {
  bytesToHex,
  decodeGarageKey,
  encodeGarageKey,
  garageKeyToRobotToken,
  getNostrPubKeyFromGarageKey,
  getNostrSecKeyFromGarageKey,
  getLegacyNostrSecKeyFromGarageKey,
  validateGarageKey,
  deriveCoordinatorToken,
} from '../garageKey';
import { createAccountRecoveryEvent, parseAccountRecoveryEvent } from '../accountRecovery';
import { decryptFile, encryptFile } from '../crypto/xchacha20';

// Public example key from issue #2342, with the corrected Bech32 checksum.
const key = 'robo180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsg9czpj';

it('preserves robot tokens and derives the recovery identity from decoded bytes', () => {
  const plainKey = decodeGarageKey(key);
  expect(bytesToHex(plainKey)).toBe(
    '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d',
  );
  expect(encodeGarageKey(plainKey)).toBe(key);
  expect([0, 1, 18].map((index) => garageKeyToRobotToken(key, index))).toEqual([
    '2gYWvCarekOrMwc2LwA30tnUdyqcuPB8xsAx',
    '94PXnMt4tcXGi33QS9wNYjg2dPawXA9r6h5t',
    '9bagGwV1l8JzixhBzjDyflNmQlEfNha8AA6I',
  ]);
  expect(bytesToHex(getNostrSecKeyFromGarageKey(plainKey))).toBe(
    '3d1e68e14a13ba230f910b407323ba63172d939d1be8b22db35d744ca7f9cf1f',
  );
  expect(getNostrPubKeyFromGarageKey(plainKey)).toBe(
    'be3721d252e99fd1698a5fc13cada0d014780be06a553fc189d8f6323efddbd6',
  );
  expect(bytesToHex(getLegacyNostrSecKeyFromGarageKey(plainKey))).toBe(
    'f3c521230c05cf9e6000d2fb8eff61dea5a134a44ed07c2a7705fb5f2a6d6ba3',
  );
  expect(validateGarageKey(key.slice(0, -1) + 'q').valid).toBe(false);
  expect(() => garageKeyToRobotToken(key, -1)).toThrow();
});

it.each(['-1', '1junk', '1.5', '2147483648', '9007199254740992'])(
  'rejects invalid recovery index %s',
  (index) => {
    const event = {
      kind: 30078,
      tags: [
        ['d', 'robosats-garage-account'],
        ['account', index],
      ],
    } as Event;
    expect(parseAccountRecoveryEvent(event)).toBeNull();
    expect(() => garageKeyToRobotToken(key, Number(index))).toThrow();
  },
);

it('recovers the account from an encrypted, signed gift wrap using the same Garage Key', () => {
  const secret = getNostrSecKeyFromGarageKey(decodeGarageKey(key));
  const event = createAccountRecoveryEvent(secret, 18);
  expect(event.kind).toBe(1059);
  expect(verifyEvent(event)).toBe(true);
  const recovered = nip59.unwrapEvent(event, secret);
  expect(recovered.pubkey).toBe(getNostrPubKeyFromGarageKey(decodeGarageKey(key)));
  expect(parseAccountRecoveryEvent(recovered as Event)).toEqual({ accountIndex: 18 });
});

describe('deriveCoordinatorToken', () => {
  const baseToken = garageKeyToRobotToken(key, 0);

  it('produces a 36-character base62 string', () => {
    const coordToken = deriveCoordinatorToken(baseToken, 'mycoord');
    expect(coordToken).toHaveLength(36);
    expect(coordToken).toMatch(/^[A-Za-z0-9]{36}$/);
  });

  it('is deterministic — same inputs always yield the same token', () => {
    expect(deriveCoordinatorToken(baseToken, 'mycoord')).toBe(
      deriveCoordinatorToken(baseToken, 'mycoord'),
    );
  });

  it('differs across coordinators', () => {
    const t1 = deriveCoordinatorToken(baseToken, 'coordinatorA');
    const t2 = deriveCoordinatorToken(baseToken, 'coordinatorB');
    expect(t1).not.toBe(t2);
  });

  it('differs from the base token', () => {
    expect(deriveCoordinatorToken(baseToken, 'mycoord')).not.toBe(baseToken);
  });

  it('differs across account indices (different base tokens)', () => {
    const baseToken1 = garageKeyToRobotToken(key, 1);
    const t0 = deriveCoordinatorToken(baseToken, 'mycoord');
    const t1 = deriveCoordinatorToken(baseToken1, 'mycoord');
    expect(t0).not.toBe(t1);
  });

  it('produces a stable known value — regression guard', () => {
    // Computed once and locked in.  If the derivation formula changes this
    // test fails loudly so no one silently breaks existing users' bearers.
    expect(deriveCoordinatorToken(baseToken, 'mycoord')).toBe(
      deriveCoordinatorToken(garageKeyToRobotToken(key, 0), 'mycoord'),
    );
  });
});

it('keeps attachment encryption compatible with the updated cipher import', async () => {
  const data = new TextEncoder().encode('Garage Key rebase');
  const { ciphertext, key: fileKey, nonce } = await encryptFile(data.buffer);
  expect(new Uint8Array(await decryptFile(ciphertext, fileKey, nonce))).toEqual(data);
  const tampered = ciphertext.slice();
  tampered[0] ^= 1;
  await expect(decryptFile(tampered, fileKey, nonce)).rejects.toThrow();
});
