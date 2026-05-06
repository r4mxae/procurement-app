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

// ─── Working-days math ──────────────────────────────────────────
// Advance a calendar date by N working days, where "working" means a
// weekday that's in the user's configured workWeek (ISO numbers 1=Mon
// .. 7=Sun). Used to convert an SLA-days choice on a task/tender into
// a concrete deadline ISO date stored on the row.
//
// We start counting from the *next* working day after `startISO` so
// that creating a 1-day SLA today doesn't immediately put the deadline
// in the past on the same calendar day.
export const addWorkingDays = (startISO, days, workWeek) => {
  if (!startISO) return null;
  const wd = Array.isArray(workWeek) && workWeek.length > 0 ? workWeek : [1, 2, 3, 4, 5];
  const wdSet = new Set(wd.map(Number));
  const isoDay = (d) => {
    // JS getDay: 0=Sun..6=Sat → ISO 1=Mon..7=Sun
    const x = d.getDay();
    return x === 0 ? 7 : x;
  };
  const d = new Date(startISO);
  d.setHours(12, 0, 0, 0); // mid-day to avoid DST/timezone edges
  let remaining = Math.max(0, Math.floor(Number(days) || 0));
  // Edge case: zero working days → return the start date itself if it's
  // a working day, otherwise advance to the next one.
  if (remaining === 0) {
    while (!wdSet.has(isoDay(d))) d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    if (wdSet.has(isoDay(d))) remaining -= 1;
  }
  return d.toISOString().slice(0, 10);
};

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

// ─── Derived savings (from tender offers + budget) ──────────────
// Two complementary calculations per tender:
//   vsFirst  = first_offer  − final_offer   (what negotiation extracted)
//   vsBudget = budgeted_amount − final_offer (what we kept under plan)
// Each entry below mirrors the legacy `savings` row shape (id/amount/
// date/category/description/tenderRef) so existing chart/list code can
// consume either source without branching.
//
// `mode` selects which calculation. Negative results are kept (over-budget
// / over-first-offer) so the user can see exposure, not just wins; the UI
// colors them red.
export const deriveSavingsFromTenders = (tenders, mode = 'vsFirst') => {
  const list = Array.isArray(tenders) ? tenders : [];
  const out = [];
  for (const t of list) {
    const finalO = Number(t.finalOffer);
    if (!Number.isFinite(finalO) || finalO <= 0) continue;
    let amount;
    if (mode === 'vsFirst') {
      const firstO = Number(t.firstOffer);
      if (!Number.isFinite(firstO) || firstO <= 0) continue;
      amount = firstO - finalO;
    } else {
      const budget = Number(t.value);
      if (!Number.isFinite(budget) || budget <= 0) continue;
      amount = budget - finalO;
    }
    // Date: prefer the deadline (when the tender wrapped up); fall back
    // to createdAt so it still lands somewhere on the timeline.
    const date = (t.deadline || t.createdAt || todayISO()).slice(0, 10);
    out.push({
      id: `${t.id}:${mode}`,
      tenderId: t.id,
      tenderRef: t.reference || '',
      tenderTitle: t.title,
      stage: t.stage,
      description: t.title,
      category: t.reference || t.title,
      amount,
      date,
      // Inputs preserved so the Excel export can render the full math row.
      firstOffer: Number.isFinite(Number(t.firstOffer)) ? Number(t.firstOffer) : null,
      finalOffer: finalO,
      budget: Number.isFinite(Number(t.value)) ? Number(t.value) : null,
    });
  }
  return out;
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
