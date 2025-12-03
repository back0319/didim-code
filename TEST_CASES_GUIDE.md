# 입출력 예시 여러 개 추가하기 가이드

## 개요
이제 문제에 여러 개의 입출력 예시를 추가할 수 있습니다. `test_cases` 컬럼이 추가되어 JSON 형식으로 여러 테스트 케이스를 저장할 수 있습니다.

## 데이터베이스 구조

### test_cases 컬럼 형식
```json
[
  {
    "input": "입력값",
    "output": "출력값",
    "explanation": "설명 (선택사항)"
  },
  {
    "input": "입력값2",
    "output": "출력값2"
  }
]
```

## 테스트 케이스 추가 방법

### 1. SQL로 직접 추가
```sql
UPDATE problems 
SET test_cases = '[
  {
    "input": "5",
    "output": "5",
    "explanation": "5번째 피보나치 수는 5입니다."
  },
  {
    "input": "10",
    "output": "55",
    "explanation": "10번째 피보나치 수는 55입니다."
  },
  {
    "input": "17",
    "output": "1597"
  }
]'::jsonb
WHERE id = 1;
```

### 2. Docker를 통한 실행
PowerShell에서:
```powershell
# SQL 파일 작성 후
Get-Content your_sql_file.sql | docker exec -i my-app-db psql -U postgres -d postgres
```

### 3. 여러 줄 입력/출력 예시
```sql
UPDATE problems 
SET test_cases = '[
  {
    "input": "3\n1 2 3",
    "output": "6",
    "explanation": "1 + 2 + 3 = 6"
  },
  {
    "input": "5\n10 20 30 40 50",
    "output": "150"
  }
]'::jsonb
WHERE id = 2;
```

## 예제: 피보나치 문제

이미 피보나치 문제에는 5개의 테스트 케이스가 추가되어 있습니다:
- n=0 → 0
- n=1 → 1
- n=5 → 5
- n=10 → 55
- n=17 → 1597

## UI에서 표시되는 방식

1. **test_cases가 있을 때** (우선순위 1)
   - JSON 배열의 각 항목을 "예시 1", "예시 2"로 표시
   - input/output을 좌우로 나란히 배치
   - explanation이 있으면 파란색 박스에 설명 표시

2. **input_examples/output_examples가 있을 때** (우선순위 2)
   - 이전 방식과 동일하게 표시

3. **input/output이 있을 때** (우선순위 3, 레거시)
   - 단일 예시로 표시

4. **아무것도 없을 때**
   - "입출력 예시가 준비되지 않았습니다." 메시지 표시

## 주의사항

- JSON 형식이 올바른지 확인하세요
- 특수문자는 이스케이프 처리해야 합니다: `\"`, `\n`, `\\`
- PostgreSQL에서는 `'...'::jsonb`로 타입 캐스팅이 필요합니다
- 빈 배열도 가능: `'[]'::jsonb`

## 자주 사용하는 SQL 템플릿

### 단일 문제 업데이트
```sql
UPDATE problems 
SET test_cases = '[
  {"input": "입력1", "output": "출력1"},
  {"input": "입력2", "output": "출력2"}
]'::jsonb
WHERE id = 문제번호;
```

### 여러 문제 일괄 업데이트
```sql
-- ID 1-5번 문제에 동일한 테스트 케이스 추가
UPDATE problems 
SET test_cases = '[{"input": "테스트", "output": "결과"}]'::jsonb
WHERE id IN (1, 2, 3, 4, 5);
```

### 기존 test_cases에 추가
```sql
UPDATE problems 
SET test_cases = test_cases || '[{"input": "새 입력", "output": "새 출력"}]'::jsonb
WHERE id = 1;
```

## 확인 방법

### 1. 데이터베이스에서 확인
```sql
SELECT id, title, test_cases FROM problems WHERE id = 1;
```

### 2. 브라우저에서 확인
- http://localhost:3000/problems/1 접속
- "입출력 예시" 섹션에서 여러 예시가 표시되는지 확인
