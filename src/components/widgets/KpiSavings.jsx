import { DollarSign } from 'lucide-react';
import { computeTarget, fmtMoney, fmtMoneyExact } from '../../lib/format';
import { KpiCard } from '../dashboard/KpiCard';

function Widget_KpiSavings({ data }) {
  const today = new Date();
  const ytd = data.savings.filter(s => new Date(s.date).getFullYear() === today.getFullYear()).reduce((sum, s) => sum + Number(s.amount), 0);
  const target = computeTarget(data.profile, data.tenders);
  const targetPct = target > 0 ? Math.min(100, Math.round((ytd / target) * 100)) : 0;
  return <KpiCard label="YTD Savings" value={fmtMoneyExact(ytd)} sub={`${targetPct}% of annual target`} icon={DollarSign} delta="up" deltaText={`vs ${fmtMoney(target)} goal`} accent />;
}

export default Widget_KpiSavings;
