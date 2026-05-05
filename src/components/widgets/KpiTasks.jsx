import { ClipboardList } from 'lucide-react';
import { KpiCard } from '../dashboard/KpiCard';

function Widget_KpiTasks({ data }) {
  const activeTasks = data.tasks.filter(t => t.status !== 'completed').length;
  const completedTasks = data.tasks.filter(t => t.status === 'completed').length;
  const completionRate = data.tasks.length > 0 ? Math.round((completedTasks / data.tasks.length) * 100) : 0;
  return <KpiCard label="Active Tasks" value={activeTasks} sub={`${completionRate}% completion rate`} icon={ClipboardList} delta={completionRate >= 50 ? 'up' : 'down'} deltaText={`${completedTasks} done`} />;
}

export default Widget_KpiTasks;
