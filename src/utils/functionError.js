// supabase.functions.invoke 결과에서 서버가 보낸 오류 코드(body.error)를 꺼낸다.
// 응답이 2xx가 아니면 data는 비어 있고 본문은 error.context(Response)에 담겨 있다.
export async function getFunctionErrorCode(data, error) {
  if (data?.error) return data.error;
  try {
    const body = await error?.context?.json();
    return body?.error ?? null;
  } catch {
    return null;
  }
}
