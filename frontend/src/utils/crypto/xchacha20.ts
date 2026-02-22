import { xchacha20poly1305 } from '@noble/ciphers/chacha';

const KEY_LENGTH = 32;
const NONCE_LENGTH = 24;

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export async function encryptFile(
  data: ArrayBuffer,
  key?: Uint8Array,
): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array; key: Uint8Array }> {
  const encryptionKey = key ?? randomBytes(KEY_LENGTH);

  if (encryptionKey.length !== KEY_LENGTH) {
    throw new Error(`Key must be ${KEY_LENGTH} bytes`);
  }

  const nonce = randomBytes(NONCE_LENGTH);
  const cipher = xchacha20poly1305(encryptionKey, nonce);
  const ciphertext = cipher.encrypt(new Uint8Array(data));

  return { ciphertext, nonce, key: encryptionKey };
}

export async function decryptFile(
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
): Promise<ArrayBuffer> {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Key must be ${KEY_LENGTH} bytes`);
  }

  if (nonce.length !== NONCE_LENGTH) {
    throw new Error(`Nonce must be ${NONCE_LENGTH} bytes`);
  }

  const cipher = xchacha20poly1305(key, nonce);
  const plaintext = cipher.decrypt(ciphertext);

  return plaintext.slice().buffer;
}

export function generateKey(): Uint8Array {
  return randomBytes(KEY_LENGTH);
}

export function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(bytes)));
}

export function fromBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
