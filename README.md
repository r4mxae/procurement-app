# Procurement Dashboard

A modular React + Vite dashboard for procurement employees — tasks, tenders, savings tracking, time logging, performance analytics, and Excel export. Six themes including high-contrast modes, accessibility controls, and full responsive design.

## Quick start

```bash
npm install
npm run dev      # development server at http://localhost:5173
npm run build    # production bundle to dist/
npm run preview  # preview the production bundle
```

Tested with Node 18 and 20.

## Project layout

```
src/
├── App.jsx                  # Application shell — owns state, routing, layout
├── main.jsx                 # Vite entrypoint
│
├── components/
│   ├── common/              # Reusable UI primitives (Modal, Field, Pill, etc.)
│   ├── dashboard/           # Widget registry, presets, span helpers, KPI tiles
│   ├── modals/              # LogEntryModal, ViewLogsModal, TargetEditorBody
│   ├── performance/         # Performance-page sub-components
│   ├── savings/             # Savings-form
│   ├── settings/            # Settings page sub-components
│   ├── tasks/               # Task row + form
│   ├── tenders/             # Tender card + form
│   ├── widgets/             # 13 dashboard widgets, one file each
│   └── work/                # Work-page row component
│
├── constants/
│   ├── domain.js            # Task statuses, priorities, tender stages, categories
│   ├── locale.js            # Currencies, accent presets, date formats, themes
│   ├── logos.js             # Base64 PNG logo variants
│   └── storage.js           # localStorage key constants
│
├── hooks/
│   ├── useIsMobile.js       # matchMedia-based breakpoint hook
│   └── useNowTick.js        # Shared 1Hz tick (single setInterval, many subscribers)
│
├── lib/
│   ├── excel.js             # Two-sheet styled .xlsx workbook builder
│   ├── format.js            # Money / date / duration formatters + display config
│   ├── seedData.js          # Demo data for first-run / reset
│   └── storage.js           # localStorage adapter, registers window.storage shim
│
├── styles/
│   ├── base.css             # Typography, layout, all component styles
│   ├── index.css            # Top-level entrypoint, imports base + every theme
│   └── themes/
│       ├── obsidian.css     # Default — charcoal & amber
│       ├── porcelain.css    # Cream & teal (light)
│       ├── midnight.css     # Indigo & rose
│       ├── forest.css       # Pine & copper
│       ├── mono.css         # High-contrast minimalist (light)
│       └── mono-dark.css    # High-contrast minimalist (dark)
│
└── views/                   # Page-level views — one per nav item
    ├── ActivityView.jsx
    ├── DashboardView.jsx
    ├── PerformanceView.jsx
    ├── SavingsView.jsx
    ├── SettingsView.jsx
    ├── TasksView.jsx
    ├── TendersView.jsx
    └── WorkView.jsx
```

## Key concepts

### Storage

Data persists to `localStorage` under four keys:

- `procurement_dashboard_v3` — main app state (tasks, tenders, savings, profile, settings)
- `procurement_theme_v3` — selected theme id
- `procurement_sidebar_v1` — sidebar collapsed state
- `procurement_dashboard_preset_v1` — selected dashboard preset

The async API in `src/lib/storage.js` mirrors the original artifact-runtime `window.storage` interface, so view components don't need to change.

### Themes

Each theme is a CSS file scoped under `[data-theme="..."]` defining a CSS-variable palette (`--bg`, `--surface`, `--accent`, etc.). The `App` component sets `data-theme` on the root `<div>` and the cascade does the rest. Theme switching is instant — no remount, no re-render of any component besides the wrapper.

### Display config

Money, date, and duration formatters in `src/lib/format.js` read from a module-level `_display` object. The App syncs this object whenever settings change (currency, date format, urgent-deadline threshold), then forces a re-render so all visible values update at once.

### Shared 1Hz tick

`useNowTick()` subscribes the calling component to a single `setInterval` shared across the whole app. Only the few components that display a live duration (`<LiveDuration>`, the active-timer banner) re-render on the beat — the rest of the React tree stays stable.

### Dashboard presets

Five built-in layouts (`Standard`, `Compact`, `Sourcing Focus`, `Performance`, `Time & Tasks`) defined in `src/components/dashboard/presets.js`. Each is a list of `{ id, span }` referencing entries in `src/components/dashboard/widgetRegistry.js`. Adding a new preset is a one-object diff in `presets.js`; adding a new widget means writing the component file in `src/components/widgets/` and adding a `WIDGET_REGISTRY` entry.

## Adding a new widget

1. Create `src/components/widgets/MyWidget.jsx`. The component receives `{ data, setView, disabled }` props.
2. Add an entry in `src/components/dashboard/widgetRegistry.js` keyed by a unique id, with `title`, `description`, `category`, `icon`, `defaultSpan`, and `component` pointing at the import.
3. Reference the id in any preset's `layout` array.

## Adding a new theme

1. Create `src/styles/themes/my-theme.css` defining variables under `[data-theme="my-theme"]`.
2. Add the import in `src/styles/index.css`.
3. Add `{ id: 'my-theme', name: 'My Theme', hint: '…', dot: '#color' }` to `THEMES` in `src/constants/locale.js`.
4. If the new theme has a light background, add its id to `LIGHT_THEMES` in the same file (controls which logo variant is shown).

## License

Private project — no license attached.
