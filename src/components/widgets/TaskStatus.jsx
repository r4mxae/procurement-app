import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { TASK_STATUSES } from '../../constants/domain';

function Widget_TaskStatus({ data }) {
  const taskStatusData = TASK_STATUSES.map(s => ({ name: s.label, value: data.tasks.filter(t => t.status === s.id).length }));
  const colors = ['var(--info)', 'var(--warning)', 'var(--success)'];
  return (
    <div className="pd-card p-5 sm:p-6 h-full">
      <h3 className="pd-display text-xl sm:text-2xl font-medium">Task Status</h3>
      <p className="text-xs mt-0.5 mb-4" style={{ color: 'var(--text-muted)' }}>Current distribution</p>
      <div style={{ width: '100%', height: 160 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={taskStatusData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
              {taskStatusData.map((entry, i) => <Cell key={entry.name} fill={colors[i]} stroke="var(--surface)" strokeWidth={2} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 10, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 mt-2">
        {taskStatusData.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ background: colors[i] }} />
            <span className="flex-1" style={{ color: 'var(--text-muted)' }}>{item.name}</span>
            <span className="pd-mono font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Widget_TaskStatus;
