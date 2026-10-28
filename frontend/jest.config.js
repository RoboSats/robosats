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
  collectCoverageFrom: [
    'src/models/Coordinator.model.ts',
    'src/models/Garage.model.ts',
    'src/models/GarageKey.model.ts',
    'src/models/Limit.model.ts',
    'src/models/Order.model.ts',
    'src/models/Robot.model.ts',
    'src/models/Slot.model.ts',
    'src/services/FederationDiscovery/index.ts',
    'src/services/RoboPool/index.ts',
    'src/utils/accountRecovery.ts',
    'src/utils/crypto/xchacha20.ts',
    'src/utils/federationLottery.ts',
    'src/utils/garageKey.ts',
    'src/utils/hexToBase91.ts',
    'src/utils/prettyNumbers.ts',
    'src/utils/saveFile.ts',
    'src/utils/token.ts',
  ],
  coverageReporters: ['text', 'json-summary'],
  coverageThreshold: {
    global: {
      statements: 71,
      branches: 56,
      functions: 61,
      lines: 72,
    },
  },
};
