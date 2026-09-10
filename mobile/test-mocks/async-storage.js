/** In-memory AsyncStorage so the engine can init and persist inside tests. */
const store = new Map();

module.exports = {
  __esModule: true,
  default: {
    getItem: async (k) => (store.has(k) ? store.get(k) : null),
    setItem: async (k, v) => void store.set(k, v),
    removeItem: async (k) => void store.delete(k),
    clear: async () => void store.clear(),
  },
};
