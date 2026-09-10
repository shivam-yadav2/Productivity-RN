/**
 * Minimal react-native stand-in for logic tests.
 *
 * The real package ships Flow-typed ESM that Jest can't parse without the full RN preset
 * (which this project can't install — see jest.config.js). Only the pieces the tested
 * modules actually touch are needed.
 */
const listeners = new Set();

module.exports = {
  AppState: {
    currentState: 'active',
    addEventListener: (_event, handler) => {
      listeners.add(handler);
      return { remove: () => listeners.delete(handler) };
    },
  },
  Platform: { OS: 'android', Version: 34, select: (o) => o.android ?? o.default },
  Alert: { alert: () => {} },
  AccessibilityInfo: {
    isReduceMotionEnabled: async () => false,
    addEventListener: () => ({ remove: () => {} }),
  },
};
