// Module-level mutable display config — synced from settings on app boot.
// Formatters below read directly from this object so we don't have to
// thread currency/date format through every component.
const _display = {
  currencySymbol: '$',
  dateFormat: 'medium',
  urgentDays: 3,
};

export const setDisplay = (next) => Object.assign(_display, next);
export const getDisplay = () => _display;
export const getUrgentDays = () => _display.urgentDays;

// ─── ID & math ───────────────────────────────────────────────────
export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ─── Money ───────────────────────────────────────────────────────
export const fmtMoney = (n) => {
  if (n == null || isNaN(n)) return '—';
  const sym = _display.currencySymbol;
  if (Math.abs(n) >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${sym}${(n / 1_000).toFixed(1)}K`;
  return `${sym}${Math.round(n).toLocaleString()}`;
};

export const fmtMoneyExact = (n) => {
  if (n == null || isNaN(n)) return '—';
  return `${_display.currencySymbol}${Math.round(n).toLocaleString()}`;
};

// ─── Dates ───────────────────────────────────────────────────────
export const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  switch (_display.dateFormat) {
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'long':
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    case 'iso':
      return iso.slice(0, 10);
    case 'medium':
    default:
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

export const fmtDateShort = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (_display.dateFormat === 'iso') return iso.slice(0, 10);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const daysUntil = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - now) / 86400000);
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const monthKey = (iso) => {
  if (!iso) return '';
  return iso.slice(0, 7);
};

// ─── Color ───────────────────────────────────────────────────────
export const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return null;
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ─── Tender / target math ────────────────────────────────────────
export const computeTenderBudget = (tenders, year = null) => {
  const list = Array.isArray(tenders) ? tenders : [];
  if (year == null) {
    return list.reduce((sum, t) => sum + (Number(t.value) || 0), 0);
  }
  return list
    .filter((t) => {
      const d = t.createdAt || t.deadline;
      if (!d) return false;
      return new Date(d).getFullYear() === year;
    })
    .reduce((sum, t) => sum + (Number(t.value) || 0), 0);
};

export const countTendersInYear = (tenders, year) => {
  return (Array.isArray(tenders) ? tenders : []).filter((t) => {
    const d = t.createdAt || t.deadline;
    return d && new Date(d).getFullYear() === year;
  }).length;
};

export const computeTarget = (profile, tenders = []) => {
  if (!profile) return 0;
  if (profile.targetMode === 'percentage') {
    const year = new Date().getFullYear();
    const budget = computeTenderBudget(tenders, year);
    const pct = Number(profile.targetPercentage) || 0;
    return Math.round((budget * pct) / 100);
  }
  return Number(profile.annualTarget) || 0;
};

// ─── Duration & time ─────────────────────────────────────────────
export const fmtDuration = (seconds) => {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
};

export const fmtDurationLive = (seconds) => {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export const totalLoggedSeconds = (logs) => {
  if (!Array.isArray(logs)) return 0;
  return logs.reduce((sum, l) => sum + (Number(l.durationSeconds) || 0), 0);
};

export const fmtTimeOfDay = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
