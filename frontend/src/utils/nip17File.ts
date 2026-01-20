import { type EventTemplate } from 'nostr-tools';
import { toBase64, fromBase64 } from './crypto/xchacha20';

export interface FileMessageParams {
  url: string;
  mimeType: string;
  key: Uint8Array;
  nonce: Uint8Array;
  sha256: string;
  orderId: number;
  coordinatorShortAlias: string;
  peerPubKey: string;
  ownPubKey: string;
  relayUrl: string;
  originalSha256: string;
  encryptedSize?: number;
}

export function createFileMessage(params: FileMessageParams): EventTemplate {
  const {
    url,
    mimeType,
    key,
    nonce,
    sha256,
    orderId,
    coordinatorShortAlias,
    peerPubKey,
    ownPubKey,
    relayUrl,
    originalSha256,
    encryptedSize,
  } = params;

  return {
    kind: 15,
    created_at: Math.ceil(Date.now() / 1000),
    content: url,
    tags: [
      ['order_id', `${coordinatorShortAlias}/${orderId}`],
      ['p', peerPubKey, relayUrl],
      ['p', ownPubKey, relayUrl],
      ['file-type', mimeType],
      ['encryption-algorithm', 'xchacha20-poly1305'],
      ['decryption-key', toBase64(key)],
      ['decryption-nonce', toBase64(nonce)],
      ['x', sha256],
      ['ox', originalSha256],
      ...(encryptedSize ? [['size', String(encryptedSize)]] : []),
    ],
  };
}

export interface ParsedFileMessage {
  url: string;
  mimeType: string;
  key: Uint8Array;
  nonce: Uint8Array;
  sha256: string;
  originalSha256?: string;
  encryptionAlgorithm: string;
  encryptedSize?: number;
}

export function parseFileMessage(event: {
  kind: number;
  content: string;
  tags: string[][];
}): ParsedFileMessage | null {
  if (event.kind !== 15) {
    return null;
  }

  const getTag = (name: string): string | undefined => event.tags.find((t) => t[0] === name)?.[1];

  const keyB64 = getTag('decryption-key');
  const nonceB64 = getTag('decryption-nonce');
  const mimeType = getTag('file-type');
  const sha256 = getTag('x');
  const originalSha256 = getTag('ox');
  const size = getTag('size');
  const algorithm = getTag('encryption-algorithm');

  if (!keyB64 || !nonceB64 || !mimeType || !sha256) {
    return null;
  }

  try {
    return {
      url: event.content,
      mimeType,
      key: fromBase64(keyB64),
      nonce: fromBase64(nonceB64),
      sha256,
      originalSha256,
      encryptedSize: size ? Number(size) : undefined,
      encryptionAlgorithm: algorithm ?? 'xchacha20-poly1305',
    };
  } catch {
    return null;
  }
}

export function isFileMessage(event: { kind: number; tags: string[][] }): boolean {
  return event.kind === 15 && event.tags.some((t) => t[0] === 'file-type');
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}
