import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { getProblems } from '../lib/catalog';

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
  loadError: string | null;
}

export default function ProblemsPage({ problems, loadError }: ProblemsPageProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProblems = problems.filter(problem => {
    return problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
          {loadError && (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center text-red-700">
              {loadError}
            </div>
          )}
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
                    className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {problem.solved ? '다시 풀기' : '문제 풀기'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {!loadError && filteredProblems.length === 0 && (
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

export const getServerSideProps: GetServerSideProps<ProblemsPageProps> = async ({ res }) => {
  try {
    const problems = (await getProblems()).map((problem) => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      category: problem.category,
      solved: false,
      acceptance_rate: 0,
    }));

    return {
      props: { problems, loadError: null },
    };
  } catch (error) {
    console.error('Problem list load error:', error instanceof Error ? error.message : String(error));
    res.statusCode = 503;
    return {
      props: {
        problems: [],
        loadError: '문제 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
      },
    };
  }
};
