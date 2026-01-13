import { bech32 } from '@scure/base';
import { HDKey } from '@scure/bip32';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { getPublicKey } from 'nostr-tools';

const GARAGE_KEY_PREFIX = 'robo';
const DERIVATION_COIN_TYPE = 88;
const KEY_LENGTH = 32;

const getDerivationPath = (accountIndex: number): string => {
  return `m/44'/${DERIVATION_COIN_TYPE}'/${accountIndex}'/0`;
};

interface GarageKeyValidation {
  valid: boolean;
  error?: string;
}

export function generatePlainKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(KEY_LENGTH));
}

export function encodeGarageKey(plainKey: Uint8Array): string {
  if (plainKey.length !== KEY_LENGTH) {
    throw new Error(`Invalid key length: expected ${KEY_LENGTH} bytes, got ${plainKey.length}`);
  }
  const words = bech32.toWords(plainKey);
  return bech32.encode(GARAGE_KEY_PREFIX, words, 90);
}

export function decodeGarageKey(garageKey: string): Uint8Array {
  const decoded = bech32.decode(garageKey, 90);
  if (decoded.prefix !== GARAGE_KEY_PREFIX) {
    throw new Error(`Invalid prefix: expected "${GARAGE_KEY_PREFIX}", got "${decoded.prefix}"`);
  }
  const bytes = bech32.fromWords(decoded.words);
  if (bytes.length !== KEY_LENGTH) {
    throw new Error(`Invalid key length after decoding: expected ${KEY_LENGTH}, got ${bytes.length}`);
  }
  return new Uint8Array(bytes);
}

export function validateGarageKey(garageKey: string): GarageKeyValidation {
  if (!garageKey) {
    return { valid: false, error: 'Garage key is empty' };
  }

  if (!garageKey.toLowerCase().startsWith(GARAGE_KEY_PREFIX + '1')) {
    return { valid: false, error: `Must start with "${GARAGE_KEY_PREFIX}1"` };
  }

  if (garageKey.length < 55 || garageKey.length > 65) {
    return { valid: false, error: 'Invalid length' };
  }

  try {
    const decoded = decodeGarageKey(garageKey);
    if (decoded.length !== KEY_LENGTH) {
      return { valid: false, error: 'Invalid key data' };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'Invalid format' };
  }
}

export function generateGarageKey(): string {
  const plainKey = generatePlainKey();
  return encodeGarageKey(plainKey);
}

export function deriveRobotKey(plainKey: Uint8Array, accountIndex: number): Uint8Array {
  if (plainKey.length !== KEY_LENGTH) {
    throw new Error(`Invalid key length: expected ${KEY_LENGTH} bytes`);
  }

  if (accountIndex < 0 || !Number.isInteger(accountIndex)) {
    throw new Error('Account index must be a non-negative integer');
  }

  const seed = sha512(plainKey);
  const masterKey = HDKey.fromMasterSeed(seed);

  const path = getDerivationPath(accountIndex);
  const derivedKey = masterKey.derive(path);

  if (!derivedKey.privateKey) {
    throw new Error('Failed to derive private key');
  }

  return derivedKey.privateKey;
}

export function derivedKeyToToken(derivedKey: Uint8Array): string {
  const hex = bytesToHex(derivedKey);

  const base62Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  let num = BigInt('0x' + hex);
  const base = BigInt(62);
  const zero = BigInt(0);

  while (num > zero && result.length < 36) {
    const remainder = Number(num % base);
    result = base62Chars[remainder] + result;
    num = num / base;
  }

  while (result.length < 36) {
    result = 'A' + result;
  }

  return result.substring(0, 36);
}

export function getNostrSecKeyFromGarageKey(plainKey: Uint8Array): Uint8Array {
  const keyHex = bytesToHex(plainKey);
  return sha256(sha512(keyHex));
}

export function getNostrPubKeyFromGarageKey(plainKey: Uint8Array): string {
  const secKey = getNostrSecKeyFromGarageKey(plainKey);
  return getPublicKey(secKey);
}

export function garageKeyToRobotToken(garageKey: string, accountIndex: number = 0): string {
  const plainKey = decodeGarageKey(garageKey);
  const derivedKey = deriveRobotKey(plainKey, accountIndex);
  return derivedKeyToToken(derivedKey);
}

export { hexToBytes, };
export { bytesToHex };
