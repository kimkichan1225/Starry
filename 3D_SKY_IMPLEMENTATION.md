# 3D 밤하늘 공간 구현 현황

> 최종 업데이트: 2026-01-27

## 개요

사용자들이 자신의 별자리를 공용 3D 밤하늘 공간에 등록하고, 다양한 밤하늘을 구경할 수 있는 기능

### 핵심 컨셉
- **공용 공간**: 밤하늘1, 밤하늘2... 미리 정해진 공간들
- **별자리 등록**: 빈자리 있는 공간에 내 별자리 배치
- **인원 제한**: 밤하늘마다 개별 설정 (소규모 50명 ~ 대규모 300명)
- **자유 구경**: 모든 공간 자유롭게 방문 가능

### 밤하늘 공간 유형 (예시)
| 유형 | 수용 인원 | 특징 |
|------|-----------|------|
| 소규모 | 50명 | 프라이빗, 여유로운 배치 |
| 중규모 | 100명 | 적당히 풍성한 밤하늘 |
| 대규모 | 200~300명 | 북적북적, 다양한 별자리 |

### 사용자 실행 순서 예시

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 밤하늘 목록 진입                                              │
│     └── "3D 밤하늘" 메뉴 클릭                                     │
│                                                                  │
│  2. 밤하늘 공간 선택                                              │
│     ┌────────────┬────────────┬────────────┐                    │
│     │ 밤하늘 1    │ 밤하늘 2    │ 밤하늘 3    │                    │
│     │ (소규모)    │ (중규모)    │ (대규모)    │                    │
│     │ 50/50 (꽉참)│ 67/100     │ 45/300     │                    │
│     │ [구경하기]  │ [입장하기]  │ [입장하기]  │                    │
│     └────────────┴────────────┴────────────┘                    │
│                                                                  │
│  3-A. 별자리 등록하기 (빈자리 있는 공간)                           │
│     └── 밤하늘 2 입장                                            │
│         └── "내 별자리 등록" 버튼 클릭                            │
│             └── 하늘 위치 선택 (3D로 원하는 위치 지정)              │
│                 └── 등록 완료!                                   │
│                                                                  │
│  3-B. 구경만 하기                                                 │
│     └── 아무 밤하늘 입장                                          │
│         └── 드래그 / 핸드폰 기울이기로 360° 둘러보기               │
│             └── 다른 사람들의 별자리 감상                         │
│                 └── 별자리 터치 → 제작자 정보 보기                 │
│                                                                  │
│  4. 다른 밤하늘 구경                                              │
│     └── 뒤로가기 → 다른 밤하늘 선택 → 반복                        │
└─────────────────────────────────────────────────────────────────┘
```

### 3D 뷰어 조작 방법
| 조작 | 동작 |
|------|------|
| 화면 드래그 | 시점 회전 (상하좌우) |
| 핸드폰 기울이기 | 자이로스코프로 시점 이동 |
| 핀치 줌 | 확대/축소 (옵션) |
| 별자리 터치 | 정보 팝업 표시 |
| 시간 경과 | 24시간 주기로 하늘 자동 회전 |

---

## 구현 진행 상황

### Phase 1: 기반 설정
| 작업 | 상태 | 비고 |
|------|------|------|
| Three.js 라이브러리 설치 | [x] 완료 | three, @react-three/fiber, @react-three/drei (설치됨) |
| sky_rooms 테이블 생성 | [ ] 대기 | Supabase 마이그레이션 |
| sky_constellations 테이블 생성 | [ ] 대기 | Supabase 마이그레이션 |
| 초기 밤하늘 공간 데이터 시드 | [ ] 대기 | 소/중/대규모 밤하늘 생성 |

### Phase 2: 3D 뷰어 개발
| 작업 | 상태 | 비고 |
|------|------|------|
| 기본 3D 구형 하늘 컴포넌트 | [ ] 대기 | SkyDome.jsx |
| 별자리 3D 렌더링 | [ ] 대기 | 기존 2D 데이터 → 3D 변환 |
| 드래그로 시점 이동 | [ ] 대기 | OrbitControls |
| 자이로스코프 연동 | [ ] 대기 | DeviceOrientation API |
| 24시간 하늘 회전 애니메이션 | [ ] 대기 | 실시간 시간 기반 |
| GPS 기반 하늘 위치 계산 | [ ] 대기 | 위도/경도 → 지평좌표 |

### Phase 3: 페이지 & UI
| 작업 | 상태 | 비고 |
|------|------|------|
| 밤하늘 목록 페이지 | [ ] 대기 | /sky-rooms |
| 밤하늘 상세 뷰어 페이지 | [ ] 대기 | /sky-room/:id |
| 별자리 등록 UI | [ ] 대기 | 하늘 위치 선택 |
| 별자리 등록 위치 선택 모달 | [ ] 대기 | 3D 프리뷰 |

### Phase 4: 기능 완성
| 작업 | 상태 | 비고 |
|------|------|------|
| 내 별자리 불러오기 연동 | [ ] 대기 | 기존 stars 테이블 연동 |
| 실시간 동기화 | [ ] 대기 | Supabase Realtime |
| 다른 사용자 별자리 표시 | [ ] 대기 | |
| 별자리 터치 시 정보 표시 | [ ] 대기 | 제작자 닉네임 등 |

---

## 데이터베이스 스키마

### sky_rooms (밤하늘 공간)
```sql
CREATE TABLE sky_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,           -- "밤하늘 1"
  description TEXT,                     -- 공간 설명
  max_capacity INTEGER NOT NULL,         -- 최대 별자리 수 (50/100/300 등 개별 설정)
  current_count INTEGER DEFAULT 0,      -- 현재 등록된 수
  theme VARCHAR(50),                    -- 테마 (옵션)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### sky_constellations (등록된 별자리)
