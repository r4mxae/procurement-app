import { Award } from 'lucide-react';
import { KpiCard } from '../dashboard/KpiCard';

function Widget_KpiPerformance({ data }) {
  const completedTasks = data.tasks.filter(t => t.status === 'completed').length;
  const completionRate = data.tasks.length > 0 ? Math.round((completedTasks / data.tasks.length) * 100) : 0;
  return <KpiCard label="Avg Performance" value={`${completionRate}%`} sub="Task completion" icon={Award} delta={completionRate >= 70 ? 'up' : 'down'} deltaText="this period" />;
}

export default Widget_KpiPerformance;
