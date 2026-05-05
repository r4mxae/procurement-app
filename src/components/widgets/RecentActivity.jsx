import { Activity } from 'lucide-react';
import { Empty } from '../common/Empty';

function Widget_RecentActivity({ data }) {
  const items = (data.activity || []).slice(0, 8);
  return (
    <div className="pd-card p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="pd-display text-xl sm:text-2xl font-medium">Recent Activity</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Latest events</p>
        </div>
        <Activity size={18} style={{ color: 'var(--text-muted)' }} />
      </div>
      {items.length === 0 ? (
        <Empty icon={Activity} title="No activity yet" hint="Actions will show up here" />
      ) : (
        <div className="space-y-3">
          {items.map(a => (
            <div key={a.id} className="flex items-start gap-2.5 text-xs">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent)' }} />
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ color: 'var(--text)' }}>{a.message}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  {new Date(a.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Widget_RecentActivity;
