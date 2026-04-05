# Trip Planner — 프로젝트 핸드오프 문서

> 이 문서는 2026-03-24 ~ 2026-04-04 세션 동안 진행된 전체 작업 내역을 담고 있습니다.
> 다음 에이전트는 이 파일을 먼저 읽고 프로젝트 맥락을 파악한 뒤 작업을 이어가세요.

---

## 1. 프로젝트 개요

**Trip Planner** — 여행 일정을 드래그앤드롭으로 캘린더에 배치하는 반응형 웹앱.

- 개발 서버: `npm run dev` → http://localhost:5174
- 빌드: `npm run build`
- 저장: Zustand + localStorage persist (`trip-planner-store` 키)

---

## 2. 확정된 기술 스택

| 기술 | 역할 |
|---|---|
| React + Vite | UI, 개발 서버 |
| TypeScript | 타입 안전성 |
| Tailwind CSS (`@tailwindcss/vite`) | 스타일링 |
| Zustand + persist middleware | 전역 상태 + localStorage |
| @dnd-kit/core, sortable, utilities | 드래그앤드롭 |
| @googlemaps/js-api-loader | Google Maps + Places API |

---

## 3. 데이터 모델 (`src/types/index.ts`)

```ts
type PlanColor = 'coral' | 'sky' | 'sage' | 'amber' | 'violet';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;       // "YYYY-MM-DD"
  endDate: string;
  gridStartHour: number;   // default 7
  gridEndHour: number;     // default 23
  createdAt: number;
}

interface PlanLocation {
  name: string;
  lat: number;
  lng: number;
  placeId?: string;
}

interface PlanBlock {
  id: string;
  tripId: string;
  title: string;
  description: string;
  duration: number;        // 시간 단위, 소수 허용 (e.g. 1.5)
  color: PlanColor;
  repeatable: boolean;     // true면 배치 후에도 패널에 잔류
  order: number;
  location?: PlanLocation; // Google Places로 선택한 장소
}

interface CalendarEvent {
  id: string;
  tripId: string;
  planBlockId: string;
  date: string;            // "YYYY-MM-DD"
  startHour: number;
  duration: number;
}
```

---

## 4. Zustand 스토어 (`src/store/useTripStore.ts`)

- persist 미들웨어로 localStorage 자동 저장
- `currentView`: `'day' | 'week' | 'map'`
- `currentWeekStart`: ISO date (Week view의 시작일, Day view의 현재 일도 겸용)
- `_seeded`: 최초 실행 시 샘플 데이터 삽입 여부 플래그

주요 액션:
- `addTrip / updateTrip / deleteTrip / setCurrentTrip`
- `addPlanBlock / updatePlanBlock / deletePlanBlock`
- `addCalendarEvent / updateCalendarEvent / deleteCalendarEvent`
- `unscheduleBlock(planBlockId)`: 해당 블록의 모든 CalendarEvent 삭제
- `setCurrentView / setCurrentWeekStart`

`updateTrip`은 endDate가 줄어들면 범위 밖 CalendarEvent를 자동 unschedule함.

---

## 5. 프로젝트 구조

```
src/
├── App.tsx                          # DndContext, DragOverlay, 시드 로직
├── context/
│   └── DndAppContext.tsx            # 모바일 선택 상태 (selectedBlockId, isMobile)
├── store/
│   └── useTripStore.ts
├── types/
│   └── index.ts
├── utils/
│   ├── colors.ts                    # COLOR_MAP, COLOR_HEX (5가지 색상)
│   ├── dates.ts                     # formatDate, addDays, getDaysInRange 등
│   └── seed.ts                      # 최초 실행 샘플 데이터 (Tokyo Trip)
└── components/
    ├── Sidebar/
    │   └── index.tsx                # 트립 목록, 추가/수정/삭제, 모바일 드로어
    ├── PlanPanel/
    │   ├── index.tsx                # Unscheduled/Scheduled 섹션, 바텀시트(모바일)
    │   └── PlanBlockCard.tsx        # 드래그 가능한 플랜 카드
    ├── Calendar/
    │   ├── index.tsx                # 뷰 라우터 (Day/Week/Map)
    │   ├── CalendarHeader.tsx       # 뷰 토글, 날짜 네비게이션
    │   ├── WeekView.tsx             # 7컬럼 주간 그리드
    │   ├── DayView.tsx              # 단일 일간 그리드
    │   ├── TimeSlotCell.tsx         # 드롭 타겟 (data-date, data-hour)
    │   ├── EventChip.tsx            # 캘린더에 배치된 이벤트 칩
    │   └── MapView.tsx              # Google Maps 뷰
    └── Modals/
        ├── NewTripModal.tsx         # 트립 생성
        ├── EditTripModal.tsx        # 트립 수정
        ├── AddPlanModal.tsx         # 플랜 추가/수정 (LocationSearch 포함)
        ├── DateRangePicker.tsx      # 캘린더 날짜 범위 선택기
        └── LocationSearch.tsx       # Google Places Autocomplete
```

---

## 6. 구현된 기능 전체 목록

### 트립 관리
- 트립 생성/수정/삭제 (확인 다이얼로그 포함)
- 날짜 범위 선택기: 캘린더 UI로 start → end 순서로 클릭 선택
- endDate 축소 시 범위 밖 이벤트 자동 unschedule
- 사이드바: 인디고-바이올렛 그라디언트, 모바일에서 슬라이드 드로어

### Plans 패널
- Unscheduled / Scheduled 두 섹션으로 구분, 카운트 배지 표시
- 카드 클릭 → 편집 모달 (Scheduled/Unscheduled 모두 가능)
- 카드 우상단 × 버튼 (hover 시 표시):
  - Scheduled: unschedule (캘린더에서 제거)
  - Unscheduled: 블록 완전 삭제
