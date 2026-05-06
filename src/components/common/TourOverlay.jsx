// Guided-tour overlay. Listens to TourContext for the active step and
// renders three things on top of the app:
//
//   1. A dimmed full-screen background with a transparent "cutout"
//      around the step's target element. Implemented with the classic
//      box-shadow:0 0 0 9999px trick — one element produces both the
//      dim and the hole, and the cutout itself is pointer-events:none
//      so the highlighted control remains clickable.
//   2. A glowing border around the cutout (also pointer-transparent).
//   3. A tooltip card with title, body, step counter, and Prev / Next /
//      Skip controls. Auto-positioned next to the target with viewport
//      clamping; falls back to centered if the placement asks for it
//      or the target can't be found.
//
// The overlay polls for the target after each step change because the
// view may have just been swapped — React needs a tick or two to mount
// the new DOM. We retry up to ~1.2s before giving up and centering.

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { useTour } from '../../lib/tourContext';

const PAD = 8;        // visual padding around the spotlight cutout
const TOOLTIP_W = 320;
const TOOLTIP_GAP = 14;

const measure = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
};

// Pick a placement that fits the viewport. Falls back to opposite side or
// 'bottom' if the preferred side is too tight.
const resolvePlacement = (preferred, rect) => {
  if (!rect || preferred === 'center') return 'center';
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fitsRight  = vw - rect.left - rect.width > TOOLTIP_W + TOOLTIP_GAP + 16;
  const fitsLeft   = rect.left > TOOLTIP_W + TOOLTIP_GAP + 16;
  const fitsBottom = vh - rect.top - rect.height > 200;
  const fitsTop    = rect.top > 200;
  switch (preferred) {
    case 'right':  return fitsRight  ? 'right'  : fitsLeft   ? 'left'   : fitsBottom ? 'bottom' : 'top';
    case 'left':   return fitsLeft   ? 'left'   : fitsRight  ? 'right'  : fitsBottom ? 'bottom' : 'top';
    case 'top':    return fitsTop    ? 'top'    : fitsBottom ? 'bottom' : fitsRight  ? 'right'  : 'left';
    case 'bottom':
    default:       return fitsBottom ? 'bottom' : fitsTop    ? 'top'    : fitsRight  ? 'right'  : 'left';
  }
};

const positionFor = (placement, rect, tooltipH) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (placement === 'center' || !rect) {
    return {
      top: Math.max(16, vh / 2 - tooltipH / 2),
      left: Math.max(16, vw / 2 - TOOLTIP_W / 2),
    };
  }
  let top, left;
  switch (placement) {
    case 'right':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left + rect.width + TOOLTIP_GAP;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - TOOLTIP_W - TOOLTIP_GAP;
      break;
    case 'top':
      top = rect.top - tooltipH - TOOLTIP_GAP;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
      break;
    case 'bottom':
    default:
      top = rect.top + rect.height + TOOLTIP_GAP;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
  }
  // Clamp to viewport with a 12px margin.
  top  = Math.max(12, Math.min(top, vh - tooltipH - 12));
  left = Math.max(12, Math.min(left, vw - TOOLTIP_W - 12));
  return { top, left };
};

export function TourOverlay() {
  const { isOpen, step, stepIdx, totalSteps, nextStep, prevStep, endTour, tourTitle } = useTour();
  const [rect, setRect] = useState(null);
  const [placement, setPlacement] = useState('center');
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [missing, setMissing] = useState(false);
  const tooltipRef = useRef(null);
  const retryRef = useRef(null);

  // Re-measure on step change, with retry — the view may have just been
  // swapped and the target hasn't mounted yet.
  useLayoutEffect(() => {
    if (!isOpen || !step) return undefined;
    setMissing(false);
    let attempts = 0;
    const maxAttempts = 24; // ~1.2s at 50ms
    const tryMeasure = () => {
      const el = step.target ? document.querySelector(step.target) : null;
      if (el) {
        // Make sure the element is visible.
        if (typeof el.scrollIntoView === 'function') {
          try { el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }); } catch (e) { /* ok */ }
        }
        const r = measure(el);
        setRect(r);
        const p = resolvePlacement(step.placement || 'right', r);
        setPlacement(p);
        return;
      }
      if (step.placement === 'center' || !step.target) {
        setRect(null);
        setPlacement('center');
        return;
      }
      attempts++;
      if (attempts >= maxAttempts) {
        // Give up — fall back to centered tooltip with a notice.
        setRect(null);
        setPlacement('center');
        setMissing(true);
        return;
      }
      retryRef.current = window.setTimeout(tryMeasure, 50);
    };
    tryMeasure();
    return () => {
      if (retryRef.current) window.clearTimeout(retryRef.current);
    };
  }, [isOpen, step]);

  // Re-measure on resize/scroll (debounced via rAF).
  useEffect(() => {
    if (!isOpen || !step?.target) return undefined;
    let raf = 0;
    const onChange = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.querySelector(step.target);
        if (!el) return;
        const r = measure(el);
        setRect(r);
        setPlacement(resolvePlacement(step.placement || 'right', r));
      });
    };
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
    };
  }, [isOpen, step]);

  // Position tooltip after it renders so we know its actual height.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const h = tooltipRef.current?.offsetHeight || 220;
    setPos(positionFor(placement, rect, h));
  }, [isOpen, placement, rect, step]);

  if (!isOpen || !step) return null;

  const isLast = stepIdx >= totalSteps - 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        // Container is pointer-transparent so highlighted controls stay
        // clickable; only the tooltip itself captures pointer events.
        pointerEvents: 'none',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Tour: ${tourTitle}, step ${stepIdx + 1} of ${totalSteps}`}
    >
      {/* Spotlight cutout. The huge box-shadow paints the dim everywhere
          except the cutout rectangle. */}
      {rect ? (
        <div
          style={{
            position: 'fixed',
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.62)',
            border: '2px solid var(--accent)',
            transition: 'top 0.18s ease, left 0.18s ease, width 0.18s ease, height 0.18s ease',
            pointerEvents: 'none',
          }}
        />
      ) : (
        // No target — full-screen dim.
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.62)',
            pointerEvents: 'auto',
          }}
          onClick={endTour}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          width: TOOLTIP_W,
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 14,
          padding: 18,
          boxShadow: '0 20px 50px -10px rgba(0,0,0,0.55)',
          pointerEvents: 'auto',
          color: 'var(--text)',
          transition: 'top 0.18s ease, left 0.18s ease',
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
              {tourTitle}
            </span>
          </div>
          <button
            onClick={endTour}
            className="pd-icon-btn"
            aria-label="Close tour"
            title="Close tour (Esc)"
            style={{ marginTop: -4, marginRight: -4 }}
          >
            <X size={14} />
          </button>
        </div>

        <h3 className="pd-display text-lg font-medium leading-tight mb-1.5">
          {step.title}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
          {step.body}
        </p>

        {missing && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--warning)' }}>
            Couldn&rsquo;t locate the highlighted element on this page — it may be hidden in your current layout.
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-4">
          <span className="text-[11px] pd-mono" style={{ color: 'var(--text-faint)' }}>
            {stepIdx + 1} / {totalSteps}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              className="pd-btn pd-btn-ghost px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 disabled:opacity-40"
              onClick={prevStep}
              disabled={stepIdx === 0}
              aria-label="Previous step"
            >
              <ChevronLeft size={13} /> Back
            </button>
            <button
              className="pd-btn pd-btn-primary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
              onClick={nextStep}
              aria-label={isLast ? 'Finish tour' : 'Next step'}
            >
              {isLast ? 'Finish' : <>Next <ChevronRight size={13} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
