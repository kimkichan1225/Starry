# Starry - 당신을 닮은, 단 하나의 별자리

별자리를 통해 개인의 성향을 시각화하고 공유하는 웹 애플리케이션입니다.

## 기술 스택

- **Frontend**: React 18, React Router
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **SMS 인증**: Solapi API

## 주요 기능

### 1. 사용자 인증 시스템
- 이메일/비밀번호 로그인
- 소셜 로그인 (Google, Kakao)
- 회원가입 시 닉네임, 전화번호 등록
- SMS 인증 기능 (Solapi API 연동)
- 개발자 테스트 계정 (test@test.com)
- 이메일 찾기 (전화번호 SMS 인증)
- 비밀번호 찾기/재설정 (이메일 링크)

### 2. 관리자 시스템 (AdminPage)
- 대시보드: 총 회원 수, 총 별 수, 총 연결 수, 오늘 가입자 통계
- 회원 관리: 검색, 조회, 삭제 기능
- 공지사항 관리: CRUD 기능 (일반/중요/이벤트 카테고리)
- 설정: 최대 별 개수, 점검 모드, 회원가입 허용 설정
- 관리자 권한: `src/config/admin.js`에서 이메일 기반 관리

### 3. 사용자 설정 (UserPage)
- 계정 정보 조회 (아이디, 닉네임, 전화번호)
- 비밀번호 변경
- 소셜 계정 연동 관리
- 언어 설정
- QR 코드 링크 공유

### 4. 설문 시스템
- 개인 설문 링크 생성 및 공유 (`/survey/:userId`)
- 설문 시작 페이지 (SurveyStartPage) - 로딩 애니메이션 효과
- 설문 질문 페이지 (SurveyQuestionPage) - 5개 질문
- 설문 결과 기반 별 생성 (색상, 꼭짓점, 크기, 채도, 날카로움)
- 별 전송 및 밤하늘 보기 기능

### 5. 별 시스템
- 설문 응답 기반 별 속성 자동 생성
- Canvas 기반 별 렌더링 (글로우 효과 포함)
- 별자리 연결선 표시
- 사용자별 밤하늘 (최대 30개 별)

### 6. 전역 상태 관리 (AuthContext)
- 로그인 사용자 정보 중앙 관리
- 닉네임 자동 로딩
- 모든 페이지에서 사용자 정보 접근 가능

## 프로젝트 구조

```
src/
├── components/
│   └── NavBar.jsx               # 하단 네비게이션 바
├── config/
│   └── admin.js                 # 관리자 이메일 설정
├── contexts/
│   └── AuthContext.jsx          # 전역 인증 상태 관리
├── lib/
│   └── supabase.js              # Supabase 클라이언트 설정
├── services/
│   └── supabase.js              # Supabase 서비스 함수
├── pages/
│   ├── LoadingPage.jsx          # 로그인 페이지
│   ├── SignupPage.jsx           # 회원가입 페이지
│   ├── FindEmailPage.jsx        # 이메일 찾기 페이지
│   ├── FindPasswordPage.jsx     # 비밀번호 찾기 페이지
│   ├── ResetPasswordPage.jsx    # 비밀번호 재설정 페이지
│   ├── ProfileSetupPage.jsx     # 프로필 설정 페이지
│   ├── AdminPage.jsx            # 관리자 페이지
│   ├── HomePage.jsx             # 메인 홈 (별자리 표시)
│   ├── StarryPage.jsx           # Starry 페이지
│   ├── StarsPage.jsx            # Stars 페이지
│   ├── StatPage.jsx             # 통계 페이지
│   ├── StatDetailPage.jsx       # 통계 상세 페이지
│   ├── UserPage.jsx             # 사용자 설정 페이지
│   ├── NoticePage.jsx           # 공지사항 목록
│   ├── NoticeDetailPage.jsx     # 공지사항 상세
│   ├── SurveyStartPage.jsx      # 설문 시작 페이지
│   └── SurveyQuestionPage.jsx   # 설문 질문 페이지
└── App.jsx                      # 라우팅 설정

supabase/
├── migrations/
│   ├── 20260109_create_profiles_table.sql       # 프로필 테이블
│   └── 20260109_create_phone_verifications.sql  # SMS 인증 테이블
└── functions/
    ├── _shared/
    │   ├── cors.ts              # CORS 설정
    │   ├── solapi.ts            # Solapi API 클라이언트
    │   ├── rate-limit.ts        # Rate limiting
    │   └── verification-code.ts # 인증 코드 생성
    ├── send-sms/
    │   └── index.ts             # SMS 발송 함수
    └── verify-sms/
        └── index.ts             # SMS 인증 확인 함수
```

