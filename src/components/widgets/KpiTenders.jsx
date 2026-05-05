import { FileText } from 'lucide-react';
import { fmtMoney } from '../../lib/format';
import { KpiCard } from '../dashboard/KpiCard';

function Widget_KpiTenders({ data }) {
  const activeTenders = data.tenders.filter(t => !['closed'].includes(t.stage)).length;
  const totalTenderValue = data.tenders.filter(t => !['closed'].includes(t.stage)).reduce((s, t) => s + Number(t.value || 0), 0);
  return <KpiCard label="Active Tenders" value={activeTenders} sub={`${fmtMoney(totalTenderValue)} value`} icon={FileText} delta="up" deltaText="In pipeline" />;
}

export default Widget_KpiTenders;
