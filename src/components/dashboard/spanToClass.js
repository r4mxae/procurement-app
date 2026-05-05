// Map a column span (1–4) to its Tailwind grid-column-span class string.
// Matches the `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` breakpoints
// used by the dashboard grid.
export const spanToClass = (span) => {
  switch (span) {
    case 1: return 'col-span-1';
    case 2: return 'col-span-1 md:col-span-2';
    case 3: return 'col-span-1 md:col-span-2 lg:col-span-3';
    case 4: return 'col-span-1 md:col-span-2 lg:col-span-4';
    default: return 'col-span-1';
  }
};
