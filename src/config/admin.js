// 관리자 여부 체크 함수
// 서버에서만 설정할 수 있는 app_metadata.role 기준으로 판정한다. (DB 정책·함수의 public.is_admin()과 같은 기준)
// 관리자 지정: auth.users.raw_app_meta_data에 "role": "admin" 추가 후 해당 계정 재로그인
export const isAdminUser = (user) => user?.app_metadata?.role === 'admin';
