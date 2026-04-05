import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trip, PlanBlock, CalendarEvent } from '../types';

interface TripStore {
  trips: Trip[];
  planBlocks: PlanBlock[];
  calendarEvents: CalendarEvent[];
  currentTripId: string | null;
  currentView: 'day' | 'week' | 'map';
  currentWeekStart: string; // ISO date

  // Trip actions
  addTrip: (trip: Trip) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  setCurrentTrip: (id: string) => void;

  // PlanBlock actions
  addPlanBlock: (block: PlanBlock) => void;
  updatePlanBlock: (id: string, updates: Partial<PlanBlock>) => void;
  deletePlanBlock: (id: string) => void;
  reorderPlanBlocks: (tripId: string, orderedIds: string[]) => void;

  // CalendarEvent actions
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  unscheduleBlock: (planBlockId: string) => void;

  // UI actions
  setCurrentView: (view: 'day' | 'week' | 'map') => void;
  setCurrentWeekStart: (date: string) => void;

  // Seeded flag
  _seeded: boolean;
  setSeedDone: () => void;
}

export const useTripStore = create<TripStore>()(
  persist(
    (set) => ({
      trips: [],
      planBlocks: [],
      calendarEvents: [],
      currentTripId: null,
      currentView: 'week',
      currentWeekStart: new Date().toISOString().split('T')[0],
      _seeded: false,

      addTrip: (trip) => set((s) => ({ trips: [...s.trips, trip] })),
      updateTrip: (id, updates) =>
        set((s) => {
          const trip = s.trips.find((t) => t.id === id);
          if (!trip) return s;
          const newTrip = { ...trip, ...updates };
          const calendarEvents = s.calendarEvents.filter((e) => {
            if (e.tripId !== id) return true;
            return e.date >= newTrip.startDate && e.date <= newTrip.endDate;
          });
          return {
            trips: s.trips.map((t) => (t.id === id ? newTrip : t)),
            calendarEvents,
          };
        }),
      deleteTrip: (id) =>
        set((s) => ({
          trips: s.trips.filter((t) => t.id !== id),
          planBlocks: s.planBlocks.filter((b) => b.tripId !== id),
          calendarEvents: s.calendarEvents.filter((e) => e.tripId !== id),
          currentTripId: s.currentTripId === id ? (s.trips.find(t => t.id !== id)?.id ?? null) : s.currentTripId,
        })),
      setCurrentTrip: (id) => set({ currentTripId: id }),

      addPlanBlock: (block) => set((s) => ({ planBlocks: [...s.planBlocks, block] })),
      updatePlanBlock: (id, updates) =>
        set((s) => ({
          planBlocks: s.planBlocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),
      deletePlanBlock: (id) =>
        set((s) => ({
          planBlocks: s.planBlocks.filter((b) => b.id !== id),
          calendarEvents: s.calendarEvents.filter((e) => e.planBlockId !== id),
        })),
      reorderPlanBlocks: (tripId, orderedIds) =>
        set((s) => ({
          planBlocks: s.planBlocks.map((b) => {
            if (b.tripId !== tripId) return b;
            const idx = orderedIds.indexOf(b.id);
            return idx >= 0 ? { ...b, order: idx } : b;
          }),
        })),

      addCalendarEvent: (event) =>
        set((s) => ({ calendarEvents: [...s.calendarEvents, event] })),
      updateCalendarEvent: (id, updates) =>
        set((s) => ({
          calendarEvents: s.calendarEvents.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      deleteCalendarEvent: (id) =>
        set((s) => ({ calendarEvents: s.calendarEvents.filter((e) => e.id !== id) })),
      unscheduleBlock: (planBlockId) =>
        set((s) => ({
          calendarEvents: s.calendarEvents.filter((e) => e.planBlockId !== planBlockId),
        })),

      setCurrentView: (view) => set({ currentView: view }),
      setCurrentWeekStart: (date) => set({ currentWeekStart: date }),

      setSeedDone: () => set({ _seeded: true }),
    }),
    {
      name: 'trip-planner-store',
    }
  )
);
