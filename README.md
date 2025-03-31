
## 프로젝트 소개

## 요구 사항

1. Excel 파일 업로드를 통한 환자 등록 API


2. 환자 목록 조회 API


## 설치 및 실행 방법 🚀

1. 데이터베이스 생성 💾 
   *(아래 설정으로 데이터베이스를 생성해주세요)*

   ```sql
   type: 'mysql',
   host: 'localhost',
   port: 3306,
   username: 'root',
   password: 'lcm1234',
   database: 'motionlabs'
   ```
2. 프로젝트 설치

```bash
npm install
```



## 이슈사항
- NestJS Core 버전을 9.2를 사용하려 했으나, 과제에 명시된 TypeORM ^0.3.10을 사용하기 위해 NestJS를 10.0.0으로 업그레이드하였습니다.


## Git 컨벤션
#### 커밋 Type
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등 (코드 변경 없음)
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가 또는 수정
- `chore`: 빌드 프로세스, 패키지 매니저 설정 등 (소스 코드 변경 없음)