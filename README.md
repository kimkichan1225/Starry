# Starry - 당신을 닮은, 단 하나의 별자리

친구들이 설문에 답해 보내준 별로 나만의 밤하늘과 별자리를 만드는 웹 서비스입니다.
운영: Studio.Vec · 서비스 도메인: vec-starry.com

> **이 저장소는 공개(public) 저장소입니다.**
> 비밀키(service_role 키, OTP pepper, API 시크릿), 운영 계정 정보, 아직 막지 않은 보안 약점의 세부 내용은 커밋하지 마세요.

> **현재 상태 (2026-09-11)**
> 출시 전 보안 점검에 따른 DB 마이그레이션과 Edge Function은 **운영에 반영이 끝났고, 프론트엔드만 배포 대기** 중입니다.
> 그래서 지금 운영 사이트(구버전 프론트)에서는 설문 전송, 신규 가입, 아이디·비밀번호 찾기 등 일부 기능이 동작하지 않습니다.
> 최신 코드는 `fit` 브랜치에 있으며, [10. 배포 체크리스트](#10-배포-체크리스트)대로 배포해야 합니다.

## 목차
1. [한눈에 보기](#1-한눈에-보기)
2. [저장소·배포 구조](#2-저장소배포-구조)
3. [로컬 개발](#3-로컬-개발)
4. [환경변수·비밀값](#4-환경변수비밀값)
5. [Edge Functions](#5-edge-functions)
6. [데이터베이스와 보안 규칙](#6-데이터베이스와-보안-규칙)
7. [관리자](#7-관리자)
8. [회원·인증·개인정보](#8-회원인증개인정보)
9. [결제](#9-결제)
10. [배포 체크리스트](#10-배포-체크리스트)
11. [대시보드 설정 (코드 밖)](#11-대시보드-설정-코드-밖)
12. [알려진 이슈·남은 작업](#12-알려진-이슈남은-작업)
13. [라우팅](#13-라우팅)

---

## 1. 한눈에 보기

| 구분 | 사용 기술 |
|---|---|
| 프론트엔드 | React 19, Vite 7, React Router 7, Tailwind CSS 3, three.js(@react-three/fiber) |
| 백엔드 | Supabase — Auth, PostgreSQL(RLS), Edge Functions(Deno), Storage, Realtime |
| 호스팅 | Vercel (프론트엔드 + `api/` 서버리스 함수) |
| 외부 서비스 | Solapi(SMS 인증), OpenAI(오늘의 운세·AI 별자리 이름), Toss Payments(테스트 결제, 포트원으로 교체 예정), Google AdSense |

**주요 기능**
- 회원가입·로그인: 이메일, 구글, 카카오 / 휴대폰 SMS 인증 필수 / 약관 동의 / 만 14세 미만 가입 불가
- 설문 공유: `/survey/:userId` 링크로 비회원 친구가 설문에 답하면 대상 회원에게 별 1개가 생성됨
- 홈(2D 별자리 편집), 보관함, 통계, 3D 밤하늘(전체 공개 하늘 + 초대코드 기반 비공개 하늘)
- 오늘의 운세, AI 별자리 이름 추천(무료 3회 이후 별가루 차감)
- 상점: 별가루 충전(원화 결제), 별가루로 별 아이템·보관소 확장 구매
- 마이페이지: 닉네임·비밀번호 변경, 소셜 연동, 회원 탈퇴
- 관리자: 통계, 회원 조회·삭제, 공지사항, 상점 상품, 설정

---

## 2. 저장소·배포 구조

**브랜치**
- `main`: 이전 운영 기준 코드
- `fit`: 2026-09-11 출시 전 보안·법적 항목 수정이 모두 들어간 최신 코드 → `main`에 병합 후 배포 필요

**프론트엔드 (Vercel)**
- 이 GitHub 저장소(`kimkichan1225/Starry`)는 Vercel 운영 프로젝트와 **연결되어 있지 않습니다.**
  Vercel 대시보드 → 프로젝트 → Settings → Git에서 실제 연결된 저장소를 확인하고, 그 저장소에 반영해야 배포됩니다.
- `vercel.json`: SPA 라우팅 rewrite, 보안 헤더(X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy). CSP는 현재 **Report-Only**입니다.
- `api/survey/[userId].js`: 설문 링크를 메신저에 공유할 때 대상 닉네임이 들어간 미리보기(Open Graph)를 만드는 서버리스 함수입니다. **운영에서 동작하지 않는 것으로 확인됨** — Vercel Functions 탭에서 배포 여부 확인 필요.

**Supabase**
- 프로젝트 ref: `aifioxdvjtxwxzxgdugs` / 리전: ap-southeast-2(시드니)
- DB 마이그레이션: `supabase/migrations/`의 SQL을 **대시보드 SQL Editor에서 수동 실행**합니다. ([6.4](#64-마이그레이션-현황과-주의) 참고)
- Edge Functions: `supabase/functions/<함수명>/index.ts`를 **대시보드에서 함수별로 붙여넣어 배포**합니다. 대시보드 단일 파일 배포를 위해 각 함수는 공통 코드를 인라인하고 `_shared/`를 import하지 않습니다.
- `supabase/functions/_shared/`는 사용하지 않는 구버전 코드입니다. 특히 `rate-limit.ts`는 안전하지 않으니 **재사용하지 마세요.**

---

## 3. 로컬 개발

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # 린트 (기존 코드에 해결되지 않은 에러가 남아 있음)
```

`.env` (로컬):
```env
VITE_SUPABASE_URL=https://aifioxdvjtxwxzxgdugs.supabase.co
VITE_SUPABASE_ANON_KEY=<anon 키>
```

- 실제로 쓰이는 Supabase 클라이언트는 `src/lib/supabase.js`입니다(URL·anon 키 내장). `src/services/supabase.js`는 사용하지 않습니다.
- anon 키는 공개돼도 되는 키이며, 데이터 보호는 RLS와 서버 함수 권한으로 합니다.
- `/sky-demo`(3D 데모) 페이지는 개발 서버에서만 열립니다.
- 로컬 개발 서버도 **운영 DB에 연결**됩니다. 테스트 데이터를 만들었다면 정리해 주세요.

---

## 4. 환경변수·비밀값

| 위치 | 이름 | 용도 |
|---|---|---|
| Vercel | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | 일부 화면이 SMS 함수 호출에 사용. **없으면 회원가입·아이디 찾기 장애** |
| Supabase Edge Function Secrets | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | Supabase가 자동 제공 |
| 〃 | `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER` | SMS 발송 |
| 〃 | `OTP_HASH_PEPPER` | 인증번호 해시용 비밀값. 바꾸면 발송된 인증번호가 모두 무효가 됨. 절대 유출 금지 |
| 〃 | `OPENAI_API_KEY` | 오늘의 운세, AI 별자리 이름 |
| 〃 | `TOSS_SECRET_KEY` | 결제 승인 (현재 테스트 키) |

- `src/pages/StorePage.jsx`에 Toss **테스트 클라이언트 키**가 하드코딩되어 있습니다. 포트원 전환 때 제거합니다.
- service_role 키와 위 비밀값은 **프론트엔드 코드나 저장소에 절대 넣지 마세요.** service_role 키는 모든 RLS를 우회합니다.

---

## 5. Edge Functions

| 함수 | 호출자 | 역할 |
|---|---|---|
| `send-sms` | 비로그인 | 인증번호 발송. 번호별·IP별 발송 제한 |
| `verify-sms` | 비로그인 | 인증번호 확인(시도 5회 제한). 성공 시 `verificationId`와 이미 가입된 번호인지(`phoneRegistered`)를 반환 |
| `confirm-phone` | 로그인 | `verificationId`를 1회 소비해 `app_metadata.phone_verified/phone`과 `profiles.phone`을 서버에서 기록. 다른 인증 계정의 번호면 `phone_taken` |
| `delete-account` | 로그인 | 본인 확인(이메일 가입자: 비밀번호 / 소셜 가입자: 확인 문구) 후 계정·데이터 즉시 삭제. 관리자 계정은 불가 |
| `daily-fortune` | 로그인 + 휴대폰 인증 | 오늘의 운세. 사용자별 하루 1회 생성 후 캐시 |
| `analyze-constellation` | 로그인 + 휴대폰 인증 | AI 별자리 이름 추천. 무료 횟수 후 별가루 차감, 실패 시 환불 |
| `create-store-payment`, `confirm-store-payment` | 로그인 | Toss 테스트 결제. **포트원 전환 시 교체 예정** |

공통 규칙
- 사용자 식별은 요청 본문이 아니라 **JWT로 확인한 사용자 id**로만 합니다.
- 내부 오류 원문(환경변수 누락, 외부 API 오류)은 서버 로그에만 남기고 클라이언트에는 고정 문구만 반환합니다.
- 함수 코드를 수정하면 대시보드에서 해당 함수를 다시 배포해야 반영됩니다.

---

## 6. 데이터베이스와 보안 규칙

### 6.1 핵심 테이블과 접근 규칙

| 테이블·뷰 | 누가 읽나 | 누가 쓰나 |
|---|---|---|
| `profiles` | 본인, 관리자 | 본인: `nickname`, `birthdate`, `social_linked` 등만. **잔액·슬롯·AI 사용횟수·전화번호·이메일·동의 기록은 서버만** |
| `public_profiles` (뷰) | **클라이언트 접근 차단** | — (닉네임은 `get_public_nickname`, `get_constellation_nicknames` RPC로만 조회) |
| `stars`, `star_connections` | 본인, 관리자 | 본인(위치·보관함 이동·연결). 설문 별 추가는 `submit_survey_star`, 상점 별은 `purchase_star_item`만 |
| `sky_constellations` | 로그인 사용자 | 본인 + 휴대폰 인증 |
| `skies`, `sky_members` | 멤버 | 생성·입장은 `create_sky`, `join_sky_by_code`(휴대폰 인증 필요) |
| `notices` | 누구나 | 관리자 |
| `settings` | 누구나 (**민감한 값 저장 금지**) | 관리자 |
| `store_products` | 활성 상품은 누구나 | 관리자 |
| `payments`, `star_dust_transactions` | 본인 | 서버(service_role)만 |
| `phone_verifications`, `sms_rate_limits`, `ai_rate_limits`, `daily_fortunes`, `survey_submit_logs` | 서버만 | 서버만 |

추가로
- `profiles.birthdate`는 만 14세 미만 날짜 저장이 DB 트리거로 거부됩니다.
- 만료 후 30일이 지난 휴대폰 인증 기록은 새 인증 요청 시 자동 삭제됩니다.
- 이메일 문자열로 권한을 판단하는 코드·정책은 없어야 합니다. (관리자는 [7. 관리자](#7-관리자) 참고)

### 6.2 새 테이블·함수·뷰를 만들 때 반드시 지킬 것

이 규칙들은 실제로 운영 DB에서 문제가 됐던 부분입니다.

1. **새 함수는 기본 실행 권한이 없습니다.** (public 스키마 기본 권한을 회수해 둠)
   - 클라이언트에서 호출할 함수: `GRANT EXECUTE ON FUNCTION ... TO authenticated;` (비로그인 호출이면 `anon`도)
   - 서버 전용 함수: `service_role`에만 부여
   - 기존 함수 권한을 막을 때는 `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated;`처럼 **세 역할 모두** 회수하세요. `FROM PUBLIC`만으로는 Supabase가 직접 부여한 권한이 남습니다.
2. **SECURITY DEFINER 함수**는 `SET search_path = public`을 지정하고, 함수 안에서 `auth.uid()`·`public.is_admin()` 등으로 호출자를 검증하세요. 대상 사용자 id를 인자로 받으면 누구의 데이터든 조작될 수 있습니다.
3. **새 테이블은 RLS를 반드시 켜세요.** Supabase는 anon·authenticated에 테이블 전체 권한을 기본 부여하므로 RLS가 없으면 전부 열립니다.
4. **컬럼 단위 REVOKE는 테이블 단위 권한이 있으면 효과가 없습니다.** 특정 컬럼만 막으려면 테이블 단위로 회수한 뒤 허용할 컬럼만 GRANT 하세요.
5. **`profiles`에 새 컬럼을 추가하면 클라이언트는 그 컬럼을 쓸 수 없습니다.** (허용 컬럼만 개별 부여된 상태) 클라이언트가 써야 하는 컬럼이면 `GRANT INSERT (컬럼), UPDATE (컬럼) ON public.profiles TO authenticated;`를 추가하세요.
6. **뷰를 만들면** 단순 뷰는 자동으로 쓰기 가능해지고 정의자 권한으로 RLS를 우회할 수 있습니다. `REVOKE ALL ... FROM anon, authenticated` 후 필요한 권한만 주거나, 가능하면 RPC로 대체하세요.
7. **개인정보는 목록으로 조회되는 경로를 만들지 마세요.** id를 알 때만 단건 조회하는 RPC를 쓰고, 이메일·전화번호 가입 여부를 알려주는 공개 API는 만들지 않습니다. (인증을 마친 본인에게만)
8. **재화·결제·슬롯 변경은 서버 함수에서 행 잠금(`FOR UPDATE`)으로 처리하세요.** 클라이언트가 계산한 값을 믿지 않습니다.
9. 전체 사용자에게 공개되는 테이블을 Realtime publication에 추가하면 변경 내용이 모두에게 전송됩니다. RLS 조회 범위를 먼저 확인하세요.

### 6.3 권한 점검 SQL

스키마를 바꾼 뒤 SQL Editor에서 확인하세요.

```sql
-- 비로그인(anon)·로그인(authenticated) 사용자가 실행할 수 있는 SECURITY DEFINER 함수
select p.oid::regprocedure as func,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by 1;

-- RLS가 꺼진 public 테이블 (결과가 없어야 정상)
select c.relname
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- 전체 RLS 정책
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' order by tablename, cmd;
```

### 6.4 마이그레이션 현황과 주의

- 2026-09-11에 추가한 마이그레이션(`20260911_*.sql` 8개)은 운영 DB 적용과 검증까지 마쳤습니다.
- **저장소의 마이그레이션만으로는 DB를 재현할 수 없습니다.** `stars`, `star_connections`, `notices`, `settings` 테이블과 `profiles`의 `email`, `birthdate`, `social_linked` 컬럼은 운영 DB에서 직접 만들어져 생성문이 없습니다.
  - 운영 DB에서 `supabase db dump`로 기준 스키마를 떠서 저장해 두는 작업이 필요합니다.
- `db_schema.sql`은 스키마가 아니라 덤프 실패 로그입니다. 참고하지 마세요.
- 기존 파일명은 날짜만 있어 중복이 많습니다(Supabase CLI `db push` 시 충돌 가능). 새 파일은 `YYYYMMDDHHMMSS_설명.sql` 형식을 권장합니다.
- 운영에 영향을 주는 마이그레이션은 파일 상단 주석에 **적용 조건과 운영 영향**을 적어 두세요.

---

## 7. 관리자

- 관리자 판정은 **`auth.users`의 `app_metadata.role = 'admin'`** 기준입니다. (DB: `public.is_admin()`, 프론트: `src/config/admin.js`)
  `app_metadata`는 서버에서만 바꿀 수 있어 사용자가 위조할 수 없습니다. 이메일로 판정하지 않습니다.
- 관리자 지정 (SQL Editor):
  ```sql
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  where email = '<관리자로 지정할 이메일>';
  ```
  지정·해제 후 해당 계정이 **로그아웃 → 재로그인**해야 반영됩니다.
- 관리자 해제: `set raw_app_meta_data = raw_app_meta_data - 'role'`
- 관리자 계정은 **전체 회원의 전화번호·이메일·생년월일을 볼 수 있습니다.** 강한 비밀번호를 쓰고, 계정을 공유하지 마세요.
- 관리자 화면의 회원 삭제는 탈퇴와 같은 삭제 로직(`delete_user_account`)을 사용합니다.
- **관리자 설정의 "회원가입 허용", "점검 모드"는 현재 저장만 되고 실제로 적용되지 않습니다.** (알려진 이슈)

---

## 8. 회원·인증·개인정보

### 가입과 접근 조건
- 가입 경로: 이메일(`/signup`) 또는 구글·카카오 로그인 후 `/profile-setup`
- 휴대폰 SMS 인증 필수 → `confirm-phone`이 서버에서 인증 상태를 확정
- 필수 동의 3종(이용약관, 개인정보 수집·이용, 만 14세 이상) → `record_consent` RPC가 서버 시각·약관 버전으로 기록
- 만 14세 미만 차단: 화면(생년월일 범위·확인), DB 트리거, `record_consent` 세 곳에서 막음
- **라우트 가드**: 서비스 화면은 [닉네임·생년월일 + 휴대폰 인증 + 동의 기록]이 모두 있어야 접근 가능하고, 하나라도 없으면 `/profile-setup`으로 이동합니다(관리자 제외).
- **신뢰 기준**: `user_metadata`는 사용자가 수정할 수 있으므로 권한·인증 판단에 쓰면 안 됩니다. 인증 여부·전화번호·관리자 역할은 `app_metadata`만 믿습니다.

### 계정 관리
- 아이디 찾기: SMS 인증을 마친 뒤에만 이메일(마스킹)을 보여줌
- 비밀번호 찾기: 가입 여부와 관계없이 같은 안내를 보여줌
- 비밀번호 재설정 화면: 재설정 메일 링크로 들어온 경우(1시간 이내)에만 변경 가능
- 마이페이지 비밀번호 변경: 현재 비밀번호 확인 후 변경 (이메일 가입 계정만)
- 회원 탈퇴: 마이페이지 → 회원 탈퇴. **즉시 삭제, 복구 불가.** 탈퇴자가 방장인 비공개 하늘은 가장 먼저 들어온 멤버에게 방장이 넘어가고, 멤버가 없으면 삭제됩니다.

### 설문(비회원)
- 별 전송은 `submit_survey_star`만 가능: 이름 1~20자, 같은 기기에서 같은 대상에게 10분에 1회, 대상 1명당 전송량 상한
- 설문 링크의 "밤하늘 보기"는 `get_survey_night_sky`로 별 모양·위치만 반환 (설문 응답·설문자 이름은 대상 회원 본인만 볼 수 있음)

### 약관·개인정보처리방침
- 파일: `src/pages/TermsPage.jsx`, `src/pages/PrivacyPage.jsx`
- 개정할 때:
  1. 페이지 하단 부칙의 시행일 수정
  2. `src/utils/consent.js`의 `TERMS_VERSION` / `PRIVACY_VERSION` 수정
  3. 공지사항에 개정 내용 사전 고지
  - 현재 가드는 동의 **기록 유무**만 확인합니다. 개정 후 재동의가 필요하면 가드 로직을 바꿔야 합니다.
- 개인정보처리방침은 2026-09-11 개정 **초안**입니다. 게시 전 확인할 것: 시행일, 개인정보 보호책임자, 위탁·국외이전 업체의 법인명 표기, 결제대행사(포트원 전환 시 교체)
- 처리방침에 적힌 위탁·국외이전 업체(Supabase, Vercel, Solapi, OpenAI, Toss Payments, Google)가 바뀌면 처리방침도 함께 수정해야 합니다.

---

## 9. 결제

**현재 상태**
- Toss Payments **테스트 키**로 연결되어 있습니다. 실제 돈이 오가지 않지만, 테스트 결제창을 통과하면 **실제 별가루가 지급됩니다.**
  → **일반 사용자에게 공개하기 전에 별가루 충전을 반드시 막아야 합니다.**
- 공지사항에 게시된 "환불 및 청약철회 정책"(2026-07-12)의 "별(★) 재화"는 별가루를 뜻합니다.

**포트원(PortOne) 전환 때 함께 할 일**
- [ ] 통신판매업 신고 여부 확인, 사업자 전화번호·통신판매업 신고번호·호스팅 제공자를 푸터에 표시
- [ ] 환불 정책을 실제 상품(별가루 충전권, 별 아이템, 보관소 확장, AI 이름 바꾸기)에 맞게 수정하고 고정 페이지(`/refund`)로 이동
- [ ] 충전 전 청약철회 제한 고지 + 동의 체크 (없으면 사용분 환불 제한이 인정되지 않을 수 있음)
- [ ] 이용약관에 유료서비스 조항 추가
- [ ] 결제 승인·지급을 하나의 트랜잭션으로 처리, 중복 승인 방지, PG 웹훅으로 취소·환불 시 별가루 회수
- [ ] 부분 사용 환불(미사용 잔액 기준) 계산을 위한 충전 단위 추적
- [ ] 거래기록 5년 보존 (현재는 회원 탈퇴 시 결제기록도 함께 삭제됨)
- [ ] 개인정보처리방침의 결제대행사 표기 교체, Toss 테스트 키 제거

---

## 10. 배포 체크리스트

다음 프론트엔드 배포 때 순서대로 진행합니다.

- [ ] `fit` → `main` 병합 후 **Vercel에 연결된 저장소**에 반영
- [ ] Vercel 환경변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 확인
- [ ] 배포 후 주요 흐름 확인
  - 이메일 가입(휴대폰 인증·약관 동의·만 14세 확인), 구글·카카오 가입 후 프로필 설정
  - 기존 회원 첫 로그인 시 약관 동의 화면 → 동의 후 홈 이동
  - 설문 링크: 닉네임 표시, 별 전송, 재전송 제한 안내, 밤하늘 보기
  - 3D 밤하늘 닉네임 표시, 비공개 하늘 생성·입장
  - 아이디 찾기, 비밀번호 찾기·재설정, 마이페이지 비밀번호 변경
  - 회원 탈퇴(테스트 계정으로)
  - 관리자 화면(통계·회원·공지·상품), AI 별자리 이름, 오늘의 운세, 상점 별 구매
- [ ] 브라우저 콘솔에서 CSP(Report-Only) 위반 로그 확인 → 문제가 없으면 `vercel.json`의 헤더 이름을 `Content-Security-Policy`로 바꾸고 `frame-ancestors 'none'` 추가
- [ ] 설문 링크 미리보기(OG) 동작 확인
- [ ] 일반 공개 전 테스트 결제 충전 차단

---

## 11. 대시보드 설정 (코드 밖)

- [ ] Supabase·Vercel·GitHub 운영 계정 2단계 인증
- [ ] Supabase Authentication 설정
  - 비밀번호 최소 길이 8자 이상 (현재 화면 기준 6자), 유출 비밀번호 차단(가능한 경우)
  - Secure password change(비밀번호 변경 시 재인증) 켜기
  - Redirect URLs 허용 목록을 운영 도메인으로 한정 (와일드카드 금지)
  - Confirm email 설정 확인 (켜져 있으면 가입 직후 세션이 없어 휴대폰 인증 확정 흐름에 영향)
- [ ] service_role 키, OTP pepper 등 비밀값에 접근할 수 있는 사람을 최소화

---

## 12. 알려진 이슈·남은 작업

**보안·운영**
- SMS 발송 비용 방어 보강 (진행 예정)
- 관리자 설정 "회원가입 허용", "점검 모드" 미적용
- 운영 DB 기준 스키마 덤프 필요 ([6.4](#64-마이그레이션-현황과-주의))

**기능**
- 3D 밤하늘에 보관함 별까지 표시됨
- 통계 화면: 구매한 별이 집계에 섞이고, 응답이 없는 데이터가 있으면 화면이 깨질 수 있음
- 공유 링크 복사가 일부 인앱 브라우저에서 반응 없음
- 잘못된 별자리 데이터가 있으면 3D 밤하늘이 흰 화면이 될 수 있음 (렌더링 방어 코드 필요)
- 홈 편집 중 실시간 갱신·토큰 갱신으로 편집 내용이 사라질 수 있고, 저장 실패가 조용히 넘어감
- 가입 도중 실패하면 반쪽 계정이 남을 수 있음 (다음 로그인 시 프로필 설정으로 안내됨)
- 웰컴 페이지(`/welcome`)의 운세는 항상 기본 문구만 표시됨

**성능**
- 3D 밤하늘은 별자리가 많아지면(100~200개) 배치가 겹치고, 변경될 때마다 전체를 다시 불러옴
- JS 번들이 약 1.7MB 단일 파일 (페이지별 분할 필요)

**코드 정리**
- 린트 에러 다수(미사용 변수, 렌더 중 `Math.random` 등)
- 사용하지 않는 파일: `src/services/supabase.js`, `supabase/functions/_shared/`

---

## 13. 라우팅

| 경로 | 페이지 | 접근 |
|---|---|---|
| `/` | LoadingPage (로그인) | 공개 |
| `/signup` | SignupPage | 공개 |
| `/find-email`, `/find-password`, `/reset-password` | 아이디·비밀번호 찾기, 재설정 | 공개 |
| `/profile-setup` | ProfileSetupPage (휴대폰 인증·동의·프로필) | 로그인 |
| `/terms`, `/privacy` | 이용약관, 개인정보처리방침 | 공개 |
| `/notice`, `/notice/:id` | 공지사항 | 공개 |
| `/welcome` | 웰컴(마케팅) | 공개 |
| `/survey/:userId`, `/survey/:userId/questions` | 설문 시작·질문 | 공개 |
| `/home`, `/stars`, `/starry`, `/warehouse`, `/stat`, `/stat/detail`, `/user`, `/store`, `/sky` | 서비스 화면 | 로그인 + 프로필 완성 |
| `/admin` | AdminPage | 관리자 |
| `/sky-demo` | 3D 데모 | 개발 서버에서만 |

---

## 라이선스
Copyright ©2026. All rights reserved.

**개발자**: 김기찬
**디자이너**: 김태희

**문의**: kimkichan1225@gmail.com
