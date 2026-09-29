// Node 18+ ships the Web Crypto API under require('crypto').webcrypto but
// does not automatically surface it as a bare `crypto` global the way
// browsers do.  nostr-tools (@noble/hashes) and xchacha20.ts both reference
// `crypto` without an import, so we polyfill it here for the Jest environment.
if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
  const { webcrypto } = require('crypto');
  global.crypto = webcrypto;
}
