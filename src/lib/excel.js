// Excel export — produces a 2-sheet .xlsx workbook with cell styling.
// Sheet 1 "Summary": items overview with totals row.
// Sheet 2 "Detailed Logs": flattened log entries sorted by date.
//
// Uses @e965/xlsx (community fork of SheetJS) — the original `xlsx@0.18.5`
// on npm has unpatched CVE-2023-30533 (proto pollution) and CVE-2024-22363
// (ReDoS); the SheetJS fixes were never republished to npm.
import * as XLSX from '@e965/xlsx';
import { TASK_STATUSES, TENDER_STAGES } from '../constants/domain';
import { fmtDate, fmtDuration, fmtTimeOfDay, todayISO, totalLoggedSeconds } from './format';

// Style presets — applied via cell.s; will render in xlsx-js-style or compatible writers
const STYLE = {
  reportTitle: {
    font: { name: 'Calibri', sz: 20, bold: true, color: { rgb: 'FFFFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FF1F2937' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { bottom: { style: 'medium', color: { rgb: 'FFD4A574' } } }
  },
  reportSubtitle: {
    font: { name: 'Calibri', sz: 11, italic: true, color: { rgb: 'FF6B7280' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  },
  metaLabel: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FF6B7280' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  },
  metaValue: {
    font: { name: 'Calibri', sz: 11, color: { rgb: 'FF111827' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  },
  sectionBanner: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFD4A574' } },
    alignment: { horizontal: 'left', vertical: 'center', indent: 1 }
  },
  tableHeader: {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FF374151' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'FF1F2937' } },
      bottom: { style: 'thin', color: { rgb: 'FF1F2937' } },
      left: { style: 'thin', color: { rgb: 'FF1F2937' } },
      right: { style: 'thin', color: { rgb: 'FF1F2937' } }
    }
  },
  cell: {
    font: { name: 'Calibri', sz: 10, color: { rgb: 'FF111827' } },
    alignment: { vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { rgb: 'FFE5E7EB' } }
    }
  },
  cellAlt: {
    font: { name: 'Calibri', sz: 10, color: { rgb: 'FF111827' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFAF8F3' } },
    alignment: { vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { rgb: 'FFE5E7EB' } }
    }
  },
  cellMono: {
    font: { name: 'Consolas', sz: 10, color: { rgb: 'FF111827' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { rgb: 'FFE5E7EB' } }
    }
  },
  totals: {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FF1F2937' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFEF3C7' } },
    alignment: { vertical: 'center' },
    border: {
      top: { style: 'medium', color: { rgb: 'FFD4A574' } },
      bottom: { style: 'medium', color: { rgb: 'FFD4A574' } }
    }
  },
  sectionTitle: {
    font: { name: 'Calibri', sz: 13, bold: true, color: { rgb: 'FF1F2937' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFF4F0E6' } },
    alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
    border: { left: { style: 'medium', color: { rgb: 'FFD4A574' } } }
  }
};

const setCell = (ws, addr, value, style = null) => {
  const cell = { v: value, t: typeof value === 'number' ? 'n' : 's' };
  if (style) cell.s = style;
  ws[addr] = cell;
};

const colLetter = (idx) => {
  let s = '';
  let n = idx;
  while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; }
  return s;
};

const buildSummarySheet = (profile, items) => {
  const ws = {};
  let r = 0;

  // Title row
  setCell(ws, `A${r + 1}`, 'WORK LOG REPORT', STYLE.reportTitle);
  // We'll merge A:F for title
  r++;
  // Subtitle
  setCell(ws, `A${r + 1}`, `Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`, STYLE.reportSubtitle);
  r += 2; // skip empty row

  // Meta block
  setCell(ws, `A${r + 1}`, 'EMPLOYEE', STYLE.metaLabel);
  setCell(ws, `B${r + 1}`, profile?.name || '—', STYLE.metaValue);
  setCell(ws, `D${r + 1}`, 'POSITION', STYLE.metaLabel);
  setCell(ws, `E${r + 1}`, profile?.role || '—', STYLE.metaValue);
  r++;
  setCell(ws, `A${r + 1}`, 'PERIOD', STYLE.metaLabel);
  setCell(ws, `B${r + 1}`, `${new Date().getFullYear()}`, STYLE.metaValue);
  setCell(ws, `D${r + 1}`, 'ITEMS', STYLE.metaLabel);
  setCell(ws, `E${r + 1}`, `${items.length}`, STYLE.metaValue);
  r += 2;

  // Section banner
  setCell(ws, `A${r + 1}`, '  ITEMS OVERVIEW', STYLE.sectionBanner);
  for (let c = 1; c < 6; c++) setCell(ws, `${colLetter(c)}${r + 1}`, '', STYLE.sectionBanner);
  r++;

  // Table headers
  const headers = ['Type', 'Title', 'Status / Stage', 'Expected Deadline', 'Total Time', 'Sessions'];
  headers.forEach((h, c) => setCell(ws, `${colLetter(c)}${r + 1}`, h, STYLE.tableHeader));
  const headerRow = r;
  r++;

  // Data rows
  let totalSeconds = 0;
  let totalSessions = 0;
  items.forEach((item, i) => {
    const logs = item.workLogs || [];
    const itemSeconds = totalLoggedSeconds(logs);
    totalSeconds += itemSeconds;
    totalSessions += logs.length;
    const status = item.kind === 'task' ? (TASK_STATUSES.find(s => s.id === item.status)?.label || item.status) : (TENDER_STAGES.find(s => s.id === item.stage)?.label || item.stage);
    const cellStyle = i % 2 === 0 ? STYLE.cell : STYLE.cellAlt;
    const monoStyle = i % 2 === 0 ? STYLE.cellMono : { ...STYLE.cellMono, fill: STYLE.cellAlt.fill };
    setCell(ws, `A${r + 1}`, item.kind === 'task' ? 'Task' : 'Tender', { ...cellStyle, alignment: { horizontal: 'center', vertical: 'center' } });
    setCell(ws, `B${r + 1}`, item.title, cellStyle);
    setCell(ws, `C${r + 1}`, status, cellStyle);
    setCell(ws, `D${r + 1}`, item.deadline ? fmtDate(item.deadline) : '—', monoStyle);
    setCell(ws, `E${r + 1}`, fmtDuration(itemSeconds), monoStyle);
    setCell(ws, `F${r + 1}`, logs.length, monoStyle);
    r++;
  });

  // Totals row
  r++;
  setCell(ws, `A${r + 1}`, 'TOTAL', STYLE.totals);
  setCell(ws, `B${r + 1}`, '', STYLE.totals);
  setCell(ws, `C${r + 1}`, '', STYLE.totals);
  setCell(ws, `D${r + 1}`, '', STYLE.totals);
  setCell(ws, `E${r + 1}`, fmtDuration(totalSeconds), { ...STYLE.totals, alignment: { horizontal: 'center', vertical: 'center' } });
  setCell(ws, `F${r + 1}`, totalSessions, { ...STYLE.totals, alignment: { horizontal: 'center', vertical: 'center' } });
  r++;

  // Set range
  ws['!ref'] = `A1:F${r}`;
  ws['!cols'] = [
    { wch: 10 },  // Type
    { wch: 42 },  // Title
    { wch: 18 },  // Status
    { wch: 22 },  // Deadline
    { wch: 14 },  // Total time
    { wch: 11 }   // Sessions
  ];
  ws['!rows'] = [{ hpt: 28 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title row
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Subtitle
    { s: { r: headerRow - 1, c: 0 }, e: { r: headerRow - 1, c: 5 } } // Section banner
  ];
  ws['!freeze'] = { ySplit: headerRow + 1, xSplit: 0 };

  return ws;
};

const buildDetailedSheet = (profile, items) => {
  const ws = {};
  let r = 0;

  setCell(ws, `A${r + 1}`, 'DETAILED WORK LOG', STYLE.reportTitle);
  r++;
  setCell(ws, `A${r + 1}`, `${profile?.name || '—'} · ${profile?.role || '—'}`, STYLE.reportSubtitle);
  r += 2;

  // Flatten logs
  const flatLogs = [];
  items.forEach(item => {
    (item.workLogs || []).forEach(log => {
      flatLogs.push({ ...log, _kind: item.kind, _title: item.title, _deadline: item.deadline });
    });
  });
  flatLogs.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  // Table headers
  const headers = ['Date', 'Start', 'End', 'Type', 'Item', 'Duration', 'Expected Deadline', 'Notes'];
  headers.forEach((h, c) => setCell(ws, `${colLetter(c)}${r + 1}`, h, STYLE.tableHeader));
  const headerRow = r;
  r++;

  let totalSeconds = 0;
  flatLogs.forEach((log, i) => {
    totalSeconds += Number(log.durationSeconds) || 0;
    const cellStyle = i % 2 === 0 ? STYLE.cell : STYLE.cellAlt;
    const monoStyle = i % 2 === 0 ? STYLE.cellMono : { ...STYLE.cellMono, fill: STYLE.cellAlt.fill };
    setCell(ws, `A${r + 1}`, fmtDate(log.startTime), monoStyle);
    setCell(ws, `B${r + 1}`, fmtTimeOfDay(log.startTime), monoStyle);
    setCell(ws, `C${r + 1}`, fmtTimeOfDay(log.endTime), monoStyle);
    setCell(ws, `D${r + 1}`, log._kind === 'task' ? 'Task' : 'Tender', { ...cellStyle, alignment: { horizontal: 'center', vertical: 'center' } });
    setCell(ws, `E${r + 1}`, log._title, cellStyle);
    setCell(ws, `F${r + 1}`, fmtDuration(log.durationSeconds), monoStyle);
    setCell(ws, `G${r + 1}`, log._deadline ? fmtDate(log._deadline) : '—', monoStyle);
    setCell(ws, `H${r + 1}`, log.note, cellStyle);
    r++;
  });

  if (flatLogs.length === 0) {
    setCell(ws, `A${r + 1}`, 'No log entries to display.', { ...STYLE.cell, alignment: { horizontal: 'center', vertical: 'center' } });
    r++;
  } else {
    r++;
    setCell(ws, `A${r + 1}`, 'TOTAL TIME LOGGED', STYLE.totals);
    for (let c = 1; c < 5; c++) setCell(ws, `${colLetter(c)}${r + 1}`, '', STYLE.totals);
    setCell(ws, `F${r + 1}`, fmtDuration(totalSeconds), { ...STYLE.totals, alignment: { horizontal: 'center', vertical: 'center' } });
    setCell(ws, `G${r + 1}`, '', STYLE.totals);
    setCell(ws, `H${r + 1}`, `${flatLogs.length} session${flatLogs.length === 1 ? '' : 's'}`, STYLE.totals);
    r++;
  }

  ws['!ref'] = `A1:H${r}`;
  ws['!cols'] = [
    { wch: 16 }, // Date
    { wch: 11 }, // Start
    { wch: 11 }, // End
    { wch: 10 }, // Type
    { wch: 36 }, // Item
    { wch: 13 }, // Duration
    { wch: 18 }, // Deadline
    { wch: 60 }  // Notes
  ];
  ws['!rows'] = [{ hpt: 28 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
  ];
  ws['!freeze'] = { ySplit: headerRow + 1, xSplit: 0 };

  return ws;
};

const exportWorkLogToExcel = ({ profile, items, filename }) => {
  try {
    const itemsWithLogs = items.filter(it => (it.workLogs || []).length > 0);
    const itemsToReport = itemsWithLogs.length > 0 ? itemsWithLogs : items;

    const wb = XLSX.utils.book_new();
    if (profile?.name) wb.Props = { Title: 'Work Log Report', Author: profile.name, CreatedDate: new Date() };

    const summary = buildSummarySheet(profile, itemsToReport);
    XLSX.utils.book_append_sheet(wb, summary, 'Summary');

    const detailed = buildDetailedSheet(profile, itemsToReport);
    XLSX.utils.book_append_sheet(wb, detailed, 'Detailed Logs');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `worklog-${todayISO()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 500);
  } catch (e) {
    console.error('Export failed', e);
    alert('Could not export Excel file: ' + (e.message || e));
  }
};

// ─── Savings export ────────────────────────────────────────────
// Two sheets, one per savings mode (vs first offer / vs budget). Each
// sheet renders the per-tender math (first/final/budget → derived
// amount), a totals row, and the YTD / all-time summary numbers the
// dashboard shows.
const buildSavingsSheet = (profile, mode, entries, year) => {
  const ws = {};
  let r = 0;

  const modeTitle = mode === 'vsFirst' ? 'SAVINGS VS FIRST OFFER' : 'SAVINGS VS BUDGET';
  setCell(ws, `A${r + 1}`, modeTitle, STYLE.reportTitle);
  r++;
  setCell(ws, `A${r + 1}`, `Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · ${profile?.name || '—'}`, STYLE.reportSubtitle);
  r += 2;

  const ytd = entries
    .filter(e => new Date(e.date).getFullYear() === year)
    .reduce((s, e) => s + Number(e.amount), 0);
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);

  // Meta block: KPIs
  setCell(ws, `A${r + 1}`, 'YEAR-TO-DATE', STYLE.metaLabel);
  setCell(ws, `B${r + 1}`, ytd, { ...STYLE.metaValue, numFmt: '#,##0' });
  setCell(ws, `D${r + 1}`, 'ALL-TIME', STYLE.metaLabel);
  setCell(ws, `E${r + 1}`, total, { ...STYLE.metaValue, numFmt: '#,##0' });
  r++;
  setCell(ws, `A${r + 1}`, 'TENDERS', STYLE.metaLabel);
  setCell(ws, `B${r + 1}`, entries.length, STYLE.metaValue);
  r += 2;

  setCell(ws, `A${r + 1}`, '  PER-TENDER BREAKDOWN', STYLE.sectionBanner);
  for (let c = 1; c < 7; c++) setCell(ws, `${colLetter(c)}${r + 1}`, '', STYLE.sectionBanner);
  r++;

  const headers = mode === 'vsFirst'
    ? ['Reference', 'Title', 'First Offer', 'Final Offer', 'Savings', 'Date', 'Stage']
    : ['Reference', 'Title', 'Budget',      'Final Offer', 'Savings', 'Date', 'Stage'];
  headers.forEach((h, c) => setCell(ws, `${colLetter(c)}${r + 1}`, h, STYLE.tableHeader));
  const headerRow = r;
  r++;

  // Sort by date desc — most recent at the top, like the on-screen list.
  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  sorted.forEach((e, i) => {
    const cellStyle = i % 2 === 0 ? STYLE.cell : STYLE.cellAlt;
    const monoStyle = i % 2 === 0 ? STYLE.cellMono : { ...STYLE.cellMono, fill: STYLE.cellAlt.fill };
    const left = mode === 'vsFirst' ? e.firstOffer : e.budget;
    setCell(ws, `A${r + 1}`, e.tenderRef || '—', monoStyle);
    setCell(ws, `B${r + 1}`, e.tenderTitle || '', cellStyle);
    setCell(ws, `C${r + 1}`, left ?? 0,            { ...monoStyle, numFmt: '#,##0' });
    setCell(ws, `D${r + 1}`, e.finalOffer ?? 0,    { ...monoStyle, numFmt: '#,##0' });
    setCell(ws, `E${r + 1}`, Number(e.amount) || 0, { ...monoStyle, numFmt: '#,##0' });
    setCell(ws, `F${r + 1}`, fmtDate(e.date), monoStyle);
    setCell(ws, `G${r + 1}`, e.stage || '', { ...cellStyle, alignment: { horizontal: 'center', vertical: 'center' } });
    r++;
  });

  if (sorted.length === 0) {
    setCell(ws, `A${r + 1}`, 'No tenders with the offers needed for this calculation yet.', { ...STYLE.cell, alignment: { horizontal: 'center', vertical: 'center' } });
    r++;
  } else {
    setCell(ws, `A${r + 1}`, 'TOTAL', STYLE.totals);
    setCell(ws, `B${r + 1}`, '', STYLE.totals);
    setCell(ws, `C${r + 1}`, '', STYLE.totals);
    setCell(ws, `D${r + 1}`, '', STYLE.totals);
    setCell(ws, `E${r + 1}`, total, { ...STYLE.totals, alignment: { horizontal: 'center', vertical: 'center' }, numFmt: '#,##0' });
    setCell(ws, `F${r + 1}`, '', STYLE.totals);
    setCell(ws, `G${r + 1}`, '', STYLE.totals);
    r++;
  }

  ws['!ref'] = `A1:G${r}`;
  ws['!cols'] = [
    { wch: 16 }, // Ref
    { wch: 40 }, // Title
    { wch: 16 }, // First/Budget
    { wch: 16 }, // Final
    { wch: 16 }, // Savings
    { wch: 14 }, // Date
    { wch: 14 }, // Stage
  ];
  ws['!rows'] = [{ hpt: 28 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    { s: { r: headerRow - 1, c: 0 }, e: { r: headerRow - 1, c: 6 } },
  ];
  ws['!freeze'] = { ySplit: headerRow + 1, xSplit: 0 };

  return ws;
};

const exportSavingsToExcel = ({ profile, vsFirst, vsBudget, filename }) => {
  try {
    const year = new Date().getFullYear();
    const wb = XLSX.utils.book_new();
    if (profile?.name) wb.Props = { Title: 'Savings Report', Author: profile.name, CreatedDate: new Date() };

    XLSX.utils.book_append_sheet(wb, buildSavingsSheet(profile, 'vsFirst',  vsFirst,  year), 'vs First Offer');
    XLSX.utils.book_append_sheet(wb, buildSavingsSheet(profile, 'vsBudget', vsBudget, year), 'vs Budget');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `savings-${todayISO()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 500);
  } catch (e) {
    console.error('Savings export failed', e);
    alert('Could not export Excel file: ' + (e.message || e));
  }
};

export { exportSavingsToExcel, exportWorkLogToExcel };