## 데이터베이스 구조

### profiles 테이블
```sql
- id: UUID (Primary Key, References auth.users)
- nickname: TEXT
- phone: TEXT
- email: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### stars 테이블
```sql
- id: UUID (Primary Key)
- user_id: UUID (References auth.users)
- surveyor_name: TEXT
- star_color: INTEGER (1-4)
- star_points: INTEGER (1-4)
- star_size: INTEGER (1-4)
- star_saturation: INTEGER (1-4)
- star_sharpness: INTEGER (1-4)
- answers: JSONB
- position_x: FLOAT
- position_y: FLOAT
- created_at: TIMESTAMPTZ
```

### star_connections 테이블
```sql
- id: UUID (Primary Key)
- user_id: UUID (References auth.users)
- from_star_id: UUID (References stars)
- to_star_id: UUID (References stars)
- created_at: TIMESTAMPTZ
```

### phone_verifications 테이블
```sql
- id: UUID (Primary Key)
- phone: TEXT
- code: TEXT
- expires_at: TIMESTAMPTZ
- verified: BOOLEAN
- created_at: TIMESTAMPTZ
```

### notices 테이블
```sql
- id: UUID (Primary Key)
- title: TEXT
- content: TEXT
- category: TEXT (일반/중요/이벤트)
- author_id: UUID (References auth.users)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**RLS 정책:**
- profiles: 모든 사용자가 읽기 가능, 본인만 수정 가능
- stars: 모든 사용자가 읽기 가능, 삽입은 누구나 가능
- star_connections: 모든 사용자가 읽기 가능, 본인 별만 연결 가능
- notices: 모든 사용자가 읽기 가능, 관리자만 수정 가능

## 작업 내역

### 1. AuthContext 구현
**날짜**: 2026-01-09

**구현 내용:**
- 전역 사용자 인증 상태 관리 컨텍스트 생성
- 앱 시작 시 사용자 정보 1회 로딩
- 모든 페이지에서 `useAuth()` 훅으로 접근 가능

**파일:**
- `src/contexts/AuthContext.jsx` (신규)
- `src/App.jsx` (AuthProvider 추가)
- `src/pages/HomePage.jsx`, `src/pages/StarsPage.jsx`, `src/pages/UserPage.jsx` (useAuth 적용)

---

### 2. 개발자 테스트 로그인 추가
**날짜**: 2026-01-09

**구현 내용:**
- LoadingPage 광고 배너에 "개발자 로그인" 버튼 추가
- 클릭 시 test@test.com 계정으로 자동 로그인
- 로그인 실패 에러 메시지 한국어 변경

**파일:**
- `src/pages/LoadingPage.jsx` (handleDevLogin 함수 추가)

---

### 3. UserPage 디자인 전면 개편
**날짜**: 2026-01-09

**구현 내용:**
- 아이디, 닉네임, 전화번호 레이아웃을 가로 정렬로 변경
- 비밀번호 변경 섹션 (현재 비밀번호, 새 비밀번호, 확인) 추가
- 소셜 계정 연동 관리 버튼 (Google, Kakao, Naver, Facebook)
- 언어 설정 드롭다운
- QR 코드 링크 복사 기능

**파일:**
- `src/pages/UserPage.jsx` (전체 UI 재구성)

---

### 4. 설문 공유 기능 구현
**날짜**: 2026-01-09

**구현 내용:**
- HomePage에 공유 버튼 추가 (클립보드로 링크 복사)
- 설문 시작 페이지 생성 (SurveyStartPage)
- 대상 사용자 닉네임 자동 표시
- 설문자 이름 입력 폼

**파일:**
- `src/pages/HomePage.jsx` (handleShare 함수 추가)
- `src/pages/SurveyStartPage.jsx` (신규)
- `src/App.jsx` (라우트 추가: `/survey/:userId`)

