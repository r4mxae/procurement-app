// Segmented two-option toggle.

export const ModeToggle = ({ value, onChange, options }) => (
  <div className="inline-flex p-1 rounded-lg" style={{ background: 'var(--surface-2)' }}>
    {options.map(opt => {
      const active = value === opt.id;
      return (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className="px-3.5 py-1.5 rounded-md text-xs font-medium transition-all"
          style={{
            background: active ? 'var(--surface)' : 'transparent',
            color: active ? 'var(--text)' : 'var(--text-muted)',
            boxShadow: active ? '0 2px 6px -2px rgba(0,0,0,0.2)' : 'none'
          }}
          onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);
