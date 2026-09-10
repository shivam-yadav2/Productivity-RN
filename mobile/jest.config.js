/**
 * Tests target the app's pure logic — money math, date arithmetic, schedule expansion.
 *
 * Deliberately NOT jest-expo: it requires @react-native/jest-preset ^0.86.3 while this
 * project pins react-native 0.86.2, which makes every npm install fail. Component tests
 * would need that preset; the logic worth testing here has no React in it.
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  // These pull the native runtime (and ship ESM). The logic under test never calls them;
  // it just lives in the same modules as code that does.
  moduleNameMapper: {
    '^react-native$': '<rootDir>/test-mocks/react-native.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/test-mocks/async-storage.js',
    '^expo-notifications$': '<rootDir>/test-mocks/expo-notifications.js',
    'modules/expo-alarm$': '<rootDir>/test-mocks/expo-alarm.js',
  },
  transform: {
    '^.+\.tsx?$': ['babel-jest', { presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]] }],
  },
};
