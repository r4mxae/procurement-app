import React, { useMemo, useState } from 'react';
import { FileText, Plus, Search } from 'lucide-react';
import { Empty } from '../components/common/Empty';
import { FilterTabs } from '../components/common/FilterTabs';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { TenderCard } from '../components/tenders/TenderCard';
import { TenderForm } from '../components/tenders/TenderForm';
import { TENDER_STAGES } from '../constants/domain';

function TendersView({ data, upsertTender, deleteTender, activeTimer, onStartTimer, onStopTimer, onViewLogs, onViewAttachments }) {
  const [stage, setStage] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => data.tenders
    .filter(t => stage === 'all' || t.stage === stage)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.reference || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(a.deadline || '2999-01-01') - new Date(b.deadline || '2999-01-01')),
    [data.tenders, stage, search]);

  const counts = useMemo(() => TENDER_STAGES.reduce(
    (acc, s) => { acc[s.id] = data.tenders.filter(t => t.stage === s.id).length; return acc; },
    { all: data.tenders.length }
  ), [data.tenders]);

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 pb-16">
      <PageHeader
        title="Tenders"
        subtitle="Track tender lifecycle from draft to award"
        action={<button className="pd-btn pd-btn-primary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2" onClick={() => setAdding(true)}><Plus size={15} /> New Tender</button>}
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <FilterTabs
          options={[
            { id: 'all', label: 'All', count: counts.all },
            ...TENDER_STAGES.map(s => ({ id: s.id, label: s.label, count: counts[s.id] }))
          ]}
          value={stage}
          onChange={setStage}
        />
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="pd-input rounded-lg pl-9 pr-3 py-2 text-sm w-full" placeholder="Search tenders…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon={FileText} title="No tenders here" hint={search || stage !== 'all' ? 'Try adjusting your filters' : 'Click "New Tender" to add one'} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((t, i) => {
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
                onEdit={() => setEditing(t)}
                onDelete={() => { if (confirm(`Delete tender "${t.title}"?`)) deleteTender(t.id); }}
              />
            );
          })}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="New Tender">
        <TenderForm onSubmit={(d) => { upsertTender(d); setAdding(false); }} onCancel={() => setAdding(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Tender">
        {editing && <TenderForm initial={editing} onSubmit={(d) => { upsertTender({ ...editing, ...d }); setEditing(null); }} onCancel={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}

export default TendersView;
