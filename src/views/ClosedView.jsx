// Closed view — completed tasks and closed/awarded tenders in one place.
//
// The Tasks and Tenders tabs are intentionally focused on open work; this
// view exists so the user can still browse, edit, view logs, and manage
// attachments on items that have been wrapped up. Same row components and
// edit modals as the source tabs to keep the visual language consistent.

import React, { useMemo, useState } from 'react';
import { Archive, Search } from 'lucide-react';
import { Empty } from '../components/common/Empty';
import { FilterTabs } from '../components/common/FilterTabs';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskRow } from '../components/tasks/TaskRow';
import { TenderCard } from '../components/tenders/TenderCard';
import { TenderForm } from '../components/tenders/TenderForm';

const CLOSED_TENDER_STAGES = ['closed', 'awarded'];

function ClosedView({
  data,
  upsertTask,
  updateTaskStatus,
  deleteTask,
  upsertTender,
  deleteTender,
  activeTimer,
  onStartTimer,
  onStopTimer,
  onViewLogs,
  onViewAttachments,
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editingTender, setEditingTender] = useState(null);

  const completedTasks = useMemo(
    () => data.tasks.filter(t => t.status === 'completed'),
    [data.tasks]
  );
  const closedTenders = useMemo(
    () => data.tenders.filter(t => CLOSED_TENDER_STAGES.includes(t.stage)),
    [data.tenders]
  );

  // Sort by completion/deadline date desc — most recent first.
  const filteredTasks = useMemo(() => completedTasks
    .filter(() => filter === 'all' || filter === 'tasks')
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.completedAt || b.deadline || 0) - new Date(a.completedAt || a.deadline || 0)),
    [completedTasks, filter, search]);

  const filteredTenders = useMemo(() => closedTenders
    .filter(() => filter === 'all' || filter === 'tenders')
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.reference || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.deadline || b.createdAt || 0) - new Date(a.deadline || a.createdAt || 0)),
    [closedTenders, filter, search]);

  const counts = useMemo(() => ({
    all: completedTasks.length + closedTenders.length,
    tasks: completedTasks.length,
    tenders: closedTenders.length,
  }), [completedTasks, closedTenders]);

  const totalShown = filteredTasks.length + filteredTenders.length;

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 pb-16">
      <PageHeader
        title="Closed"
        subtitle="Completed tasks and closed tenders — still editable, still searchable"
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <FilterTabs
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'tasks', label: 'Tasks', count: counts.tasks },
            { id: 'tenders', label: 'Tenders', count: counts.tenders },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="pd-input rounded-lg pl-9 pr-3 py-2 text-sm w-full"
            placeholder="Search closed work…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {totalShown === 0 ? (
        <Empty
          icon={Archive}
          title="Nothing closed yet"
          hint={search || filter !== 'all' ? 'Try adjusting your filters' : 'Completed tasks and closed tenders will land here'}
        />
      ) : (
        <div className="space-y-8">
          {filteredTenders.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="pd-display text-lg font-medium">Tenders</h2>
                <span className="text-xs pd-mono" style={{ color: 'var(--text-faint)' }}>
                  {filteredTenders.length} closed
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTenders.map((t, i) => {
                  const isActive = activeTimer?.kind === 'tender' && activeTimer?.itemId === t.id;
                  return (
                    <TenderCard
                      key={t.id}
                      tender={t}
                      index={i}
                      isActiveTimer={isActive}
                      activeStartTime={isActive ? activeTimer.startTime : null}
                      hasOtherTimer={!!activeTimer && !isActive}
                      onStartTimer={() => onStartTimer('tender', t.id)}
                      onStopTimer={onStopTimer}
                      onViewLogs={() => onViewLogs('tender', t.id)}
                      onViewAttachments={() => onViewAttachments('tender', t.id)}
                      onEdit={() => setEditingTender(t)}
                      onDelete={() => { if (confirm(`Delete tender "${t.title}"?`)) deleteTender(t.id); }}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {filteredTasks.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="pd-display text-lg font-medium">Tasks</h2>
                <span className="text-xs pd-mono" style={{ color: 'var(--text-faint)' }}>
                  {filteredTasks.length} completed
                </span>
              </div>
              <div className="space-y-2">
                {filteredTasks.map((t, i) => {
                  const isActive = activeTimer?.kind === 'task' && activeTimer?.itemId === t.id;
                  return (
                    <TaskRow
                      key={t.id}
                      task={t}
                      index={i}
                      isActiveTimer={isActive}
                      activeStartTime={isActive ? activeTimer.startTime : null}
                      hasOtherTimer={!!activeTimer && !isActive}
                      onStartTimer={() => onStartTimer('task', t.id)}
                      onStopTimer={onStopTimer}
                      onViewLogs={() => onViewLogs('task', t.id)}
                      onViewAttachments={() => onViewAttachments('task', t.id)}
                      onStatusChange={(s) => updateTaskStatus(t.id, s)}
                      onEdit={() => setEditingTask(t)}
                      onDelete={() => { if (confirm(`Delete task "${t.title}"?`)) deleteTask(t.id); }}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task">
        {editingTask && <TaskForm settings={data.settings} initial={editingTask} onSubmit={(d) => { upsertTask({ ...editingTask, ...d }); setEditingTask(null); }} onCancel={() => setEditingTask(null)} />}
      </Modal>
      <Modal open={!!editingTender} onClose={() => setEditingTender(null)} title="Edit Tender">
        {editingTender && <TenderForm settings={data.settings} initial={editingTender} onSubmit={(d) => { upsertTender({ ...editingTender, ...d }); setEditingTender(null); }} onCancel={() => setEditingTender(null)} />}
      </Modal>
    </div>
  );
}

export default ClosedView;
