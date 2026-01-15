// 관리자 이메일 목록
// 이 목록에 있는 이메일로 로그인하면 관리자 페이지로 이동합니다.
export const ADMIN_EMAILS = [
  'admin@admin.com',
  // 필요시 추가 관리자 이메일을 여기에 추가
];

// 관리자 여부 체크 함수
export const isAdminEmail = (email) => {
  return ADMIN_EMAILS.includes(email);
};
