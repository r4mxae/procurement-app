// Horizontal filter tab bar.

export function FilterTabs({ options, value, onChange }) {
  return (
    <div className="inline-flex p-1 rounded-lg" style={{ background: 'var(--surface-2)' }}>
      {options.map(opt => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all flex items-center gap-1.5"
            style={{
              background: active ? 'var(--surface)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: active ? '0 2px 6px -2px rgba(0,0,0,0.2)' : 'none'
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {opt.label}
            {opt.count != null && (
              <span className="text-[10px] pd-mono px-1 rounded" style={{ background: active ? 'var(--accent-soft)' : 'transparent', color: active ? 'var(--accent)' : 'inherit' }}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
