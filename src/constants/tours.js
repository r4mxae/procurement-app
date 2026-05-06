// Guided tour definitions — each tour is a sequence of steps that the
// TourOverlay walks through. Steps are declarative; the overlay handles
// measurement, positioning, and view-switching.
//
// Step shape:
//   { target: 'CSS selector', view?: 'tasks', title, body, placement? }
//
// `view`     — switches to this view before showing the step. Used to
//              cross-page tours (e.g. sidebar tour navigates as it goes).
// `target`   — CSS selector for the element to spotlight. We standardized
//              on `data-tour="<id>"` attributes scattered through the
//              source so the selectors stay stable across refactors.
// `placement`— preferred tooltip side: 'right' | 'left' | 'top' | 'bottom'
//              | 'center' (no anchor — used when there's no element to
//              point at, e.g. a welcome step).

export const TOURS = {
  'getting-started': {
    name: 'Getting started',
    description: 'A 1-minute tour of the sidebar so you know what each tab is for.',
    steps: [
      {
        target: '[data-tour="sidebar-dashboard"]',
        view: 'dashboard',
        title: 'Dashboard',
        body: 'Your daily landing page — KPIs, upcoming deadlines, and recent activity all in one view.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-work"]',
        view: 'dashboard',
        title: 'All Work',
        body: 'A unified inbox of every open task and tender. Use the timer button on any row to start tracking time.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-tasks"]',
        view: 'dashboard',
        title: 'Tasks',
        body: 'Day-to-day work items: priorities, statuses, SLAs, and time logs.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-tenders"]',
        view: 'dashboard',
        title: 'Tenders',
        body: 'Lifecycle items with stages, budget, and the commercial offers that drive savings.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-closed"]',
        view: 'dashboard',
        title: 'Closed',
        body: 'Completed tasks and closed tenders land here. Still searchable, still editable.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-savings"]',
        view: 'dashboard',
        title: 'Savings',
        body: 'Auto-derived from tender offers — no manual logging. Two sub-tabs: vs first offer and vs budget.',
        placement: 'right',
      },
      {
        target: '[data-tour="sidebar-settings"]',
        view: 'dashboard',
        title: 'Settings',
        body: 'Profile, theme, currency, SLA presets, and your work week. Tweak anything to match your workflow.',
        placement: 'right',
      },
    ],
  },

  'tasks-tour': {
    name: 'Tasks tour',
    description: 'How to add, prioritize, and complete tasks.',
    steps: [
      {
        target: '[data-tour="page-header"]',
        view: 'tasks',
        title: 'The Tasks tab',
        body: 'Only open tasks live here — completed ones move to the Closed tab to keep this view focused.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="new-task-btn"]',
        view: 'tasks',
        title: 'Add a new task',
        body: 'Click here to open the New Task form. Title and priority are required; everything else (SLA, category, deadline) is optional.',
        placement: 'left',
      },
      {
        target: '[data-tour="filter-tabs"]',
        view: 'tasks',
        title: 'Filter chips',
        body: 'Filter by status. The number badges update live as you move tasks between buckets.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="search-input"]',
        view: 'tasks',
        title: 'Quick search',
        body: 'Search by title or description. Combines with the filter chips above.',
        placement: 'bottom',
      },
    ],
  },

  'tenders-tour': {
    name: 'Tenders tour',
    description: 'Working with tender stages, budget, and offers.',
    steps: [
      {
        target: '[data-tour="page-header"]',
        view: 'tenders',
        title: 'The Tenders tab',
        body: 'Open tenders only — Awarded and Closed tenders move to the Closed tab automatically.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="new-tender-btn"]',
        view: 'tenders',
        title: 'Add a new tender',
        body: 'Click here to start a tender. Pick a stage, set a budget, and an SLA — the deadline is computed for you.',
        placement: 'left',
      },
      {
        target: '[data-tour="filter-tabs"]',
        view: 'tenders',
        title: 'Stage filter',
        body: 'Switch between stages (Draft, Published, Evaluation) to focus on what needs attention right now.',
        placement: 'bottom',
      },
    ],
  },

  'savings-tour': {
    name: 'Savings tour',
    description: 'How auto-savings work and what the two sub-tabs mean.',
    steps: [
      {
        target: '[data-tour="page-header"]',
        view: 'savings',
        title: 'Auto-derived savings',
        body: 'Every number on this page comes from your tenders. The instant a tender has a final offer, it shows up here.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="savings-snapshot-btn"]',
        view: 'savings',
        title: 'Snapshot',
        body: 'Download a PNG of the current dashboard. Useful for sharing in chat or pasting into a deck.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="savings-export-btn"]',
        view: 'savings',
        title: 'Excel export',
        body: 'A 2-sheet workbook (vs first offer and vs budget) with every contributing tender and the math.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="filter-tabs"]',
        view: 'savings',
        title: 'Two views, same dashboard',
        body: 'Switch between vs First Offer (negotiation gain) and vs Budget (under-plan delta). Same KPIs, same charts.',
        placement: 'bottom',
      },
    ],
  },

  'settings-tour': {
    name: 'Settings tour',
    description: 'Where to tune the app to match your workflow.',
    steps: [
      {
        target: '[data-tour="page-header"]',
        view: 'settings',
        title: 'The Settings page',
        body: 'Most settings save automatically. Profile is the one exception — it has its own Save button.',
        placement: 'bottom',
      },
    ],
  },
};