```sql
CREATE TABLE sky_constellations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES sky_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 별자리 데이터 (기존 형식 재사용)
  constellation_name VARCHAR(100),      -- 별자리 이름
  stars_data JSONB NOT NULL,            -- 별 위치, 색상 등
  connections_data JSONB,               -- 별 연결선

  -- 3D 하늘 위치 (천구 좌표)
  right_ascension FLOAT,                -- 적경 (0-360도)
  declination FLOAT,                    -- 적위 (-90 ~ +90도)

  registered_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(room_id, user_id)              -- 한 방에 한 사람당 하나
);
```

---

## 기술 스택

### 추가 필요 라이브러리
```json
{
  "three": "^0.160.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.88.0"
}
```

### 사용할 API
| API | 용도 |
|-----|------|
| DeviceOrientation | 자이로스코프 (핸드폰 기울기) |
| Geolocation | GPS 위치 |
| Supabase Realtime | 실시간 별자리 동기화 |

---

## 파일 구조 (예정)

```
src/
├── components/
│   └── sky/
│       ├── SkyDome.jsx          # 3D 구형 하늘
│       ├── Constellation3D.jsx   # 3D 별자리 렌더링
│       ├── SkyControls.jsx       # 드래그/자이로 컨트롤
│       └── StarMarker.jsx        # 개별 별 마커
├── pages/
│   ├── SkyRoomsPage.jsx          # 밤하늘 목록
│   └── SkyRoomViewerPage.jsx     # 3D 밤하늘 뷰어
├── hooks/
│   ├── useDeviceOrientation.js   # 자이로스코프 훅
│   ├── useGeolocation.js         # GPS 훅
│   └── useCelestialPosition.js   # 천문 계산 훅
└── utils/
    └── celestial.js              # 적경/적위 → 화면좌표 변환
```

---

## 천문학적 계산 참고

### 지평좌표계 변환
사용자의 위치(위도/경도)와 현재 시간을 기반으로 하늘의 어느 부분이 보이는지 계산

```
1. 적경(RA), 적위(Dec) → 시간각(HA) 계산
2. 시간각 + 위도 → 고도(Altitude), 방위각(Azimuth)
3. 24시간 주기로 시간각 변화 → 하늘 회전
```

### 참고 공식
- 항성시(LST) = GMT + 경도/15
- 시간각(HA) = LST - 적경(RA)
- 고도/방위각 = f(HA, Dec, 위도)

---

## 우선순위 및 다음 단계

### 즉시 시작 가능
1. [ ] Three.js 설치
2. [ ] DB 마이그레이션 파일 작성
3. [ ] 기본 3D 구형 하늘 프로토타입

### 의존성 있음
- 별자리 등록 UI → 3D 뷰어 완성 후
- GPS/자이로 연동 → 기본 뷰어 완성 후
- 실시간 동기화 → DB 설계 완성 후

---

## 메모

- 현재 별자리는 Canvas 2D로 구현되어 있음 (HomePage.jsx)
- 기존 stars, star_connections 테이블 데이터 재활용 가능
- 모바일 웹에서 자이로스코프는 HTTPS 필수

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-01-27 | 초기 문서 작성 |
| 2026-01-27 | 밤하늘별 수용 인원 개별 설정 기능 추가 |
| 2026-01-27 | Phase 1~4 구현 완료 (DB 적용 제외) |
| 2026-01-27 | 코드 초기화 - 재설계 시작 (Three.js만 유지) |
