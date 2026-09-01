/** Stub for @noble/curves — only schnorr.verify is used in nostr.ts */
export const schnorr = {
  verify: () => true,
  sign: () => new Uint8Array(64),
};

export const secp256k1 = {
  sign: () => new Uint8Array(64),
  verify: () => true,
};
