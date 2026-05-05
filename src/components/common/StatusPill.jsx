// Task status pill (To Do / In Progress / Completed).

import { Pill } from './Pill';

export const StatusPill = ({ status }) => {
  const map = {
    todo: { label: 'To Do', color: 'var(--info)', bg: 'rgba(123, 167, 196, 0.12)' },
    in_progress: { label: 'In Progress', color: 'var(--warning)', bg: 'rgba(224, 182, 111, 0.12)' },
    completed: { label: 'Completed', color: 'var(--success)', bg: 'rgba(126, 184, 134, 0.12)' }
  };
  const s = map[status] || map.todo;
  return <Pill color={s.color} bg={s.bg}>{s.label}</Pill>;
};
