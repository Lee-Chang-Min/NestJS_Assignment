
/**
 * 사용 X
 */
export function validatePhoneNumber(input: string): string | null {

    // 1012345678 => 01012345678 ✅
    // 010-1855-6059 => 01018556059 ✅
    // 1012345678 => 01012345678 ✅
    // asdf3jkhd => 01012345678 ❌
  
    // 위와 같은 정책이 추가 된다면 추가 vaildation 로직을 세워야 할수도 있음음
  
    if (!input) return null;
    const numbers = input.replace(/\D/g, '');
    if (numbers.length === 11 && numbers.startsWith('010')) {
      return numbers;
    }
    if (numbers.length === 10 && numbers.startsWith('10')) {
      // 앞에 '0'이 생략된 경우
      return '0' + numbers;
    }
    if (numbers.length === 8) {
      // 8자리 번호인 경우 (구형 지역번호 생략), 010 붙이기
      return '010' + numbers;
    }
    return null; // 유효하지 않은 경우
  }