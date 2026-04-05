# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Trip Planner** — A responsive web app for planning trips with an interactive drag-and-drop calendar.

Core user flow:
1. User creates a trip (title, destination, date range)
2. User adds plan blocks in the Plans Panel (title, description, duration, color, repeatable toggle)
3. Plan blocks are dragged onto a time-slot calendar grid
4. Calendar supports Day View and Week View with hourly rows as drop targets

Full product spec: `.claude/rules/SPEC.md` (supersedes this file on conflicts)

## Tech Stack

| Technology | Role |
|---|---|
| React + Vite | Component UI, fast dev server |
| TypeScript | Type safety throughout |
| Tailwind CSS | Mobile-first styling |
| Zustand + persist | Global state + localStorage persistence |
| @dnd-kit/core | Drag-and-drop with touch support |

## Development Commands

```bash
npm run dev      # Dev server at localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── components/
│   ├── Sidebar/        # Trip list, new trip button, hamburger toggle
│   ├── PlanPanel/      # Unscheduled/scheduled block lists, + button
│   ├── Calendar/       # DayView, WeekView, CalendarHeader, EventChip
│   ├── PlanBlock/      # Draggable block component
│   └── Modals/         # AddPlanModal, NewTripModal, detail popups
├── store/
│   └── useTripStore.ts # Zustand store (trips, planBlocks, calendarEvents, UI state)
├── types/
│   └── index.ts        # Trip, PlanBlock, CalendarEvent, PlanColor types
└── App.tsx
```

## Data Model

Three core entities — see `types/index.ts`:
- **`Trip`**: `id, title, destination, startDate, endDate, gridStartHour (7), gridEndHour (23)`
- **`PlanBlock`**: `id, tripId, title, description, duration, color (PlanColor), repeatable, order`
- **`CalendarEvent`**: `id, tripId, planBlockId, date, startHour, duration`

`PlanColor` = `'coral' | 'sky' | 'sage' | 'amber' | 'violet'`

Key rules:
- Non-repeatable block → at most one CalendarEvent at a time
- Repeatable block → many CalendarEvents allowed (acts as a template)
- Events spanning midnight: stored on start date; renderer splits into two chips at `gridEndHour`

## Architecture Notes

**Zustand store** persists: `trips[]`, `planBlocks[]`, `calendarEvents[]`, `currentTripId`, `currentView` (day/week), `currentWeekStart`.

**Calendar views**:
- Day View: single day, hourly rows, date tabs for navigation
- Week View: 7-column grid; paginate by 7-day windows for long trips; default view on trip open

**Plans Panel** sections: unscheduled blocks on top, scheduled blocks below. Unscheduled blocks are editable (click → edit modal); scheduled blocks are read-only (click → detail popup).

**Drag & drop**:
- Desktop: drag from panel → drop on time slot (snaps to nearest hour); drag placed chip to move; drag back to panel to unschedule
- Mobile (≤768px): two-step tap — tap block to select, then tap slot to place
- Overlap: multiple events in same slot render side-by-side (Google Calendar style)
- Resize: drag bottom edge of chip in 30-min increments

**Mobile layout**:
- Sidebar → slide-in drawer (hamburger trigger)
- Plans Panel → bottom sheet (resting ~40%, expanded ~80%)
- Calendar → full width above bottom sheet

## First Launch

On empty localStorage, seed a sample "Tokyo Trip" with 4–5 pre-made blocks and 2–3 already placed on the calendar.

## Visual Design

- Colorful & playful travel-app aesthetic
- Gradient/bold-color headers; rounded cards (12–16px), chips (8px)
- Typography: Inter or Plus Jakarta Sans
- Background: off-white (`#f5f5f7` or similar) — not pure white
- No dark mode in v1

## Reference Files

- `mockup.html` — Static HTML/CSS visual mockup (not the app; reference for layout and color)
- `.claude/rules/SPEC.md` — Full product specification (authoritative)
- `.claude/agents/AGENT_DESIGN.md` — Sub-agent build order and task breakdown