**링크 형식:**
```
https://yourdomain.com/survey/{userId}
```

---

### 5. Profiles 테이블 생성
**날짜**: 2026-01-09

**구현 내용:**
- 공개 프로필 정보 저장용 테이블 생성
- RLS 정책 설정 (누구나 읽기 가능, 본인만 수정 가능)
- 회원가입 시 자동 프로필 생성 트리거
- 기존 사용자 프로필 자동 생성 마이그레이션

**파일:**
- `supabase/migrations/20260109_create_profiles_table.sql` (신규)

**이유:**
- auth.users 테이블은 클라이언트에서 직접 접근 불가
- 설문 페이지에서 대상 사용자의 닉네임을 표시하기 위해 필요

---

### 6. SurveyStartPage 로딩 애니메이션 추가
**날짜**: 2026-01-09

**구현 내용:**
- LoadingPage와 동일한 로딩 패턴 적용
- 로고와 서브타이틀이 위로 이동하며 사라지는 애니메이션
- 2초 후 상단 네비게이션과 메인 콘텐츠 페이드인
- 부드러운 전환 효과 (1초 duration)

**파일:**
- `src/pages/SurveyStartPage.jsx` (isLoaded 상태 및 애니메이션 추가)

**애니메이션 순서:**
1. 큰 로고 + "당신을 닮은, 단 하나의 별자리" 중앙 표시
2. 2초 후 로고와 서브타이틀이 위로 이동하며 페이드아웃 (`-translate-y-[22vh]`)
3. 상단 네비게이션 바 페이드인
4. 메인 콘텐츠 (타이틀 + 입력 폼) 슬라이드인

---

## 문제 해결 사례

### 문제 1: 닉네임 깜빡임 및 중복 API 호출

**문제:**
- 페이지 로드 시 "User1"이 먼저 표시되고 API 응답 후 실제 닉네임으로 변경되는 깜빡임 발생
- 각 페이지(HomePage, StarsPage, UserPage)마다 동일한 사용자 정보를 반복 요청
- 5개 페이지에 동일한 코드 중복

**해결:**
AuthContext를 생성하여 앱 시작 시 1회만 사용자 정보를 로딩하고 모든 컴포넌트에서 공유

```javascript
// src/contexts/AuthContext.jsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setNickname(user?.user_metadata?.nickname || 'User1');
      setLoading(false);
    };
    getInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setNickname(session?.user?.user_metadata?.nickname || 'User1');
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, nickname, loading }}>
    {children}
  </AuthContext.Provider>;
};
```

**결과:**
- API 호출 횟수: 5회 → 1회 (80% 감소)
- 닉네임 깜빡임 완전 제거
- 코드 중복 제거

---

### 문제 2: 설문 페이지에서 사용자 닉네임 접근 불가

**문제:**
- 비로그인 사용자가 설문 링크 접속 시 대상 사용자의 닉네임 표시 필요
- Supabase의 `auth.users` 테이블은 클라이언트에서 직접 쿼리 불가
- 에러: `PGRST205 - Could not find the table 'public.profiles'`

**해결:**
공개 프로필 정보를 저장하는 `profiles` 테이블 생성 + RLS 정책 설정

```sql
-- 테이블 생성
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 자동 프로필 생성 트리거
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'nickname', NEW.raw_user_meta_data->>'phone');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**결과:**
- 비로그인 사용자도 대상 사용자 닉네임 조회 가능
- 보안 유지 (본인만 프로필 수정 가능)
- 쿼리 속도 향상 (인덱스 적용)

---

### 문제 3: 로딩 애니메이션 방향 문제

**문제:**
- `fixed` 포지션 사용 시 로고가 갑자기 위치 변경되며 어색함
- 로고가 오른쪽에서 왼쪽으로 나타나는 것처럼 보임
- 서브타이틀은 제자리에서 사라져 어색함

**해결:**
CSS Transform을 활용하여 로고와 서브타이틀이 함께 위로 이동하며 사라지도록 변경

```javascript
// 중앙 로고 - 위로 이동하며 페이드아웃
<img
  src="/Logo.png"
  className={`transition-all duration-1000 ease-out ${
    isLoaded
      ? 'h-5 -translate-y-[22vh] opacity-0'
      : 'w-64 md:w-96 translate-y-0 opacity-100'
  }`}
