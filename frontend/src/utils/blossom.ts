import { finalizeEvent, type EventTemplate } from 'nostr-tools';

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
  const uploadUrl = `${coordinatorUrl}/blossom/upload`;
  const authToken = createAuthEvent(sha256, nostrSecKey);

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Nostr ${authToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: ciphertext.slice().buffer,
  });

  if (!response.ok) {
    throw new Error(`Blossom upload failed: ${response.status} ${response.statusText}`);
  }

  return {
    url: `${coordinatorUrl}/blossom/${sha256}`,
    sha256,
  };
}

export async function downloadFromBlossom(url: string): Promise<Uint8Array> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Blossom download failed: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function verifyBlobHash(data: Uint8Array, expectedSha256: string): Promise<boolean> {
  const actualSha256 = await computeSha256(data);
  return actualSha256 === expectedSha256;
}
