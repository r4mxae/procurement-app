// Procurement Dashboard — application shell.
// Owns top-level state (data, theme, view), Supabase-backed hydration,
// the sidebar/topbar layout, and routing between views.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, ChevronLeft, ChevronRight, ClipboardList, DollarSign, Download,
  FileText, LayoutDashboard, ListChecks, LogOut, Menu, Palette, Settings, TrendingUp,
} from 'lucide-react';

import { ActiveTimerBanner } from './components/common/ActiveTimerBanner';
import { AttachmentsModal } from './components/modals/AttachmentsModal';
import { LogEntryModal } from './components/modals/LogEntryModal';
import { ViewLogsModal } from './components/modals/ViewLogsModal';

import { ACCENT_PRESETS, CURRENCIES, THEMES, isLightTheme } from './constants/locale';
import {
  LOGO_FULL_DARK_BG, LOGO_FULL_LIGHT_BG,
  LOGO_ICON_DARK_BG, LOGO_ICON_LIGHT_BG,
} from './constants/logos';
import { SIDEBAR_KEY, STORAGE_KEY } from './constants/storage';

import { useIsMobile } from './hooks/useIsMobile';
import {
  fmtDate, fmtDuration, fmtMoney, fmtMoneyExact,
  hexToRgba, setDisplay, todayISO,
} from './lib/format';
import { seedData } from './lib/seedData';
import { storage } from './lib/storage';
import { useAuth } from './lib/auth';
import { uploadAttachment, removeAttachmentFile } from './lib/attachments';
import {
  loadAll,
  upsertTaskRemote, deleteTaskRemote, patchTaskRemote,
  upsertTenderRemote, deleteTenderRemote, patchTenderRemote,
  upsertSavingRemote, deleteSavingRemote,
  logActivityRemote,
  upsertProfileRemote,
  patchSettingsRemote,
  migrateLocalStorageOnce,
} from './lib/api';
import { supabase } from './lib/supabase';

import ActivityView from './views/ActivityView';
import DashboardView from './views/DashboardView';
import LoginView from './views/LoginView';
import PerformanceView from './views/PerformanceView';
import SavingsView from './views/SavingsView';
import SettingsView from './views/SettingsView';
import TasksView from './views/TasksView';
import TendersView from './views/TendersView';
import WorkView from './views/WorkView';

// Stable client-side UUID for new rows. Postgres accepts these as-is, so
// optimistic inserts don't need a temp-id → real-id swap.
const newId = () => (
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    // Fallback for environments without crypto.randomUUID. Not collision-
    // proof, but the DB has a unique constraint that will reject dupes.
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      })
);

// Fire-and-forget remote write. Logs to console on failure but doesn't
// surface an error to the user — optimistic UI assumption is that writes
// almost always succeed once the user is authenticated and online.
const fireAndForget = (label, promise) => {
  Promise.resolve(promise).catch((e) => {
    // eslint-disable-next-line no-console
    console.error(`[procurement] ${label} failed:`, e);
  });
};

const EMPTY_DATA = {
  tasks: [], tenders: [], savings: [], activity: [],
  activeTimer: null,
  profile: { name: '', role: '', targetMode: 'absolute', annualTarget: 500000, targetPercentage: 8 },
  settings: seedData().settings,
};