/>

// 서브타이틀 - 동일하게 위로 이동
<p className={`transition-all duration-1000 ease-out ${
    isLoaded ? 'opacity-0 -translate-y-[22vh]' : 'opacity-100 translate-y-0'
  }`}>
  당신을 닮은, 단 하나의 별자리
</p>

// 네비게이션 로고 - 페이드인
<img
  src="/Logo.png"
  className={`h-5 absolute left-1/2 transform -translate-x-1/2
    transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
/>
```

**결과:**
- 자연스러운 위로 이동 애니메이션
- GPU 가속으로 60fps 부드러운 전환
- Reflow 0회 (성능 최적화)

---

### 문제 4: 영어 에러 메시지

**문제:**
- Supabase가 반환하는 영어 에러 메시지가 사용자에게 표시됨
- "Invalid login credentials" 등 한국 사용자가 이해하기 어려움

**해결:**
에러 메시지를 한국어로 변환하는 로직 추가

```javascript
catch (error) {
  if (error.message === 'Invalid login credentials') {
    setError('이메일 또는 비밀번호가 틀렸습니다.');
  } else if (error.message === 'Email not confirmed') {
    setError('이메일 인증이 필요합니다.');
  } else {
    setError(error.message || '로그인에 실패했습니다.');
  }
}
```

**결과:**
- 사용자 친화적인 한국어 에러 메시지
- 향후 다국어 지원 확장 가능

---

### 7. SMS 인증 기능 구현
**날짜**: 2026-01-10

**구현 내용:**
- Solapi API 연동으로 실제 SMS 발송
- 6자리 인증 코드 생성 (유효시간 3분)
- Supabase Edge Functions로 백엔드 검증
- Rate limiting 적용 (분당 3회 제한)
- phone_verifications 테이블 생성

**파일:**
- `supabase/functions/send-sms/index.ts` (신규)
- `supabase/functions/verify-sms/index.ts` (신규)
- `supabase/functions/_shared/solapi.ts` (신규)
- `supabase/functions/_shared/cors.ts` (신규)
- `supabase/functions/_shared/rate-limit.ts` (신규)
- `supabase/functions/_shared/verification-code.ts` (신규)
- `supabase/migrations/20260109_create_phone_verifications.sql` (신규)

---

### 8. 설문 질문 페이지 구현
**날짜**: 2026-01-10

**구현 내용:**
- 5개 질문 (가치관, 행동 스타일, 첫인상, 행복 상황, 스트레스 해소)
- 각 질문당 4개 선택지
- 이전/다음 버튼으로 질문 간 이동
- 진행률 표시 (현재 질문/총 질문)
- 응답 기반 별 속성 자동 생성
- Canvas로 별 미리보기 렌더링
- 별 전송 기능 (stars 테이블에 저장)
- 전송 완료 후 대상 사용자 밤하늘 보기

**별 속성 매핑:**
- Q1: 색상 (빨강/초록/파랑/노랑)
- Q2: 꼭짓점 (8/5/4/6개)
- Q3: 크기 (0.35~0.40 비율)
- Q4: 채도 (80~20%)
- Q5: 날카로움 (0.5~0.2 비율)

**파일:**
- `src/pages/SurveyQuestionPage.jsx` (신규)
- `src/App.jsx` (라우트 추가: `/survey/:userId/questions`)

---

### 9. 관리자 시스템 구현
**날짜**: 2026-01-15

**구현 내용:**
- 관리자 이메일 기반 권한 체크
- 대시보드 탭: 실시간 통계 (회원 수, 별 수, 연결 수, 설문 참여율)
- 회원관리 탭: 검색, 목록 조회, 회원 삭제
- 공지사항 탭: 작성, 수정, 삭제, 카테고리 분류
- 설정 탭: 최대 별 개수, 점검 모드, 회원가입 허용

**파일:**
- `src/pages/AdminPage.jsx` (신규)
- `src/config/admin.js` (신규)
- `src/App.jsx` (라우트 추가: `/admin`)

**관리자 접근:**
- URL: `/admin`
- 권한: `src/config/admin.js`의 `ADMIN_EMAILS` 배열에 이메일 등록 필요

---

### 10. 이메일/비밀번호 찾기 기능 구현
**날짜**: 2026-01-21

**구현 내용:**
- 이메일 찾기 페이지 (FindEmailPage)
  - 전화번호 입력 후 SMS 인증
  - 인증 완료 시 마스킹된 이메일 표시 (예: ki***@gmail.com)
  - 가입되지 않은 번호 예외 처리
- 비밀번호 찾기 페이지 (FindPasswordPage)
  - 이메일 입력 후 비밀번호 재설정 링크 발송
  - Supabase Auth resetPasswordForEmail 활용
  - 가입되지 않은 이메일 예외 처리
- 비밀번호 재설정 페이지 (ResetPasswordPage)
  - 이메일 링크의 토큰 검증
  - 새 비밀번호 입력 및 확인
  - 만료/유효하지 않은 링크 예외 처리
  - 재설정 완료 후 자동 로그아웃

**파일:**
- `src/pages/FindEmailPage.jsx` (신규)
- `src/pages/FindPasswordPage.jsx` (신규)
- `src/pages/ResetPasswordPage.jsx` (신규)
- `src/App.jsx` (라우트 추가: `/find-email`, `/find-password`, `/reset-password`)

**이메일 마스킹 로직:**
```javascript
const maskEmail = (email) => {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart}***@${domain}`;
  }
  return `${localPart.slice(0, 2)}***@${domain}`;
};
```

---

## 개발 예정

### 1. 별자리 AI 이름 생성 (우선순위: 중간)
**계획:**
- 설문 결과 기반 별자리 특성 분석
- OpenAI API로 별자리 이름 생성
- 사용자 커스텀 이름 수정 기능

**필요 작업:**
- OpenAI API 연동
- Supabase Edge Function 구현
- HomePage AI 이름 생성 버튼 구현

---

### 2. 이미지 캡쳐 및 공유 기능 (우선순위: 낮음)
**계획:**
- 밤하늘 화면 캡쳐
- 이미지 다운로드
- SNS 공유 기능

**필요 작업:**
- html2canvas 또는 domtoimage 라이브러리 적용
- 이미지 다운로드 기능 구현
- 공유 버튼 구현

---

### 3. 다국어 지원 (우선순위: 낮음)
**계획:**
- 영어/한국어 전환
- i18n 라이브러리 적용
- 모든 텍스트 다국어 처리

**필요 작업:**
- react-i18next 설치
- 언어 파일 생성 (ko.json, en.json)
- 모든 컴포넌트에 번역 적용

---

## 라우팅 구조

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | LoadingPage | 로그인 페이지 |
| `/signup` | SignupPage | 회원가입 페이지 |
| `/find-email` | FindEmailPage | 이메일 찾기 |
| `/find-password` | FindPasswordPage | 비밀번호 찾기 |
| `/reset-password` | ResetPasswordPage | 비밀번호 재설정 |
| `/profile-setup` | ProfileSetupPage | 프로필 설정 |
| `/admin` | AdminPage | 관리자 페이지 |
| `/starry` | StarryPage | Starry 메인 |
| `/stars` | StarsPage | Stars 페이지 |
| `/home` | HomePage | 홈 (별자리 표시) |
| `/stat` | StatPage | 통계 페이지 |
| `/stat/detail` | StatDetailPage | 통계 상세 |
| `/user` | UserPage | 사용자 설정 |
| `/notice` | NoticePage | 공지사항 목록 |
| `/notice/:id` | NoticeDetailPage | 공지사항 상세 |
| `/survey/:userId` | SurveyStartPage | 설문 시작 |
| `/survey/:userId/questions` | SurveyQuestionPage | 설문 질문 |

---

## 설치 및 실행

### 환경 변수 설정
`.env` 파일 생성:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabase Edge Functions 환경 변수 (Supabase Dashboard에서 설정):
```env
SOLAPI_API_KEY=your_solapi_api_key
SOLAPI_API_SECRET=your_solapi_api_secret
SOLAPI_SENDER=your_sender_phone_number
```

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

### 빌드
```bash
npm run build
```

---

## 라이선스
Copyright ©2026. All rights reserved.

**개발자**: 김기찬
**디자이너**: 김태희

**문의**:
- 광고 문의: kimkichan1225@gmail.com
- 기타 문의: kimkichan1225@gmail.com
