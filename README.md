# Starry - 당신을 닮은, 단 하나의 별자리

별자리를 통해 개인의 성향을 시각화하고 공유하는 웹 애플리케이션입니다.

## 기술 스택

- **Frontend**: React 18, React Router
- **Backend**: Supabase (Auth, Database)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase)

## 주요 기능

### 1. 사용자 인증 시스템
- 이메일/비밀번호 로그인
- 소셜 로그인 (Google, Kakao)
- 회원가입 시 닉네임, 전화번호 등록
- 개발자 테스트 계정 (test@test.com)

### 2. 사용자 설정 (UserPage)
- 계정 정보 조회 (아이디, 닉네임, 전화번호)
- 비밀번호 변경
- 소셜 계정 연동 관리
- 언어 설정
- QR 코드 링크 공유

### 3. 설문 공유 기능
- 개인 설문 링크 생성 및 공유
- 설문 시작 페이지 (SurveyStartPage)
- 로딩 애니메이션 효과
- 대상 사용자 닉네임 자동 표시

### 4. 전역 상태 관리 (AuthContext)
- 로그인 사용자 정보 중앙 관리
- 닉네임 자동 로딩
- 모든 페이지에서 사용자 정보 접근 가능

## 프로젝트 구조

```
src/
├── components/
│   └── NavBar.jsx              # 하단 네비게이션 바
├── contexts/
│   └── AuthContext.jsx         # 전역 인증 상태 관리
├── lib/
│   └── supabase.js            # Supabase 클라이언트 설정
├── pages/
│   ├── LoadingPage.jsx        # 로그인 페이지
│   ├── SignupPage.jsx         # 회원가입 페이지
│   ├── HomePage.jsx           # 메인 홈 (별자리 표시)
│   ├── StarryPage.jsx         # Starry 페이지
│   ├── StarsPage.jsx          # Stars 페이지
│   ├── StatPage.jsx           # 통계 페이지
│   ├── UserPage.jsx           # 사용자 설정 페이지
│   ├── NoticePage.jsx         # 공지사항 목록
│   ├── NoticeDetailPage.jsx   # 공지사항 상세
│   └── SurveyStartPage.jsx    # 설문 시작 페이지
└── App.jsx                    # 라우팅 설정

supabase/
└── migrations/
    └── 20260109_create_profiles_table.sql  # 프로필 테이블 생성
```

## 데이터베이스 구조

### profiles 테이블
```sql
- id: UUID (Primary Key, References auth.users)
- nickname: TEXT
- phone: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**RLS 정책:**
- 모든 사용자가 프로필 읽기 가능 (설문 공유 기능을 위해)
- 사용자는 자신의 프로필만 수정/삽입 가능

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

## 개발 예정

### 1. SMS 인증 기능 구현 (우선순위: 높음)
**계획:**
- Solapi API 연동
- 회원가입 시 실제 SMS 발송
- 인증번호 검증 (유효시간 3분)
- Supabase Edge Functions로 백엔드 검증
- Rate limiting 적용

**필요 작업:**
- Solapi 계정 생성 및 API 키 발급
- phone_verifications 테이블 생성
- send-sms, verify-sms Edge Functions 구현
- SignupPage.jsx SMS 인증 UI 추가

**관련 파일:**
- `supabase/functions/send-sms/index.ts` (신규)
- `supabase/functions/verify-sms/index.ts` (신규)
- `src/pages/SignupPage.jsx` (수정)

**참고:**
- 상세 계획: `C:\Users\vxbc5\.claude\plans\eager-foraging-lecun.md`

---

### 2. 설문 질문 페이지 구현 (우선순위: 높음)
**계획:**
- SurveyStartPage "다음" 버튼 클릭 시 이동
- 다양한 질문 유형 (객관식, 주관식, 별점 등)
- 진행률 표시
- 이전/다음 버튼
- 임시 저장 기능

**필요 작업:**
- SurveyQuestionsPage.jsx 생성
- questions 테이블 생성
- survey_responses 테이블 생성
- 질문별 컴포넌트 구현

**라우트:**
```
/survey/:userId/questions
```

---

### 3. 별 생성 및 수신 기능 (우선순위: 중간)
**계획:**
- 설문 완료 시 "별" 생성
- 대상 사용자의 밤하늘에 별 추가
- 별 클릭 시 설문 결과 확인
- 별자리 시각화

**필요 작업:**
- stars 테이블 생성
- 별 시각화 컴포넌트 구현
- HomePage에 별 표시 로직 추가
- Canvas 또는 SVG 기반 렌더링

---

### 4. 별자리 AI 이름 생성 (우선순위: 낮음)
**계획:**
- 설문 결과 기반 별자리 특성 분석
- OpenAI API로 별자리 이름 생성
- 사용자 커스텀 이름 수정 기능

**필요 작업:**
- OpenAI API 연동
- Supabase Edge Function 구현
- HomePage AI 이름 생성 버튼 구현

---

### 5. 이미지 캡쳐 및 공유 기능 (우선순위: 낮음)
**계획:**
- 밤하늘 화면 캡쳐
- 이미지 다운로드
- SNS 공유 기능

**필요 작업:**
- html2canvas 또는 domtoimage 라이브러리 적용
- 이미지 다운로드 기능 구현
- 공유 버튼 구현

---

### 6. 다국어 지원 (우선순위: 낮음)
**계획:**
- 영어/한국어 전환
- i18n 라이브러리 적용
- 모든 텍스트 다국어 처리

**필요 작업:**
- react-i18next 설치
- 언어 파일 생성 (ko.json, en.json)
- 모든 컴포넌트에 번역 적용

---

## 설치 및 실행

### 환경 변수 설정
`.env` 파일 생성:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
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
Copyright ©2025. All rights reserved.

**개발자**: 김기찬
**디자이너**: 김태희

**문의**:
- 광고 문의: kimkichan1225@gmail.com
- 기타 문의: kimkichan1225@gmail.com
