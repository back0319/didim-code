# 피보나치 수 - 4가지 풀이 방법

## 1. Naive (단순 재귀) - O(2^n)
"""
가장 직관적이지만 비효율적인 방법
중복 계산이 많아 시간 복잡도가 지수적으로 증가
"""

def fibonacci_naive(n):
    if n == 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci_naive(n - 1) + fibonacci_naive(n - 2)

# 테스트
n = int(input())
print(fibonacci_naive(n))

# 장점: 이해하기 쉬움, 수학적 정의와 일치
# 단점: 매우 느림 (n > 30이면 오래 걸림), 중복 계산 많음
# 시간 복잡도: O(2^n)
# 공간 복잡도: O(n) - 재귀 호출 스택


## 2. Brute Force (반복문) - O(n)
"""
반복문을 사용하여 처음부터 n번째까지 계산
이전 두 값만 저장하여 효율적
"""

def fibonacci_brute_force(n):
    if n == 0:
        return 0
    elif n == 1:
        return 1
    
    fib_prev2 = 0  # F(n-2)
    fib_prev1 = 1  # F(n-1)
    
    for i in range(2, n + 1):
        fib_current = fib_prev1 + fib_prev2
        fib_prev2 = fib_prev1
        fib_prev1 = fib_current
    
    return fib_current

# 테스트
n = int(input())
print(fibonacci_brute_force(n))

# 장점: 간단하고 효율적, 추가 메모리 거의 없음
# 단점: 최적화 기법을 사용하지 않음
# 시간 복잡도: O(n)
# 공간 복잡도: O(1)


## 3. Optimized (동적 프로그래밍 - 메모이제이션) - O(n)
"""
재귀 + 메모이제이션으로 중복 계산 제거
이미 계산한 값을 저장하여 재사용
"""

def fibonacci_optimized(n, memo={}):
    if n in memo:
        return memo[n]
    
    if n == 0:
        return 0
    elif n == 1:
        return 1
    
    memo[n] = fibonacci_optimized(n - 1, memo) + fibonacci_optimized(n - 2, memo)
    return memo[n]

# 테스트
n = int(input())
print(fibonacci_optimized(n))

# 장점: 재귀의 직관성 + 효율성, 각 값을 한 번만 계산
# 단점: 메모리 사용량이 O(n)
# 시간 복잡도: O(n)
# 공간 복잡도: O(n) - memo 딕셔너리 + 재귀 스택


## 4. Optimal (동적 프로그래밍 - 타뷸레이션) - O(n)
"""
Bottom-up 방식으로 작은 문제부터 해결
배열에 모든 값을 저장
"""

def fibonacci_optimal(n):
    if n == 0:
        return 0
    elif n == 1:
        return 1
    
    # DP 테이블 생성
    dp = [0] * (n + 1)
    dp[0] = 0
    dp[1] = 1
    
    # Bottom-up 방식으로 계산
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    
    return dp[n]

# 테스트
n = int(input())
print(fibonacci_optimal(n))

# 장점: 반복문 사용으로 재귀 오버헤드 없음, 모든 값 저장
# 단점: 메모리 O(n) 사용 (공간 최적화 가능)
# 시간 복잡도: O(n)
# 공간 복잡도: O(n)


## 공간 최적화 버전 (Optimal + Space Optimization) - O(1) 공간
"""
사실상 Brute Force와 동일하지만 DP 개념을 명시적으로 사용
"""

def fibonacci_optimal_space(n):
    if n == 0:
        return 0
    elif n == 1:
        return 1
    
    prev2, prev1 = 0, 1
    
    for i in range(2, n + 1):
        current = prev1 + prev2
        prev2, prev1 = prev1, current
    
    return prev1

# 테스트
n = int(input())
print(fibonacci_optimal_space(n))

# 장점: 시간 O(n), 공간 O(1)으로 가장 효율적
# 단점: 중간 값들을 저장하지 않음
# 시간 복잡도: O(n)
# 공간 복잡도: O(1)


## 비교 요약

"""
방법                     시간 복잡도    공간 복잡도    특징
=====================================================================
1. Naive (재귀)         O(2^n)        O(n)          직관적, 매우 느림
2. Brute Force (반복)   O(n)          O(1)          간단하고 효율적
3. Optimized (메모)     O(n)          O(n)          재귀 + 메모이제이션
4. Optimal (DP)         O(n)          O(n)          Bottom-up DP
5. Optimal (공간최적)   O(n)          O(1)          최고 효율

추천 풀이:
- 학습 목적: Naive → Optimized (DP 개념 이해)
- 실전 코테: Brute Force 또는 Optimal (공간최적)
- n이 작을 때 (<20): 모두 사용 가능
- n이 클 때 (>30): Naive 제외 모두 사용 가능
"""
