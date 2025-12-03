-- 모든 문제에 테스트 케이스 추가하기

-- 1. Two Sum
UPDATE problems 
SET test_cases = '[
  {
    "input": "4\n2 7 11 15\n9",
    "output": "[0, 1]",
    "explanation": "nums[0] + nums[1] = 2 + 7 = 9이므로 [0, 1]을 반환합니다."
  },
  {
    "input": "3\n3 2 4\n6",
    "output": "[1, 2]",
    "explanation": "nums[1] + nums[2] = 2 + 4 = 6이므로 [1, 2]를 반환합니다."
  },
  {
    "input": "2\n3 3\n6",
    "output": "[0, 1]",
    "explanation": "nums[0] + nums[1] = 3 + 3 = 6이므로 [0, 1]을 반환합니다."
  }
]'::jsonb
WHERE id = 1;

-- 2. Valid Parentheses
UPDATE problems 
SET test_cases = '[
  {
    "input": "()",
    "output": "true",
    "explanation": "괄호가 올바르게 열리고 닫혔습니다."
  },
  {
    "input": "()[]{}",
    "output": "true",
    "explanation": "모든 종류의 괄호가 올바르게 사용되었습니다."
  },
  {
    "input": "(]",
    "output": "false",
    "explanation": "여는 괄호와 닫는 괄호의 종류가 맞지 않습니다."
  },
  {
    "input": "([)]",
    "output": "false",
    "explanation": "괄호의 순서가 올바르지 않습니다."
  },
  {
    "input": "{[]}",
    "output": "true",
    "explanation": "중첩된 괄호가 올바르게 사용되었습니다."
  }
]'::jsonb
WHERE id = 2;

-- 3. Maximum Subarray
UPDATE problems 
SET test_cases = '[
  {
    "input": "9\n-2 1 -3 4 -1 2 1 -5 4",
    "output": "6",
    "explanation": "[4,-1,2,1]의 합이 6으로 최대입니다."
  },
  {
    "input": "1\n1",
    "output": "1",
    "explanation": "원소가 하나일 때는 그 값이 최대합입니다."
  },
  {
    "input": "4\n5 4 -1 7",
    "output": "15",
    "explanation": "전체 배열의 합이 15로 최대입니다."
  },
  {
    "input": "5\n-1 -2 -3 -4 -5",
    "output": "-1",
    "explanation": "모두 음수일 때는 가장 큰 값이 최대합입니다."
  }
]'::jsonb
WHERE id = 3;

-- 4. Best Time to Buy and Sell Stock
UPDATE problems 
SET test_cases = '[
  {
    "input": "6\n7 1 5 3 6 4",
    "output": "5",
    "explanation": "2일차에 사서(1) 5일차에 팔면(6) 이익은 5입니다."
  },
  {
    "input": "5\n7 6 4 3 1",
    "output": "0",
    "explanation": "가격이 계속 하락하므로 이익을 낼 수 없습니다."
  },
  {
    "input": "4\n1 2 3 4",
    "output": "3",
    "explanation": "1일차에 사서(1) 4일차에 팔면(4) 이익은 3입니다."
  }
]'::jsonb
WHERE id = 4;

-- 5. Binary Tree Inorder Traversal
UPDATE problems 
SET test_cases = '[
  {
    "input": "[1,null,2,3]",
    "output": "[1,3,2]",
    "explanation": "중위 순회: 왼쪽(1) → 루트(3) → 오른쪽(2)"
  },
  {
    "input": "[]",
    "output": "[]",
    "explanation": "빈 트리의 중위 순회는 빈 배열입니다."
  },
  {
    "input": "[1]",
    "output": "[1]",
    "explanation": "노드가 하나인 트리의 중위 순회는 그 노드입니다."
  },
  {
    "input": "[1,2,3,4,5]",
    "output": "[4,2,5,1,3]",
    "explanation": "완전 이진 트리의 중위 순회입니다."
  }
]'::jsonb
WHERE id = 5;

-- 6. Fibonacci Number (이미 추가되어 있음, 확인용)
UPDATE problems 
SET test_cases = '[
  {
    "input": "0",
    "output": "0",
    "explanation": "F(0) = 0"
  },
  {
    "input": "1",
    "output": "1",
    "explanation": "F(1) = 1"
  },
  {
    "input": "2",
    "output": "1",
    "explanation": "F(2) = F(1) + F(0) = 1 + 0 = 1"
  },
  {
    "input": "5",
    "output": "5",
    "explanation": "F(5) = 5"
  },
  {
    "input": "10",
    "output": "55",
    "explanation": "F(10) = 55"
  },
  {
    "input": "17",
    "output": "1597",
    "explanation": "F(17) = 1597"
  }
]'::jsonb
WHERE id = 6;

-- 7. Longest Palindromic Substring
UPDATE problems 
SET test_cases = '[
  {
    "input": "babad",
    "output": "bab",
    "explanation": "\"bab\" 또는 \"aba\" 모두 정답입니다."
  },
  {
    "input": "cbbd",
    "output": "bb",
    "explanation": "가장 긴 회문은 \"bb\"입니다."
  },
  {
    "input": "a",
    "output": "a",
    "explanation": "문자 하나도 회문입니다."
  },
  {
    "input": "ac",
    "output": "a",
    "explanation": "회문이 없으면 첫 문자를 반환합니다."
  },
  {
    "input": "racecar",
    "output": "racecar",
    "explanation": "전체 문자열이 회문입니다."
  }
]'::jsonb
WHERE id = 7;

-- 8. Merge Two Sorted Lists
UPDATE problems 
SET test_cases = '[
  {
    "input": "3\n1 2 4\n3\n1 3 4",
    "output": "[1,1,2,3,4,4]",
    "explanation": "두 리스트를 병합하면 [1,1,2,3,4,4]입니다."
  },
  {
    "input": "0\n\n0\n",
    "output": "[]",
    "explanation": "두 리스트가 모두 비어있으면 빈 리스트를 반환합니다."
  },
  {
    "input": "0\n\n1\n0",
    "output": "[0]",
    "explanation": "한 리스트가 비어있으면 다른 리스트를 반환합니다."
  },
  {
    "input": "3\n1 3 5\n3\n2 4 6",
    "output": "[1,2,3,4,5,6]",
    "explanation": "교대로 섞인 정렬된 리스트가 생성됩니다."
  }
]'::jsonb
WHERE id = 8;
