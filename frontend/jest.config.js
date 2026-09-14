/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  // Stub platform-specific singletons that pull in ESM-only packages (uuid,
  // WebSocket Android bridge, WASM) that cannot run in a plain Node Jest env.
  moduleNameMapper: {
    // api service (uuid ESM via ApiAndroidClient)
    '\\./(api|api/.*)$': '<rootDir>/src/services/__mocks__/api.ts',
    '\\.\\./(api|api/.*)$': '<rootDir>/src/services/__mocks__/api.ts',
    // '..' is TWO dots — the previous '...'-matching pattern never matched.
    '\\.\\./(services/api|services/api/.*)$': '<rootDir>/src/services/__mocks__/api.ts',

    // Websocket service (uuid ESM via WebsocketAndroidClient)
    '<rootDir>/src/services/Websocket(.*)': '<rootDir>/src/services/__mocks__/Websocket.ts',
    '\\./(Websocket|Websocket/.*)$': '<rootDir>/src/services/__mocks__/Websocket.ts',
    '\\.\\./(Websocket|Websocket/.*)$': '<rootDir>/src/services/__mocks__/Websocket.ts',

    // Roboidentities service (robo-identities-wasm via RoboidentitiesWebClient)
    '\\.\\./(services/Roboidentities|services/Roboidentities/.*)$':
      '<rootDir>/src/services/__mocks__/Roboidentities.ts',

    // @noble/curves — ESM-only, stub schnorr for nostr.ts
    '^@noble/curves/(.*)$': '<rootDir>/src/__mocks__/noble-curves.ts',

    // nostr-tools — use CJS build
    '^nostr-tools$': '<rootDir>/node_modules/nostr-tools/lib/cjs/index.js',
    '^nostr-tools/(.*)$': '<rootDir>/node_modules/nostr-tools/lib/cjs/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
