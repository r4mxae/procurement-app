// Guided tour context — provides startTour() / nextStep() / etc to any
// component, and broadcasts the active tour state so <TourOverlay /> at
// the root can render the spotlight + tooltip.
//
// Tours themselves live in constants/tours.js (declarative shape). This
// module owns runtime state only: which tour is active, which step,
// whether it's open. View-switching is delegated to the consumer via
// the `setView` callback registered when the App mounts the provider.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TOURS } from '../constants/tours';

const TourContext = createContext({
  isOpen: false,
  tourKey: null,
  stepIdx: 0,
  step: null,
  totalSteps: 0,
  startTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  endTour: () => {},
  hasTour: () => false,
});

export const TourProvider = ({ setView, children }) => {
  const [tourKey, setTourKey] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);

  const tour = tourKey ? TOURS[tourKey] : null;
  const step = tour ? tour.steps[stepIdx] : null;
  const totalSteps = tour ? tour.steps.length : 0;
  const isOpen = !!tour;

  // When the active step requests a specific view, fire setView before the
  // overlay tries to measure its target — gives React a tick to render.
  useEffect(() => {
    if (step?.view && typeof setView === 'function') {
      setView(step.view);
    }
  }, [step, setView]);

  // Esc closes the tour from anywhere.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setTourKey(null);
      if (e.key === 'ArrowRight') {
        setStepIdx(idx => (tour && idx < tour.steps.length - 1 ? idx + 1 : idx));
      }
      if (e.key === 'ArrowLeft') {
        setStepIdx(idx => (idx > 0 ? idx - 1 : idx));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, tour]);

  const startTour = useCallback((key) => {
    if (!TOURS[key]) {
      // eslint-disable-next-line no-console
      console.warn(`[tour] unknown tour: ${key}`);
      return;
    }
    setStepIdx(0);
    setTourKey(key);
  }, []);

  const nextStep = useCallback(() => {
    setStepIdx(idx => {
      if (!tour) return 0;
      if (idx >= tour.steps.length - 1) {
        // End of tour — auto-close.
        setTourKey(null);
        return 0;
      }
      return idx + 1;
    });
  }, [tour]);

  const prevStep = useCallback(() => {
    setStepIdx(idx => Math.max(0, idx - 1));
  }, []);

  const endTour = useCallback(() => {
    setTourKey(null);
    setStepIdx(0);
  }, []);

  const hasTour = useCallback((key) => Boolean(TOURS[key]), []);

  const value = useMemo(() => ({
    isOpen, tourKey, stepIdx, step, totalSteps,
    startTour, nextStep, prevStep, endTour, hasTour,
    tourTitle: tour?.name || '',
  }), [isOpen, tourKey, stepIdx, step, totalSteps, startTour, nextStep, prevStep, endTour, hasTour, tour]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTour = () => useContext(TourContext);
