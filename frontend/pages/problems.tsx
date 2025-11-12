import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
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
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedDifficulty, setSelectedDifficulty] = useState('전체');

  // 실제 문제들에서 카테고리 목록을 동적으로 생성
  const categories = ['전체', ...Array.from(new Set(problems.map(p => p.category).filter(Boolean)))];

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

                  {/* Action Button */}
                  <button 
                    onClick={() => router.push(`/problems/${problem.id}`)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
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
  try {
    // Docker 컨테이너의 API에서 데이터 가져오기 (3000번 포트)
    const response = await fetch('http://localhost:3000/api/problems');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch problems: ${response.status}`);
    }
    
    const problems: Problem[] = await response.json();
    console.log('Fetched problems from Docker:', problems.length);

    return {
      props: {
        problems
      }
    };
  } catch (error) {
    console.error('Error fetching problems from Docker:', error);
    
    // 에러 발생 시 빈 배열 반환
    return {
      props: {
        problems: []
      }
    };
  }
};