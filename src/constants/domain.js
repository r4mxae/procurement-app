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