function AuthedDashboard({ user }) {
  const [data, setData] = useState(EMPTY_DATA);
  const [theme, setTheme] = useState('obsidian');
  const [view, setView] = useState('dashboard');
  const [hydrating, setHydrating] = useState(true);
  const [hydrationError, setHydrationError] = useState(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile(768);
  const userId = user.id;

  // Auto-close mobile drawer when switching views
  useEffect(() => { if (isMobile) setMobileSidebarOpen(false); }, [view, isMobile]);
  // Lock body scroll while drawer is open
  useEffect(() => {
    if (isMobile && mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMobile, mobileSidebarOpen]);

  // Initial hydration: try to migrate any old localStorage workspace into
  // this user's account on first sign-in (no-op if they already have data),
  // then load everything from Supabase.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHydrating(true);
      setHydrationError(null);
      try {
        try {
          const stored = await storage.get(STORAGE_KEY);
          if (stored?.value) {
            const parsed = JSON.parse(stored.value);
            const moved = await migrateLocalStorageOnce(userId, parsed);
            if (moved) {
              // One-shot: clear the local copy so we never re-migrate.
              await storage.remove(STORAGE_KEY).catch(() => {});
            }
          }
        } catch (e) { /* migration is best-effort */ }

        const remote = await loadAll(userId);
        if (cancelled) return;
        setData({
          tasks: remote.tasks,
          tenders: remote.tenders,
          savings: remote.savings,
          activity: remote.activity,
          activeTimer: remote.activeTimer,
          profile: remote.profile,
          settings: remote.settings,
        });
        if (remote.theme && THEMES.some(t => t.id === remote.theme)) setTheme(remote.theme);
      } catch (e) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('[procurement] hydration failed', e);
        setHydrationError(e?.message || 'Could not load your workspace.');
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Sidebar collapse stays per-device — it's a UI preference, not workspace
  // data, and shouldn't sync across the user's other devices.
  useEffect(() => {
    (async () => {
      try {
        const sb = await storage.get(SIDEBAR_KEY);
        if (sb?.value === 'true') setSidebarCollapsed(true);
      } catch (e) { /* ok */ }
    })();
  }, []);
  useEffect(() => {
    if (hydrating) return;
    storage.set(SIDEBAR_KEY, String(sidebarCollapsed)).catch(() => {});
  }, [sidebarCollapsed, hydrating]);

  // Sync formatter display config from settings.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const s = data.settings || {};
    const cur = CURRENCIES.find(c => c.code === s.currency) || CURRENCIES[0];
    setDisplay({
      currencySymbol: cur.symbol,
      dateFormat: s.dateFormat || 'medium',
      urgentDays: Number(s.urgentDaysThreshold) || 3
    });
    forceTick(t => t + 1);
  }, [data.settings?.currency, data.settings?.dateFormat, data.settings?.urgentDaysThreshold]);

  // Build accent override style if user picked a custom accent
  const accentOverride = useMemo(() => {
    const presetId = data.settings?.accentPreset;
    if (!presetId || presetId === 'theme') return null;
    const preset = ACCENT_PRESETS.find(p => p.id === presetId);
    if (!preset?.color) return null;
    return {
      '--accent': preset.color,
      '--accent-2': preset.color,
      '--accent-soft': hexToRgba(preset.color, 0.13),
      '--accent-glow': hexToRgba(preset.color, 0.3)
    };
  }, [data.settings?.accentPreset]);

  // ─── mutators ───────────────────────────────────────────────────
  const logActivity = (type, message) => {
    // Optimistic prepend with a placeholder id; the real row id arrives
    // when the insert returns and replaces this entry by message+ts match.
    const tempId = newId();
    const ts = new Date().toISOString();
    setData(d => ({ ...d, activity: [{ id: tempId, type, message, timestamp: ts }, ...d.activity].slice(0, 200) }));
    fireAndForget('logActivity', logActivityRemote(userId, type, message).then((row) => {
      setData(d => ({
        ...d,
        activity: d.activity.map(a => a.id === tempId ? row : a),
      }));
    }));
  };

  const upsertTask = (task) => {
    const isNew = !task.id;
    const id = task.id || newId();
    const next = isNew
      ? { ...task, id, createdAt: new Date().toISOString(), workLogs: task.workLogs || [] }
      : { ...task };
    setData(d => {
      const exists = d.tasks.find(t => t.id === id);
      const tasks = exists
        ? d.tasks.map(t => t.id === id ? { ...t, ...next } : t)
        : [next, ...d.tasks];
      return { ...d, tasks };
    });
    // Upsert: send the full known shape. We rely on the merged state being
    // accurate enough; the server will return the canonical row.
    setData(d => {
      const merged = d.tasks.find(t => t.id === id) || next;
      fireAndForget('upsertTask', upsertTaskRemote(userId, merged));
      return d;
    });
    logActivity(isNew ? 'task_created' : 'task_updated', `${isNew ? 'Created' : 'Updated'} task: ${task.title}`);
  };

  const updateTaskStatus = (id, status) => {
    let completedTitle = null;
    let nextCompletedAt = undefined;
    setData(d => {
      const tasks = d.tasks.map(t => {
        if (t.id !== id) return t;
        const next = { ...t, status };
        if (status === 'completed') {
          if (!t.completedAt) next.completedAt = new Date().toISOString();
          nextCompletedAt = next.completedAt;
          completedTitle = t.title;
        } else if (t.completedAt) {
          next.completedAt = null;
          nextCompletedAt = null;
        }
        return next;
      });
      return { ...d, tasks };
    });
    fireAndForget('patchTaskStatus', patchTaskRemote(userId, id, { status, ...(nextCompletedAt !== undefined ? { completedAt: nextCompletedAt } : {}) }));
    if (completedTitle) logActivity('task_completed', `Completed: ${completedTitle}`);
  };

  const deleteTask = (id) => {
    let title = null;
    setData(d => {
      const t = d.tasks.find(x => x.id === id);
      if (t) title = t.title;
      return { ...d, tasks: d.tasks.filter(x => x.id !== id) };
    });
    fireAndForget('deleteTask', deleteTaskRemote(userId, id));
    if (title) logActivity('task_deleted', `Deleted task: ${title}`);
  };

  const upsertTender = (tender) => {
    const isNew = !tender.id;
    const id = tender.id || newId();
    const next = isNew
      ? { ...tender, id, createdAt: new Date().toISOString(), workLogs: tender.workLogs || [] }
      : { ...tender };
    setData(d => {
      const exists = d.tenders.find(t => t.id === id);
      const tenders = exists
        ? d.tenders.map(t => t.id === id ? { ...t, ...next } : t)
        : [next, ...d.tenders];
      return { ...d, tenders };
    });
    setData(d => {
      const merged = d.tenders.find(t => t.id === id) || next;
      fireAndForget('upsertTender', upsertTenderRemote(userId, merged));
      return d;
    });
    logActivity(isNew ? 'tender_created' : 'tender_updated', `${isNew ? 'Created' : 'Updated'} tender: ${tender.title}`);
  };

  const deleteTender = (id) => {
    let title = null;
    setData(d => {
      const t = d.tenders.find(x => x.id === id);
      if (t) title = t.title;
      return { ...d, tenders: d.tenders.filter(x => x.id !== id) };
    });
    fireAndForget('deleteTender', deleteTenderRemote(userId, id));
    if (title) logActivity('tender_deleted', `Deleted tender: ${title}`);
  };

  const upsertSaving = (saving) => {
    const isNew = !saving.id;
    const id = saving.id || newId();
    const next = isNew ? { ...saving, id } : { ...saving };
    setData(d => {
      const exists = d.savings.find(s => s.id === id);
      const savings = exists
        ? d.savings.map(s => s.id === id ? { ...s, ...next } : s)
        : [next, ...d.savings];
      return { ...d, savings };
    });
    fireAndForget('upsertSaving', upsertSavingRemote(userId, next));
    logActivity('savings_logged', `Logged ${fmtMoneyExact(saving.amount)} savings: ${saving.description}`);
  };

  const deleteSaving = (id) => {
    setData(d => ({ ...d, savings: d.savings.filter(s => s.id !== id) }));
    fireAndForget('deleteSaving', deleteSavingRemote(userId, id));
    logActivity('savings_removed', 'Removed a savings entry');
  };

  const updateProfile = (profile) => {
    setData(d => {
      const next = { ...d.profile, ...profile };
      fireAndForget('upsertProfile', upsertProfileRemote(userId, next));
      return { ...d, profile: next };
    });
  };

  const updateSettings = (patch) => {
    setData(d => ({ ...d, settings: { ...d.settings, ...patch } }));
    fireAndForget('patchSettings', patchSettingsRemote(userId, patch));
  };

  // Theme is per-user and synced via user_settings.
  const updateTheme = (next) => {
    setTheme(next);
    fireAndForget('patchTheme', patchSettingsRemote(userId, { theme: next }));
  };

  // Persist active_timer changes alongside the local mutation so the timer
  // is recoverable across devices/sessions.
  const persistActiveTimer = (next) => {
    fireAndForget('patchActiveTimer', patchSettingsRemote(userId, { activeTimer: next }));
  };

  // ─── TIMER + WORK LOGS ─────────────────────────────────────────
  const [pendingLog, setPendingLog] = useState(null);
  const [logsView, setLogsView] = useState(null);
  const [attachmentsView, setAttachmentsView] = useState(null);

  const findItem = (kind, id) => {
    const list = kind === 'task' ? data.tasks : data.tenders;
    return list.find(x => x.id === id);
  };

  const startTimer = (kind, itemId) => {
    if (data.activeTimer) {
      if (data.activeTimer.kind === kind && data.activeTimer.itemId === itemId) return;
      const item = findItem(data.activeTimer.kind, data.activeTimer.itemId);
      const ok = confirm(`A timer is already running on "${item?.title || 'another item'}". Stop it (without saving the session) and start a new one?`);
      if (!ok) return;
    }
    const next = { kind, itemId, startTime: new Date().toISOString() };
    setData(d => ({ ...d, activeTimer: next }));
    persistActiveTimer(next);
    const item = findItem(kind, itemId);
    if (item) logActivity('timer_started', `Started timer on ${kind}: ${item.title}`);
  };

  const stopTimer = () => {
    if (!data.activeTimer) return;
    const { kind, itemId, startTime } = data.activeTimer;
    const endTime = new Date().toISOString();
    const durationSeconds = Math.max(1, Math.round((Date.parse(endTime) - Date.parse(startTime)) / 1000));
    setPendingLog({ kind, itemId, startTime, endTime, durationSeconds, keepRunning: false });
    setData(d => ({ ...d, activeTimer: null }));
    persistActiveTimer(null);
  };

  const logProgress = () => {
    if (!data.activeTimer) return;
    const { kind, itemId, startTime } = data.activeTimer;
    const endTime = new Date().toISOString();
    const durationSeconds = Math.max(1, Math.round((Date.parse(endTime) - Date.parse(startTime)) / 1000));
    setPendingLog({ kind, itemId, startTime, endTime, durationSeconds, keepRunning: true });
  };

  const saveLogEntry = (note) => {
    if (!pendingLog || !note?.trim()) return;
    const { kind, itemId, startTime, endTime, durationSeconds, keepRunning } = pendingLog;
    const entry = { id: newId(), startTime, endTime, durationSeconds, note: note.trim() };
    let nextLogs = [];
    setData(d => {
      const listKey = kind === 'task' ? 'tasks' : 'tenders';
      const next = { ...d };
      next[listKey] = d[listKey].map(it => {
        if (it.id !== itemId) return it;
        nextLogs = [...(it.workLogs || []), entry];
        return { ...it, workLogs: nextLogs };
      });
      if (keepRunning && d.activeTimer && d.activeTimer.kind === kind && d.activeTimer.itemId === itemId) {
        next.activeTimer = { kind, itemId, startTime: new Date().toISOString() };
      }
      return next;
    });
    if (kind === 'task') {
      fireAndForget('patchTaskLogs', patchTaskRemote(userId, itemId, { workLogs: nextLogs }));
    } else {
      fireAndForget('patchTenderLogs', patchTenderRemote(userId, itemId, { workLogs: nextLogs }));
    }
    if (keepRunning) {
      // Re-armed timer also needs to land in user_settings.active_timer.
      setData(d => {
        if (d.activeTimer) persistActiveTimer(d.activeTimer);
        return d;
      });
    }
    const item = findItem(kind, itemId);
    if (item) logActivity('log_saved', `Logged ${fmtDuration(durationSeconds)} on ${kind}: ${item.title}`);
    setPendingLog(null);
  };

  const discardLog = () => {
    if (pendingLog) {
      const { kind, itemId, durationSeconds, keepRunning } = pendingLog;
      const item = findItem(kind, itemId);
      const verb = keepRunning ? 'segment' : 'session';
      if (item) logActivity('log_discarded', `Discarded ${fmtDuration(durationSeconds)} ${verb} on ${kind}: ${item.title}`);
      if (keepRunning) {
        setData(d => {
          if (!d.activeTimer || d.activeTimer.kind !== kind || d.activeTimer.itemId !== itemId) return d;
          const next = { kind, itemId, startTime: new Date().toISOString() };
          persistActiveTimer(next);
          return { ...d, activeTimer: next };
        });
      }
    }
    setPendingLog(null);
  };

  const deleteLogEntry = (kind, itemId, logId) => {
    let nextLogs = [];
    setData(d => {
      const listKey = kind === 'task' ? 'tasks' : 'tenders';
      return {
        ...d,
        [listKey]: d[listKey].map(it => {
          if (it.id !== itemId) return it;
          nextLogs = (it.workLogs || []).filter(l => l.id !== logId);
          return { ...it, workLogs: nextLogs };
        })
      };
    });
    if (kind === 'task') {
      fireAndForget('patchTaskLogsDel', patchTaskRemote(userId, itemId, { workLogs: nextLogs }));
    } else {
      fireAndForget('patchTenderLogsDel', patchTenderRemote(userId, itemId, { workLogs: nextLogs }));
    }
  };

  // ─── ATTACHMENTS ───────────────────────────────────────────────
  // Add: upload first (so we have a real storage path), then patch the
  // parent row's attachments[]. We don't insert a placeholder row before
  // the upload finishes — if the upload fails the user just sees an
  // inline error in the dialog and nothing is added.
  const addAttachment = async (kind, itemId, file) => {
    const meta = await uploadAttachment({ userId, kind, itemId, file });
    let nextAttachments = [];
    setData(d => {
      const listKey = kind === 'task' ? 'tasks' : 'tenders';
      return {
        ...d,
        [listKey]: d[listKey].map(it => {
          if (it.id !== itemId) return it;
          nextAttachments = [...(it.attachments || []), meta];
          return { ...it, attachments: nextAttachments };
        })
      };
    });
    if (kind === 'task') {
      fireAndForget('patchTaskAttachments', patchTaskRemote(userId, itemId, { attachments: nextAttachments }));
    } else {
      fireAndForget('patchTenderAttachments', patchTenderRemote(userId, itemId, { attachments: nextAttachments }));
    }
    const item = findItem(kind, itemId);
    if (item) logActivity('attachment_added', `Attached "${meta.name}" to ${kind}: ${item.title}`);
    return meta;
  };

  // Delete: remove the row metadata first (optimistic UI) then drop the
  // blob. If the storage delete fails we log it but don't restore the
  // row — better to have an orphaned blob than a list entry the user
  // can't get rid of.
  const deleteAttachment = (kind, itemId, attachment) => {
    let nextAttachments = [];
    setData(d => {
      const listKey = kind === 'task' ? 'tasks' : 'tenders';
      return {
        ...d,
        [listKey]: d[listKey].map(it => {
          if (it.id !== itemId) return it;
          nextAttachments = (it.attachments || []).filter(a => a.id !== attachment.id);
          return { ...it, attachments: nextAttachments };
        })
      };
    });
    if (kind === 'task') {
      fireAndForget('patchTaskAttachmentsDel', patchTaskRemote(userId, itemId, { attachments: nextAttachments }));
    } else {
      fireAndForget('patchTenderAttachmentsDel', patchTenderRemote(userId, itemId, { attachments: nextAttachments }));
    }
    fireAndForget('removeAttachmentBlob', removeAttachmentFile(attachment.path));
    const item = findItem(kind, itemId);
    if (item) logActivity('attachment_removed', `Removed "${attachment.name}" from ${kind}: ${item.title}`);
  };

  // Wipe every row this user owns and replace with imported workspace.
  const replaceData = async (next) => {
    if (!next || typeof next !== 'object') return;
    setHydrating(true);
    try {
      // Delete in dependency-safe order. RLS scopes everything to user_id.
      await Promise.all([
        supabase.from('tasks').delete().eq('user_id', userId),
        supabase.from('tenders').delete().eq('user_id', userId),
        supabase.from('savings').delete().eq('user_id', userId),
        supabase.from('activity').delete().eq('user_id', userId),
      ]);
      await migrateLocalStorageOnce(userId, next);
      const remote = await loadAll(userId);
      setData({
        tasks: remote.tasks,
        tenders: remote.tenders,
        savings: remote.savings,
        activity: remote.activity,
        activeTimer: remote.activeTimer,
        profile: remote.profile,
        settings: remote.settings,
      });
      if (remote.theme && THEMES.some(t => t.id === remote.theme)) setTheme(remote.theme);
      logActivity('settings_imported', 'Imported workspace from backup file');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[procurement] replaceData failed', e);
      alert('Import failed: ' + (e?.message || e));
    } finally {
      setHydrating(false);
    }
  };

  const resetToDemo = async () => {
    setHydrating(true);
    try {
      await Promise.all([
        supabase.from('tasks').delete().eq('user_id', userId),
        supabase.from('tenders').delete().eq('user_id', userId),
        supabase.from('savings').delete().eq('user_id', userId),
        supabase.from('activity').delete().eq('user_id', userId),
      ]);
      await migrateLocalStorageOnce(userId, seedData());
      const remote = await loadAll(userId);
      setData({
        tasks: remote.tasks, tenders: remote.tenders, savings: remote.savings, activity: remote.activity,
        activeTimer: remote.activeTimer, profile: remote.profile, settings: remote.settings,
      });
      logActivity('settings_reset', 'Reset workspace to demo data');
    } catch (e) {
      alert('Reset failed: ' + (e?.message || e));
    } finally {
      setHydrating(false);
    }
  };

  const clearAll = async () => {
    setHydrating(true);
    try {
      await Promise.all([
        supabase.from('tasks').delete().eq('user_id', userId),
        supabase.from('tenders').delete().eq('user_id', userId),
        supabase.from('savings').delete().eq('user_id', userId),
        supabase.from('activity').delete().eq('user_id', userId),
      ]);
      setData(d => ({
        ...d,
        tasks: [], tenders: [], savings: [], activity: [], activeTimer: null,
      }));
      persistActiveTimer(null);
      logActivity('settings_cleared', 'Cleared all workspace data');
    } catch (e) {
      alert('Clear failed: ' + (e?.message || e));
    } finally {
      setHydrating(false);
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `procurement-data-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const signOut = async () => {
    if (!confirm('Sign out of your account?')) return;
    await supabase.auth.signOut();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'work', label: 'All Work', icon: ListChecks, count: data.tasks.filter(t => t.status !== 'completed').length + data.tenders.filter(t => !['closed', 'awarded'].includes(t.stage)).length },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList, count: data.tasks.filter(t => t.status !== 'completed').length },
    { id: 'tenders', label: 'Tenders', icon: FileText, count: data.tenders.filter(t => !['closed', 'awarded'].includes(t.stage)).length },
    { id: 'savings', label: 'Savings', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const a11yClass = [
    'pd-root',
    data.settings?.textSize === 'large' ? 'pd-text-large' : '',
    data.settings?.textSize === 'xl' ? 'pd-text-xl' : '',
    data.settings?.boldText ? 'pd-text-bold' : ''
  ].filter(Boolean).join(' ');

  const sbCollapsedUI = sidebarCollapsed && !isMobile;

  if (hydrating) {
    return (
      <div className="pd-root" data-theme={theme}>
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading your workspace…</div>
        </div>
      </div>
    );
  }

  if (hydrationError) {
    return (
      <div className="pd-root" data-theme={theme}>
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
          <div className="max-w-md p-6 rounded-2xl text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="pd-display text-xl font-medium mb-2">Couldn’t load your workspace</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{hydrationError}</p>
            <div className="flex gap-2 justify-center">
              <button className="pd-btn pd-btn-ghost px-4 py-2 rounded-lg text-sm" onClick={() => window.location.reload()}>Retry</button>
              <button className="pd-btn pd-btn-primary px-4 py-2 rounded-lg text-sm" onClick={signOut}>Sign out</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={a11yClass} data-theme={theme} style={accentOverride || undefined}>
      <div className="pd-mobile-topbar">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="pd-icon-btn"
          aria-label="Open menu"
          style={{ width: 40, height: 40 }}
        >
          <Menu size={18} />
        </button>
        <img
          src={isLightTheme(theme) ? LOGO_FULL_LIGHT_BG : LOGO_FULL_DARK_BG}
          alt="ProcTrax"
          style={{ height: 28, width: 'auto', display: 'block' }}
          draggable={false}
        />
      </div>

      <div
        className={`pd-mobile-backdrop ${mobileSidebarOpen ? 'show' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      <div className="flex min-h-screen">
        <aside
          className={`pd-sidebar-host shrink-0 border-r flex flex-col ${mobileSidebarOpen ? 'pd-sidebar-mobile-open' : ''}`}
          style={{
            width: sbCollapsedUI ? 72 : 256,
            minWidth: sbCollapsedUI ? 72 : 256,
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            transition: 'width 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), min-width 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {sbCollapsedUI ? (
            <div className="flex flex-col items-center pt-7 pb-3 gap-3">
              <img
                src={isLightTheme(theme) ? LOGO_ICON_LIGHT_BG : LOGO_ICON_DARK_BG}
                alt="ProcTrax"
                style={{ height: 36, width: 'auto', display: 'block' }}
                draggable={false}
              />
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="pd-icon-btn"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className="px-5 py-7 flex items-center justify-between gap-2">
              <img
                src={isLightTheme(theme) ? LOGO_FULL_LIGHT_BG : LOGO_FULL_DARK_BG}
                alt="ProcTrax"
                style={{ height: 36, width: 'auto', display: 'block', flexShrink: 0 }}
                draggable={false}
              />
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="pd-icon-btn shrink-0"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}

          <nav className={`flex-1 pd-scroll overflow-y-auto overflow-x-hidden ${sbCollapsedUI ? 'px-2' : 'px-3'}`}>
            {navItems.map(item => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={`pd-nav-item relative w-full flex items-center rounded-lg mb-1 ${active ? 'active' : ''} ${sbCollapsedUI ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5'}`}
                  style={{ color: active ? 'var(--text)' : 'var(--text-muted)', background: 'transparent', border: 'none', textAlign: 'left' }}
                  title={sbCollapsedUI ? item.label : undefined}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {!sbCollapsedUI && <span className="text-sm font-medium flex-1 truncate">{item.label}</span>}
                  {!sbCollapsedUI && item.count > 0 && (
                    <span className="text-[10px] pd-mono px-1.5 py-0.5 rounded shrink-0" style={{ background: active ? 'var(--accent)' : 'var(--surface-3)', color: active ? 'var(--bg)' : 'var(--text-muted)' }}>
                      {item.count}
                    </span>
                  )}
                  {sbCollapsedUI && item.count > 0 && (
                    <span
                      className="absolute"
                      style={{
                        top: 6, right: 8,
                        minWidth: 8, height: 8,
                        borderRadius: 999,
                        background: 'var(--accent)',
                        boxShadow: '0 0 0 2px var(--surface)'
                      }}
                      aria-label={`${item.count} pending`}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className={`pb-4 relative ${sbCollapsedUI ? 'px-2' : 'px-3'}`}>
            {!sbCollapsedUI && user?.email && (
              <div className="px-3 py-2 mb-1 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Signed in as</div>
                <div className="text-xs truncate" style={{ color: 'var(--text)' }} title={user.email}>{user.email}</div>
              </div>
            )}
            <button
              className={`pd-nav-item w-full rounded-lg flex items-center ${sbCollapsedUI ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5'}`}
              style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', textAlign: 'left' }}
              onClick={() => setThemePickerOpen(o => !o)}
              title={sbCollapsedUI ? `Theme · ${THEMES.find(t => t.id === theme)?.name}` : undefined}
            >
              {sbCollapsedUI ? (
                <span className="w-4 h-4 rounded-full" style={{ background: THEMES.find(t => t.id === theme)?.dot, border: '1.5px solid var(--border-strong)' }} />
              ) : (
                <>
                  <Palette size={16} strokeWidth={1.8} />
                  <span className="text-sm font-medium flex-1 text-left">Theme</span>
                  <span className="w-3 h-3 rounded-full" style={{ background: THEMES.find(t => t.id === theme)?.dot }} />
                </>
              )}
            </button>
            {themePickerOpen && (
              <div
                className="absolute p-2 rounded-xl pd-anim-in"
                style={{
                  bottom: sbCollapsedUI ? 8 : 56,
                  left: sbCollapsedUI ? '100%' : 12,
                  right: sbCollapsedUI ? 'auto' : 12,
                  marginLeft: sbCollapsedUI ? 8 : 0,
                  width: sbCollapsedUI ? 220 : undefined,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-strong)',
                  boxShadow: '0 12px 32px -8px rgba(0,0,0,0.4)',
                  zIndex: 40
                }}
              >
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { updateTheme(t.id); setThemePickerOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                    style={{ background: theme === t.id ? 'var(--accent-soft)' : 'transparent', color: 'var(--text)' }}
                    onMouseEnter={(e) => { if (theme !== t.id) e.currentTarget.style.background = 'var(--surface-3)'; }}
                    onMouseLeave={(e) => { if (theme !== t.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span className="w-3 h-3 rounded-full ring-2" style={{ background: t.dot, ringColor: 'var(--surface)' }} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.hint}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              className={`pd-nav-item w-full rounded-lg mt-1 flex items-center ${sbCollapsedUI ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5'}`}
              style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', textAlign: 'left' }}
              onClick={exportData}
              title={sbCollapsedUI ? 'Export Data' : undefined}
              aria-label="Export workspace as JSON"
            >
              <Download size={16} strokeWidth={1.8} />
              {!sbCollapsedUI && <span className="text-sm font-medium flex-1 text-left">Export Data</span>}
            </button>

            <button
              className={`pd-nav-item w-full rounded-lg mt-1 flex items-center ${sbCollapsedUI ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5'}`}
              style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', textAlign: 'left' }}
              onClick={signOut}
              title={sbCollapsedUI ? 'Sign out' : undefined}
              aria-label="Sign out"
            >
              <LogOut size={16} strokeWidth={1.8} />
              {!sbCollapsedUI && <span className="text-sm font-medium flex-1 text-left">Sign out</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {data.activeTimer && (
            <ActiveTimerBanner
              timer={data.activeTimer}
              item={findItem(data.activeTimer.kind, data.activeTimer.itemId)}
              onStop={stopTimer}
              onLogProgress={logProgress}
              onJump={() => setView('work')}
            />
          )}
          {view === 'dashboard' && <DashboardView data={data} setView={setView} />}
          {view === 'work' && (
            <WorkView
              data={data}
              activeTimer={data.activeTimer}
              onStartTimer={startTimer}
              onStopTimer={stopTimer}
              onViewLogs={(kind, itemId) => setLogsView({ kind, itemId })}
              onViewAttachments={(kind, itemId) => setAttachmentsView({ kind, itemId })}
              onDeleteLog={deleteLogEntry}
            />
          )}
          {view === 'tasks' && (
            <TasksView
              data={data}
              upsertTask={upsertTask}
              updateTaskStatus={updateTaskStatus}
              deleteTask={deleteTask}
              activeTimer={data.activeTimer}
              onStartTimer={startTimer}
              onStopTimer={stopTimer}
              onViewLogs={(kind, itemId) => setLogsView({ kind, itemId })}
              onViewAttachments={(kind, itemId) => setAttachmentsView({ kind, itemId })}
            />
          )}
          {view === 'tenders' && (
            <TendersView
              data={data}
              upsertTender={upsertTender}
              deleteTender={deleteTender}
              activeTimer={data.activeTimer}
              onStartTimer={startTimer}
              onStopTimer={stopTimer}
              onViewLogs={(kind, itemId) => setLogsView({ kind, itemId })}
              onViewAttachments={(kind, itemId) => setAttachmentsView({ kind, itemId })}
            />
          )}
          {view === 'savings' && <SavingsView data={data} upsertSaving={upsertSaving} deleteSaving={deleteSaving} updateProfile={updateProfile} />}
          {view === 'performance' && <PerformanceView data={data} />}
          {view === 'activity' && <ActivityView data={data} />}
          {view === 'settings' && (
            <SettingsView
              data={data}
              theme={theme}
              setTheme={updateTheme}
              updateProfile={updateProfile}
              updateSettings={updateSettings}
              replaceData={replaceData}
              resetToDemo={resetToDemo}
              clearAll={clearAll}
            />
          )}
        </main>
      </div>

      {pendingLog && (
        <LogEntryModal
          pending={pendingLog}
          item={findItem(pendingLog.kind, pendingLog.itemId)}
          onSave={saveLogEntry}
          onDiscard={discardLog}
        />
      )}

      {logsView && (
        <ViewLogsModal
          kind={logsView.kind}
          item={findItem(logsView.kind, logsView.itemId)}
          profile={data.profile}
          onClose={() => setLogsView(null)}
          onDeleteLog={(logId) => deleteLogEntry(logsView.kind, logsView.itemId, logId)}
        />
      )}

      {attachmentsView && (
        <AttachmentsModal
          kind={attachmentsView.kind}
          item={findItem(attachmentsView.kind, attachmentsView.itemId)}
          onClose={() => setAttachmentsView(null)}
          onUpload={(file) => addAttachment(attachmentsView.kind, attachmentsView.itemId, file)}
          onDelete={(att) => deleteAttachment(attachmentsView.kind, attachmentsView.itemId, att)}
        />
      )}
    </div>
  );
}

export default function ProcurementDashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="pd-root" data-theme="obsidian">
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Checking your session…</div>
        </div>
      </div>
    );
  }

  if (!user) return <LoginView />;

  // key={user.id} forces a fresh mount when the user changes (sign out
  // → sign in as someone else) so we never bleed one user's state into
  // another's session.
  return <AuthedDashboard key={user.id} user={user} />;
}
