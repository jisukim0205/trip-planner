# Trip Planner — Product Specification

> Generated from design interview on 2026-03-24.
> This document supersedes any vague items in CLAUDE.md and AGENT_DESIGN.md.

---

## 1. Tech Stack (Confirmed)

| Technology | Role |
|---|---|
| React + Vite | Component UI, fast dev server |
| TypeScript | Type safety throughout |
| Tailwind CSS | Mobile-first styling |
| Zustand (+ persist middleware) | Global state + localStorage persistence |
| @dnd-kit/core | Drag-and-drop with touch support |

---

## 2. Data Model

### `Trip`
```ts
interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;       // ISO date string, e.g. "2025-04-01"
  endDate: string;
  gridStartHour: number;   // default: 7
  gridEndHour: number;     // default: 23
  createdAt: number;
}
```

### `PlanBlock`
```ts
interface PlanBlock {
  id: string;
  tripId: string;
  title: string;
  description: string;     // short text, max ~200 chars
  duration: number;        // in hours, can be fractional (e.g. 1.5)
  color: PlanColor;        // one of 5 preset color tokens
  repeatable: boolean;     // if true, block stays in panel after placement
  order: number;           // user-defined order in Plans Panel
}

type PlanColor = 'coral' | 'sky' | 'sage' | 'amber' | 'violet';
```

### `CalendarEvent`
```ts
interface CalendarEvent {
  id: string;
  tripId: string;
  planBlockId: string;     // reference to source PlanBlock
  date: string;            // ISO date string, the start date
  startHour: number;       // e.g. 9 for 9:00 AM
  duration: number;        // in hours, snapped on placement but resizable in 0.5h increments
}
```

**Notes:**
- A non-repeatable PlanBlock may have at most one CalendarEvent at a time.
- A repeatable PlanBlock can have many CalendarEvents (one per date/slot).
- CalendarEvents that span midnight are stored with their `startHour` on the start date. The end hour is derived as `startHour + duration`. The renderer checks if `endHour > gridEndHour` and renders a continuation chip on the next calendar day.

---

## 3. Core Features

### 3.1 Trip Management

- **Create trip**: title (required), destination (required), date range (required). No date restrictions — past trips and long trips are allowed.
- **Edit trip**: Via gear icon on the trip row in the sidebar. All fields are editable (title, destination, start/end date, grid hour range).
  - If the new end date is earlier than before, any CalendarEvents that now fall outside the date range are **automatically unscheduled** (moved back to the Plans Panel as unscheduled blocks). No warning shown; the behavior is silent and reversible by dragging them back.
- **Delete trip**: Trash icon in the sidebar. Deletes all associated PlanBlocks and CalendarEvents. Confirm dialog before deletion.
- **Switch trip**: Click trip row in sidebar. Trips are fully isolated — no cross-trip date conflict checks.
- **Sidebar**: Plain scrollable list. No search, grouping, or grid cards.

### 3.2 Plans Panel

- Lists all PlanBlocks for the current trip.
- Shows **unscheduled blocks** at the top and **scheduled blocks** below (two sections).
- User can **drag to reorder** blocks within each section.
- `+` button opens the **Add Plan modal**.
- Blocks are **editable only while unscheduled** — clicking an unscheduled block opens an edit modal; clicking a scheduled block shows a read-only detail popup.

#### Add / Edit Plan Modal fields:
| Field | Input | Notes |
|---|---|---|
| Title | Text input (required) | |
| Description | Textarea (short, ~200 chars) | Shown in placed-event detail popup |
| Duration | Number input | In hours, decimals allowed (e.g. 1.5) |
| Color | 5 color swatches | Purely decorative — no category meaning |
| Repeatable | Toggle | If ON, block acts as a template (stays in panel after placement) |

#### Delete Plan Block:
- Deletes the block AND all its CalendarEvents (cascade delete). No confirmation.

### 3.3 Calendar View

#### Grid Configuration (per trip):
- Default display: **07:00 – 23:00**, configurable at trip creation/edit.
- Hourly rows as drop targets.
- Placement snaps to the **nearest hour**.
- Duration is free (not snapped) — block height visually represents fractional time.

#### Day View:
- Shows one day at a time.
- Date tabs (or prev/next nav) to switch between trip days.
- Each row is a 1-hour drop zone.

#### Week View:
- Shows exactly **7 columns**.
- Default view on trip open, starting from the **first day of the trip**.
- For trips longer than 7 days, a pagination control navigates to the next/previous 7-day window.
- Row height is **comfortable** — tall enough to read event chip text. Vertical scrolling is expected.

#### View Toggle:
- Day / Week toggle button in the calendar header.

### 3.4 Plan Block Placement

#### Desktop Drag & Drop:
- Drag a PlanBlock from the Plans Panel onto any time slot in the calendar grid.
- Placement snaps to the nearest hour.
- **Non-repeatable blocks**: disappear from the panel after placement (move to "scheduled" section).
- **Repeatable blocks**: remain in the panel; a copy is placed on the calendar.
- Dragging a placed event **back to the Plans Panel** unschedules it (restores to unscheduled section, removes CalendarEvent).

#### Mobile (Two-Step Tap Flow):
1. User taps a block in the bottom sheet to **select** it (highlighted state).
2. The bottom sheet minimizes automatically, revealing the calendar.
3. User taps a time slot to **place** the block.
4. Tapping elsewhere or the back button cancels the selection.

### 3.5 Placed Event Interactions

Once a block is on the calendar, the following operations are available:

