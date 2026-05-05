// Central catalog of all dashboard widgets.
// Each entry pairs a widget component with its display metadata
// (title, description, default size, category, icon). Presets and the
// dashboard view both look widgets up here by id.
import {
  Activity, Award, Calendar, ClipboardList, DollarSign, FileText,
  Sparkles, Target, TrendingUp,
} from 'lucide-react';

import Widget_Hero from '../widgets/Hero';
import Widget_KpiTasks from '../widgets/KpiTasks';
import Widget_KpiTenders from '../widgets/KpiTenders';
import Widget_KpiSavings from '../widgets/KpiSavings';
import Widget_KpiPerformance from '../widgets/KpiPerformance';
import Widget_SavingsChart from '../widgets/SavingsChart';
import Widget_TaskStatus from '../widgets/TaskStatus';
import Widget_UpcomingDeadlines from '../widgets/UpcomingDeadlines';
import Widget_AnnualTarget from '../widgets/AnnualTarget';
import Widget_RecentActivity from '../widgets/RecentActivity';
import Widget_TenderPipeline from '../widgets/TenderPipeline';
import Widget_SavingsByCategory from '../widgets/SavingsByCategory';
import Widget_QuickActions from '../widgets/QuickActions';

// Default widget layout — used as the fallback / "Standard" preset.
export const DEFAULT_DASHBOARD_LAYOUT = [
  { id: 'hero', span: 4 },
  { id: 'kpi-tasks', span: 1 },
  { id: 'kpi-tenders', span: 1 },
  { id: 'kpi-savings', span: 1 },
  { id: 'kpi-performance', span: 1 },
  { id: 'savings-chart', span: 3 },
  { id: 'task-status', span: 1 },
  { id: 'upcoming-deadlines', span: 2 },
  { id: 'annual-target', span: 2 },
];

export const WIDGET_REGISTRY = {
  'hero': { id: 'hero', title: 'Welcome Banner', description: 'Time-of-day greeting with daily summary', category: 'Header', icon: Sparkles, defaultSpan: 4, minSpan: 1, maxSpan: 4, component: Widget_Hero },
  'kpi-tasks': { id: 'kpi-tasks', title: 'Active Tasks', description: 'Open tasks count with completion rate', category: 'KPI', icon: ClipboardList, defaultSpan: 1, minSpan: 1, maxSpan: 4, component: Widget_KpiTasks },
  'kpi-tenders': { id: 'kpi-tenders', title: 'Active Tenders', description: 'Tenders in pipeline with total value', category: 'KPI', icon: FileText, defaultSpan: 1, minSpan: 1, maxSpan: 4, component: Widget_KpiTenders },
  'kpi-savings': { id: 'kpi-savings', title: 'YTD Savings', description: 'Year-to-date savings vs annual target', category: 'KPI', icon: DollarSign, defaultSpan: 1, minSpan: 1, maxSpan: 4, component: Widget_KpiSavings },
  'kpi-performance': { id: 'kpi-performance', title: 'Performance', description: 'Task completion rate', category: 'KPI', icon: Award, defaultSpan: 1, minSpan: 1, maxSpan: 4, component: Widget_KpiPerformance },
  'savings-chart': { id: 'savings-chart', title: 'Savings Trend', description: 'Area chart of last 6 months', category: 'Chart', icon: TrendingUp, defaultSpan: 3, minSpan: 1, maxSpan: 4, component: Widget_SavingsChart },
  'task-status': { id: 'task-status', title: 'Task Status', description: 'Pie chart of task distribution', category: 'Chart', icon: ClipboardList, defaultSpan: 1, minSpan: 1, maxSpan: 4, component: Widget_TaskStatus },
  'upcoming-deadlines': { id: 'upcoming-deadlines', title: 'Upcoming Deadlines', description: 'Next priority items by date', category: 'List', icon: Calendar, defaultSpan: 2, minSpan: 1, maxSpan: 4, component: Widget_UpcomingDeadlines },
  'annual-target': { id: 'annual-target', title: 'Annual Target', description: 'Savings target progress with stats', category: 'KPI', icon: Target, defaultSpan: 2, minSpan: 1, maxSpan: 4, component: Widget_AnnualTarget },
  'recent-activity': { id: 'recent-activity', title: 'Recent Activity', description: 'Latest workspace events', category: 'List', icon: Activity, defaultSpan: 2, minSpan: 1, maxSpan: 4, component: Widget_RecentActivity },
  'tender-pipeline': { id: 'tender-pipeline', title: 'Tender Pipeline', description: 'Tenders grouped by stage', category: 'List', icon: FileText, defaultSpan: 4, minSpan: 1, maxSpan: 4, component: Widget_TenderPipeline },
  'savings-by-category': { id: 'savings-by-category', title: 'Savings by Category', description: 'Bar chart of savings categories', category: 'Chart', icon: DollarSign, defaultSpan: 2, minSpan: 1, maxSpan: 4, component: Widget_SavingsByCategory },
  'quick-actions': { id: 'quick-actions', title: 'Quick Actions', description: 'One-tap navigation buttons', category: 'Utility', icon: Sparkles, defaultSpan: 1, minSpan: 1, maxSpan: 4, component: Widget_QuickActions },
};
