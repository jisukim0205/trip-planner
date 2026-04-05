# Trip Planner — 에이전트 설계서

> 이 문서는 Trip Planner 웹앱을 구축하기 위한 기술 스택과 서브 에이전트 역할을 정의합니다.

---

## 1. 기술 스택 (Tech Stack)

### 왜 이 스택인가?

| 기술 | 선택 이유 |
|------|-----------|
| **React + Vite** | 컴포넌트 단위 UI 관리, 빠른 개발 서버, 업계 표준 |
| **TypeScript** | 타입 안전성, 협업/유지보수 시 버그 예방 |
| **Tailwind CSS** | 모바일 반응형 레이아웃을 코드량 최소화로 구현 |
| **Zustand** | 전역 상태 관리 (trips, plans, 현재 뷰) — Redux보다 훨씬 심플 |
| **@dnd-kit/core** | 드래그앤드롭 전문 라이브러리, 모바일 터치 지원 포함 |
| **localStorage** | 초기 버전 데이터 저장 (백엔드 없이) |

### 폴더 구조 (예상)
```
src/
├── components/
│   ├── Sidebar/          # 트립 목록 메뉴
│   ├── PlanPanel/        # 왼쪽 계획 블록 패널
│   ├── Calendar/         # 캘린더 (day/week 뷰)
│   ├── PlanBlock/        # 드래그 가능한 계획 블록
│   └── Modals/           # AddPlan, NewTrip 모달
├── store/
│   └── useTripStore.ts   # Zustand 전역 상태
├── types/
│   └── index.ts          # Trip, Plan 타입 정의
└── App.tsx
```

---

## 2. 핵심 기능 목록

### 트립 관리
- [ ] 새 트립 생성 (제목, 목적지, 날짜 범위)
- [ ] 트립 간 전환 (사이드바 네비게이션)
- [ ] 트립 삭제
- [ ] 트립 제목 수정

### 캘린더 뷰
- [ ] Day View: 선택한 날 하루의 시간별 그리드
- [ ] Week View: 여행 전체 기간을 요일 열로 표시
- [ ] 뷰 전환 토글 버튼 (Day / Week)

### 계획 블록
- [ ] 블록 생성 (타이틀, 설명, duration, 색상)
- [ ] 블록 편집 / 삭제
- [ ] 캘린더 슬롯으로 드래그앤드롭
- [ ] 이미 배치된 블록을 다른 슬롯으로 이동
- [ ] 배치된 블록을 다시 패널로 되돌리기

### 모바일
- [ ] 사이드바 → 슬라이드 드로어
- [ ] 계획 패널 → 하단 시트 (bottom sheet)
- [ ] 터치 드래그 지원

---

## 3. 서브 에이전트 설계

총 **6개의 서브 에이전트**로 병렬/순차 작업을 분담합니다.

---

### Agent 1 — Architect (설계 & 프로젝트 셋업)
**역할**: 프로젝트 초기 구조를 잡는 에이전트

**담당 작업:**
- Vite + React + TypeScript 프로젝트 생성
- Tailwind CSS, Zustand, @dnd-kit 패키지 설치 및 설정
- `types/index.ts` 에 핵심 타입 정의 (`Trip`, `Plan`, `CalendarEvent`)
- `store/useTripStore.ts` 뼈대 생성 (빈 액션 포함)
- 폴더 구조 생성

**output**: 실행 가능한 빈 앱 (npm run dev 시 빈 화면)

---

### Agent 2 — Layout & Navigation (레이아웃 & 사이드바)
**역할**: 전체 레이아웃과 트립 네비게이션을 담당

**담당 작업:**
- 전체 3-panel 레이아웃 구성 (사이드바 / 계획패널 / 캘린더)
- `Sidebar` 컴포넌트:
  - 햄버거 메뉴 토글
  - "New Trip" 버튼
  - 트립 목록 (클릭 시 전환)
  - 트립 삭제 버튼 (휴지통 아이콘)
