/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  // FederationDiscovery/index.ts imports apiClient only for Phase C (fetchAndVerifyDoc).
  // We stub the api service to avoid pulling in uuid (ESM-only) and other
  // platform-specific dependencies (Android bridge, WASM) that are irrelevant
  // for the pure voting / hashing tests.
  moduleNameMapper: {
    // Stub the whole api service barrel (and all sub-paths) so uuid (ESM-only)
    // and Android bridge code don't get loaded in the Node test env.
    '<rootDir>/src/services/api(.*)': '<rootDir>/src/services/__mocks__/api.ts',
    '\\./(api|api/.*)$': '<rootDir>/src/services/__mocks__/api.ts',
    '\\.\\./(api|api/.*)$': '<rootDir>/src/services/__mocks__/api.ts',
    '\\.\\.\\./(services/api|services/api/.*)$': '<rootDir>/src/services/__mocks__/api.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
