// Supabase data layer — replaces lib/storage.js for everything except
// pure UI prefs (sidebar collapsed) which stay client-local.
//
// Shape contract: the React tree still consumes the same camelCase
// `data` object {tasks, tenders, savings, activity, profile, settings,
// activeTimer}. We translate snake_case ↔ camelCase here so views never
// see the DB column names.

import { supabase } from './supabase';

// ─── shape mappers ──────────────────────────────────────────────
const taskFromRow = (r) => ({
  id: r.id,
  title: r.title,
  description: r.description || '',
  status: r.status,
  priority: r.priority,
  category: r.category || '',
  deadline: r.deadline || null,
  completedAt: r.completed_at || null,
  workLogs: Array.isArray(r.work_logs) ? r.work_logs : [],
  createdAt: r.created_at,
});

const taskToRow = (t, userId) => ({
  ...(t.id ? { id: t.id } : {}),
  user_id: userId,
  title: t.title,
  description: t.description ?? '',
  status: t.status ?? 'todo',
  priority: t.priority ?? 'medium',
  category: t.category ?? '',
  deadline: t.deadline || null,
  completed_at: t.completedAt || null,
  work_logs: Array.isArray(t.workLogs) ? t.workLogs : [],
});

const tenderFromRow = (r) => ({
  id: r.id,
  title: r.title,
  reference: r.reference || '',
  stage: r.stage,
  value: Number(r.value) || 0,
  vendorCount: r.vendor_count || 0,
  deadline: r.deadline || null,
  savings: Number(r.savings) || 0,
  notes: r.notes || '',
  workLogs: Array.isArray(r.work_logs) ? r.work_logs : [],
  createdAt: r.created_at,
});

const tenderToRow = (t, userId) => ({
  ...(t.id ? { id: t.id } : {}),
  user_id: userId,
  title: t.title,
  reference: t.reference ?? '',
  stage: t.stage ?? 'draft',
  value: Number(t.value) || 0,
  vendor_count: Number(t.vendorCount) || 0,
  deadline: t.deadline || null,
  savings: Number(t.savings) || 0,
  notes: t.notes ?? '',
  work_logs: Array.isArray(t.workLogs) ? t.workLogs : [],
});

const savingFromRow = (r) => ({
  id: r.id,
  description: r.description,
  amount: Number(r.amount) || 0,
  category: r.category || '',
  date: r.date,
  tenderRef: r.tender_ref || '',
});

const savingToRow = (s, userId) => ({
  ...(s.id ? { id: s.id } : {}),
  user_id: userId,
  description: s.description,
  amount: Number(s.amount) || 0,
  category: s.category ?? '',
  date: s.date || new Date().toISOString().slice(0, 10),
  tender_ref: s.tenderRef ?? '',
});

const activityFromRow = (r) => ({
  id: r.id,
  type: r.type,
  message: r.message,
  timestamp: r.timestamp,
});

const profileFromRow = (r) => r ? ({
  name: r.name || '',
  role: r.role || '',
  targetMode: r.target_mode || 'absolute',
  annualTarget: Number(r.annual_target) || 0,
  targetPercentage: Number(r.target_percentage) || 0,
}) : { name: '', role: '', targetMode: 'absolute', annualTarget: 500000, targetPercentage: 8 };

const profileToRow = (p, userId) => ({
  user_id: userId,
  name: p.name ?? '',
  role: p.role ?? '',
  target_mode: p.targetMode ?? 'absolute',
  annual_target: Number(p.annualTarget) || 0,
  target_percentage: Number(p.targetPercentage) || 0,
});

const settingsFromRow = (r) => r ? ({
  currency: r.currency || 'USD',
  dateFormat: r.date_format || 'medium',
  urgentDaysThreshold: r.urgent_days_threshold ?? 3,
  defaultTaskPriority: r.default_task_priority || 'medium',
  accentPreset: r.accent_preset || 'theme',
  customTaskCategories: r.custom_task_categories || [],
  customSavingsCategories: r.custom_savings_categories || [],
  textSize: r.text_size || 'regular',
  boldText: !!r.bold_text,
  _theme: r.theme || 'obsidian',
  _activeTimer: r.active_timer || null,
}) : {
  currency: 'USD', dateFormat: 'medium', urgentDaysThreshold: 3,
  defaultTaskPriority: 'medium', accentPreset: 'theme',
  customTaskCategories: [], customSavingsCategories: [],
  textSize: 'regular', boldText: false,
  _theme: 'obsidian', _activeTimer: null,
};