- `NewTripModal` 컴포넌트: 제목, 목적지, 날짜 범위 입력
- 모바일: 사이드바 슬라이드 드로어 처리
- Zustand에서 `trips[]`, `currentTripId`, `addTrip`, `deleteTrip`, `switchTrip` 연결

**dependencies**: Agent 1 완료 후 시작

---

### Agent 3 — Plan Panel (계획 블록 관리)
**역할**: 왼쪽 계획 패널과 블록 생성 UI 담당

**담당 작업:**
- `PlanPanel` 컴포넌트: 블록 목록 + `+` 버튼
- `AddPlanModal`: title / description / duration / 색상 선택
- `PlanBlock` 컴포넌트: 색상 스타일, 편집/삭제 컨텍스트 메뉴
- Zustand `plans[]`, `addPlan`, `editPlan`, `deletePlan` 연결
- 모바일: 하단 bottom sheet 전환

**dependencies**: Agent 1 완료 후 시작 (Agent 2와 병렬 가능)

---

### Agent 4 — Calendar Engine (캘린더 뷰 엔진)
**역할**: 시간 그리드와 Day/Week 뷰 로직 담당

**담당 작업:**
- `CalendarHeader`: 날짜 탭 / Day·Week 토글 버튼
- `DayView`: 하루 시간별 그리드 (07:00–23:00, 1시간 단위)
- `WeekView`: 여행 기간 전체를 열(column)로, 시간을 행(row)으로
- 뷰 전환 시 레이아웃 애니메이션
- 배치된 이벤트 칩 렌더링 (색상, 타이틀, duration 표시)
- Zustand `currentView`, `currentDate`, `calendarEvents` 연결

**dependencies**: Agent 1 완료 후 시작 (Agent 2, 3과 병렬 가능)

---

### Agent 5 — Drag & Drop (드래그앤드롭)
**역할**: 블록을 캘린더로 드래그하는 인터랙션 구현

**담당 작업:**
- `@dnd-kit` DndContext, Draggable, Droppable 설정
- PlanBlock → 시간슬롯 드롭 시 `calendarEvents`에 추가
- 이미 배치된 블록을 다른 슬롯으로 재배치
- 드롭 타겟 hover 시 하이라이트 효과
- 모바일 터치 지원 (`TouchSensor` 설정)
- 드롭 충돌 처리 (같은 슬롯에 두 블록이 겹칠 때)

**dependencies**: Agent 3, 4 완료 후 시작

---

### Agent 6 — Polish & Persistence (마무리 & 저장)
**역할**: localStorage 저장, 모바일 최종 검증, UI polish

**담당 작업:**
- Zustand persist 미들웨어로 localStorage 자동 저장
- 앱 첫 실행 시 샘플 트립 데이터 삽입 (온보딩)
- 모바일 375px 레이아웃 최종 점검
- 빈 상태(empty state) UI: 트립 없을 때, 계획 없을 때
- 에러 처리: 날짜 범위 검증 등

**dependencies**: Agent 2–5 완료 후 시작

---

## 4. 실행 순서

```
[Agent 1: Architect]
        │
   ┌────┴────┐
   │         │
[Agent 2]  [Agent 3]  [Agent 4]   ← 병렬 실행
Layout     PlanPanel  Calendar
   │         │         │
   └────┬────┘─────────┘
        │
[Agent 5: Drag & Drop]
        │
[Agent 6: Polish]
```

---

## 5. 개발 명령어 (설정 후)

```bash
npm run dev      # 개발 서버 시작 (localhost:5173)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

---

## 6. 열린 질문 (결정 필요)

1. **클라우드 저장**: 나중에 여러 기기 동기화가 필요한가? → 필요시 Supabase 추가
2. **공유 기능**: 트립을 URL로 공유할 수 있어야 하는가?
3. **언어**: 한국어 UI 기본? 다국어 지원 필요?
4. **Week View 범위**: 여행 전체 기간 vs 고정 7일?
