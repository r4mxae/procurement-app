// Start/Stop pill for time tracking on a single item.

import { Play, Square } from 'lucide-react';
import { LiveDuration } from './LiveDuration';

export const TimerButton = ({ isActive, disabled, activeStartTime, onStart, onStop, compact = false }) => {
  if (isActive) {
    return (
      <button className="pd-timer-btn active" onClick={onStop} title="Stop and log work">
        <Square size={11} fill="currentColor" />
        {!compact && (
          <span className="pd-mono">
            {activeStartTime ? <LiveDuration startTime={activeStartTime} format="live" /> : '00:00:00'}
          </span>
        )}
      </button>
    );
  }
  return (
    <button className="pd-timer-btn" onClick={onStart} disabled={disabled} title={disabled ? 'Stop the running timer first' : 'Start working — begin timer'}>
      <Play size={11} fill="currentColor" />
      {!compact && <span>Start</span>}
    </button>
  );
};
