// Demo data — used on first run, on "Reset to demo" in Settings,
// and as a fallback when storage hydration fails.
import { uid } from './format';

export const seedData = () => {
  const today = new Date();
  const offsetDate = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const tasks = [
    { id: uid(), title: 'Review Q2 vendor performance reports', description: 'Compile KPIs from top 10 strategic vendors', status: 'in_progress', priority: 'high', category: 'Vendor Management', deadline: offsetDate(3), createdAt: offsetDate(-7), workLogs: [
      { id: uid(), startTime: new Date(Date.now() - 86400000 * 2 - 9000000).toISOString(), endTime: new Date(Date.now() - 86400000 * 2 - 4000000).toISOString(), durationSeconds: 5000, note: 'Pulled performance data for top 5 vendors and started building the comparison matrix.' },
      { id: uid(), startTime: new Date(Date.now() - 86400000 - 3600000).toISOString(), endTime: new Date(Date.now() - 86400000 - 1800000).toISOString(), durationSeconds: 1800, note: 'Reviewed delivery KPIs and flagged two vendors for follow-up.' }
    ] },
    { id: uid(), title: 'Negotiate office supplies contract renewal', description: 'Target 8% reduction on annual spend', status: 'todo', priority: 'medium', category: 'Negotiation', deadline: offsetDate(10), createdAt: offsetDate(-2), workLogs: [] },
    { id: uid(), title: 'Approve IT hardware purchase orders', description: '3 pending POs for engineering team', status: 'todo', priority: 'critical', category: 'Sourcing', deadline: offsetDate(1), createdAt: offsetDate(-1), workLogs: [] },
    { id: uid(), title: 'Update vendor master data', description: 'Clean up inactive vendor records', status: 'completed', priority: 'low', category: 'Compliance', deadline: offsetDate(-3), createdAt: offsetDate(-14), workLogs: [
      { id: uid(), startTime: new Date(Date.now() - 86400000 * 4).toISOString(), endTime: new Date(Date.now() - 86400000 * 4 + 7200000).toISOString(), durationSeconds: 7200, note: 'Cleaned 47 inactive vendor records and archived legacy entries.' }
    ] },
    { id: uid(), title: 'Prepare monthly procurement report', description: 'Spend analysis and savings dashboard', status: 'in_progress', priority: 'high', category: 'Reporting', deadline: offsetDate(5), createdAt: offsetDate(-4), workLogs: [] }
  ];

  const tenders = [
    { id: uid(), title: 'Facilities Management Services', reference: 'TND-2026-001', stage: 'evaluation', value: 1250000, vendorCount: 7, deadline: offsetDate(12), savings: 0, notes: 'Three-year contract, 5 sites', createdAt: offsetDate(-30), workLogs: [
      { id: uid(), startTime: new Date(Date.now() - 86400000 * 7).toISOString(), endTime: new Date(Date.now() - 86400000 * 7 + 5400000).toISOString(), durationSeconds: 5400, note: 'Drafted RFP scope and circulated to internal stakeholders for review.' },
      { id: uid(), startTime: new Date(Date.now() - 86400000 * 3).toISOString(), endTime: new Date(Date.now() - 86400000 * 3 + 10800000).toISOString(), durationSeconds: 10800, note: 'Reviewed vendor responses, scored technical proposals against weighted criteria.' }
    ] },
    { id: uid(), title: 'Cloud Infrastructure Migration', reference: 'TND-2026-004', stage: 'awarded', value: 890000, vendorCount: 4, deadline: offsetDate(-5), savings: 142000, notes: 'Awarded to incumbent at reduced rate', createdAt: offsetDate(-60), workLogs: [] },
    { id: uid(), title: 'Marketing Agency Panel', reference: 'TND-2026-007', stage: 'published', value: 450000, vendorCount: 12, deadline: offsetDate(21), savings: 0, notes: 'Framework agreement', createdAt: offsetDate(-10), workLogs: [] },
    { id: uid(), title: 'Logistics & Distribution Partner', reference: 'TND-2026-002', stage: 'draft', value: 2100000, vendorCount: 0, deadline: offsetDate(45), savings: 0, notes: 'Specs under review', createdAt: offsetDate(-3), workLogs: [] }
  ];

  const savings = [
    { id: uid(), description: 'Cloud Infrastructure renegotiation', amount: 142000, category: 'Negotiation', date: offsetDate(-15), tenderRef: 'TND-2026-004' },
    { id: uid(), description: 'Office supplies vendor consolidation', amount: 38500, category: 'Vendor Consolidation', date: offsetDate(-45), tenderRef: '' },
    { id: uid(), description: 'Travel booking process optimization', amount: 22000, category: 'Process Optimization', date: offsetDate(-75), tenderRef: '' },
    { id: uid(), description: 'Print services volume discount', amount: 15800, category: 'Volume Discount', date: offsetDate(-110), tenderRef: '' },
    { id: uid(), description: 'IT hardware spec rationalization', amount: 47200, category: 'Specification Change', date: offsetDate(-30), tenderRef: '' }
  ];

  const activity = [
    { id: uid(), type: 'task_created', message: 'Created task: Approve IT hardware purchase orders', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: uid(), type: 'tender_advanced', message: 'Tender TND-2026-001 advanced to Evaluation', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: uid(), type: 'savings_logged', message: 'Logged $142,000 savings on Cloud Infrastructure', timestamp: new Date(Date.now() - 86400000 * 15).toISOString() },
    { id: uid(), type: 'task_completed', message: 'Completed: Update vendor master data', timestamp: new Date(Date.now() - 86400000 * 3).toISOString() }
  ];

  return {
    tasks, tenders, savings, activity,
    activeTimer: null,
    profile: {
      name: 'Procurement Specialist',
      role: 'Senior Buyer',
      targetMode: 'absolute',
      annualTarget: 500000,
      targetPercentage: 8
    },
    settings: {
      currency: 'USD',
      dateFormat: 'medium',
      urgentDaysThreshold: 3,
      defaultTaskPriority: 'medium',
      accentPreset: 'theme',
      customTaskCategories: [],
      customSavingsCategories: [],
      textSize: 'regular',
      boldText: false,
      slaPresets: { rfq: 18, vo: 20, rfi: 25, rfp: 85 },
      workWeek: [1, 2, 3, 4, 5],
    }
  };
};
