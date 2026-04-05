import type { Trip, PlanBlock, CalendarEvent } from '../types';
import { todayISO, addDays } from './dates';

export function createSeedData(): { trip: Trip; blocks: PlanBlock[]; events: CalendarEvent[] } {
  const today = todayISO();
  const tripId = 'seed-trip-1';

  const trip: Trip = {
    id: tripId,
    title: 'Tokyo Trip',
    destination: 'Tokyo, Japan',
    startDate: today,
    endDate: addDays(today, 6),
    gridStartHour: 7,
    gridEndHour: 23,
    createdAt: Date.now(),
  };

  const blocks: PlanBlock[] = [
    { id: 'b1', tripId, title: '아사쿠사 탐방', description: '센소지 절, 나카미세 거리 쇼핑', duration: 3, color: 'sky', repeatable: false, order: 0 },
    { id: 'b2', tripId, title: '시부야 크로싱', description: '세계에서 가장 바쁜 교차로', duration: 1.5, color: 'coral', repeatable: false, order: 1 },
    { id: 'b3', tripId, title: '스시 오마카세', description: '츠키지 인근 스시 전문점', duration: 2, color: 'amber', repeatable: false, order: 2 },
    { id: 'b4', tripId, title: '신주쿠 공원', description: '도심 속 자연 산책', duration: 1.5, color: 'sage', repeatable: false, order: 3 },
    { id: 'b5', tripId, title: '팀랩 보더리스', description: '디지털 아트 뮤지엄', duration: 3, color: 'violet', repeatable: true, order: 4 },
  ];

  const events: CalendarEvent[] = [
    { id: 'e1', tripId, planBlockId: 'b1', date: today, startHour: 10, duration: 3 },
    { id: 'e2', tripId, planBlockId: 'b3', date: today, startHour: 19, duration: 2 },
    { id: 'e3', tripId, planBlockId: 'b5', date: addDays(today, 1), startHour: 14, duration: 3 },
  ];

  return { trip, blocks, events };
}
