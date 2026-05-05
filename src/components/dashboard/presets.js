// Built-in dashboard layout presets.
// Each preset is a curated arrangement of widgets for a particular workflow.
import { FileText, LayoutDashboard, LayoutGrid, ListChecks, TrendingUp } from 'lucide-react';

export const DASHBOARD_PRESETS = [
  {
    id: 'default',
    name: 'Standard',
    description: 'Balanced overview — KPIs, savings trend, status, deadlines',
    icon: LayoutDashboard,
    layout: [
      { id: 'hero', span: 4 },
      { id: 'kpi-tasks', span: 1 },
      { id: 'kpi-tenders', span: 1 },
      { id: 'kpi-savings', span: 1 },
      { id: 'kpi-performance', span: 1 },
      { id: 'savings-chart', span: 3 },
      { id: 'task-status', span: 1 },
      { id: 'upcoming-deadlines', span: 2 },
      { id: 'annual-target', span: 2 }
    ]
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Just the numbers — KPIs and a quick status snapshot',
    icon: LayoutGrid,
    layout: [
      { id: 'kpi-tasks', span: 1 },
      { id: 'kpi-tenders', span: 1 },
      { id: 'kpi-savings', span: 1 },
      { id: 'kpi-performance', span: 1 },
      { id: 'task-status', span: 2 },
      { id: 'upcoming-deadlines', span: 2 }
    ]
  },
  {
    id: 'sourcing',
    name: 'Sourcing Focus',
    description: 'For tender-heavy workflows — pipeline, deadlines, savings',
    icon: FileText,
    layout: [
      { id: 'hero', span: 4 },
      { id: 'kpi-tenders', span: 2 },
      { id: 'kpi-savings', span: 2 },
      { id: 'tender-pipeline', span: 2 },
      { id: 'upcoming-deadlines', span: 2 },
      { id: 'savings-by-category', span: 2 },
      { id: 'savings-chart', span: 2 }
    ]
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Targets, trends, and progress against the annual goal',
    icon: TrendingUp,
    layout: [
      { id: 'hero', span: 4 },
      { id: 'annual-target', span: 2 },
      { id: 'kpi-performance', span: 1 },
      { id: 'kpi-savings', span: 1 },
      { id: 'savings-chart', span: 4 },
      { id: 'savings-by-category', span: 2 },
      { id: 'recent-activity', span: 2 }
    ]
  },
  {
    id: 'time-tracking',
    name: 'Time & Tasks',
    description: 'Day-to-day work view — tasks, deadlines, and recent activity',
    icon: ListChecks,
    layout: [
      { id: 'kpi-tasks', span: 1 },
      { id: 'kpi-tenders', span: 1 },
      { id: 'kpi-performance', span: 2 },
      { id: 'task-status', span: 2 },
      { id: 'upcoming-deadlines', span: 2 },
      { id: 'recent-activity', span: 4 },
      { id: 'quick-actions', span: 4 }
    ]
  }
];
