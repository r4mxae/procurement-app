// Interactive feature guide.
//
// Each chapter is an expandable card; the steps inside can include a
// "Try this" call-to-action that jumps straight to the relevant view via
// the setView prop. Per-chapter "mark as read" state is tracked locally
// (not synced to the DB) since it's a per-device, per-user-preference
// thing — different from workspace data.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, Archive, BookOpen, Camera, Check, CheckCircle2, ChevronDown, ChevronRight,
  ClipboardList, DollarSign, FileSpreadsheet, FileText, LayoutDashboard, Lightbulb,
  ListChecks, Paperclip, Play, Search, Settings as SettingsIcon, Sparkles, Timer, TrendingUp,
} from 'lucide-react';
import { Empty } from '../components/common/Empty';
import { PageHeader } from '../components/common/PageHeader';
import { storage } from '../lib/storage';
import { GUIDE_PROGRESS_KEY } from '../constants/storage';
import { useTour } from '../lib/tourContext';

// ─── Chapter content ────────────────────────────────────────────
// Keep this declarative — the renderer below knows nothing about the
// specifics. Add a chapter by appending an entry; it'll show up in the
// grid, count toward progress, and be searchable automatically.
const buildChapters = ({ goTo }) => [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Welcome to ProcTrax',
    summary: 'A 60-second tour of what the app does and how the pieces fit together.',
    estReadMin: 1,
    tourKey: 'getting-started',
    body: [
      {
        title: 'What this app is for',
        text: 'ProcTrax is a personal procurement workspace. You track your day-to-day tasks (RFQs, vendor follow-ups, reviews) and your live tenders side by side, capture time you spend on each, and see savings auto-calculated from the offers you collected.',
      },
      {
        title: 'The core ideas',
        text: 'Three nouns drive everything: Tasks (small chunks of work), Tenders (lifecycle items with stages and offers), and Savings (auto-derived from tender offers). Time logs and attachments hang off both tasks and tenders.',
      },
      {
        title: 'Where to start',
        text: 'Open the Dashboard for the at-a-glance view, then jump into Tasks or Tenders to add your first item. Everything else (Savings, Performance, Closed) populates itself from your tasks and tenders.',
        tryLabel: 'Open the Dashboard',
        onTry: () => goTo('dashboard'),
      },
    ],
    tips: [
      'Your data lives in your own Supabase row — only you can read or write it.',
      'The collapsed sidebar (chevron at top) gives you more horizontal room on smaller screens.',
    ],
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    summary: 'KPIs, upcoming deadlines, recent activity — your morning landing page.',
    estReadMin: 1,
    body: [
      {
        title: 'KPI strip',
        text: 'The top cards summarize open work, savings YTD, target progress, and time logged. They update live as you change tasks or tenders.',
      },
      {
        title: 'Widgets below',
        text: 'Upcoming deadlines, recent activity, and tender pipeline. Each widget links to the relevant view when you click an item.',
      },
      {
        title: 'When to use it',
        text: 'Start your day here. If something is overdue or about to be, you\'ll see it before opening another tab.',
        tryLabel: 'Go to Dashboard',
        onTry: () => goTo('dashboard'),
      },
    ],
  },
  {
    id: 'work',
    icon: ListChecks,
    title: 'All Work',
    summary: 'A unified inbox of every open task and tender, with timer access on each row.',
    estReadMin: 1,
    body: [
      {
        title: 'Filter chips',
        text: 'All / Open / Tasks / Tenders / With logs. Combine with the search box to narrow down quickly.',
      },
      {
        title: 'Time tracking from the row',
        text: 'Hit the timer button on any row to start tracking; the active timer persists across views and even across sessions until you stop or log it.',
      },
      {
        title: 'Why it exists',
        text: 'Lets you scan everything regardless of type. Useful when you don\'t care whether something is a task or tender, just what\'s next.',
        tryLabel: 'Open All Work',
        onTry: () => goTo('work'),
      },
    ],
  },
  {
    id: 'tasks',
    icon: ClipboardList,
    title: 'Tasks',
    summary: 'Day-to-day work items: priorities, statuses, SLAs, time logs, and attachments.',
    estReadMin: 2,
    tourKey: 'tasks-tour',
    body: [
      {
        title: 'Creating a task',
        text: 'Click "New Task". Title and priority are required; everything else is optional. Pick an SLA type (RFQ / VO / RFI / RFP / Custom) and the deadline is computed for you using your work week.',
      },
      {
        title: 'Status lifecycle',
        text: 'Click the round status checkbox on the left of any row to cycle: To Do → In Progress → Completed → To Do. Completed tasks move out of the Tasks tab and into Closed.',
      },
      {
        title: 'Priorities and sort',
        text: 'Critical → High → Medium → Low, with the most urgent at the top. Within a priority bucket, items sort by deadline ascending.',
      },
      {
        title: 'Try it',
        text: 'Open the Tasks view and add a quick test task to see the SLA picker auto-fill the deadline.',
        tryLabel: 'Open Tasks',
        onTry: () => goTo('tasks'),
      },
    ],
    tips: [
      'You can run a timer on a task while it\'s in any status — even Completed, in case you need to revisit.',
      'Attaching a file to a task is the easiest way to keep the source PO or quote next to the work.',
    ],
  },
  {
    id: 'tenders',
    icon: FileText,
    title: 'Tenders',
    summary: 'Lifecycle items with stages, budget, vendor count, and the inputs for savings.',
    estReadMin: 2,
    tourKey: 'tenders-tour',
    body: [
      {
        title: 'Stages',
        text: 'Draft → Published → Evaluation → Awarded → Closed. Awarded and Closed tenders leave the Tenders tab and appear under Closed.',
      },
      {
        title: 'Commercial offers',
        text: 'Fill in First commercial offer and Final commercial offer once you have them — usually at Evaluation or Awarded stage. Both numbers feed the Savings tab.',
      },
      {
        title: 'Budgeted amount',
        text: 'The "Budgeted amount" field is your internal target for the tender. Savings vs Budget compares this to the final offer.',
      },
      {
        title: 'Try it',
        text: 'Open Tenders and create or edit one. The form shows a live preview of both savings calculations as you type.',
        tryLabel: 'Open Tenders',
        onTry: () => goTo('tenders'),
      },
    ],
    tips: [
      'Reference field is optional but useful — it shows up in the Savings export and makes tenders easy to grep.',
      'Setting an SLA on a tender computes a deadline that auto-skips weekends or whichever days you marked as non-working.',
    ],
  },
  {
    id: 'closed',
    icon: Archive,
    title: 'Closed tab',
    summary: 'Where completed tasks and closed/awarded tenders live. Still editable, still searchable.',
    estReadMin: 1,
    body: [
      {
        title: 'What lands here',
        text: 'Tasks marked Completed and tenders in Awarded or Closed stage. They leave the focused Tasks/Tenders tabs so those stay clean.',
      },
      {
        title: 'You can still edit',
        text: 'Open a closed item to update offers (so savings recalculate), add attachments, or fix a typo. Same edit modal as the open tabs.',
        tryLabel: 'Open Closed',
        onTry: () => goTo('closed'),
      },
    ],
  },
  {
    id: 'savings',
    icon: DollarSign,
    title: 'Savings (auto-derived)',
    summary: 'Two views of the same numbers: vs first offer (negotiation) and vs budget (under-plan).',
    estReadMin: 2,
    tourKey: 'savings-tour',
    body: [
      {
        title: 'No manual logging',
        text: 'Savings come from your tenders. The instant a tender has both a final offer and a first offer (or a budget), it shows up in the relevant tab and the totals update.',
      },
      {
        title: 'vs First Offer',
        text: 'first offer minus final offer — what your negotiation extracted.',
      },
      {
        title: 'vs Budget',
        text: 'budgeted amount minus final offer — what you kept under plan.',
      },
      {
        title: 'Exports',
        text: 'Excel export gives you a 2-sheet workbook with every contributing tender and the math. Snapshot grabs a PNG of the visible dashboard for sharing in chat or a deck.',
        tryLabel: 'Open Savings',
        onTry: () => goTo('savings'),
      },
    ],
    tips: [
      'Negative numbers (over-budget / over-first-offer) are kept and shown in red — useful for spotting exposure, not just wins.',
      'Set your annual savings target via the gear icon on the third KPI card; the percentage achieved updates live.',
    ],
  },
  {
    id: 'time-logs',
    icon: Timer,
    title: 'Time tracking & work logs',
    summary: 'Start/stop timers on any task or tender; log session notes when you stop.',
    estReadMin: 1,
    body: [
      {
        title: 'Starting a timer',
        text: 'Click the play icon on any task/tender row. Only one timer can run at a time — starting a second one prompts you to stop the first.',
      },
      {
        title: 'Logging progress vs stopping',
        text: 'The active-timer banner across the top has both. "Log progress" saves a session and immediately starts a fresh one (useful for breaking up a long block); "Stop" ends the timer and asks you for a single log note.',
      },
      {
        title: 'Viewing logs',
        text: 'On any row with logs, click the history icon (clock-with-arrow) to open the log list. From there you can export an Excel report scoped to that one item.',
        tryLabel: 'Open All Work',
        onTry: () => goTo('work'),
      },
    ],
    tips: [
      'Active timers persist across reload and sign-in — if you leave one running by mistake, it\'ll still be ticking when you come back.',
    ],
  },
  {
    id: 'attachments',
    icon: Paperclip,
    title: 'Attachments',
    summary: 'Upload project documents to any task or tender — at any stage, including after closing.',
    estReadMin: 1,
    body: [
      {
        title: 'Where the button is',
        text: 'Every task row and tender card has a paperclip icon next to the timer. The number badge tells you how many files are already attached.',
      },
      {
        title: 'Storage and privacy',
        text: 'Files live in a private Supabase Storage bucket scoped to your account by Row-Level Security. Other users cannot see your attachments even if they guess the path.',
      },
      {
        title: 'Open and download',
        text: 'Click a filename to open it in a new tab; click the download icon to force a download. Both use a short-lived signed URL (5 minutes).',
        tryLabel: 'Open All Work',
        onTry: () => goTo('work'),
      },
    ],
    tips: [
      'Single-file uploads are capped at 25 MB to stay friendly with the Supabase free tier.',
    ],
  },
  {
    id: 'performance',
    icon: TrendingUp,
    title: 'Performance',
    summary: 'On-time delivery rate, monthly throughput, and a vendor distribution view.',
    estReadMin: 1,
    body: [
      {
        title: 'On-time rate',
        text: 'Counts only tasks/tenders with a deadline. A completed item is on-time if its completedAt is on or before the deadline.',
      },
      {
        title: 'Monthly throughput',
        text: 'Bars show how many items completed each month over the last 12 months — a quick proxy for work velocity.',
        tryLabel: 'Open Performance',
        onTry: () => goTo('performance'),
      },
    ],
  },
  {
    id: 'activity',
    icon: Activity,
    title: 'Activity log',
    summary: 'Append-only audit feed of everything that happened in your workspace.',
    estReadMin: 1,
    body: [
      {
        title: 'What gets logged',
        text: 'Task and tender creates, updates, status changes, savings entries, attachments added/removed, timer starts and stops, settings actions like import/export.',
      },
      {
        title: 'Retention',
        text: 'A trigger keeps the last 200 entries per user; older ones are pruned automatically so the table doesn\'t grow forever.',
        tryLabel: 'Open Activity Log',
        onTry: () => goTo('activity'),
      },
    ],
  },
  {
    id: 'settings',
    icon: SettingsIcon,
    title: 'Settings',
    summary: 'Profile, theme/accent, accessibility, currency, SLA presets, work week, custom categories.',
    estReadMin: 2,
    tourKey: 'settings-tour',
    body: [
      {
        title: 'Profile and target',
        text: 'Set your display name, role, and annual savings target. The target can be either an absolute amount or a percentage of your tender budget.',
      },
      {
        title: 'Theme + accent',
        text: 'Six themes (3 dark + 2 light + Mono variants). Override the accent color independent of the theme if you want.',
      },
      {
        title: 'SLA & calendar',
        text: 'Tune the four default SLA day-counts (RFQ, VO, RFI, RFP) and define your work week. Mon–Fri is default; pick Sat/Sun if your org runs differently.',
      },
      {
        title: 'Localization',
        text: 'Currency symbol flows through every money field in the app. Date format affects all date displays.',
      },
      {
        title: 'Data management',
        text: 'Export your full workspace as JSON, import a backup, reset to demo data, or wipe everything.',
        tryLabel: 'Open Settings',
        onTry: () => goTo('settings'),
      },
    ],
    tips: [
      'Pair the Mono theme with Bold text for the highest-contrast layout — handy for projector demos.',
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────
function GuideView({ setView }) {
  const { startTour, hasTour } = useTour();
  const [readIds, setReadIds] = useState(new Set());
  const [openId, setOpenId] = useState(null);
  const [search, setSearch] = useState('');

  // Hydrate read state on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await storage.get(GUIDE_PROGRESS_KEY);
        if (cancelled || !res?.value) return;
        const arr = JSON.parse(res.value);
        if (Array.isArray(arr)) setReadIds(new Set(arr));
      } catch (e) { /* ok */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const persistRead = (next) => {
    setReadIds(next);
    storage.set(GUIDE_PROGRESS_KEY, JSON.stringify([...next])).catch(() => {});
  };

  const chapters = useMemo(() => buildChapters({ goTo: setView }), [setView]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chapters;
    return chapters.filter(ch => {
      const hay = [
        ch.title, ch.summary,
        ...ch.body.map(s => `${s.title} ${s.text}`),
        ...(ch.tips || []),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [chapters, search]);

  const totalRead = chapters.filter(c => readIds.has(c.id)).length;
  const pct = chapters.length === 0 ? 0 : Math.round((totalRead / chapters.length) * 100);

  const toggleRead = (id) => {
    const next = new Set(readIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    persistRead(next);
  };

  const resetProgress = () => {
    if (!confirm('Clear your guide progress? This only affects this device.')) return;
    persistRead(new Set());
  };

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 pb-16">
      <PageHeader
        title="Guide"
        subtitle="An interactive walk-through of every feature — click any chapter to expand"
        action={
          totalRead > 0 ? (
            <button
              className="pd-btn pd-btn-ghost px-3 py-2 rounded-lg text-sm"
              onClick={resetProgress}
              title="Reset which chapters you've marked as read"
            >
              Reset progress
            </button>
          ) : null
        }
      />

      {/* Progress strip */}
      <div className="pd-card p-5 mb-6">
        <div className="flex items-center justify-between mb-2 gap-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium">Your progress</span>
          </div>
          <span className="text-xs pd-mono" style={{ color: 'var(--text-muted)' }}>
            {totalRead} of {chapters.length} chapter{chapters.length === 1 ? '' : 's'} · {pct}%
          </span>
        </div>
        <div className="pd-progress-track">
          <div className="pd-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        {totalRead === chapters.length && (
          <div className="mt-3 text-xs flex items-center gap-1.5" style={{ color: 'var(--success)' }}>
            <CheckCircle2 size={13} /> You{"’"}ve been through everything. Welcome aboard.
          </div>
        )}
      </div>

      {/* Guided tours strip — Oracle Guided Learning style overlay. */}
      <div
        className="pd-card p-5 mb-6"
        style={{
          background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--surface) 100%)',
          border: '1px solid var(--accent)',
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Play size={15} style={{ color: 'var(--accent)' }} />
            <h3 className="pd-display text-lg font-medium">Take a guided tour</h3>
          </div>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Spotlights real UI elements · Esc to exit · ← / → to navigate
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { key: 'getting-started', label: 'Getting started' },
            { key: 'tasks-tour',      label: 'Tasks tour' },
            { key: 'tenders-tour',    label: 'Tenders tour' },
            { key: 'savings-tour',    label: 'Savings tour' },
            { key: 'settings-tour',   label: 'Settings tour' },
          ].filter(t => hasTour(t.key)).map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => startTour(t.key)}
              className="pd-btn pd-btn-ghost px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)' }}
            >
              <Sparkles size={12} style={{ color: 'var(--accent)' }} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          className="pd-input rounded-lg pl-9 pr-3 py-2 text-sm w-full"
          placeholder="Search the guide…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Chapter cards */}
      {filtered.length === 0 ? (
        <Empty icon={BookOpen} title="Nothing matches that search" hint="Try a different keyword" />
      ) : (
        <div className="space-y-3">
          {filtered.map((ch, i) => {
            const Icon = ch.icon;
            const isOpen = openId === ch.id;
            const isRead = readIds.has(ch.id);
            return (
              <div
                key={ch.id}
                className="pd-card pd-anim-in overflow-hidden"
                style={{
                  animationDelay: `${Math.min(i * 30, 240)}ms`,
                  borderColor: isOpen ? 'var(--accent)' : undefined,
                  boxShadow: isOpen ? '0 0 0 1px var(--accent-soft)' : undefined,
                }}
              >
                <button
                  type="button"
                  className="w-full flex items-center gap-4 p-5 text-left"
                  onClick={() => setOpenId(isOpen ? null : ch.id)}
                  aria-expanded={isOpen}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: isRead ? 'var(--success)' : 'var(--accent-soft)',
                      color: isRead ? 'var(--bg)' : 'var(--accent)',
                    }}
                  >
                    {isRead ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="pd-display text-lg font-medium leading-tight">{ch.title}</h3>
                      {ch.estReadMin != null && (
                        <span className="text-[10px] pd-mono uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                          {ch.estReadMin} min
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{ch.summary}</p>
                  </div>
                  <div className="shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="pd-divider mb-4" />
                    <ol className="space-y-4">
                      {ch.body.map((step, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span
                            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs pd-mono"
                            style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                          >
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium mb-1">{step.title}</div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{step.text}</p>
                            {step.tryLabel && step.onTry && (
                              <button
                                className="pd-btn pd-btn-ghost mt-2 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                                onClick={(e) => { e.stopPropagation(); step.onTry(); }}
                                style={{ color: 'var(--accent)' }}
                              >
                                <Sparkles size={12} /> {step.tryLabel}
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>

                    {ch.tips && ch.tips.length > 0 && (
                      <div
                        className="mt-5 p-3 rounded-lg"
                        style={{ background: 'var(--surface-2)', border: '1px dashed var(--border-strong)' }}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                          <Lightbulb size={12} /> Tips
                        </div>
                        <ul className="space-y-1.5">
                          {ch.tips.map((tip, idx) => (
                            <li key={idx} className="text-xs flex gap-2" style={{ color: 'var(--text-muted)' }}>
                              <span style={{ color: 'var(--accent)' }}>›</span>
                              <span className="flex-1">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => toggleRead(ch.id)}
                          className="pd-btn px-3 py-2 rounded-lg text-xs flex items-center gap-1.5"
                          style={{
                            background: isRead ? 'var(--success)' : 'var(--accent)',
                            color: 'var(--bg)',
                            border: 'none',
                          }}
                        >
                          {isRead ? <><Check size={13} /> Marked as read</> : <><CheckCircle2 size={13} /> Mark as read</>}
                        </button>
                        {ch.tourKey && hasTour(ch.tourKey) && (
                          <button
                            type="button"
                            onClick={() => startTour(ch.tourKey)}
                            className="pd-btn pd-btn-ghost px-3 py-2 rounded-lg text-xs flex items-center gap-1.5"
                            title="Walk through this feature with an interactive overlay"
                          >
                            <Play size={13} style={{ color: 'var(--accent)' }} /> Start guided tour
                          </button>
                        )}
                      </div>
                      <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                        Progress is saved on this device only.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer hint */}
      <div className="mt-8 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
        Found something missing or confusing? The guide lives in <span className="pd-mono">src/views/GuideView.jsx</span> — easy to extend.
      </div>
    </div>
  );
}

export default GuideView;
