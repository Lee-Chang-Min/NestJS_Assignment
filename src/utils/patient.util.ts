/**
 * 주민등록번호를 표준 형식(생년월일-성별식별값)으로 정규화
 * 다양한 입력 형식을 처리합니다:
 * - 6자: 생년월일 (ex: 900101) -> 900101-0
 * - 7자: 생년월일 및 성별 식별값 (ex: 9001011) -> 900101-1
 * - 8자: 생년월일 및 성별 식별값 (ex: 900101-1) -> 900101-1
 * - 9자 이상: 생년월일 및 성별 식별값 (ex: 900101-1111111) -> 900101-1
 * - 마스킹 포함된 경우 (ex: 900101-1******) -> 900101-1
 * 
 * @param rrn 정규화할 주민등록번호 문자열
 * @returns 정규화된 주민등록번호 (생년월일-성별식별값 형식)
 */
export function normalizeRRN(input: string): string {
    if (!input) return '';

    if (/^\d{6}-\d$/.test(input)) {
        return input;
    }
  
    // 숫자와 *만 추출
    const sanitized = input.replace(/[^\d*]/g, '');
  
    // 6자리만 입력된 경우 → 성별 정보 없음
    if (/^\d{6}$/.test(sanitized)) {
      return `${sanitized}-0`;
    }
  
    // 7자리 (ex: 9001011) → 하이픈 추가
    if (/^\d{7}$/.test(sanitized)) {
      return `${sanitized.slice(0, 6)}-${sanitized[6]}`;
    }
  
    // 13자리 or 마스킹 포함된 경우 (ex: 9001011******)
    if (/^\d{7}[\d*]{6}$/.test(sanitized)) {
      return `${sanitized.slice(0, 6)}-${sanitized[6]}`;
    }
  
    // 하이픈 포함된 포맷 처리 (ex: 900101-1, 900101-3234567, 900101-1******)
    const match = input.match(/^(\d{6})-(\d)/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
  
    return input;
  }
