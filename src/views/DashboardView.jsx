import React, { useEffect, useState } from 'react';
import { DASHBOARD_PRESETS } from '../components/dashboard/presets';
import { spanToClass } from '../components/dashboard/spanToClass';
import { WIDGET_REGISTRY } from '../components/dashboard/widgetRegistry';
import { DASHBOARD_PRESET_KEY } from '../constants/storage';
import { storage } from '../lib/storage';

function DashboardView({ data, setView }) {
  const [presetId, setPresetId] = useState('default');
  const [loaded, setLoaded] = useState(false);

  // Load saved preset selection
  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.get(DASHBOARD_PRESET_KEY);
        if (stored?.value) {
          const id = JSON.parse(stored.value);
          if (DASHBOARD_PRESETS.some(p => p.id === id)) setPresetId(id);
        }
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    if (!loaded) return;
    storage.set(DASHBOARD_PRESET_KEY, JSON.stringify(presetId)).catch(() => {});
  }, [presetId, loaded]);

  const activePreset = DASHBOARD_PRESETS.find(p => p.id === presetId) || DASHBOARD_PRESETS[0];

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 pb-16">
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="pd-display text-3xl sm:text-4xl font-medium tracking-tight">Dashboard</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {activePreset.description}
          </p>
        </div>
      </div>

      {/* Preset chooser */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
        {DASHBOARD_PRESETS.map(preset => {
          const Icon = preset.icon;
          const isActive = preset.id === presetId;
          return (
            <button
              key={preset.id}
              onClick={() => setPresetId(preset.id)}
              className="pd-btn rounded-lg px-3 py-2 text-sm flex items-center gap-2 shrink-0 transition-all"
              style={{
                background: isActive ? 'var(--accent)' : 'var(--surface)',
                color: isActive ? 'var(--bg)' : 'var(--text)',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                boxShadow: isActive ? '0 4px 12px var(--accent-glow)' : 'none'
              }}
              title={preset.description}
            >
              <Icon size={14} />
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min">
        {activePreset.layout.map((item, idx) => {
          const widget = WIDGET_REGISTRY[item.id];
          if (!widget) return null;
          const Component = widget.component;
          return (
            <div key={`${activePreset.id}-${item.id}-${idx}`} className={spanToClass(item.span)}>
              <Component data={data} setView={setView} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DashboardView;
