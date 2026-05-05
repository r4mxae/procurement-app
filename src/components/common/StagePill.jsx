// Tender lifecycle stage pill (Draft → Closed).

import { TENDER_STAGES } from '../../constants/domain';
import { Pill } from './Pill';

export const StagePill = ({ stage }) => {
  const map = {
    draft: { color: 'var(--text-muted)', bg: 'var(--surface-2)' },
    published: { color: 'var(--info)', bg: 'rgba(123, 167, 196, 0.12)' },
    evaluation: { color: 'var(--warning)', bg: 'rgba(224, 182, 111, 0.12)' },
    awarded: { color: 'var(--success)', bg: 'rgba(126, 184, 134, 0.12)' },
    closed: { color: 'var(--text-faint)', bg: 'var(--surface-2)' }
  };
  const s = map[stage] || map.draft;
  const label = TENDER_STAGES.find(t => t.id === stage)?.label || stage;
  return <Pill color={s.color} bg={s.bg}>{label}</Pill>;
};
