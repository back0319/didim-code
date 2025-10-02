import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Layout from '../components/Layout';

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  solved: boolean;
  acceptance_rate: number;
}

interface ProblemsPageProps {
  problems: Problem[];
}

export default function ProblemsPage({ problems }: ProblemsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedDifficulty, setSelectedDifficulty] = useState('전체');

  const categories = ['전체', 'Array', 'String', 'Dynamic Programming', 'Graph', 'Tree', 'Sorting'];

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || problem.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === '전체' || problem.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              문제 목록
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              다양한 알고리즘 문제를 풀어보고 실력을 향상시켜보세요
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="문제 제목이나 설명으로 검색하세요..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">난이도</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="전체">전체</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div>
                {filteredProblems.length}개의 문제가 검색되었습니다
              </div>
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-1"></div>
                  Easy: {problems.filter(p => p.difficulty === 'Easy').length}
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
                  Medium: {problems.filter(p => p.difficulty === 'Medium').length}
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-1"></div>
                  Hard: {problems.filter(p => p.difficulty === 'Hard').length}
                </span>
              </div>
            </div>
          </div>

          {/* Problems Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProblems.map((problem) => (
              <div key={problem.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className="p-6">
                  {/* Problem Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {problem.id}. {problem.title}
                      </h3>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </div>
                    </div>
                    {problem.solved && (
                      <div className="ml-2 flex-shrink-0">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Problem Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {problem.description}
                  </p>

                  {/* Problem Metadata */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {problem.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      정답률: {problem.acceptance_rate}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>정답률</span>
                      <span>{problem.acceptance_rate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${problem.acceptance_rate}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    {problem.solved ? '다시 풀기' : '문제 풀기'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredProblems.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-600">다른 검색어나 필터를 시도해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  // 샘플 데이터 - 실제로는 API에서 가져옴
  const problems: Problem[] = [
    {
      id: 1,
      title: "Two Sum",
      description: "정수 배열에서 두 수의 합이 target과 같은 인덱스를 찾는 문제입니다.",
      difficulty: 'Easy',
      category: 'Array',
      solved: true,
      acceptance_rate: 85
    },
    {
      id: 2,
      title: "Longest Substring Without Repeating Characters",
      description: "반복되지 않는 가장 긴 부분 문자열의 길이를 구하는 문제입니다.",
      difficulty: 'Medium',
      category: 'String',
      solved: false,
      acceptance_rate: 62
    },
    {
      id: 3,
      title: "Median of Two Sorted Arrays",
      description: "정렬된 두 배열의 중앙값을 O(log(m+n)) 시간에 구하는 문제입니다.",
      difficulty: 'Hard',
      category: 'Array',
      solved: false,
      acceptance_rate: 35
    },
    {
      id: 4,
      title: "Valid Parentheses",
      description: "괄호가 올바르게 닫혀있는지 확인하는 문제입니다.",
      difficulty: 'Easy',
      category: 'String',
      solved: true,
      acceptance_rate: 78
    },
    {
      id: 5,
      title: "Binary Tree Inorder Traversal",
      description: "이진 트리의 중위 순회를 구현하는 문제입니다.",
      difficulty: 'Medium',
      category: 'Tree',
      solved: false,
      acceptance_rate: 71
    },
    {
      id: 6,
      title: "Maximum Subarray",
      description: "연속된 부분 배열의 최대 합을 구하는 문제입니다.",
      difficulty: 'Easy',
      category: 'Dynamic Programming',
      solved: true,
      acceptance_rate: 52
    }
  ];

  return {
    props: {
      problems
    }
  };
};