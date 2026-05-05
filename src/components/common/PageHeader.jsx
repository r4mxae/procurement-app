// Standard page header with title/subtitle/action slot.

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="pd-page-header mb-8 flex items-end justify-between gap-4 flex-wrap pd-anim-in">
      <div>
        <h1 className="pd-display text-3xl sm:text-4xl font-medium tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