| Operation | How |
|---|---|
| **Move to different slot** | Drag the chip to a new time row or day column |
| **Resize duration** | Drag the bottom edge of the chip; snaps to **30-minute** increments |
| **View details** | Click/tap the chip → read-only popup showing title, description, duration, color |
| **Delete from calendar** | Delete/X button in the detail popup; block returns to unscheduled panel |

#### Chip display (visible without clicking):
- **Title** (truncated if too long)
- **Duration** (e.g. "2h", "1.5h")
- Chip background uses the block's color

### 3.6 Overlap & Conflict Handling

- Multiple events in the same time slot on the same day are **allowed**.
- They are rendered **side by side** (parallel columns), Google Calendar style.
- No warnings, no auto-nudging.

### 3.7 Midnight-Spanning Events

- A block with `startHour: 22` and `duration: 3` spans into the next day.
- On **Day 1**: chip renders from 22:00 to the grid end (23:00), with a visual continuation indicator.
- On **Day 2**: a continuation chip appears from 00:00 for the remaining 2 hours.
- Both chips are linked to the same CalendarEvent.

---

## 4. Mobile Layout

- **Breakpoint**: ≤ 768px triggers mobile layout. Target: 375px width.
- **Sidebar**: Becomes a slide-in drawer from the left, triggered by a hamburger icon.
- **Plans Panel**: Becomes a **bottom sheet** (draggable up/down).
  - Resting position: ~40% height.
  - Expanded position: ~80% height (full list visible).
  - Collapsed: thin drag handle visible.
- **Calendar**: Full width above the bottom sheet.
- **Drag & Drop**: Replaced by the two-step tap flow (see §3.4).
- Touch sensors configured via `@dnd-kit` for desktop drag continuity on touch devices.

---

## 5. Visual Design

- **Style**: Colorful & playful — travel-app consumer aesthetic.
- Gradient or bold-color headers (trip title area, sidebar).
- Rounded cards and chips (border-radius: 12–16px on cards, 8px on chips).
- Bold, readable typography (e.g. Inter or Plus Jakarta Sans).
- Color palette anchored to the 5 plan block colors: `coral`, `sky`, `sage`, `amber`, `violet`.
- Background: off-white or very light gray — not pure white.
- Subtle drop shadows on cards and modals.
- Hover/active states on all interactive elements.
- **No dark mode** in v1 (system preference not respected initially).

---

## 6. State Persistence

- Zustand store with the **persist middleware** (localStorage).
- Keys stored: `trips[]`, `planBlocks[]`, `calendarEvents[]`, `currentTripId`, `currentView` (day/week), `currentWeekStart` (ISO date).
- No backend in v1.

---

## 7. First Launch / Onboarding

- On first launch (empty localStorage), a **sample trip is pre-loaded**:
  - Trip: "Tokyo Trip", destination: "Tokyo, Japan", 7-day date range starting today.
  - 4–5 pre-made PlanBlocks with varied colors and durations.
  - 2–3 of those blocks already placed on the calendar to demonstrate the feature.
- This gives users an instant "aha moment" on what the app does.

---

## 8. Empty States

| Situation | UI |
|---|---|
| No trips (after deleting all) | Centered illustration + "Create your first trip" button |
| Trip with no plan blocks | Plans Panel shows "Add your first plan →" prompt |
| Trip with plans but nothing scheduled | Calendar shows subtle "Drag plans here" hint text in slots |

---

## 9. Sharing (Deferred to v2)

- The read-only share URL feature is **planned but not built in v1**.
- Architecture note: design the trip data model to be fully serializable so that URL-encoding or backend storage can be added later without data model changes.
- The read-only calendar view component should be built as a standalone, presentational component (no store writes) to make v2 integration easier.

---

## 10. Out of Scope (v1)

| Feature | Reason deferred |
|---|---|
| Time zone support | Treat all times as abstract labels |
| Undo / redo | Complexity not justified for MVP |
| Export (PDF, text) | Deferred; design allows adding later |
| Share URL | Deferred to v2 (needs backend or URL encoding) |
| Dark mode | Not in v1 |
| Cross-trip conflict detection | Trips are isolated silos |
| Authentication / multi-user | No backend in v1 |
| Recurring events | Out of scope; repeatable blocks cover the use case |
| Notifications / reminders | Out of scope |

---

## 11. Agent Build Order (Reference)

```
[Agent 1: Architect]
  Vite + React + TS scaffold, Tailwind, Zustand, @dnd-kit
  types/index.ts, store/useTripStore.ts skeleton
         │
   ┌─────┴──────┐────────────┐
   │            │            │
[Agent 2]   [Agent 3]   [Agent 4]
Layout &    Plan Panel  Calendar
Sidebar     & Blocks    Engine
   │            │            │
   └─────┬──────┘────────────┘
         │
[Agent 5: Drag & Drop]
  Desktop DnD, mobile two-step tap, resize, overlap columns
         │
[Agent 6: Polish & Persistence]
  localStorage persist, sample trip, empty states, mobile 375px QA
```

---

## 12. Open Questions (Post-v1)

1. **Cloud sync**: Will users want their trips on multiple devices? → Supabase candidate.
2. **Share URL**: URL-encoding (no backend) vs. a simple hosted store?
3. **i18n**: Korean UI by default, or English-first with i18n layer?
4. **Week View range**: Currently fixed at 7 columns + pagination. Consider a "fit trip" mode that shows all days at once for short trips (≤7 days).
