// Storage adapter — wraps localStorage with the async key/value API
// the rest of the app expects. Returns null on miss instead of throwing,
// so callers don't have to wrap every read in try/catch.

const noop = () => Promise.resolve(null);

const lsAvailable = (() => {
  try {
    if (typeof window === 'undefined') return false;
    const k = '__procurement_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
})();

export const storage = lsAvailable
  ? {
      async get(key) {
        try {
          const value = window.localStorage.getItem(key);
          return value == null ? null : { key, value };
        } catch (e) {
          return null;
        }
      },
      async set(key, value) {
        try {
          window.localStorage.setItem(key, value);
          return { key, value };
        } catch (e) {
          return null;
        }
      },
      async remove(key) {
        try {
          window.localStorage.removeItem(key);
          return true;
        } catch (e) {
          return false;
        }
      },
    }
  : { get: noop, set: noop, remove: noop };
