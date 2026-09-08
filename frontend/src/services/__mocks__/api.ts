/** Minimal stub for the api service used in Jest tests.
 *  Phase C of FederationDiscovery (fetchAndVerifyDoc) calls apiClient.get();
 *  all pure voting/hash tests mock it at the import level via jest.config.js. */

/* eslint-disable @typescript-eslint/no-explicit-any */
const noop = (): Promise<null> => Promise.resolve(null);

export const apiClient = {
  get: noop as (...args: any[]) => Promise<null>,
  post: noop as (...args: any[]) => Promise<null>,
  put: noop as (...args: any[]) => Promise<null>,
};

export type Auth = {
  tokenSHA256: string;
  nostrPubkey?: string;
  keys?: { pubKey: string; encPrivKey: string };
};

export type ApiClient = typeof apiClient;
