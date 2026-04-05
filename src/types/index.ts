export type PlanColor = 'coral' | 'sky' | 'sage' | 'amber' | 'violet';

export interface PlanLocation {
  name: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;       // ISO date "YYYY-MM-DD"
  endDate: string;
  gridStartHour: number;   // default 7
  gridEndHour: number;     // default 23
  createdAt: number;
}

export interface PlanBlock {
  id: string;
  tripId: string;
  title: string;
  description: string;
  duration: number;        // hours, decimals allowed
  color: PlanColor;
  repeatable: boolean;
  order: number;
  location?: PlanLocation;
}

export interface CalendarEvent {
  id: string;
  tripId: string;
  planBlockId: string;
  date: string;            // ISO date "YYYY-MM-DD"
  startHour: number;
  duration: number;
}
