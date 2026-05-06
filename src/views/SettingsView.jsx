import React, { useEffect, useRef, useState } from 'react';
import { Activity, CalendarDays, Check, Database, Download, Eye, Globe, Layers, Palette, RotateCcw, Save, Settings, SlidersHorizontal, Trash2, Upload, User, X } from 'lucide-react';
import { Field } from '../components/common/Field';
import { PageHeader } from '../components/common/PageHeader';
import { TargetEditorBody } from '../components/modals/TargetEditorBody';
import { DataAction } from '../components/settings/DataAction';
import { DataStat } from '../components/settings/DataStat';
import { SettingsSection } from '../components/settings/SettingsSection';
import { DEFAULT_SLA_PRESETS, DEFAULT_WORK_WEEK, PRIORITIES, SAVINGS_CATEGORIES, SLA_TYPES, TASK_CATEGORIES, WEEKDAYS } from '../constants/domain';
import { ACCENT_PRESETS, CURRENCIES, DATE_FORMATS, THEMES } from '../constants/locale';
import { fmtDate, fmtMoneyExact, todayISO } from '../lib/format';

function SettingsView({ data, theme, setTheme, updateProfile, updateSettings, replaceData, resetToDemo, clearAll }) {
  const settings = data.settings || {};
  const profile = data.profile || {};
  const fileRef = useRef(null);

  const [name, setName] = useState(profile.name || '');
  const [role, setRole] = useState(profile.role || '');
  const [targetDraft, setTargetDraft] = useState({
    targetMode: profile.targetMode || 'absolute',
    annualTarget: profile.annualTarget ?? 500000,
    targetPercentage: profile.targetPercentage ?? 8
  });
  const [profileSaved, setProfileSaved] = useState(false);

  const [newTaskCat, setNewTaskCat] = useState('');
  const [newSavingsCat, setNewSavingsCat] = useState('');

  // sync local edits if data changes externally (e.g., after import)
  useEffect(() => {
    setName(profile.name || '');
    setRole(profile.role || '');
    setTargetDraft({
      targetMode: profile.targetMode || 'absolute',
      annualTarget: profile.annualTarget ?? 500000,
      targetPercentage: profile.targetPercentage ?? 8
    });
  }, [profile.name, profile.role, profile.targetMode, profile.annualTarget, profile.targetPercentage]);

  const saveProfile = () => {
    updateProfile({
      name,
      role,
      targetMode: targetDraft.targetMode,
      annualTarget: Number(targetDraft.annualTarget) || 0,
      targetPercentage: Number(targetDraft.targetPercentage) || 0
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 1800);
  };

  const addCategory = (kind) => {
    if (kind === 'task') {
      const v = newTaskCat.trim();
      if (!v) return;
      const list = settings.customTaskCategories || [];
      if (list.includes(v) || TASK_CATEGORIES.includes(v)) { setNewTaskCat(''); return; }
      updateSettings({ customTaskCategories: [...list, v] });
      setNewTaskCat('');
    } else {
      const v = newSavingsCat.trim();
      if (!v) return;
      const list = settings.customSavingsCategories || [];
      if (list.includes(v) || SAVINGS_CATEGORIES.includes(v)) { setNewSavingsCat(''); return; }
      updateSettings({ customSavingsCategories: [...list, v] });
      setNewSavingsCat('');
    }
  };

  const removeCategory = (kind, value) => {
    if (kind === 'task') {
      updateSettings({ customTaskCategories: (settings.customTaskCategories || []).filter(c => c !== value) });
    } else {
      updateSettings({ customSavingsCategories: (settings.customSavingsCategories || []).filter(c => c !== value) });
    }
  };

  const handleImportClick = () => fileRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    // Cap import to 10 MB — localStorage can't fit much more anyway, and an
    // unbounded file.text() can freeze the tab on large blobs.
    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      alert(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`);
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('File does not contain a workspace object');
      }
      // Reject obviously wrong shapes early — replaceData also coerces, but a
      // file with none of the expected keys is almost certainly the wrong file.
      const expectedKeys = ['tasks', 'tenders', 'savings', 'activity', 'profile', 'settings'];
      const hasAny = expectedKeys.some(k => k in parsed);
      if (!hasAny) throw new Error('File is not a recognized workspace backup');
      if (!confirm(`Import data from "${file.name}"? This replaces your current workspace.`)) return;
      replaceData(parsed);
    } catch (err) {
      alert('Could not import: ' + (err.message || 'invalid JSON'));
    }
  };

  const counts = {
    tasks: data.tasks.length,
    tenders: data.tenders.length,
    savings: data.savings.length,
    activity: data.activity.length
  };

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 pb-16 max-w-4xl">
      <PageHeader title="Settings" subtitle="Personalize your workspace and manage your data" />

      {/* PROFILE */}
      <SettingsSection icon={User} title="Profile" description="Your identity and personal targets">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <Field label="Display name">
            <input className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Role / title">
            <input className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Buyer" />
          </Field>
        </div>

        <div className="pd-divider mb-5" />

        <div className="mb-1 flex items-baseline justify-between">
          <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Annual savings target</div>
          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Absolute amount or % of your tender budget</span>
        </div>
        <div className="mt-2">
          <TargetEditorBody draft={targetDraft} setDraft={setTargetDraft} tenders={data.tenders} />
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button className="pd-btn pd-btn-primary px-4 py-2 rounded-lg text-sm" onClick={saveProfile}>Save Profile</button>
          {profileSaved && (
            <span className="text-xs flex items-center gap-1.5 pd-anim-in" style={{ color: 'var(--success)' }}>
              <Check size={13} /> Saved
            </span>
          )}
        </div>
      </SettingsSection>

      {/* APPEARANCE */}
      <SettingsSection icon={Palette} title="Appearance" description="Theme and accent color">
        <div className="mb-5">
          <div className="text-xs uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>Theme</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {THEMES.map(t => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: active ? 'var(--accent-soft)' : 'var(--surface-2)',
                    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    transform: active ? 'translateY(-1px)' : 'none'
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; } }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ background: t.dot }} />
                    <span className="text-sm font-medium">{t.name}</span>
                    {active && <Check size={14} style={{ color: 'var(--accent)', marginLeft: 'auto' }} />}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t.hint}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>Accent color</div>
          <div className="flex flex-wrap gap-2">
            {ACCENT_PRESETS.map(p => {
              const active = (settings.accentPreset || 'theme') === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => updateSettings({ accentPreset: p.id })}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
                  style={{
                    background: active ? 'var(--accent-soft)' : 'var(--surface-2)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    color: 'var(--text)'
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{
                      background: p.color || 'linear-gradient(135deg, #d4a574, #2a7e76, #e8889a, #d4946b)',
                      border: '1.5px solid var(--surface)'
                    }}
                  />
                  <span>{p.name}</span>
                  {active && <Check size={11} style={{ color: 'var(--accent)' }} />}
                </button>
              );
            })}
          </div>
        </div>
      </SettingsSection>

      {/* ACCESSIBILITY */}
      <SettingsSection icon={Eye} title="Accessibility" description="Customize text for easier reading">
        <div className="mb-5">
          <div className="text-xs uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>Text size</div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'regular', label: 'Regular', sample: 'Aa', size: 16 },
              { id: 'large', label: 'Large', sample: 'Aa', size: 19 },
              { id: 'xl', label: 'Extra Large', sample: 'Aa', size: 22 }
            ].map(opt => {
              const active = (settings.textSize || 'regular') === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => updateSettings({ textSize: opt.id })}
                  className="p-4 rounded-xl text-left transition-all flex items-center gap-3"
                  style={{
                    background: active ? 'var(--accent-soft)' : 'var(--surface-2)',
                    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    transform: active ? 'translateY(-1px)' : 'none'
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; } }}
                >
                  <span className="pd-display flex items-center justify-center shrink-0" style={{
                    fontSize: `${opt.size}px`,
                    width: 40, height: 40,
                    borderRadius: 10,
                    background: active ? 'var(--accent)' : 'var(--surface-3)',
                    color: active ? 'var(--bg)' : 'var(--text)',
                    fontWeight: 500
                  }}>{opt.sample}</span>
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {opt.id === 'regular' ? 'Default' : opt.id === 'large' ? '+15%' : '+30%'}
                    </div>
                  </div>
                  {active && <Check size={14} style={{ color: 'var(--accent)', marginLeft: 'auto' }} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-2">
          <div className="text-xs uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>Text weight</div>
          <button
            onClick={() => updateSettings({ boldText: !settings.boldText })}
            className="w-full p-4 rounded-xl text-left transition-all flex items-center gap-4"
            style={{
              background: settings.boldText ? 'var(--accent-soft)' : 'var(--surface-2)',
              border: `1.5px solid ${settings.boldText ? 'var(--accent)' : 'var(--border)'}`
            }}
            onMouseEnter={(e) => { if (!settings.boldText) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={(e) => { if (!settings.boldText) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <span className="flex items-center justify-center shrink-0" style={{
              width: 40, height: 40,
              borderRadius: 10,
              background: settings.boldText ? 'var(--accent)' : 'var(--surface-3)',
              color: settings.boldText ? 'var(--bg)' : 'var(--text)',
              fontWeight: settings.boldText ? 800 : 400,
              fontSize: 18,
              fontFamily: "'Outfit', sans-serif"
            }}>B</span>
            <div className="flex-1">
              <div className="text-sm font-medium">Bold text everywhere</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Increases font weight across the app for better legibility
              </div>
            </div>
            <div
              className="relative shrink-0"
              style={{
                width: 36, height: 22,
                borderRadius: 11,
                background: settings.boldText ? 'var(--accent)' : 'var(--surface-3)',
                transition: 'background 0.2s ease'
              }}
            >
              <span style={{
                position: 'absolute',
                top: 2, left: settings.boldText ? 16 : 2,
                width: 18, height: 18,
                borderRadius: 9,
                background: 'var(--bg)',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </div>
          </button>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>
            Tip: combine Bold text with one of the <span style={{ color: 'var(--text)' }}>Mono</span> themes above (light or dark) for the highest-contrast, most-readable layout.
          </p>
        </div>
      </SettingsSection>

      {/* LOCALIZATION */}
      <SettingsSection icon={Globe} title="Localization" description="Currency and date display">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Currency">
            <select className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={settings.currency || 'USD'} onChange={(e) => updateSettings({ currency: e.target.value })}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.label} ({c.symbol.trim()})</option>)}
            </select>
          </Field>
          <Field label="Date format">
            <select className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={settings.dateFormat || 'medium'} onChange={(e) => updateSettings({ dateFormat: e.target.value })}>
              {DATE_FORMATS.map(d => <option key={d.id} value={d.id}>{d.label} — {d.sample}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-3 px-4 py-3 rounded-lg flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Live preview</span>
          <span className="text-sm pd-mono">
            <span style={{ color: 'var(--accent)' }}>{fmtMoneyExact(125400)}</span>
            <span className="mx-2" style={{ color: 'var(--text-faint)' }}>·</span>
            <span style={{ color: 'var(--text)' }}>{fmtDate(todayISO())}</span>
          </span>
        </div>
      </SettingsSection>

      {/* WORKFLOW */}
      <SettingsSection icon={SlidersHorizontal} title="Workflow" description="Defaults and notification thresholds">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={`Urgent deadline threshold (${settings.urgentDaysThreshold || 3} days)`}>
            <input
              type="range"
              min="1"
              max="14"
              value={settings.urgentDaysThreshold || 3}
              onChange={(e) => updateSettings({ urgentDaysThreshold: Number(e.target.value) })}
              className="w-full"
              style={{ accentColor: 'var(--accent)' }}
            />
            <div className="flex justify-between text-[10px] mt-1 pd-mono" style={{ color: 'var(--text-faint)' }}>
              <span>1 day</span><span>7 days</span><span>14 days</span>
            </div>
          </Field>
          <Field label="Default task priority">
            <select className="pd-input rounded-lg px-3 py-2 text-sm w-full" value={settings.defaultTaskPriority || 'medium'} onChange={(e) => updateSettings({ defaultTaskPriority: e.target.value })}>
              {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Field>
        </div>
      </SettingsSection>

      {/* SLA & CALENDAR */}
      <SettingsSection icon={CalendarDays} title="SLA & calendar" description="Default SLAs per instrument, and what counts as a working day">
        <div className="mb-5">
          <div className="text-xs uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>SLA presets (working days)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SLA_TYPES.filter(t => t.id !== 'custom').map(t => {
              const presets = settings.slaPresets || DEFAULT_SLA_PRESETS;
              const value = presets[t.id] ?? DEFAULT_SLA_PRESETS[t.id];
              return (
                <Field key={t.id} label={`${t.label} · ${t.description}`}>
                  <input
                    type="number"
                    min="1"
                    className="pd-input rounded-lg px-3 py-2 text-sm w-full"
                    value={value}
                    onChange={(e) => {
                      const next = { ...presets, [t.id]: Math.max(1, Number(e.target.value) || 1) };
                      updateSettings({ slaPresets: next });
                    }}
                  />
                </Field>
              );
            })}
          </div>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>
            New tasks and tenders pick up these defaults; you can override per item or choose a Custom value.
          </p>
        </div>

        <div className="pd-divider mb-5" />

        <div>
          <div className="text-xs uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>Work week</div>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map(day => {
              const week = Array.isArray(settings.workWeek) && settings.workWeek.length > 0
                ? settings.workWeek
                : DEFAULT_WORK_WEEK;
              const active = week.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? week.filter(d => d !== day.id)
                      : [...week, day.id].sort((a, b) => a - b);
                    if (next.length === 0) return; // never allow zero working days
                    updateSettings({ workWeek: next });
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: active ? 'var(--accent-soft)' : 'var(--surface-2)',
                    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    minWidth: 56,
                  }}
                  title={day.long}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>
            Used to compute deadlines from SLA days — non-working days are skipped. Default is Mon–Fri.
          </p>
        </div>
      </SettingsSection>

      {/* CATEGORIES */}
      <SettingsSection icon={Layers} title="Custom Categories" description="Extend the built-in lists with your own">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Task categories</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {TASK_CATEGORIES.map(c => (
                <span key={c} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>{c}</span>
              ))}
              {(settings.customTaskCategories || []).map(c => (
                <span key={c} className="text-xs px-2 py-1 rounded flex items-center gap-1.5" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {c}
                  <button onClick={() => removeCategory('task', c)} className="hover:opacity-70"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="pd-input rounded-lg px-3 py-2 text-sm flex-1"
                value={newTaskCat}
                onChange={(e) => setNewTaskCat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory('task')}
                placeholder="Add a category…"
              />
              <button className="pd-btn pd-btn-ghost px-3 py-2 rounded-lg text-sm" onClick={() => addCategory('task')}>Add</button>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Savings categories</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SAVINGS_CATEGORIES.map(c => (
                <span key={c} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>{c}</span>
              ))}
              {(settings.customSavingsCategories || []).map(c => (
                <span key={c} className="text-xs px-2 py-1 rounded flex items-center gap-1.5" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {c}
                  <button onClick={() => removeCategory('savings', c)} className="hover:opacity-70"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="pd-input rounded-lg px-3 py-2 text-sm flex-1"
                value={newSavingsCat}
                onChange={(e) => setNewSavingsCat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory('savings')}
                placeholder="Add a category…"
              />
              <button className="pd-btn pd-btn-ghost px-3 py-2 rounded-lg text-sm" onClick={() => addCategory('savings')}>Add</button>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* DATA */}
      <SettingsSection icon={Database} title="Data Management" description="Backup, restore, and reset your workspace">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
          <DataStat label="Tasks" value={counts.tasks} />
          <DataStat label="Tenders" value={counts.tenders} />
          <DataStat label="Savings" value={counts.savings} />
          <DataStat label="Activity" value={counts.activity} />
        </div>

        <div className="space-y-2">
          <DataAction
            icon={Download}
            title="Export workspace"
            description="Download all data as a JSON backup"
            actionLabel="Export"
            onAction={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `procurement-backup-${todayISO()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          />
          <DataAction
            icon={Upload}
            title="Import workspace"
            description="Restore from a previously exported backup file"
            actionLabel="Choose File"
            onAction={handleImportClick}
          />
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />
          <DataAction
            icon={RotateCcw}
            title="Reset to demo data"
            description="Replace your workspace with the original sample data"
            actionLabel="Reset"
            onAction={() => { if (confirm('This will replace all current data with demo content. Continue?')) resetToDemo(); }}
          />
          <DataAction
            icon={Trash2}
            title="Clear all data"
            description="Remove every task, tender, savings entry, and log line"
            actionLabel="Clear All"
            danger
            onAction={() => {
              if (!confirm('This permanently removes all your data. Are you sure?')) return;
              if (!confirm('This action cannot be undone. Proceed?')) return;
              clearAll();
            }}
          />
        </div>
      </SettingsSection>

      <div className="text-center mt-8 text-xs" style={{ color: 'var(--text-faint)' }}>
        ProcTrax Workspace · Settings save automatically
      </div>
    </div>
  );
}

export default SettingsView;
