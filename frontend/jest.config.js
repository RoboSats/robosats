/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(@noble|@scure|nostr-tools)/)'],
  moduleNameMapper: {
    '\\./(api|api/.*)$': '<rootDir>/src/services/__mocks__/api.ts',
    '\\.\\./(api|api/.*)$': '<rootDir>/src/services/__mocks__/api.ts',
    '\\.\\./(services/api|services/api/.*)$': '<rootDir>/src/services/__mocks__/api.ts',

    '<rootDir>/src/services/Websocket(.*)': '<rootDir>/src/services/__mocks__/Websocket.ts',
    '\\./(Websocket|Websocket/.*)$': '<rootDir>/src/services/__mocks__/Websocket.ts',
    '\\.\\./(Websocket|Websocket/.*)$': '<rootDir>/src/services/__mocks__/Websocket.ts',

    '\\.\\./(services/Roboidentities|services/Roboidentities/.*)$':
      '<rootDir>/src/services/__mocks__/Roboidentities.ts',

    '^nostr-tools$': '<rootDir>/node_modules/nostr-tools/lib/cjs/index.js',
    '^nostr-tools/(.*)$': '<rootDir>/node_modules/nostr-tools/lib/cjs/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