- 모바일: 바텀시트 (resting 40%, expanded 80%, 드래그 핸들)

### 캘린더 뷰
- **Week View**: 7컬럼, 하루씩 슬라이드 네비게이션 (이전에 7일 단위였다가 변경)
- **Day View**: 단일 날짜, 하루 단위 네비게이션
- **Map View**: Google Maps 기반 장소 마커 + 루트 선
- 뷰 토글: `Day | Week | Map`
- 날짜 범위 경계에서 네비게이션 버튼 비활성화 (회색 + cursor-not-allowed)
- 주말 컬럼: 연회색 배경 구분
- 현재 날짜 컬럼: 인디고 강조
- ROW_HEIGHT = 56px per hour

### 드래그앤드롭
- PlanBlockCard → TimeSlotCell: CalendarEvent 생성
- EventChip → TimeSlotCell: 이동
- EventChip → PlanPanel: unschedule
- EventChip 하단 핸들: duration 리사이즈 (0.5h 단위 스냅)
- EventChip 우상단 ×: 바로 unschedule
- 오버랩 이벤트: 같은 슬롯에서 side-by-side 렌더링
- 모바일: 2단계 탭 플로우 (블록 선택 → 슬롯 탭)

### DnD 포지셔닝 (중요 버그 수정 이력)
- `snapToCursor` modifier를 `DndContext.modifiers`에 적용
  - DragOverlay의 시각적 위치 + collision detection이 동일하게 커서를 따름
  - DragOverlay에만 적용하면 충돌 감지가 커서와 어긋남 (수정됨)
- 원본 엘리먼트에 `transform` 미적용 (opacity-0만), DragOverlay가 시각적 이동 전담
- EventChip 리사이즈 핸들: `onPointerDown`으로 통일해 @dnd-kit의 PointerSensor 이벤트 차단

### Google Maps 연동
- `.env.local`: `VITE_GOOGLE_MAPS_API_KEY=...`
- Plan Block 생성/수정 시 Location 필드에 Places Autocomplete 검색
- 선택 시 `{ name, lat, lng, placeId }` 저장
- Map View:
  - 장소가 등록된 이벤트만 번호 마커로 표시 (블록 색상 반영)
  - 같은 날 이벤트끼리 시간 순으로 루트 선 연결 (화살표 포함)
  - 상단 날짜 필터 칩으로 특정 날짜만 표시 가능
  - 장소 없으면 빈 상태 메시지

---

## 7. 주요 버그 수정 이력

| 버그 | 원인 | 수정 |
|---|---|---|
| 드래그 시 원본 블록이 캘린더 아래로 사라짐 | `transform`을 원본 엘리먼트에 적용 + DragOverlay 동시 사용 | 원본에서 `transform` 제거, `opacity-0`만 적용 |
| 드래그 고스트가 화면 좌상단에 나타남 | DragOverlay modifier가 시각적 위치만 변경, 충돌 감지는 영향 없음 | `snapToCursor`를 DragOverlay → DndContext로 이동 |
| 타임슬롯 하이라이트가 커서보다 왼쪽에 표시 | `snapToCursor`가 DragOverlay에만 있어 collision detection이 커서와 불일치 | DndContext.modifiers로 이동 |
| EventChip 리사이즈가 이동으로 인식됨 | `onMouseDown` stopPropagation이 @dnd-kit의 native pointerdown을 막지 못함 | `onPointerDown`으로 변경해 동일 이벤트 시스템에서 차단 |
| Plans 패널 팝오버 X 버튼이 작동 안 함 | X 클릭 이벤트가 부모 카드 onClick으로 버블링되어 팝오버 다시 열림 | `e.stopPropagation()` 추가 |
| DetailPopover가 카드 아래에 겹쳐 표시 | `top-full mt-2` (카드 하단) 포지션 | `bottom-full mb-2` (카드 상단)으로 변경 |

---

## 8. 환경 변수

`.env.local` (git 미포함):
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
```
Google Cloud Console에서 Maps JavaScript API + Places API 활성화 필요.
localhost:5174 도메인 제한 설정됨.

---

## 9. 첫 실행 시 샘플 데이터 (seed)

`src/utils/seed.ts`:
- Trip: "Tokyo Trip" (오늘부터 7일)
- PlanBlock 5개 (아사쿠사, 시부야, 스시, 신주쿠, 팀랩)
- CalendarEvent 3개 (아사쿠사 10시, 스시 19시, 팀랩 다음날 14시)
- `_seeded` 플래그로 중복 삽입 방지
- 50ms timeout으로 Zustand hydration 이후 실행

---

## 10. 미완성 / 다음 작업 후보

- [ ] 장소 검색 결과가 없을 때 MapView 빈 상태 개선
- [ ] Plan Block 간 드래그 리오더 (현재 순서 고정)
- [ ] DayView에서도 Map과 동기화된 미니맵 표시
- [ ] 모바일 375px 최종 QA
- [ ] 배포 (Vercel/Netlify) 및 도메인 설정 후 API 키 도메인 제한 업데이트
- [ ] v2: Share URL, 클라우드 동기화 (Supabase)

---

## 11. 디자인 원칙 (유지할 것)

- 배경: `#f5f5f7` (off-white)
- 폰트: Inter (Google Fonts)
- 카드 radius: 12–16px
- 사이드바: indigo-600 → violet-700 그라디언트
- 다크모드 없음 (v1)
- 색상 토큰: coral / sky / sage / amber / violet
