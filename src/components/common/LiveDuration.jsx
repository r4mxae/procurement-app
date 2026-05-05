// Self-ticking duration display. Only this component re-renders each
// second — the rest of the React tree stays stable.
import React from 'react';
import { useNowTick } from '../../hooks/useNowTick';
import { fmtDuration, fmtDurationLive } from '../../lib/format';

export const LiveDuration = React.memo(function LiveDuration({
  startTime,
  baseSeconds = 0,
  format = 'compact',
}) {
  const now = useNowTick(!!startTime);
  if (!startTime) return null;
  const elapsed = Math.max(0, Math.floor((now - Date.parse(startTime)) / 1000));
  const total = baseSeconds + elapsed;
  return format === 'live' ? fmtDurationLive(total) : fmtDuration(total);
});
