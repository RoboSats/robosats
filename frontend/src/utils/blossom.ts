import { finalizeEvent, type EventTemplate } from 'nostr-tools';
import { apiClient } from '../services/api';

export async function computeSha256(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data.slice().buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function createAuthEvent(sha256hex: string, secretKey: Uint8Array): string {
  const expiration = Math.floor(Date.now() / 1000) + 300;

  const eventTemplate: EventTemplate = {
    kind: 24242,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['t', 'upload'],
      ['x', sha256hex],
      ['expiration', String(expiration)],
    ],
    content: 'Upload encrypted image',
  };

  const signedEvent = finalizeEvent(eventTemplate, secretKey);
  return btoa(JSON.stringify(signedEvent));
}

export interface BlossomUploadResult {
  url: string;
  sha256: string;
}

export async function uploadToBlossom(
  ciphertext: Uint8Array,
  coordinatorUrl: string,
  nostrSecKey: Uint8Array,
): Promise<BlossomUploadResult> {
  const sha256 = await computeSha256(ciphertext);
  const authToken = createAuthEvent(sha256, nostrSecKey);

  await apiClient.putBinary(coordinatorUrl, '/blossom/upload', ciphertext, `Nostr ${authToken}`);

  return {
    url: `${coordinatorUrl}/blossom/${sha256}`,
    sha256,
  };
}

export async function downloadFromBlossom(url: string): Promise<Uint8Array> {
  // Parse URL to get baseUrl and path
  const urlObj = new URL(url);
  const baseUrl = urlObj.origin;
  const path = urlObj.pathname;

  const data = await apiClient.getBinary(baseUrl, path);
  if (!data) {
    throw new Error('Blossom download failed');
  }
  return data;
}

export async function verifyBlobHash(data: Uint8Array, expectedSha256: string): Promise<boolean> {
  const actualSha256 = await computeSha256(data);
  return actualSha256 === expectedSha256;
}