const settingsToRow = (s, userId, theme, activeTimer) => ({
  user_id: userId,
  theme: theme ?? 'obsidian',
  currency: s?.currency ?? 'USD',
  date_format: s?.dateFormat ?? 'medium',
  urgent_days_threshold: Math.min(14, Math.max(1, Number(s?.urgentDaysThreshold) || 3)),
  default_task_priority: s?.defaultTaskPriority ?? 'medium',
  accent_preset: s?.accentPreset ?? 'theme',
  custom_task_categories: Array.isArray(s?.customTaskCategories) ? s.customTaskCategories : [],
  custom_savings_categories: Array.isArray(s?.customSavingsCategories) ? s.customSavingsCategories : [],
  text_size: ['regular','large','xl'].includes(s?.textSize) ? s.textSize : 'regular',
  bold_text: !!s?.boldText,
  active_timer: activeTimer ?? null,
});

// ─── bulk hydration ─────────────────────────────────────────────
export async function loadAll(userId) {
  const [tasksR, tendersR, savingsR, activityR, profileR, settingsR] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('tenders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('savings').select('*').eq('user_id', userId).order('date', { ascending: false }),
    supabase.from('activity').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(200),
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const firstError = [tasksR, tendersR, savingsR, activityR, profileR, settingsR].find(r => r.error);
  if (firstError?.error) throw firstError.error;

  const settings = settingsFromRow(settingsR.data);
  return {
    tasks: (tasksR.data || []).map(taskFromRow),
    tenders: (tendersR.data || []).map(tenderFromRow),
    savings: (savingsR.data || []).map(savingFromRow),
    activity: (activityR.data || []).map(activityFromRow),
    profile: profileFromRow(profileR.data),
    settings: {
      currency: settings.currency,
      dateFormat: settings.dateFormat,
      urgentDaysThreshold: settings.urgentDaysThreshold,
      defaultTaskPriority: settings.defaultTaskPriority,
      accentPreset: settings.accentPreset,
      customTaskCategories: settings.customTaskCategories,
      customSavingsCategories: settings.customSavingsCategories,
      textSize: settings.textSize,
      boldText: settings.boldText,
    },
    theme: settings._theme,
    activeTimer: settings._activeTimer,
  };
}

// ─── tasks ───────────────────────────────────────────────────────
export async function upsertTaskRemote(userId, task) {
  const row = taskToRow(task, userId);
  const { data, error } = await supabase.from('tasks').upsert(row).select().single();
  if (error) throw error;
  return taskFromRow(data);
}

export async function deleteTaskRemote(userId, id) {
  const { error } = await supabase.from('tasks').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}

// Patch a subset of columns. Used by status updates and work-log mutations
// where rebuilding the whole row is wasteful.
export async function patchTaskRemote(userId, id, patch) {
  const row = {};
  if ('status' in patch) row.status = patch.status;
  if ('completedAt' in patch) row.completed_at = patch.completedAt;
  if ('workLogs' in patch) row.work_logs = patch.workLogs;
  const { data, error } = await supabase
    .from('tasks').update(row).eq('user_id', userId).eq('id', id)
    .select().single();
  if (error) throw error;
  return taskFromRow(data);
}

// ─── tenders ─────────────────────────────────────────────────────
export async function upsertTenderRemote(userId, tender) {
  const row = tenderToRow(tender, userId);
  const { data, error } = await supabase.from('tenders').upsert(row).select().single();
  if (error) throw error;
  return tenderFromRow(data);
}

export async function deleteTenderRemote(userId, id) {
  const { error } = await supabase.from('tenders').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}

export async function patchTenderRemote(userId, id, patch) {
  const row = {};
  if ('workLogs' in patch) row.work_logs = patch.workLogs;
  const { data, error } = await supabase
    .from('tenders').update(row).eq('user_id', userId).eq('id', id)
    .select().single();
  if (error) throw error;
  return tenderFromRow(data);
}

// ─── savings ─────────────────────────────────────────────────────
export async function upsertSavingRemote(userId, saving) {
  const row = savingToRow(saving, userId);
  const { data, error } = await supabase.from('savings').upsert(row).select().single();
  if (error) throw error;
  return savingFromRow(data);
}

export async function deleteSavingRemote(userId, id) {
  const { error } = await supabase.from('savings').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}

// ─── activity ────────────────────────────────────────────────────
export async function logActivityRemote(userId, type, message) {
  const { data, error } = await supabase.from('activity')
    .insert({ user_id: userId, type, message })
    .select().single();
  if (error) throw error;
  return activityFromRow(data);
}

// ─── profile + settings ──────────────────────────────────────────
export async function upsertProfileRemote(userId, profile) {
  const { error } = await supabase.from('profiles').upsert(profileToRow(profile, userId));
  if (error) throw error;
}

export async function upsertSettingsRemote(userId, settings, theme, activeTimer) {
  const { error } = await supabase.from('user_settings')
    .upsert(settingsToRow(settings, userId, theme, activeTimer));
  if (error) throw error;
}

// Narrow updaters — avoid stomping unrelated columns when only one thing
// changed. Cheaper writes and avoids a load → modify → write race.
export async function patchSettingsRemote(userId, patch) {
  const row = {};
  if ('theme' in patch) row.theme = patch.theme;
  if ('activeTimer' in patch) row.active_timer = patch.activeTimer;
  if ('currency' in patch) row.currency = patch.currency;
  if ('dateFormat' in patch) row.date_format = patch.dateFormat;
  if ('urgentDaysThreshold' in patch) row.urgent_days_threshold = patch.urgentDaysThreshold;
  if ('defaultTaskPriority' in patch) row.default_task_priority = patch.defaultTaskPriority;
  if ('accentPreset' in patch) row.accent_preset = patch.accentPreset;
  if ('customTaskCategories' in patch) row.custom_task_categories = patch.customTaskCategories;
  if ('customSavingsCategories' in patch) row.custom_savings_categories = patch.customSavingsCategories;
  if ('textSize' in patch) row.text_size = patch.textSize;
  if ('boldText' in patch) row.bold_text = !!patch.boldText;
  if (Object.keys(row).length === 0) return;
  // Upsert because the row may not exist on the very first write.
  row.user_id = userId;
  const { error } = await supabase.from('user_settings').upsert(row);
  if (error) throw error;
}

// ─── one-time localStorage migration ─────────────────────────────
// Returns true if any data was migrated; false if there was nothing to
// migrate or the user already has remote data (we never overwrite).
export async function migrateLocalStorageOnce(userId, parsedLocal) {
  if (!parsedLocal || typeof parsedLocal !== 'object') return false;
  // Refuse if the user already has tasks/tenders/savings remotely — we
  // don't want to merge demo data into a real account.
  const counts = await Promise.all([
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('tenders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('savings').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);
  if (counts.some(c => (c.count || 0) > 0)) return false;

  const tasks = Array.isArray(parsedLocal.tasks) ? parsedLocal.tasks : [];
  const tenders = Array.isArray(parsedLocal.tenders) ? parsedLocal.tenders : [];
  const savings = Array.isArray(parsedLocal.savings) ? parsedLocal.savings : [];

  // Strip client-side ids; let the DB regenerate them so legacy uid()
  // strings (8-char base36) don't collide with uuid format.
  const taskRows = tasks.map(t => { const r = taskToRow(t, userId); delete r.id; return r; });
  const tenderRows = tenders.map(t => { const r = tenderToRow(t, userId); delete r.id; return r; });
  const savingRows = savings.map(s => { const r = savingToRow(s, userId); delete r.id; return r; });

  if (taskRows.length) {
    const { error } = await supabase.from('tasks').insert(taskRows);
    if (error) throw error;
  }
  if (tenderRows.length) {
    const { error } = await supabase.from('tenders').insert(tenderRows);
    if (error) throw error;
  }
  if (savingRows.length) {
    const { error } = await supabase.from('savings').insert(savingRows);
    if (error) throw error;
  }
  if (parsedLocal.profile) {
    await upsertProfileRemote(userId, parsedLocal.profile);
  }
  if (parsedLocal.settings) {
    await upsertSettingsRemote(userId, parsedLocal.settings, undefined, parsedLocal.activeTimer ?? null);
  }
  return taskRows.length + tenderRows.length + savingRows.length > 0;
}
