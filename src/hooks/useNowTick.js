// Shared 1Hz tick — single setInterval shared across all subscribers.
// Components that need second-by-second updates use useNowTick(); only
// those leaf components re-render on the beat, not the entire tree.
import { useState, useEffect } from 'react';

let _tickInterval = null;
const _tickListeners = new Set();

const _ensureTickRunning = () => {
  if (_tickListeners.size > 0 && !_tickInterval) {
    _tickInterval = setInterval(() => {
      const t = Date.now();
      _tickListeners.forEach((fn) => fn(t));
    }, 1000);
  } else if (_tickListeners.size === 0 && _tickInterval) {
    clearInterval(_tickInterval);
    _tickInterval = null;
  }
};

export function useNowTick(active = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    _tickListeners.add(setNow);
    _ensureTickRunning();
    return () => {
      _tickListeners.delete(setNow);
      _ensureTickRunning();
    };
  }, [active]);
  return now;
}
