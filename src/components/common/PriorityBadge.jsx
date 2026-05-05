// Priority pill — colors keyed by criticality.

import { Flame } from 'lucide-react';

export const PriorityBadge = ({ priority }) => {
  const styles = {
    critical: { label: 'Critical', color: 'var(--danger)' },
    high: { label: 'High', color: 'var(--warning)' },
    medium: { label: 'Medium', color: 'var(--info)' },
    low: { label: 'Low', color: 'var(--text-muted)' }
  };
  const s = styles[priority] || styles.medium;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: s.color }}>
      <Flame size={11} />
      {s.label}
    </span>
  );
};
