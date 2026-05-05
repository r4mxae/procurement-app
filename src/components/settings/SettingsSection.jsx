// Settings group container.

export function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <section className="pd-card p-6 mb-4 pd-anim-in">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          <Icon size={18} strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="pd-display text-2xl font-medium leading-tight">{title}</h3>
          {description && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>}
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}
