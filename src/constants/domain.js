// Domain-specific enums and category lists
import { CircleDot, Clock, CheckCircle2 } from 'lucide-react';

export const TASK_STATUSES = [
  { id: 'todo', label: 'To Do', icon: CircleDot },
  { id: 'in_progress', label: 'In Progress', icon: Clock },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
];

export const PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'critical', label: 'Critical' },
];

export const TASK_CATEGORIES = [
  'Sourcing',
  'Negotiation',
  'Contract Review',
  'Vendor Management',
  'Compliance',
  'Reporting',
  'Other',
];

export const TENDER_STAGES = [
  { id: 'draft', label: 'Draft' },
  { id: 'published', label: 'Published' },
  { id: 'evaluation', label: 'Evaluation' },
  { id: 'awarded', label: 'Awarded' },
  { id: 'closed', label: 'Closed' },
];

export const SAVINGS_CATEGORIES = [
  'Negotiation',
  'Process Optimization',
  'Vendor Consolidation',
  'Volume Discount',
  'Specification Change',
  'Other',
];

// SLA presets — used by the task/tender forms. The numeric value is the
// default working-days count for each procurement instrument; the user
// can override per-item or change the defaults in Settings → Workflow.
export const SLA_TYPES = [
  { id: 'rfq',    label: 'RFQ',    description: 'Request for Quotation',     defaultDays: 18 },
  { id: 'vo',     label: 'VO',     description: 'Variation Order',           defaultDays: 20 },
  { id: 'rfi',    label: 'RFI',    description: 'Request for Information',   defaultDays: 25 },
  { id: 'rfp',    label: 'RFP',    description: 'Request for Proposal',      defaultDays: 85 },
  { id: 'custom', label: 'Custom', description: 'Bespoke SLA',               defaultDays: 5  },
];

export const DEFAULT_SLA_PRESETS = {
  rfq: 18, vo: 20, rfi: 25, rfp: 85,
};

// ISO weekday numbers — Monday=1 … Sunday=7. Default is the standard
// Mon–Fri work week; the user can configure their own in Settings.
export const WEEKDAYS = [
  { id: 1, label: 'Mon', long: 'Monday' },
  { id: 2, label: 'Tue', long: 'Tuesday' },
  { id: 3, label: 'Wed', long: 'Wednesday' },
  { id: 4, label: 'Thu', long: 'Thursday' },
  { id: 5, label: 'Fri', long: 'Friday' },
  { id: 6, label: 'Sat', long: 'Saturday' },
  { id: 7, label: 'Sun', long: 'Sunday' },
];

export const DEFAULT_WORK_WEEK = [1, 2, 3, 4, 5];
